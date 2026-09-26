-- Add the recorded currency to calculations.
--
-- WHY: a calculation must display in the currency it was RECORDED in, not in
-- whatever the user's display currency happens to be later. Until now the
-- currency was not stored at all for calculations, so the rule could not be
-- honoured and history re-rendered under whatever settings were current.
--
-- SAFETY: purely additive. `ALTER TABLE ... ADD COLUMN` with a non-null default
-- does not rewrite or drop existing rows, and every existing record in practice
-- is USD, so the default is accurate rather than a guess. An older build ignores
-- the column and continues to work, so a rollback needs no data change.
--
-- Deliberately NOT backfilled: the stored amounts exist but the currency they
-- were entered in does not, and inventing one would be worse than defaulting.

-- AlterTable
ALTER TABLE "zakat_calculations" ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'USD';

-- AlterTable
ALTER TABLE "calculation_history" ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'USD';
