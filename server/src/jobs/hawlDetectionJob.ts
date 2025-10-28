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
import { NisabCalculationService } from './nisabCalculationService';
import { HawlTrackingService } from './hawlTrackingService';
import { WealthAggregationService } from './wealthAggregationService';
import { NisabYearRecordService } from './nisabYearRecordService';
import { AuditTrailService } from './auditTrailService';

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

    // Get all users
    const users = await prisma.user.findMany({
      select: { id: true, currency: true },
    });

    logger.info(`Processing ${users.length} users`);

    // Process each user
    for (const user of users) {
      try {
        result.usersProcessed++;

        // Get current zakatble wealth
        const wealthData = await wealthAggService.calculateTotalZakatableWealth(user.id);
        if (wealthData.total === 0) {
          continue; // Skip users with no wealth
        }

        // Check if user has a current DRAFT record
        const draftRecords = await prisma.nisabYearRecord.findMany({
          where: {
            userId: user.id,
            status: 'DRAFT',
          },
          orderBy: { startDate: 'desc' },
          take: 1,
        });

        const currentRecord = draftRecords[0];

        // Get current Nisab threshold
        const nisabData = await nisabCalcService.calculateNisabThreshold(
          user.currency || 'USD',
          'GOLD' // Default to GOLD for detection
        );

        const isAboveNisab = wealthData.total >= nisabData.nisabAmount;

        /**
         * Case 1: No active record AND wealth >= Nisab
         * → Create new DRAFT record (Nisab achievement)
         */
        if (!currentRecord && isAboveNisab) {
          // Get current Hijri year
          const hijriDate = await hawlTrackingService.toHijriDate(new Date());
          const hijriYear = hijriDate.format('YYYY[H]');

          // Create new record
          await nisabYearRecordService.createRecord(user.id, {
            hijriYear,
            nisabBasis: 'GOLD',
            currency: user.currency || 'USD',
            notes: 'Auto-created by hawl detection job',
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
          // If Hawl not started yet, start it now (Nisab still above threshold)
          if (!currentRecord.hawlStartDate && isAboveNisab) {
            await prisma.nisabYearRecord.update({
              where: { id: currentRecord.id },
              data: {
                hawlStartDate: new Date(),
                hawlStatus: 'ACTIVE',
              },
            });

            await auditTrailService.recordEvent(
              user.id,
              'NISAB_ACHIEVED',
              currentRecord.id,
              {
                afterState: {
                  hawlStartDate: new Date(),
                  hawlStatus: 'ACTIVE',
                },
              }
            );

            result.nisabAchievements++;
            logger.debug(`Hawl started for user ${user.id}`);
            continue;
          }

          // If Hawl is active, check for interruption (wealth dropped below Nisab)
          if (currentRecord.hawlStartDate && currentRecord.hawlStatus === 'ACTIVE' && !isAboveNisab) {
            // Get previous wealth to compare (from last job run)
            // For now, we detect any drop below Nisab
            await prisma.nisabYearRecord.update({
              where: { id: currentRecord.id },
              data: {
                hawlStatus: 'INTERRUPTED',
                hawlInterruptionDate: new Date(),
              },
            });

            await auditTrailService.recordEvent(
              user.id,
              'HAWL_INTERRUPTED',
              currentRecord.id,
              {
                interruptionDetails: {
                  currentWealth: wealthData.total,
                  nisabThreshold: nisabData.nisabAmount,
                  interruptionDate: new Date(),
                },
              }
            );

            result.hawlInterruptions++;
            logger.debug(`Hawl interrupted for user ${user.id}`);
            continue;
          }

          // If Hawl is active and above Nisab, check for completion
          if (currentRecord.hawlStartDate && currentRecord.hawlStatus === 'ACTIVE' && isAboveNisab) {
            const isComplete = await hawlTrackingService.isHawlComplete(currentRecord.hawlStartDate);

            if (isComplete) {
              // Mark as ready for finalization (but don't finalize automatically)
              await prisma.nisabYearRecord.update({
                where: { id: currentRecord.id },
                data: {
                  hawlStatus: 'COMPLETE',
                  hawlCompletionDate: new Date(),
                },
              });

              result.hawlCompletions++;
              logger.debug(`Hawl completed for user ${user.id}`);
            }
          }

          // If Hawl was interrupted and wealth is above Nisab again, resume it
          if (currentRecord.hawlStatus === 'INTERRUPTED' && isAboveNisab) {
            // Option 1: Resume from interruption point (add gap to Hawl)
            // Option 2: Restart Hawl from now
            // Using Option 2: Restart (more conservative, resets 354-day clock)
            await prisma.nisabYearRecord.update({
              where: { id: currentRecord.id },
              data: {
                hawlStatus: 'ACTIVE',
                hawlStartDate: new Date(), // Reset start date
                hawlInterruptionDate: null,
              },
            });

            await auditTrailService.recordEvent(
              user.id,
              'NISAB_ACHIEVED',
              currentRecord.id,
              {
                afterState: {
                  hawlStatus: 'ACTIVE',
                  hawlStartDate: new Date(),
                },
              }
            );

            logger.debug(`Hawl resumed for user ${user.id}`);
          }
        }
      } catch (userError) {
        result.errorCount++;
        const errorMsg = `Error processing user ${user.id}: ${userError.message}`;
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
      logger.warn(`⚠️ Hawl detection job exceeded target time: ${result.durationMs}ms > 30000ms`);
    }

    return result;
  } catch (error) {
    logger.error('Hawl detection job failed', error);
    result.errorCount++;
    result.errors.push(`Job execution failed: ${error.message}`);
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
