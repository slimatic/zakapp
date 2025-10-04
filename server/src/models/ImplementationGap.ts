import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface ImplementationGap {
  id: number;
  category: 'security' | 'islamic_compliance' | 'ui_ux' | 'performance' | 'testing' | 'documentation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  currentState: string;
  expectedState: string;
  affectedComponents: string;
  estimatedEffort: number;
  status: 'identified' | 'in_progress' | 'resolved' | 'deferred';
  assignedTo?: string;
  dueDate?: Date;
  resolution?: string;
  metadata?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateImplementationGapDto {
  category: 'security' | 'islamic_compliance' | 'ui_ux' | 'performance' | 'testing' | 'documentation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  currentState: string;
  expectedState: string;
  affectedComponents: string[];
  estimatedEffort: number;
  assignedTo?: string;
  dueDate?: Date;
  metadata?: Record<string, any>;
}

export interface UpdateImplementationGapDto {
  category?: 'security' | 'islamic_compliance' | 'ui_ux' | 'performance' | 'testing' | 'documentation';
  severity?: 'low' | 'medium' | 'high' | 'critical';
  title?: string;
  description?: string;
  currentState?: string;
  expectedState?: string;
  affectedComponents?: string[];
  estimatedEffort?: number;
  status?: 'identified' | 'in_progress' | 'resolved' | 'deferred';
  assignedTo?: string;
  dueDate?: Date;
  resolution?: string;
  metadata?: Record<string, any>;
}

/**
 * Implementation Gap Model - Manages identified gaps in implementation
 * Tracks constitutional violations and improvement opportunities
 */
export class ImplementationGapModel {
  /**
   * Creates a new implementation gap record
   * @param data - Implementation gap data to create
   * @returns Promise<ImplementationGap> - Created implementation gap
   * @throws Error if creation fails
   */
  static async create(data: CreateImplementationGapDto): Promise<ImplementationGap> {
    try {
      const implementationGap = await (prisma as any).implementationGap.create({
        data: {
          category: data.category,
          severity: data.severity,
          title: data.title,
          description: data.description,
          currentState: data.currentState,
          expectedState: data.expectedState,
          affectedComponents: JSON.stringify(data.affectedComponents),
          estimatedEffort: data.estimatedEffort,
          status: 'identified',
          assignedTo: data.assignedTo || null,
          dueDate: data.dueDate || null,
          metadata: data.metadata ? JSON.stringify(data.metadata) : null,
        }
      });

      return implementationGap;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to create implementation gap: ${errorMessage}`);
    }
  }

  /**
   * Retrieves implementation gap by ID
   * @param id - Implementation gap ID
   * @returns Promise<ImplementationGap | null> - Implementation gap or null if not found
   */
  static async findById(id: number): Promise<ImplementationGap | null> {
    try {
      const implementationGap = await (prisma as any).implementationGap.findUnique({
        where: { id }
      });

      return implementationGap;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to find implementation gap: ${errorMessage}`);
    }
  }

  /**
   * Retrieves all implementation gaps with optional filtering
   * @param filters - Optional filters for implementation gaps
   * @returns Promise<ImplementationGap[]> - Array of implementation gaps
   */
  static async findMany(filters?: {
    category?: string;
    severity?: string;
    status?: string;
    assignedTo?: string;
    limit?: number;
    offset?: number;
  }): Promise<ImplementationGap[]> {
    try {
      const where: any = {};
      
      if (filters?.category) {
        where.category = filters.category;
      }
      
      if (filters?.severity) {
        where.severity = filters.severity;
      }
      
      if (filters?.status) {
        where.status = filters.status;
      }
      
      if (filters?.assignedTo) {
        where.assignedTo = filters.assignedTo;
      }

      const implementationGaps = await (prisma as any).implementationGap.findMany({
        where,
        take: filters?.limit || 100,
        skip: filters?.offset || 0,
        orderBy: [
          { severity: 'desc' },
          { createdAt: 'desc' }
        ]
      });

      return implementationGaps;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to find implementation gaps: ${errorMessage}`);
    }
  }

  /**
   * Updates an existing implementation gap
   * @param id - Implementation gap ID
   * @param data - Updated implementation gap data
   * @returns Promise<ImplementationGap> - Updated implementation gap
   * @throws Error if update fails or implementation gap not found
   */
  static async update(id: number, data: UpdateImplementationGapDto): Promise<ImplementationGap> {
    try {
      const updateData: any = {};
      
      if (data.category !== undefined) updateData.category = data.category;
      if (data.severity !== undefined) updateData.severity = data.severity;
      if (data.title !== undefined) updateData.title = data.title;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.currentState !== undefined) updateData.currentState = data.currentState;
      if (data.expectedState !== undefined) updateData.expectedState = data.expectedState;
      if (data.affectedComponents !== undefined) {
        updateData.affectedComponents = JSON.stringify(data.affectedComponents);
      }
      if (data.estimatedEffort !== undefined) updateData.estimatedEffort = data.estimatedEffort;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.assignedTo !== undefined) updateData.assignedTo = data.assignedTo;
      if (data.dueDate !== undefined) updateData.dueDate = data.dueDate;
      if (data.resolution !== undefined) updateData.resolution = data.resolution;
      if (data.metadata !== undefined) {
        updateData.metadata = data.metadata ? JSON.stringify(data.metadata) : null;
      }

      const implementationGap = await (prisma as any).implementationGap.update({
        where: { id },
        data: updateData
      });

      return implementationGap;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to update implementation gap: ${errorMessage}`);
    }
  }

  /**
   * Deletes an implementation gap by ID
   * @param id - Implementation gap ID
   * @returns Promise<boolean> - True if deleted successfully
   * @throws Error if deletion fails
   */
  static async delete(id: number): Promise<boolean> {
    try {
      await (prisma as any).implementationGap.delete({
        where: { id }
      });

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to delete implementation gap: ${errorMessage}`);
    }
  }

  /**
   * Retrieves implementation gaps by priority (critical and high severity)
   * @returns Promise<ImplementationGap[]> - High priority implementation gaps
   */
  static async getHighPriority(): Promise<ImplementationGap[]> {
    try {
      const highPriorityGaps = await (prisma as any).implementationGap.findMany({
        where: {
          severity: {
            in: ['critical', 'high']
          },
          status: {
            in: ['identified', 'in_progress']
          }
        },
        orderBy: [
          { severity: 'desc' },
          { dueDate: 'asc' },
          { createdAt: 'asc' }
        ]
      });

      return highPriorityGaps;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get high priority gaps: ${errorMessage}`);
    }
  }

  /**
   * Retrieves implementation gaps by category statistics
   * @returns Promise<Record<string, any>> - Category statistics
   */
  static async getCategoryStatistics(): Promise<Record<string, any>> {
    try {
      const stats = await (prisma as any).implementationGap.groupBy({
        by: ['category', 'severity', 'status'],
        _count: {
          _all: true
        }
      });

      const summary = stats.reduce((acc: any, stat: any) => {
        if (!acc[stat.category]) {
          acc[stat.category] = {};
        }
        if (!acc[stat.category][stat.severity]) {
          acc[stat.category][stat.severity] = {};
        }
        acc[stat.category][stat.severity][stat.status] = stat._count._all;
        return acc;
      }, {} as Record<string, Record<string, Record<string, number>>>);

      return summary;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get category statistics: ${errorMessage}`);
    }
  }

  /**
   * Retrieves overdue implementation gaps
   * @returns Promise<ImplementationGap[]> - Overdue implementation gaps
   */
  static async getOverdue(): Promise<ImplementationGap[]> {
    try {
      const now = new Date();
      const overdueGaps = await (prisma as any).implementationGap.findMany({
        where: {
          dueDate: {
            lt: now
          },
          status: {
            in: ['identified', 'in_progress']
          }
        },
        orderBy: [
          { severity: 'desc' },
          { dueDate: 'asc' }
        ]
      });

      return overdueGaps;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get overdue gaps: ${errorMessage}`);
    }
  }

  /**
   * Marks an implementation gap as resolved
   * @param id - Implementation gap ID
   * @param resolution - Resolution description
   * @returns Promise<ImplementationGap> - Updated implementation gap
   */
  static async markResolved(id: number, resolution: string): Promise<ImplementationGap> {
    try {
      const implementationGap = await (prisma as any).implementationGap.update({
        where: { id },
        data: {
          status: 'resolved',
          resolution: resolution
        }
      });

      return implementationGap;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to mark implementation gap as resolved: ${errorMessage}`);
    }
  }
}

export default ImplementationGapModel;