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

import { formatPercentage } from '../formatters';

describe('formatters', () => {
  it('formats decimal input correctly when isDecimal=true', () => {
    expect(formatPercentage(0.7, 1, true)).toBe('70.0%');
    expect(formatPercentage(0.3333, 1, true)).toBe('33.3%');
  });

  it('formats percentage input correctly when isDecimal=false', () => {
    expect(formatPercentage(70, 1, false)).toBe('70.0%');
  });
});