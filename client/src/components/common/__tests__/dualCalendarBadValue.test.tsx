/**
 * DualCalendarDatePicker must survive an empty or unparseable date value.
 *
 * The formatters it uses throw by design: `gregorianToHijri` and `formatDualCalendar`
 * both raise 'Invalid Gregorian date provided' for '', null, undefined and Invalid Date.
 * The picker called them at INIT and at RENDER, so any of those values took the page to
 * the error boundary rather than degrading.
 *
 * Found by checking the formatters directly rather than reading the call site - the
 * source read looked fine and was wrong.
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { DualCalendarDatePicker } from '../DualCalendarDatePicker';

// The picker reads the user's Hijri adjustment through useAuth. Stub the hook so the
// test measures THIS component rather than the provider.
vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { settings: { hijriAdjustment: 0, preferredCalendar: 'gregorian' } } }),
}));

const noop = () => {};

describe('DualCalendarDatePicker with a bad value', () => {
  it('renders for an empty string', () => {
    expect(() =>
      render(<DualCalendarDatePicker value="" onChange={noop} />)
    ).not.toThrow();
  });

  it('renders for an unparseable string', () => {
    expect(() =>
      render(<DualCalendarDatePicker value="not-a-date" onChange={noop} />)
    ).not.toThrow();
  });

  it('renders for an Invalid Date', () => {
    expect(() =>
      render(<DualCalendarDatePicker value={new Date('nonsense')} onChange={noop} />)
    ).not.toThrow();
  });

  it('still renders a good date', () => {
    const { container } = render(
      <DualCalendarDatePicker value="2026-09-24" onChange={noop} />
    );
    expect(container.textContent).not.toContain('Invalid');
    expect(container.textContent).not.toContain('NaN');
  });
});
