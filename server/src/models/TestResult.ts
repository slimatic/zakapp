import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface TestResult {
  id: number;
  testName: string;
  testType: 'unit' | 'integration' | 'contract' | 'e2e' | 'performance' | 'security' | 'accessibility';
  status: 'pass' | 'fail' | 'pending' | 'skipped';
  executionTime: number;
  errorMessage?: string;
  metadata?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTestResultDto {
  testName: string;
  testType: 'unit' | 'integration' | 'contract' | 'e2e' | 'performance' | 'security' | 'accessibility';
  status: 'pass' | 'fail' | 'pending' | 'skipped';
  executionTime: number;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

export interface UpdateTestResultDto {
  testName?: string;
  testType?: 'unit' | 'integration' | 'contract' | 'e2e' | 'performance' | 'security' | 'accessibility';
  status?: 'pass' | 'fail' | 'pending' | 'skipped';
  executionTime?: number;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

/**
 * Test Result Model - Manages test execution results and tracking
 * Supports comprehensive test management for quality assurance
 */
export class TestResultModel {
  /**
   * Creates a new test result record
   * @param data - Test result data to create
   * @returns Promise<TestResult> - Created test result
   * @throws Error if creation fails
   */
  static async create(data: CreateTestResultDto): Promise<TestResult> {
    try {
      const testResult = await (prisma as any).testResult.create({
        data: {
          testName: data.testName,
          testType: data.testType,
          status: data.status,
          executionTime: data.executionTime,
          errorMessage: data.errorMessage || null,
          metadata: data.metadata ? JSON.stringify(data.metadata) : null,
        }
      });

      return testResult;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to create test result: ${errorMessage}`);
    }
  }

  /**
   * Retrieves test result by ID
   * @param id - Test result ID
   * @returns Promise<TestResult | null> - Test result or null if not found
   */
  static async findById(id: number): Promise<TestResult | null> {
    try {
      const testResult = await (prisma as any).testResult.findUnique({
        where: { id }
      });

      return testResult;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to find test result: ${errorMessage}`);
    }
  }

  /**
   * Retrieves all test results with optional filtering
   * @param filters - Optional filters for test results
   * @returns Promise<TestResult[]> - Array of test results
   */
  static async findMany(filters?: {
    testType?: string;
    status?: string;
    testName?: string;
    limit?: number;
    offset?: number;
  }): Promise<TestResult[]> {
    try {
      const where: any = {};
      
      if (filters?.testType) {
        where.testType = filters.testType;
      }
      
      if (filters?.status) {
        where.status = filters.status;
      }
      
      if (filters?.testName) {
        where.testName = {
          contains: filters.testName,
          mode: 'insensitive'
        };
      }

      const testResults = await (prisma as any).testResult.findMany({
        where,
        take: filters?.limit || 100,
        skip: filters?.offset || 0,
        orderBy: {
          createdAt: 'desc'
        }
      });

      return testResults;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to find test results: ${errorMessage}`);
    }
  }

  /**
   * Updates an existing test result
   * @param id - Test result ID
   * @param data - Updated test result data
   * @returns Promise<TestResult> - Updated test result
   * @throws Error if update fails or test result not found
   */
  static async update(id: number, data: UpdateTestResultDto): Promise<TestResult> {
    try {
      const updateData: any = {};
      
      if (data.testName !== undefined) updateData.testName = data.testName;
      if (data.testType !== undefined) updateData.testType = data.testType;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.executionTime !== undefined) updateData.executionTime = data.executionTime;
      if (data.errorMessage !== undefined) updateData.errorMessage = data.errorMessage;
      if (data.metadata !== undefined) {
        updateData.metadata = data.metadata ? JSON.stringify(data.metadata) : null;
      }

      const testResult = await (prisma as any).testResult.update({
        where: { id },
        data: updateData
      });

      return testResult;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to update test result: ${errorMessage}`);
    }
  }

  /**
   * Deletes a test result by ID
   * @param id - Test result ID
   * @returns Promise<boolean> - True if deleted successfully
   * @throws Error if deletion fails
   */
  static async delete(id: number): Promise<boolean> {
    try {
      await (prisma as any).testResult.delete({
        where: { id }
      });

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to delete test result: ${errorMessage}`);
    }
  }

  /**
   * Retrieves test statistics by type
   * @returns Promise<Record<string, any>> - Test statistics
   */
  static async getTestStatistics(): Promise<Record<string, any>> {
    try {
      const stats = await (prisma as any).testResult.groupBy({
        by: ['testType', 'status'],
        _count: {
          _all: true
        }
      });

      const summary = stats.reduce((acc: any, stat: any) => {
        if (!acc[stat.testType]) {
          acc[stat.testType] = {};
        }
        acc[stat.testType][stat.status] = stat._count._all;
        return acc;
      }, {} as Record<string, Record<string, number>>);

      return summary;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get test statistics: ${errorMessage}`);
    }
  }

  /**
   * Retrieves recent test failures
   * @param limit - Number of failures to retrieve
   * @returns Promise<TestResult[]> - Recent test failures
   */
  static async getRecentFailures(limit: number = 10): Promise<TestResult[]> {
    try {
      const failures = await (prisma as any).testResult.findMany({
        where: {
          status: 'fail'
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: limit
      });

      return failures;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get recent failures: ${errorMessage}`);
    }
  }
}

export default TestResultModel;