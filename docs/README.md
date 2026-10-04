# Documentation

Index of the project documentation.

| Document | Contents |
| --- | --- |
| [`../AGENTS.md`](../AGENTS.md) | AI coding agent brief — mission, stack, features, data model, roadmap, demo |
| [`PROJECT.md`](PROJECT.md) | Product & architecture overview — roles, routes, data model, security, conventions |
| [`TUTORIAL.md`](TUTORIAL.md) | Complete tutorial by type of user — walkthroughs, permissions, demo script (mirrors `/guide`) |
| [`NEEDS.md`](NEEDS.md) | Competition needs — the fetch script, the Webcup API and how needs are tracked |
| [`F69_security.md`](F69_security.md) | F69 — sensitive-data protection: access control, neutralisation, error hygiene, audit trail |
| [`F69_justification.md`](F69_justification.md) | F69 — submission-format answer (what was built / where to test / how to verify, in French) |
| [`F81_forms_anti_bot.md`](F81_forms_anti_bot.md) | F81 — anti-bot protection for public forms: honeypot, signed challenge, replay ledger, rate limits, traces |
| [`TODO_terra_nova.md`](TODO_terra_nova.md) | **Auto-generated** needs checklist (do not edit by hand) |
| [`CLOSED_ISSUES.md`](CLOSED_ISSUES.md) | Snapshot of the closed GitHub issues, with the need code each one covers |
| [`CLOSED_ISSUES_FORMS.md`](CLOSED_ISSUES_FORMS.md) | **Jury evidence forms** (FR) — one pre-filled form per closed issue |
| [`../README.md`](../README.md) | Quick start for the repository |

## Scope

The scope is defined by the **competition needs** published by the 24h Webcup API. They are fetched
with [`scripts/fetch_new_features.py`](../scripts/fetch_new_features.py) and written to
[`TODO_terra_nova.md`](TODO_terra_nova.md). See [`NEEDS.md`](NEEDS.md) for the full workflow.

## Refreshing the needs

```fish
set -x WEBCUP_API_KEY "<your-key>"
python3 scripts/fetch_new_features.py
```

Run this **from the repository root** whenever a new wave of needs is released, then reconcile the
roadmap in [`AGENTS.md`](../AGENTS.md).
