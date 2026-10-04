# D16 — Request submission confirmation

## Existing submission paths

| Citizen form | Route | Action | Previous success behavior |
| --- | --- | --- | --- |
| Contact | `/contact` | `contactAction` | Replaced the form with a focused success alert and tracking reference |
| Incident report | `/citizen/report` | `createReportAction` | Redirected to `/citizen/reports?cree=1` |
| Taxi / food order | `/citizen/orders` | `createOrderAction` | Redirected to the same page with `?cree=1`, retaining a submission form |
| Appointment | `/citizen/appointments/nouveau` | `createAppointmentAction` | Redirected to `/citizen/appointments?cree=1` |

All four already had disabled pending buttons and localized loading labels.
`Alert` already supported error announcements, a success status role and focus.
The application also has a Sonner toaster, but a persistent existing alert is
better suited to a receipt which users need to read and retain.

The three redirected creation alerts trusted a URL flag without evidence of a
successful submission. Contact already provided a suitable receipt.

`/api/contact` and `/api/requests` already return HTTP 201 and a reference after
creation. No citizen component currently mounts the legacy `createRequestAction`;
the `/demandes` route redirects to tracking. No new form was invented. Account
registration and administrative content/status forms are outside this ticket.

> Since F81, `/api/contact` additionally requires the invisible anti-bot
> challenge (`nt-challenge` + empty `website` fields, see
> [`F81_forms_anti_bot.md`](F81_forms_anti_bot.md)); the success contract is
> unchanged.

## Implementation

Report, order and appointment actions now return `ok: true` and the saved
reference only after successful creation. Errors retain their existing feedback;
appointment availability-query failures are now caught as submission errors too.
Existing role checks, validation rules, creation services and revalidation remain.

The successful form is replaced by a shared confirmation built with the existing
`Alert`: localized receipt title, reference, guidance against resubmission and a
link to the appropriate tracking page. The alert receives focus and has
`role="status"`. Contact retains its existing accessible confirmation.

All four forms share a synchronous submit-event lock. It blocks repeated clicks,
Enter submissions and immediate repeated submit events before React's pending
render. Existing pending buttons/loading labels remain. The lock releases when
the submission settles, allowing retry after validation or storage failure.

Creation alerts based solely on `?cree=1` were removed. Existing appointment
cancellation and reminder alerts remain unchanged. The order receipt links to
`/citizen/requests`; returning to orders then starts a fresh, intentional request.

## Exact changed files

| File | Reason |
| --- | --- |
| `components/forms/SubmissionForm.tsx` | Shared immediate submit lock and release after settlement |
| `components/forms/SubmissionConfirmation.tsx` | Shared localized, focused receipt using the existing alert |
| `components/forms/ContactForm.tsx` | Apply the shared lock while keeping the existing receipt |
| `components/colony/ReportForm.tsx` | Apply the lock and replace a successful form with its receipt |
| `components/colony/OrderForm.tsx` | Apply the lock and show a receipt linking to centralized tracking |
| `components/colony/AppointmentForm.tsx` | Apply the lock and replace a successful form with its receipt |
| `lib/actions/reports.ts` | Return the saved reference instead of redirecting to a URL flag |
| `lib/actions/orders.ts` | Return the saved reference instead of redirecting to a URL flag |
| `lib/actions/appointments.ts` | Return the saved reference and catch availability-query failures |
| `app/citizen/reports/page.tsx` | Remove the URL-only creation confirmation |
| `app/citizen/orders/page.tsx` | Remove the URL-only creation confirmation |
| `app/citizen/appointments/page.tsx` | Remove the URL-only creation confirmation, retaining other feedback |
| `lib/i18n/dictionaries/fr.ts` | French receipt title, reference label and resubmission guidance |
| `lib/i18n/dictionaries/en.ts` | Matching English translations |
| `lib/i18n/dictionaries/es.ts` | Matching Spanish translations |
| `docs/TODO_terra_nova.md` | Mark D16 implemented |
| `docs/D16_submission_confirmation.md` | Document analysis, changes, verification and limitations |

No Prisma schema, migration file, API, dependency or application database was changed.
No commit or push was made.

## Verification

- `npx --no-install tsc --noEmit`: passed.
- `npx --no-install next build`: final build passed, including type checking.
- `git diff --check`: passed.
- No unit-test or lint script is configured; Next.js lint is explicitly skipped.
- Browser checks used the final production build and a disposable MySQL database,
  initialized from the existing schema and demo seed. Temporary triggers simulated
  storage failures without changing application code or the project database.
- All four forms were checked in FR/EN/ES (12 submission paths): storage failure
  showed an error with no receipt or created record; retry succeeded; two immediate
  submit events plus a third during a delayed POST produced one POST and one record;
  the form disappeared and the focused receipt contained the saved reference.
- Receipt links led to saved records. The final order link was checked in all three
  languages with keyboard navigation at 375px; returning to orders exposed a fresh form.
- Validation failure allowed a successful retry.
- `/citizen/reports?cree=1`, `/citizen/orders?cree=1` and
  `/citizen/appointments?cree=1` did not produce creation receipts.
- Existing appointment cancellation was checked after the changes.

The full `npm run build` was checked against a separate empty disposable database.
Its migration step fails with P3015 because this workspace contains an empty
`prisma/migrations/20261003210000_broadcast_messages` directory without
`migration.sql`. It was left unchanged as migrations are outside D16. The Next.js
build passes independently. Temporary server and database container were stopped
after verification.

## Manual check and limits

### Old Docker image and order confirmation crash

The old Docker image serving port 3000 was reproduced with its embedded PostgreSQL
schema in a disposable environment. Submitting an order produced
`TypeError: Cannot read properties of undefined (reading 'message')`: the old
same-page redirect left `useFormState` with an undefined state, which its form
then dereferenced. That image predates D16 and does not mount the local source.

The current D16 action returns `{ ok: true, reference }` after creation instead
of redirecting. Actual taxi and food submissions in FR/EN/ES were also verified
under `next dev` with disposable MySQL data: all six receipts rendered successfully
without a client exception. A missing static resource logged an unrelated 404.

Running an old Docker image does not test local edits. Use the current development
server on a free port, with a real MySQL URL. A literal `HOST` placeholder in
`.env` cannot connect to a database. Rebuilding an image requires compatible
database configuration; do not replace an existing PostgreSQL database merely
to test the new interface.

Submit each form, check the received message/reference, then follow its tracking
link. Try rapidly clicking or pressing Enter during submission, and retry after
an error. A real screen-reader pass remains useful alongside focus/role checks.

This prevents accidental repeat submissions within a mounted, hydrated form.
It does not provide server-side idempotency across multiple tabs, manually repeated
requests or network replays. Reloading a creation page starts a fresh form; the
previous request remains in tracking. These limits do not require a new database
model for the requested confirmation behavior.
