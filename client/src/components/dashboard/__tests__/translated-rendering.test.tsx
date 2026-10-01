/**
 * Copyright (c) 2024 ZakApp Contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import i18n from '../../../i18n';
import { DashboardActionCards } from '../DashboardActionCards';

// Same contract as the sibling component test: the real currency resolver needs
// provider plumbing this test is not about.
vi.mock('../../../hooks/useDisplayCurrency', () => ({
  useDisplayCurrency: () => ({
    currency: 'USD',
    formatCurrency: (amount: number) =>
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(amount),
  }),
}));

/**
 * Renders through i18n and asserts the user sees WORDS, not keys.
 *
 * The checker (scripts/check-i18n-keys.py) verifies keys resolve statically. This
 * test covers the failure it structurally cannot: a key that exists but is asked
 * for in the wrong namespace, or a component that renders before i18n is ready.
 * Both produce a screen full of "dashboard.viewAllAssets" - visible only in a
 * real render, which is why this test exists next to the static check.
 */

// Groups/namespaces actually used by these components. A raw key is always
// "<one of these>.<camelCase>".
const RAW_KEY = /\b(dashboard|common|onboarding|widget|charts|actions|guide|recovery|footer|nav|a11y|auth|hawl)\.[a-zA-Z]/;

const renderCards = () =>
  render(
    <MemoryRouter>
      <DashboardActionCards assets={[]} activeNisabRecord={null} payments={[]} />
    </MemoryRouter>
  );

describe('translated rendering', () => {
  beforeEach(async () => {
    await act(async () => {
      await i18n.changeLanguage('en');
    });
  });

  it('renders English copy, never a raw key', () => {
    renderCards();
    expect(screen.getByText('Add Your First Asset')).toBeInTheDocument();
    // The specific defect this guards: a namespaced key used inside a namespace,
    // which renders as the literal "dashboard.viewAllAssets". Matching a known
    // key prefix avoids false-positives on ordinary prose that contains a period.
    expect(document.body.textContent).not.toMatch(RAW_KEY);
  });

  it('renders Arabic copy, never a raw key or English fallback', async () => {
    await act(async () => {
      await i18n.changeLanguage('ar');
    });
    renderCards();
    expect(screen.getByText('أضف أصلك الأول')).toBeInTheDocument();
    expect(document.body.textContent).not.toContain('Add Your First Asset');
    expect(document.body.textContent).not.toMatch(RAW_KEY);
  });

  it('switches language at runtime and re-renders the new copy', async () => {
    renderCards();
    expect(screen.getByText('Add Your First Asset')).toBeInTheDocument();
    await act(async () => {
      await i18n.changeLanguage('ar');
    });
    expect(screen.getByText('أضف أصلك الأول')).toBeInTheDocument();
  });
});
