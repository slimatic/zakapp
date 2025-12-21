# Data Model: Production Readiness

This document lists schema-level or metadata entities introduced or required to support Production Readiness features.

## Key Entities

- **ReleaseArtifact**
  - id: string (sha)
  - version: semver
  - commitSha: string
  - imageUri: string
  - signed: boolean
  - publishedAt: timestamp
  - changelog: text

- **DeploymentRecord**
  - id: string
  - artifactId: fk ReleaseArtifact.id
  - environment: enum (staging, production)
  - status: enum (success, failed, rolled-back)
  - initiatedBy: string (actor)
  - startedAt / finishedAt: timestamps

- **BackupSnapshot**
  - id: string
  - datastore: enum (sqlite, redis, object-storage)
  - createdAt: timestamp
  - path: string (location)
  - sizeBytes: integer
  - encrypted: boolean
  - restoreTestedAt: timestamp (nullable)

- **MonitoringConfig**
  - id: string
  - name: string
  - sloTargets: json (latency/error targets)
  - alerts: list of alert rules

- **Runbook**
  - id: string
  - incidentType: string
  - steps: text or structured steps
  - lastValidatedAt: timestamp

## Notes
- These entities are metadata records and may be implemented as DB tables (for long-term tracking) or as external records (e.g., in the monitoring system or GitHub issues) depending on implementation choice.
- Keep sensitive artifacts (e.g., backups location credentials, keys) out of plaintext in DBs; reference via secret stores only.

---
*End of data model.*