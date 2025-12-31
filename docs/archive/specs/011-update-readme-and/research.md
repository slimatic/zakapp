# Phase 0: Research & Analysis

## Goals
1. Identify all loose files in the root directory that need moving.
2. Identify the target location for each file category.
3. Determine the structure of the new README.md.

## Findings

### Root Files to Move
Based on `ls -F` of the root directory:

**To `docs/reports/`:**
- ANALYSIS_REMEDIATION_COMPLETE.md
- ARTIFACT_RECONCILIATION_SUMMARY.md
- ASSET_AUTO_INCLUSION_TASKS.md
- ASSET_REFRESH_FIX_COMPLETE.md
- ASSET_REFRESH_FIX_REPORT.md
- AUTH_COMPLETE_FIX.md
- AUTH_FIX_OVERVIEW.md
- BEFORE_AFTER_VISUALIZATION.md
- BUG_FIXES_2025_MANUAL_TESTING.md
- CLEANUP_FEATURE_008_COMPLETE.md
- CLEANUP_SUMMARY.md
- CODE_ANALYSIS_FINDINGS.md
- COMMIT_SUMMARY.md
- CRITICAL_AUTH_FIX.md
- DASHBOARD_FIX_FINAL.md
- DASHBOARD_UX_IMPROVEMENTS.md
- DATABASE_MANAGEMENT.md
- DEPLOYMENT_READINESS_REPORT.md
- DEVELOPER_ONBOARDING.md
- DEVELOPMENT.md
- DEVELOPMENT_SETUP.md
- DOCKER.md
- DOCUMENTATION_CLEANUP_2025-10-13.md
- ERROR_FIX_SUMMARY.md
- FEATURE_008_COMPLETE.md
- FEATURE_008_SPEC_SUMMARY.md
- FEATURE_009_STATUS.md
- FINAL_IMPLEMENTATION_REPORT.md
- IMPLEMENTATION_PROGRESS_T093-T095.md
- LOGIN_FIX_SUMMARY.md
- MILESTONE_6_COMPLETE.md
- MILESTONE_6_IMPLEMENTATION_COMPLETE.md
- NISAB_RECORDS_UI_ENHANCEMENTS.md
- NISAB_THRESHOLD_FIX.md
- NON_CRITICAL_FIXES_2025-10-17.md
- PAYMENT_RECORDING_ENHANCEMENT.md
- PHASE_3_4_IMPLEMENTATION_STATUS.md
- PHASE_3_5_COMPLETE.md
- PHASE_3_6_EXECUTION_GUIDE.md
- PHASE_3_6_TEST_SCRIPTS_SUMMARY.md
- PHASE_3_6_VALIDATION_PLAN.md
- PHASE_3_8_COMPLETE.md
- PHASE_3_8_VALIDATION.md
- PHASE_3_9_EXECUTION_READY.md
- PHASE_3_9_MANUAL_TESTING_GUIDE.md
- PHASE_3_IMPLEMENTATION_COMPLETE.md
- PHASE_3_IMPLEMENTATION_STATUS.md
- QUICK_AUTH_FIX.md
- QUICK_REGISTRATION_FIX.md
- RECONCILIATION_DOCUMENT_INDEX.md
- RECONCILIATION_EXECUTIVE_SUMMARY.md
- RECONCILIATION_QUICK_REFERENCE.md
- RECONCILIATION_STATUS.txt
- RECONCILIATION_VERIFICATION_REPORT.md
- REGISTRATION_FIX_SUMMARY.md
- SHARED_MODULE_FIX.md
- SPECIFICATION_ANALYSIS_REPORT.md
- SPEC_REMEDIATION_COMPLETE.md
- STAGING_DEPLOYMENT_READY.md
- T030-T032-COMPLETION-REPORT.md
- T032-ACCESSIBILITY-AUDIT-COMPLETION-REPORT.md
- T093-T096_TASKS_REORGANIZATION.md
- T094-T095-TEST-EXECUTION-REPORT.md
- ZAKAT_DISPLAY_IMPLEMENTATION_REPORT.md
- ZAKAT_UI_DELIVERY_SUMMARY.md

**To `scripts/maintenance/`:**
- check-services.sh
- deploy-staging.sh
- fix-finalize-unlock.sh
- fix-remaining-tests.sh
- fix-service-tests.py
- update-test-factories.py

**To `docs/api/`:**
- api-specification.md

**To `docs/`:**
- development-plan.md
- principles.md
- roadmap.md
- security.md
- tasks.md
- user-stories.md
- deployment-guide.md

**To `scripts/`:**
- start-backend.sh
- start-frontend.sh
- test-registration.sh
- docker-start.sh

### README Structure
The new README will follow this structure:
1. **Header**: Title, Badges (Build, Tests, License only - remove unconfirmed metrics)
2. **Project Overview**: Brief description of ZakApp.
3. **Quick Start**:
   - Prerequisites (Docker, Git)
   - Clone command
   - Start command (`./scripts/docker-start.sh`)
   - Access info (localhost:3000)
   - Mobile access info (`./get-ip.sh`)
4. **Key Features**: High-level bullet points.
5. **Documentation**: Links to the `docs/` folder for detailed info.
6. **Contributing**: Brief guide or link to `docs/CONTRIBUTING.md` (if exists) or just basic steps.
7. **License**: MIT.

### Performance & Accessibility
- Move the detailed badges and sections about "100/100 Accessibility" and "94.5/100 Performance" to `docs/performance.md` and `docs/accessibility.md` respectively, as they are currently unconfirmed.
