/**
 * Hawl Tracking Service (T042)
 * 
 * Manages Hawl (lunar year) lifecycle:
 * - Detects Nisab achievement
 * - Tracks 354-day Hawl periods
 * - Handles Hawl interruptions (wealth drops below Nisab)
 * - Calculates live Hawl metrics
 */

import { injectable } from 'tsyringe';
import moment from 'moment';
import 'moment-hijri';
import { Logger } from '../utils/logger';
import { WealthAggregationService } from './wealthAggregationService';
import { NisabCalculationService } from './nisabCalculationService';
import type {
  HawlTrackingState,
  HawlStatus,
  LiveHawlData,
  NisabAchievementEvent,
  HawlInterruptionEvent,
} from '@zakapp/shared';

@injectable()
export class HawlTrackingService {
  private readonly HAWL_DURATION_DAYS = 354; // Lunar year
  private readonly HAWL_TOLERANCE_DAYS = 5; // ±5 days for calendar adjustment

  private logger = new Logger('HawlTrackingService');

  constructor(
    private wealthAggregationService: WealthAggregationService,
    private nisabCalculationService: NisabCalculationService
  ) {}

  /**
   * Detect Nisab achievement - checks if user's wealth has reached Nisab threshold
   * 
   * @param userId - User ID to check
   * @param currentWealth - User's current total zakatable wealth
   * @param nisabBasis - Whether to use gold or silver for calculation
   * @returns NisabAchievementEvent if Nisab reached, null otherwise
   */
  async detectNisabAchievement(
    userId: string,
    currentWealth: number,
    nisabBasis: 'GOLD' | 'SILVER' = 'GOLD'
  ): Promise<NisabAchievementEvent | null> {
    try {
      // Get current Nisab threshold
      const nisabData = await this.nisabCalculationService.calculateNisabThreshold('USD', nisabBasis);

      // Check if wealth has reached Nisab
      if (!this.nisabCalculationService.isAboveNisab(currentWealth, nisabData.selectedNisab)) {
        return null; // Wealth still below Nisab
      }

      // Nisab reached - create event
      const hawlStartDate = moment();
      const hawlCompletionDate = moment().add(this.HAWL_DURATION_DAYS, 'days');

      return {
        userId,
        timestamp: new Date(),
        currentWealth,
        nisabThreshold: nisabData.selectedNisab,
        nisabBasis,
        hawlStartDate: hawlStartDate.toDate(),
        hawlCompletionDate: hawlCompletionDate.toDate(),
      };
    } catch (error) {
      this.logger.error('Nisab achievement detection failed', error);
      throw error;
    }
  }

  /**
   * Calculate Hawl tracking state from a record
   * 
   * @param recordData - NisabYearRecord data
   * @param currentWealth - Current total wealth (may differ from record)
   * @returns HawlTrackingState with current metrics
   */
  calculateHawlTrackingState(
    recordData: any, // NisabYearRecord
    currentWealth: number
  ): HawlTrackingState {
    const now = moment();
    const hawlStart = moment(recordData.hawlStartDate);
    const hawlCompletion = moment(recordData.hawlCompletionDate);

    const daysElapsed = now.diff(hawlStart, 'days');
    const daysRemaining = hawlCompletion.diff(now, 'days');
    const isComplete = now.isAfter(hawlCompletion) || now.isSame(hawlCompletion);
    const hawlProgress = (daysElapsed / this.HAWL_DURATION_DAYS) * 100;

    // Determine status
    let status: HawlStatus = 'ACTIVE';
    if (isComplete) status = 'COMPLETE';
    if (currentWealth < parseFloat(recordData.nisabThresholdAtStart)) status = 'INTERRUPTED';

    return {
      userId: recordData.userId,
      recordId: recordData.id,
      status,
      hawlStartDate: recordData.hawlStartDate,
      hawlStartDateHijri: recordData.hawlStartDateHijri,
      hawlCompletionDate: recordData.hawlCompletionDate,
      hawlCompletionDateHijri: recordData.hawlCompletionDateHijri,
      nisabBasis: recordData.nisabBasis,
      nisabThresholdAtStart: parseFloat(recordData.nisabThresholdAtStart),
      currentNisabThreshold: parseFloat(recordData.nisabThreshold),
      wealthAtStart: parseFloat(recordData.totalWealth),
      currentWealth,
      minimumWealthDuringPeriod: Math.min(parseFloat(recordData.totalWealth), currentWealth),
      daysElapsed,
      daysRemaining: Math.max(0, daysRemaining),
      hawlProgress: Math.min(100, Math.max(0, hawlProgress)),
      isHawlComplete: isComplete,
      lastUpdated: new Date(),
    };
  }

  /**
   * Calculate live Hawl data for real-time display
   * 
   * @param recordData - NisabYearRecord
   * @param currentWealth - Current wealth
   * @returns LiveHawlData with real-time metrics
   */
  calculateLiveHawlData(recordData: any, currentWealth: number): LiveHawlData {
    const state = this.calculateHawlTrackingState(recordData, currentWealth);
    const nisabThreshold = parseFloat(recordData.nisabThresholdAtStart);

    const isAboveNisab = currentWealth >= nisabThreshold;
    const percentageOfNisab = (currentWealth / nisabThreshold) * 100;

    return {
      recordId: recordData.id,
      userId: recordData.userId,
      status: state.status,
      hawlStartDate: recordData.hawlStartDate,
      hawlCompletionDate: recordData.hawlCompletionDate,
      daysRemaining: state.daysRemaining,
      estimatedCompletionDate: recordData.hawlCompletionDate,
      hawlProgress: state.hawlProgress,
      currentWealth,
      nisabThreshold,
      wealthStatus: isAboveNisab ? 'ABOVE_NISAB' : 'BELOW_NISAB',
      percentageOfNisab,
      excessAboveNisab: isAboveNisab ? currentWealth - nisabThreshold : undefined,
      deficitBelowNisab: !isAboveNisab ? nisabThreshold - currentWealth : undefined,
      isHawlActive: state.status === 'ACTIVE',
      isHawlComplete: state.isHawlComplete,
      canFinalize: state.isHawlComplete,
      hasBeenInterrupted: state.status === 'INTERRUPTED',
      interruptionCount: 0, // TODO: Query audit trail for interruptions
      estimatedZakat: isAboveNisab ? this.nisabCalculationService.calculateZakat(currentWealth) : 0,
      lastUpdated: new Date(),
      nextUpdateExpected: moment().add(5, 'minutes').toDate(),
    };
  }

  /**
   * Detect Hawl interruption - when wealth drops below Nisab during Hawl
   * 
   * @param recordData - NisabYearRecord
   * @param previousWealth - Wealth before change
   * @param currentWealth - Current wealth
   * @returns HawlInterruptionEvent if interrupted, null otherwise
   */
  detectHawlInterruption(
    recordData: any,
    previousWealth: number,
    currentWealth: number
  ): HawlInterruptionEvent | null {
    const nisabThreshold = parseFloat(recordData.nisabThresholdAtStart);

    // Check if wealth dropped below Nisab
    if (previousWealth >= nisabThreshold && currentWealth < nisabThreshold) {
      const hawlStart = moment(recordData.hawlStartDate);
      const daysCompleted = moment().diff(hawlStart, 'days');
      const hawlCompletion = moment(recordData.hawlCompletionDate);
      const daysRemaining = hawlCompletion.diff(moment(), 'days');

      return {
        userId: recordData.userId,
        recordId: recordData.id,
        timestamp: new Date(),
        previousWealth,
        currentWealth,
        nisabThreshold,
        daysCompleted,
        daysRemaining,
      };
    }

    return null;
  }

  /**
   * Calculate Hawl completion status
   * Returns true if 354 days have passed (with tolerance)
   * 
   * @param hawlStartDate - When Hawl started
   * @returns true if Hawl period is complete
   */
  isHawlComplete(hawlStartDate: Date): boolean {
    const start = moment(hawlStartDate);
    const expected = start.clone().add(this.HAWL_DURATION_DAYS, 'days');
    const now = moment();

    // Check if current time is after expected completion (with tolerance)
    return now.isAfter(expected.clone().subtract(this.HAWL_TOLERANCE_DAYS, 'days'));
  }

  /**
   * Calculate Hawl completion date from start date
   * 
   * @param hawlStartDate - Hawl start date
   * @returns Hawl completion date (354 days later)
   */
  calculateHawlCompletionDate(hawlStartDate: Date): Date {
    return moment(hawlStartDate).add(this.HAWL_DURATION_DAYS, 'days').toDate();
  }

  /**
   * Convert date to Hijri calendar format
   * 
   * @param date - Date to convert
   * @returns Hijri date string (YYYY-MM-DD format)
   */
  toHijriDate(date: Date): string {
    const hijri = moment(date).hijri();
    return `${hijri.iYear()}-${String(hijri.iMonth() + 1).padStart(2, '0')}-${String(hijri.iDate()).padStart(2, '0')}`;
  }

  /**
   * Convert Hijri date to Gregorian
   * 
   * @param hijriDateString - Hijri date string (YYYY-MM-DD)
   * @returns Gregorian date
   */
  fromHijriDate(hijriDateString: string): Date {
    const [year, month, day] = hijriDateString.split('-').map(Number);
    return moment().iHijri(year, month - 1, day).toDate();
  }

  /**
   * Get Hawl configuration constants
   */
  getHawlConfig() {
    return {
      hawlDurationDays: this.HAWL_DURATION_DAYS,
      hawlToleranceDays: this.HAWL_TOLERANCE_DAYS,
      nisabGoldGrams: 87.48,
      nisabSilverGrams: 612.36,
    };
  }
}
