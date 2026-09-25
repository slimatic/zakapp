# Methodology Audit — what the app asserts, and what it cites

**Opened:** 2026-09-25 (14 Rabi' al-Thani 1448 AH). **Line:** `develop`.
**Method:** mechanical extraction, then parent verification against source. Every location
below was read directly; the extraction run is recorded but not trusted.

> **This document does not rule on fiqh.** It records what the code asserts, what it cites,
> and where those disagree. Any question of religious obligation routes to a named human
> scholar — Ustadh Ali Hazratji, Sheikh Abdellah El-Khalti, or Suhba Seminary faculty under
> Shaykh Mokhtar Maghraoui. Nothing here is a fatwa, and nothing here should be read as one.

---

## 1. The headline finding: two methodology systems that can disagree

The app contains **two independent madhhab rule-sets**, and they are not the same data.

| | Client path | Server path |
|---|---|---|
| Source | `client/src/core/calculations/methodology.ts` | `shared/src/constants/islamicConstants.ts` → `ZAKAT_METHODS` |
| Consumed by | `zakat.ts` via `getMethodology()`; `AssetForm.tsx`; `useAssetRepository.ts`; `rulings.ts` | `server/src/services/zakatEngine.ts`; `methodologyConfigService.ts`; `routes/zakat.ts` |
| Citations | **none** at the rule definitions | `scholarlyBasis` present on each method |
| Nisab basis | STANDARD/HANBALI/MALIKI/SHAFII → GOLD; HANAFI → SILVER | STANDARD `dual_minimum`; HANAFI `silver`; SHAFII `dual_minimum`; MALIKI `dual_flexible`; HANBALI `gold` |
| Debt deduction | STANDARD/SHAFII/MALIKI/HANBALI → LOAN + BUSINESS_DEBT; HANAFI adds MORTGAGE + CREDIT_CARD | STANDARD `immediate`; HANAFI `comprehensive`; SHAFII `conservative`; MALIKI `community_based`; HANBALI `conservative` |

**Consequence.** For the same user on the same madhhab, the client calculator and the server
engine can pick a different nisab basis and a different debt-deduction scope. A user could
reasonably see one obligation in the UI and another from the API. This is the single most
important correctness issue in the audit, and it is **structural, not a typo** — resolving it
means deciding which rule-set is canonical, which is a product and fiqh decision, not a
refactor.

**Not verified by me:** whether any runtime path *actually* hits both systems for one
calculation. I confirmed both are wired and reachable; I did not trace an end-to-end request
that exercises both. Treat the divergence as a live risk, not a proven user-visible bug.

## 2. Rules the app enforces, and their citations

### 2.1 Cited (a source is named in-code)

| Rule | Location | Source as cited |
|---|---|---|
| 2.5% rate, one hawl | `islamicConstants.ts:54-64` | Quran 9:60; Sahih al-Bukhari; Sahih Muslim |
| Gold nisab 87.48g | `islamicConstants.ts:21-30` | Simple Zakat Guide |
| Silver nisab 612.36g | `islamicConstants.ts:32-40` | Simple Zakat Guide |
| Hawl = 354 days | `islamicConstants.ts:93-103` | Umm al-Qura calendar system |
| Debt-deduction opinions (3) | `islamicConstants.ts:145-174` | Hanafi + Maliki madhabs; "some contemporary scholars" + Hanbali; Shafi'i position |
| Agriculture 10%/5%, rikaz 20% (unimplemented) | `islamicConstants.ts:66-85` | Sahih al-Bukhari 1483; Sahih al-Bukhari 1499 |
| Per-madhhab `scholarlyBasis` | `islamicConstants.ts:607-813` | AAOIFI FAS 9; Al-Hidayah; Al-Majmu'; Al-Mudawwana; Bidayat al-Mujtahid; Al-Mughni |
| Hanafi/Shafii classical sources | `shared/src/constants.ts:375-421` | Al-Hidayah (al-Marghinani); Fath al-Qadir (Ibn al-Humam); Al-Majmu' / Minhaj al-Talibin (al-Nawawi) |
| Organizations | `islamicConstants.ts:382-392` | AAOIFI; Fiqh Council of North America; European Council for Fatwa and Research |

These are the app's strongest claims: a named source exists, and a reader can go check it.

### 2.2 Uncited, but load-bearing for the math

| Rule | Location | Status |
|---|---|---|
| Nisab basis per madhab | `methodology.ts:35,51,67,83,99` | no source |
| Zakatable asset lists per madhab | `methodology.ts:36-45,52-60,69-76,85-92,101-108` | no source |
| `deductibleLiabilities` per madhab | `methodology.ts:46,62,78,94,110` | no source in the enforcing code |
| `jewelryExempt` per madhab | `methodology.ts:63,79,95,111` | no source in the enforcing code |
| Debt-deduction timing rule | `wealthCalculator.ts:109-120` | cites only an internal marker `Rule (@faqih 2.3)`; **no such rule text exists in-repo** |
| Retirement 0.5% / 20% factor | `zakat.ts:123-126`; `AssetForm.tsx:138`; `RetirementTreatmentSection.tsx:83-84` | no source |
| Retirement "collectible value" (penalty 10%, tax 25%) | `RetirementTreatmentSection.tsx:47,50` | no source; the ReportGenerator labels it "(Majority Opinion)" with no attribution |
| Passive investment 30% rule | `zakat.ts:153-156`; `islamicConstants.ts:576-581` | "some scholarly opinions", unnamed |
| Fallback metal prices | `nisab.ts:26-27`; `NisabService.ts:140,206`; `islamicConstants.ts:315,325` | no source, and mutually inconsistent between files |
| Nisab-basis defaults | `hawlTrackingService.ts:167-169`; `nisabCalculationService.ts:68`; `nisabYearRecordService.ts:171,174` | "standard fiqh default" — no source |

The jewellery and debt-deduction matrices are the notable gap: the app **enforces** them but
does not cite them, while prose copies elsewhere (`ReportGenerator.ts`, `rulings.ts`) do carry
citations. The source exists in the repo — the calculation path just does not reference it.

### 2.3 A named scholar with no work cited

`Dr. Salah Al-Sawy` is named three times as the basis for the 0.5% retirement opinion
(`asset.types.ts:31`; `RetirementTreatmentSection.tsx:85,179`). No book, page, or ruling
reference accompanies it anywhere in the codebase. **A named scholar without a locatable
reference is not a verified attribution** — it needs a source or it needs to say it is
uncited.

## 3. Contradictions found

### 3.1 Hawl interruption — two rules, one live, one dead

| Rule | Location | Wired in? |
|---|---|---|
| 24-hour grace period; below nisab >24h interrupts the hawl | `islamicConstants.ts:113-122` (source: Simple Zakat Guide) | **NO — defined, never consumed anywhere** |
| Hawl breaks only at absolute zero (`$1` floor) | `hawlTrackingService.ts:47,189,388` (source: 'Nurturing Mountains') | **YES — this is what runs** |

These are materially different obligations. The cited-and-defined rule is dead code; the
running rule rests on a book title with no page or edition. Neither is reconciled anywhere.

### 3.2 Nisab grams — two values, six files

- **87.48g gold / 612.36g silver** — `islamicConstants.ts:30,40` (cited to Simple Zakat Guide)
- **85g gold / 595g silver** — `server/src/shared_local.ts:428-433`; six entries in
  `client/src/data/methodologies.ts`; `GettingStarted.tsx:116`; `AssetCategories.tsx:226,228`

Both sets are presented to users. They yield different thresholds and therefore different
obligations for the same wealth.

### 3.3 Nisab basis — GOLD default vs "Silver Standard"

`methodology.ts:35` and `nisabCalculationService.ts:68` default to GOLD, while
`ReportGenerator.ts:235` prints "Standard Used: Silver Standard" and
`:247` says "Default: Hanafi". A generated report can misdescribe the calculation it reports.

### 3.4 Also flagged

- `nisab.ts:34` types the methodology parameter as `'SHAFI'` while `MethodologyName` uses
  `'SHAFII'` — a silent fallthrough to STANDARD is possible.
- `db/index.ts:78` writes `'GOLD'` while the schema default is `'gold'` — two vocabularies
  in one database.
- `userSettings.preferredNisabStandard` inherits the same mismatch.

## 4. The most serious single line in the codebase

```
server/src/services/snapshot.service.ts:95
const nisabThreshold = 7500; // Placeholder - should be calculated based on methodology
```

A **hardcoded nisab** that feeds a stored snapshot's `zakatDue`. This is the exact class of
fabrication the v1.0 plan forbids: an invented threshold presented as a calculation. It
carries its own admission that it is wrong. This needs either a real calculation or an
explicit refusal to present a figure.

## 5. What this means for the app's claim

The app's stated wedge is: *"It computes your zakat correctly, tells you when it is due, and
shows its reasoning."*

Today it can show a `$0.00` obligation from a field-name typo, a `$NaN` wealth with an
inverted nisab verdict, a snapshot built on an invented 7500 threshold, and two rule-sets
that disagree about the nisab basis. The *reasoning* surfaces are strong — `rulings.ts`,
per-madhab `scholarlyBasis`, the Simple Zakat Guide citations are real work. The
**arithmetic and enforcement** do not yet match them.

The gap is not that the app is wrong about fiqh. It is that the app does not consistently
know which rule-set it is running, and does not cite the rules it does enforce.

## 6. Recommended order — and who decides what

**Engineering can fix without a scholar:**
1. The `$0.00` / `$NaN` / wrong-field bugs (field-name correctness, no fiqh judgement).
2. `snapshot.service.ts:95` — remove the invented threshold.
3. The dead-vs-live hawl contradiction: pick **one** and wire it consistently. But which one
   is a scholar question — see below.
4. The 85/595 vs 87.48/612.36 split: pick one set. Which is correct is a scholar question.
5. Cite the enforced matrices (`methodology.ts`) at the point of enforcement, reusing the
   citations already present elsewhere in the repo.
6. Make `ReportGenerator` describe the calculation it actually ran.

**Requires a scholar, and must not be decided by engineering:**
- Which hawl-interruption rule the app should follow.
- Whether the client or server rule-set is canonical, and whether they should be unified.
- Whether the retirement opinions (0.5% / collectible-value) are sound as presented, and
  whether naming Dr. Salah Al-Sawy without a reference is acceptable.
- Whether `dual_minimum` ("lower of gold or silver") is the right default for STANDARD.

**Every item in the second list is out of scope for this agent** and routes to the teachers.

---

## Appendix — provenance

Extraction was performed by a read-only subagent instructed to reproduce citations verbatim
and to mark anything uncited rather than reconstruct it. **Its output was treated as a
lead, not as evidence:** every location in this document was re-read by the parent before
being recorded. Items I did not personally confirm are marked as such inline.

Three claims from the extraction that I checked and confirmed:
- `zircon*` field names in `ZakatDisplayCard.tsx` (12 occurrences, introduced by `da726d46`)
- `snapshot.service.ts:95` hardcoded 7500
- `INTERRUPTION_GRACE_PERIOD_HOURS` defined but never consumed
