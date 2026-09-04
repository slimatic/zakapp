# Multi-Madhab Ruling Transparency Engine — Implementation Plan

> **For Hermes:** Execute task-by-task with TDD. Feature branch: `feature/madhab-ruling-transparency`.

**Goal:** Every asset in the Zakat calculator shows WHY it's zakatable/exempt under the chosen madhab, with inline scholarly citations (static dataset + source URLs).

**Architecture:** New pure-function ruling registry (`client/src/data/rulings.ts`) mirroring the `isAssetZakatable` decision chain; new presentational component; wired into `ZakatCalculator` Review step. Maliki/Hanbali educational content added. No calc-engine changes, no PDF changes.

**Tech Stack:** React 18 + TypeScript, Vitest.

## Testing Strategy

**Seam:** `getAssetRuling(asset, methodologyName)` in `client/src/data/rulings.ts` — pure function, stable boundary between calc config and display.
**Under the seam:** ruling dataset contents, internal helpers.
**Above the seam:** ruling status + explanations returned for every madhab × assetType pair, override handling, jewelry rule parity with `isAssetZakatable`.

---

### Task 1: Ruling types + coverage test (RED first)

**Files:** Create `client/src/data/rulings.ts` (types + empty registry), Create `client/src/__tests__/unit/rulings.test.ts`

Test 1 (coverage): iterate all 5 MethodologyNames × all 11 AssetTypes → `getRulingForType(m, t)` returns non-null with ≥1 citation. Fails initially (empty registry).
Test 2 (parity): for each madhab, a GOLD asset without override returns same zakatable/exempt status as `isAssetZakatable` from core.

### Task 2: Populate ruling registry

**Files:** Modify `client/src/data/rulings.ts`

Full dataset: 5 madhabs × 11 asset types. Each entry: `ruling`, `reasoning`, `citations[]` (≥1, with url where a stable public source exists — Quran.com, sunnah.com, AAOIFI, seekersguidance.org, amjafatwa.org, fiqh council pages). Jewelry exemption for SHAFII/MALIKI/HANBALI; zakatable for HANAFI. Nisab-source notes on cash/gold/silver per madhab.

### Task 3: getAssetRuling decision-chain function

**Files:** Modify `client/src/data/rulings.ts`

Mirror `isAssetZakatable` exactly: override-true → `override-zakatable` (madhabDefault explains the default); override-false → `override-exempt`; type default → zakatable/exempt; jewelryExempt && (GOLD|SILVER) && no override → exempt w/ jewelry ruling. Fallback: missing entry → generic madhab explanation + disclaimer (never null in UI path).
Tests: override statuses produce both override + madhabDefault explanations; fallback for unknown type.

### Task 4: AssetRulingExplanation component

**Files:** Create `client/src/components/zakat/AssetRulingExplanation.tsx`, test `client/src/__tests__/unit/assetRulingExplanation.test.tsx`

Props: `ruling: AssetRuling`, `assetName`, `currency`. Renders status badge, madhab-default ruling text, reasoning, citation links (`target="_blank" rel="noopener noreferrer"`), override block when present. Expandable (collapsed by default). Test with @testing-library: renders, toggle works, override block conditional.

### Task 5: Wire into ZakatCalculator Review step

**Files:** Modify `client/src/components/zakat/ZakatCalculator.tsx`

In `handleCalculateZakat`: for each asset in `assetsToCalc`, compute `getAssetRuling(asset, methodology)`; attach to calculation state (`assetRulings: Array<{assetId, name, type, value, ruling}>`). In `renderReviewStep`, render `AssetRulingExplanation` per asset inside the breakdown card. Component test: calculator review renders ruling for a zakatable asset.

### Task 6: Maliki + Hanbali educational content

**Files:** Modify `client/src/data/methodologies.ts`

Add `maliki` and `hanbali` Methodology entries (full interface: overview, historicalContext, nisabCalculation, assetTreatment, whenToUse, practicalExample, sources, characteristics, commonRegions, scholarlyBasis) following hanafi/shafii style. Update `MethodologyComparison` interface + rows to include maliki/hanbali columns where straightforward; if that breaks MethodologySelector consumers, extend additively (add optional fields) rather than changing existing keys.

### Task 7: Full suite + lint + commit/PR

Run `npm run test -- --run` in client (all green), `npx tsc --noEmit` (client), lint if configured. Commit per task; final: push branch, `gh pr create` targeting main. CI gates: test (20.x) + GitGuardian.