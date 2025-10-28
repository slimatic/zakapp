/**
 * Hawl Tracking Types
 * 
 * Defines TypeScript interfaces for Hawl (lunar year) lifecycle management
 * Hawl tracking involves detecting Nisab achievement, managing 354-day periods, and handling interruptions
 */

/**
 * Hawl status types
 */
export type HawlStatus = 'INACTIVE' | 'ACTIVE' | 'INTERRUPTED' | 'COMPLETE';

/**
 * Nisab achievement event
 * Triggered when user's aggregate wealth reaches the Nisab threshold
 */
export interface NisabAchievementEvent {
  userId: string;
  timestamp: Date | string;
  currentWealth: number;
  nisabThreshold: number;
  nisabBasis: 'GOLD' | 'SILVER';
  hawlStartDate: Date | string;
  hawlCompletionDate: Date | string;
}

/**
 * Hawl tracking state
 * Represents the current state of a user's Hawl period
 */
export interface HawlTrackingState {
  userId: string;
  recordId: string;
  status: HawlStatus;

  // Hawl period dates
  hawlStartDate: Date | string;
  hawlStartDateHijri: string; // Hijri calendar equivalent
  hawlCompletionDate: Date | string;
  hawlCompletionDateHijri: string; // Hijri calendar equivalent

  // Nisab information
  nisabBasis: 'GOLD' | 'SILVER';
  nisabThresholdAtStart: number;
  currentNisabThreshold: number; // May vary due to price changes

  // Wealth tracking
  wealthAtStart: number;
  currentWealth: number;
  minimumWealthDuringPeriod: number;

  // Progress tracking
  daysElapsed: number;
  daysRemaining: number; // Days until hawlCompletionDate
  hawlProgress: number; // Percentage (0-100)
  isHawlComplete: boolean; // Whether hawlCompletionDate has passed

  // Interruption tracking
  interruptedAt?: Date | string;
  interruptionReason?: string;
  priorInterruptions: number; // Count of previous interruptions
  lastUpdated: Date | string;
}

/**
 * Hawl interruption event
 * Triggered when wealth drops below Nisab threshold during Hawl
 */
export interface HawlInterruptionEvent {
  userId: string;
  recordId: string;
  timestamp: Date | string;
  previousWealth: number;
  currentWealth: number;
  nisabThreshold: number;
  daysCompleted: number; // How many days of Hawl were completed
  daysRemaining: number; // How many days were remaining
}

/**
 * Hawl completion event
 * Triggered when Hawl period (354 days) is complete
 */
export interface HawlCompletionEvent {
  userId: string;
  recordId: string;
  timestamp: Date | string;
  hawlStartDate: Date | string;
  hawlCompletionDate: Date | string;
  totalWealthAtCompletion: number;
  nisabThreshold: number;
  canFinalize: boolean; // Whether record can be finalized
}

/**
 * Live Hawl tracking data
 * Real-time calculated metrics for current Hawl period
 */
export interface LiveHawlData {
  recordId: string;
  userId: string;
  status: HawlStatus;

  // Time tracking
  hawlStartDate: Date | string;
  hawlCompletionDate: Date | string;
  daysRemaining: number;
  estimatedCompletionDate: Date | string;
  hawlProgress: number; // Percentage (0-100)

  // Wealth comparison
  currentWealth: number;
  nisabThreshold: number;
  wealthStatus: 'ABOVE_NISAB' | 'BELOW_NISAB' | 'AT_NISAB';
  percentageOfNisab: number; // (currentWealth / nisabThreshold) * 100
  excessAboveNisab?: number; // If above Nisab
  deficitBelowNisab?: number; // If below Nisab

  // Hawl indicators
  isHawlActive: boolean;
  isHawlComplete: boolean;
  canFinalize: boolean;
  hasBeenInterrupted: boolean;
  interruptionCount: number;

  // Zakat preview
  estimatedZakat: number; // 2.5% of currentWealth if above Nisab
  lastUpdated: Date | string;
  nextUpdateExpected: Date | string; // For polling intervals
}

/**
 * Hawl detection job parameters
 * Used by background job to scan for Nisab achievements and interruptions
 */
export interface HawlDetectionJobParams {
  dryRun?: boolean; // Log what would happen without making changes
  verbose?: boolean; // Detailed logging
  userIds?: string[]; // Specific users to check (if null, check all)
  ignoreCache?: boolean; // Ignore price cache, fetch fresh prices
}

/**
 * Hawl detection job result
 */
export interface HawlDetectionJobResult {
  success: boolean;
  startTime: Date | string;
  endTime: Date | string;
  duration: number; // Milliseconds

  // Statistics
  usersScanned: number;
  nisabAchievements: number; // Records created
  interruptionsDetected: number; // Hawls interrupted
  completionsDetected: number; // Hawls that completed

  // Errors
  errors: Array<{
    userId: string;
    error: string;
  }>;

  // Details
  details?: {
    createdRecords: string[]; // Record IDs created
    interruptedRecords: string[]; // Record IDs interrupted
    completedRecords: string[]; // Record IDs completed
  };
}

/**
 * Hawl configuration
 * System-wide settings for Hawl tracking
 */
export interface HawlConfig {
  hawlDurationDays: number; // 354 for lunar year
  hawlToleranceDays: number; // ±5 days for calendar adjustments
  nisabBasis: 'GOLD' | 'SILVER' | 'USER_CHOICE';
  nisabGoldGrams: number; // 87.48
  nisabSilverGrams: number; // 612.36
  zakatPercentage: number; // 2.5
  minUnlockReasonLength: number; // 10 characters
  detectionJobInterval: string; // Cron expression for background job
  pricesCacheTTL: number; // Hours to cache precious metal prices
}

/**
 * Hawl status change notification
 * Sent to user when status changes
 */
export interface HawlStatusChangeNotification {
  userId: string;
  recordId: string;
  previousStatus: HawlStatus;
  newStatus: HawlStatus;
  event: AuditEventType;
  message: string;
  actionRequired?: boolean;
  suggestedActions?: string[];
  timestamp: Date | string;
}

export type AuditEventType =
  | 'CREATED'
  | 'NISAB_ACHIEVED'
  | 'HAWL_INTERRUPTED'
  | 'UNLOCKED'
  | 'EDITED'
  | 'REFINALIZED'
  | 'FINALIZED';
