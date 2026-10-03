# Terra Nova — 24h Webcup

Digital ecosystem of **Terra Nova**, the first human city on Mars.

Citizens have one civic identity and can report incidents, order services (rover, meals), file
administrative requests, read Council announcements and follow everything from a single dashboard.
Each municipal service — security, medical, maintenance, transport, commerce, administration — gets a
dedicated operations console fed by the same **signalement → intervention → closure** engine, and the
High Council pilots the whole colony.

## Stack

Next.js (App Router) + TypeScript · Tailwind CSS v4 · shadcn/ui · Prisma · NextAuth.js ·
SQLite (dev) / PostgreSQL (prod)

## Getting started

Set `NEXTAUTH_SECRET` in `.env` to the output of `openssl rand -base64 32` before
starting the app. NextAuth requires this secret in production, including Docker.

```bash
cp .env.example .env          # then fill in the values
npm install
npx prisma migrate dev        # creates prisma/dev.db (SQLite)
npm run db:seed               # Terra Nova demo dataset
npm run dev                   # http://localhost:3000
```

```bash
npm run db:reset              # wipe, re-migrate and re-seed (recommended after schema changes)
```

> The default `.env` targets SQLite for local dev. SQLite has no Prisma enums, so enum-like fields
> (`role`, `status`, `priority`, …) are stored as strings and validated through `lib/roles.ts`.

## Demo accounts

Password for every account: `password123`.

| Account | Role | Landing page |
| --- | --- | --- |
| `citoyen@terranova.fr` | Citizen (Amina Okafor) | `/citizen` |
| `securite@terranova.fr` | Security (Sana Rhee) | `/operations/security` |
| `medical@terranova.fr` | Medical (Dr Ilyas Voss) | `/operations/medical` |
| `maintenance@terranova.fr` | Maintenance (Mateo Silva) | `/operations/maintenance` |
| `transport@terranova.fr` | Driver (Nadia Petrov) | `/operations/transport` |
| `commerce@terranova.fr` | Merchant (Yuki Tanaka) | `/operations/commerce` |
| `administration@terranova.fr` | Administrative agent (Claire Fontaine) | `/operations/administration` |
| `conseil@terranova.fr` | High Council (Elias Marr) | `/council` |

## The core engine

1. A citizen files a **signalement** (security, medical, maintenance or cleanliness) from `/citizen/report`.
2. The report is routed to the owning service and appears **live** in its console.
3. The service takes charge, sets `EN_ROUTE` / `IN_PROGRESS` / `RESOLVED` / `CLOSED` and logs notes.
4. Security can additionally open a simulated **arrest + PV** (police case).
5. The citizen sees every transition in their tracking view.

Best demo path: citizen reports an intrusion → it appears in **Ares Security Command** → the officer
takes charge, sets the status and files a PV.

## Competition needs

The Webcup needs remain demonstrable through the ecosystem:

| Need | Where |
| --- | --- |
| `D01` | `/register` — civic identity creation |
| `D03` | `/login` + `/citizen` personal dashboard |
| `D04` | `/contact` — form + reference acknowledgement |
| `D05` | `/services` — services directory |
| `D06` | `/announcements` — Council publications |
| `D07` | `/` — hierarchical landing page |
| `D08` | 8 roles in `lib/roles.ts` + session |
| `D09` | `middleware.ts` + server-side guards |
| `D19` | `/operations/*` — dedicated service consoles |
| `F22` | Incident/request lists with statuses and “needs action” filters |

Refresh the need list whenever a wave drops — see [`docs/NEEDS.md`](docs/NEEDS.md).

## Developer panel

`/dev/tickets` is a ticketing UI for the competition needs served by the Webcup API: filter them by
status and difficulty, open a ticket to read its official description, change the status, assign it,
comment, and **synchronise** to pull the latest waves.

- **Access:** open in development, opt-in with `DEV_PANEL=1`, or restricted to the High Council —
  otherwise the route returns 404.
- **Sync** needs `WEBCUP_API_KEY` in `.env`. Local workflow state (status, assignee, comments) is
  never overwritten by a sync.
- Seeded tickets mirror `docs/TODO_terra_nova.md`; the panel is the interactive counterpart of
  `scripts/fetch_new_features.py`.
- Statuses: `TODO → IN_PROGRESS → REVIEW → DONE` (plus `BLOCKED`).

## Themes

Ten selectable themes, including **Mars Civic OS** (the `docs/ui-v1.svg` design, now the default).
Switch from the palette icon in any header or from `/apparence`. See
[`docs/PROJECT.md`](docs/PROJECT.md) § 8.

> Copy layered on the dark hero/login scene uses the constant `scene-*` tokens
> (`text-scene-foreground`, …), so it stays readable on the light themes too.

## Languages

The UI ships in **French (default), English and Spanish**.

- Switch from the globe icon in any header or footer. The choice is stored in the `nt-locale`
  cookie — no URL prefix, so the French route segments and the auth middleware stay untouched.
- Dictionaries: [`lib/i18n/dictionaries/`](lib/i18n/dictionaries). `fr.ts` is the reference and
  `en.ts` / `es.ts` are typed as `Dictionary` (`typeof fr`), so TypeScript rejects a locale that
  misses a key.
- Server components call `getDictionary()`, client components call `useT()`, and
  `format(template, values)` interpolates `{placeholders}`. Dates follow the active locale
  ([`lib/format.ts`](lib/format.ts)).
- In-world proper nouns (Terra Nova, Ares Security Command, BicDôme…) and **seeded content**
  (announcements, services, incidents) keep their stored language.

**Adding a string:** add the key to `fr.ts`, then mirror it in `en.ts` and `es.ts`.
**Adding a language:** add its code and label in [`lib/i18n/config.ts`](lib/i18n/config.ts), copy
`fr.ts`, translate it, and register the dictionary in [`lib/i18n/server.ts`](lib/i18n/server.ts).

## Animations

Motion is built on [**anime.js v4**](https://animejs.com) — no CSS-animation litter.

- **Primitives:** [`lib/motion.ts`](lib/motion.ts) (`reveal`, `revealSelf`, `revealChildren`,
  `countUp`, `drawIn`, shared easings/durations) + the
  [`<Reveal>`](components/motion/Reveal.tsx) client wrapper for server-rendered blocks.
- **What moves:** the landing hero (staggered reveal), the colony scene (twinkling stars, drifting
  domes, pointer parallax), page headers, metric tiles (fade in + count-up), every feed row
  (staggered), the radar (graticule draw-in, rotating sweep, breathing blips) and the theme gallery.
- **Reduced motion is respected:** when `prefers-reduced-motion: reduce` is set, every helper bails
  out *before* hiding anything, so content is always visible — it just appears instantly.
- **Rules:** import these helpers from client components only; never animate `foreground`-based
  copy over the dark scene (see the `scene-*` tokens above); keep durations from `DUR`.

## User guide

`/guide` is an in-app tutorial that walks every profile through the platform — visitor, citizen and
each service role — localized like the rest of the UI. Pick a profile to see where it works, which
demo account it uses, and its walkthrough step by step (it opens on your own walkthrough when you
are signed in).

**The interactive tutorial** (`▶ Start the tour`) turns that into a hands-on, game-style lesson:
the screen is dimmed, one element is spotlighted, and every other interaction is blocked until you
click the highlighted element — which performs the real action. Four lessons: *Discover the city*,
*Citizen journey*, *Work a case* (any service console) and *Run the colony*.

Launch it from the home page, from `/guide`, or from your own space (compass button in the console
header). Lessons you cannot run with your current account are hidden outside `/guide`.

The same content in writing, plus the permissions matrix, the status lifecycles, the 10-minute demo
script and troubleshooting, lives in [`docs/TUTORIAL.md`](docs/TUTORIAL.md).

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` / `npm run start` | Production build / start |
| `npm run db:migrate` | Create/apply Prisma migrations |
| `npm run db:seed` | Seed the Terra Nova dataset |
| `npm run db:reset` | Reset the database and re-seed |
| `npm run db:studio` | Open Prisma Studio |

## Documentation

- [`AGENTS.md`](AGENTS.md) — AI coding agent brief
- [`docs/PROJECT.md`](docs/PROJECT.md) — product & architecture overview
- [`docs/TUTORIAL.md`](docs/TUTORIAL.md) — complete tutorial by type of user (= the in-app `/guide`)
- [`docs/terra_nova_ecosysteme_roles.md`](docs/terra_nova_ecosysteme_roles.md) — the ecosystem spec
- [`docs/NEEDS.md`](docs/NEEDS.md) — needs API + fetch script workflow
- [`docs/README.md`](docs/README.md) — documentation index

## License

[MIT](LICENSE)
