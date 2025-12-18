import { formatChartData, formatPercentageForChart } from '../chartFormatters';

describe('chartFormatters', () => {
  it('formats asset composition into multiple category rows', () => {
    const data = {
      composition: [
        {
          breakdown: {
            assets: [
              { id: 'a1', name: 'Cash', category: 'CASH', value: '1200' },
              { id: 'a2', name: 'Gold', category: 'GOLD', value: '800' }
            ]
          }
        }
      ]
    };

    const input = data;
    const result = formatChartData(input, 'asset_composition');
    expect(Array.isArray(result)).toBe(true);
    // Expect two rows (one per category)
    expect(result.length).toBe(2);
    const categories = result.map(r => r.period);
    expect(categories).toEqual(expect.arrayContaining(['CASH', 'GOLD']));
  });

  it('formats payment distribution into multiple category rows', () => {
    const data = {
      distribution: [
        { category: 'cash', totalAmount: 1200 },
        { category: 'gharimin', totalAmount: 300 }
      ]
    };

    const input = data;
    const result = formatChartData(input, 'payment_distribution');
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(2);
    const categories = result.map(r => r.period);
    expect(categories).toEqual(expect.arrayContaining(['cash', 'gharimin']));
  });

  it('formatPercentageForChart returns a readable percent string', () => {
    expect(formatPercentageForChart(70, 100)).toBe('70.0%');
    expect(formatPercentageForChart(1, 3)).toBe('33.3%');
  });
});