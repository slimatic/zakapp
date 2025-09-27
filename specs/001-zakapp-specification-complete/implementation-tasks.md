# Tasks: ZakApp Phase 3.4+ Core Implementation 

**Input**: Design documents from `/specs/001-zakapp-specification-complete/`
**Status**: Phases 3.1-3.3 COMPLETE ✅ (Setup ✅, Database ✅, Tests ✅ and failing)

## Current Status Summary
```
Phase 3.1 ✅ Setup: Project structure, dependencies, linting
Phase 3.2 ✅ Database: Prisma schema, migrations, Islamic methodology seeding  
Phase 3.3 ✅ TDD Tests: 163 tests written and FAILING (perfect for TDD)
Phase 3.4 🔄 READY: Core implementation to make tests pass
```

## Execution Flow for Phase 3.4+
```
1. Load existing failing tests as specifications ✓
   → 163 test cases across authentication, assets, zakat, users
   → All tests expect specific API responses and behaviors
2. Follow strict TDD red-green-refactor methodology:
   → RED: Tests are failing (✅ complete)
   → GREEN: Implement minimal code to make tests pass
   → REFACTOR: Improve code quality while keeping tests passing
3. Implementation order by dependencies:
   → Core infrastructure (Express app, middleware)
   → Authentication system (JWT, bcrypt, sessions) 
   → Database models and services
   → API endpoints to match test contracts
   → Business logic (Zakat calculations, Islamic compliance)
4. Validate each implementation against constitutional principles:
   → Privacy & Security First: AES-256-CBC encryption
   → Islamic Compliance: Accurate methodologies per research
   → User-Centric Design: Clear error messages and validation
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **✅**: Complete  **🔄**: Ready to implement  **⏳**: Blocked by dependencies

---

## Phase 3.4: Core Implementation (ONLY after tests are failing ✅)

### Infrastructure Setup (6 tasks)
- [ ] T064 Create Express.js app foundation in server/src/app.ts (tests expect this import)
- [ ] T065 [P] Create error handling middleware in server/src/middleware/errorHandler.ts  
- [ ] T066 [P] Create request logging middleware in server/src/middleware/logger.ts
- [ ] T067 [P] Create CORS and security middleware in server/src/middleware/security.ts
- [ ] T068 Create database connection service in server/src/services/database.ts
- [ ] T069 **🔸 COMMIT CHECKPOINT**: Express app infrastructure ready

### Authentication System (7 tasks) - Make T009-T015 pass
- [ ] T070 [P] Create JWT utility functions in server/src/utils/jwt.ts
- [ ] T071 [P] Create password hashing utilities in server/src/utils/crypto.ts  
- [ ] T072 [P] Create User model service in server/src/services/userService.ts
- [ ] T073 [P] Create authentication middleware in server/src/middleware/auth.ts
- [ ] T074 Implement POST /api/auth/register endpoint in server/src/routes/auth.ts
- [ ] T075 Implement POST /api/auth/login endpoint in server/src/routes/auth.ts
- [ ] T076 Implement POST /api/auth/refresh endpoint in server/src/routes/auth.ts
- [ ] T077 Implement POST /api/auth/logout endpoint in server/src/routes/auth.ts
- [ ] T078 Implement GET /api/auth/me endpoint in server/src/routes/auth.ts
- [ ] T079 Implement POST /api/auth/reset-password endpoint in server/src/routes/auth.ts
- [ ] T080 Implement POST /api/auth/confirm-reset endpoint in server/src/routes/auth.ts
- [ ] T081 **🔸 COMMIT CHECKPOINT**: Authentication system complete (T009-T015 should pass)

### Asset Management System (8 tasks) - Make T016-T023 pass
- [ ] T082 [P] Create encryption utilities for sensitive data in server/src/utils/encryption.ts
- [ ] T083 [P] Create Asset model service in server/src/services/assetService.ts
- [ ] T084 Implement GET /api/assets endpoint in server/src/routes/assets.ts
- [ ] T085 Implement POST /api/assets endpoint in server/src/routes/assets.ts  
- [ ] T086 Implement GET /api/assets/:id endpoint in server/src/routes/assets.ts
- [ ] T087 Implement PUT /api/assets/:id endpoint in server/src/routes/assets.ts
- [ ] T088 Implement DELETE /api/assets/:id endpoint in server/src/routes/assets.ts
- [ ] T089 [P] Implement asset validation functions in server/src/utils/assetValidation.ts
- [ ] T090 **🔸 COMMIT CHECKPOINT**: Asset management complete (T016-T023 should pass)

### Zakat Calculation Engine (8 tasks) - Make T024-T031 pass  
- [ ] T091 [P] Create Zakat calculation core engine in server/src/services/zakatCalculation.ts
- [ ] T092 [P] Create Islamic methodology implementations in server/src/services/islamicMethodologies.ts
- [ ] T093 [P] Create nisab threshold service in server/src/services/nisabService.ts
- [ ] T094 Implement POST /api/zakat/calculate endpoint in server/src/routes/zakat.ts
- [ ] T095 Implement GET /api/zakat/nisab endpoint in server/src/routes/zakat.ts
- [ ] T096 Implement zakat snapshot endpoints in server/src/routes/zakat.ts
- [ ] T097 Implement zakat payment endpoints in server/src/routes/zakat.ts
- [ ] T098 Implement GET /api/zakat/methodologies endpoint in server/src/routes/zakat.ts  
- [ ] T099 **🔸 COMMIT CHECKPOINT**: Zakat calculation engine complete (T024-T031 should pass)

## Phase 3.5: User Management & Advanced Features

### User Management (15 tasks) - Make T032-T046 pass
- [ ] T100 [P] Create user profile service in server/src/services/profileService.ts
- [ ] T101 [P] Create 2FA utilities in server/src/utils/twoFactor.ts
- [ ] T102 [P] Create export service in server/src/services/exportService.ts
- [ ] T103 Implement user profile endpoints in server/src/routes/user.ts
- [ ] T104 Implement user security endpoints (2FA, password change) in server/src/routes/user.ts
- [ ] T105 Implement user data export endpoints in server/src/routes/user.ts
- [ ] T106 **🔸 COMMIT CHECKPOINT**: User management complete (T032-T046 should pass)

### Data Management (10 tasks) - Make T047-T056 pass  
- [ ] T107 [P] Create CSV/JSON import/export utilities in server/src/utils/dataFormats.ts
- [ ] T108 [P] Create backup and restore service in server/src/services/backupService.ts
- [ ] T109 Implement data export endpoints in server/src/routes/data.ts
- [ ] T110 Implement data import endpoints in server/src/routes/data.ts
- [ ] T111 **🔸 COMMIT CHECKPOINT**: Data management complete (T047-T056 should pass)

### Integration Tests (7 tasks) - Make T057-T063 pass
- [ ] T112 Fix Jest configuration for TypeScript support in server/jest.config.js
- [ ] T113 Verify integration test T057 passes (complete user registration flow)
- [ ] T114 Verify integration test T058 passes (asset management with recalculation) 
- [ ] T115 Verify integration test T059 passes (multi-methodology comparison)
- [ ] T116 Verify integration test T060 passes (payment recording)
- [ ] T117 Verify integration test T061 passes (data export/import)
- [ ] T118 Verify integration test T062 passes (user profile management)
- [ ] T119 Verify integration test T063 passes (security and session management)
- [ ] T120 **🔸 COMMIT CHECKPOINT**: All backend tests passing (163/163) ✅

## Phase 3.6: Frontend Implementation

### React Frontend Foundation (5 tasks)
- [ ] T121 Create React app structure with routing in client/src/App.tsx
- [ ] T122 [P] Create authentication context and hooks in client/src/hooks/useAuth.ts
- [ ] T123 [P] Create API client with React Query in client/src/services/apiClient.ts
- [ ] T124 [P] Create shared components (Button, Input, Modal) in client/src/components/ui/
- [ ] T125 **🔸 COMMIT CHECKPOINT**: Frontend foundation ready

### Authentication UI (4 tasks)
- [ ] T126 [P] Create Login page in client/src/pages/auth/Login.tsx
- [ ] T127 [P] Create Register page in client/src/pages/auth/Register.tsx
- [ ] T128 [P] Create Password Reset pages in client/src/pages/auth/
- [ ] T129 **🔸 COMMIT CHECKPOINT**: Authentication UI complete

### Asset Management UI (6 tasks)  
- [ ] T130 [P] Create Asset List page in client/src/pages/assets/AssetList.tsx
- [ ] T131 [P] Create Asset Form component in client/src/components/assets/AssetForm.tsx
- [ ] T132 [P] Create Asset Details page in client/src/pages/assets/AssetDetails.tsx
- [ ] T133 [P] Create Asset Categories component in client/src/components/assets/AssetCategories.tsx
- [ ] T134 [P] Create Asset Import/Export components in client/src/components/assets/ImportExport.tsx
- [ ] T135 **🔸 COMMIT CHECKPOINT**: Asset management UI complete

### Zakat Calculation UI (5 tasks)
- [ ] T136 [P] Create Zakat Calculator page in client/src/pages/zakat/Calculator.tsx
- [ ] T137 [P] Create Zakat Results component in client/src/components/zakat/Results.tsx
- [ ] T138 [P] Create Methodology Selector component in client/src/components/zakat/MethodologySelector.tsx
- [ ] T139 [P] Create Zakat History page in client/src/pages/zakat/History.tsx
- [ ] T140 **🔸 COMMIT CHECKPOINT**: Zakat calculation UI complete

### User Dashboard & Settings (4 tasks)
- [ ] T141 [P] Create Dashboard page in client/src/pages/Dashboard.tsx
- [ ] T142 [P] Create User Profile page in client/src/pages/user/Profile.tsx
- [ ] T143 [P] Create Settings page in client/src/pages/user/Settings.tsx
- [ ] T144 **🔸 COMMIT CHECKPOINT**: User interface complete

## Phase 3.7: Integration & Polish

### Security & Performance (5 tasks)
- [ ] T145 [P] Add rate limiting to all endpoints in server/src/middleware/rateLimit.ts
- [ ] T146 [P] Add input validation middleware in server/src/middleware/validation.ts
- [ ] T147 [P] Implement proper HTTPS configuration in server/src/config/https.ts
- [ ] T148 [P] Add request/response compression in server/src/middleware/compression.ts
- [ ] T149 **🔸 COMMIT CHECKPOINT**: Security hardening complete

### Documentation & Deployment (4 tasks)  
- [ ] T150 [P] Create API documentation in docs/api.md
- [ ] T151 [P] Create deployment guide in docs/deployment.md
- [ ] T152 [P] Create user manual in docs/user-guide.md
- [ ] T153 **🔸 COMMIT CHECKPOINT**: Documentation complete

### Final Validation (2 tasks)
- [ ] T154 Run full test suite and ensure 100% pass rate
- [ ] T155 **🔸 FINAL COMMIT**: ZakApp v1.0 - Complete privacy-first Islamic Zakat calculator

## Dependencies

**Critical Path:**
- Infrastructure (T064-T069) → Authentication (T070-T081) → Assets (T082-T090) → Zakat (T091-T099)
- Authentication must complete before Asset Management (auth middleware dependency)
- Asset Management must complete before Zakat Calculations (asset data dependency) 
- Backend must be functional before Frontend can begin integration
- All backend tests must pass before moving to Frontend phase

**Parallel Opportunities:**
- Within each phase, [P] marked tasks can run simultaneously
- Frontend UI components can be built in parallel once API contracts are stable
- Documentation can be written alongside implementation

## Parallel Execution Example

```bash
# Phase 3.4 Infrastructure (T064-T069)
Task: "Create Express.js app foundation in server/src/app.ts"
Task: "Create error handling middleware in server/src/middleware/errorHandler.ts" [P]
Task: "Create request logging middleware in server/src/middleware/logger.ts" [P]  
Task: "Create CORS and security middleware in server/src/middleware/security.ts" [P]
Task: "Create database connection service in server/src/services/database.ts"
```

## Notes

### TDD Implementation Strategy
- **Each task must make specific tests pass** - reference test files to understand expected behavior
- **Implement minimal code first** - just enough to make the test pass (GREEN phase)
- **Refactor for quality** - improve code structure while keeping tests passing
- **Never break existing passing tests** - regression testing is critical

### Security Implementation Requirements
- **All sensitive data must be encrypted** using AES-256-CBC before database storage
- **JWT tokens** must have short expiration with refresh token rotation
- **Password hashing** must use bcrypt with 12+ rounds
- **Input validation** must sanitize all user inputs to prevent injection attacks
- **Rate limiting** must be applied to prevent brute force attacks

### Islamic Compliance Requirements  
- **Calculation accuracy** must match scholarly consensus per research.md
- **Multiple methodologies** must be supported (Standard, Hanafi, Shafi'i)
- **Nisab thresholds** must use current gold/silver pricing
- **Educational content** must explain Islamic principles behind calculations

### Git Workflow (Per Constitutional Requirements)
- **Commit after each checkpoint** with descriptive conventional commit messages  
- **Never commit sensitive data**: .env files, .db files, encrypted user data
- **Use logical separation**: separate commits for different functional areas
- **Include security considerations** in commit messages when applicable

---

**READY FOR PHASE 3.4 IMPLEMENTATION** 🚀
*All tests written and failing - perfect TDD starting point!*