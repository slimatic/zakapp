/**
 * Unit Test: NisabCalculationService
 * 
 * Tests the service for calculating Nisab thresholds from precious metal prices
 * 
 * Status: INTENTIONALLY FAILING (TDD approach)
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { PreciousMetalsApiClient } from '../../../src/config/preciousMetalsApi';

describe('NisabCalculationService', () => {
  it('should calculate gold Nisab threshold correctly', () => {
    const goldPrice = 65; // USD per gram
    const nisabValue = PreciousMetalsApiClient.calculateNisabThreshold('gold', goldPrice);

    // 87.48 grams * 65 USD/gram = 5686.20
    expect(nisabValue).toBe(5686.20);
    expect(typeof nisabValue).toBe('number');
  });

  it('should calculate silver Nisab threshold correctly', () => {
    const silverPrice = 0.70; // USD per gram
    const nisabValue = PreciousMetalsApiClient.calculateNisabThreshold('silver', silverPrice);

    // 612.36 grams * 0.70 USD/gram = 428.652
    expect(nisabValue).toBeCloseTo(428.65);
  });

  it('should handle different currency values', () => {
    const goldPriceEUR = 60; // EUR per gram
    const nisabValueEUR = PreciousMetalsApiClient.calculateNisabThreshold('gold', goldPriceEUR);

    expect(nisabValueEUR).toBe(5248.80); // 87.48 * 60
  });

  it('should return rounded values to 2 decimal places', () => {
    const goldPrice = 65.3333;
    const nisabValue = PreciousMetalsApiClient.calculateNisabThreshold('gold', goldPrice);

    const decimalPlaces = (nisabValue.toString().split('.')[1] || '').length;
    expect(decimalPlaces).toBeLessThanOrEqual(2);
  });

  it('should handle zero price', () => {
    const nisabValue = PreciousMetalsApiClient.calculateNisabThreshold('gold', 0);
    expect(nisabValue).toBe(0);
  });

  it('should handle very small price values', () => {
    const smallPrice = 0.01;
    const nisabValue = PreciousMetalsApiClient.calculateNisabThreshold('gold', smallPrice);

    expect(nisabValue).toBeCloseTo(0.87);
  });

  it('should use correct Nisab standards', () => {
    // Verify the constants are correct per Islamic sources
    expect(PreciousMetalsApiClient.NISAB_GOLD_GRAMS).toBe(87.48);
    expect(PreciousMetalsApiClient.NISAB_SILVER_GRAMS).toBe(612.36);
  });
});
