import { redisCacheService } from './RedisCacheService';

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

/**
 * BackgroundJobService - Manages asynchronous job processing
 * Provides queue-based job management with retries and priorities
 */
export class BackgroundJobService {
  private readonly JOB_PREFIX = 'job:';
  private readonly QUEUE_PREFIX = 'queue:';
  private readonly PROCESSING_PREFIX = 'processing:';

  /**
   * Add a job to the queue
   */
  async addJob(
    type: string,
    userId: string,
    data: Record<string, unknown>,
    options: JobOptions = {}
  ): Promise<string> {
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
      maxRetries: options.maxRetries || 3
    };

    // Store job data
    await redisCacheService.set(`${this.JOB_PREFIX}${jobId}`, job, { ttl: 86400 }); // 24 hours

    // Add to queue
    const queueKey = `${this.QUEUE_PREFIX}${job.priority || 'normal'}`;
    await redisCacheService.executeCommand('lpush', queueKey, jobId);

    return jobId;
  }

  /**
   * Get next job from queue
   */
  async getNextJob(priority: 'low' | 'normal' | 'high' = 'normal'): Promise<JobData | null> {
    const queueKey = `${this.QUEUE_PREFIX}${priority}`;

    // Pop from queue
    const jobId = (await redisCacheService.executeCommand('rpop', queueKey)) as string | null;

    if (!jobId) {
      return null;
    }

    // Get job data
    const job = await redisCacheService.get<JobData>(`${this.JOB_PREFIX}${jobId}`);

    if (job) {
      // Move to processing
      job.status = 'processing';
      job.startedAt = new Date();
      await redisCacheService.set(`${this.PROCESSING_PREFIX}${jobId}`, job, { ttl: 3600 }); // 1 hour
      await redisCacheService.set(`${this.JOB_PREFIX}${jobId}`, job, { ttl: 86400 });
    }

    return job;
  }

  /**
   * Update job status
   */
  async updateJobStatus(
    jobId: string,
    status: 'completed' | 'failed',
    result?: Record<string, unknown> | null,
    error?: string
  ): Promise<void> {
    const job = await redisCacheService.get<JobData>(`${this.JOB_PREFIX}${jobId}`);

    if (job) {
      job.status = status;
      job.completedAt = new Date();
      if (result) {
        job.result = result;
      }
      if (error) {
        job.error = error;
      }

      await redisCacheService.set(`${this.JOB_PREFIX}${jobId}`, job, { ttl: 86400 });
      await redisCacheService.delete(`${this.PROCESSING_PREFIX}${jobId}`);
    }
  }

  /**
   * Retry a failed job
   */
  async retryJob(jobId: string): Promise<boolean> {
    const job = await redisCacheService.get<JobData>(`${this.JOB_PREFIX}${jobId}`);

    if (!job || !job.maxRetries) {
      return false;
    }

    if (job.retryCount && job.retryCount >= job.maxRetries) {
      return false;
    }

    // Increment retry count and reset status
    job.retryCount = (job.retryCount || 0) + 1;
    job.status = 'pending';
    job.error = undefined;
    job.startedAt = undefined;

    await redisCacheService.set(`${this.JOB_PREFIX}${jobId}`, job, { ttl: 86400 });

    // Re-add to queue
    const queueKey = `${this.QUEUE_PREFIX}${job.priority || 'normal'}`;
    await redisCacheService.executeCommand('lpush', queueKey, jobId);

    return true;
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId: string): Promise<JobData | null> {
    return await redisCacheService.get<JobData>(`${this.JOB_PREFIX}${jobId}`);
  }

  /**
   * Get queue length
   */
  async getQueueLength(priority: 'low' | 'normal' | 'high' = 'normal'): Promise<number> {
    const queueKey = `${this.QUEUE_PREFIX}${priority}`;
    const length = (await redisCacheService.executeCommand('llen', queueKey)) as number;
    return length || 0;
  }

  /**
   * Get job statistics
   */
  async getJobStats(): Promise<Record<string, number>> {
    try {
      const priorities = ['low', 'normal', 'high'] as const;
      const stats: Record<string, number> = {};

      for (const priority of priorities) {
        stats[`queue_${priority}`] = await this.getQueueLength(priority);
      }

      return stats;
    } catch {
      return {};
    }
  }

  /**
   * Clean up old completed jobs
   */
  async cleanupOldJobs(): Promise<void> {
    try {
      await redisCacheService.deleteByPattern(`${this.JOB_PREFIX}*`);
    } catch {
      // Silently fail - cleanup is non-critical
    }
  }

  /**
   * Cancel a pending job
   */
  async cancelJob(jobId: string): Promise<boolean> {
    const job = await redisCacheService.get<JobData>(`${this.JOB_PREFIX}${jobId}`);

    if (!job || job.status !== 'pending') {
      return false;
    }

    // Remove from queue
    const queueKey = `${this.QUEUE_PREFIX}${job.priority || 'normal'}`;
    await redisCacheService.executeCommand('lrem', queueKey, '1', jobId);

    // Delete job
    await redisCacheService.delete(`${this.JOB_PREFIX}${jobId}`);

    return true;
  }
}

// Export singleton instance
export const backgroundJobService = new BackgroundJobService();
