# Archive

Superseded and completed-work documents, kept for provenance.

`docs/README.md` states the policy: *"Archive old docs — historical docs are recorded in
git history rather than kept as live files."* These stay in the tree rather than being
deleted because each records a **reasoning trail** that is still worth reading; they are
simply no longer the current statement of anything.

Nothing here is maintained. If a document in this directory disagrees with one outside it,
the one outside it is correct.

## `superseded-by/` — replaced by a current document

| Archived | Current document |
|---|---|
| `OFFLINE_CACHING_STRATEGY.md`, `PWA_IMPLEMENTATION.md` | `docs/pwa-guide.md` |
| `QUICK_ENV_SETUP.md` | `docs/ENVIRONMENT_VARIABLES.md` |
| `SQL_INJECTION_PREVENTION.md`, `SECURITY_SCAN.md`, `security.md` | `SECURITY.md` |
| `ZK_EXECUTIVE_BRIEFING.md` | `docs/ARCHITECTURE.md` |
| `ZK_API_SPECIFICATION.md` | `docs/api/api-specification.md` |
| `project-structure.md`, `architecture/architecture.md` | `AGENTS.md` (repository map), `docs/ARCHITECTURE.md` |
| `reports/DEVELOPER_ONBOARDING.md`, `reports/DEVELOPMENT.md`, `reports/DEVELOPMENT_SETUP.md` | `CONTRIBUTING.md`, `AGENTS.md`, `docs/testing.md` |
| `FAQ.md` | `docs/troubleshooting-faq.md` |
| `usability-test-scenarios.md` | `superseded/testing/` (manual), `docs/testing.md` (automated) |
| `tracking-user-guide.md` | `docs/user-guide/` |
| `guides/MANUAL_TESTING_GUIDE.md`, `manual-testing/` | `docs/testing.md`; per-feature checklists no longer maintained |
| `guides/PHASE2_PRODUCTION_SETUP_GUIDE.md`, `guides/PORT_CONFIGURATION_GUIDE.md` | `docs/deployment-guide.md`, `docs/guides/PORT_CONFIGURATION.md` |
| `release-cycle.md` | `docs/RELEASE-CADENCE.md` |
| `zakat-methodologies-implementation-summary.md` | `docs/methodology-guide.md` |
| `api/calculations.md`, `api/calendar.md` | `docs/api/api-specification.md`, `docs/dev/calendar-system.md` |
| `roadmap.md`, `development-plan.md`, `tasks.md` | `ROADMAP.md` |
| `accessibility.md` | `docs/ARCHITECTURE.md` § Accessibility |
| `guides/CLOUDFLARE_TUNNEL_QUICK.md` | `docs/guides/CLOUDFLARE_TUNNEL_SETUP.md` (quick path) |
| `reports/*.md`, `completion-reports/*` | `CHANGELOG.md`, `ROADMAP.md` |

## `plans/`, `reports/`, `performance/` — completed work

Phase and milestone plans whose work has shipped, milestone completion reports, and
performance-test summaries from a finished phase.

## Reading an archived document

Two things are true of nearly everything here and cause misreadings if forgotten:

- **Its numbers are from the date on it.** A completion report saying "92% (69/75 tasks)"
  is a snapshot, not a status.
- **Its version references are historical.** An archived doc naming v0.15 or v0.17.2 is
  describing a release that has since moved on.
