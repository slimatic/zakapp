# Tasks: Open Source Readiness & Documentation Cleanup

**Input**: Design documents from `/specs/011-update-readme-and/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: The examples below include test tasks. Tests are OPTIONAL - only include them if explicitly requested in the feature specification.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Create project structure per implementation plan
    - **Command**: `mkdir -p docs/reports scripts/maintenance docs/api`
    - **Verification**: `ls -d docs/reports scripts/maintenance docs/api`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T002 [P] Move Report Files
    - **Description**: Move all historical report and status files from the root to `docs/reports/`.
    - **Files**: `ANALYSIS_REMEDIATION_COMPLETE.md`, `ARTIFACT_RECONCILIATION_SUMMARY.md`, `ASSET_AUTO_INCLUSION_TASKS.md`, `ASSET_REFRESH_FIX_COMPLETE.md`, `ASSET_REFRESH_FIX_REPORT.md`, `AUTH_COMPLETE_FIX.md`, `AUTH_FIX_OVERVIEW.md`, `BEFORE_AFTER_VISUALIZATION.md`, `BUG_FIXES_2025_MANUAL_TESTING.md`, `CLEANUP_FEATURE_008_COMPLETE.md`, `CLEANUP_SUMMARY.md`, `CODE_ANALYSIS_FINDINGS.md`, `COMMIT_SUMMARY.md`, `CRITICAL_AUTH_FIX.md`, `DASHBOARD_FIX_FINAL.md`, `DASHBOARD_UX_IMPROVEMENTS.md`, `DATABASE_MANAGEMENT.md`, `DEPLOYMENT_READINESS_REPORT.md`, `DEVELOPER_ONBOARDING.md`, `DEVELOPMENT.md`, `DEVELOPMENT_SETUP.md`, `DOCKER.md`, `DOCUMENTATION_CLEANUP_2025-10-13.md`, `ERROR_FIX_SUMMARY.md`, `FEATURE_008_COMPLETE.md`, `FEATURE_008_SPEC_SUMMARY.md`, `FEATURE_009_STATUS.md`, `FINAL_IMPLEMENTATION_REPORT.md`, `IMPLEMENTATION_PROGRESS_T093-T095.md`, `LOGIN_FIX_SUMMARY.md`, `MILESTONE_6_COMPLETE.md`, `MILESTONE_6_IMPLEMENTATION_COMPLETE.md`, `NISAB_RECORDS_UI_ENHANCEMENTS.md`, `NISAB_THRESHOLD_FIX.md`, `NON_CRITICAL_FIXES_2025-10-17.md`, `PAYMENT_RECORDING_ENHANCEMENT.md`, `PHASE_3_4_IMPLEMENTATION_STATUS.md`, `PHASE_3_5_COMPLETE.md`, `PHASE_3_6_EXECUTION_GUIDE.md`, `PHASE_3_6_TEST_SCRIPTS_SUMMARY.md`, `PHASE_3_6_VALIDATION_PLAN.md`, `PHASE_3_8_COMPLETE.md`, `PHASE_3_8_VALIDATION.md`, `PHASE_3_9_EXECUTION_READY.md`, `PHASE_3_9_MANUAL_TESTING_GUIDE.md`, `PHASE_3_IMPLEMENTATION_COMPLETE.md`, `PHASE_3_IMPLEMENTATION_STATUS.md`, `QUICK_AUTH_FIX.md`, `QUICK_REGISTRATION_FIX.md`, `RECONCILIATION_DOCUMENT_INDEX.md`, `RECONCILIATION_EXECUTIVE_SUMMARY.md`, `RECONCILIATION_QUICK_REFERENCE.md`, `RECONCILIATION_STATUS.txt`, `RECONCILIATION_VERIFICATION_REPORT.md`, `REGISTRATION_FIX_SUMMARY.md`, `SHARED_MODULE_FIX.md`, `SPECIFICATION_ANALYSIS_REPORT.md`, `SPEC_REMEDIATION_COMPLETE.md`, `STAGING_DEPLOYMENT_READY.md`, `T030-T032-COMPLETION-REPORT.md`, `T032-ACCESSIBILITY-AUDIT-COMPLETION-REPORT.md`, `T093-T096_TASKS_REORGANIZATION.md`, `T094-T095-TEST-EXECUTION-REPORT.md`, `ZAKAT_DISPLAY_IMPLEMENTATION_REPORT.md`, `ZAKAT_UI_DELIVERY_SUMMARY.md`
    - **Action**: Use `git mv` to move these files.

- [x] T003 [P] Move Script Files
    - **Description**: Organize shell and python scripts into the `scripts/` directory.
    - **Maintenance Scripts**: Move `check-services.sh`, `deploy-staging.sh`, `fix-finalize-unlock.sh`, `fix-remaining-tests.sh`, `fix-service-tests.py`, `update-test-factories.py` to `scripts/maintenance/`.
    - **Root Scripts**: Move `start-backend.sh`, `start-frontend.sh`, `test-registration.sh`, `docker-start.sh` to `scripts/`.
    - **Action**: Use `git mv`.

- [x] T004 [P] Move Documentation Files
    - **Description**: Organize remaining documentation files.
    - **API Spec**: Move `api-specification.md` to `docs/api/`.
    - **General Docs**: Move `development-plan.md`, `principles.md`, `roadmap.md`, `security.md`, `tasks.md`, `user-stories.md`, `deployment-guide.md` to `docs/`.
    - **Action**: Use `git mv`.

- [x] T005 Update Links in Moved Files
    - **Description**: Scan moved markdown files for relative links that might have broken (e.g., links to `./specs` or `../docs`) and update them.
    - **Action**:
        - For files moved to `docs/reports/`: Update links to point correctly (e.g., `specs/` becomes `../../specs/`).
        - For files moved to `docs/`: Update links (e.g., `specs/` becomes `../specs/`).
    - **Tool**: Use `sed` or manual edits for critical files.

---

## Phase 3: User Story 1 - User-Friendly Documentation (Priority: P1) 🎯 MVP

**Goal**: Provide clear, accessible documentation for new users and developers.

**Independent Test**: Verify README renders correctly and links work.

### Implementation for User Story 1

- [x] T006 [US1] Extract Performance & Accessibility Docs
    - **Description**: Create dedicated documentation files for metrics currently in README.
    - **Source**: Read current `README.md`.
    - **Target 1**: Create `docs/performance.md` with the Performance section content.
    - **Target 2**: Create `docs/accessibility.md` with the Accessibility section content.
    - **Action**: Copy content, then verify.

- [x] T007 [US1] Rewrite README.md
    - **Description**: Replace the root `README.md` with the new user-friendly version.
    - **Content**: Use the structure defined in `specs/011-update-readme-and/research.md` and `quickstart.md`.
    - **Sections**:
        - Title & Badges (Build, Tests, License)
        - Project Overview
        - Quick Start (Docker based)
        - Key Features
        - Documentation Links
        - Contributing
        - License

---

## Phase 4: Verification

**Purpose**: Ensure the project still functions correctly after reorganization.

- [x] T008 Verify Project Integrity
    - **Check 1**: Run `./scripts/docker-start.sh` (ensure it finds docker-compose.yml correctly).
    - **Check 2**: Verify `docs/` structure is clean.
    - **Check 3**: Verify `README.md` renders correctly and links work.
