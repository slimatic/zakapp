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

/**
 * NisabComparisonWidget: the verdict must never be derived from NaN.
 *
 * `zakatableWealth`/`totalWealth` are absent from
 * db/schema/nisabYearRecord.schema.ts `required`, so a real record can lack
 * them. `Number(undefined) ?? 0` yields NaN (NaN is not nullish), which made the
 * widget print "$NaN" AND report "Below Nisab" for an above-nisab record.
 * A wrong Nisab verdict is a religious-adjacent claim, so it is asserted here.
 */

import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { NisabComparisonWidget } from './NisabComparisonWidget';

vi.mock('../contexts/PrivacyContext', () => ({
  useMaskedCurrency: () => (value: string) => value,
}));

vi.mock('../hooks/useNisabThreshold', () => ({
  // 5000 in the display currency; undefined until the price fetch lands.
  useNisabThreshold: vi.fn(() => ({
    nisabAmount: 5000,
    goldPrice: 68.4,
    silverPrice: 0.86,
  })),
}));

vi.mock('../hooks/useHawlStatus', () => ({
  useHawlStatus: () => ({ liveHawlData: undefined, isUpdating: false }),
}));

afterEach(cleanup);

describe('NisabComparisonWidget verdict safety', () => {
  it('withholds the verdict instead of showing $NaN / "Below Nisab" when wealth is absent', () => {
    const onStatusChange = vi.fn();
    render(
      <NisabComparisonWidget
        record={{ id: 'r1', status: 'DRAFT', currency: 'USD', nisabBasis: 'GOLD' }}
        onStatusChange={onStatusChange}
      />
    );

    expect(screen.queryByText(/\$NaN|NaN/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Below Nisab/i)).not.toBeInTheDocument();
    // Badge and any status message both carry the phrase, so assert on presence.
    expect(screen.getAllByText(/Not enough data/i).length).toBeGreaterThan(0);
    // An unknown wealth is not a "false" verdict either.
    expect(onStatusChange).not.toHaveBeenCalled();
  });

  it('reports Above Nisab from totalWealth alone (zakatableWealth absent)', () => {
    const onStatusChange = vi.fn();
    render(
      <NisabComparisonWidget
        record={{ id: 'r1', status: 'FINALIZED', currency: 'USD', nisabBasis: 'GOLD', totalWealth: '9000' }}
        onStatusChange={onStatusChange}
      />
    );

    expect(screen.getAllByText(/Above Nisab/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/NaN/)).not.toBeInTheDocument();
    expect(onStatusChange).toHaveBeenCalledWith(true);
  });

  it('treats a stored zakatableWealth of 0 as an answer, not a missing value', () => {
    // The old `||` chain promoted totalWealth to "zakatable" here (0 is falsy),
    // overstating what the user actually owes zakat on.
    render(
      <NisabComparisonWidget
        record={{
          id: 'r1',
          status: 'DRAFT',
          currency: 'USD',
          nisabBasis: 'GOLD',
          zakatableWealth: 0,
          totalWealth: 8500,
        }}
      />
    );

    expect(screen.getAllByText(/Below Nisab/i).length).toBeGreaterThan(0);
    expect(screen.getByText('$0.00')).toBeInTheDocument();
    expect(screen.getByText('$8,500.00')).toBeInTheDocument();
  });
});
