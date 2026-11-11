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

import { formatPercentage, paymentAmountInBase } from '../formatters';

describe('formatters', () => {
  it('formats decimal input correctly when isDecimal=true', () => {
    expect(formatPercentage(0.7, 1, true)).toBe('70.0%');
    expect(formatPercentage(0.3333, 1, true)).toBe('33.3%');
  });

  it('formats percentage input correctly when isDecimal=false', () => {
    expect(formatPercentage(70, 1, false)).toBe('70.0%');
  });
});
describe('paymentAmountInBase', () => {
  it('applies the recorded rate, like the server total does', () => {
    // 1,000,000 IDR at 0.000064 USD/IDR is $64, not $1,000,000.
    expect(paymentAmountInBase({ amount: 1_000_000, exchangeRate: 0.000064 })).toBeCloseTo(64, 6);
  });

  it('treats a missing rate as 1 (single-currency payment)', () => {
    expect(paymentAmountInBase({ amount: 250 })).toBe(250);
  });

  it('falls back to 1 for a nonsensical rate rather than zeroing the payment', () => {
    expect(paymentAmountInBase({ amount: 250, exchangeRate: 0 })).toBe(250);
    expect(paymentAmountInBase({ amount: 250, exchangeRate: -3 })).toBe(250);
  });

  it('accepts the string amounts an import produces', () => {
    expect(paymentAmountInBase({ amount: '250.5', exchangeRate: '2' })).toBe(501);
  });
});
