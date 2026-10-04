# Needs & feature tracking (24h Webcup)

The Webcup publishes its **needs** (« besoins ») through a REST API. Each need is one feature to
deliver — written in French — with a code, a difficulty and an XP reward. This document explains how
we fetch them, where they are tracked, and how to refresh them during the event.

## TL;DR

```fish
# from the repository root
set -x WEBCUP_API_KEY "<your-key>"
python3 scripts/fetch_new_features.py   # prints the TODO and writes docs/TODO_terra_nova.md
```

or, with the bundled wrapper (it sets the key for you):

```bash
bash fetch_new_fetaures.sh
```

## Files involved

| Path | Role |
| --- | --- |
| `scripts/fetch_new_features.py` | Fetches the visible needs and generates the TODO |
| `fetch_new_fetaures.sh` | Convenience wrapper that sets `WEBCUP_API_KEY` then runs the script (mind the typo in the filename) |
| `docs/TODO_terra_nova.md` | **Generated** checklist grouped by difficulty — do not edit by hand |
| `docs/NEEDS.md` | This document |

## Prerequisites

- **Python 3.9+**
- The `requests` package: `pip install requests`
- A Webcup API key, provided via the `WEBCUP_API_KEY` environment variable

## How to run

The script **must be run from the repository root** — it checks for the `docs/` and `scripts/`
directories and aborts otherwise.

### Option A — explicit environment variable (recommended)

```fish
set -x WEBCUP_API_KEY "xxxxx"
python3 scripts/fetch_new_features.py
```

```bash
# bash / zsh
export WEBCUP_API_KEY="xxxxx"
python3 scripts/fetch_new_features.py
```

### Option B — wrapper script

```bash
bash fetch_new_fetaures.sh
```

> ⚠️ `fetch_new_fetaures.sh` currently **hard-codes the API key**. Prefer Option A, or move the key
> to `.env` (git-ignored) so it is not committed. See `.env.example`.

## What the script does

1. Reads `WEBCUP_API_KEY` from the environment; raises if it is missing.
2. `GET https://24h.webcup.fr/wp-json/webcup/v1/requests` with the `X-Webcup-Api-Key` header.
3. Groups the returned requests by their `difficulty` field.
4. Sorts difficulties using `DIFFICULTY_ORDER` (`Facile` → `Moyenne` → `Difficile` → `Expert`); unknown
   difficulties sort last.
5. For each need, emits `- [ ] **<code>** (<xp> XP) – <summary>`:
   - known codes use the French summary from `SUMMARY_KEYWORDS`;
   - unknown codes fall back to the first 80 characters of `message_public`.
6. Totals the XP and appends `**Total XP disponibles :** <n> XP`.
7. Writes the result to `docs/TODO_terra_nova.md`.

## Generated output (shape)

```markdown
# TODO list – Besoins Nova Terra

## Facile

- [ ] **D01** (250 XP) – Inscription / création de compte habitant
- [ ] **D03** (250 XP) – Connexion + espace personnel
…

**Total XP disponibles :** 3750 XP
```

## Competition API reference

- **Base URL:** `https://24h.webcup.fr/wp-json/webcup/v1`
- **Endpoint:** `GET /requests`
- **Header:** `X-Webcup-Api-Key: <key>`
- **Response:** `{ "api_version", "session", "requests": [ … ] }`

### `session` object

| Field | Meaning |
| --- | --- |
| `status` | Session status (e.g. `active`) |
| `is_running` | Whether the competition is currently running |
| `current_wave` | Wave currently open |
| `elapsed_minutes` | Minutes since the event started |
| `visible_requests_count` | Needs currently visible |
| `initial_requests_count` | Needs visible from the start |
| `wave_requests_count` | Needs added by the latest wave |
| `next_wave_number` | Number of the next wave |
| `minutes_until_next_wave` | Countdown to the next wave |

### `requests[]` item

| Field | Meaning |
| --- | --- |
| `request_code` | Need code (`D01`, `F22`, …) |
| `requester_name` / `requester_type` | Who issued the need (institution) |
| `message_public` | Public, French description of the need |
| `difficulty` / `difficulty_level` | `Facile` (1) → `Moyenne` (2) → `Difficile` (3) → `Expert` (4) |
| `group_name` | Thematic group (current needs are all `Socle`) |
| `xp_base`, `xp_time_bonus`, `xp_total`, `xp_available` | XP values (`xp_available = xp_base + xp_time_bonus`) |
| `is_initial` | Visible from the start of the event |
| `wave_number` / `visible_since_wave` | Wave that revealed the need |
| `is_ai_request` / `is_ai_related` | AI-related flags |
| `sort_order` | Suggested ordering |

### Waves

Needs are released in **waves** during the 24 h. After a wave drops (watch `minutes_until_next_wave`),
re-run the script and reconcile the roadmap in `AGENTS.md`.

## Current needs

All currently visible needs belong to the **Socle** group (the foundation).

| Code | XP | Difficulty | Issued by | Summary |
| --- | --- | --- | --- | --- |
| `D01` | 250 | Facile | Haut Conseil de la Ville | Inscription / création de compte habitant |
| `D03` | 250 | Facile | Direction des Services Municipaux | Connexion + espace personnel |
| `D04` | 250 | Facile | Service des Relations Citoyennes | Contact administration (formulaire + accusé) |
| `D05` | 250 | Facile | Mairie de Nova Terra | Présentation des services municipaux |
| `D06` | 250 | Facile | Mairie de Nova Terra | Publications / annonces municipales |
| `F22` | 250 | Facile | Centre technique municipal | Vue des demandes habitants avec états |
| `D07` | 500 | Moyenne | Mairie de Nova Terra | Page d'accueil claire et hiérarchisée |
| `D08` | 500 | Moyenne | Direction des Services Municipaux | Rôles : citoyen / agent / admin |
| `D09` | 500 | Moyenne | Direction des Services Municipaux | Permissions / accès différenciés |
| `D19` | 750 | Difficile | Direction du Numérique | Espace agents avec vue sur les données API |

**Total: 3750 XP**

## Where each need lands in the app

| Need | Feature | Where |
| --- | --- | --- |
| `D01` | Sign-up | `app/(auth)/register/page.tsx` |
| `D03` | Login + personal space | `app/(auth)/login`, `app/(citizen)/espace` |
| `D04` | Contact + acknowledgement | `app/(public)/contact`, `app/api/contact` |
| `D05` | Municipal services directory | `app/(public)/services` |
| `D06` | Announcements / publications | `app/(public)/announcements` |
| `D07` | Hierarchical home page | `app/(public)/page.tsx` |
| `D08` | Roles | `prisma/schema.prisma` (`Role`), `lib/auth.ts` |
| `D09` | Permissions | `lib/permissions.ts`, `middleware.ts`, API guards |
| `D19` | Agent workspace | `app/agents` |
| `F22` | Requests view with statuses | `app/agents/demandes` |
| `F71` | New-arrivals onboarding — accounts without email, fr/en/es, simple copy | `app/(public)/arrivants`, `lib/identity.ts`, `components/forms/{Register,Login}Form.tsx` |

## Troubleshooting

| Symptom | Cause / fix |
| --- | --- |
| `Please set the WEBCUP_API_KEY environment variable.` | The env var is not set in the current shell. |
| `Error: This script must be run from the root of the project directory.` | Run it from the repository root (it needs `docs/` and `scripts/`). |
| `ModuleNotFoundError: No module named 'requests'` | `pip install requests` |
| HTTP 401/403 | Invalid or expired API key. |
| The TODO does not change after a run | The need may already be listed, or the next wave has not dropped yet (`session.minutes_until_next_wave`). |

## Extending the script

- Add nicer French summaries to `SUMMARY_KEYWORDS` when a new need code appears.
- If the API introduces a new difficulty, add it to `DIFFICULTY_ORDER` — unknown values still sort last
  (weight `99`), so nothing breaks.

## Developer panel (web UI)

The same needs can be worked from the app instead of the Markdown list: `/dev/tickets` imports them
as tickets, keeps a local workflow status (`TODO` / `IN_PROGRESS` / `BLOCKED` / `REVIEW` / `DONE`),
supports assignment and comments, and re-synchronises on demand — see
[`PROJECT.md`](PROJECT.md) § 11. It requires `WEBCUP_API_KEY` and mirrors the summaries used by the
script (`lib/ticket-status.ts` ↔ `SUMMARY_KEYWORDS`).
