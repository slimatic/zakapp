import { Request, Response } from 'express';
import { AuthenticatedRequest, ApiResponse } from '../types';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { zakatService } from '../services/ZakatService';

export class ZakatController {
  calculate = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId;
    if (!userId) {
      throw new AppError('User not authenticated', 401, 'UNAUTHORIZED');
    }

    const calculationRequest = req.body;

    // Validate request
    if (!calculationRequest.methodologyId) {
      throw new AppError('Methodology ID is required', 400, 'VALIDATION_ERROR');
    }

    try {
      // Validate the calculation request
      zakatService.validateCalculationRequest(calculationRequest);

      // Perform the calculation
      const calculation = await zakatService.calculateZakat(
        calculationRequest,
        userId
      );

      const response: ApiResponse = {
        success: true,
        calculation
      };

      res.status(200).json(response);
    } catch (error) {
      if (error instanceof Error && error.message.includes('Methodology ID is required')) {
        throw new AppError('Methodology ID is required', 400, 'VALIDATION_ERROR');
      }
      throw error;
    }
  });

  getNisab = asyncHandler(async (req: Request, res: Response) => {
    const mockNisab = {
      goldPrice: 65.00, // per gram
      silverPrice: 0.85, // per gram
      goldNisab: 2947.78, // 85g * gold price
      silverNisab: 357.00, // 595g * silver price
      effectiveNisab: 357.00, // Lower of the two
      currency: 'USD',
      lastUpdated: new Date().toISOString()
    };

    const response: ApiResponse = {
      success: true,
      nisab: mockNisab
    };

    res.status(200).json(response);
  });

  createSnapshot = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { year, notes } = req.body;

    const mockSnapshot = {
      id: 'snapshot-id',
      year: year || new Date().getFullYear(),
      totalAssetValue: 10000.00,
      zakatOwed: 250.00,
      notes,
      createdAt: new Date().toISOString()
    };

    const response: ApiResponse = {
      success: true,
      message: 'Snapshot created successfully',
      snapshot: mockSnapshot
    };

    res.status(201).json(response);
  });

  listSnapshots = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const mockSnapshots = [
      {
        id: 'snapshot-1',
        year: 2024,
        totalAssetValue: 10000.00,
        zakatOwed: 250.00,
        createdAt: new Date().toISOString()
      }
    ];

    const response: ApiResponse = {
      success: true,
      snapshots: mockSnapshots,
      pagination: {
        total: 1,
        page: 1,
        pages: 1,
        limit: 10
      }
    };

    res.status(200).json(response);
  });

  getSnapshot = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    const mockSnapshot = {
      id,
      year: 2024,
      totalAssetValue: 10000.00,
      zakatOwed: 250.00,
      assets: [],
      createdAt: new Date().toISOString()
    };

    const response: ApiResponse = {
      success: true,
      snapshot: mockSnapshot
    };

    res.status(200).json(response);
  });

  recordPayment = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { amount, date, recipient, method, notes } = req.body;

    if (!amount) {
      throw new AppError('Payment amount is required', 400, 'MISSING_AMOUNT');
    }

    const mockPayment = {
      id: 'payment-id',
      amount,
      date: date || new Date().toISOString(),
      recipient,
      method,
      notes,
      createdAt: new Date().toISOString()
    };

    const response: ApiResponse = {
      success: true,
      message: 'Payment recorded successfully',
      payment: mockPayment
    };

    res.status(201).json(response);
  });

  listPayments = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const mockPayments = [
      {
        id: 'payment-1',
        amount: 250.00,
        date: new Date().toISOString(),
        recipient: 'Local Charity',
        method: 'bank_transfer',
        createdAt: new Date().toISOString()
      }
    ];

    const response: ApiResponse = {
      success: true,
      payments: mockPayments,
      summary: {
        totalPaid: 250.00,
        paymentCount: 1
      }
    };

    res.status(200).json(response);
  });

  listMethodologies = asyncHandler(async (req: Request, res: Response) => {
    const mockMethodologies = [
      {
        id: 'standard',
        name: 'Standard Methodology',
        description: 'Standard Zakat calculation methodology',
        nisabThreshold: 'silver',
        zakatRate: 0.025
      },
      {
        id: 'hanafi',
        name: 'Hanafi Methodology',
        description: 'Hanafi school methodology',
        nisabThreshold: 'silver',
        zakatRate: 0.025
      }
    ];

    const response: ApiResponse = {
      success: true,
      methodologies: mockMethodologies
    };

    res.status(200).json(response);
  });

  simulate = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { assets, methodologyId } = req.body;

    const mockSimulation = {
      methodologyId: methodologyId || 'standard',
      totalAssetValue: 10000.00,
      zakatOwed: 250.00,
      isAboveNisab: true,
      simulatedAt: new Date().toISOString()
    };

    const response: ApiResponse = {
      success: true,
      simulation: mockSimulation
    };

    res.status(200).json(response);
  });

  getHistory = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const mockHistory = [
      {
        id: 'history-1',
        year: 2024,
        totalAssetValue: 10000.00,
        zakatOwed: 250.00,
        calculatedAt: new Date().toISOString()
      }
    ];

    const response: ApiResponse = {
      success: true,
      history: mockHistory
    };

    res.status(200).json(response);
  });

  getReport = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    const mockReport = {
      id,
      title: 'Zakat Report',
      year: 2024,
      totalAssetValue: 10000.00,
      zakatOwed: 250.00,
      generatedAt: new Date().toISOString()
    };

    const response: ApiResponse = {
      success: true,
      report: mockReport
    };

    res.status(200).json(response);
  });

  createSchedule = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { frequency, remindBefore } = req.body;

    const mockSchedule = {
      id: 'schedule-id',
      frequency: frequency || 'yearly',
      remindBefore: remindBefore || 30,
      nextCalculation: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString()
    };

    const response: ApiResponse = {
      success: true,
      message: 'Schedule created successfully',
      schedule: mockSchedule
    };

    res.status(201).json(response);
  });
}