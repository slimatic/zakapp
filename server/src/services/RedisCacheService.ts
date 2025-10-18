import { createClient, RedisClientType } from 'redis';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string;
}

export interface CacheStats {
  keys: number;
  memory: string;
  uptime: number;
}

/**
 * RedisCacheService - Manages caching operations with Redis
 * Provides TTL support, pattern-based deletion, and graceful error handling
 */
export class RedisCacheService {
  private client: RedisClientType;
  private isConnected: boolean = false;
  private readonly defaultTTL: number = 3600; // 1 hour default
  private readonly keyPrefix: string = 'zakapp:';

  constructor() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

    this.client = createClient({
      url: redisUrl
    });

    this.setupEventHandlers();
  }

  /**
   * Setup Redis event handlers
   */
  private setupEventHandlers(): void {
    this.client.on('error', () => {
      // Log error silently or handle gracefully
      this.isConnected = false;
    });

    this.client.on('connect', () => {
      this.isConnected = true;
    });

    this.client.on('disconnect', () => {
      // Handle disconnect silently
      this.isConnected = false;
    });
  }

  /**
   * Connect to Redis
   */
  async connect(): Promise<void> {
    if (!this.isConnected) {
      await this.client.connect();
    }
  }

  /**
   * Disconnect from Redis
   */
  async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.client.disconnect();
    }
  }

  /**
   * Check if Redis is connected
   */
  isRedisConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Generate cache key with prefix
   */
  private generateKey(key: string, prefix?: string): string {
    const fullPrefix = prefix || this.keyPrefix;
    return `${fullPrefix}${key}`;
  }

  /**
   * Set a value in cache
   */
  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<void> {
    try {
      const cacheKey = this.generateKey(key, options.prefix);
      const serializedValue = JSON.stringify(value);
      const ttl = options.ttl || this.defaultTTL;

      await this.client.setEx(cacheKey, ttl, serializedValue);
    } catch (error) {
      // Silent error handling
      // Don't throw - cache failures shouldn't break the app
    }
  }

  /**
   * Get a value from cache
   */
  async get<T = unknown>(key: string, prefix?: string): Promise<T | null> {
    try {
      const cacheKey = this.generateKey(key, prefix);
      const value = await this.client.get(cacheKey);

      if (value) {
        return JSON.parse(value) as T;
      }

      return null;
    } catch (error) {
      // Silent error handling
      return null;
    }
  }

  /**
   * Delete a key from cache
   */
  async delete(key: string, prefix?: string): Promise<void> {
    try {
      const cacheKey = this.generateKey(key, prefix);
      await this.client.del(cacheKey);
    } catch (error) {
      // Silent error handling
    }
  }

  /**
   * Delete all keys matching a pattern
   */
  async deleteByPattern(pattern: string, prefix?: string): Promise<void> {
    try {
      const fullPattern = this.generateKey(pattern, prefix);
      const keys = await this.client.keys(fullPattern);

      if (keys.length > 0) {
        await this.client.del(keys);
      }
    } catch (error) {
      // Silent error handling
    }
  }

  /**
   * Clear all cache for a user
   */
  async clearUserCache(userId: string): Promise<void> {
    try {
      const pattern = `${this.keyPrefix}user:${userId}:*`;
      await this.deleteByPattern(pattern);
    } catch (error) {
      // Silent error handling
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<CacheStats | null> {
    try {
      if (!this.isConnected) {
        return null;
      }

      const keys = await this.client.keys(`${this.keyPrefix}*`);

      return {
        keys: keys.length,
        memory: 'N/A',
        uptime: 0
      };
    } catch {
      // Silently handle stats errors
      return null;
    }
  }

  /**
   * Health check for Redis
   */
  async healthCheck(): Promise<boolean> {
    try {
      if (!this.isConnected) {
        return false;
      }

      await this.client.ping();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Execute a custom Redis command
   */
  async executeCommand(command: string, ...args: string[]): Promise<unknown> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return await (this.client as any)[command](...args);
    } catch (error) {
      // Silent error handling
      return null;
    }
  }
}

// Export singleton instance
export const redisCacheService = new RedisCacheService();
