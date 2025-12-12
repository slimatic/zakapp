import { EncryptionService } from '../../services/EncryptionService';

// Mock EncryptionService
jest.mock('../../services/EncryptionService');

// Mock PrismaClient
const mockPrisma = {
  zakatCalculation: { findFirst: jest.fn() },
  zakatPayment: {
    create: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  $transaction: jest.fn((callback) => callback(mockPrisma)),
};

jest.mock('@prisma/client', () => {
  return {
    PrismaClient: jest.fn(() => mockPrisma),
  };
});

// Import PaymentService after mocks
const { PaymentService } = require('../../services/PaymentService');

describe('PaymentService', () => {
  let service: any;
  const mockUserId = 'test-user-123';
  const mockCalculationId = 'calc-123';

  beforeEach(() => {
    process.env.ENCRYPTION_KEY = 'test-encryption-key-32-characters!!';
    service = new PaymentService();
    jest.clearAllMocks();

    // Setup default EncryptionService mocks
    (EncryptionService.encryptObject as jest.Mock).mockImplementation((data) => Promise.resolve(data));
    (EncryptionService.decryptObject as jest.Mock).mockImplementation((data) => Promise.resolve(data));
  });

  afterEach(() => {
    delete process.env.ENCRYPTION_KEY;
  });

  describe('recordPayment', () => {
    const validRequest = {
      calculationId: mockCalculationId,
      amount: 100,
      paymentDate: new Date(),
      recipients: [
        {
          name: 'Charity A',
          type: 'charity' as const,
          category: 'poor' as const,
          amount: 100,
        },
      ],
      paymentMethod: 'cash' as const,
    };

    it('should record a payment successfully', async () => {
      // Mock calculation found
      mockPrisma.zakatCalculation.findFirst.mockResolvedValue({ id: mockCalculationId, userId: mockUserId });

      // Mock payment creation
      const mockCreatedPayment = {
        id: 'payment-123',
        ...validRequest,
        userId: mockUserId,
        status: 'completed',
        islamicYear: '1445',
        verificationDetails: '{}',
        recipients: JSON.stringify(validRequest.recipients), // Prisma returns string for JSON
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrisma.zakatPayment.create.mockResolvedValue(mockCreatedPayment);

      const result = await service.recordPayment(mockUserId, validRequest);

      expect(mockPrisma.zakatCalculation.findFirst).toHaveBeenCalledWith({
        where: { id: mockCalculationId, userId: mockUserId },
      });

      expect(mockPrisma.zakatPayment.create).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result.id).toBe('payment-123');
    });

    it('should throw error if calculation not found', async () => {
      mockPrisma.zakatCalculation.findFirst.mockResolvedValue(null);

      await expect(service.recordPayment(mockUserId, validRequest)).rejects.toThrow('Calculation not found');
    });

    it('should throw error if recipients total does not match amount', async () => {
      mockPrisma.zakatCalculation.findFirst.mockResolvedValue({ id: mockCalculationId, userId: mockUserId });

      const invalidRequest = {
        ...validRequest,
        amount: 100,
        recipients: [
          {
            name: 'Charity A',
            type: 'charity' as const,
            category: 'poor' as const,
            amount: 50, // Mismatch
          },
        ],
      };

      await expect(service.recordPayment(mockUserId, invalidRequest)).rejects.toThrow('Recipients total must equal payment amount');
    });
  });

  describe('getPaymentById', () => {
    it('should return payment if found', async () => {
      const mockPayment = {
        id: 'payment-123',
        userId: mockUserId,
        amount: 100,
        recipients: JSON.stringify([]),
        verificationDetails: '{}',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.zakatPayment.findFirst.mockResolvedValue(mockPayment);

      const result = await service.getPaymentById(mockUserId, 'payment-123');

      expect(result).toBeDefined();
      expect(result.id).toBe('payment-123');
    });

    it('should throw error if payment not found', async () => {
      mockPrisma.zakatPayment.findFirst.mockResolvedValue(null);

      await expect(service.getPaymentById(mockUserId, 'payment-999')).rejects.toThrow('Payment not found');
    });
  });

  describe('getPaymentHistory', () => {
    it('should return paginated payments', async () => {
      const mockPayments = [
        {
          id: 'payment-1',
          userId: mockUserId,
          amount: 100,
          recipients: JSON.stringify([]),
          verificationDetails: '{}',
          createdAt: new Date(),
          updatedAt: new Date(),
          calculation: {},
        },
      ];

      mockPrisma.zakatPayment.findMany.mockResolvedValue(mockPayments);
      mockPrisma.zakatPayment.count.mockResolvedValue(1);

      const result = await service.getPaymentHistory(mockUserId, { page: 1, limit: 10 });

      expect(result.payments).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
    });
  });
});
