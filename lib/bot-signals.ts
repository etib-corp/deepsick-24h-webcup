/**
 * F81 — invisible bot signals for the platform's public forms.
 *
 * Two frictionless signals protect contact, sign-up and sign-in:
 *  - a honeypot field humans never see, reach or fill;
 *  - a signed, short-lived challenge whose issue timestamp lets the server
 *    measure how long the form stayed on screen before submission —
 *    millisecond submissions are automation.
 *
 * The challenge carries a random nonce so the server-only ledger in
 * `lib/bot-guard.ts` can refuse replays (a blocked payload stays blocked, and
 * an accepted challenge cannot be reused to spam). This module only depends on
 * `node:crypto` so the token logic stays unit-testable; enforcement lives in
 * the server guard.
 */

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const FORM_KINDS = ["contact", "register", "login"] as const;
export type FormKind = (typeof FORM_KINDS)[number];

const TOKEN_VERSION = "v1";
/** Tolerated clock difference when reading a challenge (future-dated ⇒ forged). */
const CLOCK_SKEW_MS = 60_000;

function envInt(name: string, fallback: number): number {
  const parsed = Number(process.env[name]);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : fallback;
}

/**
 * Minimum time a form must have been on screen before its submission is
 * accepted. Bots post within milliseconds; humans never submit that fast.
 * Overridable with `BOT_GUARD_MIN_FILL_MS`.
 */
export const MIN_FILL_MS = envInt("BOT_GUARD_MIN_FILL_MS", 1_500);

/**
 * Maximum challenge age before the page must be reloaded (default 2 h).
 * Overridable with `BOT_GUARD_TOKEN_TTL_MS`.
 */
export const TOKEN_TTL_MS = envInt("BOT_GUARD_TOKEN_TTL_MS", 2 * 60 * 60 * 1000);

const FALLBACK_SECRET = "nova-terra-local-bot-guard";

/**
 * Signing key for form challenges. Prefers a dedicated `BOT_GUARD_SECRET`,
 * falls back to `NEXTAUTH_SECRET` (always set in this app) and finally a local
 * development constant so the forms keep working in fresh checkouts.
 */
export function getBotGuardSecret(): string {
  const secret = process.env.BOT_GUARD_SECRET?.trim() || process.env.NEXTAUTH_SECRET?.trim();
  return secret || FALLBACK_SECRET;
}

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export type FormToken = {
  kind: FormKind;
  issuedAt: number;
  nonce: string;
};

/** Mints a fresh challenge for one form render. No database write. */
export function createFormToken(
  kind: FormKind,
  options: { secret?: string; now?: number; nonce?: string } = {},
): string {
  const secret = options.secret ?? getBotGuardSecret();
  const issuedAt = options.now ?? Date.now();
  const nonce = options.nonce ?? randomBytes(16).toString("base64url");
  const payload = [TOKEN_VERSION, kind, String(issuedAt), nonce].join(".");
  return `${payload}.${sign(payload, secret)}`;
}

export type FormTokenVerdict =
  | { ok: true; token: FormToken; ageMs: number }
  | { ok: false; reason: "token" }
  | { ok: false; reason: "tooFast" | "expired"; token: FormToken; ageMs: number };

/**
 * Verifies signature, form kind and age of a submitted challenge.
 * - `token`    → missing, malformed, tampered or signed for another form;
 * - `tooFast`  → submitted before a human could have read the form;
 * - `expired`  → the page was left open past the challenge TTL.
 *
 * `tooFast` and `expired` still return the signed token: the caller must burn
 * its nonce so the exact blocked payload is refused on replay.
 */
export function readFormToken(
  token: unknown,
  kind: FormKind,
  options: { secret?: string; now?: number } = {},
): FormTokenVerdict {
  const secret = options.secret ?? getBotGuardSecret();
  const now = options.now ?? Date.now();

  const parts = typeof token === "string" ? token.split(".") : [];
  if (parts.length !== 5) return { ok: false, reason: "token" };

  const [version, tokenKind, issuedAtRaw, nonce, supplied] = parts as [
    string,
    string,
    string,
    string,
    string,
  ];
  if (version !== TOKEN_VERSION || tokenKind !== kind || nonce.length === 0) {
    return { ok: false, reason: "token" };
  }

  const issuedAt = Number(issuedAtRaw);
  if (!Number.isSafeInteger(issuedAt)) return { ok: false, reason: "token" };

  const payload = parts.slice(0, 4).join(".");
  const expected = Buffer.from(sign(payload, secret), "utf8");
  const received = Buffer.from(supplied, "utf8");
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
    return { ok: false, reason: "token" };
  }

  const ageMs = now - issuedAt;
  const challenge: FormToken = { kind, issuedAt, nonce };
  if (ageMs < -CLOCK_SKEW_MS) return { ok: false, reason: "token" };
  if (ageMs > TOKEN_TTL_MS) return { ok: false, reason: "expired", token: challenge, ageMs };
  if (ageMs < MIN_FILL_MS) return { ok: false, reason: "tooFast", token: challenge, ageMs };

  return { ok: true, token: challenge, ageMs };
}

/** True when the off-screen honeypot field contains anything but whitespace. */
export function isHoneypotFilled(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}
