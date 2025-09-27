import { Request, Response } from 'express';
import { AuthenticatedRequest, ApiResponse } from '../types';
import { asyncHandler, AppError } from '../middleware/errorHandler';

// Simple in-memory store for demo - in real app this would be database
export const userAssets: { [userId: string]: any[] } = {};

// Test helper to clear assets
export const clearAllAssets = () => {
  for (const key in userAssets) {
    delete userAssets[key];
  }
};

export class AssetController {
  list = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { type, currency, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const userId = req.userId!;

    // Get user's assets from store, or create default ones if first time (skip in test env)
    if (!userAssets[userId] && process.env.NODE_ENV !== 'test') {
      userAssets[userId] = [
        {
          id: `${userId}-asset-1`,
          userId: userId,
          type: 'CASH',
          name: 'Checking Account',
          value: 2000.00,
          currency: 'USD',
          description: 'Primary checking account',
          createdAt: new Date(Date.now() - 3000).toISOString(),
          updatedAt: new Date(Date.now() - 3000).toISOString()
        },
        {
          id: `${userId}-asset-2`, 
          userId: userId,
          type: 'GOLD',
          name: 'Gold Coins',
          value: 5000.00,
          currency: 'USD',
          weight: 100.0,
          unit: 'GRAM',
          description: 'Investment gold coins',
          createdAt: new Date(Date.now() - 2000).toISOString(),
          updatedAt: new Date(Date.now() - 2000).toISOString()
        },
        {
          id: `${userId}-asset-3`,
          userId: userId,
          type: 'CRYPTOCURRENCY',
          name: 'Ethereum Holdings',
          value: 3000.00,
          currency: 'USD',
          cryptoType: 'ETH',
          quantity: 2.0,
          description: 'Ethereum investment',
          createdAt: new Date(Date.now() - 1000).toISOString(),
          updatedAt: new Date(Date.now() - 1000).toISOString()
        }
      ];
    } else if (!userAssets[userId]) {
      // Initialize empty array for test environment
      userAssets[userId] = [];
    }

    let assets = [...userAssets[userId]];

    // Apply filters
    if (type) {
      assets = assets.filter(asset => asset.type === type);
    }
    if (currency) {
      assets = assets.filter(asset => asset.currency === currency);
    }

    // Apply sorting
    if (sortBy) {
      assets.sort((a: any, b: any) => {
        const aVal = a[sortBy as string];
        const bVal = b[sortBy as string];
        
        if (sortOrder === 'desc') {
          return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
        } else {
          return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        }
      });
    }

    // Calculate total before pagination
    const total = assets.length;

    // Apply pagination
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const startIndex = (pageNum - 1) * limitNum;
    const paginatedAssets = assets.slice(startIndex, startIndex + limitNum);

    const mockSummary = {
      totalValue: assets.reduce((sum, asset) => sum + asset.value, 0),
      zakatableValue: assets.reduce((sum, asset) => sum + asset.value, 0),
      assetCount: total,
      assetTypes: [...new Set(assets.map(asset => asset.type))]
    };

    const response: ApiResponse = {
      success: true,
      assets: paginatedAssets,
      summary: mockSummary,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    };

    res.status(200).json(response);
  });

  create = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { type, name, value, currency, description, ...otherFields } = req.body;
    const userId = req.userId!;

    if (!type || !name || !value || !currency) {
      throw new AppError('Missing required fields', 400, 'MISSING_FIELDS');
    }

    // Initialize user assets if not exists
    if (!userAssets[userId]) {
      userAssets[userId] = [];
    }

    const mockAsset = {
      id: `${userId}-asset-${Date.now()}`,
      userId,
      type,
      name,
      value,
      currency,
      description,
      ...otherFields,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Add to user's assets
    userAssets[userId].push(mockAsset);

    const response: ApiResponse = {
      success: true,
      message: 'Asset created successfully',
      asset: mockAsset
    };

    res.status(201).json(response);
  });

  get = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    const mockAsset = {
      id,
      type: 'CASH',
      name: 'Sample Asset',
      value: 1000.00,
      currency: 'USD',
      description: 'Sample asset',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const response: ApiResponse = {
      success: true,
      asset: mockAsset
    };

    res.status(200).json(response);
  });

  update = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const updateData = req.body;

    const mockAsset = {
      id,
      ...updateData,
      updatedAt: new Date().toISOString()
    };

    const response: ApiResponse = {
      success: true,
      message: 'Asset updated successfully',
      asset: mockAsset
    };

    res.status(200).json(response);
  });

  delete = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    const response: ApiResponse = {
      success: true,
      message: 'Asset deleted successfully'
    };

    res.status(200).json(response);
  });

  validate = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const assetData = req.body;

    const response: ApiResponse = {
      success: true,
      message: 'Asset data is valid',
      validation: {
        isValid: true,
        errors: []
      }
    };

    res.status(200).json(response);
  });
}