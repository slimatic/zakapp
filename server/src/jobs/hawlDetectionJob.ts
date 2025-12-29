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
 * Hawl Detection Background Job (T046)
 * 
 * Hourly background task that scans all users for:
 * 1. Nisab achievement (wealth crosses threshold)
 * 2. Hawl interruptions (wealth drops below threshold)
 * 3. Hawl completions (354 days reached)
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
  nisabAchievements: number;
  hawlInterruptions: number;
  hawlCompletions: number;
  errors: string[];
  errorCount: number;
}

/**
 * Run the Hawl detection job
 * Called hourly by job scheduler (see jobScheduler.ts)
 * 
 * Flow:
 * 1. Iterate through all users
 * 2. Calculate current zakatble wealth
 * 3. Check previous Hawl state
 * 4. Detect state changes:
 *    - Nisab not achieved → Nisab achieved: Create DRAFT record
 *    - Hawl ACTIVE → INTERRUPTED: Update record, log interruption
 *    - Hawl complete (354 days): Ready for finalization
 * 5. Log all changes to audit trail
 * 6. Return summary statistics
 * 
 * @returns Job result with statistics
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
    nisabAchievements: 0,
    hawlInterruptions: 0,
    hawlCompletions: 0,
    errors: [],
    errorCount: 0,
  };

  try {
    logger.info('Starting Hawl detection job');

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

        if (zakatableAmount === 0 || !zakatableAmount) {
          continue; // Skip users with no wealth
        }

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

        /**
         * Case 1: No active record AND wealth >= Nisab
         * → Create new DRAFT record (Nisab achievement)
         */
        if (!currentRecord && isAboveNisab) {
          // Create new record directly
          await prisma.yearlySnapshot.create({
            data: {
              userId: user.id,
              status: 'DRAFT',
              nisabBasis: 'GOLD',
              calculationDate: new Date(),
              gregorianYear: new Date().getFullYear(),
              gregorianMonth: new Date().getMonth() + 1,
              gregorianDay: new Date().getDate(),
              hijriYear: 0,
              hijriMonth: 0,
              hijriDay: 0,
              totalWealth: '0',
              totalLiabilities: '0',
              zakatableWealth: wealthData.totalZakatableWealth.toString(),
              zakatAmount: '0',
              methodologyUsed: 'standard',
            } as any,
          });

          result.nisabAchievements++;
          logger.debug(`Nisab achieved for user ${user.id}`);
          continue;
        }

        /**
         * Case 2: Active record exists
         * Check for state transitions
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
              }
            );

            result.nisabAchievements++;
            logger.debug(`Hawl started for user ${user.id}`);
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
              }
            );

            result.hawlInterruptions++;
            logger.debug(`Hawl interrupted for user ${user.id}`);
            continue;
          }

          // If Hawl is active and above Nisab, check for completion
          if (currentRecord.hawlStartDate && isAboveNisab) {
            const isComplete = await hawlTrackingService.isHawlComplete(
              currentRecord.hawlStartDate
            );

            if (isComplete) {
              // Mark hawl completion date but keep as DRAFT
              await prisma.yearlySnapshot.update({
                where: { id: currentRecord.id },
                data: {
                  hawlCompletionDate: new Date(),
                  status: 'DRAFT', // Keep as draft, user manually finalizes
                } as any,
              });

              result.hawlCompletions++;
              logger.debug(`Hawl completed for user ${user.id}`);
            }
          }

          // If Hawl was interrupted and wealth is above Nisab again, resume it
          if (hawlNotStarted && isAboveNisab) {
            // Restart Hawl from now
            await prisma.yearlySnapshot.update({
              where: { id: currentRecord.id },
              data: {
                hawlStartDate: new Date(),
              } as any,
            });

            await auditTrailService.recordEvent(
              user.id,
              'NISAB_ACHIEVED',
              currentRecord.id,
              {
                afterState: {
                  hawlStartDate: new Date(),
                },
              }
            );

            logger.debug(`Hawl resumed for user ${user.id}`);
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
