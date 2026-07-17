/**
 * Copyright (c) 2024 ZakApp Contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 */

/**
 * summaryPdfExport.ts
 * PDF generation for the Annual Summary page using jsPDF + jspdf-autotable.
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface SummaryPDFPayload {
  year: number;
  totalAssets: number;
  totalLiabilities: number;
  netWealth: number;
  totalZakatDue: number;
  totalZakatPaid: number;
  outstandingZakat: number;
  complianceRate: number;
  nisabStatus: string;
  currency: string;
  monthlyData: { month: string; due: number; paid: number }[];
  assetCount: number;
  liabilityCount: number;
  paymentCount: number;
}

function fmtCurrency(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `$${amount.toLocaleString()}`;
  }
}

export function downloadSummaryPDF(payload: SummaryPDFPayload): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  // Title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(`${payload.year} Zakat Summary`, pageWidth / 2, y, { align: 'center' });
  y += 10;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated on ${new Date().toLocaleDateString()}`, pageWidth / 2, y, { align: 'center' });
  y += 14;

  // Overview table
  autoTable(doc, {
    startY: y,
    head: [['Metric', 'Value']],
    body: [
      ['Total Assets', fmtCurrency(payload.totalAssets, payload.currency)],
      ['Total Liabilities', fmtCurrency(payload.totalLiabilities, payload.currency)],
      ['Net Wealth', fmtCurrency(payload.netWealth, payload.currency)],
      ['Zakat Due', fmtCurrency(payload.totalZakatDue, payload.currency)],
      ['Zakat Paid', fmtCurrency(payload.totalZakatPaid, payload.currency)],
      ['Outstanding', fmtCurrency(payload.outstandingZakat, payload.currency)],
      ['Compliance Rate', `${payload.complianceRate.toFixed(1)}%`],
      ['Nisab Status', payload.nisabStatus],
    ],
    theme: 'grid',
    headStyles: { fillColor: [15, 118, 110], textColor: 255 },
    margin: { left: 14, right: 14 },
    styles: { fontSize: 10 },
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // Monthly breakdown table
  if (payload.monthlyData.some((d) => d.due > 0 || d.paid > 0)) {
    autoTable(doc, {
      startY: y,
      head: [['Month', 'Zakat Due', 'Zakat Paid']],
      body: payload.monthlyData.map((d) => [
        d.month,
        fmtCurrency(d.due, payload.currency),
        fmtCurrency(d.paid, payload.currency),
      ]),
      theme: 'grid',
      headStyles: { fillColor: [100, 116, 139], textColor: 255 },
      margin: { left: 14, right: 14 },
      styles: { fontSize: 10 },
    });
    y = (doc as any).lastAutoTable.finalY + 10;
  }

  // Counts
  autoTable(doc, {
    startY: y,
    head: [['Item', 'Count']],
    body: [
      ['Assets', String(payload.assetCount)],
      ['Liabilities', String(payload.liabilityCount)],
      ['Payments', String(payload.paymentCount)],
    ],
    theme: 'grid',
    headStyles: { fillColor: [34, 197, 94], textColor: 255 },
    margin: { left: 14, right: 14 },
    styles: { fontSize: 10 },
  });

  doc.save(`zakapp-summary-${payload.year}.pdf`);
}
