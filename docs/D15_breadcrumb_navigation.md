# D15 — Breadcrumb navigation

## Existing architecture

The Next.js 14 App Router application has a public layout, an authentication
layout, and citizen, operations, council and developer layouts. Citizen,
operations, council and developer pages share `ConsoleShell`. Public list and
form pages share `PageHeader`. Public and console navigation already use
Next.js links and the active pathname.

There was no breadcrumb component or route hierarchy registry. Detail pages
already had back links; these remain available. Dynamic routes already load
service names, announcement titles, report titles and request subjects before
rendering, including their existing publication and access checks.

French, English and Spanish dictionaries are supplied through `LocaleProvider`.
Stored municipal content keeps its original language. Breadcrumbs reuse these
existing dictionaries and stored titles.

## Implementation and coverage

`lib/breadcrumbs.ts` is the single explicit hierarchy registry. It maps known
routes to existing readable dictionary labels, rather than decoding URL segments.
`Breadcrumbs` renders a named navigation landmark with an ordered list,
keyboard-accessible ancestor links, decorative separators hidden from assistive
technology, and a non-clickable current page marked `aria-current="page"`.
The trail wraps on small screens and does not truncate titles.

Automatic integration points:

- `PageHeader`: services, announcements, contact and appearance.
- `ConsoleShell`: citizen reports, report creation, orders, wallet, request
  tracking, appointments, appointment booking, map and notifications; the six
  operations stations; council services, announcements and users.

Dynamic pages use the same component with one `currentLabel` property:

- `/services/[slug]`: the published service name.
- `/announcements/[slug]`: the published announcement title.
- `/citizen/reports/[id]`: the authorised report title.
- `/citizen/requests/[kind]/[id]`: the authorised tracked record title.
- `/operations/{security,medical,maintenance}/[id]`: the report title supplied
  from the shared `ReportDetailView`.
- `/operations/administration/[id]`: the request subject.

The shell's breadcrumb remains hidden on dynamic routes, so only the page's
title-aware instance is shown. No additional record query is performed.
Request kinds are not rendered as intermediate levels because those URLs do
not have standalone pages. Report creation links back to the reports list;
appointment booking links back to appointments.

Public, citizen and council home pages, authentication pages, redirect aliases,
unknown paths and the developer panel do not receive a breadcrumb. Operations
station pages show their service context with a link back to the public home.
Unknown paths are never converted into technical labels or invented parent links.

Only the navigation landmark name was added to the three dictionaries. All
other static labels already existed. Business logic, database, Prisma schema,
API handlers, authentication, global styles and dependencies are unchanged.

## Verification

- `node --import tsx --test tests/breadcrumbs.test.ts`: all five tests passed,
  covering dynamic titles, missing titles, real parent links, localization,
  excluded/unknown paths and trailing slashes.
- `npx --no-install tsc --noEmit`: passed.
- `npx --no-install next build`: passed, including type checking.
- `git diff --check`: passed.
- Chrome/Playwright verified 52 page checks across public, citizen, six staff
  roles and council navigation, with exactly one breadcrumb per relevant page,
  valid ancestor links and a non-clickable current page.
- Keyboard navigation followed service and request ancestor links using Enter;
  visible focus and breadcrumb updates after client navigation were checked.
- French, English and Spanish navigation labels updated while the stored title
  remained unchanged.
- A long service title was inspected at 320px viewport width with 200% root text
  size: the breadcrumb wrapped without horizontal overflow or clipped content.
- An axe-core audit of the breadcrumb reported zero WCAG 2 A/AA and 2.1 A/AA
  violations. No client runtime errors occurred in the browser checks.

No lint script is configured; Next.js skips linting. `npm run build` also runs
migrations and seeding, so the code-only Next.js build was used instead.

The application's local database still lacks the existing Appointment table.
Browser checks therefore used a disposable PostgreSQL database with the existing
migrations and seed. That database and its test server were removed afterward;
the application's database was not modified.

## Remaining checks and maintenance

Speech and announcement behaviour still needs a manual VoiceOver or NVDA check.
New routes should be registered in `lib/breadcrumbs.ts`; dynamic pages supply
their title after their existing access checks. The developer panel is outside
this citizen navigation feature's scope. The existing appointment migration is
still required in environments where it has not been applied.
