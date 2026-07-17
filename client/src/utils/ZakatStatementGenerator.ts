/**
 * Copyright (c) 2024 ZakApp Contributors
 * GNU Affero General Public License v3.0+
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';
import {
  ASSET_TYPE_ATTRIBUTIONS,
  LIABILITY_ATTRIBUTIONS,
  METHODOLOGY_ATTRIBUTIONS,
  NISAB_ATTRIBUTIONS,
  ZAKAT_STATEMENT_DISCLAIMER,
} from '../data/scholarAttributions';
import { Asset, AssetType, Liability } from '../types';
import { getMethodology, MethodologyName } from '../core/calculations/methodology';
import { calculateWealth } from '../core/calculations/wealthCalculator';
import { NisabYearRecord } from '../types/nisabYearRecord';
import { formatHijriDate, gregorianToHijri } from './calendarConverter';

const BRAND_COLOR: [number, number, number] = [15, 118, 110]; // teal-700 as RGB
const BRAND_HEX = '#0f766e';

function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

function safeNumber(v: string | number | null | undefined): number {
  if (v === null || v === undefined) return 0;
  const n = typeof v === 'string' ? parseFloat(v) : v;
  return isNaN(n) ? 0 : n;
}

interface ZakatStatementData {
  record: NisabYearRecord;
  assets: Asset[];
  liabilities: Liability[];
  payments?: Array<{
    id: string;
    amount: number | string;
    paymentDate: string;
    recipientName?: string;
    recipientCategory?: string;
    notes?: string;
    method?: string;
  }>;
  userName?: string;
  methodologyName?: MethodologyName;
  currency?: string;
}

export class ZakatStatementGenerator {
  private doc: jsPDF;
  private readonly MARGIN = 15;

  constructor() {
    this.doc = new jsPDF();
  }

  /** Generate the complete Zakat Statement PDF for a Nisab Year Record */
  public async generate(data: ZakatStatementData) {
    const { record, assets, liabilities, payments = [], userName, methodologyName = 'STANDARD', currency = record.currency || 'USD' } = data;

    const doc = this.doc;
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    // ── Header ──────────────────────────────────────────────────────
    doc.setFillColor(BRAND_COLOR[0], BRAND_COLOR[1], BRAND_COLOR[2]);
    doc.rect(0, 0, pageWidth, 35, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('ZakApp', this.MARGIN, 22);

    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text('Official Zakat Statement', pageWidth - this.MARGIN, 22, { align: 'right' });

    // Subtitle
    doc.setFontSize(10);
    doc.setTextColor(100);
    const startHijri = record.hawlStartDate ? gregorianToHijri(new Date(record.hawlStartDate)) : null;
    const endHijri = record.hawlCompletionDate ? gregorianToHijri(new Date(record.hawlCompletionDate)) : null;
    const periodLabel = record.hijriYear ? `Hawl ${record.hijriYear} H` : 'Hawl Period';
    doc.text(`Generated: ${new Date().toLocaleDateString()}  |  Record: ${record.id.slice(0, 12)}  |  ${periodLabel}`, this.MARGIN, 42);

    // ── Hawl Summary Box ────────────────────────────────────────────
    let y = 50;
    doc.setDrawColor(BRAND_HEX);
    doc.setLineWidth(0.5);
    doc.roundedRect(this.MARGIN, y, pageWidth - this.MARGIN * 2, 42, 3, 3, 'D');

    doc.setFontSize(12);
    doc.setTextColor(BRAND_COLOR[0], BRAND_COLOR[1], BRAND_COLOR[2]);
    doc.setFont('helvetica', 'bold');
    doc.text('Hawl Period Summary', this.MARGIN + 4, y + 8);

    doc.setFontSize(9);
    doc.setTextColor(50);
    doc.setFont('helvetica', 'normal');
    const startDate = record.hawlStartDate ? new Date(record.hawlStartDate).toLocaleDateString() : '—';
    const endDate = record.hawlCompletionDate ? new Date(record.hawlCompletionDate).toLocaleDateString() : '—';
    const statusLabel = record.status === 'FINALIZED' ? 'Finalized ✓' : record.status === 'DRAFT' ? 'In Progress' : 'Unlocked for Editing';

    doc.text(`Beneficiary: ${userName || 'User'}`, this.MARGIN + 4, y + 16);
    doc.text(`Status: ${statusLabel}`, pageWidth - this.MARGIN - 4, y + 16, { align: 'right' });

    doc.text(`Gregorian: ${startDate} → ${endDate}`, this.MARGIN + 4, y + 23);
    if (startHijri) {
      doc.text(`Hijri: ${formatHijriDate(startHijri)} →${endHijri ? ' ' + formatHijriDate(endHijri) : ''}`, this.MARGIN + 4, y + 30);
    }

    // ── Methodology Section ───────────────────────────────────────
    y += 50;
    doc.setFontSize(13);
    doc.setTextColor(BRAND_COLOR[0], BRAND_COLOR[1], BRAND_COLOR[2]);
    doc.setFont('helvetica', 'bold');
    doc.text('Methodology', this.MARGIN, y);

    const methodologyKey = methodologyName.toUpperCase();
    const methodAttribution = METHODOLOGY_ATTRIBUTIONS[methodologyKey] || METHODOLOGY_ATTRIBUTIONS['STANDARD'];
    const methodologyConfig = getMethodology(methodologyKey);

    doc.setFontSize(9);
    doc.setTextColor(60);
    doc.setFont('helvetica', 'normal');
    doc.text(`Method: ${methodologyConfig.name} — ${methodologyConfig.description}`, this.MARGIN, y + 7);
    doc.text(`Scholar: ${methodAttribution.scholarName}`, this.MARGIN, y + 12);
    doc.text(`Source: ${methodAttribution.source}`, this.MARGIN, y + 17);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100);
    const detailLines = doc.splitTextToSize(methodAttribution.detail, pageWidth - this.MARGIN * 2 - 4);
    doc.text(detailLines, this.MARGIN, y + 22);

    // ── Nisab Threshold Section ──────────────────────────────────
    y += 45;
    if (y > pageHeight - 80) { doc.addPage(); y = 20; }

    doc.setFontSize(13);
    doc.setTextColor(BRAND_COLOR[0], BRAND_COLOR[1], BRAND_COLOR[2]);
    doc.setFont('helvetica', 'bold');
    doc.text('Nisab Threshold', this.MARGIN, y);

    const nisabBasis = (record.nisabBasis as 'GOLD' | 'SILVER') || methodologyConfig.nisabSource as 'GOLD' | 'SILVER' || 'GOLD';
    const nisabAttribution = NISAB_ATTRIBUTIONS[nisabBasis] || NISAB_ATTRIBUTIONS['GOLD'];
    const nisabThreshold = safeNumber(record.nisabThresholdAtStart);

    doc.setFontSize(10);
    doc.setTextColor(40);
    doc.setFont('helvetica', 'normal');
    doc.text(`Basis: ${nisabBasis === 'GOLD' ? 'Gold' : 'Silver'} Standard`, this.MARGIN, y + 8);
    doc.text(`Threshold at Start: ${formatCurrency(nisabThreshold, currency)}`, this.MARGIN, y + 14);

    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.setFont('helvetica', 'italic');
    doc.text(`Scholar: ${nisabAttribution.scholarName}  |  Source: ${nisabAttribution.source}`, this.MARGIN, y + 20);
    const nisabDetailLines = doc.splitTextToSize(nisabAttribution.detail, pageWidth - this.MARGIN * 2 - 4);
    doc.text(nisabDetailLines, this.MARGIN, y + 25);

    // ── Asset Breakdown ────────────────────────────────────────────
    y += 45;
    if (y > pageHeight - 80) { doc.addPage(); y = 20; }

    doc.setFontSize(13);
    doc.setTextColor(BRAND_COLOR[0], BRAND_COLOR[1], BRAND_COLOR[2]);
    doc.setFont('helvetica', 'bold');
    doc.text('Asset Breakdown', this.MARGIN, y);

    const totalAssets = assets.reduce((s, a) => s + safeNumber(a.value), 0);
    const zakatableAssets = assets.filter(a => a.zakatEligible !== false && a.isActive !== false);
    const zakatableTotal = zakatableAssets.reduce((s, a) => s + safeNumber(a.value), 0);

    const assetTableBody = assets.map(asset => {
      const attribution = ASSET_TYPE_ATTRIBUTIONS[asset.type] || ASSET_TYPE_ATTRIBUTIONS['OTHER'];
      const isZakatable = asset.zakatEligible !== false && asset.isActive !== false;
      const value = safeNumber(asset.value);
      return [
        asset.name || `${asset.type}`,
        asset.type.replace(/_/g, ' '),
        formatCurrency(value, asset.currency || currency),
        isZakatable ? 'Zakatable' : 'Exempt',
        attribution.scholarName,
      ];
    });

    autoTable(doc, {
      startY: y + 4,
      head: [['Asset Name', 'Type', 'Value', 'Status', 'Scholar Attribution']],
      body: assetTableBody,
      theme: 'striped',
      headStyles: { fillColor: BRAND_COLOR, textColor: 255, fontSize: 9 },
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: {
        2: { halign: 'right' },
      },
      margin: { left: this.MARGIN, right: this.MARGIN },
    });

    // ── Liability Deductions ─────────────────────────────────────────
    const liabilitiesY = (doc as any).lastAutoTable?.finalY + 15 || y + 20;
    if (liabilitiesY > pageHeight - 80) { doc.addPage(); }
    const ly = liabilitiesY > pageHeight - 80 ? 20 : liabilitiesY;

    doc.setFontSize(13);
    doc.setTextColor(BRAND_COLOR[0], BRAND_COLOR[1], BRAND_COLOR[2]);
    doc.setFont('helvetica', 'bold');
    doc.text('Liability Deductions', this.MARGIN, ly);

    const totalLiabilities = liabilities.reduce((s, l) => s + safeNumber(l.amount), 0);
    const deductibleLiabilities = liabilities.filter(l => l.isActive !== false);
    const deductibleTotal = deductibleLiabilities.reduce((s, l) => s + safeNumber(l.amount), 0);

    const liabilityTableBody = liabilities.map(liability => {
      const typeUpper = (liability.type || 'OTHER').toUpperCase();
      const attribution = LIABILITY_ATTRIBUTIONS[typeUpper] || LIABILITY_ATTRIBUTIONS['SHORT_TERM'];
      const amount = safeNumber(liability.amount);
      return [
        liability.name || typeUpper,
        liability.type || 'Other',
        formatCurrency(amount, liability.currency || currency),
        liability.isActive !== false ? 'Deductible' : 'Inactive',
        attribution.scholarName,
      ];
    });

    autoTable(doc, {
      startY: ly + 4,
      head: [['Liability Name', 'Type', 'Amount', 'Status', 'Scholar Attribution']],
      body: liabilityTableBody.length > 0 ? liabilityTableBody : [['No liabilities recorded', '', '', '', '']],
      theme: 'striped',
      headStyles: { fillColor: BRAND_COLOR, textColor: 255, fontSize: 9 },
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: { 2: { halign: 'right' } },
      margin: { left: this.MARGIN, right: this.MARGIN },
    });

    // ── Calculation Steps ──────────────────────────────────────────
    const calcY = (doc as any).lastAutoTable?.finalY + 15 || ly + 20;
    if (calcY > pageHeight - 100) { doc.addPage(); }
    const cy = calcY > pageHeight - 100 ? 20 : calcY;

    doc.setFontSize(14);
    doc.setTextColor(BRAND_COLOR[0], BRAND_COLOR[1], BRAND_COLOR[2]);
    doc.setFont('helvetica', 'bold');
    doc.text('Calculation Steps', this.MARGIN, cy);

    // Compute the steps using the same logic as the app
    const { totalWealth: calcTotalWealth, netZakatableWealth, deductibleLiabilities: calcDeductible } = calculateWealth(assets, liabilities);
    const zakatableWealth = safeNumber(record.zakatableWealth) || netZakatableWealth;
    const zakatAmount = safeNumber(record.zakatAmount) || (zakatableWealth >= nisabThreshold ? zakatableWealth * 0.025 : 0);

    const calcData = [
      ['1. Total Assets', formatCurrency(totalAssets, currency), 'Sum of all asset values at market rate'],
      ['2. Less: Deductible Liabilities', formatCurrency(deductibleTotal, currency), 'Debts due within the Hawl period'],
      ['3. Net Zakatable Wealth', formatCurrency(zakatableWealth, currency), (zakatableWealth >= nisabThreshold ? 'Above Nisab ✓' : 'Below Nisab — no Zakat due')],
      ['4. Zakat Rate', '2.5% (1/40th)', 'Classical consensus (Ijma\') on monetary wealth'],
      ['5. Zakat Due', formatCurrency(zakatAmount, currency), `Nisab threshold: ${formatCurrency(nisabThreshold, currency)}`],
    ];

    autoTable(doc, {
      startY: cy + 5,
      head: [['Step', 'Amount', 'Explanation']],
      body: calcData,
      theme: 'grid',
      headStyles: { fillColor: BRAND_COLOR, textColor: 255, fontSize: 10 },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } },
      margin: { left: this.MARGIN, right: this.MARGIN },
      didParseCell: (data) => {
        if (data.row.index === calcData.length - 1) {
          data.cell.styles.fillColor = [236, 253, 245]; // emerald-50
          data.cell.styles.textColor = [5, 150, 105];   // emerald-600
        }
      },
    });

    // ── Payment History (if any) ──────────────────────────────────
    let payY = (doc as any).lastAutoTable?.finalY + 15 || cy + 20;
    if (payments.length > 0) {
      if (payY > pageHeight - 80) { doc.addPage(); payY = 20; }

      doc.setFontSize(13);
      doc.setTextColor(BRAND_COLOR[0], BRAND_COLOR[1], BRAND_COLOR[2]);
      doc.setFont('helvetica', 'bold');
      doc.text('Payment History', this.MARGIN, payY);

      const totalPaid = payments.reduce((s, p) => s + safeNumber(p.amount), 0);
      const paymentBody = payments.map(p => [
        new Date(p.paymentDate).toLocaleDateString(),
        p.recipientName || 'Unspecified',
        p.recipientCategory || 'General',
        formatCurrency(safeNumber(p.amount), currency),
        p.method || '—',
        p.notes || '—',
      ]);
      paymentBody.push(['', '', 'TOTAL PAID', formatCurrency(totalPaid, currency), '', '']);

      autoTable(doc, {
        startY: payY + 4,
        head: [['Date', 'Recipient', 'Category', 'Amount', 'Method', 'Notes']],
        body: paymentBody,
        theme: 'striped',
        headStyles: { fillColor: BRAND_COLOR, textColor: 255, fontSize: 9 },
        styles: { fontSize: 8, cellPadding: 2 },
        columnStyles: { 3: { halign: 'right' } },
        margin: { left: this.MARGIN, right: this.MARGIN },
        didParseCell: (data) => {
          if (data.row.index === paymentBody.length - 1) {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fillColor = [240, 253, 244];
          }
        },
      });
    }

    // ── QR Code ────────────────────────────────────────────────────
    let qrY = (doc as any).lastAutoTable?.finalY + 15 || payY + 20;
    if (qrY > pageHeight - 60) { doc.addPage(); qrY = 20; }

    doc.setFontSize(11);
    doc.setTextColor(BRAND_COLOR[0], BRAND_COLOR[1], BRAND_COLOR[2]);
    doc.setFont('helvetica', 'bold');
    doc.text('Source Verification', this.MARGIN, qrY);

    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.setFont('helvetica', 'normal');
    doc.text('Scan the QR code to verify this statement and access your ZakApp records.', this.MARGIN, qrY + 6);

    try {
      const qrDataUrl = await QRCode.toDataURL('https://zakapp.io/nisab/' + record.id, {
        width: 80,
        margin: 1,
      });
      doc.addImage(qrDataUrl, 'PNG', this.MARGIN, qrY + 10, 25, 25);
    } catch {
      // QR generation failed — silently skip
    }

    // ── Digital Signature Placeholder ───────────────────────────────
    const sigX = this.MARGIN + 50;
    doc.setDrawColor(150);
    doc.setLineWidth(0.3);
    doc.line(sigX, qrY + 32, sigX + 60, qrY + 32);
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text('Authorized Signature (optional)', sigX, qrY + 37);

    // ── Disclaimer ─────────────────────────────────────────────────
    let disclaimerY = qrY + 48;
    if (disclaimerY > pageHeight - 40) { doc.addPage(); disclaimerY = 20; }

    doc.setFillColor(250, 250, 250);
    doc.setDrawColor(200);
    doc.roundedRect(this.MARGIN, disclaimerY, pageWidth - this.MARGIN * 2, 38, 2, 2, 'FD');
    doc.setFontSize(7);
    doc.setTextColor(100);
    doc.setFont('helvetica', 'normal');
    const disclaimerLines = doc.splitTextToSize(ZAKAT_STATEMENT_DISCLAIMER.trim(), pageWidth - this.MARGIN * 2 - 6);
    doc.text(disclaimerLines, this.MARGIN + 3, disclaimerY + 6);

    // ── Footer ─────────────────────────────────────────────────────
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setTextColor(150);
      doc.text(`ZakApp — Local-First Privacy  |  Page ${i} of ${pageCount}`, this.MARGIN, pageHeight - 8);
      doc.text('Generated by ZakApp v0.12.0', pageWidth - this.MARGIN, pageHeight - 8, { align: 'right' });
    }

    // Save
    const hijriLabel = record.hijriYear ? `${record.hijriYear}H` : 'Statement';
    doc.save(`ZakApp_Zakat_Statement_${hijriLabel}.pdf`);
  }
}
