/**
 * Copyright (c) 2024 ZakApp Contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 */

/**
 * Regression test: the liability row must never render "Invalid Date".
 *
 * `dueDate` is declared required on the Liability type but is not enforced at
 * write time, so a record can carry undefined or a non-date string. The old
 * code called `new Date(dateString).toLocaleDateString(...)` unconditionally,
 * which prints the literal string "Invalid Date" - so every liability without a
 * due date showed "Due: Invalid Date" in the list.
 */

import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { LiabilityList } from '../LiabilityList';
import { PrivacyProvider } from '../../../contexts/PrivacyContext';
import { Liability } from '../../../types';

vi.mock('../../../hooks/useLiabilityRepository', () => ({
  useLiabilityRepository: () => ({
    liabilities: [],
    isLoading: false,
    error: null,
    addLiability: vi.fn(),
    updateLiability: vi.fn(),
    removeLiability: vi.fn(),
  }),
}));

vi.mock('../../ui', () => ({
  Button: ({ children, ...rest }: any) => <button {...rest}>{children}</button>,
}));

// LiabilityList formats money via useDisplayCurrency -> useAuth; stub it.
vi.mock('../../../hooks/useDisplayCurrency', () => ({
  useDisplayCurrency: () => ({
    currency: 'USD',
    formatCurrency: (amount: number) => `$${amount.toFixed(2)}`,
  }),
}));

const baseLiability = {
  id: 'l1',
  userId: 'u1',
  name: 'Credit card',
  type: 'short_term',
  amount: 640.2,
  currency: 'USD',
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
} as unknown as Liability;

/** Render the list with one liability and return the text content. */
const renderOne = (overrides: Partial<Liability>) => {
  const { container } = render(
    <PrivacyProvider>
      <LiabilityList
        liabilities={[{ ...baseLiability, ...overrides } as Liability]}
        onEdit={vi.fn()}
      />
    </PrivacyProvider>
  );
  return container.textContent ?? '';
};

describe('LiabilityList due date rendering', () => {
  it('never renders the literal string "Invalid Date"', () => {
    const text = renderOne({ dueDate: undefined as never });
    expect(text).not.toContain('Invalid Date');
  });

  it('falls back to a plain label when there is no due date', () => {
    const text = renderOne({ dueDate: undefined as never });
    expect(text).toContain('No due date');
  });

  it('falls back when the stored date string is unparseable', () => {
    const text = renderOne({ dueDate: 'not-a-date' as never });
    expect(text).not.toContain('Invalid Date');
    expect(text).toContain('No due date');
  });

  it('formats a real due date', () => {
    const text = renderOne({ dueDate: '2027-03-04T00:00:00.000Z' });
    expect(text).toMatch(/Due: .*2027/);
    expect(text).not.toContain('No due date');
  });
});
