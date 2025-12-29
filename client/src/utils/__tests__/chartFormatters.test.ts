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