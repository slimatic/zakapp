import { Asset, AssetCategoryType } from '@zakapp/shared';

// Export commonly used types and schemas from shared package
export {
  // Base asset types
  Asset,
  AssetCategoryType,
  SpecificAsset,

  // Specific asset types
  CashAsset,
  GoldAsset,
  SilverAsset,
  BusinessAsset,
  PropertyAsset,
  StocksAsset,
  CryptoAsset,
  DebtAsset,
  ExpensesAsset,

  // Category and subcategory types
  AssetCategory,
  AssetSubCategory,

  // Schema types
  CreateAssetRequest,
  UpdateAssetRequest,
  GenericAsset,
  AssetCategoryData,

  // Zod schemas
  assetSchema,
  createAssetRequestSchema,
  updateAssetRequestSchema,
  genericAssetSchema,
  assetCategorySchema,

  // Specific asset schemas
  cashAssetSchema,
  goldAssetSchema,
  silverAssetSchema,
  businessAssetSchema,
  propertyAssetSchema,
  stocksAssetSchema,
  cryptoAssetSchema,
  debtsAssetSchema,
  expensesAssetSchema,
} from '@zakapp/shared';

// Backend-specific interfaces that extend shared types
export interface StoredAsset extends Asset {
  userId: string;
}

export interface AssetHistory {
  historyId: string;
  assetId: string;
  userId: string;
  action: 'created' | 'updated' | 'deleted';
  changes?: Partial<Asset>;
  previousValues?: Partial<Asset>;
  timestamp: string;
}

export interface AssetFilters {
  category?: AssetCategoryType;
  year?: string;
  zakatEligible?: boolean;
  subCategory?: string;
  minValue?: number;
  maxValue?: number;
  currency?: string;
}

export interface AssetSummary {
  totalAssets: number;
  totalValue: number;
  totalZakatEligible: number;
  assetsByCategory: Record<
    AssetCategoryType,
    {
      count: number;
      totalValue: number;
      zakatEligibleValue: number;
    }
  >;
}

// Database model interfaces (if using a proper database later)
export interface AssetModel {
  id: string;
  userId: string;
  assetData: Asset;
  createdAt: Date;
  updatedAt: Date;
}

// Service response types
export interface AssetServiceResponse<T = Asset> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedAssetResponse {
  assets: Asset[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}
