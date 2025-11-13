/**
 * Shared TypeScript types for Tracking & Analytics feature
 * Defines interfaces for all 5 entities used across backend and frontend
 */

/**
 * Status of a yearly Zakat calculation snapshot
 */
export type SnapshotStatus = 'draft' | 'finalized';

/**
 * Type of nisab threshold used for calculation
 */
export type NisabType = 'gold' | 'silver';

/**
 * Zakat methodology types for yearly snapshots
 * Defines the calculation approach used for Zakat
 */
export type YearlySnapshotMethodology = 'Standard' | 'Hanafi' | 'Shafii' | 'Custom';

/**
 * Yearly Snapshot interface

/**
 * YearlySnapshot entity - Historical Zakat calculation snapshot
 */
export interface YearlySnapshot {
  id: string;
  userId: string;
  calculationDate: Date | string;
  gregorianYear: number;
  gregorianMonth: number;
  gregorianDay: number;
  hijriYear: number;
  hijriMonth: number;
  hijriDay: number;
  totalWealth: number; // Encrypted in DB
  totalLiabilities: number; // Encrypted in DB
  zakatableWealth: number; // Encrypted in DB
  zakatAmount: number; // Encrypted in DB
  methodologyUsed: YearlySnapshotMethodology;
  nisabThreshold: number; // Encrypted in DB
  nisabType: NisabType;
  status: SnapshotStatus;
  assetBreakdown?: Record<string, any>; // Encrypted JSON in DB
  calculationDetails?: Record<string, any>; // Encrypted JSON in DB
  userNotes?: string; // Encrypted in DB
  isPrimary: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

/**
 * Create YearlySnapshot DTO
 */
export interface CreateYearlySnapshotDto {
  calculationDate: Date | string;
  gregorianYear: number;
  gregorianMonth?: number;
  gregorianDay?: number;
  hijriYear: number;
  hijriMonth?: number;
  hijriDay?: number;
  totalWealth: number;
  totalLiabilities: number;
  zakatableWealth?: number;
  zakatAmount: number;
  methodologyUsed: YearlySnapshotMethodology;
  nisabThreshold: number;
  nisabType: NisabType;
  status?: SnapshotStatus;
  assetBreakdown?: Record<string, any>;
  calculationDetails?: Record<string, any>;
  userNotes?: string;
  isPrimary?: boolean;
}

/**
 * Update YearlySnapshot DTO
 */
export interface UpdateYearlySnapshotDto {
  totalWealth?: number;
  totalLiabilities?: number;
  zakatAmount?: number;
  methodologyUsed?: YearlySnapshotMethodology;
  assetBreakdown?: Record<string, any>;
  calculationDetails?: Record<string, any>;
  userNotes?: string;
}

/**
 * Payment record recipient type
 */
export type RecipientType = 'individual' | 'charity' | 'organization' | 'institution';

/**
 * Islamic Zakat recipient category (8 categories from Quran)
 */
export type RecipientCategory =
  | 'fakir' // The poor
  | 'miskin' // The needy
  | 'amil' // Zakat administrators
  | 'muallaf' // Those whose hearts are to be reconciled
  | 'riqab' // Those in bondage (slaves and captives)
  | 'gharimin' // Those in debt
  | 'fisabilillah' // In the cause of Allah
  | 'ibnus_sabil'; // The wayfarer (stranded traveler)

/**
 * Payment method
 */
export type PaymentMethod = 'cash' | 'bank_transfer' | 'check' | 'online' | 'other';

/**
 * Payment status
 */
export type PaymentStatus = 'recorded' | 'verified';

/**
 * PaymentRecord entity - Zakat payment distribution record
 */
export interface PaymentRecord {
  id: string;
  userId: string;
  snapshotId: string;
  amount: number; // Encrypted in DB
  paymentDate: Date | string;
  recipientName: string; // Encrypted in DB
  recipientType: RecipientType;
  recipientCategory: RecipientCategory;
  notes?: string; // Encrypted in DB
  receiptReference?: string; // Encrypted in DB
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  currency: string;
  exchangeRate: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

/**
 * Create PaymentRecord DTO
 */
export interface CreatePaymentRecordDto {
  snapshotId: string;
  amount: number;
  paymentDate: Date | string;
  recipientName: string;
  recipientType: RecipientType;
  recipientCategory: RecipientCategory;
  notes?: string;
  receiptReference?: string;
  paymentMethod: PaymentMethod;
  status?: PaymentStatus;
  currency?: string;
  exchangeRate?: number;
}

/**
 * Analytics metric type
 */
export type AnalyticsMetricType =
  | 'wealth_trend' // Wealth over time
  | 'zakat_trend' // Zakat payments over time
  | 'payment_distribution' // By recipient category
  | 'asset_composition' // Asset breakdown
  | 'yearly_comparison' // Year-over-year comparison
  | 'nisab_compliance' // Nisab threshold tracking
  | 'payment_consistency'; // Payment regularity

/**
 * Visualization type for metrics
 */
export type VisualizationType =
  | 'line_chart'
  | 'bar_chart'
  | 'pie_chart'
  | 'area_chart'
  | 'table';

/**
 * AnalyticsMetric entity - Cached analytics calculations
 */
export interface AnalyticsMetric {
  id: string;
  userId: string;
  metricType: AnalyticsMetricType;
  startDate: Date | string;
  endDate: Date | string;
  calculatedValue: Record<string, any>; // Encrypted JSON in DB
  visualizationType: VisualizationType;
  parameters: Record<string, any>; // JSON
  calculatedAt: Date | string;
  expiresAt: Date | string;
  version: number;
}

/**
 * AnnualSummary entity - Comprehensive yearly report
 */
export interface AnnualSummary {
  id: string;
  userId: string;
  snapshotId: string;
  gregorianYear: number;
  hijriYear: number;
  startDate: Date | string;
  endDate: Date | string;
  totalZakatCalculated: number; // Encrypted in DB
  totalZakatPaid: number; // Encrypted in DB
  outstandingZakat: number; // Encrypted in DB
  numberOfPayments: number;
  recipientSummary: RecipientSummary; // Encrypted JSON in DB
  assetBreakdown: Record<string, any>; // Encrypted JSON in DB
  comparativeAnalysis?: ComparativeAnalysis; // Encrypted JSON in DB
  methodologyUsed: YearlySnapshotMethodology;
  nisabInfo: Record<string, any>; // Encrypted JSON in DB
  userNotes?: string; // Encrypted in DB
  generatedAt: Date | string;
  version: number;
}

/**
 * Recipient summary structure
 */
export interface RecipientSummary {
  byType: Array<{
    type: RecipientType;
    count: number;
    totalAmount: number;
  }>;
  byCategory: Array<{
    category: RecipientCategory;
    count: number;
    totalAmount: number;
  }>;
  uniqueRecipients: number;
  averagePayment: number;
}

/**
 * Comparative analysis structure
 */
export interface ComparativeAnalysis {
  previousYear: {
    year: number;
    wealth: number;
    zakat: number;
    paid: number;
  };
  currentYear: {
    year: number;
    wealth: number;
    zakat: number;
    paid: number;
  };
  changes: {
    wealthChange: number;
    wealthChangePercent: number;
    zakatChange: number;
    zakatChangePercent: number;
    paymentConsistency: 'improved' | 'maintained' | 'declined';
  };
}

/**
 * Reminder event type
 */
export type ReminderEventType =
  | 'zakat_anniversary_approaching'
  | 'calculation_overdue'
  | 'payment_incomplete'
  | 'yearly_comparison_available'
  | 'data_backup_reminder'
  | 'methodology_review';

/**
 * Reminder priority
 */
export type ReminderPriority = 'high' | 'medium' | 'low';

/**
 * Reminder status
 */
export type ReminderStatus = 'pending' | 'shown' | 'acknowledged' | 'dismissed';

/**
 * ReminderEvent entity - Dashboard notifications
 */
export interface ReminderEvent {
  id: string;
  userId: string;
  eventType: ReminderEventType;
  triggerDate: Date | string;
  title: string;
  message: string;
  priority: ReminderPriority;
  status: ReminderStatus;
  relatedSnapshotId?: string;
  metadata?: Record<string, any>; // JSON
  acknowledgedAt?: Date | string;
  createdAt: Date | string;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Pagination result
 */
export interface PaginationResult<T> {
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

/**
 * Snapshot comparison request
 */
export interface SnapshotComparisonRequest {
  snapshotIds: string[];
}

/**
 * Snapshot comparison result
 */
export interface SnapshotComparisonResult {
  snapshots: YearlySnapshot[];
  analysis: {
    wealthTrend: 'increasing' | 'decreasing' | 'stable';
    averageGrowthRate: number;
    zakatConsistency: 'excellent' | 'good' | 'inconsistent';
  };
}

/**
 * Calendar date with both Gregorian and Hijri
 */
export interface DualCalendarDate {
  gregorian: {
    year: number;
    month: number;
    day: number;
    date: Date;
  };
  hijri: {
    year: number;
    month: number;
    day: number;
  };
}
