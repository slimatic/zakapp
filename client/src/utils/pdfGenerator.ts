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

/**
 * PDF Generator Utility
 * Creates professional PDF reports for annual Zakat summaries
 * Uses jsPDF and jspdf-autotable for document generation
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import type { YearlySnapshot, PaymentRecord } from '@zakapp/shared/types/tracking';
import { formatCategoryName } from './chartFormatter';
import { formatDualCalendar } from './calendarConverter';

/**
 * PDF generation options
 */
export interface PDFOptions {
  includePayments?: boolean;
  includeAssetBreakdown?: boolean;
  includeComparison?: boolean;
  watermark?: string;
}

/**
 * Generates a comprehensive annual Zakat summary PDF
 * @param snapshot - Yearly snapshot data
 * @param payments - Payment records for the year
 * @param options - PDF generation options
 * @returns jsPDF instance ready for download or preview
 */
export function generateAnnualSummaryPDF(
  snapshot: YearlySnapshot,
  payments: PaymentRecord[],
  options: PDFOptions = {}
): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 20;

  // Title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Annual Zakat Summary', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 10;

  // Year and Date
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  const yearText = `Year ${snapshot.gregorianYear} (${snapshot.hijriYear} AH)`;
  doc.text(yearText, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 7;

  const dateText = formatDualCalendar(snapshot.calculationDate);
  doc.setFontSize(10);
  doc.text(dateText, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 15;

  // Wealth Summary Section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Wealth Summary', 14, yPosition);
  yPosition += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  const wealthData = [
    ['Total Wealth', formatCurrency(snapshot.totalWealth)],
    ['Total Liabilities', formatCurrency(snapshot.totalLiabilities)],
    ['Zakatable Wealth', formatCurrency(snapshot.zakatableWealth)],
    ['Nisab Threshold', formatCurrency(snapshot.nisabThreshold)],
    ['Methodology Used', snapshot.methodologyUsed]
  ];

  autoTable(doc, {
    startY: yPosition,
    head: [['Item', 'Value']],
    body: wealthData,
    theme: 'grid',
    headStyles: { fillColor: [34, 197, 94], textColor: 255 },
    margin: { left: 14, right: 14 },
    styles: { fontSize: 10 }
  });

  yPosition = (doc as any).lastAutoTable.finalY + 10;

  // Zakat Calculation Section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Zakat Calculation', 14, yPosition);
  yPosition += 8;

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const outstanding = snapshot.zakatAmount - totalPaid;
  const completionPercentage = snapshot.zakatAmount > 0 
    ? ((totalPaid / snapshot.zakatAmount) * 100).toFixed(1) 
    : '0.0';

  const zakatData = [
    ['Zakat Due', formatCurrency(snapshot.zakatAmount)],
    ['Total Paid', formatCurrency(totalPaid)],
    ['Outstanding', formatCurrency(outstanding)],
    ['Completion', `${completionPercentage}%`]
  ];

  autoTable(doc, {
    startY: yPosition,
    head: [['Item', 'Amount']],
    body: zakatData,
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246], textColor: 255 },
    margin: { left: 14, right: 14 },
    styles: { fontSize: 10 }
  });

  yPosition = (doc as any).lastAutoTable.finalY + 10;

  // Payment Records Section (if included)
  if (options.includePayments && payments.length > 0) {
    // Check if we need a new page
    if (yPosition > pageHeight - 60) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Payment Records', 14, yPosition);
    yPosition += 8;

    const paymentData = payments.map(payment => [
      format(new Date(payment.paymentDate), 'MMM d, yyyy'),
      formatCategoryName(payment.recipientType),
      payment.recipientName || 'Anonymous',
      formatCurrency(payment.amount),
      payment.notes || '-'
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['Date', 'Category', 'Recipient', 'Amount', 'Notes']],
      body: paymentData,
      theme: 'striped',
      headStyles: { fillColor: [139, 92, 246], textColor: 255 },
      margin: { left: 14, right: 14 },
      styles: { fontSize: 9 },
      columnStyles: {
        4: { cellWidth: 'auto' }
      }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 10;
  }

  // Asset Breakdown Section (if included)
  if (options.includeAssetBreakdown && snapshot.assetBreakdown) {
    // Check if we need a new page
    if (yPosition > pageHeight - 60) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Asset Breakdown', 14, yPosition);
    yPosition += 8;

    const assetData = Object.entries(snapshot.assetBreakdown).map(([type, value]) => [
      formatAssetType(type),
      formatCurrency(value as number),
      `${(((value as number) / snapshot.totalWealth) * 100).toFixed(1)}%`
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['Asset Type', 'Value', 'Percentage']],
      body: assetData,
      theme: 'grid',
      headStyles: { fillColor: [20, 184, 166], textColor: 255 },
      margin: { left: 14, right: 14 },
      styles: { fontSize: 10 }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 10;
  }

  // User Notes Section (if present)
  if (snapshot.userNotes) {
    // Check if we need a new page
    if (yPosition > pageHeight - 40) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Notes', 14, yPosition);
    yPosition += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const splitNotes = doc.splitTextToSize(snapshot.userNotes, pageWidth - 28);
    doc.text(splitNotes, 14, yPosition);
    yPosition += splitNotes.length * 5 + 10;
  }

  // Footer
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128);
    doc.text(
      `Generated on ${format(new Date(), 'MMMM d, yyyy')} • ZakApp • Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  // Watermark (if provided)
  if (options.watermark) {
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(50);
      doc.setTextColor(200, 200, 200);
      doc.text(options.watermark, pageWidth / 2, pageHeight / 2, {
        align: 'center',
        angle: 45
      });
    }
  }

  return doc;
}

/**
 * Generates a payment receipt PDF
 * @param payment - Payment record
 * @param snapshot - Related yearly snapshot
 * @returns jsPDF instance
 */
export function generatePaymentReceiptPDF(
  payment: PaymentRecord,
  snapshot: YearlySnapshot
): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPosition = 20;

  // Title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Zakat Payment Receipt', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 15;

  // Receipt Details
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');

  const details = [
    ['Receipt ID', payment.receiptReference || payment.id.slice(0, 8)],
    ['Payment Date', formatDualCalendar(payment.paymentDate)],
    ['Amount', formatCurrency(payment.amount)],
    ['Category', formatCategoryName(payment.recipientType)],
    ['Recipient', payment.recipientName || 'Anonymous'],
    ['Payment Method', payment.paymentMethod || 'Unknown'],
    ['Year', `${snapshot.gregorianYear} (${snapshot.hijriYear} AH)`]
  ];

  details.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(`${label}:`, 14, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(value, 60, yPosition);
    yPosition += 8;
  });

  if (payment.notes) {
    yPosition += 5;
    doc.setFont('helvetica', 'bold');
    doc.text('Notes:', 14, yPosition);
    yPosition += 6;
    doc.setFont('helvetica', 'normal');
    const splitNotes = doc.splitTextToSize(payment.notes, pageWidth - 28);
    doc.text(splitNotes, 14, yPosition);
  }

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(128);
  doc.text(
    `Generated by ZakApp on ${format(new Date(), 'MMMM d, yyyy')}`,
    pageWidth / 2,
    doc.internal.pageSize.getHeight() - 10,
    { align: 'center' }
  );

  return doc;
}

/**
 * Generates a comparison report PDF for multiple years
 * @param snapshots - Array of yearly snapshots to compare
 * @returns jsPDF instance
 */
export function generateComparisonReportPDF(snapshots: YearlySnapshot[]): jsPDF {
  const doc = new jsPDF('landscape');
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPosition = 20;

  // Sort snapshots by year
  const sortedSnapshots = [...snapshots].sort((a, b) => a.gregorianYear - b.gregorianYear);

  // Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Multi-Year Zakat Comparison', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const yearRange = `${sortedSnapshots[0].gregorianYear} - ${sortedSnapshots[sortedSnapshots.length - 1].gregorianYear}`;
  doc.text(yearRange, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 15;

  // Comparison Table
  const headers = ['Metric', ...sortedSnapshots.map(s => `${s.gregorianYear}`)];
  
  const metrics = [
    ['Total Wealth', ...sortedSnapshots.map(s => formatCurrency(s.totalWealth))],
    ['Zakatable Wealth', ...sortedSnapshots.map(s => formatCurrency(s.zakatableWealth))],
    ['Zakat Amount', ...sortedSnapshots.map(s => formatCurrency(s.zakatAmount))],
    ['Nisab Threshold', ...sortedSnapshots.map(s => formatCurrency(s.nisabThreshold))],
    ['Methodology', ...sortedSnapshots.map(s => s.methodologyUsed)]
  ];

  autoTable(doc, {
    startY: yPosition,
    head: [headers],
    body: metrics,
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246], textColor: 255 },
    styles: { fontSize: 9, halign: 'center' },
    columnStyles: {
      0: { halign: 'left', fontStyle: 'bold' }
    }
  });

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(128);
  doc.text(
    `Generated by ZakApp on ${format(new Date(), 'MMMM d, yyyy')}`,
    pageWidth / 2,
    doc.internal.pageSize.getHeight() - 10,
    { align: 'center' }
  );

  return doc;
}

/**
 * Downloads a PDF document
 * @param doc - jsPDF instance
 * @param filename - Desired filename (without extension)
 */
export function downloadPDF(doc: jsPDF, filename: string): void {
  doc.save(`${filename}.pdf`);
}

/**
 * Opens PDF in new browser tab for preview
 * @param doc - jsPDF instance
 */
export function previewPDF(doc: jsPDF): void {
  const blob = doc.output('blob');
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
  
  // Clean up after a delay
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Formats currency value with proper separators
 * @param amount - Numeric amount
 * @param currency - Currency symbol (default: '$')
 * @returns Formatted string like "$1,234.56"
 */
function formatCurrency(amount: number, currency: string = '$'): string {
  return `${currency}${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

/**
 * Formats asset type name for display
 * @param type - Asset type identifier
 * @returns Formatted name
 */
function formatAssetType(type: string): string {
  const typeNames: Record<string, string> = {
    cash: 'Cash & Bank',
    gold: 'Gold',
    silver: 'Silver',
    crypto: 'Cryptocurrency',
    business: 'Business Assets',
    investment: 'Investments',
    real_estate: 'Real Estate',
    other: 'Other Assets'
  };
  return typeNames[type] || type;
}
