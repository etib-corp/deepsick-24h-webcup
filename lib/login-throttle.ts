import "server-only";

import { prisma } from "@/lib/prisma";

/* ------------------------------------------------------------------ *
 * Login throttling — protects citizen accounts against brute force.
 *
 * Policy (env-overridable):
 *  - Per IP (primary, hard lock): N failures within a window → block the IP.
 *  - Per account key (short backoff, never a hard lock): a short cooldown so
 *    an attacker cannot lock a victim out of their own account. The key is the
 *    normalised email **or** colon identifier (see `lib/identity.ts`).
 *  - A successful login clears that key's failure history.
 * ------------------------------------------------------------------ */

function envInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

export const LOGIN_THROTTLE = {
  ipMaxFailures: envInt(process.env.LOGIN_MAX_IP_FAILURES, 20),
  ipWindowSeconds: envInt(process.env.LOGIN_IP_WINDOW_SECONDS, 15 * 60),
  emailMaxFailures: envInt(process.env.LOGIN_MAX_EMAIL_FAILURES, 5),
  emailWindowSeconds: envInt(process.env.LOGIN_EMAIL_WINDOW_SECONDS, 15 * 60),
  emailCooldownSeconds: envInt(process.env.LOGIN_EMAIL_COOLDOWN_SECONDS, 30),
} as const;

export type ThrottleReason = "ip" | "email";

export type ThrottleStatus = {
  locked: boolean;
  retryAfterSeconds: number;
  reason: ThrottleReason | null;
};

type HeadersLike =
  | { get(name: string): string | null }
  | Record<string, string | string[] | undefined>
  | undefined
  | null;

/** Best-effort client IP from the proxy headers (Hodifly/Passenger set these). */
export function getClientIp(headers: HeadersLike): string {
  const read = (name: string): string | undefined => {
    if (!headers) return undefined;
    if (typeof (headers as { get?: unknown }).get === "function") {
      return (headers as { get(name: string): string | null }).get(name) ?? undefined;
    }
    const value = (headers as Record<string, string | string[] | undefined>)[name];
    return Array.isArray(value) ? value[0] : value;
  };

  const forwarded = read("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  const real = read("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}

const ipIdentifier = (ip: string) => `ip:${ip}`;

function windowStart(seconds: number): Date {
  return new Date(Date.now() - seconds * 1000);
}

async function failureCount(identifier: string, since: Date): Promise<number> {
  return prisma.loginAttempt.count({
    where: { identifier, success: false, createdAt: { gte: since } },
  });
}

/**
 * Returns whether this account key/IP pair is currently throttled, and for how
 * long. Safe to expose: the response shape is identical for existing and unknown
 * accounts (it never reads the User table).
 */
export async function getThrottleStatus(identifier: string, ip: string): Promise<ThrottleStatus> {
  const ipId = ipIdentifier(ip);
  const ipSince = windowStart(LOGIN_THROTTLE.ipWindowSeconds);
  const ipFailures = await failureCount(ipId, ipSince);

  if (ipFailures >= LOGIN_THROTTLE.ipMaxFailures) {
    const oldest = await prisma.loginAttempt.findFirst({
      where: { identifier: ipId, success: false, createdAt: { gte: ipSince } },
      orderBy: { createdAt: "asc" },
    });
    const retry = oldest
      ? Math.max(
          1,
          Math.ceil((oldest.createdAt.getTime() + LOGIN_THROTTLE.ipWindowSeconds * 1000 - Date.now()) / 1000),
        )
      : LOGIN_THROTTLE.ipWindowSeconds;
    return { locked: true, retryAfterSeconds: retry, reason: "ip" };
  }

  const accountSince = windowStart(LOGIN_THROTTLE.emailWindowSeconds);
  const accountFailures = await failureCount(identifier, accountSince);
  if (accountFailures >= LOGIN_THROTTLE.emailMaxFailures) {
    const last = await prisma.loginAttempt.findFirst({
      where: { identifier, success: false },
      orderBy: { createdAt: "desc" },
    });
    const elapsedMs = last ? Date.now() - last.createdAt.getTime() : Infinity;
    const cooldownMs = LOGIN_THROTTLE.emailCooldownSeconds * 1000;
    if (elapsedMs < cooldownMs) {
      return {
        locked: true,
        retryAfterSeconds: Math.max(1, Math.ceil((cooldownMs - elapsedMs) / 1000)),
        reason: "email",
      };
    }
  }

  return { locked: false, retryAfterSeconds: 0, reason: null };
}

/** Records a failed attempt for both the account key and the IP, then prunes old rows. */
export async function recordLoginFailure(identifier: string, ip: string): Promise<void> {
  await prisma.loginAttempt.createMany({
    data: [
      { identifier, success: false },
      { identifier: ipIdentifier(ip), success: false },
    ],
  });
  await pruneOldAttempts();
}

/** Clears the account key's failure history so legitimate users are never punished. */
export async function recordLoginSuccess(identifier: string): Promise<void> {
  await prisma.loginAttempt.deleteMany({ where: { identifier, success: false } });
}

/** Deletes attempts older than a day (well beyond every configured window). */
async function pruneOldAttempts(): Promise<void> {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  await prisma.loginAttempt.deleteMany({ where: { createdAt: { lt: cutoff } } });
}
