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

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface QualityMetric {
  id: number;
  category: 'performance' | 'security' | 'maintainability' | 'reliability' | 'accessibility' | 'islamic_compliance';
  name: string;
  value: number;
  unit: string;
  threshold: number;
  status: 'pass' | 'warning' | 'fail';
  source: string;
  metadata?: string;
  measuredAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateQualityMetricDto {
  category: 'performance' | 'security' | 'maintainability' | 'reliability' | 'accessibility' | 'islamic_compliance';
  name: string;
  value: number;
  unit: string;
  threshold: number;
  source: string;
  metadata?: Record<string, any>;
}

export interface UpdateQualityMetricDto {
  category?: 'performance' | 'security' | 'maintainability' | 'reliability' | 'accessibility' | 'islamic_compliance';
  name?: string;
  value?: number;
  unit?: string;
  threshold?: number;
  status?: 'pass' | 'warning' | 'fail';
  source?: string;
  metadata?: Record<string, any>;
}

/**
 * Quality Metric Model - Manages quality measurements and tracking
 * Supports comprehensive quality assurance monitoring
 */
export class QualityMetricModel {
  /**
   * Creates a new quality metric record
   * @param data - Quality metric data to create
   * @returns Promise<QualityMetric> - Created quality metric
   * @throws Error if creation fails
   */
  static async create(data: CreateQualityMetricDto): Promise<QualityMetric> {
    try {
      // Calculate status based on value vs threshold
      const status = this.calculateStatus(data.value, data.threshold);

      const qualityMetric = await (prisma as any).qualityMetric.create({
        data: {
          category: data.category,
          name: data.name,
          value: data.value,
          unit: data.unit,
          threshold: data.threshold,
          status: status,
          source: data.source,
          metadata: data.metadata ? JSON.stringify(data.metadata) : null,
          measuredAt: new Date(),
        }
      });

      return qualityMetric;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to create quality metric: ${errorMessage}`);
    }
  }

  /**
   * Retrieves quality metric by ID
   * @param id - Quality metric ID
   * @returns Promise<QualityMetric | null> - Quality metric or null if not found
   */
  static async findById(id: number): Promise<QualityMetric | null> {
    try {
      const qualityMetric = await (prisma as any).qualityMetric.findUnique({
        where: { id }
      });

      return qualityMetric;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to find quality metric: ${errorMessage}`);
    }
  }

  /**
   * Retrieves all quality metrics with optional filtering
   * @param filters - Optional filters for quality metrics
   * @returns Promise<QualityMetric[]> - Array of quality metrics
   */
  static async findMany(filters?: {
    category?: string;
    status?: string;
    name?: string;
    source?: string;
    limit?: number;
    offset?: number;
  }): Promise<QualityMetric[]> {
    try {
      const where: any = {};
      
      if (filters?.category) {
        where.category = filters.category;
      }
      
      if (filters?.status) {
        where.status = filters.status;
      }
      
      if (filters?.name) {
        where.name = {
          contains: filters.name,
          mode: 'insensitive'
        };
      }
      
      if (filters?.source) {
        where.source = {
          contains: filters.source,
          mode: 'insensitive'
        };
      }

      const qualityMetrics = await (prisma as any).qualityMetric.findMany({
        where,
        take: filters?.limit || 100,
        skip: filters?.offset || 0,
        orderBy: {
          measuredAt: 'desc'
        }
      });

      return qualityMetrics;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to find quality metrics: ${errorMessage}`);
    }
  }

  /**
   * Updates an existing quality metric
   * @param id - Quality metric ID
   * @param data - Updated quality metric data
   * @returns Promise<QualityMetric> - Updated quality metric
   * @throws Error if update fails or quality metric not found
   */
  static async update(id: number, data: UpdateQualityMetricDto): Promise<QualityMetric> {
    try {
      const updateData: any = {};
      
      if (data.category !== undefined) updateData.category = data.category;
      if (data.name !== undefined) updateData.name = data.name;
      if (data.value !== undefined) updateData.value = data.value;
      if (data.unit !== undefined) updateData.unit = data.unit;
      if (data.threshold !== undefined) updateData.threshold = data.threshold;
      if (data.source !== undefined) updateData.source = data.source;
      if (data.metadata !== undefined) {
        updateData.metadata = data.metadata ? JSON.stringify(data.metadata) : null;
      }

      // Recalculate status if value or threshold changed
      if (data.value !== undefined || data.threshold !== undefined) {
        const current = await this.findById(id);
        if (current) {
          const newValue = data.value !== undefined ? data.value : current.value;
          const newThreshold = data.threshold !== undefined ? data.threshold : current.threshold;
          updateData.status = this.calculateStatus(newValue, newThreshold);
        }
      }

      const qualityMetric = await (prisma as any).qualityMetric.update({
        where: { id },
        data: updateData
      });

      return qualityMetric;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to update quality metric: ${errorMessage}`);
    }
  }

  /**
   * Deletes a quality metric by ID
   * @param id - Quality metric ID
   * @returns Promise<boolean> - True if deleted successfully
   * @throws Error if deletion fails
   */
  static async delete(id: number): Promise<boolean> {
    try {
      await (prisma as any).qualityMetric.delete({
        where: { id }
      });

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to delete quality metric: ${errorMessage}`);
    }
  }

  /**
   * Retrieves quality metrics by category statistics
   * @returns Promise<Record<string, any>> - Category statistics
   */
  static async getCategoryStatistics(): Promise<Record<string, any>> {
    try {
      const stats = await (prisma as any).qualityMetric.groupBy({
        by: ['category', 'status'],
        _count: {
          _all: true
        },
        _avg: {
          value: true
        }
      });

      const summary = stats.reduce((acc: any, stat: any) => {
        if (!acc[stat.category]) {
          acc[stat.category] = {
            counts: {},
            averageValue: stat._avg.value
          };
        }
        acc[stat.category].counts[stat.status] = stat._count._all;
        return acc;
      }, {} as Record<string, any>);

      return summary;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get category statistics: ${errorMessage}`);
    }
  }

  /**
   * Retrieves failing quality metrics
   * @returns Promise<QualityMetric[]> - Failed quality metrics
   */
  static async getFailingMetrics(): Promise<QualityMetric[]> {
    try {
      const failingMetrics = await (prisma as any).qualityMetric.findMany({
        where: {
          status: 'fail'
        },
        orderBy: [
          { category: 'asc' },
          { measuredAt: 'desc' }
        ]
      });

      return failingMetrics;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get failing metrics: ${errorMessage}`);
    }
  }

  /**
   * Retrieves trend data for a specific metric
   * @param name - Metric name
   * @param limit - Number of data points to retrieve
   * @returns Promise<QualityMetric[]> - Historical metric data
   */
  static async getMetricTrend(name: string, limit: number = 50): Promise<QualityMetric[]> {
    try {
      const trendData = await (prisma as any).qualityMetric.findMany({
        where: {
          name: name
        },
        orderBy: {
          measuredAt: 'desc'
        },
        take: limit
      });

      return trendData.reverse(); // Return chronological order for trend analysis
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get metric trend: ${errorMessage}`);
    }
  }

  /**
   * Retrieves the latest metrics for each category
   * @returns Promise<QualityMetric[]> - Latest metrics by category
   */
  static async getLatestByCategory(): Promise<QualityMetric[]> {
    try {
      const categories = ['performance', 'security', 'maintainability', 'reliability', 'accessibility', 'islamic_compliance'];
      const latestMetrics: QualityMetric[] = [];

      for (const category of categories) {
        const latest = await (prisma as any).qualityMetric.findFirst({
          where: { category },
          orderBy: { measuredAt: 'desc' }
        });
        
        if (latest) {
          latestMetrics.push(latest);
        }
      }

      return latestMetrics;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get latest metrics by category: ${errorMessage}`);
    }
  }

  /**
   * Calculates status based on value and threshold
   * @param value - Measured value
   * @param threshold - Threshold value
   * @returns Status indicator
   */
  private static calculateStatus(value: number, threshold: number): 'pass' | 'warning' | 'fail' {
    if (value >= threshold) {
      return 'pass';
    } else if (value >= threshold * 0.8) {
      return 'warning';
    } else {
      return 'fail';
    }
  }

  /**
   * Records a new measurement for an existing metric
   * @param name - Metric name
   * @param value - New measured value
   * @param source - Source of the measurement
   * @returns Promise<QualityMetric> - Updated metric record
   */
  static async recordMeasurement(name: string, value: number, source: string): Promise<QualityMetric> {
    try {
      // Get the latest metric configuration
      const existingMetric = await (prisma as any).qualityMetric.findFirst({
        where: { name },
        orderBy: { measuredAt: 'desc' }
      });

      if (!existingMetric) {
        throw new Error(`No existing metric found with name: ${name}`);
      }

      // Create new measurement with same configuration
      const newMeasurement = await this.create({
        category: existingMetric.category,
        name: existingMetric.name,
        value: value,
        unit: existingMetric.unit,
        threshold: existingMetric.threshold,
        source: source,
        metadata: existingMetric.metadata ? JSON.parse(existingMetric.metadata) : undefined
      });

      return newMeasurement;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to record measurement: ${errorMessage}`);
    }
  }
}

export default QualityMetricModel;