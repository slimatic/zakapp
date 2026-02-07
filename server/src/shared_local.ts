import { z } from 'zod';

// Payment validation schemas
export const createPaymentSchema = z.object({
    amount: z.number().positive(),
    recipientName: z.string().optional(),
    recipientCategory: z.enum(['fakir', 'miskin', 'amil', 'muallaf', 'riqab', 'gharimin', 'fisabilillah', 'ibnus_sabil']),
    recipientType: z.enum(['individual', 'charity', 'organization', 'institution']).optional(),
    paymentMethod: z.enum(['cash', 'bank_transfer', 'check', 'online', 'other']),
    paymentDate: z.date().or(z.string()),
    status: z.enum(['recorded', 'verified']).optional(),
    notes: z.string().optional(),
    receiptReference: z.string().optional(),
    snapshotId: z.string().optional(),
    currency: z.string().optional(),
    exchangeRate: z.number().optional()
});

export const updatePaymentSchema = createPaymentSchema.partial();

export const paymentQuerySchema = z.object({
    page: z.number().optional(),
    limit: z.number().optional(),
    status: z.enum(['recorded', 'verified']).optional(),
    snapshotId: z.string().optional()
});

export const PASSIVE_INVESTMENT_TYPES = [
    'STOCK',
    'ETF',
    'MUTUAL_FUND',
    'ROTH_IRA',
] as const;

export const RESTRICTED_ACCOUNT_TYPES = [
    '401K',
    'TRADITIONAL_IRA',
    'PENSION',
    'ROTH_IRA',
] as const;

export const ASSET_CATEGORIES = {
    ZAKATABLE: [
        'CASH',
        'BANK_ACCOUNT',
        'GOLD',
        'SILVER',
        'CRYPTOCURRENCY',
        'BUSINESS_INVENTORY',
        'INVESTMENT_ACCOUNT',
        'LOAN_RECEIVABLE',
    ] as const,
    NON_ZAKATABLE: [
        'PRIMARY_RESIDENCE',
        'PERSONAL_VEHICLE',
        'HOUSEHOLD_ITEMS',
        'PROFESSIONAL_EQUIPMENT',
    ] as const,
    PARTIAL: [
        'RENTAL_PROPERTY',
        'BUSINESS_FIXED_ASSETS',
        'LIVESTOCK',
    ] as const,
} as const;

export const VALID_ASSET_CATEGORY_VALUES = [
    ...ASSET_CATEGORIES.ZAKATABLE,
    ...ASSET_CATEGORIES.NON_ZAKATABLE,
    ...ASSET_CATEGORIES.PARTIAL,
] as const;

export const CalculationModifier = {
    RESTRICTED: 0,
    PASSIVE: 0.3,
    FULL: 1.0,
} as const;

// Types needed for Zakat Engine
export interface MethodologyComparisonRequest {
    method?: string;
    methodologies?: string[];
    customConfigIds?: string[];
    referenceDate?: string;
    amount?: number;
}

export interface MethodologyComparison {
    id?: string;
    name?: string;
    description?: string;
    zakatRate?: number;
    totalWealth?: number;
    nisabThreshold?: number;
    zakatDue?: number;
    methodology?: any;
    methodologyConfigId?: string;
    isAboveNisab?: boolean;
    difference?: any;
    nisabBasis?: string;
    businessAssetTreatment?: string;
    debtDeduction?: string;
    calendarSupport?: string[];
    scholarlyBasis?: string[];
    regions?: string[];
    suitableFor?: string[];
    pros?: string[];
    cons?: string[];
    explanation?: string;
}

export interface CalendarCalculation {
    date?: Date;
    hijriDate: string | { year: number; month: number; day: number; monthName: string; };
    isRamadan?: boolean;
    gregorianDate?: Date;
    calculationPeriod?: "lunar" | "solar";
    adjustmentFactor?: number;
}

export interface CalculationBreakdown {
    assets?: any[];
    liabilities?: any[];
    nisabThreshold?: number;
    zakatableAmount?: number;
    zakatDue?: number;
    method?: string;
    nisabCalculation?: any;
    finalCalculation?: any;
    assetCalculations?: any[];
    sources?: any[];
    methodology?: any;
}

export interface AlternativeCalculation {
    methodId: string;
    methodName: string;
    zakatDue: number;
    differences: any;
    effectiveNisab?: number;
}

export type SnapshotStatus = 'draft' | 'finalized';
export type YearlySnapshotMethodology = 'Standard' | 'Hanafi' | 'Shafii' | 'Custom';
export type NisabType = 'gold' | 'silver';
export type ZakatMethodologyValue = 'Standard' | 'Hanafi' | 'Maliki' | 'Shafii' | 'Hanbali';
export type ZakatMethodology = ZakatMethodologyValue | { id: string };

export interface RecipientSummary {
    byType: Array<{ type: RecipientType; count: number; totalAmount: number }>;
    byCategory: Array<{ category: RecipientCategory; count: number; totalAmount: number }>;
    uniqueRecipients: number;
    averagePayment: number;
}

export interface ComparativeAnalysis {
    previousYear: { year: number; wealth: number; zakat: number; paid: number };
    currentYear: { year: number; wealth: number; zakat: number; paid: number };
    changes: {
        wealthChange: number;
        wealthChangePercent: number;
        zakatChange: number;
        zakatChangePercent: number;
        paymentConsistency: 'improved' | 'maintained' | 'declined';
    };
}

export interface AnnualSummary {
    id: string;
    userId: string;
    snapshotId: string;
    gregorianYear: number;
    hijriYear: number;
    startDate: Date;
    endDate: Date;
    totalZakatCalculated: number;
    totalZakatPaid: number;
    outstandingZakat: number;
    numberOfPayments: number;
    recipientSummary: RecipientSummary;
    assetBreakdown: Record<string, any>;
    comparativeAnalysis?: ComparativeAnalysis;
    methodologyUsed: ZakatMethodology;
    nisabInfo: Record<string, any>;
    userNotes?: string;
    version: number;
    createdAt: Date;
    updatedAt: Date;
}

export type ReminderEventType = 'zakat_anniversary_approaching' | 'calculation_overdue' | 'payment_incomplete' | 'yearly_comparison_available' | 'data_backup_reminder' | 'methodology_review' | 'custom';
export type ReminderPriority = 'low' | 'medium' | 'high' | 'urgent';
export type ReminderStatus = 'pending' | 'shown' | 'acknowledged' | 'dismissed';

export interface ReminderEvent {
    id: string;
    userId: string;
    eventType: ReminderEventType;
    triggerDate: Date;
    title: string;
    message: string;
    priority: ReminderPriority;
    status: ReminderStatus;
    relatedSnapshotId?: string;
    metadata?: Record<string, any>;
    shownAt?: Date;
    acknowledgedAt?: Date;
    dismissedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface AnalyticsSummary {
    totalWealth: number;
    totalLiabilities: number;
    netWealth: number;
    zakatDue: number;
    zakatPaid: number;
    outstandingZakat: number;
    paymentCompliance: number;
}
export interface AnalyticsTrend {
    year: number;
    wealth: number;
    zakat: number;
}
export type AnalyticsMetricType = 'wealth' | 'zakat' | 'payment' | 'wealth_trend' | 'zakat_trend' | 'payment_distribution' | 'asset_composition' | 'yearly_comparison' | 'payment_consistency' | 'nisab_compliance';
export type VisualizationType = 'line_chart' | 'bar_chart' | 'pie_chart' | 'area_chart' | 'table';

export interface AnalyticsMetric {
    label: string;
    value: number;
    change: number;
    trend: 'up' | 'down' | 'neutral';
    type: AnalyticsMetricType;
    calculatedValue?: any;
    parameters?: any;
}

export type AuditEventType = 'login' | 'logout' | 'create' | 'update' | 'delete' | 'export' | 'admin_action' | 'system_event' | 'CREATED' | 'EDITED' | 'FINALIZED' | 'UNLOCKED' | 'REFINALIZED' | 'NISAB_ACHIEVED' | 'HAWL_INTERRUPTED';

export interface AuditTrailEntry {
    id: string;
    userId: string;
    eventType: AuditEventType;
    entityType?: string;
    entityId?: string;
    action?: string;
    metadata?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    nisabYearRecordId?: string;
    beforeState?: any;
    afterState?: any;
    changesSummary?: any;
    interruptionDetails?: any;
    timestamp?: Date;
    unlockReason?: string;
    notes?: string;
    reason?: string;
    createdAt?: Date;
    [key: string]: any;
}

export interface CreateAuditTrailEntryDto {
    eventType: AuditEventType;
    entityType: string;
    entityId: string;
    action: string;
    metadata?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
}

export interface SnapshotAssetValue {
    assetId: string;
    assetName: string;
    value: number;
    zakatableValue: number;
    zakatEligible: boolean;
}

export interface SnapshotComparison {
    currentSnapshot: YearlySnapshot;
    previousSnapshot?: YearlySnapshot;
    wealthChange: number;
    wealthChangePercent: number;
    zakatChange: number;
    zakatChangePercent: number;
}

export interface YearlySnapshot {
    id: string;
    userId: string;
    gregorianYear: number;
    hijriYear: number;
    hijriMonth: number;
    hijriDay: number;
    hijriMonthName: string;
    hijriDate: { year: number; month: number; day: number; monthName: string; };
    date: Date;
    calculationDate: Date;
    status: SnapshotStatus;
    nisabType: NisabType;
    methodologyUsed?: ZakatMethodology;
    totalWealth: number;
    totalLiabilities: number;
    zakatableWealth: number;
    zakatAmount: number;
    nisabThreshold: number;
    assetBreakdown: any;
    calculationDetails: any;
    userNotes?: string;
    version: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateYearlySnapshotDto {
    gregorianYear: number;
    gregorianMonth?: number;
    gregorianDay?: number;
    hijriYear?: number;
    hijriMonth?: number;
    hijriDay?: number;
    hijriMonthName?: string;
    date?: Date;
    calculationDate?: Date | string;
    status?: SnapshotStatus;
    totalWealth: number;
    totalLiabilities: number;
    zakatableWealth: number;
    zakatAmount: number;
    nisabThreshold: number;
    assetBreakdown: any;
    calculationDetails: any;
    userNotes?: string;
    methodologyUsed?: any;
    nisabType?: NisabType;
    isPrimary?: boolean;
}

export interface UpdateYearlySnapshotDto {
    status?: SnapshotStatus;
    userNotes?: string;
    totalWealth?: number;
    totalLiabilities?: number;
    zakatableWealth?: number;
    zakatAmount?: number;
    nisabThreshold?: number;
    assetBreakdown?: any;
    calculationDetails?: any;
    methodologyUsed?: any;
}

export interface PaginationParams {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export type PaymentStatus = 'recorded' | 'verified';
export type RecipientCategory = 'fakir' | 'miskin' | 'amil' | 'muallaf' | 'riqab' | 'gharimin' | 'fisabilillah' | 'ibnus_sabil';
export type RecipientType = 'individual' | 'charity' | 'organization' | 'institution';
export type PaymentMethod = 'cash' | 'bank_transfer' | 'check' | 'online' | 'other';

export interface PaymentRecord {
    id: string;
    userId: string;
    snapshotId?: string;
    amount: number;
    currency: string;
    exchangeRate: number;
    paymentDate: Date;
    recipientName?: string;
    recipientType: RecipientType;
    recipientCategory: RecipientCategory;
    paymentMethod: PaymentMethod;
    status: PaymentStatus;
    notes?: string;
    receiptReference?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreatePaymentRecordDto {
    snapshotId?: string;
    amount: number;
    currency?: string;
    exchangeRate?: number;
    paymentDate: Date;
    recipientName?: string;
    recipientType?: RecipientType;
    recipientCategory: RecipientCategory;
    paymentMethod: PaymentMethod;
    status?: PaymentStatus;
    notes?: string;
    receiptReference?: string;
}

export interface UpdatePaymentRecordDto {
    amount?: number;
    currency?: string;
    exchangeRate?: number;
    paymentDate?: Date;
    recipientName?: string;
    recipientType?: RecipientType;
    recipientCategory?: RecipientCategory;
    paymentMethod?: PaymentMethod;
    status?: PaymentStatus;
    notes?: string;
    receiptReference?: string;
}

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

export const NISAB_THRESHOLDS = {
    GOLD: 85,
    SILVER: 595,
    DATE: 653,
    GOLD_GRAMS: 85,
    SILVER_GRAMS: 595
};

export const ZAKAT_METHODS = {
    STANDARD: {
        id: 'standard',
        name: 'Standard Method (AAOIFI)',
        description: 'Internationally recognized dual nisab method',
        nisabBasis: 'dual_minimum',
        businessAssetTreatment: 'market_value',
        debtDeduction: 'immediate',
        scholarlyBasis: ['AAOIFI FAS 9', 'Contemporary consensus'],
        regions: ['International', 'Gulf States', 'Western countries'],
        zakatRate: 2.5,
        calendarSupport: ['lunar', 'solar'],
        customRules: false,
        suitableFor: [
            'Muslims in diverse global locations',
            'Those seeking internationally recognized standards',
            'Users preferring simplified calculations',
            'Multi-national Islamic finance institutions'
        ],
        pros: [
            'Modern consensus approach',
            'Internationally recognized standards',
            'Simplified calculation process',
            'Good for diverse geographic regions',
            'Supported by contemporary Islamic finance institutions',
            'Flexible nisab calculation based on market conditions'
        ],
        cons: [
            'May not align with specific regional traditions',
            'Simplified approach may not capture all nuances',
            'Requires trust in contemporary scholarly consensus',
            'Less historical precedent than traditional schools'
        ],
        explanation: 'The Standard method represents a modern consensus approach developed for contemporary global Muslim communities. It incorporates guidelines from Islamic finance institutions like AAOIFI and uses a dual minimum nisab approach, selecting the lower threshold between gold and silver to ensure accessibility while maintaining religious compliance.'
    },
    HANAFI: {
        id: 'hanafi',
        name: 'Hanafi School Method',
        description: 'Silver-based nisab with comprehensive business inclusion',
        nisabBasis: 'silver',
        businessAssetTreatment: 'comprehensive',
        debtDeduction: 'comprehensive',
        scholarlyBasis: ['Al-Hidayah', 'Classical Hanafi texts'],
        regions: ['Turkey', 'Central Asia', 'Indian subcontinent'],
        zakatRate: 2.5,
        calendarSupport: ['lunar', 'solar'],
        customRules: false,
        suitableFor: [
            'Muslims following Hanafi jurisprudence',
            'Residents of Turkey, Central Asia, and South Asia',
            'Business owners with diverse asset portfolios',
            'Those preferring comprehensive wealth assessment'
        ],
        pros: [
            'Lower nisab threshold ensures broader zakat eligibility',
            'Comprehensive business asset inclusion',
            'Flexible debt deduction approach',
            'Well-established scholarly precedent',
            'Thorough wealth assessment methodology',
            'Accommodates complex business structures'
        ],
        cons: [
            'May result in higher zakat amounts for some individuals',
            'Requires detailed business asset evaluation',
            'Complex debt assessment needed',
            'More time-intensive calculation process'
        ],
        explanation: 'The Hanafi method, based on the jurisprudence of Imam Abu Hanifa (699-767 CE), uses exclusively silver-based nisab thresholds and emphasizes comprehensive inclusion of business assets. This approach ensures broader zakat eligibility and thorough wealth assessment, making it particularly suitable for business owners and those with diverse asset portfolios.'
    },
    SHAFII: {
        id: 'shafii',
        name: 'Shafi\'i School Method',
        description: 'Detailed categorization with dual nisab',
        nisabBasis: 'dual_minimum',
        businessAssetTreatment: 'categorized',
        debtDeduction: 'conservative',
        scholarlyBasis: ['Al-Majmu\'', 'Shafi\'i jurisprudence'],
        regions: ['Southeast Asia', 'East Africa', 'Parts of Middle East'],
        zakatRate: 2.5,
        calendarSupport: ['lunar', 'solar'],
        customRules: false,
        suitableFor: [
            'Muslims following Shafi\'i jurisprudence',
            'Residents of Southeast Asia and East Africa',
            'Those preferring detailed asset categorization',
            'Users seeking methodical and systematic approach'
        ],
        pros: [
            'Balanced nisab calculation approach',
            'Detailed and precise asset categorization',
            'Conservative debt treatment provides certainty',
            'Strong methodological framework',
            'Well-suited for diverse asset types',
            'Systematic approach reduces calculation errors'
        ],
        cons: [
            'More complex asset categorization required',
            'Conservative debt approach may limit deductions',
            'Requires good understanding of different asset types',
            'May be less accessible for simple portfolios'
        ],
        explanation: 'The Shafi\'i method, founded by Imam al-Shafi\'i (767-820 CE), emphasizes systematic methodology and detailed asset categorization. It uses a dual minimum nisab approach while requiring precise classification of business assets and conservative debt treatment, making it ideal for those seeking methodical and thorough zakat calculations.'
    },
    MALIKI: {
        id: 'maliki',
        name: 'Maliki School Method',
        description: 'Community-focused approach with regional adaptation',
        nisabBasis: 'dual_flexible',
        businessAssetTreatment: 'comprehensive',
        debtDeduction: 'community_based',
        scholarlyBasis: ['Al-Mudawwana', 'Bidayat al-Mujtahid', 'Maliki jurisprudence'],
        regions: ['North Africa', 'West Africa', 'Sudan', 'Parts of Arabia'],
        zakatRate: 2.5,
        calendarSupport: ['lunar', 'solar'],
        customRules: false,
        suitableFor: [
            'Muslims following Maliki jurisprudence',
            'Residents of North and West Africa',
            'Agricultural communities',
            'Those preferring community-centric approaches'
        ],
        pros: [
            'Adapts to local economic conditions',
            'Strong agricultural asset handling',
            'Community-centric approach',
            'Flexible implementation based on regional needs',
            'Considers broader economic context',
            'Comprehensive trade goods treatment'
        ],
        cons: [
            'Requires regional economic data',
            'Complex adjustment mechanisms',
            'Less standardized across regions',
            'May be difficult to implement uniformly'
        ],
        explanation: 'The Maliki method, based on the jurisprudence of Imam Malik (711-795 CE), emphasizes community benefit and practical application. It allows for nisab adjustments based on regional economic conditions and provides detailed rules for agricultural zakat, making it particularly suitable for agricultural communities and regions with varying economic conditions.'
    },
    HANBALI: {
        id: 'hanbali',
        name: 'Hanbali School Method',
        description: 'Conservative gold-based approach with textual emphasis',
        nisabBasis: 'gold',
        businessAssetTreatment: 'categorized',
        debtDeduction: 'conservative',
        scholarlyBasis: ['Al-Mughni', 'Hanbali classical texts', 'Ibn Taymiyyah works'],
        regions: ['Saudi Arabia', 'Qatar', 'Parts of Gulf States'],
        zakatRate: 2.5,
        calendarSupport: ['lunar', 'solar'],
        customRules: false,
        suitableFor: [
            'Muslims following Hanbali jurisprudence',
            'Residents of Saudi Arabia and Gulf states',
            'Those preferring traditional textual approaches',
            'Users seeking conservative calculations'
        ],
        pros: [
            'Clear precedential basis from Quran and Hadith',
            'Consistent with traditional interpretations',
            'Simplified calculation logic',
            'Stable gold-based reference',
            'Conservative approach ensures compliance',
            'Well-established scholarly precedent'
        ],
        cons: [
            'May exclude lower-income individuals due to higher thresholds',
            'Less adaptive to modern financial instruments',
            'Limited flexibility for contemporary assets',
            'May not suit all economic contexts'
        ],
        explanation: 'The Hanbali method, founded by Imam Ahmad ibn Hanbal (780-855 CE), emphasizes textual adherence and conservative calculations. It prefers gold-based nisab calculations and takes a conservative approach to debt deductions, making it suitable for those seeking traditional, scripture-based zakat calculations with clear precedential foundations.'
    },
    CUSTOM: {
        id: 'custom',
        name: 'Custom Method',
        description: 'User-defined calculation parameters',
        nisabBasis: 'configurable',
        businessAssetTreatment: 'configurable',
        debtDeduction: 'configurable',
        scholarlyBasis: ['User consultation recommended'],
        regions: ['User-specific'],
        zakatRate: 2.5,
        calendarSupport: ['lunar', 'solar'],
        customRules: true,
        suitableFor: [
            'Muslims with unique circumstances requiring specialized calculations',
            'Those following specific regional practices not covered by standard methods',
            'Users with access to qualified Islamic scholars for consultation',
            'Communities with established local zakat practices'
        ],
        pros: [
            'Maximum flexibility for unique situations',
            'Can accommodate specific regional practices',
            'Allows for scholarly consultation integration',
            'Adaptable to changing circumstances',
        ],
        cons: [
            'Requires expert knowledge to configure correctly',
            'Higher risk of incorrect calculations',
            'Lack of standardized validation',
            'May require ongoing manual updates'
        ],
        explanation: 'The Custom method allows for specialized calculations tailored to unique individual or community needs. It offers maximum flexibility but requires significant user knowledge or scholarly consultation to ensure religious compliance and accuracy.'
    }
} as const;

// Mock types to satisfy imports
export type Asset = any;
export type AssetCalculation = any;
export type AssetCategoryType = any;
export type CalculationMethod = any;
export type User = any;
export type ZakatCalculation = any;
export type ZakatCalculationRequest = any;
export type ZakatCalculationResult = any;
export type MethodologyInfo = any;
export type MethodologyConfig = any;
export type CreateMethodologyConfig = any;
export type CalculationSnapshot = any;
export type CalculationSnapshotDetail = any;
export type CreateCalculationSnapshotRequest = any;
export type NisabInfo = any;
export type NisabYearRecord = any;
export type RecordStatus = 'DRAFT' | 'FINALIZED' | 'UNLOCKED';
export type NisabBasis = 'GOLD' | 'SILVER';
export type HawlStatus = 'ACTIVE' | 'COMPLETE' | 'INTERRUPTED' | 'TERMINATED';

export interface HawlInterruptionEvent {
    userId: string;
    recordId: string;
    timestamp: Date;
    previousWealth: number;
    currentWealth: number;
    nisabThreshold: number;
    daysCompleted: number;
    daysRemaining: number;
}

export interface HawlTrackingState {
    userId: string;
    recordId: string;
    status: HawlStatus;
    hawlStartDate: Date;
    hawlStartDateHijri: string;
    hawlCompletionDate: Date;
    hawlCompletionDateHijri: string;
    nisabBasis: NisabBasis;
    nisabThresholdAtStart: number;
    currentNisabThreshold: number;
    wealthAtStart: number;
    currentWealth: number;
    minimumWealthDuringPeriod: number;
    daysElapsed: number;
    daysRemaining: number;
    hawlProgress: number;
    isHawlComplete: boolean;
    priorInterruptions: number;
    lastUpdated: Date;
}

export interface LiveHawlData {
    recordId: string;
    userId: string;
    status: string;
    hawlStartDate: Date;
    hawlCompletionDate: Date;
    daysRemaining: number;
    estimatedCompletionDate: Date;
    hawlProgress: number;
    currentWealth: number;
    currentTotalWealth?: number;
    totalWealth?: number;
    zakatableWealth?: number;
    nisabThreshold: number;
    wealthStatus?: string;
    percentageOfNisab?: number;
    excessAboveNisab?: number;
    deficitBelowNisab?: number;
    isHawlActive?: boolean;
    isHawlComplete: boolean;
    canFinalize: boolean;
    hasBeenInterrupted?: boolean;
    interruptionCount?: number;
    estimatedZakat?: number;
    lastUpdated: Date;
    nextUpdateExpected?: Date;
    [key: string]: any;
}

export interface LiveTrackingData {
    assetIds: string[];
    isTracking: boolean;
    lastSync: Date;
}

export type NisabYearRecordWithLiveTracking = NisabYearRecord & {
    liveTrackingData?: LiveTrackingData;
    liveHawlData?: LiveHawlData;
};
export interface CreateNisabYearRecordDto {
    gregorianYear?: number;
    hijriYear?: number;
    status?: RecordStatus;
    hawlStartDate?: Date | string;
    hawlStartDateHijri?: any;
    hawlCompletionDate?: Date | string;
    hawlCompletionDateHijri?: any;
    nisabBasis?: string;
    currency?: string;
    nisabThresholdAtStart?: number;
    selectedAssetIds?: string[];
    assetBreakdown?: any;
    totalWealth?: number;
    totalLiabilities?: number;
    zakatableWealth?: number;
    zakatAmount?: number;
    methodologyUsed?: any;
    calculationDetails?: any;
    userNotes?: string;
}
export interface UpdateNisabYearRecordDto {
    status?: string;
    userNotes?: string;
    methodologyUsed?: any;
    hawlStartDate?: Date | string;
    hawlCompletionDate?: Date | string;
    totalWealth?: number;
    zakatableWealth?: number;
    zakatAmount?: number;
    totalLiabilities?: number;
    assetBreakdown?: any;
    calculationDetails?: any;
}
export interface FinalizeRecordDto {
    notes?: string;
}
export interface UnlockRecordDto {
    unlockReason?: string;
}


/* eslint-disable @typescript-eslint/no-explicit-any */
