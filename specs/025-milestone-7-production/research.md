# Research: Production Readiness (Milestone 7)

**Spec**: `/specs/025-milestone-7-production/spec.md`
**Branch**: `025-milestone-7-production`
**Date**: 2025-12-18

## Purpose
Gather evidence, tools, and constraints required for production readiness: security hardening, load/perf testing, deployment automation, monitoring, backup & restore, and open-source release readiness.

## Current State Summary
- Tech stack: Node.js + TypeScript (server), React + TypeScript (client), Prisma + SQLite (server), Docker-native development.
- CI: GitHub Actions present (many workflows disabled historically — see `.github/workflows/*.yml.disabled`).
- Containerization: Existing Dockerfiles under `/docker`; `docker-compose` examples exist in repo root (see `docker-compose.yml`).
- Testing: Jest unit/integration, Playwright e2e, existing test scripts in `package.json`.
- Observability: No production monitoring stacks currently included in repo; some configuration may exist in docs.
- Secrets/keys: Use of env vars and `.env` patterns; no central secrets manager configured yet.

## Tools & Options Evaluated
- SAST/SCA: GitHub Advanced Security (if org enabled), Snyk, Dependabot + `npm audit` for SCA; ESLint/TS checks for static issues.
- Secret scanning: GitHub secret scanning + pre-commit hooks (detect-secrets), repo scanning tools.
- Image signing: `cosign` (sigstore) for signing Docker images in CI.
- Monitoring: Prometheus + Grafana + Loki for metrics/logs (OSS stack) — selected per clarification.
- Backup: Periodic DB dumps (encrypted), object store snapshots for attachments; use `rclone` or cloud-native snapshots.
- Load testing: k6 or Artillery to run reproducible load tests in CI against staging.

## Gaps Identified (short)
- Disabled CI workflows need review and re-enabling (some are intentionally disabled: security-scan.yml.disabled, test.yml.disabled).
- No existing k8s manifests or Helm charts for production; Compose examples present but production orchestration missing.
- No documented runbooks or DR runbooks; backup and restore drills not present.
- Observability not materialized in repo; dashboards and alert rules not codified.
- No image signing integration in CI yet.

## Recommendations / Next Research Tasks
- Re-enable and update GitHub Actions for security scanning (SCA + SAST + secret scanning) and standardize on Dependabot or Snyk policies.
- Prototype image signing with `cosign` in a feature branch (build → sign → push flow in GH Actions).
- Create a staging k8s/Helm chart with deployable Prometheus+Grafana+Loki stack for integration testing.
- Add an automated periodic load test workflow (k6) that stores results in an artifact store and a trend dashboard.
- Draft DR runbook and schedule a drill (test restore from backup) to validate RTO <4 hours.

## Acceptance for Research Phase
- List of Approved Tools and Providers (SAST, SCA, image signing, monitoring) documented.
- Minimal prototype: GH Action job that runs SCA and `cosign` integration on a test image.
- Staging monitoring stack deployed and reachable for test alerts.

---

*End of research note.*