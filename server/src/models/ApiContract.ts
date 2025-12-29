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

import { prisma } from '../utils/prisma';


export interface ApiContract {
  id: number;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  expectedRequest?: string;
  expectedResponse: string;
  actualResponse?: string;
  statusCode: number;
  responseTime: number;
  contractVersion: string;
  isValid: boolean;
  validationErrors?: string;
  lastTested: Date;
  metadata?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateApiContractDto {
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  expectedRequest?: Record<string, any>;
  expectedResponse: Record<string, any>;
  contractVersion: string;
  metadata?: Record<string, any>;
}

export interface UpdateApiContractDto {
  endpoint?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  expectedRequest?: Record<string, any>;
  expectedResponse?: Record<string, any>;
  actualResponse?: Record<string, any>;
  statusCode?: number;
  responseTime?: number;
  contractVersion?: string;
  isValid?: boolean;
  validationErrors?: string[];
  lastTested?: Date;
  metadata?: Record<string, any>;
}

/**
 * API Contract Model - Manages API contract definitions and validation
 * Supports comprehensive API contract testing and compliance verification
 */
export class ApiContractModel {
  /**
   * Creates a new API contract record
   * @param data - API contract data to create
   * @returns Promise<ApiContract> - Created API contract
   * @throws Error if creation fails
   */
  static async create(data: CreateApiContractDto): Promise<ApiContract> {
    try {
      const apiContract = await (prisma as any).apiContract.create({
        data: {
          endpoint: data.endpoint,
          method: data.method,
          expectedRequest: data.expectedRequest ? JSON.stringify(data.expectedRequest) : null,
          expectedResponse: JSON.stringify(data.expectedResponse),
          statusCode: 0, // Will be updated during testing
          responseTime: 0, // Will be updated during testing
          contractVersion: data.contractVersion,
          isValid: false, // Will be updated during testing
          lastTested: new Date(),
          metadata: data.metadata ? JSON.stringify(data.metadata) : null,
        }
      });

      return apiContract;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to create API contract: ${errorMessage}`);
    }
  }

  /**
   * Retrieves API contract by ID
   * @param id - API contract ID
   * @returns Promise<ApiContract | null> - API contract or null if not found
   */
  static async findById(id: number): Promise<ApiContract | null> {
    try {
      const apiContract = await (prisma as any).apiContract.findUnique({
        where: { id }
      });

      return apiContract;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to find API contract: ${errorMessage}`);
    }
  }

  /**
   * Retrieves API contract by endpoint and method
   * @param endpoint - API endpoint
   * @param method - HTTP method
   * @returns Promise<ApiContract | null> - API contract or null if not found
   */
  static async findByEndpoint(endpoint: string, method: string): Promise<ApiContract | null> {
    try {
      const apiContract = await (prisma as any).apiContract.findFirst({
        where: { 
          endpoint,
          method
        },
        orderBy: { contractVersion: 'desc' }
      });

      return apiContract;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to find API contract by endpoint: ${errorMessage}`);
    }
  }

  /**
   * Retrieves all API contracts with optional filtering
   * @param filters - Optional filters for API contracts
   * @returns Promise<ApiContract[]> - Array of API contracts
   */
  static async findMany(filters?: {
    endpoint?: string;
    method?: string;
    isValid?: boolean;
    contractVersion?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiContract[]> {
    try {
      const where: any = {};
      
      if (filters?.endpoint) {
        where.endpoint = {
          contains: filters.endpoint,
          mode: 'insensitive'
        };
      }
      
      if (filters?.method) {
        where.method = filters.method;
      }
      
      if (filters?.isValid !== undefined) {
        where.isValid = filters.isValid;
      }
      
      if (filters?.contractVersion) {
        where.contractVersion = filters.contractVersion;
      }

      const apiContracts = await (prisma as any).apiContract.findMany({
        where,
        take: filters?.limit || 100,
        skip: filters?.offset || 0,
        orderBy: [
          { endpoint: 'asc' },
          { method: 'asc' },
          { contractVersion: 'desc' }
        ]
      });

      return apiContracts;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to find API contracts: ${errorMessage}`);
    }
  }

  /**
   * Updates an existing API contract
   * @param id - API contract ID
   * @param data - Updated API contract data
   * @returns Promise<ApiContract> - Updated API contract
   * @throws Error if update fails or API contract not found
   */
  static async update(id: number, data: UpdateApiContractDto): Promise<ApiContract> {
    try {
      const updateData: any = {};
      
      if (data.endpoint !== undefined) updateData.endpoint = data.endpoint;
      if (data.method !== undefined) updateData.method = data.method;
      if (data.expectedRequest !== undefined) {
        updateData.expectedRequest = data.expectedRequest ? JSON.stringify(data.expectedRequest) : null;
      }
      if (data.expectedResponse !== undefined) {
        updateData.expectedResponse = JSON.stringify(data.expectedResponse);
      }
      if (data.actualResponse !== undefined) {
        updateData.actualResponse = data.actualResponse ? JSON.stringify(data.actualResponse) : null;
      }
      if (data.statusCode !== undefined) updateData.statusCode = data.statusCode;
      if (data.responseTime !== undefined) updateData.responseTime = data.responseTime;
      if (data.contractVersion !== undefined) updateData.contractVersion = data.contractVersion;
      if (data.isValid !== undefined) updateData.isValid = data.isValid;
      if (data.validationErrors !== undefined) {
        updateData.validationErrors = data.validationErrors ? JSON.stringify(data.validationErrors) : null;
      }
      if (data.lastTested !== undefined) updateData.lastTested = data.lastTested;
      if (data.metadata !== undefined) {
        updateData.metadata = data.metadata ? JSON.stringify(data.metadata) : null;
      }

      const apiContract = await (prisma as any).apiContract.update({
        where: { id },
        data: updateData
      });

      return apiContract;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to update API contract: ${errorMessage}`);
    }
  }

  /**
   * Deletes an API contract by ID
   * @param id - API contract ID
   * @returns Promise<boolean> - True if deleted successfully
   * @throws Error if deletion fails
   */
  static async delete(id: number): Promise<boolean> {
    try {
      await (prisma as any).apiContract.delete({
        where: { id }
      });

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to delete API contract: ${errorMessage}`);
    }
  }

  /**
   * Validates API response against contract
   * @param id - API contract ID
   * @param actualResponse - Actual API response
   * @param statusCode - HTTP status code
   * @param responseTime - Response time in milliseconds
   * @returns Promise<ApiContract> - Updated contract with validation results
   */
  static async validateResponse(
    id: number,
    actualResponse: Record<string, any>,
    statusCode: number,
    responseTime: number
  ): Promise<ApiContract> {
    try {
      const contract = await this.findById(id);
      if (!contract) {
        throw new Error(`API contract not found with ID: ${id}`);
      }

      const expectedResponse = JSON.parse(contract.expectedResponse);
      const validationResult = this.compareResponses(expectedResponse, actualResponse);

      const updatedContract = await this.update(id, {
        actualResponse,
        statusCode,
        responseTime,
        isValid: validationResult.isValid,
        validationErrors: validationResult.errors,
        lastTested: new Date()
      });

      return updatedContract;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to validate API response: ${errorMessage}`);
    }
  }

  /**
   * Retrieves invalid API contracts
   * @returns Promise<ApiContract[]> - Invalid API contracts
   */
  static async getInvalidContracts(): Promise<ApiContract[]> {
    try {
      const invalidContracts = await (prisma as any).apiContract.findMany({
        where: {
          isValid: false
        },
        orderBy: {
          lastTested: 'desc'
        }
      });

      return invalidContracts;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get invalid contracts: ${errorMessage}`);
    }
  }

  /**
   * Retrieves contract validation statistics
   * @returns Promise<Record<string, any>> - Validation statistics
   */
  static async getValidationStatistics(): Promise<Record<string, any>> {
    try {
      const stats = await (prisma as any).apiContract.groupBy({
        by: ['method', 'isValid'],
        _count: {
          _all: true
        },
        _avg: {
          responseTime: true
        }
      });

      const summary = stats.reduce((acc: any, stat: any) => {
        if (!acc[stat.method]) {
          acc[stat.method] = {
            valid: 0,
            invalid: 0,
            avgResponseTime: 0
          };
        }
        
        if (stat.isValid) {
          acc[stat.method].valid = stat._count._all;
        } else {
          acc[stat.method].invalid = stat._count._all;
        }
        
        acc[stat.method].avgResponseTime = stat._avg.responseTime || 0;
        return acc;
      }, {} as Record<string, any>);

      return summary;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get validation statistics: ${errorMessage}`);
    }
  }

  /**
   * Retrieves contracts that need testing (haven't been tested recently)
   * @param hoursThreshold - Hours since last test to consider stale
   * @returns Promise<ApiContract[]> - Contracts needing testing
   */
  static async getContractsNeedingTest(hoursThreshold: number = 24): Promise<ApiContract[]> {
    try {
      const thresholdDate = new Date();
      thresholdDate.setHours(thresholdDate.getHours() - hoursThreshold);

      const staleContracts = await (prisma as any).apiContract.findMany({
        where: {
          lastTested: {
            lt: thresholdDate
          }
        },
        orderBy: {
          lastTested: 'asc'
        }
      });

      return staleContracts;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get contracts needing test: ${errorMessage}`);
    }
  }

  /**
   * Retrieves performance metrics for all contracts
   * @returns Promise<Record<string, any>> - Performance metrics
   */
  static async getPerformanceMetrics(): Promise<Record<string, any>> {
    try {
      const metrics = await (prisma as any).apiContract.aggregate({
        _avg: {
          responseTime: true
        },
        _max: {
          responseTime: true
        },
        _min: {
          responseTime: true
        },
        _count: {
          _all: true
        }
      });

      const slowContracts = await (prisma as any).apiContract.findMany({
        where: {
          responseTime: {
            gt: 1000 // Slower than 1 second
          }
        },
        select: {
          endpoint: true,
          method: true,
          responseTime: true
        },
        orderBy: {
          responseTime: 'desc'
        }
      });

      return {
        averageResponseTime: metrics._avg.responseTime,
        maxResponseTime: metrics._max.responseTime,
        minResponseTime: metrics._min.responseTime,
        totalContracts: metrics._count._all,
        slowContracts
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get performance metrics: ${errorMessage}`);
    }
  }

  /**
   * Compares expected and actual responses for validation
   * @param expected - Expected response structure
   * @param actual - Actual response data
   * @returns Validation result with errors
   */
  private static compareResponses(expected: any, actual: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Simple structure comparison - can be enhanced with JSON Schema validation
    if (typeof expected !== typeof actual) {
      errors.push(`Type mismatch: expected ${typeof expected}, got ${typeof actual}`);
    }

    if (typeof expected === 'object' && expected !== null && actual !== null) {
      for (const key in expected) {
        if (!(key in actual)) {
          errors.push(`Missing property: ${key}`);
        }
      }

      for (const key in actual) {
        if (!(key in expected)) {
          errors.push(`Unexpected property: ${key}`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export default ApiContractModel;