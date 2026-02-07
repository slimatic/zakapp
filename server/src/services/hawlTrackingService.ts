/**
 * Copyright (c) 2024 ZakApp Contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Hawl Tracking Service (T042)
 * 
 * Manages Hawl (lunar year) lifecycle:
 * - Detects Nisab achievement
 * - Tracks 354-day Hawl periods
 * - Handles Hawl interruptions (wealth drops below Nisab)
 * - Calculates live Hawl metrics
 */

import moment from 'moment';
import * as HijriConverter from 'hijri-converter';
import { PrismaClient } from '@prisma/client';
import { Logger } from '../utils/logger';
import { EncryptionService } from './EncryptionService';
import { WealthAggregationService } from './wealthAggregationService';
import { NisabCalculationService } from './nisabCalculationService';
import type {
  HawlTrackingState,
  HawlStatus,
  LiveHawlData,
  HawlInterruptionEvent,
} from '@zakapp/shared';

export class HawlTrackingService {
  private readonly HAWL_DURATION_DAYS = 354; // Lunar year
  private readonly HAWL_TOLERANCE_DAYS = 5; // ±5 days for calendar adjustment

  private logger = new Logger('HawlTrackingService');
  private prisma: PrismaClient;
  private wealthAggregationService: WealthAggregationService;
  private nisabCalculationService: NisabCalculationService;

  constructor(
    prisma?: PrismaClient,
    wealthAggregationService?: WealthAggregationService,
    nisabCalculationService?: NisabCalculationService
  ) {
    this.prisma = prisma || new PrismaClient();
    this.wealthAggregationService = wealthAggregationService || new WealthAggregationService();
    this.nisabCalculationService = nisabCalculationService || new NisabCalculationService();
  }

  /**
   * Build asset snapshot for Nisab Year Record
   * Fetches all zakatable assets and creates encrypted snapshot
   * 
   * @param userId - User ID
   * @returns Encrypted asset breakdown JSON string
   * @private
   */
  private async buildAssetSnapshot(userId: string): Promise<string> {
    try {
      // Fetch all zakatable assets
      const assets = await this.wealthAggregationService.getZakatableAssets(userId);

      // Calculate totals
      const totalWealth = assets.reduce((sum, asset) => sum + (asset.value || 0), 0);
      const zakatableWealth = assets.filter(a => a.isZakatable)
        .reduce((sum, asset) => sum + ((asset as any).zakatableValue ?? ((asset.value || 0) * ((asset as any).calculationModifier ?? 1.0))), 0);

      // Build asset breakdown JSON
      const assetBreakdown = {
        assets: assets.filter(asset => asset.isZakatable).map(asset => ({
          id: asset.id,
          name: asset.name,
          category: asset.category,
          value: asset.value,
          calculationModifier: (asset as any).calculationModifier || 1.0,
          zakatableValue: (asset as any).zakatableValue ?? ((asset.value || 0) * ((asset as any).calculationModifier ?? 1.0)),
          isZakatable: asset.isZakatable,
          addedAt: asset.addedAt.toISOString(),
        })),
        capturedAt: new Date().toISOString(),
        totalWealth,
        zakatableWealth,
      };

      // Encrypt and return
      return await EncryptionService.encrypt(JSON.stringify(assetBreakdown), process.env.ENCRYPTION_KEY!);
    } catch (error) {
      this.logger.error('Failed to build asset snapshot', error);
      throw new Error(`Asset snapshot creation failed: ${error.message}`);
    }
  }

  /**
   * Handle real-time wealth change for a user
   * Triggers Hawl detection logic immediately
   *
   * @param userId - User ID
   * @returns void
   */
  async handleWealthChange(userId: string): Promise<void> {
    try {
      this.logger.info(`Handling wealth change for user ${userId}`);

      // 1. Get current wealth
      const wealthCalc = await this.wealthAggregationService.calculateTotalZakatableWealth(userId);
      const currentWealth = wealthCalc.totalZakatableWealth;

      // Use transaction to prevent race conditions
      await this.prisma.$transaction(async (tx) => {
        // 2. Get active DRAFT record (within transaction)
        const existingRecord = await tx.yearlySnapshot.findFirst({
          where: {
            userId,
            status: 'DRAFT',
          },
        });

        // 3. Determine Nisab basis
        let nisabBasis: 'GOLD' | 'SILVER' = 'GOLD';
        let nisabData: { selectedNisab: number; [key: string]: any };

        // 4. Check existing record for interruption or create new record
        if (existingRecord) {
          // If record exists, preserve its basis
          if (existingRecord.nisabBasis === 'SILVER' || existingRecord.nisabType === 'silver') {
            nisabBasis = 'SILVER';
          }
          nisabData = await this.nisabCalculationService.calculateNisabThreshold('USD', nisabBasis);
        } else {
          // For new records, check both gold and silver, use the lower threshold (more lenient)
          const goldNisab = await this.nisabCalculationService.calculateNisabThreshold('USD', 'GOLD');
          const silverNisab = await this.nisabCalculationService.calculateNisabThreshold('USD', 'SILVER');
          
          if (silverNisab.selectedNisab < goldNisab.selectedNisab) {
            nisabBasis = 'SILVER';
            nisabData = silverNisab;
          } else {
            nisabBasis = 'GOLD';
            nisabData = goldNisab;
          }
        }

        if (existingRecord) {
          // Check for interruption
          const nisabThresholdAtStart = parseFloat(existingRecord.nisabThresholdAtStart || existingRecord.nisabThreshold);

          if (currentWealth < nisabThresholdAtStart) {
            this.logger.info(`User ${userId} wealth ${currentWealth} dropped below Nisab ${nisabThresholdAtStart}. Interrupting Hawl.`);

            // Delete the DRAFT record (Hawl interrupted)
            await tx.yearlySnapshot.delete({
              where: { id: existingRecord.id },
            });
          }
        } else {
          // No active Hawl, check if we should start one
          if (currentWealth >= nisabData.selectedNisab) {
            this.logger.info(`User ${userId} reached Nisab ${nisabData.selectedNisab}. Starting Hawl.`);

            // Create new Hawl record inline (extracted from createHawlRecord)
            const hawlStartDate = moment();
            const hawlCompletionDate = moment().add(this.HAWL_DURATION_DAYS, 'days');
            const assetBreakdown = await this.buildAssetSnapshot(userId);

            // Get Hijri date components
            const hijri = HijriConverter.toHijri(
              hawlStartDate.toDate().getFullYear(),
              hawlStartDate.toDate().getMonth() + 1,
              hawlStartDate.toDate().getDate()
            );

            await tx.yearlySnapshot.create({
              data: {
                userId: userId,
                status: 'DRAFT',
                nisabBasis,
                nisabType: nisabBasis, // Deprecated but still required
                nisabThreshold: nisabData.selectedNisab.toString(),
                nisabThresholdAtStart: nisabData.selectedNisab.toString(),
                totalWealth: currentWealth.toString(),
                totalLiabilities: '0', // Initialize as 0
                zakatableWealth: currentWealth.toString(),
                zakatAmount: this.nisabCalculationService.calculateZakat(currentWealth).toString(),
                methodologyUsed: 'Standard', // Default methodology
                calculationDate: hawlStartDate.toDate(),
                gregorianYear: hawlStartDate.year(),
                gregorianMonth: hawlStartDate.month() + 1,
                gregorianDay: hawlStartDate.date(),
                hijriYear: hijri.hy,
                hijriMonth: hijri.hm,
                hijriDay: hijri.hd,
                calculationDetails: '{}', // Empty JSON
                hawlStartDate: hawlStartDate.toDate(),
                hawlStartDateHijri: this.toHijriDate(hawlStartDate.toDate()),
                hawlCompletionDate: hawlCompletionDate.toDate(),
                hawlCompletionDateHijri: this.toHijriDate(hawlCompletionDate.toDate()),
                assetBreakdown, // Encrypted asset snapshot
              },
            });
          }
        }
      });

    } catch (error) {
      this.logger.error(`Failed to handle wealth change for user ${userId}`, error);
    }
  }

  /**
   * Detect Nisab achievement for all users (background job mode)
   * Creates DRAFT Nisab Year Records for users who have reached Nisab
   * 
   * @param nisabBasis - Whether to use gold or silver for calculation
   * @returns Number of DRAFT records created
   */
  async detectNisabAchievement(nisabBasis: 'GOLD' | 'SILVER' = 'GOLD'): Promise<number> {
    try {
      this.logger.info('Starting Nisab achievement detection for all users');

      // Get all active users
      const users = await this.prisma.user.findMany({
        where: { isActive: true },
        select: { id: true },
      });

      let recordsCreated = 0;

      for (const user of users) {
        try {
          // Check if user already has an active DRAFT record
          // Use transaction to prevent race conditions with real-time tracking
          await this.prisma.$transaction(async (tx) => {
            const existingRecord = await tx.yearlySnapshot.findFirst({
              where: {
                userId: user.id,
                status: 'DRAFT',
              },
            });

            if (existingRecord) {
              this.logger.debug(`User ${user.id} already has DRAFT record, skipping`);
              return; // Skip this user
            }

            // Calculate user's current wealth
            // Note: calculation is outside transaction but acceptable here as we re-check existingRecord
            const wealthCalc = await this.wealthAggregationService.calculateTotalZakatableWealth(user.id);
            const currentWealth = wealthCalc.totalZakatableWealth;

            // Get current Nisab threshold
            const nisabData = await this.nisabCalculationService.calculateNisabThreshold('USD', nisabBasis);

            // Check if wealth has reached Nisab
            if (currentWealth < nisabData.selectedNisab) {
              this.logger.debug(`User ${user.id} wealth ${currentWealth} below Nisab ${nisabData.selectedNisab}`);
              return; // Skip this user
            }

            // Nisab reached - create DRAFT record with asset snapshot
            const hawlStartDate = moment();
            const hawlCompletionDate = moment().add(this.HAWL_DURATION_DAYS, 'days');
            const assetBreakdown = await this.buildAssetSnapshot(user.id);

            // Get Hijri date components
            const hijri = HijriConverter.toHijri(
              hawlStartDate.toDate().getFullYear(),
              hawlStartDate.toDate().getMonth() + 1,
              hawlStartDate.toDate().getDate()
            );

            await tx.yearlySnapshot.create({
              data: {
                userId: user.id,
                status: 'DRAFT',
                nisabBasis,
                nisabType: nisabBasis, // Deprecated but still required
                nisabThreshold: nisabData.selectedNisab.toString(),
                nisabThresholdAtStart: nisabData.selectedNisab.toString(),
                totalWealth: currentWealth.toString(),
                totalLiabilities: '0', // Initialize as 0
                zakatableWealth: currentWealth.toString(),
                zakatAmount: this.nisabCalculationService.calculateZakat(currentWealth).toString(),
                methodologyUsed: 'Standard', // Default methodology
                calculationDate: hawlStartDate.toDate(),
                gregorianYear: hawlStartDate.year(),
                gregorianMonth: hawlStartDate.month() + 1,
                gregorianDay: hawlStartDate.date(),
                hijriYear: hijri.hy,
                hijriMonth: hijri.hm,
                hijriDay: hijri.hd,
                calculationDetails: '{}', // Empty JSON
                hawlStartDate: hawlStartDate.toDate(),
                hawlStartDateHijri: this.toHijriDate(hawlStartDate.toDate()),
                hawlCompletionDate: hawlCompletionDate.toDate(),
                hawlCompletionDateHijri: this.toHijriDate(hawlCompletionDate.toDate()),
                assetBreakdown, // Encrypted asset snapshot
              },
            });

            recordsCreated++;
            this.logger.info(`Created DRAFT record for user ${user.id}, wealth: ${currentWealth}, Nisab: ${nisabData.selectedNisab}`);
          });
        } catch (userError) {
          this.logger.error(`Failed to process user ${user.id}`, userError);
          // Continue with next user
        }
      }

      this.logger.info(`Nisab detection complete: ${recordsCreated} DRAFT records created`);
      return recordsCreated;
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
      priorInterruptions: 0, // TODO: Track interruptions in audit trail
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
    const hijri = HijriConverter.toHijri(date.getFullYear(), date.getMonth() + 1, date.getDate());
    return `${hijri.hy}-${String(hijri.hm).padStart(2, '0')}-${String(hijri.hd).padStart(2, '0')}`;
  }

  /**
   * Convert Hijri date to Gregorian
   * 
   * @param hijriDateString - Hijri date string (YYYY-MM-DD)
   * @returns Gregorian date
   */
  fromHijriDate(hijriDateString: string): Date {
    const [year, month, day] = hijriDateString.split('-').map(Number);
    const gregorian = HijriConverter.toGregorian(year, month, day);
    return new Date(gregorian.gy, gregorian.gm - 1, gregorian.gd);
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
