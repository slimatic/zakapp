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


import jsPDF from 'jspdf';
import { PDF_THEME, TABLE_STYLES, hex } from './pdfTheme';
import autoTable from 'jspdf-autotable';
import { NisabYearRecord } from '../types/nisabYearRecord';
import { PaymentRecord } from '@zakapp/shared/types/tracking';
import { formatCurrency as canonicalCurrency } from './formatters';
// import { formatCurrency } from './formatters'; // Avoid circular dependency if simple

// Simple local formatter to avoid complex imports if needed, or import standard one
const formatCurrency = (amount: number, currency = 'USD') =>
  canonicalCurrency(amount, currency);

export type StatementRows = {
  summaryRows: [string, string][];
  financialRows: [string, string][];
};

/**
 * Every money row of the statement reads a figure the record's own engine
 * stored. The statement is a printout of the record — recomputing totals from
 * the raw asset and liability lists printed a second recipe beside the stored
 * one: the raw list includes inactive balances the engine excludes, so its
 * "Total Liabilities" and "Net Zakatable Wealth" rows could contradict the
 * stored Zakatable Wealth and Zakat Due rows on the same page.
 *
 * A stored figure may be unreadable (a legacy record can carry a
 * non-numeric string). A missing row is honest, a confident zero is not —
 * the same rule the Nisab Threshold row has always followed.
 */
export function hawlStatementRows(record: NisabYearRecord, username: string, currency: string): StatementRows {
  // Number('  ') is 0, so a blank must be caught on the trimmed text, before
  // any conversion — a whitespace-only stored value is not a readable zero.
  const readableMoney = (raw: unknown): number | undefined => {
    const text = raw === null || raw === undefined ? '' : String(raw);
    const value = text.trim() === '' ? NaN : Number(text);
    return Number.isFinite(value) ? value : undefined;
  };

  const threshold = readableMoney(
    record.nisabThresholdAtStart ?? record.nisabThreshold ?? record.initialNisabThreshold
  );
  const totalWealth = readableMoney(record.totalWealth);
  const netZakatableWealth = readableMoney(record.zakatableWealth);
  const zakatDue = readableMoney(record.zakatAmount);
  // Some creation paths store a liabilities total on the record (the
  // onboarding wizard and import/restore; the modal create path does not).
  // When the record carries one it is the record's OWN stored figure — print
  // it under the same omit-if-unreadable rule; it is never recomputed
  // against the raw lists, and a record without one carries no row.
  const recordedLiabilities = readableMoney(record.totalLiabilities);

  const summaryRows: [string, string][] = [
    ['Beneficiary', username],
    ['Hawl Period',
      `${new Date(record.hawlStartDate!).toLocaleDateString()} - ${record.hawlCompletionDate
        ? new Date(record.hawlCompletionDate).toLocaleDateString()
        : 'Ongoing'}`],
    ['Status', record.status || 'DRAFT'],
  ];
  if (threshold !== undefined) {
    summaryRows.push(['Nisab Threshold', formatCurrency(threshold, currency)]);
  }

  const financialRows: [string, string][] = [];
  if (totalWealth !== undefined) {
    financialRows.push(['Total Wealth', formatCurrency(totalWealth, currency)]);
  }
  if (netZakatableWealth !== undefined) {
    financialRows.push(['Net Zakatable Wealth', formatCurrency(netZakatableWealth, currency)]);
  }
  if (recordedLiabilities !== undefined) {
    financialRows.push(['Total Liabilities (recorded)', formatCurrency(recordedLiabilities, currency)]);
  }
  if (zakatDue !== undefined) {
    financialRows.push(['Zakat Due (2.5%)', formatCurrency(zakatDue, currency)]);
  }

  return { summaryRows, financialRows };
}

export class ReportGenerator {
    private doc: jsPDF;
    private readonly MARGIN = 15;
    // Brand colour now comes from the shared PDF theme (Nur secondary),
    // so reports agree with the app and with each other. Was teal-700 #0f766e.
    private readonly BRAND_COLOR = hex(PDF_THEME.brand);
    private currency: string;

    constructor(currency: string = 'USD') {
        this.doc = new jsPDF();
        this.currency = currency;
    }

    private addHeader(title: string, subtitle?: string) {
        const doc = this.doc;
        const pageWidth = doc.internal.pageSize.width;

        // Brand Name
        doc.setFontSize(22);
        doc.setTextColor(this.BRAND_COLOR);
        doc.setFont('helvetica', 'bold');
        doc.text('ZakApp', this.MARGIN, 20);

        // Document Title
        doc.setFontSize(16);
        doc.setTextColor(...PDF_THEME.ink);
        doc.setFont('helvetica', 'normal');
        const titleWidth = doc.getTextWidth(title);
        doc.text(title, pageWidth - this.MARGIN - titleWidth, 20);

        // Line
        doc.setDrawColor(...PDF_THEME.border);
        doc.line(this.MARGIN, 25, pageWidth - this.MARGIN, 25);

        // Subtitle / Date
        if (subtitle) {
            doc.setFontSize(10);
            doc.setTextColor(...PDF_THEME.inkSoft);
            doc.text(subtitle, this.MARGIN, 32);
        }
    }

    private addFooter() {
        const doc = this.doc;
        const pageHeight = doc.internal.pageSize.height;
        const pageWidth = doc.internal.pageSize.width;

        doc.setFontSize(8);
        doc.setTextColor(...PDF_THEME.inkSoft);
        const text = `Generated by ZakApp on ${new Date().toLocaleDateString()} - Local-First Privacy`;
        doc.text(text, this.MARGIN, pageHeight - 10);

        // Page Numbers
        const pageCount = doc.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.text(`Page ${i} of ${pageCount}`, pageWidth - this.MARGIN - 20, pageHeight - 10);
        }
    }

    public generateHawlStatement(record: NisabYearRecord, username: string = 'User') {
        const doc = this.doc;

        // Header
        const hijri = record.hijriYear ? `${record.hijriYear} AH` : 'Current Year';
        this.addHeader('Zakat Hawl Statement', `Record ID: ${record.id.slice(0, 8)}... | ${hijri}`);

        // Summary Section
        let yPos = 45;
        doc.setFontSize(14);
        doc.setTextColor(...PDF_THEME.ink);
        doc.text('Summary', this.MARGIN, yPos);
        yPos += 10;

        const { summaryRows, financialRows } = hawlStatementRows(record, username, this.currency);

        autoTable(doc, {
            startY: yPos,
            head: [],
            body: summaryRows,
            theme: 'plain',
            styles: { fontSize: 10, cellPadding: 2 },
            columnStyles: { 0: { fontStyle: 'bold', cellWidth: 45 } },
            // Right-align ONLY the monetary rows. A blanket right-align on this
            // column also pushed the name, the hawl dates and the status to the
            // right, which reads wrong for a label/value list.
            didParseCell: (data) => {
                const isMoney = /^[^0-9]*[0-9][0-9,]*\.[0-9]{2}$/.test(String(data.cell.raw ?? ''));
                if (data.section === 'body' && data.column.index === 1 && isMoney) {
                    data.cell.styles.halign = 'right';
                }
            },
            margin: { left: this.MARGIN }
        });

        // Financials Section
        const financialsY = (doc as any).lastAutoTable.finalY + 15;
        doc.setFontSize(14);
        doc.text('Calculation Details', this.MARGIN, financialsY);

        autoTable(doc, {
            startY: financialsY + 5,
            head: [['Item', 'Amount']],
            body: financialRows,
            ...TABLE_STYLES,
            theme: 'striped',
            columnStyles: { 0: { cellWidth: 90 }, 1: { halign: 'right' } },
            margin: { left: this.MARGIN }
        });

        // Disclaimer
        const disclaimerY = (doc as any).lastAutoTable.finalY + 20;
        doc.setFontSize(8);
        doc.setTextColor(...PDF_THEME.inkSoft);
        doc.text('This document is a record of your Zakat calculation based on the assets provided.', this.MARGIN, disclaimerY);
        doc.text('Verifying the accuracy of assets and market values is the user\'s responsibility.', this.MARGIN, disclaimerY + 5);

        this.addFooter();
        doc.save(`ZakApp_Hawl_Statement_${hijri}.pdf`);
    }

    public generatePaymentSummary(payments: PaymentRecord[], year?: number) {
        const doc = this.doc;
        const title = year ? `Zakat Payments - ${year}` : 'Zakat Payment History';
        this.addHeader(title, `Total Records: ${payments.length}`);

        const tableData = payments.map(p => [
            new Date(p.paymentDate).toLocaleDateString(),
            p.recipientName || 'Unspecified',
            p.recipientCategory || 'General',
            formatCurrency(Number(p.amount), this.currency),
            p.notes || '-'
        ]);

        // Calculate Total
        const total = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
        tableData.push(['', '', 'TOTAL', formatCurrency(total, this.currency), '']);
        autoTable(doc, {
            startY: 40,
            head: [['Date', 'Recipient', 'Category', 'Amount', 'Notes']],
            body: tableData,
            ...TABLE_STYLES,
            columnStyles: { 3: { halign: 'right', fontStyle: 'bold' } },
            margin: { left: this.MARGIN },
            didParseCell: (data) => {
                // Bold the total row
                if (data.row.index === tableData.length - 1) {
                    data.cell.styles.fontStyle = 'bold';
                    data.cell.styles.fillColor = PDF_THEME.surface2;
                }
            }
        });

        this.addFooter();
        const filename = year ? `ZakApp_Payments_${year}.pdf` : 'ZakApp_Payments_All.pdf';
        doc.save(filename);
    }
}
