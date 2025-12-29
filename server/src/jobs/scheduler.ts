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
 * Job Scheduler Configuration
 * 
 * Centralizes all background job scheduling using node-cron.
 * Handles job initialization, graceful shutdown, and error recovery.
 */

import cron from 'node-cron';
import { runCacheCleanupJob } from './cleanupCache';
import { runReminderGenerationJob } from './generateReminders';
import { runSummaryRegenerationJob } from './regenerateSummaries';

/**
 * Job configuration interface
 */
interface JobConfig {
  name: string;
  schedule: string; // Cron expression
  handler: () => Promise<void>;
  enabled: boolean;
}

/**
 * All scheduled jobs configuration
 * Cron format: second(optional) minute hour dayOfMonth month dayOfWeek
 */
const JOBS: JobConfig[] = [
  {
    name: 'Cache Cleanup',
    schedule: '0 2 * * *', // Daily at 2:00 AM
    handler: runCacheCleanupJob,
    enabled: true,
  },
  {
    name: 'Reminder Generation',
    schedule: '0 3 * * *', // Daily at 3:00 AM
    handler: runReminderGenerationJob,
    enabled: true,
  },
  {
    name: 'Summary Regeneration',
    schedule: '0 4 * * *', // Daily at 4:00 AM
    handler: runSummaryRegenerationJob,
    enabled: true,
  },
];

/**
 * Active job scheduler tasks
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let scheduledTasks: any[] = [];

/**
 * Wraps job execution with error handling and logging
 */
function wrapJobHandler(jobName: string, handler: () => Promise<void>): () => void {
  return () => {
    // eslint-disable-next-line no-console
    console.log(`[Scheduler] Starting job: ${jobName}`);
    
    handler()
      .then(() => {
        // eslint-disable-next-line no-console
        console.log(`[Scheduler] Job completed: ${jobName}`);
      })
      .catch((error) => {
        // eslint-disable-next-line no-console
        console.error(`[Scheduler] Job failed: ${jobName}`, error);
      });
  };
}

/**
 * Initializes and starts all scheduled jobs
 * 
 * @param runImmediately - If true, runs all jobs once immediately (useful for testing)
 */
export function initializeJobs(runImmediately = false): void {
  // eslint-disable-next-line no-console
  console.log('[Scheduler] Initializing background jobs...');

  for (const job of JOBS) {
    if (!job.enabled) {
      // eslint-disable-next-line no-console
      console.log(`[Scheduler] Skipping disabled job: ${job.name}`);
      continue;
    }

    // Validate cron expression
    if (!cron.validate(job.schedule)) {
      // eslint-disable-next-line no-console
      console.error(`[Scheduler] Invalid cron expression for job ${job.name}: ${job.schedule}`);
      continue;
    }

    // Schedule the job
    const task = cron.schedule(job.schedule, wrapJobHandler(job.name, job.handler), {
      timezone: 'UTC', // Use UTC for consistency
    });

    scheduledTasks.push(task);
    // eslint-disable-next-line no-console
    console.log(`[Scheduler] Scheduled job: ${job.name} (${job.schedule})`);

    // Run immediately if requested (for testing)
    if (runImmediately) {
      // eslint-disable-next-line no-console
      console.log(`[Scheduler] Running job immediately: ${job.name}`);
      wrapJobHandler(job.name, job.handler)();
    }
  }

  // eslint-disable-next-line no-console
  console.log(`[Scheduler] Initialized ${scheduledTasks.length} jobs`);
}

/**
 * Stops all scheduled jobs gracefully
 * Should be called during server shutdown
 */
export function stopAllJobs(): void {
  // eslint-disable-next-line no-console
  console.log('[Scheduler] Stopping all scheduled jobs...');

  for (const task of scheduledTasks) {
    task.stop();
  }

  scheduledTasks = [];
  // eslint-disable-next-line no-console
  console.log('[Scheduler] All jobs stopped');
}

/**
 * Gets status of all scheduled jobs
 * 
 * @returns Array of job names and their status
 */
export function getJobStatus(): Array<{ name: string; enabled: boolean; schedule: string }> {
  return JOBS.map(job => ({
    name: job.name,
    enabled: job.enabled,
    schedule: job.schedule,
  }));
}

/**
 * Manually triggers a specific job
 * Useful for admin endpoints or debugging
 * 
 * @param jobName - Name of the job to trigger
 * @returns Promise that resolves when job completes
 */
export async function triggerJob(jobName: string): Promise<void> {
  const job = JOBS.find(j => j.name === jobName);
  
  if (!job) {
    throw new Error(`Job not found: ${jobName}`);
  }

  if (!job.enabled) {
    throw new Error(`Job is disabled: ${jobName}`);
  }

  // eslint-disable-next-line no-console
  console.log(`[Scheduler] Manually triggering job: ${jobName}`);
  await job.handler();
}
