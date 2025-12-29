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
import { EncryptionService } from './EncryptionService';
import * as crypto from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';

const prisma = new PrismaClient();
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '[REDACTED]';

export interface ExportOptions {
  includeAssets?: boolean;
  includeLiabilities?: boolean;
  includeCalculations?: boolean;
  includePayments?: boolean;
  includeSnapshots?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
  format?: 'json' | 'csv';
  encrypt?: boolean;
}

export interface ImportOptions {
  overwriteExisting?: boolean;
  validateData?: boolean;
  dryRun?: boolean;
  skipDuplicates?: boolean;
}

export interface ExportData {
  metadata: {
    exportDate: Date;
    userId: string;
    version: string;
    checksum: string;
    encrypted: boolean;
  };
  assets?: any[];
  liabilities?: any[];
  calculations?: any[];
  payments?: any[];
  snapshots?: any[];
}

export interface ImportResult {
  success: boolean;
  summary: {
    assetsImported: number;
    liabilitiesImported: number;
    calculationsImported: number;
    paymentsImported: number;
    snapshotsImported: number;
    errors: string[];
    warnings: string[];
  };
  details?: any;
}

export class ImportExportService {
  private readonly EXPORT_VERSION = '1.0.0';
  private readonly TEMP_DIR = '/tmp/zakapp-exports';

  /**
   * Export user data
   */
  async exportUserData(userId: string, options: ExportOptions = {}): Promise<string> {
    const {
      includeAssets = true,
      includeLiabilities = true,
      includeCalculations = true,
      includePayments = true,
      includeSnapshots = true,
      dateRange,
      format = 'json',
      encrypt = false
    } = options;

    // Ensure temp directory exists
    await this.ensureTempDir();

    const exportData: ExportData = {
      metadata: {
        exportDate: new Date(),
        userId,
        version: this.EXPORT_VERSION,
        checksum: '',
        encrypted: encrypt
      }
    };

    // Build date filter for time-based data
    const dateFilter = dateRange ? {
      gte: dateRange.start,
      lte: dateRange.end
    } : undefined;

    // Export assets
    if (includeAssets) {
      const assets = await prisma.asset.findMany({
        where: {
          userId,
          ...(dateFilter && { createdAt: dateFilter })
        }
      });

      exportData.assets = assets.map(asset => ({
        id: asset.id,
        category: asset.category,
        name: asset.name,
        value: asset.value,
        currency: asset.currency,
        acquisitionDate: asset.acquisitionDate,
        description: asset.notes || '',
        createdAt: asset.createdAt,
        updatedAt: asset.updatedAt
      }));
    }

    // Export liabilities
    if (includeLiabilities) {
      const liabilities = await prisma.liability.findMany({
        where: {
          userId,
          ...(dateFilter && { createdAt: dateFilter })
        }
      });

      exportData.liabilities = liabilities.map(liability => ({
        id: liability.id,
        name: liability.name,
        type: liability.type,
        amount: liability.amount,
        currency: liability.currency,
        dueDate: liability.dueDate,
        description: liability.notes || '',
        createdAt: liability.createdAt,
        updatedAt: liability.updatedAt
      }));
    }

    // Export calculations
    if (includeCalculations) {
      const calculations = await prisma.zakatCalculation.findMany({
        where: {
          userId,
          ...(dateFilter && { calculationDate: dateFilter })
        }
      });

      exportData.calculations = calculations.map(calc => ({
        id: calc.id,
        calculationDate: calc.calculationDate,
        methodology: calc.methodology,
        calendarType: calc.calendarType,
        totalAssets: calc.totalAssets,
        totalLiabilities: calc.totalLiabilities,
        netWorth: calc.netWorth,
        nisabThreshold: calc.nisabThreshold,
        nisabSource: calc.nisabSource,
        isZakatObligatory: calc.isZakatObligatory,
        zakatAmount: calc.zakatAmount,
        zakatRate: calc.zakatRate,
        breakdown: calc.breakdown,
        assetsIncluded: calc.assetsIncluded,
        liabilitiesIncluded: calc.liabilitiesIncluded
      }));
    }

    // Export payments
    if (includePayments) {
      const payments = await prisma.zakatPayment.findMany({
        where: {
          userId,
          ...(dateFilter && { paymentDate: dateFilter })
        }
      });

      exportData.payments = payments.map(payment => ({
        id: payment.id,
        calculationId: payment.calculationId,
        paymentDate: payment.paymentDate,
        amount: payment.amount,
        currency: payment.currency,
        recipients: payment.recipients,
        paymentMethod: payment.paymentMethod,
        receiptNumber: payment.receiptNumber,
        islamicYear: payment.islamicYear,
        notes: payment.notes,
        status: payment.status,
        verificationDetails: payment.verificationDetails
      }));
    }

    // Export snapshots
    if (includeSnapshots) {
      const snapshots = await prisma.assetSnapshot.findMany({
        where: {
          userId,
          ...(dateFilter && { snapshotDate: dateFilter })
        }
      });

      exportData.snapshots = snapshots.map(snapshot => ({
        id: snapshot.id,
        name: snapshot.name,
        description: snapshot.description,
        snapshotDate: snapshot.snapshotDate,
        islamicYear: snapshot.islamicYear,
        totalAssets: snapshot.totalAssets,
        totalLiabilities: snapshot.totalLiabilities,
        netWorth: snapshot.netWorth,
        assetsCount: snapshot.assetCount,
        liabilitiesCount: snapshot.liabilitiesCount,
        tags: snapshot.tags,
        metadata: snapshot.metadata,
        assetsData: snapshot.assetsData,
        liabilitiesData: snapshot.liabilitiesData
      }));
    }

    // Generate checksum
    const dataString = JSON.stringify(exportData);
    exportData.metadata.checksum = crypto.createHash('sha256')
      .update(dataString)
      .digest('hex');

    // Process data based on format and encryption
    let finalData: string;
    let fileName: string;

    if (format === 'csv') {
      finalData = this.convertToCSV(exportData);
      fileName = `zakapp-export-${userId}-${Date.now()}.csv`;
    } else {
      finalData = encrypt ? 
        await EncryptionService.encrypt(JSON.stringify(exportData), ENCRYPTION_KEY) :
        JSON.stringify(exportData, null, 2);
      fileName = `zakapp-export-${userId}-${Date.now()}.json`;
    }

    // Write to temporary file
    const filePath = path.join(this.TEMP_DIR, fileName);
    await fs.writeFile(filePath, finalData, 'utf8');

    return filePath;
  }

  /**
   * Import user data
   */
  async importUserData(
    userId: string, 
    filePath: string, 
    options: ImportOptions = {}
  ): Promise<ImportResult> {
    const {
      overwriteExisting = false,
      validateData = true,
      dryRun = false,
      skipDuplicates = true
    } = options;

    const result: ImportResult = {
      success: false,
      summary: {
        assetsImported: 0,
        liabilitiesImported: 0,
        calculationsImported: 0,
        paymentsImported: 0,
        snapshotsImported: 0,
        errors: [],
        warnings: []
      }
    };

    try {
      // Read and parse file
      const fileContent = await fs.readFile(filePath, 'utf8');
      let importData: ExportData;

      try {
        // Try to parse as JSON first
        importData = JSON.parse(fileContent);
      } catch {
        try {
          // If JSON parsing fails, try decryption
          const decryptedContent = await EncryptionService.decrypt(fileContent, ENCRYPTION_KEY);
          importData = JSON.parse(decryptedContent);
        } catch {
          throw new Error('Unable to parse import file. File may be corrupted or in an unsupported format.');
        }
      }

      // Validate import data structure
      if (validateData) {
        this.validateImportData(importData, result.summary.errors);
      }

      if (result.summary.errors.length > 0 && !dryRun) {
        return result;
      }

      // Verify checksum if available
      if (importData.metadata?.checksum) {
        const tempMetadata = { ...importData.metadata };
        delete tempMetadata.checksum;
        const tempData = { ...importData, metadata: tempMetadata };
        
        const calculatedChecksum = crypto.createHash('sha256')
          .update(JSON.stringify(tempData))
          .digest('hex');

        if (calculatedChecksum !== importData.metadata.checksum) {
          result.summary.warnings.push('Checksum mismatch - data may be corrupted');
        }
      }

      if (dryRun) {
        // For dry run, just validate and count items
        result.summary.assetsImported = importData.assets?.length || 0;
        result.summary.liabilitiesImported = importData.liabilities?.length || 0;
        result.summary.calculationsImported = importData.calculations?.length || 0;
        result.summary.paymentsImported = importData.payments?.length || 0;
        result.summary.snapshotsImported = importData.snapshots?.length || 0;
        
        result.success = result.summary.errors.length === 0;
        return result;
      }

      // Start transaction for atomic import
      await prisma.$transaction(async (tx) => {
        // Import assets
        if (importData.assets) {
          for (const assetData of importData.assets) {
            try {
              await this.importAsset(tx, userId, assetData, { overwriteExisting, skipDuplicates });
              result.summary.assetsImported++;
            } catch (error) {
              result.summary.errors.push(`Asset import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
          }
        }

        // Import liabilities
        if (importData.liabilities) {
          for (const liabilityData of importData.liabilities) {
            try {
              await this.importLiability(tx, userId, liabilityData, { overwriteExisting, skipDuplicates });
              result.summary.liabilitiesImported++;
            } catch (error) {
              result.summary.errors.push(`Liability import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
          }
        }

        // Import calculations
        if (importData.calculations) {
          for (const calculationData of importData.calculations) {
            try {
              await this.importCalculation(tx, userId, calculationData, { overwriteExisting, skipDuplicates });
              result.summary.calculationsImported++;
            } catch (error) {
              result.summary.errors.push(`Calculation import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
          }
        }

        // Import payments
        if (importData.payments) {
          for (const paymentData of importData.payments) {
            try {
              await this.importPayment(tx, userId, paymentData, { overwriteExisting, skipDuplicates });
              result.summary.paymentsImported++;
            } catch (error) {
              result.summary.errors.push(`Payment import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
          }
        }

        // Import snapshots
        if (importData.snapshots) {
          for (const snapshotData of importData.snapshots) {
            try {
              await this.importSnapshot(tx, userId, snapshotData, { overwriteExisting, skipDuplicates });
              result.summary.snapshotsImported++;
            } catch (error) {
              result.summary.errors.push(`Snapshot import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
          }
        }
      });

      result.success = true;

    } catch (error) {
      result.summary.errors.push(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  /**
   * Get import/export history
   */
  async getOperationHistory(userId: string, limit: number = 10) {
    // This would typically be stored in a separate table
    // For now, return a placeholder structure
    return {
      operations: [],
      total: 0
    };
  }

  /**
   * Clean up temporary files
   */
  async cleanupTempFiles(olderThanHours: number = 24): Promise<void> {
    try {
      const files = await fs.readdir(this.TEMP_DIR);
      const cutoffTime = Date.now() - (olderThanHours * 60 * 60 * 1000);

      for (const file of files) {
        const filePath = path.join(this.TEMP_DIR, file);
        const stats = await fs.stat(filePath);
        
        if (stats.mtime.getTime() < cutoffTime) {
          await fs.unlink(filePath);
        }
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  }

  /**
   * Private: Ensure temp directory exists
   */
  private async ensureTempDir(): Promise<void> {
    try {
      await fs.access(this.TEMP_DIR);
    } catch {
      await fs.mkdir(this.TEMP_DIR, { recursive: true });
    }
  }

  /**
   * Private: Convert export data to CSV
   */
  private convertToCSV(exportData: ExportData): string {
    const csvSections: string[] = [];

    // Add metadata
    csvSections.push('METADATA');
    csvSections.push(`Export Date,${exportData.metadata.exportDate.toISOString()}`);
    csvSections.push(`User ID,${exportData.metadata.userId}`);
    csvSections.push(`Version,${exportData.metadata.version}`);
    csvSections.push('');

    // Add assets
    if (exportData.assets && exportData.assets.length > 0) {
      csvSections.push('ASSETS');
      csvSections.push('ID,Name,Category,Value,Currency,Acquisition Date,Description');
      exportData.assets.forEach(asset => {
        csvSections.push([
          asset.id,
          asset.name,
          asset.category,
          asset.value,
          asset.currency,
          asset.acquisitionDate ? asset.acquisitionDate.toISOString() : '',
          asset.description || ''
        ].join(','));
      });
      csvSections.push('');
    }

    // Add liabilities
    if (exportData.liabilities && exportData.liabilities.length > 0) {
      csvSections.push('LIABILITIES');
      csvSections.push('ID,Name,Type,Amount,Currency,Due Date,Interest Rate,Description');
      exportData.liabilities.forEach(liability => {
        csvSections.push([
          liability.id,
          liability.name,
          liability.type,
          liability.amount,
          liability.currency,
          liability.dueDate ? liability.dueDate.toISOString() : '',
          liability.interestRate || '',
          liability.description || ''
        ].join(','));
      });
      csvSections.push('');
    }

    return csvSections.join('\n');
  }

  /**
   * Private: Validate import data structure
   */
  private validateImportData(data: any, errors: string[]): void {
    if (!data || typeof data !== 'object') {
      errors.push('Invalid import data structure');
      return;
    }

    if (!data.metadata) {
      errors.push('Missing metadata section');
    } else {
      if (!data.metadata.userId) {
        errors.push('Missing user ID in metadata');
      }
      if (!data.metadata.exportDate) {
        errors.push('Missing export date in metadata');
      }
    }

    // Validate assets structure
    if (data.assets && !Array.isArray(data.assets)) {
      errors.push('Assets section must be an array');
    }

    // Validate liabilities structure
    if (data.liabilities && !Array.isArray(data.liabilities)) {
      errors.push('Liabilities section must be an array');
    }

    // Validate calculations structure
    if (data.calculations && !Array.isArray(data.calculations)) {
      errors.push('Calculations section must be an array');
    }
  }

  /**
   * Private: Import single asset
   */
  private async importAsset(tx: any, userId: string, assetData: any, options: any) {
    const existingAsset = await tx.asset.findFirst({
      where: {
        userId,
        name: assetData.name,
        category: assetData.category
      }
    });

    if (existingAsset) {
      if (options.skipDuplicates) {
        return;
      }
      if (options.overwriteExisting) {
        await tx.asset.update({
          where: { id: existingAsset.id },
          data: {
            value: assetData.value,
            currency: assetData.currency,
            acquisitionDate: assetData.acquisitionDate,
            description: assetData.description
          }
        });
      }
    } else {
      await tx.asset.create({
        data: {
          userId,
          name: assetData.name,
          category: assetData.category,
          value: assetData.value,
          currency: assetData.currency,
          acquisitionDate: assetData.acquisitionDate,
          description: assetData.description,
          isActive: true
        }
      });
    }
  }

  /**
   * Private: Import single liability
   */
  private async importLiability(tx: any, userId: string, liabilityData: any, options: any) {
    const existingLiability = await tx.liability.findFirst({
      where: {
        userId,
        name: liabilityData.name,
        type: liabilityData.type
      }
    });

    if (existingLiability) {
      if (options.skipDuplicates) {
        return;
      }
      if (options.overwriteExisting) {
        await tx.liability.update({
          where: { id: existingLiability.id },
          data: {
            amount: liabilityData.amount,
            currency: liabilityData.currency,
            dueDate: liabilityData.dueDate,
            interestRate: liabilityData.interestRate,
            description: liabilityData.description
          }
        });
      }
    } else {
      await tx.liability.create({
        data: {
          userId,
          name: liabilityData.name,
          type: liabilityData.type,
          amount: liabilityData.amount,
          currency: liabilityData.currency,
          dueDate: liabilityData.dueDate,
          interestRate: liabilityData.interestRate,
          description: liabilityData.description,
          isActive: true
        }
      });
    }
  }

  /**
   * Private: Import single calculation
   */
  private async importCalculation(tx: any, userId: string, calculationData: any, options: any) {
    // Skip duplicates based on date and methodology
    const existingCalculation = await tx.zakatCalculation.findFirst({
      where: {
        userId,
        calculationDate: calculationData.calculationDate,
        methodology: calculationData.methodology
      }
    });

    if (existingCalculation && options.skipDuplicates) {
      return;
    }

    if (!existingCalculation || options.overwriteExisting) {
      const data = {
        userId,
        calculationDate: calculationData.calculationDate,
        methodology: calculationData.methodology,
        calendarType: calculationData.calendarType,
        totalAssets: calculationData.totalAssets,
        totalLiabilities: calculationData.totalLiabilities,
        netWorth: calculationData.netWorth,
        nisabThreshold: calculationData.nisabThreshold,
        nisabSource: calculationData.nisabSource,
        isZakatObligatory: calculationData.isZakatObligatory,
        zakatAmount: calculationData.zakatAmount,
        zakatRate: calculationData.zakatRate,
        breakdown: calculationData.breakdown,
        assetsIncluded: calculationData.assetsIncluded,
        liabilitiesIncluded: calculationData.liabilitiesIncluded
      };

      if (existingCalculation) {
        await tx.zakatCalculation.update({
          where: { id: existingCalculation.id },
          data
        });
      } else {
        await tx.zakatCalculation.create({ data });
      }
    }
  }

  /**
   * Private: Import single payment
   */
  private async importPayment(tx: any, userId: string, paymentData: any, options: any) {
    // Skip duplicates based on calculation ID and payment date
    const existingPayment = await tx.zakatPayment.findFirst({
      where: {
        userId,
        calculationId: paymentData.calculationId,
        paymentDate: paymentData.paymentDate
      }
    });

    if (existingPayment && options.skipDuplicates) {
      return;
    }

    if (!existingPayment || options.overwriteExisting) {
      const data = {
        userId,
        calculationId: paymentData.calculationId,
        paymentDate: paymentData.paymentDate,
        amount: paymentData.amount,
        currency: paymentData.currency,
        recipients: paymentData.recipients,
        paymentMethod: paymentData.paymentMethod,
        receiptNumber: paymentData.receiptNumber,
        islamicYear: paymentData.islamicYear,
        notes: paymentData.notes,
        status: paymentData.status,
        verificationDetails: paymentData.verificationDetails
      };

      if (existingPayment) {
        await tx.zakatPayment.update({
          where: { id: existingPayment.id },
          data
        });
      } else {
        await tx.zakatPayment.create({ data });
      }
    }
  }

  /**
   * Private: Import single snapshot
   */
  private async importSnapshot(tx: any, userId: string, snapshotData: any, options: any) {
    // Skip duplicates based on name and date
    const existingSnapshot = await tx.snapshot.findFirst({
      where: {
        userId,
        name: snapshotData.name,
        snapshotDate: snapshotData.snapshotDate
      }
    });

    if (existingSnapshot && options.skipDuplicates) {
      return;
    }

    if (!existingSnapshot || options.overwriteExisting) {
      const data = {
        userId,
        name: snapshotData.name,
        description: snapshotData.description,
        snapshotDate: snapshotData.snapshotDate,
        islamicYear: snapshotData.islamicYear,
        totalAssets: snapshotData.totalAssets,
        totalLiabilities: snapshotData.totalLiabilities,
        netWorth: snapshotData.netWorth,
        assetsCount: snapshotData.assetsCount,
        liabilitiesCount: snapshotData.liabilitiesCount,
        tags: snapshotData.tags,
        metadata: snapshotData.metadata,
        assetsData: snapshotData.assetsData,
        liabilitiesData: snapshotData.liabilitiesData
      };

      if (existingSnapshot) {
        await tx.snapshot.update({
          where: { id: existingSnapshot.id },
          data
        });
      } else {
        await tx.snapshot.create({ data });
      }
    }
  }
}