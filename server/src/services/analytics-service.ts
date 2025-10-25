import { PaymentService } from './payment-service';
import { DecryptedPaymentData } from '../models/payment';

export interface MonthlyTrend {
  month: number;
  year: number;
  paymentCount: number;
  totalAmount: number;
}

export interface YearlyComparison {
  year: number;
  totalAmount: number;
  paymentCount: number;
}

export interface CategoryBreakdown {
  category: string;
  amount: number;
  percentage: number;
}

export interface AnalyticsData {
  totalPayments: number;
  totalAmount: number;
  monthlyTrends: MonthlyTrend[];
  yearlyComparison: YearlyComparison[];
  categoryBreakdown: CategoryBreakdown[];
  averageMonthlyAmount: number;
  growthRate: number; // Year-over-year growth rate
  consistencyScore: number; // Score from 0-100 based on regularity
  // Optional metadata about the request (tests expect these)
  userId?: string;
  startDate?: Date;
  endDate?: Date;
}

export class AnalyticsService {
  /**
   * Calculates comprehensive analytics for a user's payment history
   */
  static async calculateTrends(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<AnalyticsData> {
    if (!userId) throw new Error('Invalid user ID');
    if (startDate > endDate) throw new Error('Invalid date range');
    // Get all payments in the date range
    const payments = await PaymentService.getPaymentsByUserId(userId, {
      startDate,
      endDate,
      limit: 10000, // Large limit for analytics
    });

    const totalPayments = payments.length;
    const totalAmount = payments.reduce((sum, payment) => sum + parseFloat(payment.decryptedAmount), 0);

    // Calculate monthly trends
    const monthlyTrends = this.calculateMonthlyTrends(payments, startDate, endDate);

    // Calculate yearly comparison
    const yearlyComparison = this.calculateYearlyComparison(payments);

    // Calculate category breakdown
    const categoryBreakdown = this.calculateCategoryBreakdown(payments, totalAmount);

    // Calculate additional metrics
    const averageMonthlyAmount = this.calculateAverageMonthlyAmount(monthlyTrends);
    const growthRate = this.calculateGrowthRate(yearlyComparison);
    const consistencyScore = this.calculateConsistencyScore(monthlyTrends);

    return {
      // Include request info for tests that expect it
      // @ts-ignore - tests expect these fields
      userId: (userId as unknown) as string,
      // @ts-ignore
      startDate: (startDate as unknown) as Date,
      // @ts-ignore
      endDate: (endDate as unknown) as Date,
      totalPayments,
      totalAmount,
      monthlyTrends,
      yearlyComparison,
      categoryBreakdown,
      averageMonthlyAmount,
      growthRate,
      consistencyScore,
    };
  }

  /**
   * Gets summary analytics for the analytics dashboard
   */
  static async getSummary(userId: string, months: number = 12): Promise<{
    totalPayments: number;
    totalAmount: number;
    monthlyTrends: MonthlyTrend[];
    recentPayments: DecryptedPaymentData[];
  }> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const analytics = await this.calculateTrends(userId, startDate, endDate);

    // Get recent payments (last 10)
    const recentPayments = await PaymentService.getPaymentsByUserId(userId, {
      limit: 10,
      orderBy: 'createdAt',
      orderDirection: 'desc',
    });

    return {
      totalPayments: analytics.totalPayments,
      totalAmount: analytics.totalAmount,
      monthlyTrends: analytics.monthlyTrends,
      recentPayments,
    };
  }

  /**
   * Calculates monthly payment trends
   */
  private static calculateMonthlyTrends(
    payments: DecryptedPaymentData[],
    startDate: Date,
    endDate: Date
  ): MonthlyTrend[] {
    const monthlyData: Record<string, { count: number; amount: number }> = {};

    // Initialize all months in the range
    const start = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    const end = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0);

    for (let date = new Date(start); date <= end; date.setMonth(date.getMonth() + 1)) {
      const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
      monthlyData[key] = { count: 0, amount: 0 };
    }

    // Aggregate payments by month
    payments.forEach(payment => {
      const paymentDate = new Date(payment.paymentDate);
      const key = `${paymentDate.getFullYear()}-${paymentDate.getMonth() + 1}`;
      if (monthlyData[key]) {
        monthlyData[key].count++;
        monthlyData[key].amount += parseFloat(payment.decryptedAmount);
      }
    });

    // Convert to MonthlyTrend array
    return Object.entries(monthlyData).map(([key, data]) => {
      const [year, month] = key.split('-').map(Number);
      return {
        month,
        year,
        paymentCount: data.count,
        totalAmount: data.amount,
      };
    }).sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });
  }

  /**
   * Calculates year-over-year comparison
   */
  private static calculateYearlyComparison(payments: DecryptedPaymentData[]): YearlyComparison[] {
    const yearlyData: Record<number, { count: number; amount: number }> = {};

    payments.forEach(payment => {
      const year = new Date(payment.paymentDate).getFullYear();
      if (!yearlyData[year]) {
        yearlyData[year] = { count: 0, amount: 0 };
      }
      yearlyData[year].count++;
      yearlyData[year].amount += parseFloat(payment.decryptedAmount);
    });

    return Object.entries(yearlyData)
      .map(([year, data]) => ({
        year: parseInt(year),
        totalAmount: data.amount,
        paymentCount: data.count,
      }))
      .sort((a, b) => a.year - b.year);
  }

  /**
   * Calculates payment category breakdown
   */
  private static calculateCategoryBreakdown(
    payments: DecryptedPaymentData[],
    totalAmount: number
  ): CategoryBreakdown[] {
    const categoryData: Record<string, number> = {};

    payments.forEach(payment => {
      const category = payment.recipientCategory;
      const amount = parseFloat(payment.decryptedAmount);
      categoryData[category] = (categoryData[category] || 0) + amount;
    });

    return Object.entries(categoryData)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: totalAmount > 0 ? (amount / totalAmount) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount); // Sort by amount descending
  }

  /**
   * Calculates average monthly payment amount
   */
  private static calculateAverageMonthlyAmount(monthlyTrends: MonthlyTrend[]): number {
    if (monthlyTrends.length === 0) return 0;

    const totalAmount = monthlyTrends.reduce((sum, trend) => sum + trend.totalAmount, 0);
    return totalAmount / monthlyTrends.length;
  }

  /**
   * Calculates year-over-year growth rate
   */
  private static calculateGrowthRate(yearlyComparison: YearlyComparison[]): number {
    if (yearlyComparison.length < 2) return 0;

    const sortedYears = yearlyComparison.sort((a, b) => a.year - b.year);
    const currentYear = sortedYears[sortedYears.length - 1];
    const previousYear = sortedYears[sortedYears.length - 2];

    if (previousYear.totalAmount === 0) return 0;

    return ((currentYear.totalAmount - previousYear.totalAmount) / previousYear.totalAmount) * 100;
  }

  /**
   * Calculates consistency score based on payment regularity
   */
  private static calculateConsistencyScore(monthlyTrends: MonthlyTrend[]): number {
    if (monthlyTrends.length < 3) return 0; // Need at least 3 months for consistency

    const amounts = monthlyTrends.map(trend => trend.totalAmount);
    const average = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;
    const variance = amounts.reduce((sum, amount) => sum + Math.pow(amount - average, 2), 0) / amounts.length;
    const standardDeviation = Math.sqrt(variance);

    // Calculate coefficient of variation (lower is more consistent)
    const cv = average > 0 ? (standardDeviation / average) : 0;

    // Convert to a 0-100 score (lower CV = higher score)
    const score = Math.max(0, Math.min(100, 100 - (cv * 100)));

    return Math.round(score);
  }

  /**
   * Gets analytics metrics for a specific time period
   */
  static async getAnalyticsMetrics(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<AnalyticsData> {
    return this.calculateTrends(userId, startDate, endDate);
  }
}