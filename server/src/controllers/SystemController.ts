import { Request, Response } from 'express';
import { ApiResponse } from '../types';
import { asyncHandler } from '../middleware/ErrorHandler';

export class SystemController {
  health = asyncHandler(async (req: Request, res: Response) => {
    const mockHealth = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0',
      database: {
        connected: true,
        responseTime: 5
      },
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        free: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
      }
    };

    const response: ApiResponse = {
      success: true,
      health: mockHealth
    };

    res.status(200).json(response);
  });

  getCurrencies = asyncHandler(async (req: Request, res: Response) => {
    const mockCurrencies = [
      {
        code: 'USD',
        name: 'US Dollar',
        symbol: '$',
        exchangeRate: 1.0
      },
      {
        code: 'EUR',
        name: 'Euro',
        symbol: '€',
        exchangeRate: 0.85
      },
      {
        code: 'GBP',
        name: 'British Pound',
        symbol: '£',
        exchangeRate: 0.73
      },
      {
        code: 'SAR',
        name: 'Saudi Riyal',
        symbol: 'ر.س',
        exchangeRate: 3.75
      }
    ];

    const response: ApiResponse = {
      success: true,
      currencies: mockCurrencies,
      lastUpdated: new Date().toISOString()
    };

    res.status(200).json(response);
  });

  getTimezones = asyncHandler(async (req: Request, res: Response) => {
    const mockTimezones = [
      {
        id: 'UTC',
        name: 'Coordinated Universal Time',
        offset: '+00:00'
      },
      {
        id: 'America/New_York',
        name: 'Eastern Time',
        offset: '-05:00'
      },
      {
        id: 'Europe/London',
        name: 'Greenwich Mean Time',
        offset: '+00:00'
      },
      {
        id: 'Asia/Riyadh',
        name: 'Arabia Standard Time',
        offset: '+03:00'
      }
    ];

    const response: ApiResponse = {
      success: true,
      timezones: mockTimezones
    };

    res.status(200).json(response);
  });
}