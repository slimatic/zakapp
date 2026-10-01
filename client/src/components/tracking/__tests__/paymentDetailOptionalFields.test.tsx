/**
 * The payments page threw "An unexpected error occurred" when a payment row was
 * clicked. Two defects, both from a field the type marks OPTIONAL being used as if it
 * were present:
 *
 * 1. `payment.exchangeRate !== 1` is TRUE when exchangeRate is undefined, so the
 *    Exchange Rate branch ran for every payment that had no rate and `.toFixed(4)` on
 *    undefined threw - the ErrorBoundary swallowed the modal.
 * 2. `nisabYear.gregorianYear` / `nisabYear.hijriYear` rendered `undefined/1448H`; the
 *    years are not in the RxDB schema's `required` list, so a record can lack them.
 *
 * These render the REAL components with the offending shape rather than asserting on
 * the source, because the bug was a runtime throw, not a missing string.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PaymentDetailModal } from '../PaymentDetailModal';
import { formatNisabYearLabel } from '../../../utils/calendarConverter';
import type { PaymentRecord } from '@zakapp/shared/types/tracking';

// Path is relative to THIS test file (src/components/tracking/__tests__/),
// so it must resolve to src/contexts/PrivacyContext - not to the component's own
// '../../contexts/PrivacyContext', which from here points somewhere else entirely.
vi.mock('../../../contexts/PrivacyContext', () => ({
  useMaskedCurrency: () => (s: string) => s,
}));

const basePayment = {
  id: 'p1',
  amount: 2.5,
  currency: 'USD',
  paymentDate: '2026-09-23',
  recipientName: 'ISWM',
  recipientType: 'organization',
  recipientCategory: 'poor',
  status: 'recorded',
  createdAt: '2026-09-23T00:00:00.000Z',
  updatedAt: '2026-09-23T00:00:00.000Z',
} as unknown as PaymentRecord;

describe('PaymentDetailModal with optional fields missing', () => {
  it('renders without throwing when exchangeRate is absent', () => {
    // The regression: this threw before the guard.
    expect(() =>
      render(<PaymentDetailModal payment={{ ...basePayment }} onClose={() => {}} />)
    ).not.toThrow();
    expect(screen.getAllByText('Payment Details').length).toBeGreaterThan(0);
    // and it does NOT invent an exchange rate row
    expect(screen.queryByText(/Exchange Rate/)).toBeNull();
  });

  it('shows a genuine non-1 exchange rate', () => {
    render(
      <PaymentDetailModal
        payment={{ ...basePayment, exchangeRate: 15750.5 } as PaymentRecord}
        onClose={() => {}}
      />
    );
    expect(screen.getByText(/Exchange Rate: 15750\.5000/)).toBeTruthy();
  });

  it('does not print undefined years for a nisab record lacking them', () => {
    render(
      <PaymentDetailModal
        payment={basePayment}
        nisabYear={{ id: 'n1', hijriYear: 1448 } as never}
        onClose={() => {}}
      />
    );
    // Read document.body, not the render container: Modal renders through a portal.
    // And assert over the whole text rather than queryByText(/undefined/) - React
    // reports an undefined sibling as several separate text nodes, so a matcher over
    // the string misses it and the test would pass for the wrong reason.
    const text = document.body.textContent || '';
    expect(text).toContain('1448H');
    expect(text).not.toContain('undefined');
    expect(text).not.toContain('NaN');
  });
});

describe('formatNisabYearLabel', () => {
  it('labels both years', () => {
    expect(formatNisabYearLabel({ gregorianYear: 2026, hijriYear: 1448 })).toBe('2026/1448H');
  });
  it('handles a lone year', () => {
    expect(formatNisabYearLabel({ gregorianYear: 2026 })).toBe('2026');
    expect(formatNisabYearLabel({ hijriYear: 1448 })).toBe('1448H');
  });
  it('returns empty rather than a fabricated year', () => {
    // Never fall back to the CURRENT year - a record from 2024 would be mislabelled.
    expect(formatNisabYearLabel({})).toBe('');
    expect(formatNisabYearLabel(null)).toBe('');
    expect(formatNisabYearLabel(undefined)).toBe('');
  });
  it('accepts the loose types the schema allows', () => {
    expect(formatNisabYearLabel({ gregorianYear: '2026', hijriYear: '1448' })).toBe('2026/1448H');
  });
});
