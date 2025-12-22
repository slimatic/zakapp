---

description: "Tasks for Milestone 7 — Production Ready"
---

# Tasks: Milestone 7 — Production Ready

**Input**: `/specs/025-milestone-7-production/` (spec.md, plan.md, research.md, data-model.md, quickstart.md)
**Prerequisites**: `spec.md`, `plan.md`, `research.md`, `data-model.md`, `quickstart.md`

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Task can run in parallel (different files, no dependency)
- Use exact file paths where applicable

---

## Phase 1: Setup (Shared Infrastructure) — BLOCKING

- [ ] T001 [P] [Setup] Review and re-enable CI workflows
  - Files: `.github/workflows/*.yml.disabled`
  - Action: Inspect each `.disabled` workflow, re-enable the ones for `test.yml` and `security-scan.yml` with necessary updates (secrets, job names). Create PR with commits under branch `025-milestone-7-production`.
  - Verification: `gh workflow run` for `test.yml` succeeds on a test branch.

- [ ] T002 [P] [Setup] Add/standardize Dependabot/Snyk config
  - Files: `.github/dependabot.yml` or `security/` config
  - Action: Add Dependabot config (or Snyk integration) to keep dependencies updated and create a baseline PR.
  - Verification: Dependabot PR appears within 24 hours for vulnerable deps.

- [ ] T003 [P] [Setup] Add image signing prototype in CI (cosign)
  - Files: `.github/workflows/cosign-sign.yml` (new), `scripts/cosign-sign.sh` (new)
  - Action: Implement a GH Action job that builds the Docker image, pushes to registry (use test registry), and runs `cosign sign` using ephemeral key or sigstore provider. Store sample signed image metadata in `specs/025-milestone-7-production/research.md`.
  - Verification: `cosign verify` returns valid signature for test image.

- [ ] T004 [P] [Setup] Create `deploy/` and `charts/` directories and initial k8s/Helm skeleton
  - Files: `deploy/README.md`, `deploy/helm/chart/Chart.yaml`, `deploy/helm/templates/deployment.yaml`
  - Action: Add skeleton Helm chart and document `deploy/` layout in `deploy/README.md`.
  - Verification: `helm lint deploy/helm` returns OK.

- [ ] T005 [P] [Setup] Ensure Docker Compose examples are authoritative and documented
  - Files: `docker-compose.yml`, `specs/025-milestone-7-production/quickstart.md`
  - Action: Verify `docker-compose.yml` runs locally; add notes to `quickstart.md` for developer steps.
  - Verification: `docker compose up -d` starts services locally on developer machine.

---

## Phase 2: Foundational (Blocking prerequisites for user stories)

- [ ] T010 [ ] [FR-001/FR-002] Implement SCA + SAST + secret scanning in GitHub Actions
  - Files: `.github/workflows/security-scan.yml` (enabled/updated)
  - Action: Add jobs for `npm audit`, Dependabot alerts processing, and a SAST step (ESLint/TS checks). Add secret-scanning pre-commit hooks or GH secret scanning configuration.
  - Verification: Security job runs on PR and reports findings; critical findings block merge.

- [ ] T011 [ ] [FR-003] Integrate `cosign` image signing into release pipeline (production path)
  - Files: `.github/workflows/release.yml` (update), `scripts/cosign-sign.sh`
  - Action: Add steps: build image, run tests, push image, cosign sign, publish release manifest (ReleaseArtifact metadata stored as artifact or Git tag annotation).
  - Verification: Release pipeline produces signed image and `ReleaseArtifact` metadata artifact.

- [ ] T012 [P] [FR-004] Add periodic load test pipeline (k6)
  - Files: `.github/workflows/load-test.yml`, `performance/k6/script.js`
  - Action: Add GH Action that runs k6 against staging and uploads results as artifacts; store trend output under `artifacts/load-tests/`.
  - Verification: k6 run completes and artifact contains `summary.json` with p95/p99 measurements.

- [ ] T013 [ ] [FR-005/FR-006] Add deployment pipeline with canary/rollback strategy
  - Files: `.github/workflows/deploy.yml`, `deploy/helm/templates/` (canary hooks), `scripts/rollback.sh`
  - Action: Implement pipeline that deploys to staging, runs smoke tests, and supports promotion to production; implement automated rollback step triggered on smoke test failure.
  - Verification: Simulate failing smoke tests and verify rollback restores previous deployment.

- [ ] T014 [ ] [FR-007] Provision monitoring stack manifests and alert rules (Prometheus + Grafana + Loki)
  - Files: `deploy/monitoring/` (prometheus rules, grafana dashboards, loki config)
  - Action: Add manifests/Helm values to deploy Prometheus/Grafana/Loki in staging; add example SLO dashboards (p95 latency panels) and alert rules for error rate.
  - Verification: After deploying stack to staging, dashboards show metrics and test alerts trigger when thresholds exceeded.

- [ ] T015 [P] [FR-008] Implement backup snapshot scripts and DR runbook
  - Files: `scripts/backup.sh`, `scripts/restore.sh`, `docs/runbooks/dr-restore.md`
  - Action: Implement DB dump (encrypted) to archive location, document restore steps and test restore drill to validate RTO <4 hours.
  - Verification: A restore from recent snapshot completes successfully in a test environment within RTO target.

- [ ] T016 [P] [FR-009/FR-010] Documentation and license readiness
  - Files: `README.md`, `docs/deployment.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `LICENSE`
  - Action: Update README quickstart, add deployment guides and runbooks, confirm MIT license or update if needed; add contribution and code-of-conduct files.
  - Verification: A reviewer can follow quickstart and run app locally; `LICENSE` is present at repo root.

---

## Phase 3: User Story implementations (P1/P2/P3)

### US1 — Production Security Hardening (P1)
- [ ] T020 [P] [US1] Run full SAST & dependency audit and triage critical/high issues
  - Files: results in `artifacts/security/` and issues created in issue tracker
  - Action: Triage and assign remediation tasks for critical and high vulnerabilities.
  - Verification: Critical issues resolved or have documented mitigations.

- [ ] T021 [ ] [US1] Harden runtime (helmet, rate-limiting, secure headers)
  - Files: `server/src/middleware/security.ts`, `server/src/app.ts`
  - Action: Add/verify `helmet`, `express-rate-limit`, CORS and other security middleware, validate in staging.
  - Verification: Security checks show appropriate headers and rate limiting enforced.

- [ ] T022 [P] [US1] Add secrets management integration guidance
  - Files: `docs/secrets.md`, examples for `Vault` or GitHub Secrets usage
  - Action: Document secrets lifecycle and example integration for production deployment.
  - Verification: No secrets stored in repo; secrets referenced via GitHub Secrets / Vault in deploy pipeline.

### US2 — Load & Performance Readiness (P1)
- [ ] T030 [P] [US2] Implement k6 scripts and integrate into CI flow (see T012)
  - Files: `performance/k6/` scripts and GH Action job
  - Action: Create test scenarios that approximate target load and measure p95/p99 latencies.
  - Verification: p95 < 500ms under target load in staging.

- [ ] T031 [ ] [US2] Instrument code with OpenTelemetry traces and Prometheus metrics
  - Files: `server/src/metrics.ts`, instrumentation in key handlers
  - Action: Add basic metrics (request duration, error counts) and traces for critical paths.
  - Verification: Metrics appear in Prometheus and can be graphed in Grafana.

### US3 — Deployment Automation & Rollback (P2)
- [ ] T040 [ ] [US3] Add smoke tests and automated promotion job
  - Files: `tests/smoke/*`, `.github/workflows/promote.yml`
  - Action: Implement smoke tests that validate core endpoints and wire them into the promotion step.
  - Verification: Promotion only occurs when smoke tests pass.

- [ ] T041 [ ] [US3] Implement image signing enforcement in deploy pipeline
  - Files: `deploy/helm/values.yaml` (policy), GH Actions `deploy.yml`
  - Action: Validate that only signed images are promoted; add verification step in pipeline.
  - Verification: Unsigned images are rejected by the promotion flow.

### US4 — Observability & Runbooks (P2)
- [ ] T050 [P] [US4] Create runbooks for common incidents (high latency, DB outage, failed deploy)
  - Files: `docs/runbooks/*.md`
  - Action: Draft runbooks with step-by-step remediation and playbook actions (pager steps, logs to check, rollback).
  - Verification: Runbook reviewed and validated by on-call engineer.

- [ ] T051 [ ] [US4] Add alert rules and escalation paths (PagerDuty/GH Issues integration)
  - Files: `deploy/monitoring/alerts/*.yaml`, `docs/oncall.md`
  - Action: Configure alert receivers and escalation policies; document steps for acknowledging and resolving.
  - Verification: Alerts are delivered to configured channel and can be acknowledged.

### US5 — Open-source Release & Documentation Cleanup (P3)
- [ ] T060 [P] [US5] Validate and tidy repository for OSS release
  - Files: `README.md`, `docs/`, `LICENSE`, `CONTRIBUTING.md`
  - Action: Ensure quickstart works (Docker Compose), update docs, run `repo-health` checklist.
  - Verification: External reviewer can run quickstart and open a simple PR.

- [ ] T061 [ ] [US5] Create release checklist and changelog automation
  - Files: `.github/release.yml`, `scripts/generate-changelog.sh`
  - Action: Automate changelog generation from commits and ensure release artifacts include signatures and changelog.
  - Verification: Release job creates a GitHub release with signed artifacts and changelog.

---

## Phase 4: Polish & Cross-Cutting Concerns
- [ ] T100 [P] Documentation updates and final validation (docs/)
- [ ] T101 [P] Performance optimizations identified from k6 runs
- [ ] T102 [P] Security hardening follow-ups and verification tests
- [ ] T103 [P] Run quickstart.md validation and update examples

---

## Execution Notes & Parallel Examples
- Parallel tasks example (can be executed simultaneously): `T001`, `T002`, `T003`, `T004`, `T005` (independent setup tasks).
- During Foundational (T010..T016): `T011` (cosign) and `T012` (k6) run in parallel where possible.
- Triage flow: `T020` (triage security issues) must complete before some `T021` fixes are merged.

## Agent Commands / How to run tasks
- Run CI workflow (example):

```bash
# run a GitHub Actions workflow locally or trigger via gh
gh workflow run test.yml --repo <owner/repo>
```

- Run k6 load test locally:

```bash
k6 run performance/k6/script.js
```

- Lint/format checks:

```bash
npm --prefix server run lint
npm --prefix client run lint
```

---

*End of tasks for Milestone 7.*