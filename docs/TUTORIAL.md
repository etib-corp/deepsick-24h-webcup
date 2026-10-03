# Terra Nova — Complete user tutorial

A guided tour of the platform, **one walkthrough per type of user**: what each profile can see, the
order in which to do things, and what the other side of the screen shows.

> The same content is available **inside the app**, localized in French, English and Spanish, at
> [`/guide`](<../app/(public)/guide/page.tsx>) — it even starts on *your* walkthrough when you are
> signed in. This document adds the operator details: permissions matrix, status lifecycles and the
> full end-to-end demo.

---

## 1. Before you start

```fish
npm install
npm run db:migrate && npm run db:seed
npm run dev
```

The seed creates one account per role, plus municipal services, announcements, incidents, orders and
démarches, so every console has something to show.

### Demo accounts

| Profile | Account | Password | Lands on |
| --- | --- | --- | --- |
| Citizen | `citoyen@terranova.fr` | `password123` | `/citizen` |
| Security | `securite@terranova.fr` | `password123` | `/operations/security` |
| Medical | `medical@terranova.fr` | `password123` | `/operations/medical` |
| Maintenance | `maintenance@terranova.fr` | `password123` | `/operations/maintenance` |
| Transport | `transport@terranova.fr` | `password123` | `/operations/transport` |
| Commerce | `commerce@terranova.fr` | `password123` | `/operations/commerce` |
| Administrative agent | `administration@terranova.fr` | `password123` | `/operations/administration` |
| High Council | `conseil@terranova.fr` | `password123` | `/council` |

The visitor profile needs no account: the whole public site is open.

---

## 2. The basics — true for every profile

1. **Language** — globe icon in the header (and in the footer): French, English, Spanish. The choice
   is stored on the device, not on the account.
2. **Theme** — palette icon in the header, or the full gallery at `/apparence`: ten themes, also
   remembered per device.
3. **Sessions** — sign in and sign out from the header; inside a console the button is labelled
   *Quit*.
4. **Your role decides the landing page** — `/citizen`, `/operations/<service>` or `/council`. Trying
   to open someone else's space redirects you to your own; nothing dead-ends.
5. **Consoles are live** — lists refresh every 5 seconds and the `LIVE` lamp confirms the view is
   current. You never have to reload by hand.
6. **No email is sent** — acknowledgements, tracking codes and notifications are displayed on screen
   only. This is a demo shortcut, by design.
7. **Everything is fictional** — citizens, incidents, arrests, PV, payments and GPS data.

---

## 3. Who can reach what

| Area | Citizen | Service roles | Council | Nobody signed in |
| --- | --- | --- | --- | --- |
| Public site (`/`, `/services`, `/announcements`, `/contact`, `/guide`, `/apparence`) | ✅ | ✅ | ✅ | ✅ |
| `/citizen/**` | ✅ own data | ❌ | ❌ | ❌ |
| `/operations/<own service>/**` | ❌ | ✅ own service only | ✅ all services | ❌ |
| `/operations/<other service>` | ❌ | ❌ | ✅ | ❌ |
| `/council/**` | ❌ | ❌ | ✅ | ❌ |
| `/dev/tickets/**` | ❌ | ❌ | ✅ (or dev mode / `DEV_PANEL=1`) | ❌ |

Access is enforced twice: `middleware.ts` at the edge and again inside each page/handler. Ownership
is checked too — a citizen can only ever open their own report (`/citizen/reports/[id]`).

---

## 4. Walkthroughs by user type

### 4.1 Visitor — discover the city

1. **Landing page** — tells you where you are, what you can do, and routes you to the services.
2. **Civic network** — `/services` lists every municipal service, grouped by category; open one for
   its full description.
3. **Announcements** — `/announcements` holds official communications (service changes, works,
   campaigns) with their publication date.
4. **Write to the administration** — `/contact`: subject, e-mail, message. On submit you get an
   acknowledgement **with a tracking reference** — keep it, it identifies your message.
5. **Make it yours** — pick a theme and a language, then **create your colonist identity** at
   `/register` (name, e-mail, password ≥ 8 characters).
6. **Sign in** — `/login`. You are redirected to the space matching your role.

> Tip: a fresh account is always a `CITIZEN`. Only the Council can grant a staff role.

### 4.2 Citizen — your personal space

1. **Dashboard** (`/citizen`) — colony indicators (local time, breathable air, radiation), your
   active requests and quick actions.
2. **Report an incident** (`/citizen/report`) — pick the service concerned (Security, Medical,
   Maintenance, Cleanliness), a subject, a priority, a sector and a description, then
   *Transmit the report*. It is routed automatically to the owning service.
3. **Track it** (`/citizen/reports` → open a row) — status, assigned unit, description, a radar with
   the sector, the full timeline, and the security case file if one was opened.
4. **Order a service** (`/citizen/orders`) — a Hermes rover (Transport) or a Mercator meal
   (Commerce), with ETA and credits.
5. **Notifications** (bell in the console header) — every status change lands here, then
   *Mark all as read*.
6. **Wallet** (`/citizen/wallet`) — simulated credits and their transaction history.
7. **City map** (`/citizen/map`) — the five sectors and points of interest.
8. **Contact the administration** from the public site whenever you need something the services do
   not cover — you get a tracking reference.

> The status is driven by the service handling your case: your tracking view follows along.

### 4.3 Security — Ares Security Command

1. **Console** (`/operations/security`) — the incident feed for security, with four counters
   (to handle, critical, engaged, resolved) and a radar.
2. **Filter** with the chips: *All*, *Critical*, *To handle*, *Resolved*. The default is
   *To handle*, so the work is already sorted for you.
3. **Open an incident** — the colonist's report, sector, radar, and the timeline.
4. **Take charge** — assigns the case to your unit (and updates it for everyone).
5. **Move the status** — pick the new status (nouveau statut) and add an **intervention note**; the
   note is visible to the colonist in their tracking view.
6. **Arrest & PV** (security incidents only) — person concerned, intervention notes, fine, and the
   simulated report. *Open the case + PV* the first time, *Update the case* afterwards. The colonist
   then sees the case file appear in their tracking.

> The console refreshes every 5 seconds; keep an eye on *Critical* — it is the top-priority queue.

### 4.4 Medical — emergencies and care

1. **Console** (`/operations/medical`) — same layout as Security, restricted to medical incidents.
2. **Triage from the counters** — work *Critical* first, then the rest of *To handle*.
3. **Open the incident** — check the sector and the description; the radar shows where it is.
4. **Take charge, then move the status** (en route → in progress → resolved) with a care note.

> You only ever see medical incidents; security, maintenance and cleanliness belong to their own
> services, and vice versa.

### 4.5 Maintenance — vital infrastructure

1. **Console** (`/operations/maintenance`) — air, power, water and module cleanliness.
2. You handle **both** maintenance and cleanliness incidents; the feed shows both.
3. **Open, take charge, update the status** and leave an intervention note, exactly like the other
   incident consoles.

> A critical breakdown sits at the top of the *Critical* chip — start there.

### 4.6 Transport — moving the colony

1. **Console** (`/operations/transport`) — counters for *waiting*, *running*, *completed*, a radar
   and the ride queue.
2. **Read the queue** — each ride shows its reference, summary, who ordered it, the ETA and the
   credits.
3. **Move a ride along** — the inline status control on each row (Confirmed → En route → Completed),
   then *Upd.*
4. The colonist sees the new status and the ETA in their space, with no action on their side.

### 4.7 Commerce — canteens and supplies

1. **Console** (`/operations/commerce`) — *preparing*, *ready* and the cycle's revenue.
2. **Move an order along** — Confirmed → Preparing → Ready → Completed (or Cancelled) from the row.
3. Every change notifies the colonist.

> Credits are fictional: the revenue figure only demonstrates economic activity.

### 4.8 Administrative agent — colonist requests

1. **Queue** (`/operations/administration`) — counters for *to process*, *in review*, *processed*.
2. **Open a request** (`/operations/administration/[id]`) — what the colonist filed, their contact
   details, the date, and the history.
3. **Instruction** — set the status (Submitted → In review → In progress → Resolved → Closed) and
   write the **official reply**; then *Update*.
4. The reply is appended to the history the colonist reads, and the status change notifies them.

### 4.9 High Council — running the colony

1. **Overview** (`/council`) — incidents, interventions, published services, published
   announcements, colonists, orders, plus a breakdown by service and the most recent reports.
2. **Announcements** (`/council/announcements`) — write a title, a standfirst and a body; publish
   immediately or keep it as a draft. Publish/unpublish from the list at any time. A published
   announcement appears on the public home page immediately.
3. **Services** (`/council/services`) — add a municipal service (name, category, icon, description)
   or remove one; the civic network and the public directory update at once.
4. **Accounts** (`/council/users`) — change any colonist's role. Promoting a citizen to a service
   role (or to Council) opens their console on their next sign-in. You cannot change your own role.
5. **Every console** — as Council you can open any service console and act on any case, which is
   how you unblock a service during a demo.
6. **Developer panel** (`/dev/tickets`) — the competition's own backlog; see §7.

---

## 5. What "progressing a case" means

### Incidents (signalements)

```
OPEN → ASSIGNED → EN_ROUTE → IN_PROGRESS → RESOLVED → CLOSED
```

- *Take charge* moves an unassigned case to your unit; the status is set separately.
- Priorities: `LOW`, `NORMAL`, `HIGH`, `CRITICAL`.
- Types: `SECURITY`, `MEDICAL`, `MAINTENANCE`, `CLEANLINESS` — the type decides which service owns
  the case.
- The citizen's timeline and the service's console always show the same events.

### Orders (commandes)

```
PENDING → CONFIRMED → PREPARING → READY → IN_TRANSIT → COMPLETED
                                                    ↘ CANCELLED
```

Transport uses `PENDING → CONFIRMED → IN_TRANSIT → COMPLETED`; Commerce uses
`CONFIRMED → PREPARING → READY → COMPLETED`.

### Démarches (administrative requests)

```
SUBMITTED → IN_REVIEW → IN_PROGRESS → RESOLVED → CLOSED
```

### Tickets (Webcup needs)

```
TODO → IN_PROGRESS → REVIEW → DONE      (plus BLOCKED)
```

---

## 6. The interactive tutorial (hands-on)

Every written walkthrough has a **hands-on twin**: a game-style guided tour that runs over the real
interface.

**Where to start one**

| Entry point | Lists |
| --- | --- |
| Home page `/` — *Interactive tutorial* section | only the lessons your session can run |
| `/guide` — the launcher and each profile's panel | every lesson; the ones you cannot reach are flagged with the account they need |
| Your personal space — the compass button in the console header (citizen space and every service console) | only the lessons that space can run, plus the written guide |
| Citizen dashboard `/citizen` and Council overview `/council` — *Interactive tutorial* card | the same filtered list, in the page |

A lesson for a role you are not signed in as is **hidden** in the personal spaces and on the home
page, and **shown locked** on `/guide` — that page is the exhaustive reference, the others only
offer what you can actually play.

How it behaves:

- the page is **dimmed**, one element is **spotlighted**, and everything outside that element is
  **blocked** — clicking elsewhere shakes the spotlight and tells you to follow the highlight;
- a step either advances when you **click the highlighted element** (a chip, a row, a button — the
  real action, on the real data) or with **Next** when it is only an explanation;
- steps can live on **different pages**: the tour follows the navigation it triggered and resumes
  where it left off (progress is kept in `sessionStorage`, cleared when the tour ends);
- `Esc` or *Quit the tour* leaves at any point; `prefers-reduced-motion` keeps it functional
  without the shake animation.

| Lesson | Covers | Flow |
| --- | --- | --- |
| Discover the city | Public site | intro → open *Services* → read a service → open *Guide* → outro |
| Citizen journey | `/citizen` | intro → console nav → colony indicators → open *Report* → pick a service → submit |
| Work a case | Any service console | intro → filter the queue → radar → open a case → take it over → move the status |
| Run the colony | Council | intro → indicators → open *Announcements* → write → publish |

Profile → lesson mapping: visitor → *Discover the city*, citizen → *Citizen journey*, every service
role → *Work a case*, Council → *Run the colony*.

### Adding a step or a lesson

1. **Mark the target** in the JSX with `data-tour="<name>"` (the tour finds the first *visible*
match, so desktop and mobile navigation can share a name).
2. **Declare the step** in [`lib/tour.ts`](../lib/tour.ts):
   `{ target: '[data-tour="<name>"]', click: '<selector to click to advance>', route: '/page' }` —
   `route` makes the tour navigate, `click` defaults to `target`.
3. **Write the copy** in `t.tour.lessons.<LESSON>.steps[index]` (`{ title, body }`) in the three
dictionaries — the order in `lib/tour.ts` is the order in the copy.
4. **Add a whole lesson** — new id in `TOUR_LESSON_IDS` + `TOUR_LESSONS`, its copy, and (if it
   belongs to a guide profile) an entry in `TOUR_LESSON_FOR_PROFILE`.

## 7. Developer panel — the competition backlog

`/dev/tickets` turns the needs published by the Webcup API into tickets.

- **Access** — open in development, opt-in with `DEV_PANEL=1`, or Council only. Anyone else gets a
  404.
- **Sync** — *⇅ Sync the API* pulls the current wave; it needs `WEBCUP_API_KEY` in `.env`. The
  message tells you how many needs were received, created and updated, plus the countdown to the
  next wave.
- **Work a ticket** — status, assignee, comments; the *List* and *Board* views, filters by status
  and difficulty, and full-text search.
- **Safe by design** — a sync only refreshes API-sourced fields: your status, assignee and comments
  survive the next wave.

---

## 8. The 10-minute demo (all profiles in one story)

1. **Visitor** — open `/`, browse the civic network, read an announcement, send a message from
   `/contact` and keep the tracking code.
2. **Register** a fresh identity, then **sign in as the citizen** (`citoyen@terranova.fr`).
3. **Report** a `CRITICAL` security incident from `/citizen/report`; note it as `Open`.
4. **Sign in as Security** — the incident is at the top of *Critical*: take charge, move it to
   `EN_ROUTE`, add an intervention note.
5. **Sign in as the citizen** — the status and the note are visible in the tracking view.
6. **Back to Security** — open the case + PV with a person concerned.
7. **Sign in as the citizen** — the security case file is now shown on the incident.
8. **Sign in as the Council** — publish an announcement, then check it on the public home page.
9. Finish on `/guide` to show the tutorial your audience is holding.

---

## 9. Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| Redirected to `/login` when opening a console | Not signed in, or the session expired | Sign in again (JWT sessions are cookie-based) |
| Redirected to your own space | Your role does not own that area | Use the account for that area — see the matrix in §3 |
| `/dev/tickets` returns 404 | The panel is closed for this user | Sign in as Council, or set `DEV_PANEL=1` |
| *Sync the API* refuses to run | `WEBCUP_API_KEY` is missing | Add it to `.env` (see [`NEEDS.md`](NEEDS.md)) |
| A console looks stale | The 5-second poll had not fired yet | Wait for the `LIVE` lamp, or reload |
| Empty lists everywhere | The database was never seeded | `npm run db:seed` (or `npm run db:reset`) |
| Sign-in redirects to the wrong host | `NEXTAUTH_URL` does not match the port you serve on | Start with `env PORT=3100 NEXTAUTH_URL=http://localhost:3100 npm run start` |
| A tour step says *Preparing the screen…* forever | The `data-tour` target is missing on that page (or hidden at this breakpoint) | Check the selector in `lib/tour.ts` against the component's `data-tour` attribute |

---

## 10. Where the words come from

Every string in the interface lives in `lib/i18n/dictionaries/{fr,en,es}.ts`; the guide follows the
same rule (`t.guide`). Routes, demo accounts and icons for the guide are declared once in
[`lib/guide.ts`](../lib/guide.ts), so the three locales never drift apart.

- **Adding a step to a walkthrough** — edit the matching profile in the three dictionaries (the
  build fails if a locale misses a key).
- **Adding a profile** — add its id to `GUIDE_PROFILE_IDS` and `GUIDE_PROFILES` in `lib/guide.ts`,
  then add the matching `profiles.<ID>` entry to the three dictionaries.
- **Keeping both versions in sync** — the in-app guide is the reference for users; update this
  document whenever a walkthrough changes shape (routes, buttons, statuses).
