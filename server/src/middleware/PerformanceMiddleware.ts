/**
 * Performance Monitoring Middleware
 * 
 * Constitutional Principles:
 * - Quality & Reliability: Monitor and optimize application performance
 * - User-Centric Design: Ensure fast, responsive user experience
 * - Transparency & Trust: Provide performance insights and monitoring
 */

import { Request, Response, NextFunction } from 'express';
import { performance } from 'perf_hooks';
import os from 'os';

/**
 * Performance metrics data structure
 */
export interface PerformanceMetrics {
  requestId: string;
  method: string;
  url: string;
  statusCode: number;
  responseTime: number;
  memoryUsage: NodeJS.MemoryUsage;
  cpuUsage: NodeJS.CpuUsage;
  userAgent?: string;
  userId?: string;
  timestamp: string;
  queryCount?: number;
  errorCount?: number;
}

/**
 * System health metrics
 */
export interface SystemHealth {
  uptime: number;
  loadAverage: number[];
  memoryUsage: {
    total: number;
    free: number;
    used: number;
    percentage: number;
  };
  cpuUsage: {
    user: number;
    system: number;
    percentage: number;
  };
  activeRequests: number;
  averageResponseTime: number;
  errorRate: number;
  timestamp: string;
}

/**
 * Request performance tracking
 */
interface RequestPerformance {
  startTime: number;
  startCpuUsage: NodeJS.CpuUsage;
  startMemoryUsage: NodeJS.MemoryUsage;
  queryCount: number;
  errorCount: number;
}

/**
 * Extended request interface with performance data
 */
export interface PerformanceRequest extends Request {
  performance?: RequestPerformance;
  requestId?: string;
  userId?: string;
}

/**
 * Performance monitoring manager
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetrics[] = [];
  private activeRequests = new Map<string, RequestPerformance>();
  private startTime = Date.now();
  private readonly maxMetricsHistory = 1000;

  private constructor() {
    this.startPeriodicCleanup();
  }

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Start tracking request performance
   */
  public startTracking(req: PerformanceRequest): void {
    const requestId = req.requestId || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const performanceData: RequestPerformance = {
      startTime: performance.now(),
      startCpuUsage: process.cpuUsage(),
      startMemoryUsage: process.memoryUsage(),
      queryCount: 0,
      errorCount: 0
    };

    req.performance = performanceData;
    req.requestId = requestId;
    this.activeRequests.set(requestId, performanceData);
  }

  /**
   * End tracking and record metrics
   */
  public endTracking(req: PerformanceRequest, res: Response): void {
    if (!req.performance || !req.requestId) {
      return;
    }

    const endTime = performance.now();
    const endCpuUsage = process.cpuUsage(req.performance.startCpuUsage);
    const endMemoryUsage = process.memoryUsage();

    const metrics: PerformanceMetrics = {
      requestId: req.requestId,
      method: req.method,
      url: req.originalUrl || req.url,
      statusCode: res.statusCode,
      responseTime: endTime - req.performance.startTime,
      memoryUsage: {
        rss: endMemoryUsage.rss - req.performance.startMemoryUsage.rss,
        heapTotal: endMemoryUsage.heapTotal - req.performance.startMemoryUsage.heapTotal,
        heapUsed: endMemoryUsage.heapUsed - req.performance.startMemoryUsage.heapUsed,
        external: endMemoryUsage.external - req.performance.startMemoryUsage.external,
        arrayBuffers: endMemoryUsage.arrayBuffers - req.performance.startMemoryUsage.arrayBuffers
      },
      cpuUsage: endCpuUsage,
      userAgent: req.get('User-Agent'),
      userId: req.userId,
      timestamp: new Date().toISOString(),
      queryCount: req.performance.queryCount,
      errorCount: req.performance.errorCount
    };

    this.recordMetrics(metrics);
    this.activeRequests.delete(req.requestId);

    // Set performance headers
    this.setPerformanceHeaders(res, metrics);
  }

  /**
   * Record performance metrics
   */
  private recordMetrics(metrics: PerformanceMetrics): void {
    this.metrics.push(metrics);

    // Maintain maximum history size
    if (this.metrics.length > this.maxMetricsHistory) {
      this.metrics = this.metrics.slice(-this.maxMetricsHistory);
    }

    // Log slow requests
    if (metrics.responseTime > 5000) { // 5 seconds
      console.warn(`🐌 Slow request detected: ${metrics.method} ${metrics.url} - ${metrics.responseTime.toFixed(2)}ms`);
    }

    // Log high memory usage
    if (metrics.memoryUsage.heapUsed > 50 * 1024 * 1024) { // 50MB
      console.warn(`🧠 High memory usage: ${metrics.method} ${metrics.url} - ${(metrics.memoryUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`);
    }
  }

  /**
   * Set performance headers on response
   */
  private setPerformanceHeaders(res: Response, metrics: PerformanceMetrics): void {
    if (process.env.INCLUDE_PERFORMANCE_HEADERS === 'true') {
      res.setHeader('X-Response-Time', `${metrics.responseTime.toFixed(2)}ms`);
      res.setHeader('X-Memory-Usage', `${(metrics.memoryUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`);
      res.setHeader('X-CPU-Time', `${(metrics.cpuUsage.user + metrics.cpuUsage.system).toFixed(2)}μs`);
      
      if (metrics.queryCount > 0) {
        res.setHeader('X-Query-Count', metrics.queryCount.toString());
      }
    }
  }

  /**
   * Get recent performance metrics
   */
  public getRecentMetrics(limit = 100): PerformanceMetrics[] {
    return this.metrics.slice(-limit);
  }

  /**
   * Get performance statistics
   */
  public getStatistics(): any {
    if (this.metrics.length === 0) {
      return {
        totalRequests: 0,
        averageResponseTime: 0,
        slowestRequest: null,
        fastestRequest: null,
        errorRate: 0,
        memoryTrend: []
      };
    }

    const responseTimes = this.metrics.map(m => m.responseTime);
    const errorCount = this.metrics.filter(m => m.statusCode >= 400).length;

    return {
      totalRequests: this.metrics.length,
      averageResponseTime: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
      medianResponseTime: this.getMedian(responseTimes),
      slowestRequest: Math.max(...responseTimes),
      fastestRequest: Math.min(...responseTimes),
      errorRate: (errorCount / this.metrics.length) * 100,
      memoryTrend: this.metrics.slice(-20).map(m => ({
        timestamp: m.timestamp,
        heapUsed: m.memoryUsage.heapUsed
      })),
      topSlowEndpoints: this.getTopSlowEndpoints(),
      statusCodeDistribution: this.getStatusCodeDistribution()
    };
  }

  /**
   * Get system health metrics
   */
  public getSystemHealth(): SystemHealth {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;

    const recentMetrics = this.getRecentMetrics(50);
    const averageResponseTime = recentMetrics.length > 0
      ? recentMetrics.reduce((sum, m) => sum + m.responseTime, 0) / recentMetrics.length
      : 0;

    const errorCount = recentMetrics.filter(m => m.statusCode >= 400).length;
    const errorRate = recentMetrics.length > 0 ? (errorCount / recentMetrics.length) * 100 : 0;

    return {
      uptime: Date.now() - this.startTime,
      loadAverage: os.loadavg(),
      memoryUsage: {
        total: totalMemory,
        free: freeMemory,
        used: usedMemory,
        percentage: (usedMemory / totalMemory) * 100
      },
      cpuUsage: {
        user: 0, // Would need longer sampling period for accurate CPU%
        system: 0,
        percentage: 0
      },
      activeRequests: this.activeRequests.size,
      averageResponseTime,
      errorRate,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get top slow endpoints
   */
  private getTopSlowEndpoints(): Array<{ endpoint: string; averageTime: number; count: number }> {
    const endpointStats = new Map<string, { total: number; count: number }>();

    this.metrics.forEach(metric => {
      const endpoint = `${metric.method} ${metric.url}`;
      const existing = endpointStats.get(endpoint) || { total: 0, count: 0 };
      endpointStats.set(endpoint, {
        total: existing.total + metric.responseTime,
        count: existing.count + 1
      });
    });

    return Array.from(endpointStats.entries())
      .map(([endpoint, stats]) => ({
        endpoint,
        averageTime: stats.total / stats.count,
        count: stats.count
      }))
      .sort((a, b) => b.averageTime - a.averageTime)
      .slice(0, 10);
  }

  /**
   * Get status code distribution
   */
  private getStatusCodeDistribution(): Record<string, number> {
    const distribution: Record<string, number> = {};

    this.metrics.forEach(metric => {
      const statusRange = `${Math.floor(metric.statusCode / 100)}xx`;
      distribution[statusRange] = (distribution[statusRange] || 0) + 1;
    });

    return distribution;
  }

  /**
   * Get median value from array
   */
  private getMedian(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }

  /**
   * Start periodic cleanup of old metrics
   */
  private startPeriodicCleanup(): void {
    setInterval(() => {
      const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago
      this.metrics = this.metrics.filter(m => 
        new Date(m.timestamp).getTime() > cutoff
      );
    }, 60 * 60 * 1000); // Clean up every hour
  }

  /**
   * Increment query count for current request
   */
  public incrementQueryCount(req: PerformanceRequest): void {
    if (req.performance) {
      req.performance.queryCount++;
    }
  }

  /**
   * Increment error count for current request
   */
  public incrementErrorCount(req: PerformanceRequest): void {
    if (req.performance) {
      req.performance.errorCount++;
    }
  }

  /**
   * Clear all metrics (for testing)
   */
  public clearMetrics(): void {
    this.metrics = [];
    this.activeRequests.clear();
  }
}

/**
 * Performance monitoring middleware
 */
export const performanceMiddleware = (
  req: PerformanceRequest,
  res: Response,
  next: NextFunction
): void => {
  const monitor = PerformanceMonitor.getInstance();

  // Start tracking
  monitor.startTracking(req);

  // Override res.end to capture completion
  const originalEnd = res.end;
  res.end = function(this: Response, ...args: any[]): Response {
    monitor.endTracking(req, res);
    return originalEnd.apply(this, args);
  };

  next();
};

/**
 * Database query tracking middleware (for Prisma)
 */
export const queryTrackingMiddleware = (req: PerformanceRequest) => {
  const monitor = PerformanceMonitor.getInstance();
  
  return {
    query: () => {
      monitor.incrementQueryCount(req);
    },
    error: () => {
      monitor.incrementErrorCount(req);
    }
  };
};

/**
 * Performance metrics endpoint handler
 */
export const getPerformanceMetrics = (req: PerformanceRequest, res: Response): void => {
  const monitor = PerformanceMonitor.getInstance();
  
  try {
    const stats = monitor.getStatistics();
    const health = monitor.getSystemHealth();
    
    res.json({
      success: true,
      data: {
        statistics: stats,
        systemHealth: health,
        recentMetrics: monitor.getRecentMetrics(20)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'PERFORMANCE_METRICS_ERROR',
        message: 'Failed to retrieve performance metrics'
      }
    });
  }
};

/**
 * Health check endpoint handler
 */
export const healthCheck = (req: PerformanceRequest, res: Response): void => {
  const monitor = PerformanceMonitor.getInstance();
  
  try {
    const health = monitor.getSystemHealth();
    const isHealthy = health.memoryUsage.percentage < 90 && health.errorRate < 10;
    
    res.status(isHealthy ? 200 : 503).json({
      success: true,
      data: {
        status: isHealthy ? 'healthy' : 'degraded',
        health,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      error: {
        code: 'HEALTH_CHECK_ERROR',
        message: 'Health check failed'
      }
    });
  }
};

/**
 * Memory usage monitoring
 */
export const monitorMemoryUsage = (): void => {
  const monitor = PerformanceMonitor.getInstance();
  
  setInterval(() => {
    const usage = process.memoryUsage();
    const heapUsedMB = usage.heapUsed / 1024 / 1024;
    
    if (heapUsedMB > 100) { // 100MB threshold
      console.warn(`⚠️ High memory usage: ${heapUsedMB.toFixed(2)}MB`);
    }
    
    // Force garbage collection if memory usage is very high
    if (heapUsedMB > 500 && global.gc) { // 500MB threshold
      console.warn('🗑️ Forcing garbage collection due to high memory usage');
      global.gc();
    }
  }, 30000); // Check every 30 seconds
};

export default PerformanceMonitor;