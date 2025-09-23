import { Asset, AssetCategoryType } from '@zakapp/shared';
import { AssetStatistics } from '../services/assetService';

// Shared mock assets data
export const mockAssets: Asset[] = [
  {
    assetId: '1',
    name: 'Primary Savings Account',
    category: 'cash',
    subCategory: 'savings',
    value: 25000,
    currency: 'USD',
    description: 'Main savings account for emergency fund',
    zakatEligible: true,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    assetId: '2',
    name: 'Gold Investment',
    category: 'gold',
    subCategory: 'jewelry',
    value: 15000,
    currency: 'USD',
    description: 'Gold jewelry and investment pieces',
    zakatEligible: true,
    createdAt: '2024-01-10T09:00:00Z',
    updatedAt: '2024-01-10T09:00:00Z',
  },
  {
    assetId: '3',
    name: 'Stock Portfolio',
    category: 'stocks',
    subCategory: 'shares',
    value: 45000,
    currency: 'USD',
    description: 'Diversified stock portfolio',
    zakatEligible: true,
    createdAt: '2024-01-05T14:30:00Z',
    updatedAt: '2024-01-20T11:15:00Z',
  },
];

// Generate mock statistics from mock assets
export const generateMockStatistics = (assets: Asset[] = mockAssets): AssetStatistics => {
  const totalAssets = assets.length;
  const totalValue = assets.reduce((sum, asset) => sum + asset.value, 0);
  const totalZakatEligible = assets.filter(asset => asset.zakatEligible)
    .reduce((sum, asset) => sum + asset.value, 0);

  const assetsByCategory: Record<string, { count: number; totalValue: number; zakatEligibleValue: number; }> = {};
  const assetsByCurrency: Record<string, { count: number; totalValue: number; }> = {};

  assets.forEach(asset => {
    // By category
    if (!assetsByCategory[asset.category]) {
      assetsByCategory[asset.category] = { count: 0, totalValue: 0, zakatEligibleValue: 0 };
    }
    assetsByCategory[asset.category].count++;
    assetsByCategory[asset.category].totalValue += asset.value;
    if (asset.zakatEligible) {
      assetsByCategory[asset.category].zakatEligibleValue += asset.value;
    }

    // By currency
    if (!assetsByCurrency[asset.currency]) {
      assetsByCurrency[asset.currency] = { count: 0, totalValue: 0 };
    }
    assetsByCurrency[asset.currency].count++;
    assetsByCurrency[asset.currency].totalValue += asset.value;
  });

  return {
    totalAssets,
    totalValue,
    totalZakatEligible,
    assetsByCategory,
    assetsByCurrency,
  };
};

// Generate mock grouped assets
export const generateMockGroupedAssets = (assets: Asset[] = mockAssets) => {
  const grouped: Record<AssetCategoryType, Asset[]> = {} as Record<AssetCategoryType, Asset[]>;
  
  assets.forEach(asset => {
    if (!grouped[asset.category]) {
      grouped[asset.category] = [];
    }
    grouped[asset.category].push(asset);
  });

  return grouped;
};