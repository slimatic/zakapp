/**
 * Test Helper Utilities
 * Provides consistent test data structures across all integration tests
 */

/**
 * Creates a valid asset payload for POST /api/assets
 * Maps test-friendly parameters to actual API requirements
 */
export function createAssetPayload(params: {
  name: string;
  category: 'cash' | 'gold' | 'silver' | 'crypto' | 'business' | 'investment' | 'property' | 'other';
  value: number;
  currency?: string;
  acquisitionDate?: Date;
  notes?: string;
  isPassiveInvestment?: boolean;
  isRestrictedAccount?: boolean;
}) {
  return {
    name: params.name,
    category: params.category,
    value: params.value,
    currency: params.currency || 'USD',
    acquisitionDate: params.acquisitionDate || new Date(),
    notes: params.notes,
    isPassiveInvestment: params.isPassiveInvestment || false,
    isRestrictedAccount: params.isRestrictedAccount || false,
  };
}

/**
 * Creates an update payload for PUT /api/assets/:id
 */
export function createAssetUpdatePayload(params: {
  value?: number;
  name?: string;
  notes?: string;
}) {
  return {
    ...(params.value !== undefined && { value: params.value }),
    ...(params.name && { name: params.name }),
    ...(params.notes && { notes: params.notes }),
  };
}

/**
 * Extracts asset ID from response
 */
export function extractAssetId(response: any): string {
  // Handle both response formats
  return response.body.asset?.id || response.body.data?.asset?.id || response.body.id;
}

/**
 * Extracts asset value from response
 */
export function extractAssetValue(response: any): number {
  return response.body.asset?.value || response.body.data?.asset?.value || response.body.value;
}
