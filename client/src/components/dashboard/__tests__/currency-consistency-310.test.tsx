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
 * Regression coverage for #310 — currency consistency.
 *
 * The reported failure mode: an IDR user's dashboard rendered two different
 * currencies at once. The "Active Hawl" card hardcoded `$` while the Wealth
 * Summary card correctly used the user's currency, so the same numbers
 * appeared as `$42,000,000.00` and `Rp 42.000.000` on one screen.
 *
 * The dashboard is the most-visited surface, so these tests assert on the
 * RENDERED OUTPUT of each component — not on a helper — so that a future
 * hardcoded `$` fails here.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { ActiveRecordWidget } from '../ActiveRecordWidget';
import { DashboardActionCards } from '../DashboardActionCards';

// Drive the canonical currency hook with an IDR user, exactly the reporter's
// configuration. formatCurrency mirrors the real hook's contract
// (useDisplayCurrency): Intl formatting in the resolved currency, masked.
let displayCurrency = 'IDR';

vi.mock('../../../hooks/useDisplayCurrency', () => ({
  useDisplayCurrency: () => ({
    get currency() {
      return displayCurrency;
    },
    formatCurrency: (amount: number) =>
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: displayCurrency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(amount),
  }),
}));

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { settings: { currency: 'IDR' } }, updateLocalProfile: vi.fn() }),
}));

vi.mock('../../../hooks/useNisabThreshold', () => ({
  useNisabThreshold: () => ({ nisabAmount: 15000000, isLoading: false }),
}));

vi.mock('../../../hooks/usePaymentRepository', () => ({
  usePaymentRepository: () => ({ payments: [], isLoading: false, error: null }),
}));

vi.mock('react-router-dom', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router-dom')>()),
  Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
}));

afterEach(cleanup);

function renderWidget(record: Record<string, unknown>) {
  return render(
    <MemoryRouter>
      <ActiveRecordWidget record={record as never} />
    </MemoryRouter>,
  );
}

const idrRecord = {
  id: 'r1',
  startDate: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString(),
  nisabBasis: 'GOLD' as const,
  zakatAmount: 42000000,
  currentWealth: 42000000,
};

describe('ActiveRecordWidget — #310 currency consistency', () => {
  it('renders no "$" anywhere for an IDR user', () => {
    const { container } = renderWidget(idrRecord);

    // The exact regression: the Active Hawl card hardcoded `$`.
    expect(container.textContent).not.toContain('$');
  });

  it('formats every amount in the user currency (IDR), not USD', () => {
    const { container } = renderWidget(idrRecord);

    // useDisplayCurrency formats via Intl with the 'en-US' locale, which
    // renders IDR as the ISO code ("IDR 42,000,000") rather than the "Rp"
    // symbol. Asserting on the code keeps this test honest about what the
    // canonical formatter actually produces.
    expect(container.textContent).toContain('IDR');
    expect(container.textContent).toMatch(/IDR\s?42,000,000/);
  });

  it('renders Current Wealth, Nisab Threshold and Difference in one currency', () => {
    const { container } = renderWidget(idrRecord);
    const text = container.textContent || '';

    // All three labels are on the card and each value uses Rp; a mixed-currency
    // render would leave a '$' behind, which the first test also guards.
    expect(text).toContain('Current Wealth');
    expect(text).toContain('Nisab Threshold');
    expect(text).toContain('Difference');
    expect(text).not.toContain('$');
  });
});

describe('DashboardActionCards — #310 currency consistency', () => {
  const assets = [
    {
      id: '1',
      type: 'CASH',
      name: 'Savings',
      value: 200000000,
      currency: 'IDR',
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
  ] as never;

  it('states the Zakat owed amount in the user currency, not hardcoded $', () => {
    render(
      <MemoryRouter>
        <DashboardActionCards
          assets={assets}
          activeNisabRecord={
            {
              id: '1',
              userId: 'u1',
              year: 2024,
              startDate: '2024-01-01',
              endDate: '2024-12-31',
              nisabBasis: 'GOLD',
              nisabValue: 5000,
              isActive: true,
              isCompleted: false,
              createdAt: '2024-01-01T00:00:00Z',
              updatedAt: '2024-01-01T00:00:00Z',
            } as never
          }
          payments={[] as never}
        />
      </MemoryRouter>,
    );

    // 2.5% of 200,000,000 = 5,000,000 IDR owed. Previously this sentence read
    // "You have Zakat owed: $5,000,000.00 remaining...".
    const text = document.body.textContent || '';
    expect(text).toContain('You have Zakat owed');
    expect(text).not.toContain('$');
    expect(text).toContain('IDR');
  });
});
