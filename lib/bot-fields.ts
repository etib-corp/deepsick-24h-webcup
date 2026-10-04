/**
 * F81 — field names shared by the public form components (client bundle) and
 * the server-side guard. Kept dependency-free so the client never pulls in
 * `node:crypto` through `lib/bot-signals.ts`.
 */

/** Hidden challenge input carried by every protected form. */
export const BOT_TOKEN_FIELD = "nt-challenge";

/** Honeypot input: off-screen, unreachable by keyboard, never filled by humans. */
export const BOT_TRAP_FIELD = "website";
