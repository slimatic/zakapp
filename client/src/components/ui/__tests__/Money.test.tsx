/**
 * Copyright (c) 2024 ZakApp Contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 */

import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { Money, splitCurrency } from '../Money';

// Money reads the display currency through useDisplayCurrency, which pulls from
// the auth context + settings repo. Stub it so the component can be tested in
// isolation: the formatting itself is pinned by currencyContract.test.ts, this
// file only pins the symbol/digits split and the negative handling.
vi.mock('../../../hooks/useDisplayCurrency', () => ({
  useDisplayCurrency: () => ({
    currency: 'USD',
    formatCurrency: (amount: number) =>
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        numberingSystem: 'latn'
      }).format(amount)
  })
}));

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

describe('Money', () => {
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

  it('marks the decorative symbol as aria-hidden so screen readers read the amount plainly', () => {
    const { container } = render(<Money value={100} />);
    const hidden = container.querySelectorAll('[aria-hidden="true"]');
    expect(hidden.length).toBeGreaterThan(0);
  });
});
