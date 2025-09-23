import { Asset, AssetCategoryType, AssetFormData } from '@zakapp/shared';

// Base API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Types for API responses
export interface AssetStatistics {
  totalAssets: number;
  totalValue: number;
  totalZakatEligible: number;
  assetsByCategory: Record<
    string,
    {
      count: number;
      totalValue: number;
      zakatEligibleValue: number;
    }
  >;
  assetsByCurrency: Record<
    string,
    {
      count: number;
      totalValue: number;
    }
  >;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

// Helper to get auth token (placeholder for now)
const getAuthToken = (): string | null => {
  // Use the same token key as the auth context
  const token = localStorage.getItem('zakapp_token');
  if (!token) {
    // Set a mock token for development
    const mockToken = 'mock-dev-token-user1';
    localStorage.setItem('zakapp_token', mockToken);
    return mockToken;
  }
  return token;
};

// Helper to make authenticated API requests
const apiRequest = async <T>(
  endpoint: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
  } = {}
): Promise<T> => {
  const token = getAuthToken();

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'GET',
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(
      `API request failed: ${response.status} ${response.statusText}`
    );
  }

  const data: ApiResponse<T> = await response.json();

  if (!data.success) {
    throw new Error(data.error?.message || 'API request failed');
  }

  return data.data as T;
};

export const assetService = {
  // Get all user assets
  async getUserAssets(): Promise<Asset[]> {
    const response = await apiRequest<{ assets: Asset[] }>('/api/v1/assets');
    return response.assets;
  },

  // Get asset statistics
  async getAssetStatistics(): Promise<AssetStatistics> {
    const response = await apiRequest<{ statistics: AssetStatistics }>(
      '/api/v1/assets/statistics'
    );
    return response.statistics;
  },

  // Get assets grouped by category
  async getGroupedAssets(): Promise<Record<string, Asset[]>> {
    const response = await apiRequest<{
      groupedAssets: Record<string, Asset[]>;
    }>('/api/v1/assets/grouped');
    return response.groupedAssets;
  },

  // Get assets by specific category
  async getAssetsByCategory(category: AssetCategoryType): Promise<Asset[]> {
    const response = await apiRequest<{ assets: Asset[] }>(
      `/api/v1/assets?category=${category}`
    );
    return response.assets;
  },

  // Create a new asset
  async createAsset(assetData: AssetFormData): Promise<Asset> {
    const response = await apiRequest<{ asset: Asset }>('/api/v1/assets', {
      method: 'POST',
      body: JSON.stringify(assetData),
    });
    return response.asset;
  },

  // Update an existing asset
  async updateAsset(assetId: string, assetData: AssetFormData): Promise<Asset> {
    const response = await apiRequest<{ asset: Asset }>(
      `/api/v1/assets/${assetId}`,
      {
        method: 'PUT',
        body: JSON.stringify(assetData),
      }
    );
    return response.asset;
  },

  // Delete an asset
  async deleteAsset(assetId: string): Promise<void> {
    await apiRequest<void>(`/api/v1/assets/${assetId}`, {
      method: 'DELETE',
    });
  },

  // Get asset history
  async getAssetHistory(assetId?: string): Promise<any[]> {
    const endpoint = assetId
      ? `/api/v1/assets/history?assetId=${assetId}`
      : '/api/v1/assets/history';
    const response = await apiRequest<{ history: any[] }>(endpoint);
    return response.history;
  },
};
