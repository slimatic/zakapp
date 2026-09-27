# Agent scaffolding — retired (2026-09-27)

## What this is

Four tool-scaffolding trees used during ZakApp's early build phase, removed from
the repository root to `archive/agent-scaffolding/` and then deleted from the
tracked tree. They are planning artifacts for tools, not documentation for
ZakApp: nothing a user, contributor, or operator needs lives here, and they were
tracked in a **public** repository.

| Directory | Tool | What it held |
|---|---|---|
| `.ralphy/` | ralphy loop runner | 8 PRD/task JSONs — hawl tracking, reconciliation job, test fixes, version update, diagnostics dashboard |
| `ralph/` | ralph runner | 2 PRDs — v0.9.2 encryption migration (7 tasks), v0.9.2 critical fixes (13 tasks) |
| `.sisyphus/` | sisyphus notepads | 6 planning docs — asset-history-ledger (plan, decisions, learnings, problems), sync/auth diagnostics, onboarding bug plan |
| `.github/prompts/` | GitHub Copilot prompts | spec-kit prompt templates (analyze, clarify, constitution, implement, plan, specify, tasks) + 10 `speckit.*` stubs |
| `tasks/` | — | 2 PRDs — critical fixes v0.9.2, prebuilt Docker images |

**Roughly 90% of the volume was a work queue already consumed.** The PRDs map to
work that shipped: the encryption migration, hawl tracking, the reconciliation
job, and the Docker image PRD (which became the published
`slimatic/zakapp-{backend,frontend}` images). What remains in them is a task
list whose tasks are done.

## The small part that was worth keeping

Three files carried knowledge rather than a queue. They are summarised here
rather than retained as files, because the value was the conclusion, not the
plan:

**Asset-history ledger — decisions (from `.sisyphus/notepads/asset-history-ledger/decisions.md`).**
It settled on a **hybrid event + snapshot** pattern: an append-only
`asset_amount_events` table for every change, plus periodic `asset_amount_snapshots`
for fast reads, rather than recomputing history from events on every query. Five
decisions were recorded — hybrid pattern, a two-date system, the event-type enum,
snapshot cadence, and encryption of the event payload. This is the design that
shipped as `20260518091255_add_asset_amount_history_prisma`.

**Asset-history ledger — known problems (from `problems.md`).** Four unresolved
issues were written down and are worth carrying forward, because they describe
weaknesses in what shipped rather than anything that got fixed:
1. `Asset.value` is updated directly while events are created separately — a
   failure between the two leaves them inconsistent.
2. Snapshots can go stale relative to the event log.
3. Performance is unproven at scale (the plan's own caveat).
4. Historical rows were never backported into the event log, so pre-existing
   assets have no event trail.

**Sync/auth diagnostics (from `.sisyphus/notepads/sync-auth-fixes/learnings.md`).**
Three CouchDB bugs with root causes identified: a double-slash URL, an RxDB DB8
database duplicated on init, and a sync token 500 traced to a CouchDB `/_users`
404. Also records a project convention that is already enforced elsewhere (the
AGPL header requirement).

**Nothing else was load-bearing.** The remaining files were per-task progress
logs (`[✓] 2026-02-06 23:35 - Fix all failing tests…`), task JSONs, and prompt
templates that any spec-kit install regenerates.

## Why delete rather than keep the archive

Salim's direction: keep the codebase as lean as possible, and agent scaffolding
should not be tracked in a public repo. Git history retains every file — this
document exists so the useful conclusions survive without the trees. If the
ralphy/ralph workflow is ever revived, `git log --diff-filter=D -- .ralphy`
recovers the original PRDs.

The one thing **not** to re-adopt wholesale is `.github/prompts/`: it is a
spec-kit template set, and 10 of its 16 files were one-line stubs pointing at an
external `speckit` command that is not installed here.
