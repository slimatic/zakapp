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

/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Hawl Detection & Reconciliation Job (T046)
 * 
 * Hourly background task that acts as a SAFETY NET and RECONCILIATION system.
 * Primary responsibility for Hawl management lies with real-time triggers.
 * 
 * This job:
 * 1. Reconciles DRAFT records (fixes drift between actual vs recorded wealth)
 * 2. Detects missed Nisab crossings (backup mechanism)
 * 3. Monitors and logs Hawl interruptions/completions
 */

import { Logger } from '../utils/logger';
import { PrismaClient } from '@prisma/client';
import { NisabCalculationService } from '../services/nisabCalculationService';
import { HawlTrackingService } from '../services/hawlTrackingService';
import { WealthAggregationService } from '../services/wealthAggregationService';
import { NisabYearRecordService } from '../services/nisabYearRecordService';
import { AuditTrailService } from '../services/auditTrailService';

export interface HawlDetectionJobResult {
  startTime: Date;
  endTime: Date;
  durationMs: number;
  usersProcessed: number;
  reconciledRecords: number;
  nisabAchievements: number;
  hawlInterruptions: number;
  hawlCompletions: number;
  errors: string[];
  errorCount: number;
}

/**
 * Run the Hawl detection & reconciliation job
 * Called hourly by job scheduler
 * 
 * Flow:
 * 1. Iterate through all users
 * 2. Calculate current zakatable wealth
 * 3. RECONCILIATION: Check if active DRAFT record matches actual wealth
 *    - If drift detected (> 1.0 unit), update record
 * 4. SAFETY NET: Check for missed state changes
 *    - Missed Nisab start
 *    - Missed Interruption
 *    - Missed Completion
 * 5. Log all actions
 */
export async function runHawlDetectionJob(
  prisma: PrismaClient,
  nisabCalcService: NisabCalculationService,
  hawlTrackingService: HawlTrackingService,
  wealthAggService: WealthAggregationService,
  nisabYearRecordService: NisabYearRecordService,
  auditTrailService: AuditTrailService
): Promise<HawlDetectionJobResult> {
  const logger = new Logger('hawlDetectionJob');
  const startTime = new Date();
  const result: HawlDetectionJobResult = {
    startTime,
    endTime: new Date(),
    durationMs: 0,
    usersProcessed: 0,
    reconciledRecords: 0,
    nisabAchievements: 0,
    hawlInterruptions: 0,
    hawlCompletions: 0,
    errors: [],
    errorCount: 0,
  };

  try {
    logger.info('Starting Hawl detection & reconciliation job');

    // Get all active users
    const users = await prisma.user.findMany({
      select: { id: true, preferredCalendar: true },
    });

    logger.info(`Processing ${users.length} users`);

    // Process each user
    for (const user of users) {
      try {
        result.usersProcessed++;

        // Get current zakatable wealth
        const wealthData = await wealthAggService.calculateTotalZakatableWealth(user.id);
        
        // Parse the encrypted wealth data
        const zakatableAmount = wealthData.totalZakatableWealth;

        // Check if user has a current DRAFT record
        const draftRecords = await prisma.yearlySnapshot.findMany({
          where: {
            userId: user.id,
            status: 'DRAFT',
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
        });

        const currentRecord = draftRecords[0];

        // Get current Nisab threshold
        const nisabData = await nisabCalcService.calculateNisabThreshold(
          'USD', // Use USD as default
          'GOLD' // Default to GOLD for detection
        );

        const nisabAmount = nisabData.selectedNisab;
        const isAboveNisab = zakatableAmount >= nisabAmount;

        // --- RECONCILIATION LOGIC ---
        if (currentRecord) {
          const recordedWealth = Number(currentRecord.zakatableWealth);
          // Check for drift > 1.0 (to avoid floating point noise)
          if (Math.abs(recordedWealth - zakatableAmount) > 1.0) {
            await prisma.yearlySnapshot.update({
              where: { id: currentRecord.id },
              data: {
                zakatableWealth: zakatableAmount.toString(),
                totalWealth: wealthData.totalWealth?.toString() || zakatableAmount.toString(), // Estimate total if not available
              } as any,
            });
            
            result.reconciledRecords++;
            logger.debug(`Reconciled wealth for user ${user.id}: ${recordedWealth} -> ${zakatableAmount}`);
            
            // We don't continue here, we proceed to check state transitions based on NEW wealth
          }
        }

        /**
         * SAFETY NET: Case 1: No active record AND wealth >= Nisab
         * → Missed Nisab achievement detection
         */
        if (!currentRecord && isAboveNisab) {
          // Create new record directly
          await prisma.yearlySnapshot.create({
            data: {
              userId: user.id,
              status: 'DRAFT',
              nisabBasis: 'GOLD',
              nisabType: 'gold',
              nisabThreshold: nisabAmount.toString(),
              calculationDate: new Date(),
              gregorianYear: new Date().getFullYear(),
              gregorianMonth: new Date().getMonth() + 1,
              gregorianDay: new Date().getDate(),
              hijriYear: 0,
              hijriMonth: 0,
              hijriDay: 0,
              totalWealth: (wealthData.totalWealth || zakatableAmount).toString(),
              totalLiabilities: '0',
              zakatableWealth: zakatableAmount.toString(),
              zakatAmount: '0',
              methodologyUsed: 'standard',
              assetBreakdown: '{}',
              calculationDetails: '{}',
            } as any,
          });

          result.nisabAchievements++;
          logger.info(`SAFETY NET: Detected missed Nisab achievement for user ${user.id}`);
          continue;
        }

        /**
         * SAFETY NET: Case 2: Active record exists
         * Check for missed state transitions
         */
        if (currentRecord) {
          // Check if Hawl not started yet
          const hawlNotStarted = !currentRecord.hawlStartDate;

          // If Hawl not started yet, start it now (Nisab still above threshold)
          if (hawlNotStarted && isAboveNisab) {
            await prisma.yearlySnapshot.update({
              where: { id: currentRecord.id },
              data: {
                hawlStartDate: new Date(),
                status: 'DRAFT',
              } as any,
            });

            await auditTrailService.recordEvent(
              user.id,
              'NISAB_ACHIEVED',
              currentRecord.id,
              {
                afterState: {
                  hawlStartDate: new Date(),
                  status: 'DRAFT',
                },
                reason: 'SAFETY NET: Triggered by reconciliation job'
              }
            );

            result.nisabAchievements++;
            logger.info(`SAFETY NET: Started missed Hawl for user ${user.id}`);
            continue;
          }

          // If Hawl is active, check for interruption (wealth dropped below Nisab)
          if (currentRecord.hawlStartDate && !isAboveNisab) {
            // Record the interruption but keep status as DRAFT
            await prisma.yearlySnapshot.update({
              where: { id: currentRecord.id },
              data: {
                status: 'DRAFT', // Mark as still draft, but hawl was interrupted
              },
            });

            await auditTrailService.recordEvent(
              user.id,
              'HAWL_INTERRUPTED',
              currentRecord.id,
              {
                interruptionDetails: {
                  currentWealth: wealthData.totalZakatableWealth,
                  nisabThreshold: nisabData.selectedNisab,
                  interruptionDate: new Date(),
                },
                reason: 'SAFETY NET: Triggered by reconciliation job'
              }
            );

            result.hawlInterruptions++;
            logger.info(`SAFETY NET: Detected missed Hawl interruption for user ${user.id}`);
            continue;
          }

          // If Hawl is active and above Nisab, check for completion
          if (currentRecord.hawlStartDate && isAboveNisab) {
            const isComplete = await hawlTrackingService.isHawlComplete(
              currentRecord.hawlStartDate
            );

            if (isComplete && !currentRecord.hawlCompletionDate) {
              // Mark hawl completion date but keep as DRAFT
              await prisma.yearlySnapshot.update({
                where: { id: currentRecord.id },
                data: {
                  hawlCompletionDate: new Date(),
                  status: 'DRAFT', // Keep as draft, user manually finalizes
                } as any,
              });

              result.hawlCompletions++;
              logger.info(`SAFETY NET: Detected missed Hawl completion for user ${user.id}`);
            }
          }
        }
      } catch (userError) {
        result.errorCount++;
        const errorMsg = `Error processing user ${user.id}: ${
          userError instanceof Error ? userError.message : String(userError)
        }`;
        result.errors.push(errorMsg);
        logger.error(errorMsg);
      }
    }

    const endTime = new Date();
    result.endTime = endTime;
    result.durationMs = endTime.getTime() - startTime.getTime();

    logger.info(
      `Hawl detection job complete: ` +
      `${result.usersProcessed} users, ` +
      `${result.reconciledRecords} reconciled, ` +
      `${result.nisabAchievements} achievements, ` +
      `${result.hawlInterruptions} interruptions, ` +
      `${result.hawlCompletions} completions, ` +
      `${result.errorCount} errors, ` +
      `${result.durationMs}ms`
    );

    // Performance check: warn if exceeds target
    if (result.durationMs > 30000) {
      logger.warn(
        `⚠️ Hawl detection job exceeded target time: ${result.durationMs}ms > 30000ms`
      );
    }

    return result;
  } catch (error) {
    logger.error('Hawl detection job failed', error);
    result.errorCount++;
    result.errors.push(
      `Job execution failed: ${error instanceof Error ? error.message : String(error)}`
    );
    throw error;
  }
}

/**
 * Job configuration for scheduler
 */
export const hawlDetectionJobConfig = {
  name: 'hawlDetectionJob',
  schedule: '0 * * * *', // Every hour at minute 0
  description: 'Hourly Hawl detection: Nisab achievement, interruptions, completions',
  timeout: 30000, // 30 second timeout
  maxRetries: 3,
  retryDelay: 5000, // 5 second delay between retries
};
