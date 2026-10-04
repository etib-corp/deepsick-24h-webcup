# F71 — New arrivals: simple, multilingual access

Verified on 2026-10-04. Feature branch `84-feature-f-71-simplify-access-for-new-arrivals-without-email`.
Issued by the *Service d'Accueil des Nouveaux Arrivants* — around 500 new residents, some
without an email address, not all speaking the same language.

## What a new resident can now do

1. **Create an account without an email** — registration offers “I have an email / I don't have
   an email”. Without one, the resident picks a *colon identifier* (e.g. `elodie.martin`), which
   is suggested from their name as they type it.
2. **Sign in with that identifier or an email** — one field accepts both.
3. **Follow a four-step onboarding page** at **`/arrivants`** — readable **without any account**:
   choose a language, read what is possible without an account, create an account, sign in,
   make a first request, ask for help.
4. **Switch language at any moment without losing progress** — the switcher is present on the
   auth pages and on `/arrivants`; typed form values and the onboarding checklist survive the
   switch.
5. **Understand essential actions without reading** — every step and button carries a pictogram
   (ID card, key, document, life buoy) and short, plain sentences.

## Decisions

- **One normalisation for email and identifier** (`lib/identity.ts`): trimmed, lowercased,
  accents stripped. `identifierWhere()` builds the single Prisma lookup used by sign-in, so the
  two paths cannot drift. Identifiers: 3–30 chars, start with a letter, then letters/digits/`.`/`-`/`_`.
- **`User.email` is now optional; `User.username` is new** (unique). MySQL allows several `NULL`
  emails, so any number of residents can register without one.
- **No synthetic emails**: nothing pretends the resident has an address; admins simply see the
  identifier.
- **Onboarding progress lives in `localStorage`** under one language-independent key
  (`nt-arrivals-progress`), written only through tested helpers (`lib/arrivals.ts`). Switching
  language (a cookie + `router.refresh()`) re-renders the copy but never resets the checklist;
  the same is true for values already typed in the register form.
- **Copy is written to be read by everyone**: `/arrivants` sentences are short and free of
  technical vocabulary — enforced by a test, not just by review (see below).

## Acceptance criteria → where it is answered

| Criterion | Answer |
| --- | --- |
| An account can be created by a resident who has no email address | Register form mode toggle + `buildRegisterSchema` + `registerCitizen` (`lib/services.ts`) + migration `20261004150000_user_colon_identifier` |
| The onboarding journey is available in several languages | `/arrivants` + register/login flows in **fr / en / es** (`lib/i18n/dictionaries/*`) |
| Information is written in simple, non-technical language | `/arrivants` copy rules: ≤ 15-word sentences, banned technical words — `tests/arrivals.test.ts` |
| A resident can switch language without losing their progress | Locale switcher on the auth layout and the language card on `/arrivants`; form DOM values and checklist persist across `router.refresh()` |
| Essential actions stay understandable without translation | Pictograms on the four steps, the mode toggle (mail / ID card) and every action button; language options labelled `FR / EN / ES` |
| Simple information does not require an account | `/arrivants`, services, announcements, contact and guide stay public; `/arrivants` says explicitly what is readable without an account |
| The change is verified against the newly arrived residents' journeys | Unit tests + the two journeys below replayed in a browser |

## Files

| File | Change |
| --- | --- |
| `prisma/schema.prisma`, `prisma/migrations/20261004150000_user_colon_identifier/` | `email` optional, `username` unique |
| `lib/identity.ts` (new) | Normalisation, identifier rules, name → identifier suggestion, lookup filter |
| `lib/arrivals.ts` (new) | Checklist steps + language-independent progress helpers |
| `lib/services.ts` | `registerCitizen` accepts email **or** identifier; typed `RegistrationError` codes |
| `lib/validation.ts` | `buildRegisterSchema(messages)` — localised errors, identifier rules |
| `lib/actions/auth.ts` | Registration validates and reports errors in the active language; throttle keyed by identifier |
| `lib/auth.ts`, `lib/login-throttle.ts` | Credentials provider signs in by “identifier or email” |
| `components/forms/RegisterForm.tsx` | Mode toggle with icons, auto-suggested identifier, help link |
| `components/forms/LoginForm.tsx` | Single identifier field, hint, demo line for the no-email account |
| `components/arrivals/ArrivalsChecklist.tsx` (new) | Four-step journey, progress bar, reset — persisted locally |
| `app/(public)/arrivants/page.tsx` (new) | Public onboarding page (fr/en/es) |
| `app/(auth)/layout.tsx` | Language switcher available while registering/signing in |
| `lib/i18n/dictionaries/{fr,en,es}.ts` | `arrivals` section + no-email registration copy and errors |
| `components/layout/PublicHeader.tsx`, `PublicFooter.tsx` | `/arrivants` reachable from every public page |
| `components/ui/Field.tsx`, `components/shadcn/input.tsx` | `Input` forwards refs (needed by the suggestion logic) |
| `prisma/seed.ts` | Demo resident without email: `iris.nouvelle` / `password123` |
| `tests/arrivals.test.ts` (new) | Copy, parity, progress, identity and schema tests |

## Verification

Automated:

```fish
node --import tsx --test tests/arrivals.test.ts tests/breadcrumbs.test.ts
npx tsc --noEmit
```

- 5 F71 tests pass: dictionary parity across locales, simple-language rules, checklist
  round-trips, identifier normalisation/suggestion, and email-less registration validation.
- The pre-existing breadcrumbs suite still passes; the project type-checks.

Replayed journeys in the browser (dev server, MySQL):

1. **No-email resident**: `/arrivants` (fr) → switched to English (checklist kept “1 sur 4”) →
   `/register` typed name + email → switched to Spanish **with the values preserved** → chose
   “No tengo correo” (identifier `test.arrivant` suggested from the name) → account created →
   signed in with the identifier → landed on `/citizen`. The test account was removed afterwards.
2. **Seeded no-email resident**: `iris.nouvelle` / `password123` exists after `npm run db:seed`
   and is listed on the login demo card.

> Note: `docs/TODO_terra_nova.md` is generated from the Webcup API — the F71 summary now lives in
> `scripts/fetch_new_features.py` (and `lib/ticket-status.ts`), so re-runs keep the same title.
