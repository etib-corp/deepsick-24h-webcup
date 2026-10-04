# F65 — Citizen participation: consultations on city decisions

## Scope

The High Council can open a city decision to residents' feedback. Participation
must be simple, leave a clear trace, and the outcome must stay readable once the
consultation closes.

## Journeys

| Step | Route | Who |
| --- | --- | --- |
| Open / publish / close a consultation, record its outcome | `/council/consultations`, `/council/consultations/[id]` | COUNCIL |
| Read opinions and the opinion summary (contributions anonymised when required) | `/operations/administration/consultations/[id]` | COUNCIL, ADMIN_AGENT |
| Discover open & closed consultations, express one opinion, read the outcome | `/citizen/consultations`, `/citizen/consultations/[slug]` | CITIZEN |
| Find one's past contributions with their reference | `/citizen/contributions` | CITIZEN |

## Acceptance criteria

- **A consultation can be opened on a decision.** `ConsultationForm` creates a
  published, `OPEN` consultation (title, lead-in, context, optional schedule).
- **A citizen can express an opinion.** `OpinionForm` records a stance
  (`SUPPORT` / `OPPOSE` / `NEUTRAL`) and a comment. Only `CITIZEN` sessions can
  submit, only while the consultation is `OPEN` and published (`submitOpinionAction`).
- **The citizen receives a trace.** The submission returns a reference
  (`OPN-5xx`) shown in the confirmation alert, on the consultation page and in
  `/citizen/contributions`.
- **A consultation can be closed and its outcome is readable.** The Council
  closes it from the list; `ConsultationOutcomeForm` (Council detail page only)
  writes the public outcome. Citizens see it in a highlighted card on the
  consultation page and as a “Result available” badge in the list.
- **A citizen cannot take part twice.** `@@unique([consultationId, authorId])`;
  `upsertOpinion` edits the existing contribution instead of creating a second
  one (same reference). Closed consultations no longer accept submissions
  (server-side check in `submitOpinionAction`).
- **Contributions are anonymised where the consultation requires it.** The
  `anonymous` flag is set when the Council creates the consultation. Staff views
  (`ConsultationOpinions`) then render “Anonymous contribution” instead of the
  author's name; the citizen still sees their own contribution and an
  “Anonymous consultation” notice.
- **Closed consultations remain consultable.** They stay in the published list
  with their outcome, description and the citizen's own read-only contribution.

## Data model

`Consultation` gains `anonymous: Boolean @default(false)` and
`outcome: String? @db.Text` (migration
`20261004150000_consultation_outcome_anonymity`). Opinions keep their
`authorId` (required for the one-per-citizen rule and the citizen's own trace);
anonymity is applied at rendering time in staff views.

## Server-side enforcement

- `submitOpinionAction`: `CITIZEN` role, published consultation, `OPEN` status.
- `setConsultationOutcomeAction`: `COUNCIL` role only.
- `createConsultationAction` / status / publish / delete actions: `COUNCIL` only.
- Middleware protects `/citizen`, `/council` and `/operations` prefixes.
