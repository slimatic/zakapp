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
 * Job Scheduler (T047)
 * 
 * Manages background jobs using node-cron or bull/bullmq
 * Registers hawlDetectionJob to run hourly
 */

import { Logger } from '../utils/logger';
import * as cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { NisabCalculationService } from '../services/nisabCalculationService';
import { HawlTrackingService } from '../services/hawlTrackingService';
import { WealthAggregationService } from '../services/wealthAggregationService';
import { NisabYearRecordService } from '../services/nisabYearRecordService';
import { AuditTrailService } from '../services/auditTrailService';
import {
  runHawlDetectionJob,
  hawlDetectionJobConfig,
  type HawlDetectionJobResult,
} from './hawlDetectionJob';

export interface SchedulerConfig {
  enabled: boolean;
  timezone?: string;
}

/**
 * Job Scheduler for background tasks
 * Manages registration and execution of all background jobs
 */
export class JobScheduler {
  private logger = new Logger('JobScheduler');
  private tasks: Map<string, cron.ScheduledTask> = new Map();
  private lastResults: Map<string, HawlDetectionJobResult> = new Map();

  constructor(
    private config: SchedulerConfig,
    private prisma: PrismaClient,
    private nisabCalcService: NisabCalculationService,
    private hawlTrackingService: HawlTrackingService,
    private wealthAggService: WealthAggregationService,
    private nisabYearRecordService: NisabYearRecordService,
    private auditTrailService: AuditTrailService
  ) {}

  /**
   * Initialize and register all jobs
   */
  async initialize(): Promise<void> {
    try {
      if (!this.config.enabled) {
        this.logger.info('Job scheduler disabled');
        return;
      }

      this.logger.info('Initializing job scheduler');

      // Register Hawl detection job
      this.registerHawlDetectionJob();

      this.logger.info(`✅ Job scheduler initialized with ${this.tasks.size} jobs`);
    } catch (error) {
      this.logger.error('Failed to initialize job scheduler', error);
      throw error;
    }
  }

  /**
   * Register the Hawl detection job
   * Runs: Every hour at minute 0 (0 * * * *)
   * Timezone: UTC (configurable)
   */
  private registerHawlDetectionJob(): void {
    try {
      const jobConfig = hawlDetectionJobConfig;

      this.logger.info(`Registering job: ${jobConfig.name} (${jobConfig.schedule})`);

      const task = cron.schedule(
        jobConfig.schedule,
        async () => {
          await this._executeJobWithRetry(
            jobConfig.name,
            () =>
              runHawlDetectionJob(
                this.prisma,
                this.nisabCalcService,
                this.hawlTrackingService,
                this.wealthAggService,
                this.nisabYearRecordService,
                this.auditTrailService
              ),
            jobConfig.maxRetries,
            jobConfig.retryDelay,
            jobConfig.timeout
          );
        },
        {
          timezone: this.config.timezone || 'UTC',
        }
      );

      this.tasks.set(jobConfig.name, task);
      this.logger.info(`✅ Job registered: ${jobConfig.name}`);
    } catch (error) {
      this.logger.error('Failed to register Hawl detection job', error);
      throw error;
    }
  }

  /**
   * Execute a job with retry logic and timeout
   * 
   * @param jobName - Job name for logging
   * @param jobFn - Job function to execute
   * @param maxRetries - Maximum retry attempts
   * @param retryDelay - Delay between retries (ms)
   * @param timeout - Job timeout (ms)
   */
  private async _executeJobWithRetry(
    jobName: string,
    jobFn: () => Promise<HawlDetectionJobResult>,
    maxRetries: number = 3,
    retryDelay: number = 5000,
    timeout: number = 30000
  ): Promise<void> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.logger.info(`🔄 Job execution started: ${jobName} (attempt ${attempt}/${maxRetries})`);

        // Execute with timeout
        const result = await Promise.race([
          jobFn(),
          new Promise<HawlDetectionJobResult>((_, reject) =>
            setTimeout(
              () => reject(new Error(`Job timeout after ${timeout}ms`)),
              timeout
            )
          ),
        ]);

        // Store result for inspection
        this.lastResults.set(jobName, result);

        // Log result summary
        this.logger.info(
          `✅ Job completed: ${jobName} | ` +
          `Users: ${result.usersProcessed} | ` +
          `Nisab: ${result.nisabAchievements} | ` +
          `Interruptions: ${result.hawlInterruptions} | ` +
          `Completions: ${result.hawlCompletions} | ` +
          `Errors: ${result.errorCount} | ` +
          `Duration: ${result.durationMs}ms`
        );

        // Log any errors from job execution
        if (result.errors.length > 0) {
          this.logger.warn(
            `⚠️ Job completed with errors: ${jobName}\n` +
            result.errors.map((e, i) => `  ${i + 1}. ${e}`).join('\n')
          );
        }

        return; // Success, exit retry loop
      } catch (error) {
        lastError = error as Error;
        this.logger.error(
          `❌ Job execution failed (attempt ${attempt}/${maxRetries}): ${jobName} - ${lastError.message}`
        );

        // Wait before retry
        if (attempt < maxRetries) {
          this.logger.info(`⏳ Retrying in ${retryDelay}ms...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
    }

    // All retries exhausted
    this.logger.error(
      `❌ Job failed after ${maxRetries} attempts: ${jobName} - ${lastError?.message}`
    );
  }

  /**
   * Manually trigger a job (for testing/debugging)
   * 
   * @param jobName - Name of job to trigger
   */
  async triggerJob(jobName: string): Promise<HawlDetectionJobResult | null> {
    try {
      this.logger.info(`🚀 Manually triggering job: ${jobName}`);

      if (jobName === 'hawlDetectionJob') {
        return await runHawlDetectionJob(
          this.prisma,
          this.nisabCalcService,
          this.hawlTrackingService,
          this.wealthAggService,
          this.nisabYearRecordService,
          this.auditTrailService
        );
      }

      throw new Error(`Unknown job: ${jobName}`);
    } catch (error) {
      this.logger.error(`Failed to trigger job ${jobName}`, error);
      throw error;
    }
  }

  /**
   * Get last execution result of a job
   * 
   * @param jobName - Job name
   */
  getLastResult(jobName: string): HawlDetectionJobResult | undefined {
    return this.lastResults.get(jobName);
  }

  /**
   * Get all registered jobs
   */
  getRegisteredJobs(): string[] {
    return Array.from(this.tasks.keys());
  }

  /**
   * Stop all scheduled tasks
   * Call this on graceful shutdown
   */
  stopAll(): void {
    this.logger.info('Stopping all scheduled jobs');

    for (const [jobName, task] of this.tasks.entries()) {
      try {
        task.stop();
        task.destroy();
        this.logger.info(`⏹️ Stopped job: ${jobName}`);
      } catch (error) {
        this.logger.error(`Failed to stop job ${jobName}`, error);
      }
    }

    this.tasks.clear();
    this.logger.info('All scheduled jobs stopped');
  }

  /**
   * Get scheduler status
   */
  getStatus(): {
    enabled: boolean;
    jobCount: number;
    jobs: Array<{
      name: string;
      status: string;
      lastResult?: HawlDetectionJobResult;
    }>;
  } {
    return {
      enabled: this.config.enabled,
      jobCount: this.tasks.size,
      jobs: Array.from(this.tasks.keys()).map(jobName => {
        const task = this.tasks.get(jobName);
        return {
          name: jobName,
          status: task ? 'scheduled' : 'unknown',
          lastResult: this.lastResults.get(jobName),
        };
      }),
    };
  }
}

/**
 * Factory function to create and initialize scheduler
 * Should be called from application startup
 * 
 * @param config - Scheduler configuration
 * @param services - Service instances
 * @returns Initialized scheduler
 */
export async function createJobScheduler(
  config: SchedulerConfig,
  prisma: PrismaClient,
  nisabCalcService: NisabCalculationService,
  hawlTrackingService: HawlTrackingService,
  wealthAggService: WealthAggregationService,
  nisabYearRecordService: NisabYearRecordService,
  auditTrailService: AuditTrailService
): Promise<JobScheduler> {
  const scheduler = new JobScheduler(
    config,
    prisma,
    nisabCalcService,
    hawlTrackingService,
    wealthAggService,
    nisabYearRecordService,
    auditTrailService
  );

  await scheduler.initialize();
  return scheduler;
}
