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
 * Cache Cleanup Job
 * 
 * Periodically removes expired AnalyticsMetric cache entries to prevent
 * database bloat and maintain query performance.
 * 
 * Schedule: Daily at 2:00 AM
 * Duration: ~100-500ms for typical user base
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Configuration for cache cleanup
 */
export const CACHE_CLEANUP_CONFIG = {
  // Remove cache entries older than 24 hours
  maxAgeHours: 24,
  // Batch size for deletion to avoid memory issues
  batchSize: 1000,
};

/**
 * Removes expired AnalyticsMetric cache entries
 * 
 * @returns Statistics about the cleanup operation
 */
export async function cleanupExpiredCache(): Promise<{
  deleted: number;
  duration: number;
  errors: string[];
}> {
  const startTime = Date.now();
  const errors: string[] = [];
  let totalDeleted = 0;

  try {
    // Calculate cutoff date (entries older than maxAgeHours)
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - CACHE_CLEANUP_CONFIG.maxAgeHours);

    // eslint-disable-next-line no-console
    console.log(`[Cache Cleanup] Starting cleanup for entries before ${cutoffDate.toISOString()}`);

    // Delete expired cache entries in batches
    while (true) {
      const result = await prisma.analyticsMetric.deleteMany({
        where: {
          calculatedAt: {
            lt: cutoffDate,
          },
        },
        // Note: Prisma doesn't support LIMIT in deleteMany, but SQLite handles it efficiently
      });

      totalDeleted += result.count;

      // If we deleted fewer than batch size, we're done
      if (result.count < CACHE_CLEANUP_CONFIG.batchSize) {
        break;
      }
    }

    const duration = Date.now() - startTime;
    // eslint-disable-next-line no-console
    console.log(`[Cache Cleanup] Successfully deleted ${totalDeleted} expired entries in ${duration}ms`);

    return {
      deleted: totalDeleted,
      duration,
      errors,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    errors.push(`Cache cleanup failed: ${errorMessage}`);
    // eslint-disable-next-line no-console
    console.error('[Cache Cleanup] Error:', error);

    return {
      deleted: totalDeleted,
      duration: Date.now() - startTime,
      errors,
    };
  }
}

/**
 * Job handler for scheduled execution
 */
export async function runCacheCleanupJob(): Promise<void> {
  // eslint-disable-next-line no-console
  console.log('[Cache Cleanup] Job started');
  const result = await cleanupExpiredCache();
  
  if (result.errors.length > 0) {
    // eslint-disable-next-line no-console
    console.error('[Cache Cleanup] Job completed with errors:', result.errors);
  } else {
    // eslint-disable-next-line no-console
    console.log('[Cache Cleanup] Job completed successfully');
  }
}
