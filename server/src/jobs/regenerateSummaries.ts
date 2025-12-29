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

const prisma = new PrismaClient();

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
    // eslint-disable-next-line no-console
    console.log('[Summary Regeneration] Starting summary regeneration');

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

    // eslint-disable-next-line no-console
    console.log(`[Summary Regeneration] Found ${recentlyUpdatedSnapshots.length} snapshots to regenerate`);

    for (const snapshot of recentlyUpdatedSnapshots) {
      try {
        // Calculate summary statistics
        const totalPaid = snapshot.payments.reduce(
          (sum, payment) => sum + Number(payment.amount),
          0
        );
        const paymentCount = snapshot.payments.length;

        // Group payments by recipient type
        const paymentsByType: Record<string, number> = {};
        for (const payment of snapshot.payments) {
          const type = payment.recipientType || 'other';
          paymentsByType[type] = (paymentsByType[type] || 0) + Number(payment.amount);
        }

        // Calculate outstanding zakat
        const zakatAmount = Number(snapshot.zakatAmount);
        const outstandingZakat = Math.max(0, zakatAmount - totalPaid);

        // Prepare encrypted data fields (NOTE: These should be encrypted in production)
        const recipientSummary = JSON.stringify(paymentsByType);
        const nisabInfo = JSON.stringify({
          threshold: Number(snapshot.nisabThreshold),
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
        // eslint-disable-next-line no-console
        console.log(`[Summary Regeneration] Regenerated summary for snapshot ${snapshot.id}`);
      } catch (error) {
        failed++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Failed to regenerate summary for snapshot ${snapshot.id}: ${errorMessage}`);
        // eslint-disable-next-line no-console
        console.error(`[Summary Regeneration] Error for snapshot ${snapshot.id}:`, error);
      }
    }

    const duration = Date.now() - startTime;
    // eslint-disable-next-line no-console
    console.log(`[Summary Regeneration] Regenerated ${regenerated} summaries, failed ${failed} in ${duration}ms`);

    return {
      regenerated,
      failed,
      duration,
      errors,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    errors.push(`Summary regeneration failed: ${errorMessage}`);
    // eslint-disable-next-line no-console
    console.error('[Summary Regeneration] Error:', error);

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
  // eslint-disable-next-line no-console
  console.log('[Summary Regeneration] Job started');
  const result = await regenerateAnnualSummaries();
  
  if (result.errors.length > 0) {
    // eslint-disable-next-line no-console
    console.error('[Summary Regeneration] Job completed with errors:', result.errors);
  } else {
    // eslint-disable-next-line no-console
    console.log('[Summary Regeneration] Job completed successfully');
  }
}
