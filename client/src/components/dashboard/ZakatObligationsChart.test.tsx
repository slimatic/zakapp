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
 * ZakatObligationsChart: payments link to a record by `snapshotId`.
 *
 * The chart filtered on `p.nisabYearId`, which is not a field on a payment
 * record (see client/src/db/schema/paymentRecord.schema.ts and
 * shared/src/types/tracking.ts PaymentRecord). The filter never matched, so
 * "paid" rendered 0 and "remaining" showed the whole obligation.
 *
 * Recharts is mocked to a data probe so the assertion is on the derived series
 * rather than on SVG output.
 */

import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { ZakatObligationsChart } from './ZakatObligationsChart';

let chartRows: any[] = [];

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  BarChart: ({ data, children }: any) => {
    chartRows = data;
    return <div data-testid="chart">{children}</div>;
  },
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
}));

vi.mock('../../contexts/PrivacyContext', () => ({
  usePrivacy: () => ({ privacyMode: false }),
}));

afterEach(cleanup);

describe('ZakatObligationsChart paid-vs-due series', () => {
  it('sums payments by snapshotId and derives remaining from them', () => {
    render(
      <ZakatObligationsChart
        records={[
          {
            id: 'rec-1',
            status: 'FINALIZED',
            zakatAmount: 1000,
            hijriYear: 1447,
            createdAt: '2025-01-01T00:00:00.000Z',
          } as any,
        ]}
        payments={
          [
            // The field a payment really carries.
            { id: 'p1', snapshotId: 'rec-1', amount: 400 },
            { id: 'p2', snapshotId: 'rec-1', amount: '250' },
            // Different year - must not be counted.
            { id: 'p3', snapshotId: 'rec-2', amount: 999 },
            // The non-existent field, kept to prove it is not what matches.
            { id: 'p4', nisabYearId: 'rec-1', amount: 777 },
          ] as any
        }
      />
    );

    expect(screen.getByTestId('chart')).toBeInTheDocument();
    expect(chartRows).toHaveLength(1);
    expect(chartRows[0].due).toBe(1000);
    expect(chartRows[0].paid).toBe(650); // 400 + "250"
    expect(chartRows[0].remaining).toBe(350); // 1000 - 650
  });
});
