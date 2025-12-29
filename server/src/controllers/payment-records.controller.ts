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

import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { PaymentRecordService, CreatePaymentDto, UpdatePaymentDto, PaymentFilters } from '../services/payment-record.service';

/**
 * Standard API Response Format
 */
interface StandardResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: string[];
  };
  metadata?: {
    timestamp: string;
    version: string;
  };
}

/**
 * Helper function to create StandardResponse
 */
const createResponse = <T>(success: boolean, data?: T, error?: { code: string; message: string; details?: string[] }): StandardResponse<T> => {
  return {
    success,
    data,
    error,
    metadata: {
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    }
  };
};

/**
 * PaymentRecordsController - Controller for Zakat payment record operations
 * Handles CRUD operations for payment records with proper validation and error handling
 */
export class PaymentRecordsController {
  private paymentService: PaymentRecordService;

  constructor() {
    this.paymentService = new PaymentRecordService();
  }

  /**
   * POST /api/zakat/payments
   * Create a new payment record
   */
  createPayment = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.userId) {
        const response = createResponse(false, undefined, {
          code: 'AUTHENTICATION_ERROR',
          message: 'User not authenticated'
        });
        return res.status(401).json(response);
      }

      const paymentData: CreatePaymentDto = req.body;
      const payment = await this.paymentService.createPayment(req.userId, paymentData);

      const response = createResponse(true, { payment });
      res.status(201).json(response);
    } catch (error) {
      const response = createResponse(false, undefined, {
        code: 'PAYMENT_CREATION_ERROR',
        message: 'Failed to create payment record',
        details: [error instanceof Error ? error.message : 'Unknown error']
      });
      res.status(400).json(response);
    }
  };

  /**
   * GET /api/zakat/payments
   * Get user's payment records with optional filtering
   */
  getPayments = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.userId) {
        const response = createResponse(false, undefined, {
          code: 'AUTHENTICATION_ERROR',
          message: 'User not authenticated'
        });
        return res.status(401).json(response);
      }

      const { year, page, limit } = req.query;
      const filters: PaymentFilters = {
        year: year ? parseInt(year as string) : undefined,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined
      };

      const payments = await this.paymentService.getPayments(req.userId, filters);

      const response = createResponse(true, {
        payments,
        pagination: {
          currentPage: filters.page || 1,
          totalPages: Math.ceil(payments.length / (filters.limit || 20)),
          totalItems: payments.length,
          itemsPerPage: filters.limit || 20
        }
      });
      res.status(200).json(response);
    } catch (error) {
      const response = createResponse(false, undefined, {
        code: 'PAYMENTS_RETRIEVAL_ERROR',
        message: 'Failed to retrieve payment records',
        details: [error instanceof Error ? error.message : 'Unknown error']
      });
      res.status(500).json(response);
    }
  };

  /**
   * GET /api/zakat/payments/:id
   * Get a specific payment record
   */
  getPayment = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.userId) {
        const response = createResponse(false, undefined, {
          code: 'AUTHENTICATION_ERROR',
          message: 'User not authenticated'
        });
        return res.status(401).json(response);
      }

      const { id } = req.params;
      const payment = await this.paymentService.getPayment(req.userId, id);

      if (!payment) {
        const response = createResponse(false, undefined, {
          code: 'PAYMENT_NOT_FOUND',
          message: 'Payment record not found'
        });
        return res.status(404).json(response);
      }

      const response = createResponse(true, { payment });
      res.status(200).json(response);
    } catch (error) {
      const response = createResponse(false, undefined, {
        code: 'PAYMENT_RETRIEVAL_ERROR',
        message: 'Failed to retrieve payment record',
        details: [error instanceof Error ? error.message : 'Unknown error']
      });
      res.status(500).json(response);
    }
  };

  /**
   * PUT /api/zakat/payments/:id
   * Update a payment record
   */
  updatePayment = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.userId) {
        const response = createResponse(false, undefined, {
          code: 'AUTHENTICATION_ERROR',
          message: 'User not authenticated'
        });
        return res.status(401).json(response);
      }

      const { id } = req.params;
      const updateData: UpdatePaymentDto = req.body;
      const payment = await this.paymentService.updatePayment(req.userId, id, updateData);

      const response = createResponse(true, { payment });
      res.status(200).json(response);
    } catch (error) {
      const response = createResponse(false, undefined, {
        code: 'PAYMENT_UPDATE_ERROR',
        message: 'Failed to update payment record',
        details: [error instanceof Error ? error.message : 'Unknown error']
      });
      res.status(400).json(response);
    }
  };

  /**
   * DELETE /api/zakat/payments/:id
   * Delete a payment record
   */
  deletePayment = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.userId) {
        const response = createResponse(false, undefined, {
          code: 'AUTHENTICATION_ERROR',
          message: 'User not authenticated'
        });
        return res.status(401).json(response);
      }

      const { id } = req.params;
      await this.paymentService.deletePayment(req.userId, id);

      const response = createResponse(true, { message: 'Payment record deleted successfully' });
      res.status(200).json(response);
    } catch (error) {
      const response = createResponse(false, undefined, {
        code: 'PAYMENT_DELETION_ERROR',
        message: 'Failed to delete payment record',
        details: [error instanceof Error ? error.message : 'Unknown error']
      });
      res.status(400).json(response);
    }
  };

  /**
   * GET /api/zakat/payments/:id/receipt
   * Generate payment receipt
   */
  getReceipt = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.userId) {
        const response = createResponse(false, undefined, {
          code: 'AUTHENTICATION_ERROR',
          message: 'User not authenticated'
        });
        return res.status(401).json(response);
      }

      const { id } = req.params;
      const payment = await this.paymentService.getPayment(req.userId, id);

      if (!payment) {
        const response = createResponse(false, undefined, {
          code: 'PAYMENT_NOT_FOUND',
          message: 'Payment record not found'
        });
        return res.status(404).json(response);
      }

      // Generate receipt data
      const receipt = {
        paymentId: payment.id,
        amount: payment.amount,
        paymentDate: payment.paymentDate,
        recipient: payment.recipient,
        notes: payment.notes,
        calculationId: payment.calculationId,
        receiptUrl: payment.receiptUrl,
        generatedAt: new Date().toISOString()
      };

      const response = createResponse(true, { receipt });
      res.status(200).json(response);
    } catch (error) {
      const response = createResponse(false, undefined, {
        code: 'RECEIPT_GENERATION_ERROR',
        message: 'Failed to generate payment receipt',
        details: [error instanceof Error ? error.message : 'Unknown error']
      });
      res.status(500).json(response);
    }
  };
}