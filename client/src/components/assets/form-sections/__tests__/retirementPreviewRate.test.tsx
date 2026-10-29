/**
 * The retirement preview must display the same figures the engine computes.
 *
 * DEFECT (preserved-growth branch of RetirementTreatmentSection.tsx): the preview
 * multiplied 20% of the balance by a 0.5% rate (0.20 x 0.005 = 0.1% of gross), while
 * the engine (`client/src/core/calculations/zakat.ts`) computes zakatable value with
 * the 0.20 modifier (`AssetForm.tsx` applies the same modifier when saving the asset)
 * and then applies the standard 2.5% rate — 20% x 2.5% = 0.5% of gross. A user reading
 * the preview before saving saw a zakat figure five times smaller than the one the
 * engine computes for the identical asset: $100 on a $100,000 account instead of $500.
 *
 * SCOPE: this test pins ENGINE CONSISTENCY only — the preview displays what the
 * calculator runs. Whether the 0.5% attribution itself is correct is an open
 * scholarly question the repo already records as unresolved (see
 * `docs/plans/methodology-audit-2026-09-25.md`, "Dr. Salah Al-Sawy" citation status,
 * and the component's own explanation string quoting that opinion). Nothing here
 * endorses or re-derives the rate.
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RetirementTreatmentSection } from '../RetirementTreatmentSection';
import { calculateZakat } from '../../../../core/calculations/zakat';
import { AssetType } from '../../../../types';
import { formatCurrency } from '../../../../utils/formatters';
import type { RetirementConfig } from '../../../../types/asset.types';
import type { Asset } from '../../../../types';

const GROSS = 100_000;

const renderPreview = (config: RetirementConfig | undefined) =>
  render(
    <RetirementTreatmentSection
      retirementConfig={config}
      value={String(GROSS)}
      currency="USD"
      onConfigChange={() => {}}
    />,
  );

const retirementAsset = (config: RetirementConfig, calculationModifier: number): Asset =>
  ({
    id: 'ret-preview-test',
    type: AssetType.RETIREMENT,
    name: 'retirement holding',
    value: GROSS,
    currency: 'USD',
    isActive: true,
    createdAt: '',
    updatedAt: '',
    // A saved asset stores the modifier the form computed (AssetForm.tsx:138 /
    // :143, saved with metadata), and the engine prefers that branch
    // (getAssetZakatableValue) over the config fallback — so the fixture
    // carries it too and pins the path production actually takes.
    calculationModifier,
    retirementConfig: config,
  }) as unknown as Asset;

/** Text of the value span in the row labelled `label` in the calculation preview. */
const previewRow = (label: string): string => {
  const row = screen.getByText(label).closest('div');
  expect(row).not.toBeNull();
  const valueSpan = row!.querySelector('span:last-child');
  expect(valueSpan).not.toBeNull();
  return valueSpan!.textContent ?? '';
};

describe('retirement preview agrees with the engine', () => {
  it('preserved growth: rate row and Zakat Due match the engine, not 0.1% of gross', () => {
    // Falsifying case. Engine:zakatable = 0.20 x 100,000 = 20,000 (above the gold
    // nisab, so the obligation gate passes) -> due = 20,000 x 0.025 = 500.
    const config: RetirementConfig = {
      methodology: 'preserved_growth',
      withdrawalPenalty: 0,
      estimatedTaxRate: 0,
    };
    const engine = calculateZakat(
      [retirementAsset(config, 0.2)],
      [],
      { gold: 7435.8, silver: 734.832 },
      'STANDARD',
    );
    // Document the engine side the preview is pinned to: rate 0.025 over the
    // 0.20-modified zakatable value.
    expect(engine.meta.zakatRate).toBe(0.025);
    expect(engine.zakatDue).toBeCloseTo(500, 2);

    renderPreview(config);

    // The defect: the rate row showed 0.5% and Zakat Due showed $100.00
    // (0.1% of gross) instead of the engine's 2.5% -> $500.00.
    expect(previewRow('Zakat Rate:')).toBe('2.5%');
    expect(previewRow('Zakat Due:')).toBe(formatCurrency(500, 'USD'));
    expect(previewRow('Zakat Due:')).toBe(formatCurrency(engine.zakatDue, 'USD'));
  });

  it('preserved growth: zakatable amount is 20% of gross on both sides', () => {
    const config: RetirementConfig = {
      methodology: 'preserved_growth',
      withdrawalPenalty: 0,
      estimatedTaxRate: 0,
    };
    const engine = calculateZakat(
      [retirementAsset(config, 0.2)],
      [],
      { gold: 7435.8, silver: 734.832 },
      'STANDARD',
    );
    renderPreview(config);
    expect(previewRow('Zakatable Amount:')).toBe(
      formatCurrency(engine.zakatableAssets, 'USD'),
    );
  });

  it('collectible value stays consistent with the engine (penalty + tax, 2.5%)', () => {
    // Guard for the sibling branch: net = (1 - 0.10 - 0.25) x 100,000 = 65,000
    // zakatable at the standard rate -> 1,625. The preview already agreed here;
    // the fix must not change that.
    const config: RetirementConfig = {
      methodology: 'collectible_value',
      withdrawalPenalty: 0.1,
      estimatedTaxRate: 0.25,
    };
    const engine = calculateZakat(
      [retirementAsset(config, 0.65)],
      [],
      { gold: 7435.8, silver: 734.832 },
      'STANDARD',
    );
    expect(engine.zakatDue).toBeCloseTo(1_625, 2);
    renderPreview(config);
    expect(previewRow('Zakat Rate:')).toBe('2.5%');
    expect(previewRow('Zakat Due:')).toBe(formatCurrency(engine.zakatDue, 'USD'));
  });
});