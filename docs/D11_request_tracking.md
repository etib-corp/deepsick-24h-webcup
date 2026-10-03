# D11 — Citizen request tracking

## Existing architecture

The application uses Next.js 14 App Router server components, Prisma 5,
NextAuth JWT sessions, Tailwind theme tokens and shared UI wrappers over
shadcn components. Copy and date formatting already support French, English
and Spanish.

The existing models are sufficient:

| Model | Citizen ownership | Current statuses | Recorded history |
| --- | --- | --- | --- |
| ServiceRequest | authorId | SUBMITTED, IN_REVIEW, IN_PROGRESS, RESOLVED, CLOSED | RequestStatusEvent, through history |
| Report | authorId | OPEN, ASSIGNED, EN_ROUTE, IN_PROGRESS, RESOLVED, CLOSED | ReportEvent, through events |
| Order | customerId | PENDING, CONFIRMED, PREPARING, READY, IN_TRANSIT, COMPLETED, CANCELLED | None |
| Appointment | citizenId | BOOKED, CANCELLED, COMPLETED | None |
| ContactMessage | authorId (optional) | RECEIVED, READ, PROCESSED | None |

MunicipalService describes services and is linked to appointments. It is not
itself a citizen request. Existing citizen pages separately display reports,
orders and appointments. Report details already render the event timeline and
reject access by another author. The home page only previews active reports
and orders. The legacy `/demandes` route previously redirected to reports.

Creation and status changes already exist in `lib/services.ts` and server
actions under `lib/actions/`. The `/api/requests` handler already scopes its
citizen GET response by session author. D11 adds a server-rendered read view;
these APIs, actions, transitions and authentication rules remain unchanged.

## Implementation

- `/citizen/requests` lists all five kinds together, newest creation first,
  including resolved, closed and cancelled records.
- Each card shows kind, subtype where relevant, title, reference, creation
  date, readable current status, recorded steps and last update.
- Request and report timelines use only stored events. Other kinds show their
  creation and current state with an explicit history limitation; no intermediate
  steps or status-change dates are inferred.
- Report links reuse the existing detail route. The other kinds have read-only
  details at `/citizen/requests/[kind]/[id]`, using the same card component.
- A navigation entry, the home page's "see all" link and `/demandes` point to
  the unified view. Existing creation and processing pages remain available.
- All data reads are constrained by the authenticated citizen's identifier.
  An empty identifier is rejected. Detail lookup only considers that citizen's
  records; missing, invalid and foreign records return a not-found page.
- Loading, empty and error states are localized; errors offer a retry button.

No schema, migrations, application database, dependencies, API handlers or
business actions were changed.

## Verification

The local application's database is missing the existing Appointment table.
Testing therefore uses a disposable PostgreSQL container with the repository's
existing migrations and seed, plus isolated fixtures for two additional citizens.
The application database is not migrated or seeded by this work.

The build command in package.json also runs migrations and seeding. Use
`npx --no-install next build` for a code-only build, and
`npx --no-install tsc --noEmit` for type checking. No lint or test script is
configured in package.json; Next.js explicitly skips linting.

Results:

- Client generation from the unchanged schema, TypeScript checking and the
  code-only production build passed.
- Chrome/Playwright checked all 17 seeded citizen records and all 17 detail
  links, newest-first ordering, persisted history and notes, the empty state,
  and French/English/Spanish copy.
- Anonymous and staff access were redirected. All five foreign-record detail
  URLs, the existing foreign report detail and an invalid kind were rejected.
  The second citizen saw only their five records.
- Existing citizen home, reports, orders, appointments and report creation,
  plus public services and contact, returned HTTP 200. No client runtime errors
  occurred during these checks.
- At 320px viewport width, including 200% root text size, the dashboard had no
  horizontal overflow. An axe-core audit of its main content reported zero
  WCAG 2 A/AA and 2.1 A/AA violations.
- A temporary database failure displayed the localized error. After restoring
  the test database, the retry button refreshed the server data and recovered
  all 17 records without a manual page reload.

## Limitations

- Orders, appointments and contact messages do not retain intermediate status
  events. D11 displays the available facts instead of inventing an audit trail.
- Anonymous contact messages have no account ownership and are excluded.
- Updates become visible on navigation or page reload; no polling was added.
- Lists load all owned records. Pagination can be added if real usage requires it.
- The existing appointment migration must be applied in environments where it
  is still pending before the dashboard can read appointments.
