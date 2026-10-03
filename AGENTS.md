# Nova Terra — AI Coding Agent Brief

**Project:** Nova Terra — citizen services platform for the 24h Webcup (workspace `deepsick-24h-webcup`)
**Timebox:** 24-hour hackathon
**Stack:** Next.js (App Router) + TypeScript, Tailwind CSS, Prisma, NextAuth.js, SQLite (dev) / PostgreSQL (prod)
**Goal:** Ship the digital platform of the city of Nova Terra — citizens sign up, log in, discover municipal services, read announcements, contact the administration and track their requests; agents get a dedicated workspace fed by the Nova Terra API; administrators manage the platform.

> **Scope source of truth:** the competition needs (`D01`, `D03`–`D09`, `D19`, `F22`, …) are published by the Webcup API and tracked in [`docs/TODO_terra_nova.md`](docs/TODO_terra_nova.md). The fetch workflow and the full needs list live in [`docs/NEEDS.md`](docs/NEEDS.md).

---

## 🗺️ Competition Context

- The 24h Webcup publishes **needs** — one per feature, written in French — through a REST API, in **waves** across the event.
- Each need has a code (`D01`, `F22`…), a difficulty, an XP reward and a public description.
- `scripts/fetch_new_features.py` pulls the visible needs and regenerates `docs/TODO_terra_nova.md`, grouped by difficulty.
- **Re-run the script whenever a new wave drops**, then reconcile the roadmap in this file.
- Implement the *Socle* needs first: they are the foundation (`D01`, `D03`–`D09`) plus the two follow-ups (`D19`, `F22`).

---

## 🎯 Mission

Build a role-based platform for the city of Nova Terra where:

- **Citizens** create an account, log in to a personal space, discover municipal services, read municipal announcements, contact the administration and follow the status of their requests.
- **Agents** (municipal staff) work in a workspace **separate** from the citizen area, consult the activity transmitted by the **Nova Terra API**, and process the requests submitted by citizens.
- **Administrators** manage municipal services, announcements, accounts and access rights.

The MVP must demonstrate one complete journey: **a citizen signs up → submits a request → an agent sees it in their workspace and moves it forward**.

---

## 🧱 Core Requirements

### Tech Stack

- **Frontend:** Next.js 14+ (App Router) + TypeScript, Tailwind CSS
- **Backend:** Next.js Route Handlers / Server Actions
- **ORM:** Prisma
- **Auth:** NextAuth.js (Credentials provider — email + password)
- **Database:** SQLite for local dev, PostgreSQL (Neon/Supabase) in production
- **Deployment:** Vercel-ready

> Maps (Leaflet) are **not** required by the current needs — only add them if a later need asks for geolocation.

### Key Features

Each feature maps to one or more competition needs (see [`docs/NEEDS.md`](docs/NEEDS.md)):

1. **Accounts & sessions** — *`D01`, `D03`*
   - Guided sign-up for a new inhabitant
   - Login / logout and session persistence
   - Personal space identifying the citizen and their activity

2. **Roles & permissions** — *`D08`, `D09`*
   - Three profiles: `CITIZEN`, `AGENT`, `ADMIN`
   - Role loaded into the session (JWT) and enforced **server-side**
   - Citizens can never reach agent/admin tools; sensitive actions stay restricted

3. **Public site** — *`D07`, `D05`, `D06`*
   - Hierarchical home page: where you are, what you can do, obvious access to services
   - Municipal services directory (list + detail)
   - Municipal announcements / publications (list + detail)

4. **Contact the administration** — *`D04`*
   - Contact form and acknowledgement (a reference code is generated and stored)

5. **Citizen requests** — *`D03`*
   - Create a request (subject, description, category, priority)
   - Track it in the personal space through the status lifecycle:
     `SUBMITTED → IN_REVIEW → IN_PROGRESS → RESOLVED → CLOSED`

6. **Agent workspace** — *`D19`, `F22`*
   - Workspace **distinct** from the citizen area
   - Consumes the Nova Terra API to display platform activity
   - Requests view: clear list, readable status, and quick filtering of items that still need action
   - Update a request's status; the change is visible on the citizen side

7. **Administration** — *`D08`, `D09`*
   - Manage services, announcements and user roles
   - Oversight of requests and content

---

## 📁 Project Structure

```
deepsick-24h-webcup/
├── app/
│   ├── (public)/
│   │   ├── page.tsx                 # D07 — hierarchical homepage
│   │   ├── services/                # D05 — municipal services (list + [slug])
│   │   ├── announcements/           # D06 — publications (list + [slug])
│   │   └── contact/page.tsx         # D04 — contact form + acknowledgement
│   ├── (auth)/
│   │   ├── login/page.tsx           # D03
│   │   └── register/page.tsx        # D01
│   ├── (citizen)/
│   │   ├── espace/page.tsx          # D03 — personal space
│   │   └── demandes/                # citizen requests (list + new + [id])
│   ├── agents/                      # D19 — agent workspace (separate shell)
│   │   ├── page.tsx                 # activity dashboard
│   │   └── demandes/                # F22 — requests view with statuses
│   ├── admin/                       # services, announcements, users
│   └── api/
│       ├── auth/[...nextauth]/route.ts
│       ├── services/route.ts
│       ├── announcements/route.ts
│       ├── contact/route.ts
│       ├── requests/               # citizen requests
│       └── agent/                  # Nova Terra API surface consumed by the agent workspace
├── components/
│   ├── ui/                         # Button, Card, Input, Badge, Modal…
│   ├── motion/                     # <Reveal> animation wrapper
│   ├── layout/                     # shells for public / citizen / agent
│   ├── public/
│   └── agent/
├── lib/
│   ├── auth.ts                     # NextAuth configuration
│   ├── permissions.ts              # hasRole / hasAnyRole / requireRole
│   ├── i18n/                       # fr/en/es dictionaries + server & client helpers
│   └── prisma.ts                   # Prisma singleton
├── prisma/
│   ├── schema.prisma
│   └── seed.ts                     # demo users + content
├── docs/                           # see docs/README.md
├── scripts/
│   └── fetch_new_features.py
├── .env                            # DATABASE_URL, NEXTAUTH_SECRET, WEBCUP_API_KEY
└── package.json
```

> This is the **target** layout — create folders as you implement each need. Citizen routes use French URL segments (`espace`, `demandes`) to match the user-facing copy.

---

## 🗃️ Prisma Schema

Create `prisma/schema.prisma` with the models below. They cover the three roles (`D08`/`D09`), municipal content (`D05`/`D06`), contact messages (`D04`) and the citizen-request lifecycle (`D03`/`F22`).

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql" // use "sqlite" for local dev if preferred
  url      = env("DATABASE_URL")
}

enum Role {
  CITIZEN
  AGENT
  ADMIN
}

enum RequestStatus {
  SUBMITTED
  IN_REVIEW
  IN_PROGRESS
  RESOLVED
  CLOSED
}

enum RequestPriority {
  LOW
  NORMAL
  HIGH
  URGENT
}

enum ContactStatus {
  RECEIVED
  READ
  PROCESSED
}

model User {
  id              String           @id @default(cuid())
  name            String?
  email           String           @unique
  passwordHash    String?
  image           String?
  role            Role             @default(CITIZEN)
  requests        ServiceRequest[] @relation("RequestAuthor")
  assigned        ServiceRequest[] @relation("RequestAssignee")
  contactMessages ContactMessage[]
  announcements   Announcement[]
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt
}

model MunicipalService {
  id          String   @id @default(cuid())
  slug        String   @unique
  name        String
  description String
  category    String?
  icon        String?
  order       Int      @default(0)
  published   Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Announcement {
  id          String    @id @default(cuid())
  slug        String    @unique
  title       String
  excerpt     String?
  body        String
  published   Boolean   @default(false)
  publishedAt DateTime?
  authorId    String?
  author      User?     @relation(fields: [authorId], references: [id], onDelete: SetNull)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

model ContactMessage {
  id        String        @id @default(cuid())
  reference String        @unique @default(cuid())
  subject   String
  body      String
  email     String
  authorId  String?
  author    User?         @relation(fields: [authorId], references: [id], onDelete: SetNull)
  status    ContactStatus @default(RECEIVED)
  createdAt DateTime      @default(now())
  updatedAt DateTime      @updatedAt
}

model ServiceRequest {
  id          String               @id @default(cuid())
  reference   String               @unique @default(cuid())
  subject     String
  description String
  category    String?
  priority    RequestPriority      @default(NORMAL)
  status      RequestStatus        @default(SUBMITTED)
  authorId    String
  author      User                 @relation("RequestAuthor", fields: [authorId], references: [id], onDelete: Cascade)
  assigneeId  String?
  assignee    User?                @relation("RequestAssignee", fields: [assigneeId], references: [id], onDelete: SetNull)
  history     RequestStatusEvent[]
  createdAt   DateTime             @default(now())
  updatedAt   DateTime             @updatedAt
}

model RequestStatusEvent {
  id        String         @id @default(cuid())
  requestId String
  request   ServiceRequest @relation(fields: [requestId], references: [id], onDelete: Cascade)
  status    RequestStatus
  note      String?
  actorId   String?
  createdAt DateTime       @default(now())
}
```

---

## 🔐 Authentication & Authorization

### NextAuth Configuration (`lib/auth.ts`)

- **Credentials provider** (email + password) for the MVP; hash passwords with `bcrypt`.
- In the **JWT callback**, load the user's role from the DB and attach it to the token.
- In the **session callback**, expose `id` and `role` to the client/server.
- Default landing page per role: `CITIZEN → /espace`, `AGENT → /agents`, `ADMIN → /admin`.

### Permissions Helper (`lib/permissions.ts`)

```ts
hasRole(session, role)        // true if the user has this role
hasAnyRole(session, roles)    // true if the user has any listed role
requireRole(session, role)    // throws / redirects when the role is missing
```

### Route Protection

- Protect `/espace` and `/demandes` (citizen), `/agents` (agent) and `/admin` (admin) with `middleware.ts` **and** re-check inside each page/handler.
- Unauthorized users are redirected to their own default dashboard (never to a dead end).
- **API routes must verify the role before processing** — never trust the client.

---

## 🎨 UI/UX Guidelines

### Design System

- **Theme:** Futuristic Mars colony interface
- **Colors:**
  - Background: `#0B0F19` (deep space blue)
  - Surface: `#1F2937` (metallic gray)
  - Accent: `#F4A261` (Mars orange), `#E63946` (alert red), `#38BDF8` (info cyan)
- **Typography:** `font-mono` for headings, `font-sans` for body
- **Components:** Reusable Button, Card, Input, Badge, Modal

### Role-Specific UI

- **Citizen:** clean, service-oriented, reassuring; quick actions front and centre
- **Agent:** dense, high-contrast workspace; status badges, filters, action buttons
- **Admin:** content and account management with clear feedback

> **User-facing copy is localized** (French by default, plus English and Spanish — see
> `lib/i18n/`). Code, comments and documentation stay in English; French URLs (`espace`,
> `demandes`) are kept for the user-facing routes.

---

## 📋 Development Tasks

Aligned with the needs and their XP (see [`docs/NEEDS.md`](docs/NEEDS.md)). Aim for the *Socle* needs first.

### Phase 1 — Foundation (Hours 0–4)

1. Initialize Next.js (App Router, TypeScript) with Tailwind
2. Set up Prisma + SQLite, create the schema, run the first migration
3. Seed demo data: one user per role, sample services and announcements
4. Configure NextAuth (Credentials) and the permissions helpers
5. Build register (`D01`) and login (`D03`) pages with role-based redirects

### Phase 2 — Public site (Hours 4–10)

1. Home page hierarchy (`D07`)
2. Municipal services directory (`D05`)
3. Announcements / publications (`D06`)
4. Contact form + acknowledgement (`D04`)
5. Shared layout and navigation for the public shell

### Phase 3 — Spaces (Hours 10–18)

1. Citizen personal space and request creation / tracking (`D03`)
2. Agent workspace shell, distinct from the citizen area (`D19`)
3. Agent requests view with statuses and a “needs action” filter (`F22`)
4. Request status updates propagated to the citizen view
5. Admin back-office: services, announcements, roles

### Phase 4 — Polish & Demo (Hours 18–24)

1. Enforce roles everywhere (middleware + API guards) (`D08`, `D09`)
2. Seed realistic demo data (believable city content, kept in its stored language)
3. Test the end-to-end journey: sign-up → request → agent action
4. Responsive pass, empty/error states, small animations
5. Prepare and rehearse the demo script

---

## 🚀 Demo Scenario

**Narrative:** “A day in Nova Terra”

1. **Citizen** registers and logs in; the hierarchical home page presents the city services (`D07`).
2. They open a municipal service (`D05`), read an announcement (`D06`) and send a message to the administration, which returns a reference (`D04`).
3. They submit a request from their personal space (`D03`) and see it as `SUBMITTED`.
4. **Agent** logs in and lands in a workspace clearly different from the citizen area (`D19`).
5. The request appears in the agent's list with its status; the “needs action” filter surfaces it (`F22`).
6. The agent moves it to `IN_PROGRESS`, then `RESOLVED`; the citizen space reflects the new status.
7. **Admin** sees the platform activity and manages content/roles.

Demonstrate the role separation, the distinct agent workspace and the request lifecycle.

---

## ⚠️ Constraints & Shortcuts

- **No real email:** simulate the acknowledgement (display + store a reference code).
- **No heavy real-time:** use short polling (≈5 s) to refresh the agent view.
- **No external file storage:** skip uploads unless a need explicitly requires them.
- **Seed everything:** demo users, services, announcements and a few requests must exist on a fresh DB.
- **Localized copy, English code.** Every user-facing string goes through `lib/i18n`
  (`getDictionary()` on the server, `useT()` on the client) — never hardcode French in a component.
- **In-world proper nouns stay untranslated** (Terra Nova, Ares Security Command, Asclepius,
  Hephaestus, Hermes, Mercator, BioDôme); seeded content keeps its stored language.
- **Motion is anime.js, via `lib/motion.ts`.** Use `reveal`/`revealSelf`/`countUp`/`drawIn` rather
  than ad-hoc transitions, and always keep the reduced-motion guard intact.
- **The interactive tutorial drives the real UI.** Mark any element a lesson can spotlight with
  `data-tour="<name>"`, declare the step in `lib/tour.ts` and add its copy to `t.tour.lessons` in
  the three dictionaries (see [`docs/TUTORIAL.md`](docs/TUTORIAL.md) §6).
- **Focus on flow:** one complete, solid journey beats many half-built screens.

---

## 📤 Deliverables

- Functional Next.js app, deployable on Vercel
- Prisma schema + migration and a seeded database (demo users per role)
- Role-protected routes and API endpoints
- The *Socle* needs demonstrable (`D01`, `D03`–`D09`, `D19`, `F22`)
- At least one complete end-to-end scenario working
- Clean, responsive UI consistent with the Mars-city theme

### Definition of Done (per need)

- The need is reachable in the app and matches its public description.
- Access is enforced server-side (role + ownership).
- [`docs/TODO_terra_nova.md`](docs/TODO_terra_nova.md) is refreshed and the item is ticked.

---

**Build Nova Terra: one digital identity, connected services, an operational Mars city.** 🚀🔴
