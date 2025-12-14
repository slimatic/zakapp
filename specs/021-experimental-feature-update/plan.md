# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Make asset modifier state (Passive 30% and Restricted 0%) highly visible and editable in the UI, provide server-suggested defaults, persist modifier state on the `Asset` model, and replace Yearly Snapshots with `NisabRecord` for historical preservation. Deliverables: DB migrations, API contract changes, frontend asset dialog updates (visible checkbox under value, live preview), tests, and docs.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: Node.js 18+ (TypeScript)
**Primary Dependencies**: Express, Prisma, React (frontend)
**Storage**: SQLite in dev (Prisma); plan supports Postgres for prod
**Testing**: Jest, React Testing Library, Supertest
**Target Platform**: Linux server / Docker Compose
**Project Type**: Web application (frontend + backend)
**Performance Goals**: Page loads <2s on reference hardware; modifier recalculation preview local debounce ≤150ms
**Constraints**: Must retain AES-256 encryption for sensitive data; do not expose encrypted fields in logs
**Scale/Scope**: Typical user counts supported by existing app; design for efficient queries with modifier indexing

## Constitution Check

GATE: Passed — feature aligns with constitutional principles: privacy & encryption preserved, spec-driven approach followed, and educational content required by Principle V retained. See `.specify/memory/constitution.md` for details.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
# [REMOVE IF UNUSED] Option 1: Single project (DEFAULT)
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

# [REMOVE IF UNUSED] Option 2: Web application (when "frontend" + "backend" detected)
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/

# [REMOVE IF UNUSED] Option 3: Mobile + API (when "iOS/Android" detected)
api/
└── [same as backend above]

ios/ or android/
└── [platform-specific structure: feature modules, UI flows, platform tests]
```

**Structure Decision**: Web application with `server/` backend and `client/` frontend (existing repo layout). Backend changes in `server/src/services` and Prisma schema; frontend changes in `client/src/components` and `client/src/services`.

## Artifacts Generated

- Research: `/home/agentx/github-repos/zakapp/specs/021-experimental-feature-update/research.md`
- Data model: `/home/agentx/github-repos/zakapp/specs/021-experimental-feature-update/data-model.md`
- Quickstart: `/home/agentx/github-repos/zakapp/specs/021-experimental-feature-update/quickstart.md`
- API contract: `/home/agentx/github-repos/zakapp/specs/021-experimental-feature-update/contracts/asset-api.md`
- Tasks: `/home/agentx/github-repos/zakapp/specs/021-experimental-feature-update/tasks.md`

## Progress Tracking

Phase 0 (research): Complete — `research.md` generated
Phase 1 (data model & contracts): Complete — `data-model.md`, `contracts/asset-api.md` generated
Phase 2 (tasks): Complete — `tasks.md` generated

Next: Implement backend migrations, API changes, and frontend UI updates (Phase 3 execution outside this plan generation step).

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
