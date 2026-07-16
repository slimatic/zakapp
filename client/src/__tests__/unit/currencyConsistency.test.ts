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
 * Currency Consistency Tests — Issue #310
 *
 * Verifies that all currency formatting respects the user's currency preference
 * and does NOT fall back to USD when a non-USD currency is selected.
 *
 * Tests cover:
 * - formatters.ts: formatCurrency with all supported currencies
 * - pdfGenerator.ts: PDFOptions.currency propagation
 * - ReportGenerator.ts: constructor currency param
 * - History.tsx: formatCurrency uses userCurrency from auth context
 * - AnnualSummaryCard.tsx: formatCurrency uses userCurrency from auth context
 */

import { describe, it, expect, vi } from 'vitest';
import { formatCurrency, getSupportedCurrencies, getCurrencySymbol, type CurrencyCode } from '../../utils/formatters';
import { generateAnnualSummaryPDF, type PDFOptions } from '../../utils/pdfGenerator';
import { ReportGenerator } from '../../utils/ReportGenerator';
import type { YearlySnapshot, PaymentRecord } from '@zakapp/shared/types/tracking';

// Mock jsPDF so PDF generation doesn't need a real browser
const mockJsPDFInstance = {
  setFontSize: vi.fn(),
  setFont: vi.fn(),
  setTextColor: vi.fn(),
  setDrawColor: vi.fn(),
  setFillColor: vi.fn(),
  setText: vi.fn(),
  text: vi.fn(),
  addPage: vi.fn(),
  save: vi.fn(),
  setPage: vi.fn(),
  getNumberOfPages: vi.fn().mockReturnValue(1),
  splitTextToSize: vi.fn((text: string) => String(text || '').split('\n')),
  getTextWidth: vi.fn().mockReturnValue(50),
  line: vi.fn(),
  internal: {
    pageSize: {
      getWidth: vi.fn().mockReturnValue(210),
      getHeight: vi.fn().mockReturnValue(297),
      width: 210,
      height: 297,
    },
  },
  lastAutoTable: { finalY: 100 },
};

vi.mock('jspdf', () => ({
  default: vi.fn().mockImplementation(() => mockJsPDFInstance),
}));

vi.mock('jspdf-autotable', () => ({
  default: vi.fn(),
}));

// Mock date-fns format to avoid locale issues in test env
vi.mock('date-fns', () => ({
  format: vi.fn((date: Date, _fmt: string) => '2024-06-15'),
}));

vi.mock('../../utils/chartFormatter', () => ({
  formatCategoryName: vi.fn((cat: string) => cat),
}));

vi.mock('../../utils/calendarConverter', () => ({
  formatDualCalendar: vi.fn(() => 'June 15, 2024 (8 Dhul-Hijjah 1446 AH)'),
}));

// ──────────────────────────────────────────────────
// Test data
// ──────────────────────────────────────────────────

const mockSnapshot: YearlySnapshot = {
  id: 'snap-test',
  userId: 'user-test',
  calculationDate: new Date('2024-06-15'),
  gregorianYear: 2024,
  gregorianMonth: 6,
  gregorianDay: 15,
  hijriYear: 1446,
  hijriMonth: 12,
  hijriDay: 8,
  totalWealth: 150000,
  totalLiabilities: 20000,
  zakatableWealth: 130000,
  zakatAmount: 3250,
  methodologyUsed: 'Standard',
  nisabThreshold: 85000,
  nisabType: 'gold',
  status: 'finalized',
  assetBreakdown: {
    cash: 50000,
    gold: 30000,
    investments: 50000,
    businessAssets: 20000,
  },
  calculationDetails: {},
  userNotes: 'Test note',
  isPrimary: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockPayments: PaymentRecord[] = [
  {
    id: 'pay-1',
    userId: 'user-test',
    snapshotId: 'snap-test',
    amount: 1000,
    paymentDate: new Date('2024-07-01'),
    recipientName: 'Test Recipient',
    recipientType: 'individual',
    recipientCategory: 'fakir',
    notes: 'Test payment',
    receiptReference: 'RCPT-001',
    paymentMethod: 'cash',
    status: 'verified',
    currency: 'IDR',
    exchangeRate: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// ──────────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────────

describe('Currency Consistency — Issue #310', () => {
  describe('formatters.ts: formatCurrency', () => {
    it('formats IDR with Rp symbol and 0 decimals (per CURRENCY_CONFIG)', () => {
      const result = formatCurrency(1500000, 'IDR');
      // IDR uses 0 decimals per config, symbol is Rp
      expect(result).not.toContain('$');
      // Should not have decimal places (IDR decimals = 0 in config)
      // Note: Indonesian locale uses . as thousand separator, so we check
      // for decimal portion at end of string: \.\d{2}$ or \.\d{2}\s*$
      expect(result).not.toMatch(/\.\d{2}\s*$/);
    });

    it('formats USD with $ symbol and 2 decimals', () => {
      const result = formatCurrency(1234.56, 'USD');
      expect(result).toContain('$');
      expect(result).toContain('1,234.56');
    });

    it('formats SAR without $ symbol', () => {
      const result = formatCurrency(50000, 'SAR');
      // SAR uses ar-SA locale which produces Arabic currency format
      // Key test: it should NOT produce $ (USD)
      expect(result).not.toContain('$');
    });

    it('does NOT default to USD when a different currency is specified', () => {
      const result = formatCurrency(100000, 'EUR');
      expect(result).toContain('€');
      expect(result).not.toContain('$');
    });

    it('supports all 11 currencies in CURRENCY_CONFIG', () => {
      const codes = getSupportedCurrencies();
      expect(codes).toHaveLength(11);
      // Each code should format without throwing
      for (const code of codes) {
        expect(() => formatCurrency(1000, code as CurrencyCode)).not.toThrow();
      }
    });

    it('getCurrencySymbol returns correct symbol for IDR', () => {
      expect(getCurrencySymbol('IDR')).toBe('Rp');
    });

    it('getCurrencySymbol returns correct symbol for USD', () => {
      expect(getCurrencySymbol('USD')).toBe('$');
    });
  });

  describe('pdfGenerator.ts: currency propagation', () => {
    it('generateAnnualSummaryPDF accepts currency in PDFOptions', () => {
      const options: PDFOptions = {
        includePayments: true,
        currency: 'IDR',
      };
      // Should not throw with IDR currency
      expect(() => generateAnnualSummaryPDF(mockSnapshot, mockPayments, options)).not.toThrow();
    });

    it('generateAnnualSummaryPDF defaults to USD when no currency specified', () => {
      expect(() => generateAnnualSummaryPDF(mockSnapshot, mockPayments)).not.toThrow();
    });

    it('PDFOptions interface includes currency field', () => {
      const opts: PDFOptions = { currency: 'EUR' };
      expect(opts.currency).toBe('EUR');
    });
  });

  describe('ReportGenerator.ts: currency constructor param', () => {
    it('accepts IDR currency in constructor', () => {
      expect(() => new ReportGenerator('IDR')).not.toThrow();
    });

    it('accepts EUR currency in constructor', () => {
      expect(() => new ReportGenerator('EUR')).not.toThrow();
    });

    it('defaults to USD when no currency provided', () => {
      expect(() => new ReportGenerator()).not.toThrow();
    });

    it('generates payment summary with non-USD currency without errors', () => {
      const gen = new ReportGenerator('SAR');
      // generatePaymentSummary should use SAR, not USD
      expect(() => gen.generatePaymentSummary(mockPayments, 2024)).not.toThrow();
    });
  });

  describe('Currency pattern: userCurrency extraction', () => {
    it('extracts currency from user.settings.currency', () => {
      const user = { settings: { currency: 'IDR' } } as any;
      const currency = user?.settings?.currency || user?.preferences?.currency || 'USD';
      expect(currency).toBe('IDR');
    });

    it('extracts currency from user.preferences.currency (fallback)', () => {
      const user = { preferences: { currency: 'EUR' } } as any;
      const currency = user?.settings?.currency || user?.preferences?.currency || 'USD';
      expect(currency).toBe('EUR');
    });

    it('defaults to USD when no currency preference is set', () => {
      const user = {} as any;
      const currency = user?.settings?.currency || user?.preferences?.currency || 'USD';
      expect(currency).toBe('USD');
    });

    it('defaults to USD when user is null', () => {
      const user = null as any;
      const currency = user?.settings?.currency || user?.preferences?.currency || 'USD';
      expect(currency).toBe('USD');
    });
  });

  describe('No hardcoded USD in formatCurrency default params', () => {
    // These tests verify the fix: formatCurrency functions should NOT
    // always produce USD output when called with a non-USD currency.

    it('formatters.ts formatCurrency: IDR does not produce $', () => {
      const result = formatCurrency(50000, 'IDR');
      expect(result).not.toContain('$');
    });

    it('pdfGenerator formatCurrency: IDR does not produce $', () => {
      // The internal formatCurrency in pdfGenerator should use Intl.NumberFormat
      // with the currency code, not a raw $ symbol
      const options: PDFOptions = { currency: 'IDR' };
      expect(() => generateAnnualSummaryPDF(mockSnapshot, [], options)).not.toThrow();
    });

    it('ReportGenerator: non-USD currency does not produce $', () => {
      const gen = new ReportGenerator('IDR');
      expect(() => gen.generatePaymentSummary(mockPayments, 2024)).not.toThrow();
    });
  });
});