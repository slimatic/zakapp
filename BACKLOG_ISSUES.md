zakapp-001: Fix remaining contract test failures (response format)
Priority: P1
Category: Test Infrastructure

Failing Tests (~15):
- tests/contract/nisabYearRecords.*.test.ts
- tests/contract/assets-*.test.ts

Issue: Tests expect standardized ApiResponse format but API returns different structures.

---

zakapp-002: Implement IslamicCalculationService (TDD tests)
Priority: P1  
Category: Feature Implementation

Failing Tests (~25):
- tests/unit/islamic-calculation.test.ts

Issue: TDD tests for unimplemented IslamicCalculationService. Service needs full implementation including:
- Zakat rate calculations (2.5% for gold, silver, cash, business assets)
- Methodology-specific calculations (Hanafi, Maliki, Shafi, Hanbali)
- Lunar calendar considerations
- Nisab threshold calculations

---

zakapp-003: Implement HAWL workflow integration
Priority: P1
Category: Feature Implementation

Failing Tests (~30):
- tests/integration/hawlDetection*.test.ts
- tests/integration/hawlInterruption.test.ts
- tests/integration/finalization.test.ts

Issue: HAWL (lunar year) workflow not fully implemented. Tests verify:
- Nisab achievement detection
- Hawl interruption handling  
- Finalization workflow
- Asset snapshot creation

---

zakapp-004: Fix encryption key rotation and remediation
Priority: P2
Category: Security Feature

Failing Tests (~15):
- tests/unit/EncryptionService.test.ts
- tests/unit/encryption.test.ts
- tests/unit/security/payment-security-audit.test.ts
- src/__tests__/integration/encryption-admin.test.ts

Issue: Complex encryption key rotation and remediation not fully implemented. Tests verify:
- Previous key decryption detection
- Re-encryption workflows
- Security audit trails

---

zakapp-005: Fix remaining integration tests
Priority: P2
Category: Integration Tests

Failing Tests (~20):
- tests/integration/liveTracking.test.ts
- tests/integration/statusTransitions.test.ts
- tests/integration/unlockEdit.test.ts
- tests/integration/invalidOperations.test.ts
- tests/integration/user-registration.test.ts
- tests/integration/asset-*.test.ts
- tests/performance/api-performance.test.ts
- tests/unit/data-migration.test.ts
- tests/unit/zakat-engine.test.ts
- tests/unit/zakatService.test.ts
- tests/unit/nisabCalculationService.test.ts
- tests/unit/services/nisabYearRecordService.test.ts
- tests/unit/services/wealthAggregationService.test.ts
- tests/unit/services/hawlTrackingService.test.ts
- tests/unit/services/auditTrailService.test.ts
- src/__tests__/calendarService.test.ts
- src/__tests__/MetalPriceScraperService.test.ts
- tests/accessibility/a11y.test.ts


