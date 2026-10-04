import { createHmac, randomInt, timingSafeEqual } from "node:crypto";

/**
 * D02 / F53 — one-time access codes.
 *
 * Passwordless sign-in (D02) and the second step of a two-step login (F53)
 * both rely on a short numeric code. Only the HMAC of a code is stored, a code
 * is single-use, it expires after five minutes and it dies after a few wrong
 * attempts. This module holds the pure, unit-tested building blocks; the
 * database flows live in `lib/access-codes.ts`.
 */

export const ACCESS_CODE_TTL_MS = 5 * 60 * 1000;
export const ACCESS_CODE_MAX_ATTEMPTS = 5;
/** Codes one account may request per window, per purpose. */
export const ACCESS_CODE_MAX_REQUESTS = 3;
export const ACCESS_CODE_REQUEST_WINDOW_MS = 10 * 60 * 1000;

export type AccessCodePurpose = "LOGIN" | "TWO_STEP";

export function isAccessCodePurpose(value: unknown): value is AccessCodePurpose {
  return value === "LOGIN" || value === "TWO_STEP";
}

/** Six digits, uniformly random (never Math.random). */
export function generateAccessCode(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

/** Secret used to HMAC codes at rest; reuses the form-guard secret. */
export function accessCodeSecret(): string {
  return (
    process.env.BOT_GUARD_SECRET ??
    process.env.NEXTAUTH_SECRET ??
    "nt-access-code-dev-secret"
  );
}

export function hashAccessCode(code: string, secret: string): string {
  return createHmac("sha256", secret).update(code).digest("hex");
}

/** Constant-time comparison between a submitted code and a stored hash. */
export function accessCodeMatches(code: string, storedHash: string, secret: string): boolean {
  const expected = Buffer.from(hashAccessCode(code, secret), "hex");
  const actual = Buffer.from(storedHash, "hex");
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function accessCodeExpired(expiresAt: Date, now: Date = new Date()): boolean {
  return expiresAt.getTime() <= now.getTime();
}

/** A code row is usable while it is unconsumed, fresh and under the attempts cap. */
export function accessCodeUsable(
  row: { consumedAt: Date | null; expiresAt: Date; attempts: number },
  now: Date = new Date(),
): boolean {
  return (
    row.consumedAt === null &&
    !accessCodeExpired(row.expiresAt, now) &&
    row.attempts < ACCESS_CODE_MAX_ATTEMPTS
  );
}

/**
 * Whether the UI may display a generated code as a simulated "secure
 * transmission". Nova Terra has no external e-mail: like every other simulated
 * channel in the platform the code is shown to the person who requested it.
 * A hardened deployment sets `SIMULATED_TRANSMISSIONS=off` and the code then
 * only exists in its hashed form.
 */
export function isTransmissionSimulation(): boolean {
  return process.env.SIMULATED_TRANSMISSIONS !== "off";
}
