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

export interface UserWorkflow {
  id: number;
  workflowName: string;
  description: string;
  steps: string;
  expectedDuration: number;
  actualDuration?: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'abandoned';
  startedAt?: Date;
  completedAt?: Date;
  userId?: string;
  sessionId?: string;
  currentStep: number;
  totalSteps: number;
  successRate: number;
  errorLog?: string;
  metadata?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserWorkflowDto {
  workflowName: string;
  description: string;
  steps: WorkflowStep[];
  expectedDuration: number;
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
}

export interface UpdateUserWorkflowDto {
  status?: 'pending' | 'in_progress' | 'completed' | 'failed' | 'abandoned';
  startedAt?: Date;
  completedAt?: Date;
  actualDuration?: number;
  currentStep?: number;
  successRate?: number;
  errorLog?: string;
  metadata?: Record<string, any>;
}

export interface WorkflowStep {
  stepNumber: number;
  name: string;
  description: string;
  expectedTime: number;
  isRequired: boolean;
  dependencies?: number[];
}

/**
 * User Workflow Model - Manages user workflow tracking and analysis
 * Supports comprehensive user journey monitoring and optimization
 */
export class UserWorkflowModel {
  /**
   * Creates a new user workflow record
   * @param data - User workflow data to create
   * @returns Promise<UserWorkflow> - Created user workflow
   * @throws Error if creation fails
   */
  static async create(data: CreateUserWorkflowDto): Promise<UserWorkflow> {
    try {
      const userWorkflow = await (prisma as any).userWorkflow.create({
        data: {
          workflowName: data.workflowName,
          description: data.description,
          steps: JSON.stringify(data.steps),
          expectedDuration: data.expectedDuration,
          status: 'pending',
          userId: data.userId || null,
          sessionId: data.sessionId || null,
          currentStep: 0,
          totalSteps: data.steps.length,
          successRate: 0,
          metadata: data.metadata ? JSON.stringify(data.metadata) : null,
        }
      });

      return userWorkflow;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to create user workflow: ${errorMessage}`);
    }
  }

  /**
   * Retrieves user workflow by ID
   * @param id - User workflow ID
   * @returns Promise<UserWorkflow | null> - User workflow or null if not found
   */
  static async findById(id: number): Promise<UserWorkflow | null> {
    try {
      const userWorkflow = await (prisma as any).userWorkflow.findUnique({
        where: { id }
      });

      return userWorkflow;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to find user workflow: ${errorMessage}`);
    }
  }

  /**
   * Retrieves all user workflows with optional filtering
   * @param filters - Optional filters for user workflows
   * @returns Promise<UserWorkflow[]> - Array of user workflows
   */
  static async findMany(filters?: {
    workflowName?: string;
    status?: string;
    userId?: string;
    sessionId?: string;
    limit?: number;
    offset?: number;
  }): Promise<UserWorkflow[]> {
    try {
      const where: any = {};
      
      if (filters?.workflowName) {
        where.workflowName = {
          contains: filters.workflowName,
          mode: 'insensitive'
        };
      }
      
      if (filters?.status) {
        where.status = filters.status;
      }
      
      if (filters?.userId) {
        where.userId = filters.userId;
      }
      
      if (filters?.sessionId) {
        where.sessionId = filters.sessionId;
      }

      const userWorkflows = await (prisma as any).userWorkflow.findMany({
        where,
        take: filters?.limit || 100,
        skip: filters?.offset || 0,
        orderBy: {
          createdAt: 'desc'
        }
      });

      return userWorkflows;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to find user workflows: ${errorMessage}`);
    }
  }

  /**
   * Updates an existing user workflow
   * @param id - User workflow ID
   * @param data - Updated user workflow data
   * @returns Promise<UserWorkflow> - Updated user workflow
   * @throws Error if update fails or user workflow not found
   */
  static async update(id: number, data: UpdateUserWorkflowDto): Promise<UserWorkflow> {
    try {
      const updateData: any = {};
      
      if (data.status !== undefined) updateData.status = data.status;
      if (data.startedAt !== undefined) updateData.startedAt = data.startedAt;
      if (data.completedAt !== undefined) updateData.completedAt = data.completedAt;
      if (data.actualDuration !== undefined) updateData.actualDuration = data.actualDuration;
      if (data.currentStep !== undefined) updateData.currentStep = data.currentStep;
      if (data.successRate !== undefined) updateData.successRate = data.successRate;
      if (data.errorLog !== undefined) updateData.errorLog = data.errorLog;
      if (data.metadata !== undefined) {
        updateData.metadata = data.metadata ? JSON.stringify(data.metadata) : null;
      }

      const userWorkflow = await (prisma as any).userWorkflow.update({
        where: { id },
        data: updateData
      });

      return userWorkflow;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to update user workflow: ${errorMessage}`);
    }
  }

  /**
   * Deletes a user workflow by ID
   * @param id - User workflow ID
   * @returns Promise<boolean> - True if deleted successfully
   * @throws Error if deletion fails
   */
  static async delete(id: number): Promise<boolean> {
    try {
      await (prisma as any).userWorkflow.delete({
        where: { id }
      });

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to delete user workflow: ${errorMessage}`);
    }
  }

  /**
   * Starts a workflow execution
   * @param id - User workflow ID
   * @returns Promise<UserWorkflow> - Updated workflow
   */
  static async startWorkflow(id: number): Promise<UserWorkflow> {
    try {
      const userWorkflow = await (prisma as any).userWorkflow.update({
        where: { id },
        data: {
          status: 'in_progress',
          startedAt: new Date(),
          currentStep: 1
        }
      });

      return userWorkflow;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to start workflow: ${errorMessage}`);
    }
  }

  /**
   * Advances workflow to next step
   * @param id - User workflow ID
   * @param stepCompleted - Step number completed
   * @returns Promise<UserWorkflow> - Updated workflow
   */
  static async advanceStep(id: number, stepCompleted: number): Promise<UserWorkflow> {
    try {
      const workflow = await this.findById(id);
      if (!workflow) {
        throw new Error(`Workflow not found with ID: ${id}`);
      }

      const currentStep = Math.max(workflow.currentStep, stepCompleted + 1);
      const successRate = (stepCompleted / workflow.totalSteps) * 100;
      
      let status = workflow.status;
      let completedAt = workflow.completedAt;
      let actualDuration = workflow.actualDuration;

      // Check if workflow is completed
      if (currentStep > workflow.totalSteps) {
        status = 'completed';
        completedAt = new Date();
        if (workflow.startedAt) {
          actualDuration = completedAt.getTime() - workflow.startedAt.getTime();
        }
      }

      const updatedWorkflow = await this.update(id, {
        currentStep,
        successRate,
        status,
        completedAt,
        actualDuration
      });

      return updatedWorkflow;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to advance workflow step: ${errorMessage}`);
    }
  }

  /**
   * Fails a workflow with error details
   * @param id - User workflow ID
   * @param errorLog - Error details
   * @returns Promise<UserWorkflow> - Updated workflow
   */
  static async failWorkflow(id: number, errorLog: string): Promise<UserWorkflow> {
    try {
      const workflow = await this.findById(id);
      if (!workflow) {
        throw new Error(`Workflow not found with ID: ${id}`);
      }

      let actualDuration;
      const completedAt = new Date();
      
      if (workflow.startedAt) {
        actualDuration = completedAt.getTime() - workflow.startedAt.getTime();
      }

      const updatedWorkflow = await this.update(id, {
        status: 'failed',
        completedAt,
        actualDuration,
        errorLog
      });

      return updatedWorkflow;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to mark workflow as failed: ${errorMessage}`);
    }
  }

  /**
   * Retrieves workflow statistics by name
   * @returns Promise<Record<string, any>> - Workflow statistics
   */
  static async getWorkflowStatistics(): Promise<Record<string, any>> {
    try {
      const stats = await (prisma as any).userWorkflow.groupBy({
        by: ['workflowName', 'status'],
        _count: {
          _all: true
        },
        _avg: {
          actualDuration: true,
          successRate: true
        }
      });

      const summary = stats.reduce((acc: any, stat: any) => {
        if (!acc[stat.workflowName]) {
          acc[stat.workflowName] = {
            counts: {},
            avgDuration: 0,
            avgSuccessRate: 0
          };
        }
        
        acc[stat.workflowName].counts[stat.status] = stat._count._all;
        acc[stat.workflowName].avgDuration = stat._avg.actualDuration || 0;
        acc[stat.workflowName].avgSuccessRate = stat._avg.successRate || 0;
        
        return acc;
      }, {} as Record<string, any>);

      return summary;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get workflow statistics: ${errorMessage}`);
    }
  }

  /**
   * Retrieves abandoned workflows
   * @param hoursThreshold - Hours of inactivity to consider abandoned
   * @returns Promise<UserWorkflow[]> - Abandoned workflows
   */
  static async getAbandonedWorkflows(hoursThreshold: number = 2): Promise<UserWorkflow[]> {
    try {
      const thresholdDate = new Date();
      thresholdDate.setHours(thresholdDate.getHours() - hoursThreshold);

      const abandonedWorkflows = await (prisma as any).userWorkflow.findMany({
        where: {
          status: 'in_progress',
          startedAt: {
            lt: thresholdDate
          }
        },
        orderBy: {
          startedAt: 'asc'
        }
      });

      return abandonedWorkflows;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get abandoned workflows: ${errorMessage}`);
    }
  }

  /**
   * Retrieves conversion funnel data for a workflow
   * @param workflowName - Name of workflow to analyze
   * @returns Promise<Record<string, any>> - Conversion funnel data
   */
  static async getConversionFunnel(workflowName: string): Promise<Record<string, any>> {
    try {
      const workflows = await (prisma as any).userWorkflow.findMany({
        where: { workflowName },
        select: {
          currentStep: true,
          totalSteps: true,
          status: true
        }
      });

      if (workflows.length === 0) {
        return { error: 'No workflows found for the specified name' };
      }

      const totalSteps = workflows[0].totalSteps;
      const stepData: Record<number, number> = {};

      // Initialize step counts
      for (let i = 1; i <= totalSteps; i++) {
        stepData[i] = 0;
      }

      // Count users who reached each step
      workflows.forEach(workflow => {
        for (let step = 1; step <= workflow.currentStep; step++) {
          stepData[step]++;
        }
      });

      // Calculate conversion rates
      const funnelData: any[] = [];
      const totalStarted = workflows.filter(w => w.status !== 'pending').length;

      for (let step = 1; step <= totalSteps; step++) {
        const reached = stepData[step];
        const conversionRate = totalStarted > 0 ? (reached / totalStarted) * 100 : 0;
        
        funnelData.push({
          step,
          reached,
          conversionRate: parseFloat(conversionRate.toFixed(2))
        });
      }

      return {
        workflowName,
        totalWorkflows: workflows.length,
        totalStarted,
        completed: workflows.filter(w => w.status === 'completed').length,
        funnel: funnelData
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get conversion funnel: ${errorMessage}`);
    }
  }

  /**
   * Retrieves performance metrics for workflows
   * @returns Promise<Record<string, any>> - Performance metrics
   */
  static async getPerformanceMetrics(): Promise<Record<string, any>> {
    try {
      const metrics = await (prisma as any).userWorkflow.aggregate({
        _avg: {
          actualDuration: true,
          successRate: true
        },
        _max: {
          actualDuration: true
        },
        _min: {
          actualDuration: true
        }
      });

      const slowWorkflows = await (prisma as any).userWorkflow.findMany({
        where: {
          actualDuration: {
            gt: 300000 // Slower than 5 minutes
          }
        },
        select: {
          workflowName: true,
          actualDuration: true,
          expectedDuration: true
        },
        orderBy: {
          actualDuration: 'desc'
        },
        take: 10
      });

      return {
        averageDuration: metrics._avg.actualDuration,
        averageSuccessRate: metrics._avg.successRate,
        maxDuration: metrics._max.actualDuration,
        minDuration: metrics._min.actualDuration,
        slowWorkflows
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get performance metrics: ${errorMessage}`);
    }
  }

  /**
   * Marks abandoned workflows as abandoned
   * @param hoursThreshold - Hours of inactivity to consider abandoned
   * @returns Promise<number> - Number of workflows marked as abandoned
   */
  static async markAbandonedWorkflows(hoursThreshold: number = 2): Promise<number> {
    try {
      const abandonedWorkflows = await this.getAbandonedWorkflows(hoursThreshold);
      
      for (const workflow of abandonedWorkflows) {
        await this.update(workflow.id, {
          status: 'abandoned',
          completedAt: new Date()
        });
      }

      return abandonedWorkflows.length;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to mark abandoned workflows: ${errorMessage}`);
    }
  }
}

export default UserWorkflowModel;