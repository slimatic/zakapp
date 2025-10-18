import { createClient, RedisClientType } from 'redis';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string;
}

export class RedisCacheService {
  private client: RedisClientType;
  private isConnected: boolean = false;
  private defaultTTL: number = 3600; // 1 hour default
  private keyPrefix: string = 'zakapp:';

  constructor() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

    this.client = createClient({
      url: redisUrl,
      socket: {
        connectTimeout: 60000,
        lazyConnect: true,
      },
    });

    this.client.on('error', (err) => {
      console.error('Redis Client Error:', err);
      this.isConnected = false;
    });

    this.client.on('connect', () => {
      console.log('Connected to Redis');
      this.isConnected = true;
    });

    this.client.on('disconnect', () => {
      console.log('Disconnected from Redis');
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
  async set(key: string, value: any, options: CacheOptions = {}): Promise<void> {
    try {
      const cacheKey = this.generateKey(key, options.prefix);
      const serializedValue = JSON.stringify(value);
      const ttl = options.ttl || this.defaultTTL;

      await this.client.setEx(cacheKey, ttl, serializedValue);
    } catch (error) {
      console.error('Redis set error:', error);
      // Don't throw - cache failures shouldn't break the app
    }
  }

  /**
   * Get a value from cache
   */
  async get<T = any>(key: string, prefix?: string): Promise<T | null> {
    try {
      const cacheKey = this.generateKey(key, prefix);
      const value = await this.client.get(cacheKey);

      if (value) {
        return JSON.parse(value);
      }

      return null;
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  /**
   * Delete a value from cache
   */
  async delete(key: string, prefix?: string): Promise<boolean> {
    try {
      const cacheKey = this.generateKey(key, prefix);
      const result = await this.client.del(cacheKey);
      return result > 0;
    } catch (error) {
      console.error('Redis delete error:', error);
      return false;
    }
  }

  /**
   * Delete multiple keys by pattern
   */
  async deleteByPattern(pattern: string, prefix?: string): Promise<number> {
    try {
      const fullPrefix = prefix || this.keyPrefix;
      const searchPattern = `${fullPrefix}${pattern}`;

      const keys = await this.client.keys(searchPattern);
      if (keys.length > 0) {
        const result = await this.client.del(keys);
        return result;
      }

      return 0;
    } catch (error) {
      console.error('Redis deleteByPattern error:', error);
      return 0;
    }
  }

  /**
   * Clear all cache for a user
   */
  async clearUserCache(userId: string): Promise<number> {
    return await this.deleteByPattern(`user:${userId}:*`);
  }

  /**
   * Clear all calculation cache
   */
  async clearCalculationCache(): Promise<number> {
    return await this.deleteByPattern('calculation:*');
  }

  /**
   * Clear all nisab cache
   */
  async clearNisabCache(): Promise<number> {
    return await this.deleteByPattern('nisab:*');
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<any> {
    try {
      const info = await this.client.info();
      return {
        connected: this.isConnected,
        info: info,
      };
    } catch (error) {
      console.error('Redis stats error:', error);
      return { connected: false, error: error.message };
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.client.ping();
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get raw Redis client for advanced operations
   */
  getClient(): RedisClientType {
    return this.client;
  }

  /**
   * Execute Redis command directly
   */
  async executeCommand(command: string, ...args: any[]): Promise<any> {
    try {
      return await (this.client as any)[command](...args);
    } catch (error) {
      console.error(`Redis command error (${command}):`, error);
      return null;
    }
  }
}

// Export singleton instance
export const redisCache = new RedisCacheService();