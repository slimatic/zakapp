-- Record which exchange rate produced a calculation, so a saved record can later be
-- compared against the current rate.
--
-- WHY THIS EXISTS
--
-- CurrencyService previously supplied rates from a table hardcoded in 2023 (see the
-- 0.16.8 release). Because nothing recorded the rate used, a calculation computed at
-- a stale rate was indistinguishable from a correct one — there was no way to tell a
-- user "the figures you saved used a rate that has since moved 42%".
--
-- These columns are nullable on purpose. Existing rows keep NULL, which is the
-- honest value: their rate provenance is unknown. NULL is distinguishable from a
-- recorded rate, so a later comparison can say "unknown" rather than assuming
-- correctness.
--
-- Additive only: two nullable columns, no defaults, no backfill, no data touched.

ALTER TABLE "zakat_calculations" ADD COLUMN "fxRateUsed" REAL;
ALTER TABLE "zakat_calculations" ADD COLUMN "fxRateSource" TEXT;
