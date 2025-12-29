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

export interface ComplianceVerification {
  id: number;
  category: 'security' | 'islamic_compliance' | 'data_protection' | 'accessibility' | 'legal';
  ruleName: string;
  description: string;
  component: string;
  status: 'compliant' | 'non_compliant' | 'warning' | 'not_applicable';
  severity: 'low' | 'medium' | 'high' | 'critical';
  evidence?: string;
  remediation?: string;
  checkedAt: Date;
  nextCheckDue?: Date;
  metadata?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateComplianceVerificationDto {
  category: 'security' | 'islamic_compliance' | 'data_protection' | 'accessibility' | 'legal';
  ruleName: string;
  description: string;
  component: string;
  status: 'compliant' | 'non_compliant' | 'warning' | 'not_applicable';
  severity: 'low' | 'medium' | 'high' | 'critical';
  evidence?: string;
  remediation?: string;
  nextCheckDue?: Date;
  metadata?: Record<string, any>;
}

export interface UpdateComplianceVerificationDto {
  category?: 'security' | 'islamic_compliance' | 'data_protection' | 'accessibility' | 'legal';
  ruleName?: string;
  description?: string;
  component?: string;
  status?: 'compliant' | 'non_compliant' | 'warning' | 'not_applicable';
  severity?: 'low' | 'medium' | 'high' | 'critical';
  evidence?: string;
  remediation?: string;
  checkedAt?: Date;
  nextCheckDue?: Date;
  metadata?: Record<string, any>;
}

/**
 * Compliance Verification Model - Manages compliance checks and constitutional adherence
 * Supports comprehensive compliance monitoring and constitutional principle verification
 */
export class ComplianceVerificationModel {
  /**
   * Creates a new compliance verification record
   * @param data - Compliance verification data to create
   * @returns Promise<ComplianceVerification> - Created compliance verification
   * @throws Error if creation fails
   */
  static async create(data: CreateComplianceVerificationDto): Promise<ComplianceVerification> {
    try {
      const complianceVerification = await (prisma as any).complianceVerification.create({
        data: {
          category: data.category,
          ruleName: data.ruleName,
          description: data.description,
          component: data.component,
          status: data.status,
          severity: data.severity,
          evidence: data.evidence || null,
          remediation: data.remediation || null,
          checkedAt: new Date(),
          nextCheckDue: data.nextCheckDue || null,
          metadata: data.metadata ? JSON.stringify(data.metadata) : null,
        }
      });

      return complianceVerification;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to create compliance verification: ${errorMessage}`);
    }
  }

  /**
   * Retrieves compliance verification by ID
   * @param id - Compliance verification ID
   * @returns Promise<ComplianceVerification | null> - Compliance verification or null if not found
   */
  static async findById(id: number): Promise<ComplianceVerification | null> {
    try {
      const complianceVerification = await (prisma as any).complianceVerification.findUnique({
        where: { id }
      });

      return complianceVerification;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to find compliance verification: ${errorMessage}`);
    }
  }

  /**
   * Retrieves all compliance verifications with optional filtering
   * @param filters - Optional filters for compliance verifications
   * @returns Promise<ComplianceVerification[]> - Array of compliance verifications
   */
  static async findMany(filters?: {
    category?: string;
    status?: string;
    severity?: string;
    component?: string;
    ruleName?: string;
    limit?: number;
    offset?: number;
  }): Promise<ComplianceVerification[]> {
    try {
      const where: any = {};
      
      if (filters?.category) {
        where.category = filters.category;
      }
      
      if (filters?.status) {
        where.status = filters.status;
      }
      
      if (filters?.severity) {
        where.severity = filters.severity;
      }
      
      if (filters?.component) {
        where.component = {
          contains: filters.component,
          mode: 'insensitive'
        };
      }
      
      if (filters?.ruleName) {
        where.ruleName = {
          contains: filters.ruleName,
          mode: 'insensitive'
        };
      }

      const complianceVerifications = await (prisma as any).complianceVerification.findMany({
        where,
        take: filters?.limit || 100,
        skip: filters?.offset || 0,
        orderBy: [
          { severity: 'desc' },
          { checkedAt: 'desc' }
        ]
      });

      return complianceVerifications;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to find compliance verifications: ${errorMessage}`);
    }
  }

  /**
   * Updates an existing compliance verification
   * @param id - Compliance verification ID
   * @param data - Updated compliance verification data
   * @returns Promise<ComplianceVerification> - Updated compliance verification
   * @throws Error if update fails or compliance verification not found
   */
  static async update(id: number, data: UpdateComplianceVerificationDto): Promise<ComplianceVerification> {
    try {
      const updateData: any = {};
      
      if (data.category !== undefined) updateData.category = data.category;
      if (data.ruleName !== undefined) updateData.ruleName = data.ruleName;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.component !== undefined) updateData.component = data.component;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.severity !== undefined) updateData.severity = data.severity;
      if (data.evidence !== undefined) updateData.evidence = data.evidence;
      if (data.remediation !== undefined) updateData.remediation = data.remediation;
      if (data.checkedAt !== undefined) updateData.checkedAt = data.checkedAt;
      if (data.nextCheckDue !== undefined) updateData.nextCheckDue = data.nextCheckDue;
      if (data.metadata !== undefined) {
        updateData.metadata = data.metadata ? JSON.stringify(data.metadata) : null;
      }

      const complianceVerification = await (prisma as any).complianceVerification.update({
        where: { id },
        data: updateData
      });

      return complianceVerification;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to update compliance verification: ${errorMessage}`);
    }
  }

  /**
   * Deletes a compliance verification by ID
   * @param id - Compliance verification ID
   * @returns Promise<boolean> - True if deleted successfully
   * @throws Error if deletion fails
   */
  static async delete(id: number): Promise<boolean> {
    try {
      await (prisma as any).complianceVerification.delete({
        where: { id }
      });

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to delete compliance verification: ${errorMessage}`);
    }
  }

  /**
   * Retrieves non-compliant verifications by severity
   * @returns Promise<ComplianceVerification[]> - Non-compliant verifications
   */
  static async getNonCompliant(): Promise<ComplianceVerification[]> {
    try {
      const nonCompliantVerifications = await (prisma as any).complianceVerification.findMany({
        where: {
          status: {
            in: ['non_compliant', 'warning']
          }
        },
        orderBy: [
          { severity: 'desc' },
          { checkedAt: 'desc' }
        ]
      });

      return nonCompliantVerifications;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get non-compliant verifications: ${errorMessage}`);
    }
  }

  /**
   * Retrieves compliance statistics by category
   * @returns Promise<Record<string, any>> - Category compliance statistics
   */
  static async getComplianceStatistics(): Promise<Record<string, any>> {
    try {
      const stats = await (prisma as any).complianceVerification.groupBy({
        by: ['category', 'status', 'severity'],
        _count: {
          _all: true
        }
      });

      const summary = stats.reduce((acc: any, stat: any) => {
        if (!acc[stat.category]) {
          acc[stat.category] = {};
        }
        if (!acc[stat.category][stat.status]) {
          acc[stat.category][stat.status] = {};
        }
        acc[stat.category][stat.status][stat.severity] = stat._count._all;
        return acc;
      }, {} as Record<string, any>);

      return summary;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get compliance statistics: ${errorMessage}`);
    }
  }

  /**
   * Retrieves overdue compliance checks
   * @returns Promise<ComplianceVerification[]> - Overdue compliance verifications
   */
  static async getOverdueChecks(): Promise<ComplianceVerification[]> {
    try {
      const now = new Date();
      const overdueChecks = await (prisma as any).complianceVerification.findMany({
        where: {
          nextCheckDue: {
            lt: now
          }
        },
        orderBy: [
          { severity: 'desc' },
          { nextCheckDue: 'asc' }
        ]
      });

      return overdueChecks;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get overdue checks: ${errorMessage}`);
    }
  }

  /**
   * Retrieves critical violations
   * @returns Promise<ComplianceVerification[]> - Critical compliance violations
   */
  static async getCriticalViolations(): Promise<ComplianceVerification[]> {
    try {
      const criticalViolations = await (prisma as any).complianceVerification.findMany({
        where: {
          severity: 'critical',
          status: {
            in: ['non_compliant', 'warning']
          }
        },
        orderBy: {
          checkedAt: 'desc'
        }
      });

      return criticalViolations;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get critical violations: ${errorMessage}`);
    }
  }

  /**
   * Retrieves Islamic compliance specific verifications
   * @returns Promise<ComplianceVerification[]> - Islamic compliance verifications
   */
  static async getIslamicComplianceChecks(): Promise<ComplianceVerification[]> {
    try {
      const islamicCompliance = await (prisma as any).complianceVerification.findMany({
        where: {
          category: 'islamic_compliance'
        },
        orderBy: [
          { status: 'asc' }, // Show non-compliant first
          { severity: 'desc' },
          { checkedAt: 'desc' }
        ]
      });

      return islamicCompliance;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get Islamic compliance checks: ${errorMessage}`);
    }
  }

  /**
   * Performs a compliance check and records the result
   * @param ruleName - Rule name being checked
   * @param component - Component being checked
   * @param checkFunction - Function that performs the actual check
   * @returns Promise<ComplianceVerification> - Created verification record
   */
  static async performCheck(
    ruleName: string,
    component: string,
    checkFunction: () => Promise<{
      status: 'compliant' | 'non_compliant' | 'warning' | 'not_applicable';
      evidence?: string;
      remediation?: string;
    }>
  ): Promise<ComplianceVerification> {
    try {
      const result = await checkFunction();
      
      // Find existing rule configuration
      const existingRule = await (prisma as any).complianceVerification.findFirst({
        where: { ruleName, component },
        orderBy: { checkedAt: 'desc' }
      });

      if (!existingRule) {
        throw new Error(`No rule configuration found for: ${ruleName} in ${component}`);
      }

      // Create new verification record
      const verification = await this.create({
        category: existingRule.category,
        ruleName: existingRule.ruleName,
        description: existingRule.description,
        component: component,
        status: result.status,
        severity: existingRule.severity,
        evidence: result.evidence,
        remediation: result.remediation,
        nextCheckDue: this.calculateNextCheckDue(existingRule.severity)
      });

      return verification;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to perform compliance check: ${errorMessage}`);
    }
  }

  /**
   * Calculates next check due date based on severity
   * @param severity - Compliance rule severity
   * @returns Next check due date
   */
  private static calculateNextCheckDue(severity: string): Date {
    const now = new Date();
    const nextCheck = new Date(now);

    switch (severity) {
      case 'critical':
        nextCheck.setDate(now.getDate() + 1); // Daily for critical
        break;
      case 'high':
        nextCheck.setDate(now.getDate() + 7); // Weekly for high
        break;
      case 'medium':
        nextCheck.setDate(now.getDate() + 30); // Monthly for medium
        break;
      case 'low':
        nextCheck.setDate(now.getDate() + 90); // Quarterly for low
        break;
      default:
        nextCheck.setDate(now.getDate() + 30); // Default monthly
    }

    return nextCheck;
  }
}

export default ComplianceVerificationModel;