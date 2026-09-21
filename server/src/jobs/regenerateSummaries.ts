/**
 * Copyright (c) 2024 ZakApp Contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

/**
 * Summary Regeneration Job
 * 
 * Regenerates AnnualSummary reports when underlying data (snapshots, payments)
 * has been updated. This ensures summaries reflect the latest data without
 * requiring manual user action.
 * 
 * Schedule: Daily at 4:00 AM
 * Duration: ~1-3s depending on data volume
 */

import { PrismaClient } from '@prisma/client';
import { Logger } from '../utils/logger';
import { EncryptionService } from '../services/EncryptionService';

const logger = new Logger('SummaryRegeneration');
const prisma = new PrismaClient();


/**
 * Read a stored numeric amount that may be ciphertext.
 *
 * WHY THIS EXISTS
 *
 * `PaymentRecord.amount`, `YearlySnapshot.zakatAmount` and the `AnnualSummary`
 * totals are all `String // Encrypted` in the schema, and production holds real
 * ciphertext — values like
 * `"HWXQ098Y/CRwFrkCo2j/Og==:7aqR3gmgwjBIlBBwiCNWJQ=="`.
 *
 * The previous code called `Number(payment.amount)` on those directly. `Number()`
 * of a ciphertext string is `NaN`, and `NaN` propagates: every total this job wrote
 * would have been the string "NaN". That is the same class of defect as the payment
 * NaN bug fixed in 0.16.7, reached from the scheduled-job side instead of the API.
 *
 * Deciding "plain number or ciphertext?" from the CONTENT is the reliable test.
 * `EncryptionService.isEncrypted()` is not: it requires each base64 group to be at
 * least 12 characters, so the ciphertext of a plaintext shorter than 7 characters is
 * reported as not-encrypted. So parse as a number first, and only attempt decryption
 * when that fails.
 *
 * Throws rather than returning NaN when a value resolves to neither. A job that
 * cannot read an amount should report a failure, not silently persist "NaN" — the
 * caller catches per-snapshot and records the error.
 */
export async function readEncryptedAmount(
  raw: unknown,
  encryptionKey: string
): Promise<number> {
  if (raw === null || raw === undefined) {
    return 0;
  }

  if (typeof raw === 'number') {
    if (!Number.isFinite(raw)) {
      throw new Error(`Amount is not a finite number: ${JSON.stringify(raw)}`);
    }
    return raw;
  }

  const asString = String(raw);

  // Plain numeric string — the fast, common path.
  const asPlainNumber = Number(asString);
  if (asString.trim() !== '' && Number.isFinite(asPlainNumber)) {
    return asPlainNumber;
  }

  // Otherwise it should be ciphertext. Try the plausible separator forms and let
  // AES-GCM authentication decide which one is real.
  const candidates: string[] = [];
  if (EncryptionService.isEncrypted(asString)) candidates.push(asString);

  for (const sep of [':', '.=', '.', '|', ';']) {
    if (!asString.includes(sep)) continue;
    const parts = asString.split(sep);
    if (parts.length === 2 || parts.length === 3) {
      const normalized = parts.join(':');
      if (EncryptionService.isEncrypted(normalized)) candidates.push(normalized);
      // Also attempt the joined form even when isEncrypted() says no, so a short
      // body still reaches the decryption attempt.
      candidates.push(normalized);
    }
  }
  candidates.push(asString);

  for (const candidate of candidates) {
    try {
      const decrypted = await EncryptionService.decrypt(candidate, encryptionKey);
      const parsed = parseFloat(decrypted);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    } catch {
      // try the next candidate
    }
  }

  throw new Error(
    `Amount is neither a plain number nor decryptable ciphertext ` +
      `(length ${asString.length})`
  );
}


/**
 * Configuration for summary regeneration
 */
export const SUMMARY_REGEN_CONFIG = {
  // Regenerate summaries for snapshots modified within this window
  recentUpdateWindowDays: 7,
  // Maximum summaries to regenerate per run
  maxSummariesPerRun: 100,
};

/**
 * Regenerates annual summaries for recently updated snapshots
 * 
 * @returns Statistics about regeneration operation
 */
export async function regenerateAnnualSummaries(): Promise<{
  regenerated: number;
  failed: number;
  duration: number;
  errors: string[];
}> {
  const startTime = Date.now();
  const errors: string[] = [];
  let regenerated = 0;
  let failed = 0;

  try {
    logger.info('Starting summary regeneration');


    // Find snapshots updated recently that need summary refresh
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - SUMMARY_REGEN_CONFIG.recentUpdateWindowDays);

    const recentlyUpdatedSnapshots = await prisma.yearlySnapshot.findMany({
      where: {
        status: 'finalized',
        updatedAt: {
          gte: cutoffDate,
        },
      },
      include: {
        payments: true,
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
      take: SUMMARY_REGEN_CONFIG.maxSummariesPerRun,
    });

    logger.info(`Found ${recentlyUpdatedSnapshots.length} snapshots to regenerate`);


    for (const snapshot of recentlyUpdatedSnapshots) {
      try {
        // Decrypt before aggregating.
        //
        // These columns hold ciphertext, so `Number(...)` on them yields NaN and the
        // NaN propagates into every total below. Each amount is decrypted on its own
        // so one unreadable payment fails that snapshot loudly rather than quietly
        // poisoning the whole summary.
        const encryptionKey = process.env.ENCRYPTION_KEY || '';

        const paymentAmounts: number[] = [];
        for (const payment of snapshot.payments) {
          paymentAmounts.push(await readEncryptedAmount(payment.amount, encryptionKey));
        }

        const totalPaid = paymentAmounts.reduce((sum, amount) => sum + amount, 0);
        const paymentCount = snapshot.payments.length;

        // Group payments by recipient type
        const paymentsByType: Record<string, number> = {};
        for (let i = 0; i < snapshot.payments.length; i++) {
          const type = snapshot.payments[i].recipientType || 'other';
          paymentsByType[type] = (paymentsByType[type] || 0) + paymentAmounts[i];
        }

        // Calculate outstanding zakat
        const zakatAmount = await readEncryptedAmount(snapshot.zakatAmount, encryptionKey);
        const outstandingZakat = Math.max(0, zakatAmount - totalPaid);

        // Prepare encrypted data fields (NOTE: These should be encrypted in production)
        const recipientSummary = JSON.stringify(paymentsByType);
        // nisabThreshold is ALSO an encrypted column, so Number() on it yielded NaN
        // and JSON.stringify turned that into `threshold: null` — silently losing the
        // threshold rather than erroring. Prefer the non-deprecated
        // nisabThresholdAtStart, and fall back to the older column for snapshots
        // written before the rename.
        const nisabThresholdValue = await readEncryptedAmount(
          snapshot.nisabThresholdAtStart ?? snapshot.nisabThreshold,
          encryptionKey
        );
        const nisabInfo = JSON.stringify({
          threshold: nisabThresholdValue,
          type: snapshot.nisabType,
        });

        // Calculate date range (use snapshot date as both start/end for simplicity)
        const snapshotDate = snapshot.createdAt;

        // Check if summary already exists
        const existingSummary = await prisma.annualSummary.findFirst({
          where: {
            userId: snapshot.userId,
            snapshotId: snapshot.id,
          },
        });

        if (existingSummary) {
          // Update existing summary
          await prisma.annualSummary.update({
            where: {
              id: existingSummary.id,
            },
            data: {
              totalZakatCalculated: zakatAmount.toString(),
              totalZakatPaid: totalPaid.toString(),
              outstandingZakat: outstandingZakat.toString(),
              numberOfPayments: paymentCount,
              recipientSummary,
              assetBreakdown: snapshot.assetBreakdown,
              nisabInfo,
              methodologyUsed: snapshot.methodologyUsed,
            },
          });
        } else {
          // Create new summary
          await prisma.annualSummary.create({
            data: {
              userId: snapshot.userId,
              snapshotId: snapshot.id,
              gregorianYear: snapshot.gregorianYear,
              hijriYear: snapshot.hijriYear,
              startDate: snapshotDate,
              endDate: snapshotDate,
              totalZakatCalculated: zakatAmount.toString(),
              totalZakatPaid: totalPaid.toString(),
              outstandingZakat: outstandingZakat.toString(),
              numberOfPayments: paymentCount,
              recipientSummary,
              assetBreakdown: snapshot.assetBreakdown,
              comparativeAnalysis: '{}', // Empty for now
              methodologyUsed: snapshot.methodologyUsed,
              nisabInfo,
            },
          });
        }

        regenerated++;
        logger.info(`Regenerated summary for snapshot ${snapshot.id}`);

      } catch (error) {
        failed++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Failed to regenerate summary for snapshot ${snapshot.id}: ${errorMessage}`);
        logger.error(`Error for snapshot ${snapshot.id}:`, error);

      }
    }

    const duration = Date.now() - startTime;
    logger.info(`Regenerated ${regenerated} summaries, failed ${failed} in ${duration}ms`);


    return {
      regenerated,
      failed,
      duration,
      errors,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    errors.push(`Summary regeneration failed: ${errorMessage}`);
    logger.error('Error:', error);


    return {
      regenerated,
      failed,
      duration: Date.now() - startTime,
      errors,
    };
  }
}

/**
 * Job handler for scheduled execution
 */
export async function runSummaryRegenerationJob(): Promise<void> {
  logger.info('Job started');

  const result = await regenerateAnnualSummaries();

  if (result.errors.length > 0) {
    logger.error('Job completed with errors:', result.errors);

  } else {
    logger.info('Job completed successfully');

  }
}
