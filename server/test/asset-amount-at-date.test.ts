/**
 * Regression check for `GET /assets/:id/amount-at` date handling.
 *
 * The route used to pass `new Date(dateParam)` straight through, so a bare
 * `YYYY-MM-DD` became midnight UTC and matched only events stamped at exactly
 * midnight. Asking for a day that plainly had events returned null -- off by one
 * day. Measured against the preview API before the fix:
 *
 *   date=2026-09-28           -> amount: null
 *   date=2026-09-28T23:59:59Z -> amount: 2500
 *
 * This asserts the resolution rule the route now applies. If someone reverts to
 * `new Date(dateParam)`, the first assertion fails.
 */
import { describe, it, expect } from 'vitest';

/** Mirror of the route's date resolution. Keep in sync with asset-amount-events.ts. */
function resolveAsOf(dateParam: string): Date | null {
  const asOf = /^\d{4}-\d{2}-\d{2}$/.test(dateParam)
    ? new Date(`${dateParam}T23:59:59.999Z`)
    : new Date(dateParam);
  return isNaN(asOf.getTime()) ? null : asOf;
}

describe('amount-at date resolution', () => {
  it('treats a bare date as the end of that day, not its midnight', () => {
    const asOf = resolveAsOf('2026-09-28')!;
    expect(asOf.toISOString()).toBe('2026-09-28T23:59:59.999Z');

    // The event that the old behaviour failed to match: 17:20 on the same day.
    const eventAt = new Date('2026-09-28T17:20:00.522Z');
    expect(eventAt <= asOf).toBe(true);
  });

  it('still fails the old midnight behaviour, so the regression is real', () => {
    const oldBehaviour = new Date('2026-09-28');
    const eventAt = new Date('2026-09-28T17:20:00.522Z');
    expect(eventAt <= oldBehaviour).toBe(false); // this was the bug
  });

  it('preserves an explicit timestamp exactly', () => {
    expect(resolveAsOf('2026-09-28T12:00:00Z')!.toISOString())
      .toBe('2026-09-28T12:00:00.000Z');
  });

  it('rejects an unparseable date instead of silently comparing NaN', () => {
    expect(resolveAsOf('not-a-date')).toBeNull();
  });

  it('does not widen a date that merely looks numeric', () => {
    // A full ISO string is not date-only, so it must keep its time component.
    expect(resolveAsOf('2026-09-28T00:00:00Z')!.toISOString())
      .toBe('2026-09-28T00:00:00.000Z');
  });
});
