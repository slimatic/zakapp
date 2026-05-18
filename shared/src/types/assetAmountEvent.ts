/**
 * Asset Amount Event Types
 * Shared types for asset amount history tracking
 */

export type AssetAmountEventType = 'CREATED' | 'UPDATED' | 'CORRECTION' | 'BACKPORT';
export type EventSource = 'manual' | 'import' | 'api';

export interface AssetAmountEvent {
  id: string;
  assetId: string;
  eventType: AssetAmountEventType;
  amount: number;
  currency: string;
  effectiveDate: string; // ISO date string
  recordedAt: string; // ISO date string
  userId: string;
  description?: string;
  source?: EventSource;
  metadata?: Record<string, unknown>;
  isReversed: boolean;
  originalEventId?: string;
  asset?: {
    id: string;
    name: string;
    category: string;
  };
}

export interface AssetAmountSnapshot {
  id: string;
  assetId: string;
  date: string; // ISO date string
  amount: number;
  eventCount: number;
  createdAt: string;
}

export interface CreateAssetAmountEventRequest {
  eventType: AssetAmountEventType;
  amount: number;
  effectiveDate: string;
  description?: string;
  source?: EventSource;
  metadata?: Record<string, unknown>;
}

export interface BackportEntry {
  amount: number;
  effectiveDate: string;
  description?: string;
}

export interface BackportRequest {
  entries: BackportEntry[];
}

export interface AssetHistoryQueryParams {
  startDate?: string;
  endDate?: string;
  eventType?: string;
  limit?: number;
}

export interface WealthAtDateRequest {
  date: string;
}

export interface WealthTimeSeriesRequest {
  startDate: string;
  endDate: string;
  interval?: 'daily' | 'weekly' | 'monthly';
}

// API Response types
export interface AssetHistoryResponse {
  success: boolean;
  data: AssetAmountEvent[];
}

export interface AmountAtDateResponse {
  success: boolean;
  data: {
    amount: number | null;
    date: string;
  };
}

export interface BackportResponse {
  success: boolean;
  data: {
    events: AssetAmountEvent[];
    count: number;
  };
}

export interface WealthAtDateResponse {
  success: boolean;
  data: {
    date: string;
    totalWealth: number;
    totalZakatableWealth: number;
    breakdown: {
      cash: number;
      gold: number;
      silver: number;
      business: number;
      crypto: number;
      investments: number;
      receivables: number;
      other: number;
    };
  };
}

export interface WealthTimeSeriesResponse {
  success: boolean;
  data: Array<{
    date: string;
    wealth: {
      totalWealth: number;
      totalZakatableWealth: number;
      breakdown: {
        cash: number;
        gold: number;
        silver: number;
        business: number;
        crypto: number;
        investments: number;
        receivables: number;
        other: number;
      };
    };
  }>;
}
