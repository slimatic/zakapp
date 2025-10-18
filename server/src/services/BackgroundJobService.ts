import { redisCache } from './RedisCacheService';

export interface JobData {
  id: string;
  type: string;
  userId: string;
  data: Record<string, unknown>;
  priority?: 'low' | 'normal' | 'high';
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: Record<string, unknown>;
  error?: string;
  retryCount?: number;
  maxRetries?: number;
}

export interface JobOptions {
  priority?: 'low' | 'normal' | 'high';
  delay?: number; // Delay in milliseconds
  maxRetries?: number;
  timeout?: number; // Timeout in milliseconds
}

export class BackgroundJobService {
  private readonly JOB_PREFIX = 'job:';
  private readonly QUEUE_PREFIX = 'queue:';
  private readonly PROCESSING_PREFIX = 'processing:';

  /**
   * Add a job to the queue
   */
  async addJob(type: string, userId: string, data: Record<string, unknown>, options: JobOptions = {}): Promise<string> {
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const job: JobData = {
      id: jobId,
      type,
      userId,
      data,
      priority: options.priority || 'normal',
      createdAt: new Date(),
      status: 'pending',
      retryCount: 0,
      maxRetries: options.maxRetries || 3,
    };

    // Store job data
    await redisCache.set(`${this.JOB_PREFIX}${jobId}`, job, { ttl: 86400 }); // 24 hours

    // Add to appropriate queue
    const queueKey = `${this.QUEUE_PREFIX}${job.priority}`;
    await this.addToQueue(queueKey, jobId, options.delay);

    return jobId;
  }

  /**
   * Add job ID to queue with optional delay
   */
  private async addToQueue(queueKey: string, jobId: string, delay?: number): Promise<void> {
    if (delay && delay > 0) {
      // Use Redis sorted set with score as execution time
      const executeAt = Date.now() + delay;
      await redisCache.executeCommand('zadd', queueKey, executeAt, jobId);
    } else {
      // Add to immediate queue
      await redisCache.executeCommand('lpush', queueKey, jobId);
    }
  }

  /**
   * Get next job from queue
   */
  async getNextJob(priority: 'high' | 'normal' | 'low' = 'normal'): Promise<JobData | null> {
    // Check delayed jobs first
    const delayedJobId = await this.getDelayedJob(`${this.QUEUE_PREFIX}${priority}`);
    if (delayedJobId) {
      return await this.getJob(delayedJobId);
    }

    // Check immediate queue
    const jobId = await redisCache.executeCommand('rpop', `${this.QUEUE_PREFIX}${priority}`) as string;
    if (jobId) {
      return await this.getJob(jobId);
    }

    return null;
  }

  /**
   * Get delayed job if ready for execution
   */
  private async getDelayedJob(queueKey: string): Promise<string | null> {
    const now = Date.now();
    const delayedJobs = await redisCache.executeCommand('zrangebyscore', queueKey, 0, now, { limit: { offset: 0, count: 1 } }) as string[];

    if (delayedJobs.length > 0) {
      const jobId = delayedJobs[0];
      // Remove from delayed queue
      await redisCache.executeCommand('zrem', queueKey, jobId);
      return jobId;
    }

    return null;
  }

  /**
   * Get job data by ID
   */
  async getJob(jobId: string): Promise<JobData | null> {
    return await redisCache.get<JobData>(`${this.JOB_PREFIX}${jobId}`);
  }

  /**
   * Update job status
   */
  async updateJobStatus(jobId: string, status: JobData['status'], result?: Record<string, unknown>, error?: string): Promise<void> {
    const job = await this.getJob(jobId);
    if (!job) return;

    job.status = status;

    if (status === 'processing') {
      job.startedAt = new Date();
    } else if (status === 'completed') {
      job.completedAt = new Date();
      job.result = result;
    } else if (status === 'failed') {
      job.error = error;
      job.retryCount = (job.retryCount || 0) + 1;
    }

    await redisCache.set(`${this.JOB_PREFIX}${jobId}`, job, { ttl: 86400 });
  }

  /**
   * Mark job as processing
   */
  async markJobProcessing(jobId: string): Promise<void> {
    await redisCache.set(`${this.PROCESSING_PREFIX}${jobId}`, true, { ttl: 3600 }); // 1 hour
    await this.updateJobStatus(jobId, 'processing');
  }

  /**
   * Complete job
   */
  async completeJob(jobId: string, result: Record<string, unknown>): Promise<void> {
    await redisCache.delete(`${this.PROCESSING_PREFIX}${jobId}`);
    await this.updateJobStatus(jobId, 'completed', result);
  }

  /**
   * Fail job
   */
  async failJob(jobId: string, error: string): Promise<void> {
    const job = await this.getJob(jobId);
    if (!job) return;

    const shouldRetry = (job.retryCount || 0) < (job.maxRetries || 3);

    if (shouldRetry) {
      // Re-queue job with backoff delay
      const delay = Math.pow(2, job.retryCount || 0) * 1000; // Exponential backoff
      await this.addToQueue(`${this.QUEUE_PREFIX}${job.priority}`, jobId, delay);
      await this.updateJobStatus(jobId, 'pending');
    } else {
      await redisCache.delete(`${this.PROCESSING_PREFIX}${jobId}`);
      await this.updateJobStatus(jobId, 'failed', undefined, error);
    }
  }

  /**
   * Get job statistics
   */
  async getJobStats(): Promise<Record<string, unknown>> {
    try {
      const queues = ['high', 'normal', 'low'];
      const stats: Record<string, unknown> = {};

      for (const priority of queues) {
        const queueKey = `${this.QUEUE_PREFIX}${priority}`;
        const length = await redisCache.executeCommand('llen', queueKey) as number;
        const delayedCount = await redisCache.executeCommand('zcount', queueKey, 0, Date.now() + 86400000) as number; // Next 24 hours

        stats[priority] = {
          immediate: length,
          delayed: delayedCount,
          total: length + delayedCount,
        };
      }

      return stats;
    } catch (error) {
      console.error('Error getting job stats:', error);
      return { error: (error as Error).message };
    }
  }

  /**
   * Clean up old completed jobs
   */
  async cleanupOldJobs(olderThanHours: number = 24): Promise<number> {
    try {
      const cutoffTime = Date.now() - (olderThanHours * 60 * 60 * 1000);
      const pattern = `${this.JOB_PREFIX}*`;

      const keys = await redisCache.executeCommand('keys', pattern) as string[];
      let cleanedCount = 0;

      for (const key of keys) {
        const job = await redisCache.get<JobData>(key.replace(this.JOB_PREFIX, ''));
        if (job && job.completedAt && job.completedAt.getTime() < cutoffTime) {
          await redisCache.delete(key.replace(this.JOB_PREFIX, ''));
          cleanedCount++;
        }
      }

      return cleanedCount;
    } catch (error) {
      console.error('Error cleaning up old jobs:', error);
      return 0;
    }
  }
}

// Export singleton instance
export const backgroundJobs = new BackgroundJobService();