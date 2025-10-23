import { PrismaClient } from '@prisma/client';
import {
  AnalyticsMetric,
  AnalyticsMetricType,
  VisualizationType
} from '../../../shared/src/types/tracking';

const prisma = new PrismaClient();

/**
 * AnalyticsMetric Model - Manages cached analytics calculations
 * Supports performance optimization through metric caching with TTL
 */
export class AnalyticsMetricModel {
  /**
   * Default cache TTL in minutes
   */
  private static readonly DEFAULT_CACHE_TTL = 5;

  /**
   * Validates analytics metric data
   * @param data - Metric data to validate
   * @throws Error if validation fails
   */
  private static validateMetricData(data: Partial<{
    metricType: AnalyticsMetricType;
    visualizationType: VisualizationType;
    startDate: Date;
    endDate: Date;
  }>): void {
    // Validate metric type
    const validMetricTypes: AnalyticsMetricType[] = [
      'wealth_trend',
      'zakat_trend',
      'payment_distribution',
      'asset_composition',
      'yearly_comparison',
      'nisab_compliance',
      'payment_consistency'
    ];
    if (data.metricType && !validMetricTypes.includes(data.metricType)) {
      throw new Error(`Invalid metric type. Must be one of: ${validMetricTypes.join(', ')}`);
    }

    // Validate visualization type
    const validVisualizationTypes: VisualizationType[] = [
      'line_chart',
      'bar_chart',
      'pie_chart',
      'area_chart',
      'table'
    ];
    if (data.visualizationType && !validVisualizationTypes.includes(data.visualizationType)) {
      throw new Error(`Invalid visualization type. Must be one of: ${validVisualizationTypes.join(', ')}`);
    }

    // Validate date range
    if (data.startDate && data.endDate) {
      if (data.startDate > data.endDate) {
        throw new Error('Start date must be before end date');
      }
    }
  }

  /**
   * Creates or updates a cached analytics metric
   * @param userId - User ID
   * @param metricType - Type of metric
   * @param data - Metric data
   * @param options - Cache options
   * @returns Promise<AnalyticsMetric> - Created/updated metric
   */
  static async createOrUpdate(
    userId: string,
    metricType: AnalyticsMetricType,
    data: {
      startDate: Date;
      endDate: Date;
      calculatedValue: Record<string, any>;
      visualizationType: VisualizationType;
      parameters?: Record<string, any>;
      cacheTTLMinutes?: number;
    }
  ): Promise<AnalyticsMetric> {
    try {
      // Validate data
      this.validateMetricData({
        metricType,
        visualizationType: data.visualizationType,
        startDate: data.startDate,
        endDate: data.endDate
      });

      const ttlMinutes = data.cacheTTLMinutes ?? this.DEFAULT_CACHE_TTL;
      const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

      // Check if metric already exists
      const existing = await prisma.analyticsMetric.findFirst({
        where: {
          userId,
          metricType,
          startDate: data.startDate,
          endDate: data.endDate,
          expiresAt: { gt: new Date() } // Not expired
        }
      });

      if (existing) {
        // Update existing metric
        const updated = await prisma.analyticsMetric.update({
          where: { id: existing.id },
          data: {
            calculatedValue: JSON.stringify(data.calculatedValue), // Will be encrypted by service
            calculatedAt: new Date(),
            expiresAt,
            version: existing.version + 1
          }
        });

        return updated as unknown as AnalyticsMetric;
      }

      // Create new metric
      const metric = await prisma.analyticsMetric.create({
        data: {
          userId,
          metricType,
          startDate: data.startDate,
          endDate: data.endDate,
          calculatedValue: JSON.stringify(data.calculatedValue),
          visualizationType: data.visualizationType,
          parameters: data.parameters ? JSON.stringify(data.parameters) : '{}',
          expiresAt,
          version: 1
        }
      });

      return metric as unknown as AnalyticsMetric;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to create/update analytics metric: ${errorMessage}`);
    }
  }

  /**
   * Retrieves a cached metric if not expired
   * @param userId - User ID
   * @param metricType - Type of metric
   * @param startDate - Start date
   * @param endDate - End date
   * @returns Promise<AnalyticsMetric | null> - Cached metric or null if not found/expired
   */
  static async findCached(
    userId: string,
    metricType: AnalyticsMetricType,
    startDate: Date,
    endDate: Date
  ): Promise<AnalyticsMetric | null> {
    try {
      const metric = await prisma.analyticsMetric.findFirst({
        where: {
          userId,
          metricType,
          startDate,
          endDate,
          expiresAt: { gt: new Date() }
        },
        orderBy: { calculatedAt: 'desc' }
      });

      return metric as unknown as AnalyticsMetric | null;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to find cached metric: ${errorMessage}`);
    }
  }

  /**
   * Retrieves all metrics for a user
   * @param userId - User ID
   * @param includeExpired - Include expired metrics
   * @returns Promise<AnalyticsMetric[]> - Array of metrics
   */
  static async findByUser(
    userId: string,
    includeExpired: boolean = false
  ): Promise<AnalyticsMetric[]> {
    try {
      const where: any = { userId };

      if (!includeExpired) {
        where.expiresAt = { gt: new Date() };
      }

      const metrics = await prisma.analyticsMetric.findMany({
        where,
        orderBy: { calculatedAt: 'desc' }
      });

      return metrics as unknown as AnalyticsMetric[];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to find analytics metrics: ${errorMessage}`);
    }
  }

  /**
   * Deletes expired metrics (cleanup operation)
   * @returns Promise<number> - Number of deleted metrics
   */
  static async deleteExpired(): Promise<number> {
    try {
      const result = await prisma.analyticsMetric.deleteMany({
        where: {
          expiresAt: { lt: new Date() }
        }
      });

      return result.count;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to delete expired metrics: ${errorMessage}`);
    }
  }

  /**
   * Deletes all metrics for a user
   * @param userId - User ID
   * @returns Promise<number> - Number of deleted metrics
   */
  static async deleteByUser(userId: string): Promise<number> {
    try {
      const result = await prisma.analyticsMetric.deleteMany({
        where: { userId }
      });

      return result.count;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to delete user metrics: ${errorMessage}`);
    }
  }

  /**
   * Invalidates (deletes) cache for specific metric type
   * @param userId - User ID
   * @param metricType - Type of metric to invalidate
   * @returns Promise<number> - Number of invalidated metrics
   */
  static async invalidateCache(
    userId: string,
    metricType?: AnalyticsMetricType
  ): Promise<number> {
    try {
      const where: any = { userId };

      if (metricType) {
        where.metricType = metricType;
      }

      const result = await prisma.analyticsMetric.deleteMany({ where });

      return result.count;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to invalidate cache: ${errorMessage}`);
    }
  }

  /**
   * Gets cache statistics for a user
   * @param userId - User ID
   * @returns Promise<{ total: number; expired: number; valid: number }>
   */
  static async getCacheStats(userId: string): Promise<{
    total: number;
    expired: number;
    valid: number;
  }> {
    try {
      const [total, expired] = await Promise.all([
        prisma.analyticsMetric.count({ where: { userId } }),
        prisma.analyticsMetric.count({
          where: {
            userId,
            expiresAt: { lt: new Date() }
          }
        })
      ]);

      return {
        total,
        expired,
        valid: total - expired
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get cache stats: ${errorMessage}`);
    }
  }
}
