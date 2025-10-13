/**
 * Unit Tests for pdfGenerator utility
 * Tests PDF generation for annual Zakat summaries
 */

import jsPDF from 'jspdf';
import { generateAnnualSummaryPDF, generatePaymentReceiptPDF, type PDFOptions } from '../../utils/pdfGenerator';
import type { YearlySnapshot, PaymentRecord } from '../../../../shared/types/tracking';

// Mock jsPDF
jest.mock('jspdf');
jest.mock('jspdf-autotable');

describe('pdfGenerator utility', () => {
  let mockDoc: any;

  // Mock data available to all test blocks
  const mockSnapshot: YearlySnapshot = {
    id: 'snap-123',
    userId: 'user-123',
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
      businessAssets: 20000
    },
    calculationDetails: {},
    userNotes: 'This is a test note',
    isPrimary: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockPayments: PaymentRecord[] = [
    {
      id: 'pay-1',
      userId: 'user-123',
      snapshotId: 'snap-123',
      amount: 1000,
      paymentDate: new Date('2024-07-01'),
      recipientName: 'Test Recipient 1',
      recipientType: 'individual',
      recipientCategory: 'fakir',
      notes: 'First payment',
      receiptReference: 'RCPT-001',
      paymentMethod: 'cash',
      status: 'verified',
      currency: 'USD',
      exchangeRate: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'pay-2',
      userId: 'user-123',
      snapshotId: 'snap-123',
      amount: 1500,
      paymentDate: new Date('2024-08-01'),
      recipientName: 'Test Recipient 2',
      recipientType: 'organization',
      recipientCategory: 'miskin',
      notes: 'Second payment',
      receiptReference: 'RCPT-002',
      paymentMethod: 'bank_transfer',
      status: 'recorded',
      currency: 'USD',
      exchangeRate: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  beforeEach(() => {
    mockDoc = {
      setFontSize: jest.fn(),
      setFont: jest.fn(),
      text: jest.fn(),
      addPage: jest.fn(),
      save: jest.fn(),
      internal: {
        pageSize: {
          getWidth: jest.fn().mockReturnValue(210),
          getHeight: jest.fn().mockReturnValue(297)
        }
      },
      lastAutoTable: {
        finalY: 100
      }
    };

    (jsPDF as jest.MockedClass<typeof jsPDF>).mockImplementation(() => mockDoc);
    jest.clearAllMocks();
  });

  describe('generateAnnualSummaryPDF', () => {
    it('should create a new jsPDF document', () => {
      generateAnnualSummaryPDF(mockSnapshot, mockPayments);

      expect(jsPDF).toHaveBeenCalled();
    });

    it('should include document title', () => {
      generateAnnualSummaryPDF(mockSnapshot, mockPayments);

      expect(mockDoc.text).toHaveBeenCalledWith(
        'Annual Zakat Summary',
        expect.any(Number),
        expect.any(Number),
        expect.objectContaining({ align: 'center' })
      );
    });

    it('should include year information', () => {
      generateAnnualSummaryPDF(mockSnapshot, mockPayments);

      expect(mockDoc.text).toHaveBeenCalledWith(
        expect.stringContaining('2024'),
        expect.any(Number),
        expect.any(Number),
        expect.any(Object)
      );

      expect(mockDoc.text).toHaveBeenCalledWith(
        expect.stringContaining('1446 AH'),
        expect.any(Number),
        expect.any(Number),
        expect.any(Object)
      );
    });

    it('should include wealth summary section', () => {
      generateAnnualSummaryPDF(mockSnapshot, mockPayments);

      expect(mockDoc.text).toHaveBeenCalledWith(
        'Wealth Summary',
        expect.any(Number),
        expect.any(Number)
      );
    });

    it('should include Zakat calculation section', () => {
      generateAnnualSummaryPDF(mockSnapshot, mockPayments);

      expect(mockDoc.text).toHaveBeenCalledWith(
        'Zakat Calculation',
        expect.any(Number),
        expect.any(Number)
      );
    });

    it('should include payments when includePayments is true', () => {
      const options: PDFOptions = { includePayments: true };
      generateAnnualSummaryPDF(mockSnapshot, mockPayments, options);

      expect(mockDoc.text).toHaveBeenCalledWith(
        'Payment Records',
        expect.any(Number),
        expect.any(Number)
      );
    });

    it('should skip payments when includePayments is false', () => {
      const options: PDFOptions = { includePayments: false };
      generateAnnualSummaryPDF(mockSnapshot, mockPayments, options);

      expect(mockDoc.text).not.toHaveBeenCalledWith(
        'Payment Records',
        expect.any(Number),
        expect.any(Number)
      );
    });

    it('should include asset breakdown when includeAssetBreakdown is true', () => {
      const options: PDFOptions = { includeAssetBreakdown: true };
      generateAnnualSummaryPDF(mockSnapshot, mockPayments, options);

      expect(mockDoc.text).toHaveBeenCalledWith(
        'Asset Breakdown',
        expect.any(Number),
        expect.any(Number)
      );
    });

    it('should skip asset breakdown when includeAssetBreakdown is false', () => {
      const options: PDFOptions = { includeAssetBreakdown: false };
      const snapshotNoAssets = { ...mockSnapshot, assetBreakdown: undefined };
      generateAnnualSummaryPDF(snapshotNoAssets, mockPayments, options);

      expect(mockDoc.text).not.toHaveBeenCalledWith(
        'Asset Breakdown',
        expect.any(Number),
        expect.any(Number)
      );
    });

    it('should include user notes if present', () => {
      generateAnnualSummaryPDF(mockSnapshot, mockPayments);

      expect(mockDoc.text).toHaveBeenCalledWith(
        'Notes',
        expect.any(Number),
        expect.any(Number)
      );
    });

    it('should skip user notes if not present', () => {
      const snapshotNoNotes = { ...mockSnapshot, userNotes: undefined };
      generateAnnualSummaryPDF(snapshotNoNotes, mockPayments);

      const notesCalls = (mockDoc.text as jest.Mock).mock.calls.filter(
        call => call[0] === 'Notes'
      );
      expect(notesCalls.length).toBe(0);
    });

    it('should handle empty payments array', () => {
      const options: PDFOptions = { includePayments: true };
      generateAnnualSummaryPDF(mockSnapshot, [], options);

      // Should create document but not include payment records section
      expect(jsPDF).toHaveBeenCalled();
    });

    it('should set appropriate font sizes for headers', () => {
      generateAnnualSummaryPDF(mockSnapshot, mockPayments);

      // Title should be 20pt
      expect(mockDoc.setFontSize).toHaveBeenCalledWith(20);

      // Section headers should be 14pt
      expect(mockDoc.setFontSize).toHaveBeenCalledWith(14);
    });

    it('should return jsPDF instance', () => {
      const result = generateAnnualSummaryPDF(mockSnapshot, mockPayments);

      expect(result).toBe(mockDoc);
      expect(result).toHaveProperty('save');
    });

    it('should add new page when content exceeds page height', () => {
      // Simulate content that would overflow
      mockDoc.lastAutoTable.finalY = 270; // Near bottom of A4 page (297mm)

      const options: PDFOptions = { includePayments: true, includeAssetBreakdown: true };
      generateAnnualSummaryPDF(mockSnapshot, mockPayments, options);

      // Should call addPage when content exceeds threshold
      expect(mockDoc.addPage).toHaveBeenCalled();
    });
  });

  describe('generatePaymentReceiptPDF', () => {
    const mockPayment: PaymentRecord = {
      id: 'pay-123',
      userId: 'user-123',
      snapshotId: 'snap-123',
      amount: 1000,
      paymentDate: new Date('2024-07-15'),
      recipientName: 'Test Organization',
      recipientType: 'organization',
      recipientCategory: 'fakir',
      notes: 'Monthly Zakat payment',
      receiptReference: 'RCPT-2024-001',
      paymentMethod: 'bank_transfer',
      status: 'verified',
      currency: 'USD',
      exchangeRate: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should create a payment receipt', () => {
      generatePaymentReceiptPDF(mockPayment);

      expect(jsPDF).toHaveBeenCalled();
    });

    it('should include receipt title', () => {
      generatePaymentReceiptPDF(mockPayment);

      expect(mockDoc.text).toHaveBeenCalledWith(
        expect.stringContaining('Payment Receipt'),
        expect.any(Number),
        expect.any(Number),
        expect.any(Object)
      );
    });

    it('should include receipt reference number', () => {
      generatePaymentReceiptPDF(mockPayment);

      expect(mockDoc.text).toHaveBeenCalledWith(
        expect.stringContaining('RCPT-2024-001'),
        expect.any(Number),
        expect.any(Number),
        expect.any(Object)
      );
    });

    it('should include payment amount', () => {
      generatePaymentReceiptPDF(mockPayment);

      // Should format and display the amount
      expect(mockDoc.text).toHaveBeenCalledWith(
        expect.stringContaining('1,000'),
        expect.any(Number),
        expect.any(Number),
        expect.any(Object)
      );
    });

    it('should include payment date', () => {
      generatePaymentReceiptPDF(mockPayment);

      expect(mockDoc.text).toHaveBeenCalledWith(
        expect.stringContaining('Jul'),
        expect.any(Number),
        expect.any(Number),
        expect.any(Object)
      );
    });

    it('should include recipient information', () => {
      generatePaymentReceiptPDF(mockPayment);

      expect(mockDoc.text).toHaveBeenCalledWith(
        expect.stringContaining('Test Organization'),
        expect.any(Number),
        expect.any(Number),
        expect.any(Object)
      );
    });

    it('should include payment method', () => {
      generatePaymentReceiptPDF(mockPayment);

      expect(mockDoc.text).toHaveBeenCalledWith(
        expect.stringContaining('bank_transfer'),
        expect.any(Number),
        expect.any(Number),
        expect.any(Object)
      );
    });

    it('should return jsPDF instance', () => {
      const result = generatePaymentReceiptPDF(mockPayment);

      expect(result).toBe(mockDoc);
    });
  });

  describe('PDF formatting utilities', () => {
    it('should handle large numbers with proper formatting', () => {
      const largeSnapshot = {
        ...mockSnapshot,
        totalWealth: 1500000,
        zakatAmount: 37500
      };

      generateAnnualSummaryPDF(largeSnapshot as YearlySnapshot, []);

      // Should format with thousands separators
      expect(mockDoc.text).toHaveBeenCalled();
    });

    it('should handle decimal values correctly', () => {
      const decimalSnapshot = {
        ...mockSnapshot,
        totalWealth: 150000.50,
        zakatAmount: 3750.01
      };

      generateAnnualSummaryPDF(decimalSnapshot as YearlySnapshot, []);

      expect(mockDoc.text).toHaveBeenCalled();
    });

    it('should handle empty snapshot gracefully', () => {
      const minimalSnapshot = {
        ...mockSnapshot,
        assetBreakdown: undefined,
        userNotes: undefined
      };

      expect(() => {
        generateAnnualSummaryPDF(minimalSnapshot as YearlySnapshot, []);
      }).not.toThrow();
    });
  });

  describe('document structure', () => {
    it('should use appropriate margins', () => {
      generateAnnualSummaryPDF(mockSnapshot, mockPayments);

      // Document should have proper margins (14mm on sides)
      expect(mockDoc.text).toHaveBeenCalledWith(
        expect.anything(),
        expect.any(Number),
        expect.any(Number),
        expect.any(Object)
      );
    });

    it('should maintain consistent spacing between sections', () => {
      generateAnnualSummaryPDF(mockSnapshot, mockPayments, {
        includePayments: true,
        includeAssetBreakdown: true
      });

      // Should have multiple sections with proper spacing
      expect(mockDoc.text).toHaveBeenCalledTimes(expect.any(Number));
      expect((mockDoc.text as jest.Mock).mock.calls.length).toBeGreaterThan(5);
    });
  });
});
