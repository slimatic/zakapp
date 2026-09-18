/**
 * #310 residual — the PDF currency fallback must never mislabel a non-USD amount.
 *
 * WHY THIS EXISTS
 * pdfGenerator.formatCurrency caught Intl errors (unrecognised ISO-4217 code)
 * and fell back to a hardcoded "$" prefix. So a user on IDR would get a report
 * claiming "$1,234.56" — a wrong currency silently asserted in a document that
 * is often printed and shared, which is harder to catch than an on-screen bug.
 * The fallback must stay truthful about which currency it could not format.
 */

import { describe, it, expect, vi } from 'vitest';
import { generateAnnualSummaryPDF } from '../../utils/pdfGenerator';

// Capture the table rows handed to jsPDF-autoTable.
const capturedRows: string[][] = [];

vi.mock('jspdf', () => {
  return {
    default: class MockjsPDF {
      setFontSize() { return this; }
      setFont() { return this; }
      text() { return this; }
      save() { return this; }
      output() { return new Blob(); }
      setFillColor() { return this; }
      setTextColor() { return this; }
      setPage() { return this; }
      getNumberOfPages() { return 1; }
      splitTextToSize(t: string) { return [t]; }
      rect() { return this; }
      addPage() { return this; }
      internal = { pageSize: { getWidth: () => 595, getHeight: () => 842 } };
      lastAutoTable = { finalY: 100 };
    },
  };
});

// pdfGenerator imports this as a standalone function: autoTable(doc, opts).
vi.mock('jspdf-autotable', () => ({
  default: (doc: any, opts: { body?: string[][] }) => {
    if (opts?.body) capturedRows.push(...opts.body.map(r => [...r]));
    // pdfGenerator reads doc.lastAutoTable.finalY to continue layout.
    doc.lastAutoTable = { finalY: 100 };
  },
}));

const snapshot = {
  id: 's1',
  userId: 'u1',
  gregorianYear: 2026,
  hijriYear: 1448,
  calculationDate: '2026-09-17T00:00:00.000Z',
  totalWealth: 42000000,
  totalLiabilities: 0,
  zakatableWealth: 42000000,
  nisabThreshold: 5000000,
  zakatAmount: 1050000,
  calendarType: 'gregorian',
  createdAt: '2026-09-17T00:00:00.000Z',
} as never;

describe('#310 residual — PDF fallback stays currency-truthful', () => {
  it('formats a valid non-USD currency with its own symbol (no "$")', () => {
    capturedRows.length = 0;
    generateAnnualSummaryPDF(snapshot, [], { currency: 'IDR' });
    const flat = capturedRows.flat().join(' | ');
    expect(flat).not.toMatch(/\$\d/);
  });

  it('does not assert "$" when the currency code is unrecognised', () => {
    capturedRows.length = 0;
    // A bogus code makes Intl throw, exercising the caught branch.
    generateAnnualSummaryPDF(snapshot, [], { currency: 'NOT-A-CODE' });
    const flat = capturedRows.flat().join(' | ');
    expect(flat).not.toMatch(/\$\d/);
    // The code is surfaced instead, so the reader is not misled.
    expect(flat.toUpperCase()).toContain('NOT-A-CODE');
  });
});
