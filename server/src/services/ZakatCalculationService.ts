import { PrismaClient } from '@prisma/client';
import { EncryptionService } from './EncryptionService';

const prisma = new PrismaClient();

export interface ZakatCalculationRequest {
  methodology?: 'STANDARD' | 'HANAFI' | 'SHAFI' | 'CUSTOM';
  calendarType?: 'lunar' | 'solar';
  includeAssets?: string[];
  excludeAssets?: string[];
  customNisab?: number;
  customRate?: number;
}

export interface ZakatCalculationResult {
  id?: string;
  calculationDate: Date;
  methodology: string;
  calendarType: string;
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  nisabThreshold: number;
  nisabSource: string;
  isZakatObligatory: boolean;
  zakatAmount: number;
  zakatRate: number;
  breakdown: any;
  assetsIncluded: any[];
  liabilitiesIncluded: any[];
}

export class ZakatCalculationService {
  /**
   * Calculate Zakat for a user
   */
  async calculateZakat(userId: string, request: ZakatCalculationRequest = {}): Promise<ZakatCalculationResult> {
    const {
      methodology = 'STANDARD',
      calendarType = 'lunar',
      includeAssets = [],
      excludeAssets = [],
      customNisab,
      customRate
    } = request;

    // Get user assets
    const assets = await prisma.asset.findMany({
      where: {
        userId,
        isActive: true,
        ...(includeAssets.length > 0 ? { id: { in: includeAssets } } : {}),
        ...(excludeAssets.length > 0 ? { id: { notIn: excludeAssets } } : {})
      }
    });

    // Get user liabilities
    const liabilities = await prisma.liability.findMany({
      where: {
        userId,
        isActive: true
      }
    });

    // Get current nisab threshold
    const nisabData = await this.getCurrentNisabThreshold();
    const nisabThreshold = customNisab || this.calculateNisabValue(nisabData, methodology);

    // Calculate totals
    const totalAssets = this.calculateTotalAssets(assets, methodology);
    const totalLiabilities = this.calculateTotalLiabilities(liabilities, methodology);
    const netWorth = totalAssets - totalLiabilities;

    // Determine if Zakat is obligatory
    const isZakatObligatory = netWorth >= nisabThreshold;

    // Calculate Zakat amount
    const zakatRate = customRate || this.getZakatRate(methodology);
    const zakatAmount = isZakatObligatory ? netWorth * zakatRate : 0;

    // Create detailed breakdown
    const breakdown = this.createBreakdown(assets, liabilities, methodology, nisabThreshold);

    // Save calculation to database
    const calculation = await prisma.zakatCalculation.create({
      data: {
        userId,
        calculationDate: new Date(),
        methodology,
        calendarType,
        totalAssets,
        totalLiabilities,
        netWorth,
        nisabThreshold,
        nisabSource: 'gold', // Default to gold
        isZakatObligatory,
        zakatAmount,
        zakatRate,
        breakdown: JSON.stringify(breakdown),
        assetsIncluded: JSON.stringify(assets.map(a => ({ id: a.id, name: a.name, value: a.value }))),
        liabilitiesIncluded: JSON.stringify(liabilities.map(l => ({ id: l.id, name: l.name, amount: l.amount })))
      }
    });

    return {
      id: calculation.id,
      calculationDate: calculation.calculationDate,
      methodology: calculation.methodology,
      calendarType: calculation.calendarType,
      totalAssets: calculation.totalAssets,
      totalLiabilities: calculation.totalLiabilities,
      netWorth: calculation.netWorth,
      nisabThreshold: calculation.nisabThreshold,
      nisabSource: calculation.nisabSource,
      isZakatObligatory: calculation.isZakatObligatory,
      zakatAmount: calculation.zakatAmount,
      zakatRate: calculation.zakatRate,
      breakdown: JSON.parse(calculation.breakdown),
      assetsIncluded: JSON.parse(calculation.assetsIncluded),
      liabilitiesIncluded: JSON.parse(calculation.liabilitiesIncluded)
    };
  }

  /**
   * Get calculation history for a user
   */
  async getCalculationHistory(userId: string, limit: number = 10) {
    const calculations = await prisma.zakatCalculation.findMany({
      where: { userId },
      orderBy: { calculationDate: 'desc' },
      take: limit
    });

    return calculations.map(calc => ({
      id: calc.id,
      calculationDate: calc.calculationDate,
      methodology: calc.methodology,
      calendarType: calc.calendarType,
      totalAssets: calc.totalAssets,
      totalLiabilities: calc.totalLiabilities,
      netWorth: calc.netWorth,
      nisabThreshold: calc.nisabThreshold,
      nisabSource: calc.nisabSource,
      isZakatObligatory: calc.isZakatObligatory,
      zakatAmount: calc.zakatAmount,
      zakatRate: calc.zakatRate,
      breakdown: JSON.parse(calc.breakdown || '{}'),
      assetsIncluded: JSON.parse(calc.assetsIncluded || '[]'),
      liabilitiesIncluded: JSON.parse(calc.liabilitiesIncluded || '[]')
    }));
  }

  /**
   * Get specific calculation by ID
   */
  async getCalculationById(userId: string, calculationId: string) {
    const calculation = await prisma.zakatCalculation.findFirst({
      where: {
        id: calculationId,
        userId
      }
    });

    if (!calculation) {
      throw new Error('Calculation not found');
    }

    return {
      id: calculation.id,
      calculationDate: calculation.calculationDate,
      methodology: calculation.methodology,
      calendarType: calculation.calendarType,
      totalAssets: calculation.totalAssets,
      totalLiabilities: calculation.totalLiabilities,
      netWorth: calculation.netWorth,
      nisabThreshold: calculation.nisabThreshold,
      nisabSource: calculation.nisabSource,
      isZakatObligatory: calculation.isZakatObligatory,
      zakatAmount: calculation.zakatAmount,
      zakatRate: calculation.zakatRate,
      breakdown: JSON.parse(calculation.breakdown || '{}'),
      assetsIncluded: JSON.parse(calculation.assetsIncluded || '[]'),
      liabilitiesIncluded: JSON.parse(calculation.liabilitiesIncluded || '[]')
    };
  }

  /**
   * Get current nisab threshold
   */
  async getCurrentNisabThreshold() {
    const threshold = await prisma.nisabThreshold.findFirst({
      where: { isActive: true },
      orderBy: { effectiveDate: 'desc' }
    });

    if (!threshold) {
      // Return default values if no threshold is found
      return {
        goldPricePerGram: 65, // Default gold price in USD
        silverPricePerGram: 0.8, // Default silver price in USD
        goldNisabGrams: 87.48,
        silverNisabGrams: 612.36,
        goldNisabValue: 65 * 87.48,
        silverNisabValue: 0.8 * 612.36,
        currency: 'USD'
      };
    }

    return threshold;
  }

  /**
   * Get available calculation methodologies
   */
  async getMethodologies() {
    const methodologies = await prisma.calculationMethodology.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        description: true,
        scholarlySource: true
      }
    });

    return methodologies;
  }

  /**
   * Record Zakat payment
   */
  async recordPayment(userId: string, calculationId: string, paymentData: {
    amount: number;
    currency?: string;
    paymentDate: Date;
    recipients: string[];
    paymentMethod: string;
    receiptNumber?: string;
    notes?: string;
  }) {
    const islamicYear = this.getIslamicYear(paymentData.paymentDate);

    const payment = await prisma.zakatPayment.create({
      data: {
        userId,
        calculationId,
        paymentDate: paymentData.paymentDate,
        amount: paymentData.amount,
        currency: paymentData.currency || 'USD',
        recipients: JSON.stringify(paymentData.recipients),
        paymentMethod: paymentData.paymentMethod,
        receiptNumber: paymentData.receiptNumber || null,
        islamicYear,
        notes: paymentData.notes || null,
        status: 'completed'
      }
    });

    return payment;
  }

  /**
   * Get payment history
   */
  async getPaymentHistory(userId: string, year?: string) {
    const where: any = { userId };
    if (year) {
      where.islamicYear = year;
    }

    const payments = await prisma.zakatPayment.findMany({
      where,
      orderBy: { paymentDate: 'desc' },
      include: {
        calculation: {
          select: {
            id: true,
            calculationDate: true,
            methodology: true,
            zakatAmount: true
          }
        }
      }
    });

    return payments.map(payment => ({
      ...payment,
      recipients: JSON.parse(payment.recipients || '[]')
    }));
  }

  /**
   * Calculate remaining Zakat to be paid
   */
  async calculateRemainingZakat(userId: string, year?: string) {
    const currentYear = year || this.getIslamicYear(new Date());
    
    // Get latest calculation for the year
    const latestCalculation = await prisma.zakatCalculation.findFirst({
      where: { userId },
      orderBy: { calculationDate: 'desc' }
    });

    if (!latestCalculation || !latestCalculation.isZakatObligatory) {
      return {
        obligatoryAmount: 0,
        paidAmount: 0,
        remainingAmount: 0,
        status: 'not_obligatory'
      };
    }

    // Get payments for the year
    const payments = await prisma.zakatPayment.findMany({
      where: {
        userId,
        islamicYear: currentYear,
        status: 'completed'
      }
    });

    const paidAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const obligatoryAmount = latestCalculation.zakatAmount;
    const remainingAmount = Math.max(0, obligatoryAmount - paidAmount);

    return {
      obligatoryAmount,
      paidAmount,
      remainingAmount,
      status: remainingAmount > 0 ? 'partial_payment' : 'fully_paid',
      payments: payments.length
    };
  }

  /**
   * Private: Calculate total assets based on methodology
   */
  private calculateTotalAssets(assets: any[], methodology: string): number {
    let total = 0;
    
    for (const asset of assets) {
      // Apply methodology-specific rules
      if (this.isAssetZakatable(asset, methodology)) {
        total += asset.value;
      }
    }

    return total;
  }

  /**
   * Private: Calculate total liabilities based on methodology
   */
  private calculateTotalLiabilities(liabilities: any[], methodology: string): number {
    let total = 0;

    for (const liability of liabilities) {
      // Apply methodology-specific rules
      if (this.isLiabilityDeductible(liability, methodology)) {
        total += liability.amount;
      }
    }

    return total;
  }

  /**
   * Private: Determine if asset is zakatable based on methodology
   */
  private isAssetZakatable(asset: any, methodology: string): boolean {
    const category = asset.category?.toUpperCase();
    
    switch (methodology) {
      case 'HANAFI':
        // Hanafi school includes more business assets
        return ['CASH', 'GOLD', 'SILVER', 'BUSINESS', 'CRYPTO'].includes(category);
      
      case 'SHAFI':
        // Shafi'i school has different rules for certain assets
        return ['CASH', 'GOLD', 'SILVER', 'CRYPTO'].includes(category);
      
      default: // STANDARD
        return ['CASH', 'GOLD', 'SILVER', 'CRYPTO', 'BUSINESS'].includes(category);
    }
  }

  /**
   * Private: Determine if liability is deductible based on methodology
   */
  private isLiabilityDeductible(liability: any, methodology: string): boolean {
    const type = liability.type?.toUpperCase();
    
    switch (methodology) {
      case 'HANAFI':
        // Hanafi allows deduction of most debts
        return ['LOAN', 'MORTGAGE', 'CREDIT_CARD', 'BUSINESS_DEBT'].includes(type);
      
      case 'SHAFI':
        // Shafi'i is more restrictive about debt deduction
        return ['LOAN', 'BUSINESS_DEBT'].includes(type);
      
      default: // STANDARD
        return ['LOAN', 'BUSINESS_DEBT'].includes(type);
    }
  }

  /**
   * Private: Calculate nisab value based on methodology
   */
  private calculateNisabValue(nisabData: any, methodology: string): number {
    switch (methodology) {
      case 'HANAFI':
        // Hanafi uses silver nisab (more lenient)
        return nisabData.silverNisabValue;
      
      case 'SHAFI':
      default:
        // Shafi'i and Standard use gold nisab (stricter)
        return nisabData.goldNisabValue;
    }
  }

  /**
   * Private: Get Zakat rate based on methodology
   */
  private getZakatRate(methodology: string): number {
    // Standard rate is 2.5% for all methodologies
    return 0.025;
  }

  /**
   * Private: Create detailed breakdown
   */
  private createBreakdown(assets: any[], liabilities: any[], methodology: string, nisabThreshold: number) {
    const assetBreakdown = assets.reduce((acc, asset) => {
      const category = asset.category;
      if (!acc[category]) {
        acc[category] = { count: 0, total: 0, zakatable: 0 };
      }
      acc[category].count++;
      acc[category].total += asset.value;
      
      if (this.isAssetZakatable(asset, methodology)) {
        acc[category].zakatable += asset.value;
      }
      
      return acc;
    }, {} as Record<string, any>);

    const liabilityBreakdown = liabilities.reduce((acc, liability) => {
      const type = liability.type;
      if (!acc[type]) {
        acc[type] = { count: 0, total: 0, deductible: 0 };
      }
      acc[type].count++;
      acc[type].total += liability.amount;
      
      if (this.isLiabilityDeductible(liability, methodology)) {
        acc[type].deductible += liability.amount;
      }
      
      return acc;
    }, {} as Record<string, any>);

    return {
      methodology,
      nisabThreshold,
      assets: assetBreakdown,
      liabilities: liabilityBreakdown,
      calculationSteps: [
        'Identify zakatable assets',
        'Calculate total asset value',
        'Identify deductible liabilities',
        'Calculate net worth',
        'Compare with nisab threshold',
        'Apply 2.5% rate if above nisab'
      ]
    };
  }

  /**
   * Private: Get Islamic year from date
   */
  private getIslamicYear(date: Date): string {
    // Simplified Islamic year calculation
    // In a real implementation, this should use proper Hijri calendar conversion
    const gregorianYear = date.getFullYear();
    const approximateIslamicYear = Math.floor((gregorianYear - 622) * 1.031) + 1;
    return approximateIslamicYear.toString();
  }
}