# Tasks: Tracking & Analytics System

**Input**: Design documents from `/specs/006-milestone-5/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → If not found: ERROR "No implementation plan found"
   → Extract: tech stack, libraries, structure
2. Load optional design documents:
   → data-model.md: Extract entities → model tasks
   → contracts/: Each file → contract test task
   → research.md: Extract decisions → setup tasks
3. Generate tasks by category:
   → Setup: project init, dependencies, linting
   → Tests: contract tests, integration tests
   → Core: models, services, CLI commands
   → Integration: DB, middleware, logging
   → Polish: unit tests, performance, docs
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001, T002...)
6. Generate dependency graph
7. Create parallel execution examples
8. Validate task completeness:
   → All contracts have tests?
   → All entities have models?
   → All endpoints implemented?
9. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **Web app**: `server/src/`, `client/src/`, `shared/`
- Backend API paths: `server/src/routes/`, `server/src/services/`, `server/src/models/`
- Frontend paths: `client/src/components/`, `client/src/pages/`, `client/src/services/`
- Tests: `server/tests/`, `client/tests/`, `shared/`

## Phase 3.1: Setup
- [X] T001 Extend Prisma schema for Payment and Reminder entities with encryption fields
- [X] T002 Create database migration for payment tracking tables
- [X] T003 [P] Implement AES-256 encryption utilities for payment data in `server/src/utils/encryption.ts`
- [X] T004 [P] Add Zod validation schemas for payment and reminder data in `shared/validation.ts`
- [ ] **🔸 COMMIT CHECKPOINT**: Database schema and encryption foundation complete

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**
- [X] T005 [P] Unit test for PaymentService.createPayment in `server/tests/unit/services/payment-service.test.ts`
- [X] T006 [P] Unit test for AnalyticsService.calculateTrends in `server/tests/unit/services/analytics-service.test.ts`
- [X] T007 [P] Unit test for ReminderService.scheduleReminder in `server/tests/unit/services/reminder-service.test.ts`
- [X] T008 [P] Unit test for ExportService.generateCSV in `server/tests/unit/services/export-service.test.ts`
- [X] T009 [P] Integration test for POST /api/payments endpoint in `server/tests/integration/payments-api.test.ts`
- [X] T010 [P] Integration test for GET /api/analytics/summary endpoint in `server/tests/integration/analytics-api.test.ts`
- [X] T011 [P] Component test for PaymentForm in `client/tests/components/payment-form.test.tsx`
- [X] T012 [P] Component test for AnalyticsDashboard in `client/tests/components/analytics-dashboard.test.tsx`
- [X] T013 [P] E2E test for complete payment recording workflow in `client/tests/e2e/payment-workflow.test.ts`
- [ ] **🔸 COMMIT CHECKPOINT**: Commit TDD test suite (all tests must be failing)

## Phase 3.3: Core Implementation (ONLY after tests are failing)
- [X] T014 Create Payment model in `server/src/models/payment.ts` with encryption
- [X] T015 Create Reminder model in `server/src/models/reminder.ts`
- [X] T016 [P] Implement PaymentService in `server/src/services/payment-service.ts`
- [X] T017 [P] Implement AnalyticsService in `server/src/services/analytics-service.ts`
- [X] T018 [P] Implement ReminderService in `server/src/services/reminder-service.ts`
- [X] T019 [P] Implement ExportService in `server/src/services/export-service.ts`
- [X] T020 Implement payments API routes in `server/src/routes/payments.ts`
- [X] T021 Implement analytics API routes in `server/src/routes/analytics.ts`
- [X] T022 Implement export API routes in `server/src/routes/export.ts`
- [X] T023 Implement reminders API routes in `server/src/routes/reminders.ts`
- [X] T024 [P] Create PaymentForm component in `client/src/components/PaymentForm.tsx`
- [X] T025 [P] Create PaymentHistory page in `client/src/pages/PaymentHistory.tsx`
- [X] T026 [P] Create AnalyticsDashboard component in `client/src/components/AnalyticsDashboard.tsx`
- [X] T027 [P] Create chart components (LineChart, BarChart, PieChart) in `client/src/components/charts/`
- [X] T028 [P] Create ExportControls component in `client/src/components/ExportControls.tsx`
- [X] T029 [P] Create ReminderNotification component in `client/src/components/ReminderNotification.tsx`
- [ ] **🔸 COMMIT CHECKPOINT**: Core backend and frontend implementation complete

## Phase 3.4: Integration
- [X] T030 Connect PaymentService to database with encryption/decryption
- [X] T031 Connect AnalyticsService to PaymentService for data aggregation
- [X] T032 Add payment validation middleware to API routes
- [X] T033 Integrate reminder scheduling with user preferences
- [X] T034 Connect frontend payment form to payments API
- [X] T035 Connect analytics dashboard to analytics API
- [X] T036 Integrate export controls with export API
- [X] T037 Add reminder notifications to main application layout
- [ ] **🔸 COMMIT CHECKPOINT**: Commit integration features and middleware

## Phase 3.5: Polish
- [ ] T038 [P] Additional unit tests for edge cases in `server/tests/unit/`
- [ ] T039 [P] Performance tests for analytics calculations (<500ms) in `server/tests/performance/`
- [ ] T040 [P] Accessibility audit for new components (WCAG 2.1 AA) in `client/tests/accessibility/`
- [ ] T041 [P] Security audit for payment data handling in `server/tests/security/`
- [ ] T042 Update API documentation for new endpoints
- [ ] T043 Add user guide documentation for tracking features
- [ ] T044 Performance optimization for large payment histories
- [ ] T045 Final integration testing across all features
- [ ] **🔸 COMMIT CHECKPOINT**: All tests passing, performance validated, documentation complete

## Dependencies
- Setup tasks (T001-T004) before all other tasks
- Tests (T005-T013) before implementation (T014-T029) - TDD requirement
- Models (T014-T015) before services (T016-T019)
- Services (T016-T019) before API routes (T020-T023)
- API routes (T020-T023) before frontend components (T024-T029)
- Core implementation (T014-T029) before integration (T030-T037)
- Everything before polish tasks (T038-T045)

## Parallel Execution Examples
**Setup Phase**: Tasks T003 and T004 can run in parallel (different files)
**Test Phase**: All test tasks (T005-T013) can run in parallel (different test files)
**Core Implementation**: Tasks T016-T019 (services) and T024-T029 (components) can run in parallel
**Polish Phase**: Tasks T038-T041 can run in parallel (different test types)

Example commands:
```bash
# Run all unit tests in parallel
npm test -- --testPathPattern="unit" --maxWorkers=4

# Run component tests in parallel  
npm test -- --testPathPattern="components" --maxWorkers=4
```

## Notes
- [P] tasks = different files, no dependencies
- Verify tests fail before implementing
- **🔸 COMMIT after each milestone checkpoint (not individual tasks)**
- **Never commit sensitive data**: encrypted files, .db files, .env files, user data
- Use logical commit messages following conventional commit format
- Separate commits by functional area for easier review
- Avoid: vague tasks, same file conflicts

### Git Workflow Best Practices
```bash
# Example milestone commit workflow:
git add <files-for-this-milestone>
git commit -m "feat: Complete [milestone name]

[Description of what was accomplished]
- Specific features, counts, or completion status
- Security considerations if applicable"

# Never commit these:
*.db, *.db-journal, *.enc, .env, */data/users/, node_modules/
```

## Task Generation Rules
*Applied during main() execution*

1. **From Contracts**:
   - Each contract file → contract test task [P]
   - Each endpoint → implementation task
   
2. **From Data Model**:
   - Each entity → model creation task [P]
   - Relationships → service layer tasks
   
3. **From User Stories**:
   - Each story → integration test [P]
   - Quickstart scenarios → validation tasks

4. **Ordering**:
   - Setup → Tests → Models → Services → Endpoints → Polish
   - Dependencies block parallel execution

## Validation Checklist
*GATE: Checked by main() before returning*

- [ ] All contracts have corresponding tests
- [ ] All entities have model tasks
- [ ] All tests come before implementation
- [ ] Parallel tasks truly independent
- [ ] Each task specifies exact file path
- [ ] No task modifies same file as another [P] task

## Task Summary
- **Total Tasks**: 45 (T001-T045)
- **Estimated Effort**: 150-200 hours (6-8 weeks with TDD approach)
- **Test Coverage**: >90% for services, full API coverage, component testing, E2E workflows
- **Key Milestones**: 3 commit checkpoints for incremental delivery
- **Architecture**: Zero-knowledge privacy, AES-256 encryption, comprehensive analytics
- **Quality Gates**: Performance (<500ms), accessibility (WCAG 2.1 AA), security audit

---
*Generated from plan.md and spec.md - Ready for TDD implementation*