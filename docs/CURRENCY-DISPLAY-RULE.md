# Currency display rule

**Decided:** 2026-09-20 · **Status:** authoritative — supersedes the assumption in #428/#429/#431

---

## The rule

**A record displays in the currency it was recorded in.**

If a calculation was made in IDR, it displays in IDR — always, on every screen,
regardless of what the user's display currency is set to today.

The Settings currency is a **default for new records**, not a lens applied to old
ones. Changing it must not retroactively re-label history.

### Why this is the right rule

Zakat is assessed on real holdings. An amount entered in Indonesian rupiah was
measured in rupiah; relabelling it as USD asserts a conversion that may never have
happened, at a rate nobody agreed to. Worse for a religious-finance tool: a user
who gave zakat on `Rp 15.750.000` must be able to see that figure again, not a
drifting dollar equivalent.

Consistency within one screen matters too. The pre-existing bug class (#310) was a
hardcoded `$` appearing above an `Rp` figure on the same card. One record, one
currency.

---

## What this changes about existing work

The three currency PRs (#428–#431) are still correct — they fixed real formatting
defects (Arabic-Indic digits, wrong symbols, inconsistent decimals). But they were
built on the assumption that a record should render in the user's *display*
currency. Under this rule, that assumption is wrong for stored records.

Specifically:

| Component group | Current behaviour | Should be |
|---|---|---|
| Records with their own currency (`AssetCard`, `ZakatResults`, `AssetList`, dashboard) | read `record.currency` — already correct | keep |
| Hardcoded-USD duplicates (#430) | show `$` always | **defer** — see the defect below |
| Display-currency duplicates (the remaining ~20) | show the user's display currency | **should read the record's currency** |

---

## The blocking defect

The rule cannot be implemented for calculations, because **the currency is not
stored.**

```
model ZakatCalculation   ✗ no currency column
model CalculationHistory ✗ no currency column
model Asset              ✓ currency String @default("USD")
model PaymentRecord      ✓ currency String @default("USD")
model ZakatPayment       ✓ currency String @default("USD")
```

And the calculation route (`server/src/routes/zakat.ts`) currently does this:

```ts
// SAVED — raw values, no currency label
prisma.zakatCalculation.create({ totalAssets: result.result.totals.totalAssets, … })

// RESPONDED — values multiplied by fxRate, labelled displayCurrency
summary: { totalAssets: presentation.totalAssets, currency: displayCurrency, fxRateFromUSD: fxRate }
```

Three consequences:

1. **A stored calculation has no recorded currency.** It is unknowable whether the
   row holds IDR or USD, so the display rule cannot be honoured for history.
2. **Re-reading loses the label.** History and snapshot views format with whatever
   the display currency is at that moment.
3. **Conversion can double-apply.** The response values are already `× fxRate`. If
   a client also converts for display, the amount is multiplied twice. That is a
   genuine money-correctness bug, not a cosmetic one.

This is the underlying cause of #310, not a formatting problem. The formatter work
was treating a symptom.

---

## Required order of work

1. **Add `currency` to `ZakatCalculation` and `CalculationHistory`** (additive
   migration, nullable or defaulted — no data loss, no backfill guess).
2. **Store raw, unconverted values** in those rows, with the currency that was
   actually in play.
3. **Stop converting in the response, or mark the conversion explicitly** so it
   cannot be applied twice. Pick one and test it.
4. **Then** migrate the remaining formatters to read the record's currency.
5. **Then** the settings currency applies only to new records.

Step 3 is the one with real money risk, so it needs a test that would fail on a
double conversion before the fix lands.

---

## Migration safety

- Adding a column is additive; existing rows get the default. No data loss.
- Existing rows cannot be backfilled with certainty — the raw values are there but
  the currency is not recorded. Do **not** guess. Default to USD (true for every
  current production record, verified: all 17 assets and 10 payments are USD) and
  let future records carry their own label.
- Rollback remains a version pin. The column is additive, so an older build ignores
  it and still works.
