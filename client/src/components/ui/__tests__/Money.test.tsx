/**
 * Copyright (c) 2024 ZakApp Contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Money, splitCurrency } from '../Money';

/**
 * Money reads the display currency through useDisplayCurrency, which pulls from
 * the auth context + settings repo. Stub it so the component can be tested in
 * isolation: the formatting itself is pinned by currencyContract.test.ts.
 *
 * `formatCurrencyImpl` is swappable per-test because the accessible name is
 * derived from formatCurrency's OUTPUT. The tests below control that output to
 * exercise privacy masking, code-style currencies and RTL without
 * re-implementing Intl here.
 */
let formatCurrencyImpl: (amount: number, currency?: string) => string;

vi.mock('../../../hooks/useDisplayCurrency', () => ({
  useDisplayCurrency: () => ({
    currency: 'USD',
    formatCurrency: (amount: number, currency?: string) => formatCurrencyImpl(amount, currency)
  })
}));

const usd = (amount: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    numberingSystem: 'latn'
  }).format(amount);

beforeEach(() => {
  formatCurrencyImpl = usd;
});

describe('splitCurrency', () => {
  it('splits a dollar amount into symbol and digits', () => {
    expect(splitCurrency('$1,218.26')).toEqual(['$', '1,218.26']);
  });

  it('splits a named-code fallback (unknown currency keeps its code)', () => {
    expect(splitCurrency('USDT 1,000.00')).toEqual(['USDT', '1,000.00']);
  });

  it('keeps the sign with the symbol for negatives', () => {
    expect(splitCurrency('-$640.20')).toEqual(['-$', '640.20']);
  });

  it('returns digits only when there is no symbol', () => {
    expect(splitCurrency('1,218.26')).toEqual(['', '1,218.26']);
  });
});

describe('Money rendering', () => {
  it('renders the digits and shows the symbol separately for styling', () => {
    const { container } = render(<Money value={1218.26} />);
    const text = container.textContent ?? '';
    expect(text).toContain('1,218.26');
    expect(text).toContain('$');
  });

  it('renders a negative amount with a minus sign', () => {
    const { container } = render(<Money value={-640.2} />);
    expect(container.textContent).toContain('-');
    expect(container.textContent).toContain('640.20');
  });

  it('applies tabular numerals so columns of figures align', () => {
    const { container } = render(<Money value={100} />);
    expect(container.firstElementChild?.className).toContain('tabular-nums');
  });

  it('hides every visual child from assistive technology', () => {
    // The wrapper's aria-label is the ONLY thing announced. Previously this test
    // was described as letting "screen readers read the amount plainly" - but
    // hiding the sign and symbol is precisely what made "-$640.20" announce as
    // "640.20". The hiding is still correct; the missing label is what is fixed.
    const { container } = render(<Money value={100} />);
    const hidden = container.querySelectorAll('[aria-hidden="true"]');
    expect(hidden.length).toBeGreaterThan(0);
  });
});

/**
 * The accessible name. The previous implementation marked the sign AND the
 * currency symbol aria-hidden and supplied no default label, so assistive
 * technology announced "$640.20" as "640.20" and "-$640.20" as "640.20" - the
 * same magnitude for owing and being owed, with the direction removed.
 */
/**
 * What a screen reader actually announces for a Money element: the sign (when
 * present) followed by the digits.
 *
 * Read from the DOM in announcement order rather than through getByLabelText.
 * aria-label on the WRAPPER is prohibited (implicit `generic` role) and axe
 * rejects it; the sign element carries a permitted narrow aria-label and the
 * digits stay plain text, so this mirrors reality instead of what a query
 * helper happens to match.
 */
const announced = (container: HTMLElement): string => {
  const parts: string[] = [];
  const signSpan = container.querySelector('[data-testid="money-sign"]');
  if (signSpan) parts.push(signSpan.getAttribute('aria-label') ?? signSpan.textContent ?? '');
  const digitSpan = Array.from(container.querySelectorAll('span')).find((el) =>
    /[0-9•]/.test(el.textContent ?? '') && !el.querySelector('span')
  );
  if (digitSpan) parts.push(digitSpan.textContent ?? '');
  return parts.join(' ');
};

describe('Money accessible name', () => {
  it('announces the sign before the amount for a negative value', () => {
    // The regression this change exists for: without the sign, a debt reads
    // identically to an asset.
    const { container } = render(<Money value={-640.2} />);
    expect(announced(container)).toMatch(/^minus /);
    expect(announced(container)).toContain('640.20');
  });

  it('announces no sign prefix for a plain positive value', () => {
    const { container } = render(<Money value={1218.26} />);
    expect(container.querySelector('[data-testid="money-sign"]')).toBeNull();
    expect(announced(container)).toContain('1,218.26');
  });

  it('announces an explicit plus only when signed is requested', () => {
    const { container } = render(<Money value={640.2} signed />);
    expect(announced(container)).toMatch(/^plus /);
  });

  it('announces a signed negative as minus, not plus', () => {
    const { container } = render(<Money value={-640.2} signed />);
    expect(announced(container)).toMatch(/^minus /);
  });

  it('labels the sign element, which has text content so axe permits it', () => {
    const { container } = render(<Money value={-640.2} />);
    const sign = container.querySelector('[data-testid="money-sign"]');
    expect(sign?.getAttribute('aria-label')).toBe('minus');
    expect((sign?.textContent ?? '').trim()).toBe('-');
  });

  it('keeps the digits as the only digits in the DOM, so caller queries stay unambiguous', () => {
    // An sr-only copy of the full amount was tried and rejected: it duplicated
    // the digits and broke unrelated getByText(/250\.00/) assertions.
    const { container } = render(<Money value={-640.2} />);
    // Leaf spans only: the wrapper's textContent also contains the digits, so an
    // unfiltered count reports 2 and the assertion would be about nothing.
    const withDigits = Array.from(container.querySelectorAll('span')).filter(
      (el) => !el.querySelector('span') && (el.textContent ?? '').includes('640.20')
    );
    expect(withDigits.length).toBe(1);
  });

  it('honours a caller-supplied aria-label on the wrapper', () => {
    const { container } = render(<Money value={1218.26} aria-label="Zakat due" />);
    expect(container.firstElementChild?.getAttribute('aria-label')).toBe('Zakat due');
  });
});

describe('Money with the privacy mask active', () => {
  // useDisplayCurrency applies the mask inside formatCurrency, so Money receives
  // already-masked text. The accessible name inherits it: an amount hidden on
  // screen must not be readable by a screen reader.
  beforeEach(() => {
    formatCurrencyImpl = (amount) => usd(amount).replace(/\d/g, '•');
  });

  it('does not leak the amount through the accessible name', () => {
    const { container } = render(<Money value={1218.26} />);
    expect(announced(container)).not.toMatch(/[0-9]/);
  });

  it('keeps the sign announced even when the amount is masked', () => {
    // Direction is not private in the way the balance is, and losing it is
    // exactly the defect being fixed.
    const { container } = render(<Money value={-640.2} />);
    expect(announced(container)).toMatch(/^minus /);
  });
});
