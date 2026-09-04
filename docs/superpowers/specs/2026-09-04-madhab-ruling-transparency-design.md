# Multi-Madhab Ruling Transparency Engine — Design Spec

**Date:** 2026-09-04
**Status:** Approved (Approach A — Ruling Registry)
**Scope:** ZakApp client — per-asset ruling explanations with inline scholarly citations

## Problem

ZakApp calculates Zakat differently across 5 methodologies (Standard, Hanafi, Shafi'i, Maliki, Hanbali) via `client/src/core/calculations/methodology.ts`, but the calculation results never explain *why* an asset is zakatable or exempt under the user's chosen madhab. Users — and the scholars/accountants they consult — see numbers without rulings. Additionally, the educational content in `client/src/data/methodologies.ts` covers only standard/hanafi/shafii/custom; **Maliki and Hanbali are missing**.

## Goals (v1)

1. Every asset in the calculation breakdown shows **why** it is zakatable or exempt under the chosen madhab, with the ruling and citations inline.
2. Rulings cover the full decision chain of `isAssetZakatable`: explicit user override (true/false), type default, and the jewelry exemption rule.
3. Every ruling cites named sources with working URLs (e.g. Fiqh al-Zakat, AAOIFI Standard 35, Sahih al-Bukhari, SeekersGuidance).
4. Educational content for Maliki and Hanbali added to `data/methodologies.ts`.
5. UI-only — PDF report integration is explicitly out of scope (follow-up).

## Non-Goals

- No changes to calculation math or numbers. The ruling layer reads the same inputs; it changes no outputs.
- No PDF export changes.
- No comparison-across-madhabs view (separate follow-up).
- No backend changes.

## Architecture (Approach A)

**New module** `client/src/data/rulings.ts`:

```ts
export interface Citation {
  text: string;   // e.g. "Fiqh al-Zakat — Yusuf al-Qaradawi"
  url?: string;   // readable source link
}

export interface RulingExplanation {
  ruling: string;            // short statement of the rule
  reasoning: string;         // why it applies to this asset decision
  citations: Citation[];
}

export interface AssetRuling {
  status: 'zakatable' | 'exempt' | 'override-zakatable' | 'override-exempt';
  madhabDefault: RulingExplanation;  // what the madhab says by default
  override?: RulingExplanation;      // shown when user overrode the default
  citations: Citation[];
}
```

A pure function `getAssetRuling(asset, methodologyName, config)` mirrors the exact decision chain in `isAssetZakatable` (`core/calculations/methodology.ts` used by `core/calculations/zakat.ts`):

1. `asset.zakatEligible === true` → status `override-zakatable`; madhabDefault explains what the madhab would have said.
2. `asset.zakatEligible === false` → status `override-exempt`.
3. Type default in `config.zakatableAssets` → status `zakatable` (or `exempt` if not in list).
4. Jewelry rule: `config.jewelryExempt && (GOLD|SILVER)` and no explicit override → `exempt` with the jewelry ruling.

**Coverage rule (CI-enforced):** a unit test iterates every `MethodologyName × AssetType` pair and fails if a ruling entry is missing or missing citations. Sync between `rulings.ts` and `METHODOLOGIES` is enforced by tests, not discipline.

**UI:** extend `CalculationBreakdown` (and the calculator results where the breakdown renders) — each category row gets an expandable "Why?" section: the ruling, the reasoning, and citation links (external, `rel="noopener noreferrer"`). Components stay presentational; ruling data comes from the new module.

**Maliki/Hanbali content:** added to `data/methodologies.ts` following the existing `Methodology` interface, with sources.

## Data Flow

`zakat.ts` calculation already produces per-asset zakatability. The breakdown component receives `methodology` (already a prop). Ruling lookup is a pure client-side function call — no new API calls, no state, no persistence.

## Error Handling

- Missing ruling entry (shouldn't happen due to CI test): fall back to a generic madhab-level explanation from `methodologies.ts` plus the standing scholar-consultation disclaimer; never render a blank.
- Citation URL failure is a plain external link — no runtime dependency.

## Testing

- **Seam:** `getAssetRuling(asset, methodologyName)` — the pure function at the boundary between calc config and display.
- Unit tests: every madhab × asset type pair has a ruling; override statuses produce the override explanation plus madhab default; jewelry exemption logic mirrors `isAssetZakatable` for all 5 madhabs.
- Component test: breakdown renders "Why?" toggle, ruling text, and citation links.
- Full client test suite must pass (`npm run test` in client).

## Risks

- **Drift between rulings and METHODOLOGIES configs** — mitigated by the coverage test.
- **Fiqh accuracy** — rulings are educational summaries with citations + the existing scholar disclaimer; content reviewed against cited sources. Not a fatwa source.