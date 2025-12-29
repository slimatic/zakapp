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

export interface MigrationRecord {
  id: number;
  migrationName: string;
  sourceFormat: 'json' | 'csv' | 'sql' | 'manual';
  targetTable: string;
  recordsProcessed: number;
  recordsSuccessful: number;
  recordsFailed: number;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'rolled_back';
  startedAt: Date;
  completedAt?: Date;
  errorLog?: string;
  rollbackData?: string;
  metadata?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMigrationRecordDto {
  migrationName: string;
  sourceFormat: 'json' | 'csv' | 'sql' | 'manual';
  targetTable: string;
  metadata?: Record<string, any>;
}

export interface UpdateMigrationRecordDto {
  recordsProcessed?: number;
  recordsSuccessful?: number;
  recordsFailed?: number;
  status?: 'pending' | 'running' | 'completed' | 'failed' | 'rolled_back';
  completedAt?: Date;
  errorLog?: string;
  rollbackData?: string;
  metadata?: Record<string, any>;
}

/**
 * Migration Record Model - Manages data migration tracking and history
 * Supports comprehensive migration monitoring and rollback capabilities
 */
export class MigrationRecordModel {
  /**
   * Creates a new migration record
   * @param data - Migration record data to create
   * @returns Promise<MigrationRecord> - Created migration record
   * @throws Error if creation fails
   */
  static async create(data: CreateMigrationRecordDto): Promise<MigrationRecord> {
    try {
      const migrationRecord = await (prisma as any).migrationRecord.create({
        data: {
          migrationName: data.migrationName,
          sourceFormat: data.sourceFormat,
          targetTable: data.targetTable,
          recordsProcessed: 0,
          recordsSuccessful: 0,
          recordsFailed: 0,
          status: 'pending',
          startedAt: new Date(),
          metadata: data.metadata ? JSON.stringify(data.metadata) : null,
        }
      });

      return migrationRecord;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to create migration record: ${errorMessage}`);
    }
  }

  /**
   * Retrieves migration record by ID
   * @param id - Migration record ID
   * @returns Promise<MigrationRecord | null> - Migration record or null if not found
   */
  static async findById(id: number): Promise<MigrationRecord | null> {
    try {
      const migrationRecord = await (prisma as any).migrationRecord.findUnique({
        where: { id }
      });

      return migrationRecord;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to find migration record: ${errorMessage}`);
    }
  }

  /**
   * Retrieves migration record by name
   * @param migrationName - Migration name
   * @returns Promise<MigrationRecord | null> - Migration record or null if not found
   */
  static async findByName(migrationName: string): Promise<MigrationRecord | null> {
    try {
      const migrationRecord = await (prisma as any).migrationRecord.findFirst({
        where: { migrationName },
        orderBy: { createdAt: 'desc' }
      });

      return migrationRecord;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to find migration record by name: ${errorMessage}`);
    }
  }

  /**
   * Retrieves all migration records with optional filtering
   * @param filters - Optional filters for migration records
   * @returns Promise<MigrationRecord[]> - Array of migration records
   */
  static async findMany(filters?: {
    sourceFormat?: string;
    targetTable?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<MigrationRecord[]> {
    try {
      const where: any = {};
      
      if (filters?.sourceFormat) {
        where.sourceFormat = filters.sourceFormat;
      }
      
      if (filters?.targetTable) {
        where.targetTable = filters.targetTable;
      }
      
      if (filters?.status) {
        where.status = filters.status;
      }

      const migrationRecords = await (prisma as any).migrationRecord.findMany({
        where,
        take: filters?.limit || 100,
        skip: filters?.offset || 0,
        orderBy: {
          startedAt: 'desc'
        }
      });

      return migrationRecords;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to find migration records: ${errorMessage}`);
    }
  }

  /**
   * Updates an existing migration record
   * @param id - Migration record ID
   * @param data - Updated migration record data
   * @returns Promise<MigrationRecord> - Updated migration record
   * @throws Error if update fails or migration record not found
   */
  static async update(id: number, data: UpdateMigrationRecordDto): Promise<MigrationRecord> {
    try {
      const updateData: any = {};
      
      if (data.recordsProcessed !== undefined) updateData.recordsProcessed = data.recordsProcessed;
      if (data.recordsSuccessful !== undefined) updateData.recordsSuccessful = data.recordsSuccessful;
      if (data.recordsFailed !== undefined) updateData.recordsFailed = data.recordsFailed;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.completedAt !== undefined) updateData.completedAt = data.completedAt;
      if (data.errorLog !== undefined) updateData.errorLog = data.errorLog;
      if (data.rollbackData !== undefined) updateData.rollbackData = data.rollbackData;
      if (data.metadata !== undefined) {
        updateData.metadata = data.metadata ? JSON.stringify(data.metadata) : null;
      }

      const migrationRecord = await (prisma as any).migrationRecord.update({
        where: { id },
        data: updateData
      });

      return migrationRecord;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to update migration record: ${errorMessage}`);
    }
  }

  /**
   * Deletes a migration record by ID
   * @param id - Migration record ID
   * @returns Promise<boolean> - True if deleted successfully
   * @throws Error if deletion fails
   */
  static async delete(id: number): Promise<boolean> {
    try {
      await (prisma as any).migrationRecord.delete({
        where: { id }
      });

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to delete migration record: ${errorMessage}`);
    }
  }

  /**
   * Starts a migration by updating status to running
   * @param id - Migration record ID
   * @returns Promise<MigrationRecord> - Updated migration record
   */
  static async startMigration(id: number): Promise<MigrationRecord> {
    try {
      const migrationRecord = await (prisma as any).migrationRecord.update({
        where: { id },
        data: {
          status: 'running',
          startedAt: new Date()
        }
      });

      return migrationRecord;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to start migration: ${errorMessage}`);
    }
  }

  /**
   * Completes a migration successfully
   * @param id - Migration record ID
   * @param recordsProcessed - Total records processed
   * @param recordsSuccessful - Records successfully migrated
   * @param recordsFailed - Records that failed to migrate
   * @returns Promise<MigrationRecord> - Updated migration record
   */
  static async completeMigration(
    id: number,
    recordsProcessed: number,
    recordsSuccessful: number,
    recordsFailed: number = 0
  ): Promise<MigrationRecord> {
    try {
      const migrationRecord = await (prisma as any).migrationRecord.update({
        where: { id },
        data: {
          status: 'completed',
          recordsProcessed,
          recordsSuccessful,
          recordsFailed,
          completedAt: new Date()
        }
      });

      return migrationRecord;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to complete migration: ${errorMessage}`);
    }
  }

  /**
   * Fails a migration with error details
   * @param id - Migration record ID
   * @param errorLog - Error details
   * @param recordsProcessed - Records processed before failure
   * @returns Promise<MigrationRecord> - Updated migration record
   */
  static async failMigration(
    id: number,
    errorLog: string,
    recordsProcessed: number = 0
  ): Promise<MigrationRecord> {
    try {
      const migrationRecord = await (prisma as any).migrationRecord.update({
        where: { id },
        data: {
          status: 'failed',
          errorLog,
          recordsProcessed,
          completedAt: new Date()
        }
      });

      return migrationRecord;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to mark migration as failed: ${errorMessage}`);
    }
  }

  /**
   * Retrieves migration statistics
   * @returns Promise<Record<string, any>> - Migration statistics
   */
  static async getMigrationStatistics(): Promise<Record<string, any>> {
    try {
      const stats = await (prisma as any).migrationRecord.groupBy({
        by: ['status', 'sourceFormat'],
        _count: {
          _all: true
        },
        _sum: {
          recordsProcessed: true,
          recordsSuccessful: true,
          recordsFailed: true
        }
      });

      const summary = stats.reduce((acc: any, stat: any) => {
        if (!acc[stat.status]) {
          acc[stat.status] = {};
        }
        acc[stat.status][stat.sourceFormat] = {
          count: stat._count._all,
          totalProcessed: stat._sum.recordsProcessed || 0,
          totalSuccessful: stat._sum.recordsSuccessful || 0,
          totalFailed: stat._sum.recordsFailed || 0
        };
        return acc;
      }, {} as Record<string, any>);

      return summary;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get migration statistics: ${errorMessage}`);
    }
  }

  /**
   * Retrieves failed migrations
   * @returns Promise<MigrationRecord[]> - Failed migration records
   */
  static async getFailedMigrations(): Promise<MigrationRecord[]> {
    try {
      const failedMigrations = await (prisma as any).migrationRecord.findMany({
        where: {
          status: 'failed'
        },
        orderBy: {
          startedAt: 'desc'
        }
      });

      return failedMigrations;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get failed migrations: ${errorMessage}`);
    }
  }

  /**
   * Retrieves recent migrations
   * @param limit - Number of migrations to retrieve
   * @returns Promise<MigrationRecord[]> - Recent migration records
   */
  static async getRecentMigrations(limit: number = 10): Promise<MigrationRecord[]> {
    try {
      const recentMigrations = await (prisma as any).migrationRecord.findMany({
        orderBy: {
          startedAt: 'desc'
        },
        take: limit
      });

      return recentMigrations;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get recent migrations: ${errorMessage}`);
    }
  }

  /**
   * Checks if a migration is currently running
   * @returns Promise<boolean> - True if any migration is running
   */
  static async isAnyMigrationRunning(): Promise<boolean> {
    try {
      const runningMigration = await (prisma as any).migrationRecord.findFirst({
        where: {
          status: 'running'
        }
      });

      return !!runningMigration;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to check running migrations: ${errorMessage}`);
    }
  }
}

export default MigrationRecordModel;