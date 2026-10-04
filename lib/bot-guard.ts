import "server-only";

import { headers } from "next/headers";

import { BOT_TOKEN_FIELD, BOT_TRAP_FIELD } from "@/lib/bot-fields";
import {
  getBotGuardSecret,
  isHoneypotFilled,
  readFormToken,
  type FormKind,
} from "@/lib/bot-signals";
import { format } from "@/lib/i18n/format";
import type { Dictionary } from "@/lib/i18n/types";
import { getClientIp } from "@/lib/login-throttle";
import { prisma } from "@/lib/prisma";
import { recordSecurityEvent } from "@/lib/security";

/**
 * F81 — server-side enforcement of the invisible bot signals.
 *
 * Every public form submission is inspected before any work happens:
 *  1. the honeypot must be empty (bots autofill every field);
 *  2. the signed challenge must be valid for this form, old enough that a
 *     human could have filled the form, and not expired;
 *  3. the challenge nonce must never have been seen before (replay defence);
 *  4. the client IP must stay under the form's rate limit.
 *
 * A refused submission is written to the append-only ledger (nonce, status
 * BLOCKED) and to the SecurityEvent audit trail; because the nonce is now
 * known, replaying that exact payload stays blocked. Accepted submissions
 * consume their nonce too, so a scraped challenge cannot be reused to spam.
 * The only user-visible cost for a legitimate visitor is a subtle notice —
 * no puzzle, no CAPTCHA, no extra step.
 */

export type FormGuardBlockReason = "trap" | "token" | "tooFast" | "expired" | "replay" | "rate";

export type FormGuardVerdict =
  | { ok: true; nonce: string; ip: string | null }
  | { ok: false; reason: FormGuardBlockReason; retryAfterSeconds: number };

export type FormGuardBlocked = Extract<FormGuardVerdict, { ok: false }>;

type RateLimit = { max: number; windowSeconds: number };

function envInt(name: string, fallback: number): number {
  const parsed = Number(process.env[name]);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

/** Per-public-form submission ceilings, overridable per environment. */
const FORM_LIMITS: Record<FormKind, RateLimit | null> = {
  contact: {
    max: envInt("BOT_GUARD_CONTACT_MAX", 8),
    windowSeconds: envInt("BOT_GUARD_CONTACT_WINDOW_SECONDS", 10 * 60),
  },
  register: {
    max: envInt("BOT_GUARD_REGISTER_MAX", 10),
    windowSeconds: envInt("BOT_GUARD_REGISTER_WINDOW_SECONDS", 60 * 60),
  },
  // Sign-in attempts remain governed by the F37 login throttle; the challenge
  // and honeypot signals still apply.
  login: null,
};

/** Ledger rows are pruned once the challenge TTL cannot match them anyway. */
const PRUNE_AFTER_MS = 24 * 60 * 60 * 1000;

function normalizeIp(ip: string | null | undefined): string | null {
  const value = ip?.trim();
  return value && value !== "unknown" ? value.slice(0, 64) : null;
}

function requestIp(explicit?: string | null): string | null {
  if (explicit !== undefined) return normalizeIp(explicit);
  try {
    return normalizeIp(getClientIp(headers()));
  } catch {
    return null; // outside a request scope (scripts, tests)
  }
}

/** Reads the hidden inputs out of a submitted form. */
export function readBotFields(formData: FormData): { token: string; trap: string } {
  return {
    token: String(formData.get(BOT_TOKEN_FIELD) ?? ""),
    trap: String(formData.get(BOT_TRAP_FIELD) ?? ""),
  };
}

/** Bounded token length: a huge payload is refused by the parser anyway. */
function boundToken(token: unknown): unknown {
  return typeof token === "string" ? token.slice(0, 512) : token;
}

/**
 * Inspects one submission without consuming its nonce. Callers that accept the
 * submission must then `consumeFormToken` before writing anything.
 */
export async function inspectFormSubmission(input: {
  form: FormKind;
  token: unknown;
  trap: unknown;
  ip?: string | null;
  now?: number;
}): Promise<FormGuardVerdict> {
  const now = input.now ?? Date.now();
  const ip = requestIp(input.ip);
  const parsed = readFormToken(boundToken(input.token), input.form, {
    secret: getBotGuardSecret(),
    now,
  });
  // A challenge that parsed OK — or that was only refused for its age — has a
  // known nonce, which gets burned so a blocked replay stays blocked.
  const signed = parsed.ok ? parsed.token : parsed.reason === "token" ? null : parsed.token;
  const nonce = signed?.nonce ?? null;

  let reason: FormGuardBlockReason | null = null;
  let retryAfterSeconds = 0;

  if (isHoneypotFilled(input.trap)) {
    reason = "trap";
  } else if (!parsed.ok) {
    reason = parsed.reason;
  } else {
    const known = await prisma.botGuardToken.findUnique({
      where: { nonce: parsed.token.nonce },
      select: { nonce: true },
    });
    if (known) {
      reason = "replay";
    } else {
      const limit = FORM_LIMITS[input.form];
      if (limit && ip) {
        const since = new Date(now - limit.windowSeconds * 1000);
        const count = await prisma.botGuardToken.count({
          where: { ip, form: input.form, createdAt: { gte: since } },
        });
        if (count >= limit.max) {
          const oldest = await prisma.botGuardToken.findFirst({
            where: { ip, form: input.form, createdAt: { gte: since } },
            orderBy: { createdAt: "asc" },
            select: { createdAt: true },
          });
          reason = "rate";
          retryAfterSeconds = oldest
            ? Math.max(
                1,
                Math.ceil(
                  (oldest.createdAt.getTime() + limit.windowSeconds * 1000 - now) / 1000,
                ),
              )
            : limit.windowSeconds;
        }
      }
    }
  }

  if (!reason) {
    // The token parsed OK (otherwise `reason` would be set), so the nonce is known.
    return { ok: true, nonce: signed?.nonce as string, ip };
  }

  await recordBlockedAttempt({ form: input.form, reason, nonce, ip, now });
  return { ok: false, reason, retryAfterSeconds };
}

/**
 * Burns the challenge nonce and appends the audit trace. Never throws: the
 * ledger is enforcement, the SecurityEvent row is observation.
 */
async function recordBlockedAttempt(input: {
  form: FormKind;
  reason: FormGuardBlockReason;
  nonce: string | null;
  ip: string | null;
  now: number;
}): Promise<void> {
  if (input.nonce) {
    await rememberNonce(input.nonce, input.form, input.ip, "BLOCKED");
  }
  await recordSecurityEvent({
    type: "FORM_BLOCKED",
    outcome: "FLAGGED",
    targetType: "form",
    targetId: input.form,
    detail: `Envoi bloqué · ${input.form} · raison ${input.reason}`,
    ip: input.ip,
  });
  await pruneBotGuardTokens(input.now);
}

/** Best-effort ledger insert — an existing row already refuses the nonce. */
async function rememberNonce(
  nonce: string,
  form: FormKind,
  ip: string | null,
  status: "CONSUMED" | "BLOCKED",
): Promise<boolean> {
  try {
    await prisma.botGuardToken.create({ data: { nonce, form, status, ip } });
    return true;
  } catch {
    return false;
  }
}

/**
 * Consumes a passed challenge before the caller writes anything. Returns
 * `false` when the nonce was already used (a replay race or a scraped token):
 * in that case the attempt is traced but the write must not happen.
 */
export async function consumeFormToken(
  nonce: string,
  form: FormKind,
  ip: string | null,
): Promise<boolean> {
  const fresh = await rememberNonce(nonce, form, ip, "CONSUMED");
  if (fresh) {
    await pruneBotGuardTokens();
    return true;
  }
  await recordSecurityEvent({
    type: "FORM_BLOCKED",
    outcome: "FLAGGED",
    targetType: "form",
    targetId: form,
    detail: `Envoi rejoué · ${form} · jeton déjà utilisé`,
    ip,
  });
  return false;
}

/**
 * Releases a consumed nonce when the write itself failed, so the visitor can
 * retry from the same page without reloading. Blocked nonces are never freed.
 */
export async function releaseFormToken(nonce: string): Promise<void> {
  try {
    await prisma.botGuardToken.deleteMany({ where: { nonce, status: "CONSUMED" } });
  } catch {
    // The write already failed; a retry can still reload the form.
  }
}

async function pruneBotGuardTokens(now = Date.now()): Promise<void> {
  try {
    await prisma.botGuardToken.deleteMany({
      where: { createdAt: { lt: new Date(now - PRUNE_AFTER_MS) } },
    });
  } catch {
    // Best effort — the ledger only grows for a day anyway.
  }
}

/** Localized, non-technical feedback for a blocked submission. */
export function botGuardMessage(blocked: FormGuardBlocked, t: Dictionary): string {
  if (blocked.reason === "rate") {
    const minutes = Math.max(1, Math.ceil(blocked.retryAfterSeconds / 60));
    return format(t.errors.botRateLimited, { minutes });
  }
  if (blocked.reason === "expired") return t.errors.botExpired;
  return t.errors.botBlocked;
}
