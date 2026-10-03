# Terra Nova — Project Documentation

Terra Nova is the digital ecosystem of the first human city on Mars, built for the **24h Webcup**.
It gives every colon one civic identity, routes incidents to the right municipal service, and gives
each service an operational console — with the High Council overseeing the whole colony.

> The agent brief lives in [`AGENTS.md`](../AGENTS.md), the ecosystem spec in
> [`terra_nova_ecosysteme_roles.md`](terra_nova_ecosysteme_roles.md), and the needs workflow in
> [`NEEDS.md`](NEEDS.md).

## 1. Vision

One platform, one civic identity, three families of experience:

- **Citizens** — one dashboard to report incidents, order services, file administrative requests,
  read Council announcements, manage a fictional wallet and follow every request.
- **Services** — security, medical, maintenance, transport, commerce and administration each get a
  console centred on their own queue, with a live feed, a radar and one-click actions.
- **High Council** — colony-wide oversight: incidents, interventions, accounts, services and content.

## 2. Roles

Eight roles, defined in [`lib/roles.ts`](../lib/roles.ts) and attached to the JWT.

| Role | Landing page | Purpose |
| --- | --- | --- |
| `CITIZEN` | `/citizen` | Daily services, reports, orders, démarches |
| `SECURITY` | `/operations/security` | Incidents, interventions, arrest + PV (simulated) |
| `MEDIC` | `/operations/medical` | Emergency triage and care |
| `MAINTENANCE` | `/operations/maintenance` | Air, power, water, cleanliness |
| `DRIVER` | `/operations/transport` | Rover / shuttle rides |
| `MERCHANT` | `/operations/commerce` | Food orders and preparation |
| `ADMIN_AGENT` | `/operations/administration` | Administrative requests |
| `COUNCIL` | `/council` | Oversight, accounts, services, announcements |

Access is enforced **server-side** twice: in `middleware.ts` for navigation and again in every page
and route handler via `lib/permissions.ts` (`requirePageRole`, `requireApiRole`, `hasRole`,
`hasAnyRole`, `requireRole`). A colon can only ever read their own reports and orders.

## 3. The core engine

```
Report (signalement)
  OPEN → ASSIGNED → EN_ROUTE → IN_PROGRESS → RESOLVED → CLOSED
```

- A citizen files a report (`SECURITY` / `MEDICAL` / `MAINTENANCE` / `CLEANLINESS`).
- `REPORT_TYPE_ROLE` routes it to the owning service.
- The service moves it through the lifecycle; each transition writes a `ReportEvent` (audit trail).
- Security can attach a `PoliceCase` (suspect, notes, fine, PV) — simulated.

A second, parallel flow handles **démarches administratives** (`ServiceRequest`, statuses
`SUBMITTED → IN_REVIEW → IN_PROGRESS → RESOLVED → CLOSED`) handled by the administrative agent.

## 4. Architecture

- **Framework:** Next.js (App Router) + TypeScript
- **UI:** Tailwind CSS v4 + shadcn/ui, token-based theming
- **Data:** Prisma — SQLite for local dev, PostgreSQL (Neon/Supabase) in production
- **Auth:** NextAuth.js Credentials provider (bcrypt-hashed passwords), JWT sessions
- **Backend:** Server Actions for mutations (`lib/actions/*`), Route Handlers for reads (`app/api/*`);
  both call the shared `lib/data.ts` / `lib/services.ts`
- **Live updates:** short polling (≈5 s) in the consoles

## 5. Route map

| Route | Access | Purpose |
| --- | --- | --- |
| `/` | Public | Landing / hero (D07) |
| `/services`, `/services/[slug]` | Public | Services directory (D05) |
| `/announcements`, `/announcements/[slug]` | Public | Council publications (D06) |
| `/contact` | Public | Contact + acknowledgement (D04) |
| `/guide` | Public | In-app tutorial, one walkthrough per profile |
| `/login`, `/register` | Public | Auth (D03 / D01) |
| `/citizen` | Citizen | Dashboard |
| `/citizen/report`, `/citizen/reports`, `/citizen/reports/[id]` | Citizen | Signalements |
| `/citizen/orders`, `/citizen/wallet`, `/citizen/map`, `/citizen/notifications` | Citizen | Services & profile |
| `/operations/security`, `/operations/medical`, `/operations/maintenance` | Service (+Council) | Incident consoles + `/[id]` |
| `/operations/transport`, `/operations/commerce` | Driver / Merchant (+Council) | Order queues |
| `/operations/administration`, `/operations/administration/[id]` | Admin agent (+Council) | Démarches |
| `/council`, `/council/users`, `/council/announcements`, `/council/services` | Council | Oversight |
| `/apparence` | Public | Theme gallery |
| `/dev/tickets`, `/dev/tickets/[code]` | Dev / Council | Webcup needs tracked as tickets |

Legacy routes redirect: `/espace → /citizen`, `/demandes → /citizen/reports`,
`/agents → /operations/administration`, `/admin → /council`.

### API

| Endpoint | Access | Purpose |
| --- | --- | --- |
| `/api/auth/[...nextauth]` | Public | NextAuth |
| `/api/services`, `/api/announcements` | Public read / Council write | Content |
| `/api/contact` | Public | Contact messages |
| `/api/requests` | Citizen (own) / staff (all) | Démarches + incidents feed |
| `/api/agent/activity` | Staff | Activity feed for the consoles |

## 6. Data model

Full schema: [`prisma/schema.prisma`](../prisma/schema.prisma).

| Model | Purpose |
| --- | --- |
| `User` | One role, sector, fictional wallet balance |
| `Report` + `ReportEvent` | Signalements and their audit trail |
| `PoliceCase` | Simulated arrest + PV attached to a security report |
| `Order` | Taxi rides (Hermes) and food orders (Mercator) |
| `ServiceRequest` + `RequestStatusEvent` | Administrative démarches |
| `MunicipalService` | Services directory |
| `Announcement` | Council publications |
| `ContactMessage` | Contact form + reference |
| `Notification`, `WalletTransaction`, `Message` | Notifications, wallet, messaging |

> **SQLite note:** no Prisma enums — enum-like fields are strings validated against
> [`lib/roles.ts`](../lib/roles.ts).

## 7. Security model

- Passwords hashed with bcrypt; never returned.
- Role stored in the JWT (`jwt` callback) and surfaced in the session.
- Navigation guarded by `middleware.ts`; every page/route re-checks the role.
- Ownership enforced (a colon only reads their own reports/orders).
- Unauthorized users are redirected to their own landing page, never a dead end.

## 8. UI / design system

- **Foundation:** Tailwind v4 + shadcn/ui; tokens declared in `app/globals.css` via `@theme inline`.
- **Layout:** reproduced from `docs/ui-v1.svg` — colony status strip, circular mark, `COLONY NOMINAL`
  pill, mono labels, metric tiles, radar card, filter chips and live feed rows
  (`components/colony/*`).
- **Typography:** `font-mono` for headings and figures, `font-sans` for body copy.
- **Copy:** user-facing text is **localized** (French, English, Spanish); code, comments and docs are
  **English**.

### Tutorial & interactive guide

`/guide` teaches the platform twice over:

| Piece | File |
| --- | --- |
| Written walkthroughs, one per profile (visitor, citizen, 6 service roles, Council) | `lib/guide.ts` + `t.guide` |
| Interactive tour: lessons, steps, target selectors | `lib/tour.ts` + `t.tour.lessons` |
| Tour engine (dim, spotlight, event blocking, step machine) | `components/tour/TourProvider.tsx` |
| Launcher cards / compact console menu | `components/tour/TourLauncher.tsx`, `components/tour/TourMenu.tsx` |
| Entry points | `/` section, `/guide`, `/citizen` + `/council` cards, console header (all personal spaces) |

- **Accessibility of a lesson** is decided by `canStartLesson(role, id)` / `accessibleLessons(role)`:
  Council reaches every console, an anonymous visitor only the public lesson. Personal spaces and the
  home page **hide** what the role cannot play; `/guide` lists everything and locks the rest.
- **Blocking:** the backdrop is drawn as four panels around the target's box, leaving a real hole —
  the highlighted element stays clickable and everything else is swallowed (with a nudge).
- **Targets are declared in the markup** with `data-tour="<name>"`; the engine resolves the first
  *visible* match, so desktop and mobile navigation can share one name.
- **Advance:** `click` (the real action) or *Next*; `route` moves to another page, and the fallback
  to the lesson's own route waits 1.5 s and re-checks the target, so dynamic routes (an incident
  detail) are never bounced.
- **State** lives in `sessionStorage` (`nt-tour`) while the tour is active, so navigating through a
  lesson does not lose it; finishing or quitting clears it.
- **Accessibility:** `role="dialog" aria-modal="true"`, the step text is announced
  (`aria-live`), `Esc` quits, and reduced motion only removes the shake.

### Themes

Ten selectable themes applied by `next-themes` as a class on `<html>`:

| id | label | scheme |
| --- | --- | --- |
| `mars-civic` | **Mars Civic OS — the ui-v1 design (default)** | dark |
| `dark` | CRT Phosphor | dark |
| `light` | Paper Terminal | light |
| `bio-dome` | Bio-Dôme | dark |
| `nebula` | Nébuleuse | dark |
| `solar-flare` | Éruption Solaire | dark |
| `glacier` | Glacier | dark |
| `iron-oxide` | Oxyde de Fer | dark |
| `daylight` | Grand Jour | light |
| `void` | Vide Absolu | dark |

- Registry: [`lib/themes.ts`](../lib/themes.ts); token blocks: one class per theme in `app/globals.css`.
- Provider: `app/layout.tsx` (`attribute="class"`, `themes={THEME_IDS}`, `storageKey="nt-theme"`).
- Pickers: palette icon in the headers + the gallery at `/apparence`.
- Labels and descriptions are translated too: `THEMES` holds the ids/swatches, the copy comes from
  `t.themes[id]` (with the registry text as fallback).

**Adding a theme:** add a `.<id> { …tokens… }` block in `globals.css`, register it in `THEMES`
(`lib/themes.ts`), add its label/description to the three dictionaries, and — if dark — add
`.<id> *` to the `@custom-variant dark (…)` list.

**Copy drawn over the scene.** `ColonyScene` (landing hero, login panel) keeps a dark sky on
**every** theme, so anything layered on it must use the constant `scene-*` tokens —
`text-scene-foreground`, `text-scene-muted`, `border-scene-primary`, `text-[var(--scene-info)]` —
instead of `foreground` / `muted-foreground`, which turn near-black on the light themes. The
`--scene-*` values are declared once in `:root` and never overridden by a theme class; pass
`<Logo tone="scene" />` for the mark.

### Motion

Animations use **anime.js v4** (imported as `animate`, `stagger`, `createDrawable`, `utils`).

| Piece | File |
| --- | --- |
| Primitives (`reveal`, `revealSelf`, `revealChildren`, `countUp`, `drawIn`) | `lib/motion.ts` |
| Declarative wrapper for server-rendered blocks (`<Reveal>` / `<Reveal self>`) | `components/motion/Reveal.tsx` |
| Colony scene (star twinkle, dome drift, pointer parallax) | `components/colony/ColonyScene.tsx` |
| Radar (graticule draw-in, rotating sweep, breathing blips) | `components/colony/RadarCard.tsx` |
| Metric tiles (entrance stagger + count-up) | `components/colony/StatTile.tsx` |
| Feed rows, page headers | `components/colony/FeedRow.tsx`, `components/ui/PageHeader.tsx` |
| Landing hero, auth panels, theme gallery | `app/(public)/page.tsx`, `app/(auth)/layout.tsx`, `components/theme/ThemeGallery.tsx` |

- **Entrance pattern:** `useMotionLayoutEffect` writes the hidden state and starts the animation
  *before paint*, so nothing flashes and nothing can stay invisible.
- **Stagger from context:** `revealSelf` derives its delay from the element's index among its
  siblings — lists and grids stagger without threading index props through every page.
- **Count-up** applies to plain integers only; strings such as `99.2%` or `3/12` are left alone.
- **Polling-safe:** the 5 s `router.refresh()` on the consoles re-renders without remounting, so
  animations do not replay and counters do not reset.
- **Reduced motion:** every helper returns early when `prefers-reduced-motion: reduce` matches, so
  the hidden start state is never applied; content is always readable.
- **Durations/easings** come from `DUR` and the `EASE*` constants in `lib/motion.ts` — extend those
  rather than hard-coding new values.

### Internationalization

Three locales: **fr** (default), **en**, **es**.

| Piece | File |
| --- | --- |
| Locale list, cookie name, labels | `lib/i18n/config.ts` (`nt-locale`, `LOCALE_LABELS`) |
| Reference dictionary | `lib/i18n/dictionaries/fr.ts` |
| Translations | `lib/i18n/dictionaries/en.ts`, `es.ts` — typed `Dictionary = typeof fr` |
| Server helpers | `lib/i18n/server.ts` — `getLocale()`, `getDictionary()`, `format()` |
| Client helpers | `lib/i18n/client.tsx` — `LocaleProvider`, `useLocale()`, `useT()` |
| `{placeholder}` interpolation | `lib/i18n/format.ts` (shared server/client) |
| Switcher | `components/i18n/LocaleSwitcher.tsx` (header + footer) |
| Locale-aware dates | `lib/format.ts` (`fr-FR` / `en-US` / `es-ES`) |

- **No URL prefix.** The locale lives in a cookie, so the French route segments (`/espace`,
  `/demandes`) and `middleware.ts` guards are untouched; a switch triggers `router.refresh()`.
- **Provider:** `app/layout.tsx` reads the cookie, sets `<html lang>`, resolves the dictionary and
  wraps the tree in `LocaleProvider` — client components then read copy synchronously via `useT()`.
- **Server actions** build their user-facing messages from the dictionary too
  (`lib/actions/*.ts`), so validation/errors follow the active locale.
- **Not translated on purpose:** in-world proper nouns (Terra Nova, Ares Security Command,
  Asclepius, Hephaestus, Hermes, Mercator, ARC-01 · UTOPIA PLANITIA, BicDôme) and seeded database
  content, which is stored in the language it was authored in.
- **Adding a locale:** add it to `LOCALES`/`LOCALE_LABELS` (`config.ts`), copy `fr.ts`, translate,
  then register the dictionary in `DICTIONARIES` (`server.ts`). Missing keys are a type error.

## 9. Conventions

- French URL segments; **copy is localized** (see § 8 — Internationalization).
- Server-side validation on every mutation (Zod in `lib/validation.ts`).
- Seed a fresh database with one account per role and believable colony data.
- Simulate everything risky: payments, GPS, medical data, arrests and PV are fictional.

## 10. Roadmap

| Phase | Focus |
| --- | --- |
| 1 — Foundation | Next.js, Prisma, seed, NextAuth, roles, redirects |
| 2 — Common UI | Shells, status strip, tiles, radar, notifications |
| 3 — Signalements | Citizen creation, routing, statuses, assignment, API guards |
| 4 — Service consoles | Security (live feed, radar, intervention, PV), medical, maintenance |
| 5 — Other services | Transport, commerce, administration |
| 6 — Council & polish | Oversight, roles, announcements, responsive, demo script |

## 11. Developer panel

`/dev/tickets` turns the Webcup needs into tickets so the team can work them like a backlog.

- **Models:** `Ticket` (one per need code, plus local `status` / `assignee`) and `TicketComment`
  (free-form notes and auto-logged `EVENT` entries for status/assignee changes).
- **Sync:** `lib/tickets.ts` calls the Webcup API (`WEBCUP_API_URL`, header `X-Webcup-Api-Key`) and
  upserts by `code`, refreshing only API-sourced fields — local state survives.
- **UI:** `components/dev/TicketBoard.tsx` (stats, status/difficulty filters, search, list **and**
  board views) and the ticket detail page (description, timeline, status/assignee form, comments).
- **Access:** `lib/dev-access.ts` — open in development, opt-in via `DEV_PANEL=1`, or Council only;
  otherwise `notFound()`.

## 12. Open questions

- **“Nova Terra API” (`D19`)**: still tracked as the platform's own read API (`/api/agent/activity`).
