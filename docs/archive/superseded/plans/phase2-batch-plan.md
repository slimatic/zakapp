# Phase 2 batches 3-9 (updated after batch 2)

Remaining: ~106 files, ~2,900 hardcoded class hits.
Tool: client/scripts/token-sweep.sh (mechanical mapping, sanity-tested on SeederPage).
Every batch: script sweep -> tsc -> build -> targeted vitest -> visual spot -> deepseek review.

- Batch 3 (assets): components/assets/* (AssetDetails 49, AssetForm 38, AssetCategories 35,
  AssetImportExport 28, form-sections/*), pages/assets/AssetEditPage.tsx, components/AssetAmountHistory.tsx
- Batch 4 (tracking/payments): components/tracking/* (PaymentList 40, PaymentDetailModal 43,
  AssetSelectionTable 49, LiabilitySelectionTable 36, AnnualSummaryCard 49, ComparisonTable 24,
  PaymentRecordForm 23, ZakatDisplayCard 26), components/zakat/PaymentModal.tsx
- Batch 5 (zakat core): components/zakat/* (MethodologySelector 52, CalculationTrendsChart 33,
  ZakatCalculator 28, NisabComparisonWidget 33), components/HawlProgressIndicator.tsx (38 - moon arc)
- Batch 6 (dashboard+history): components/dashboard/* (OnboardingGuide 54, DashboardActionCards 36,
  ActiveRecordWidget 32), components/history/History.tsx (40), components/help/GettingStarted.tsx (55)
- Batch 7 (settings+admin): pages/settings/components/*, components/admin/*, pages/admin/*
- Batch 8 (onboarding+migration): pages/onboarding/steps/*, components/migration/MigrationWizard.tsx (46)
- Batch 9 (auth+misc): components/auth/* (Login 24, Register 26), pages/AnalyticsPage.tsx (32),
  pages/knowledge/*, pages/PrivacyPolicyPage.tsx, stragglers
- Final: delete dead .dark retrofit rules (per-class zero-usage gate), delete legacy numeric
  ramps at zero usage, token-gate.sh wired into CI
