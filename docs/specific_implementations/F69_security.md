# F69 — protecting sensitive data

Implemented on 2026-10-04 (branch `82-security-f-69-harden-the-platform-against-exploitation-of-sensitive-data`).
The need: a vulnerability exploitation attempt was detected on similar platforms —
protect sensitive data, with protection **perceptible in real behaviour** and
**without making normal use needlessly complicated**.

## Threat model

| Risk | Vector in this app | Mitigation |
| --- | --- | --- |
| Unauthorised read of another colon's data (IDOR) | Guessing a record id in a URL or API call | Role + ownership re-checked server-side in every page, action and route handler |
| Privilege escalation | Forged client state, direct action calls | Role read from the DB-backed JWT; every mutation calls `requirePageRole` / `requireApiRole` |
| Stored XSS via free text | Markup submitted to reports, announcements, contact | Input neutralisation in the shared Zod schemas (defence in depth on top of React escaping) |
| Link-based XSS | `javascript:` / `data:` URLs in broadcast actions | URL scheme allow-list (`/relative` or `http(s)://`) at validation and render time |
| Brute force / credential stuffing | Repeated login attempts | F37 throttle (already shipped) + audit of every failure/block |
| Information leak on failure | Stack traces, SQL errors surfaced by forms/API | `PublicError` + generic copy, generic 500s, root error boundary |
| Unnoticed abuse | No trace of privileged actions | Append-only `SecurityEvent` audit trail + Council security console |

## Acceptance criteria → implementation

| Criterion | Where |
| --- | --- |
| Sensitive data is not exposed to an unauthorised user | `lib/permissions.ts` (`requirePageRole`, `requireApiRole`), ownership filters in `lib/data.ts` (`getRequestsByAuthor`, `getOrders({ customerId })`, `getWallet`, `getAppointments`, report detail `authorId` checks) |
| Access is verified server-side for every sensitive operation | Every server action starts with `requirePageRole`; every mutating API route calls `requireApiRole` before parsing (never trust the middleware alone) |
| Inputs are validated and dangerous content is neutralised | `lib/sanitize.ts` + `lib/validation.ts` schemas (shared by forms and API), `policeCaseSchema`, `readId`/`readText` for action payloads |
| A security failure does not leak technical details | `lib/errors.ts` (`PublicError`, `userMessage`), `lib/api.ts` (`serverErrorResponse`), `app/error.tsx` |
| Sensitive operations are recorded for after-the-fact analysis | `SecurityEvent` model, `lib/security.ts`, console at `/council/security` |
| Normal citizen journeys stay usable | No CAPTCHA, no extra steps; neutralisation only touches markup/control characters; copy stays localized |
| Protection does not rely on client-side checks alone | All of the above runs on the server; the UI merely hides what the server refuses |

## Access control

The existing double layer is unchanged in principle: `middleware.ts` routes
protected areas, and **every page/action/route re-checks with
`lib/permissions.ts`**. F69 adds:

- Ownership is always part of the query (`where: { id, authorId }`,
  `where: { id, citizenId }`), so a guessed id returns “not found” rather than
  another colon's record.
- Every denial is written to the audit trail (`ACCESS_DENIED`, with actor, role
  and the required roles).
- The broken `ADMIN` role on `POST /api/services` and `POST /api/announcements`
  was replaced with the real `COUNCIL` role (the endpoints were unreachable
  before; now they work only for the High Council).
- Credential inputs are length-bounded before they reach bcrypt/Prisma.

## Input neutralisation (`lib/sanitize.ts`)

- `sanitizePlainText` — strips complete tag-like sequences and control
  characters; keeps accents, apostrophes, punctuation, tabs and newlines.
- `sanitizeUrl` — accepts `/relative` paths and `http(s)://` URLs only; drops
  `javascript:`, `data:`, `vbscript:`, `file:` and protocol-relative `//host`
  links, including obfuscated schemes (`java script:`).
- `hasDangerousContent` / `findDangerousFields` — detect payloads so the attempt
  is recorded (`INPUT_NEUTRALIZED`, outcome `FLAGGED`) without storing the
  payload itself.
- `readId` / `readText` — bound and sanitise raw form values used by actions that
  previously trusted `String(formData.get(...))`.

Applied in the shared Zod schemas (`registerSchema`, `contactSchema`,
`requestSchema`, `reportSchema`, `serviceSchema`, `announcementSchema`,
`broadcastSchema`, `policeCaseSchema`), which both server actions and route
handlers use — one choke point for all writes.

React escapes rendered output, so this layer is deliberately about *stored
content hygiene*, not the only line of defence.

## Error hygiene

- Services throw `PublicError` only for intended, user-safe messages (duplicate
  account, invalid status, stale slot). Actions use `userMessage(error, fallback)`
  — anything else becomes the localized generic copy (`errors.registerFailed`,
  `errors.*`).
- Route handlers return `{"error": "Une erreur interne est survenue."}` with
  status 500; the technical error goes to the server log
  (`serverErrorResponse`).
- `app/error.tsx` shows the localized generic message and a retry button; it
  never renders the raw error or digest.

## Audit trail

`SecurityEvent` (append-only; the app never updates or deletes rows):

| Column | Purpose |
| --- | --- |
| `type` | `LOGIN_FAILED`, `LOGIN_BLOCKED`, `ACCESS_DENIED`, `ROLE_CHANGED`, `CONTENT_CHANGED`, `REQUEST_STATUS_CHANGED`, `REPORT_STATUS_CHANGED`, `ORDER_STATUS_CHANGED`, `RECORD_ASSIGNED`, `CASE_FILED`, `INPUT_NEUTRALIZED` |
| `outcome` | `INFO`, `SUCCESS`, `DENIED`, `FLAGGED` |
| `actorId` / `actorRole` | Who acted (null for anonymous attempts) |
| `targetType` / `targetId` | What was touched (user, service, announcement, broadcast, report, request, order) |
| `detail` | Human-readable context (never raw payloads) |
| `ip` / `userAgent` | Best-effort request context |
| `createdAt` | Indexed timestamp |

Recorded from: `lib/auth.ts` (failed/blocked sign-ins), `lib/permissions.ts`
(access denials), the admin, agent, report and order actions, the content API
routes, and neutralised-input detection.

The High Council console is at **`/council/security`** (nav entry “Sécurité”):
four 24-hour tiles (blocked sign-ins, denied access, neutralised inputs, traced
actions) plus the recent-events feed. The Council overview shows the same
counters and links to the console.

## Platform headers

`next.config.mjs` adds `X-Content-Type-Options: nosniff`, `X-Frame-Options:
DENY`, `Referrer-Policy: strict-origin-when-cross-origin`,
`Permissions-Policy` (camera/microphone/geolocation off) and
`Cross-Origin-Opener-Policy: same-origin` to every response.

## Exact files changed

| File | Reason |
| --- | --- |
| `prisma/schema.prisma` + migration `20261003232213_security_events` | Append-only `SecurityEvent` model |
| `lib/sanitize.ts` | Neutralisation helpers and bounded form readers |
| `lib/errors.ts` | `PublicError` / `userMessage` |
| `lib/security.ts` | Audit recording + reads + 24 h stats |
| `lib/validation.ts` | Sanitising schema helpers; `reportSchema`, `policeCaseSchema`; URL allow-list |
| `lib/services.ts` | `PublicError` for intended failures; `setUserRole` returns the previous role |
| `lib/auth.ts` | Audit failed/blocked logins; bound credential lengths |
| `lib/permissions.ts` | Audit access denials (pages + API) |
| `lib/actions/*.ts` | Neutralisation audits, workflow audits, bounded ids/notes, generic failures |
| `app/api/*/route.ts` + `lib/api.ts` | Server-side role checks kept/added, generic 500s, `COUNCIL` role fix |
| `app/council/security/page.tsx`, `app/council/layout.tsx`, `app/council/page.tsx` | Security console, nav entry, overview counters |
| `app/error.tsx` | Root error boundary without technical details |
| `next.config.mjs` | Baseline security headers |
| `lib/i18n/dictionaries/{fr,en,es}.ts` | Security console copy + generic error/retry messages |
| `prisma/seed.ts` | Demo audit rows so the console has data on a fresh DB |
| `tests/security.test.ts` | Neutralisation, URL, bounded-reader and error-hygiene tests |
| `docs/TODO_terra_nova.md` | F69 marked done (and F37, already shipped) |

## Verification

- `npx tsx --test tests/*.test.ts` — 11 tests pass (6 new security tests).
- Production build: `npx next build`.
- Browser journey (citizen): sign-up/login → services → contact → request →
  tracking all unchanged; `<script>`-style payloads are stored neutralised.
- An unauthorised citizen hitting `/council` is redirected and the denial
  appears in `/council/security`; a wrong password produces a `LOGIN_FAILED`
  audit row; a Council role change produces `ROLE_CHANGED`.

## Remaining checks

- Rotate the demo `NEXTAUTH_SECRET` before any public deployment.
- Consider a retention/rotation policy if the audit table grows beyond the demo
  (the model is intentionally append-only).
- CSP is intentionally not enabled yet: the theme/tour scripts would need a
  nonce strategy first.
