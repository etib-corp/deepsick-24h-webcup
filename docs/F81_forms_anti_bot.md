# F81 — protecting public forms against automated submissions

Implemented on 2026-10-04 (branch `103-security-f-81-protect-forms-against-automated-submissions`).
The need: several bots were submitting forms automatically — detect and block
them, **perceptibly in real operation**, without CAPTCHAs, puzzles or extra
steps for legitimate visitors.

## Threat model

| Risk | How it shows up here | Mitigation |
| --- | --- | --- |
| Bots autofilling every input | Contact / sign-up / sign-in submitted with hidden fields filled | Off-screen honeypot, unreachable by keyboard and ignored by password managers |
| Scripted submissions without loading the UI | Direct POST to the server action or `/api/contact` | Signed, per-render challenge required by every protected surface |
| Instant submissions (form filled in milliseconds) | Bot posts the moment it scrapes the page | Minimum fill time measured from the challenge’s issue timestamp |
| Scraped challenge reused to spam | One page load, hundreds of submissions | Single-use nonce ledger (a consumed challenge is refused on reuse) |
| Replaying a blocked payload | Retrying the exact blocked request after the refusal | Blocked nonces are burned in the ledger — the replay stays blocked |
| Sustained abuse from one address | Many submissions per IP | Per-form sliding-window rate limit with a clear retry delay |
| No visibility after the fact | Teams never see the attempts | `FORM_BLOCKED` rows in the `SecurityEvent` audit trail + Council security console |

## Design — invisible signals, server-side enforcement

No CAPTCHA, no puzzle, no extra click. Every protected form carries two hidden
inputs (`components/forms/BotGuardFields.tsx`) plus a visible reassurance line
(“Protégé contre les envois automatisés.”):

1. **Honeypot** (`website`) — off-screen, `tabIndex=-1`, `aria-hidden`,
   `autocomplete=off`, ignored by LastPass/1Password. Humans never touch it;
   automated fillers do.
2. **Signed challenge** (`nt-challenge`) — minted per request when the form is
   rendered: `v1.<form>.<issuedAt>.<nonce>.<HMAC>` (HMAC-SHA256). The signature
   prevents forged timestamps; the form kind prevents cross-form reuse.

On submit, `lib/bot-guard.ts` inspects (server-side, before any work):

| Check | Refusal reason | UX |
| --- | --- | --- |
| Honeypot empty | `trap` | Clear non-technical copy |
| Signature / kind valid | `token` | Clear non-technical copy |
| Age ≥ `BOT_GUARD_MIN_FILL_MS` (default 1.5 s) | `tooFast` | Only blocks machine-speed posts; humans never notice |
| Age ≤ `BOT_GUARD_TOKEN_TTL_MS` (default 2 h) | `expired` | “Reload the page and try again” |
| Nonce never seen before | `replay` | Blocked requests stay blocked; consumed challenges cannot be reused |
| IP under the form’s window | `rate` | Localized retry delay in minutes |

Every refusal writes the nonce to the `BotGuardToken` ledger with status
`BLOCKED` (burned, so the exact payload can never pass on replay) **and**
appends a `FORM_BLOCKED` / `FLAGGED` row to the `SecurityEvent` audit trail with
form, reason, IP and user agent — never the payload itself.

Accepted submissions consume their nonce (`CONSUMED`) before the write, so a
scraped challenge is single-use. If the write itself fails, the nonce is
released so the visitor can retry from the same page without reloading.

### Where it is enforced

| Surface | Entry point | Enforcement |
| --- | --- | --- |
| Contact form | `contactAction` | Guard before validation; challenge consumed before the message is stored |
| Contact JSON API | `POST /api/contact` | Same challenge required in the JSON body (`nt-challenge`, `website`), refused with 403 otherwise |
| Sign-up | `registerAction` | Guard before validation; challenge consumed before the account is created (released on a duplicate-email failure so a corrected retry works) |
| Sign-in | NextAuth `authorize` (`lib/auth.ts`) | Guard runs **before** the throttle, bcrypt and any account lookup; blocked attempts throw `BOT_GUARD_BLOCKED` / `BOT_GUARD_EXPIRED`, surfaced as localized copy by `LoginForm` |

Sign-in keeps its F37 throttle and never consumes the challenge on a wrong
password: retrying a typo from the same page is normal behaviour. Blocked login
attempts *are* burned.

### Pages stay dynamic

Challenges are minted during render. All three pages are already dynamically
rendered (the public/auth layouts read cookies), so a build can never bake a
stale challenge into cached HTML.

## Acceptance criteria → implementation

| Criterion | Where |
| --- | --- |
| Automated submissions are detected and blocked | Honeypot + signed challenge + timing + ledger + rate limit (`lib/bot-guard.ts`) |
| Protection active on the platform’s public forms | Contact (action + API), register, login |
| Normal users not slowed or blocked | No extra step; 1.5 s minimum is invisible; no CAPTCHA/puzzle; challenge released when the write fails |
| Blocked submission → clear, non-technical feedback | `errors.botBlocked` / `errors.botExpired` / `errors.botRateLimited`, shown in the existing form alerts (fr/en/es) |
| No puzzle to complete | Nothing visible but a discreet shield notice |
| Blocked attempts leave a trace | `BotGuardToken` (enforcement) + `SecurityEvent` (`FORM_BLOCKED`, outcome `FLAGGED`), 24 h tile “Envois bloqués” on `/council/security` and the Council overview |
| Replaying a blocked request does not bypass protection | Blocked nonces are burned; consumed nonces are single-use; signature prevents forged challenges; enforced server-side (never trust the client) |

## Configuration

All thresholds are environment-overridable (defaults shown):

| Variable | Default | Purpose |
| --- | --- | --- |
| `BOT_GUARD_SECRET` | falls back to `NEXTAUTH_SECRET` | HMAC key for form challenges |
| `BOT_GUARD_MIN_FILL_MS` | `1500` | Minimum time on screen before a submission is accepted |
| `BOT_GUARD_TOKEN_TTL_MS` | `7200000` | Challenge lifetime (2 h) |
| `BOT_GUARD_CONTACT_MAX` / `BOT_GUARD_CONTACT_WINDOW_SECONDS` | `8` / `600` | Contact submissions per IP window |
| `BOT_GUARD_REGISTER_MAX` / `BOT_GUARD_REGISTER_WINDOW_SECONDS` | `10` / `3600` | Sign-ups per IP window |

Ledger rows older than 24 h are pruned opportunistically; the seed wipes the
ledger so demo resets start clean.

## API contract change

`POST /api/contact` now also requires the `nt-challenge` token and the empty
`website` honeypot in its JSON body (same names as the form fields). Direct
posts without a challenge are refused with **403** and a localized message.
The web form itself uses the server action; the API path exists for parity and
is protected identically.

## Exact files changed

| File | Reason |
| --- | --- |
| `prisma/schema.prisma` + migration `20261004170000_bot_guard_tokens` | `BotGuardToken` nonce ledger (enforcement/replay) |
| `lib/bot-fields.ts` | Field names shared by client forms and server guard |
| `lib/bot-signals.ts` | Pure challenge mint/verify, honeypot + timing rules (unit-tested) |
| `lib/bot-guard.ts` | Server enforcement: ledger, replay burn, rate limit, audit, localized messages |
| `lib/security.ts` | `FORM_BLOCKED` event type + 24 h `formBlocked` stat |
| `lib/actions/contact.ts`, `app/api/contact/route.ts` | Contact guard, consume/release, 403 contract |
| `lib/actions/auth.ts` | Register guard + consume/release |
| `lib/auth.ts` | Login guard in `authorize` (before throttle/credentials) |
| `components/forms/BotGuardFields.tsx`, `BotGuardNotice.tsx` | Hidden inputs + discreet shield notice |
| `components/forms/{Contact,Register,Login}Form.tsx` + pages | Wire challenge into the three public forms |
| `app/council/security/page.tsx`, `app/council/page.tsx` | “Envois bloqués” tile + overview counter |
| `lib/i18n/dictionaries/{fr,en,es}.ts` | Bot copy **and** the `council.security` keys lost in a previous merge conflict (console crashed without them) |
| `prisma/seed.ts` | Demo `FORM_BLOCKED` trace + ledger reset |
| `tests/bot-guard.test.ts` | Challenge round-trip, tampering, timing, expiry, honeypot |

## Verification

- `npx tsx --test tests/*.test.ts` — 15 tests pass (4 new).
- End-to-end against a running dev server (contact API, fresh challenge):
  - POST without challenge → **403**, replay → **403**;
  - too-fast challenge → **403**; replay after the block → **403** (burned nonce);
  - matured honest challenge → **201** with a reference; same challenge replayed → **403** (single-use);
  - filled honeypot → **403**;
  - every block produced a `FORM_BLOCKED` audit row; the ledger shows `BLOCKED`/`CONSUMED` entries.
- Browser: contact sent normally (success + reference), citizen login OK, sign-up OK
  (redirect to `/login?inscription=1`), all three forms show the shield notice.
- `/council/security` renders the “Envois bloqués” tile (13 in 24 h during the test)
  and the feed lists the blocked attempts with their reason. A direct credential
  POST without the challenge returns `error=BOT_GUARD_BLOCKED` before any
  password check.

## Remaining checks

- Rotate `BOT_GUARD_SECRET`/`NEXTAUTH_SECRET` before any public deployment.
- A determined bot that loads the page, waits and avoids the honeypot can still
  submit within the rate limit; the ledger + limiter cap the damage, and raising
  the cost further (e.g. proof-of-work) was consciously out of scope for F81.
- If the audit table grows beyond the demo, apply the same retention note as
  F69 (the model is intentionally append-only).
