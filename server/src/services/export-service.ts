import { PaymentService } from './payment-service';
import { AnalyticsService, AnalyticsData, CategoryBreakdown } from './analytics-service';
import { DecryptedPaymentData } from '../models/payment';

// Define reminder interface for export
export interface DecryptedReminderData {
  id: string;
  userId: string;
  eventType: string;
  triggerDate: Date;
  title: string;
  decryptedMessage: string;
  priority: string;
  status: string;
  relatedSnapshotId?: string;
  metadata?: Record<string, unknown>;
  acknowledgedAt?: Date;
  createdAt: Date;
}

export interface ExportOptions {
  userId: string;
  format: 'csv' | 'json' | 'pdf';
  startDate?: Date;
  endDate?: Date;
  includeAnalytics?: boolean;
  includeReminders?: boolean;
}

export interface ExportData {
  payments: DecryptedPaymentData[];
  analytics?: AnalyticsData;
  reminders?: DecryptedReminderData[];
  exportDate: Date;
  dateRange: {
    startDate?: Date;
    endDate?: Date;
  };
}

export class ExportService {
  /**
   * Generates a CSV export of payment data
   */
  static async generateCSV(optionsOrUserId: ExportOptions | string, maybeStartDate?: Date, maybeEndDate?: Date, includeNotes: boolean = false): Promise<string> {
    let options: ExportOptions;
    if (typeof optionsOrUserId === 'string') {
      options = {
        userId: optionsOrUserId,
        format: 'csv',
        startDate: maybeStartDate,
        endDate: maybeEndDate,
        includeAnalytics: false,
        includeReminders: false,
      };
    } else {
      options = optionsOrUserId;
    }

    const data = await this.collectExportData(options);

    const headers = [
      'Payment Date',
      'Amount',
      'Recipient Name',
      'Recipient Type',
      'Recipient Category',
      'Payment Method',
      'Currency',
      'Notes',
      'Receipt Reference',
      'Status',
      'Created At'
    ];

    const rows = data.payments.map(payment => [
      payment.paymentDate.toISOString().split('T')[0], // Date only
      payment.decryptedAmount,
      payment.decryptedRecipientName,
      payment.recipientType,
      payment.recipientCategory,
      payment.paymentMethod,
      payment.currency || 'USD',
      payment.decryptedNotes || '',
      payment.decryptedReceiptReference || '',
      payment.status,
      payment.createdAt.toISOString()
    ]);

    // Add header row
    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    return csvContent;
  }

  /**
   * Generates a JSON export of payment data
   */
  static async generateJSON(options: ExportOptions): Promise<string> {
    const data = await this.collectExportData(options);
    return JSON.stringify(data, null, 2);
  }

  /**
   * Generates a PDF export (placeholder - would require PDF library)
   */
  static async generatePDF(options: ExportOptions): Promise<Buffer> {
    // This is a placeholder implementation
    // In a real implementation, you would use a PDF library like pdfkit or puppeteer
    const data = await this.collectExportData(options);
    const jsonData = JSON.stringify(data, null, 2);

    // For now, return JSON as buffer (would be replaced with actual PDF generation)
    return Buffer.from(jsonData);
  }

  /**
   * Collects all data needed for export
   */
  private static async collectExportData(options: ExportOptions): Promise<ExportData> {
    const { userId, startDate, endDate, includeAnalytics, includeReminders } = options;

    // Get payments
    const payments = await PaymentService.getPaymentsByUserId(userId, {
      startDate,
      endDate,
      limit: 10000, // Large limit for export
    });

    const exportData: ExportData = {
      payments,
      exportDate: new Date(),
      dateRange: {
        startDate,
        endDate,
      },
    };

    // Include analytics if requested
    if (includeAnalytics && startDate && endDate) {
      exportData.analytics = await AnalyticsService.calculateTrends(userId, startDate, endDate);
    }

    // Include reminders if requested
    if (includeReminders) {
      // Note: ReminderService would need to be imported and used here
      // For now, we'll leave this as a placeholder
      exportData.reminders = [];
    }

    return exportData;
  }

  /**
   * Validates export options
   */
  static validateExportOptions(options: ExportOptions): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!options.userId) {
      errors.push('User ID is required');
    }

    if (!['csv', 'json', 'pdf'].includes(options.format)) {
      errors.push('Format must be one of: csv, json, pdf');
    }

    if (options.startDate && options.endDate && options.startDate > options.endDate) {
      errors.push('Start date cannot be after end date');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Gets export metadata (file size estimate, record count, etc.)
   */
  static async getExportMetadata(options: ExportOptions): Promise<{
    recordCount: number;
    estimatedFileSize: number;
    format: string;
  }> {
    const validation = this.validateExportOptions(options);
    if (!validation.isValid) {
      throw new Error(`Invalid export options: ${validation.errors.join(', ')}`);
    }

    // Get payment count
    const payments = await PaymentService.getPaymentsByUserId(options.userId, {
      startDate: options.startDate,
      endDate: options.endDate,
      limit: 10000,
    });

    const recordCount = payments.length;

    // Estimate file size based on format and record count
    let estimatedFileSize: number;
    switch (options.format) {
      case 'csv':
        // Rough estimate: 200 bytes per record for CSV
        estimatedFileSize = recordCount * 200;
        break;
      case 'json':
        // Rough estimate: 500 bytes per record for JSON
        estimatedFileSize = recordCount * 500;
        break;
      case 'pdf':
        // Rough estimate: 1000 bytes per record for PDF
        estimatedFileSize = recordCount * 1000;
        break;
      default:
        estimatedFileSize = 0;
    }

    return {
      recordCount,
      estimatedFileSize,
      format: options.format,
    };
  }

  /**
   * Exports data in the requested format
   */
  static async exportData(options: ExportOptions): Promise<string | Buffer> {
    const validation = this.validateExportOptions(options);
    if (!validation.isValid) {
      throw new Error(`Invalid export options: ${validation.errors.join(', ')}`);
    }

    switch (options.format) {
      case 'csv':
        return await this.generateCSV(options);
      case 'json':
        return await this.generateJSON(options);
      case 'pdf':
        return await this.generatePDF(options);
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }
  }

  /**
   * Generates a summary report for export
   */
  static async generateSummaryReport(options: ExportOptions): Promise<string> {
    const metadata = await this.getExportMetadata(options);
    const data = await this.collectExportData(options);

    let report = `Zakat Payment Export Summary\n`;
    report += `==============================\n\n`;
    report += `Export Date: ${data.exportDate.toISOString()}\n`;
    report += `Format: ${options.format.toUpperCase()}\n`;
    report += `Record Count: ${metadata.recordCount}\n`;
    report += `Estimated File Size: ${this.formatFileSize(metadata.estimatedFileSize)}\n`;

    if (data.dateRange.startDate && data.dateRange.endDate) {
      report += `Date Range: ${data.dateRange.startDate.toISOString().split('T')[0]} to ${data.dateRange.endDate.toISOString().split('T')[0]}\n`;
    }

    if (data.analytics) {
      report += `\nAnalytics Summary:\n`;
      report += `- Total Amount: $${data.analytics.totalAmount.toFixed(2)}\n`;
      report += `- Total Payments: ${data.analytics.totalPayments}\n`;
      report += `- Average Monthly Amount: $${data.analytics.averageMonthlyAmount.toFixed(2)}\n`;
      report += `- Growth Rate: ${data.analytics.growthRate.toFixed(2)}%\n`;
      report += `- Consistency Score: ${data.analytics.consistencyScore}/100\n`;
    }

    report += `\nPayment Breakdown by Category:\n`;
    if (data.analytics?.categoryBreakdown) {
      data.analytics.categoryBreakdown.forEach((category: CategoryBreakdown) => {
        report += `- ${category.category}: $${category.amount.toFixed(2)} (${category.percentage.toFixed(1)}%)\n`;
      });
    }

    return report;
  }

  /**
   * Formats file size in human readable format
   */
  private static formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  /**
   * Sanitizes data for export (removes sensitive information if needed)
   */
  static sanitizeExportData(data: ExportData, privacyLevel: 'full' | 'partial' | 'minimal' = 'full'): ExportData {
    if (privacyLevel === 'full') {
      return data;
    }

    const sanitized = { ...data };

    if (privacyLevel === 'partial') {
      // Remove detailed notes but keep basic information
      sanitized.payments = data.payments.map(payment => ({
        ...payment,
        decryptedNotes: payment.decryptedNotes ? '[REDACTED FOR PRIVACY]' : payment.decryptedNotes,
        decryptedReceiptReference: payment.decryptedReceiptReference ? '[REDACTED]' : payment.decryptedReceiptReference,
      }));
    } else if (privacyLevel === 'minimal') {
      // Only keep aggregated data
      sanitized.payments = [];
      // Keep analytics if available
    }

    return sanitized;
  }
}

// Backwards-compatible wrapper functions used by tests which call positional args
export async function generateCSV(userId: string, startDate?: Date, endDate?: Date, includeNotes: boolean = false) {
  if (!userId) throw new Error('Invalid user ID');
  if (startDate && endDate && startDate > endDate) throw new Error('Invalid date range');

  const options = {
    userId,
    format: 'csv' as const,
    startDate,
    endDate,
    includeAnalytics: false,
    includeReminders: false,
  };

  return ExportService.generateCSV(options);
}