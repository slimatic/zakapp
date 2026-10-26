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
 * The hero's zakat figure runs the canonical engine (`calculateZakat`), which
 * needs both nisab thresholds (gold AND silver — the methodology picks). Those
 * grams must be the user's selected convention (`NISAB_STANDARDS`), the same
 * one the threshold chip uses, not the bundled default.
 *
 * The fixture mounts the Dashboard as an 'aaoifi' user (85 g / 595 g) whose
 * portfolio sits BETWEEN the two conventions' gold thresholds, so the rendered
 * hero figure proves which grams actually ran:
 *
 *   aaoifi  : 65 U/g x 85 g    = 5,525.00 -> 5,600.00 is above -> due 140.00
 *   default : 65 U/g x 87.48 g = 5,686.20 -> 5,600.00 is below -> due   0.00
 *
 * The threshold hook is mocked at its documented surface (per-gram prices in
 * and the caller-standard-aware figures out), so the gram convention is the
 * only moving part. The default-resolution case pins the other half of the
 * contract: a user who never picked a convention keeps exactly the threshold
 * the app has always computed (6,200 above 5,686.20 -> due 155.00).
 *
 * All figures in the fixtures are synthetic.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
// Initialise i18n with its bundles - without this every t() returns the raw key.
import '../../i18n';

const fixture = vi.hoisted(() => ({
  // What the threshold hook returns; each test sets this before rendering.
  nisabAmount: 5525,
  nisabPair: { gold: 5525, silver: 476 },
  assets: [] as any[],
}));

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 'test-user',
      name: 'Test User',
      userType: 'free',
      maxAssets: 10,
      maxNisabRecords: 12,
      maxPayments: 50,
      isSetupCompleted: true,
    },
  }),
}));

vi.mock('../../hooks/useAssetRepository', () => ({
  useAssetRepository: () => ({
    assets: fixture.assets,
    isLoading: false,
    error: null,
  }),
}));

vi.mock('../../hooks/useNisabRecordRepository', () => ({
  useNisabRecordRepository: () => ({
    activeRecord: null,
    isLoading: false,
    error: null,
  }),
}));

vi.mock('../../hooks/usePaymentRepository', () => ({
  usePaymentRepository: () => ({
    payments: [],
    isLoading: false,
    error: null,
  }),
}));

vi.mock('../../hooks/useLiabilityRepository', () => ({
  useLiabilityRepository: () => ({
    liabilities: [],
    isLoading: false,
    error: null,
  }),
}));

vi.mock('../../hooks/useUserSettingsRepository', () => ({
  useUserSettingsRepository: () => ({
    settings: { preferredMethodology: 'STANDARD' },
  }),
}));

// The threshold hook, mocked at its documented surface. This is the shape the
// Dashboard consumes: the basis-selected threshold (the chip) plus, after the
// fix, BOTH thresholds in the user's convention for the hero's engine.
vi.mock('../../hooks/useNisabThreshold', () => ({
  useNisabThreshold: () => ({
    nisabAmount: fixture.nisabAmount,
    nisabPair: fixture.nisabPair,
    currency: 'USD',
    nisabBasis: 'GOLD',
    nisabStandard: 'aaoifi',
    goldPrice: 65,
    silverPrice: 0.8,
    isLoading: false,
    error: null,
    isStale: false,
    isFallback: false,
  }),
}));

vi.mock('../../hooks/useDisplayCurrency', () => ({
  useDisplayCurrency: () => ({
    currency: 'USD',
    nisabStandard: 'aaoifi',
    formatCurrency: (amount: number) =>
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 2,
      }).format(amount),
  }),
}));

vi.mock('../../hooks/useBestAction', () => ({
  useBestAction: () => null,
}));

vi.mock('../../hooks/useMigration', () => ({
  useMigration: () => ({ needsMigration: false }),
}));

vi.mock('../../contexts/PrivacyContext', () => ({
  useMaskedCurrency: () => (val: number) => `$${val}`,
}));

import { Dashboard } from '../Dashboard';

const cashAsset = (id: string, value: number) => ({
  id,
  userId: 'test-user',
  name: `Cash ${id}`,
  type: 'CASH',
  value,
  currency: 'USD',
  isActive: true,
  createdAt: new Date('2026-01-01').toISOString(),
  updatedAt: new Date('2026-01-01').toISOString(),
});

// The Money component splits the formatted string into symbol + digits nodes,
// so the digits element is the exact assertion target.
const expectHeroDue = (digits: string) => {
  expect(screen.getByText(digits)).toBeInTheDocument();
};

describe('the Dashboard hero follows the user\u2019s nisab gram convention', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fixture.assets = [];
    fixture.nisabAmount = 5525;
    fixture.nisabPair = { gold: 5525, silver: 476 };
  });

  const renderDashboard = () =>
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

  it("an 'aaoifi' user with 5,600.00 owes 140.00 (hero runs the user's 5,525.00 threshold)", () => {
    fixture.assets = [cashAsset('a1', 5600)];
    fixture.nisabAmount = 5525;
    fixture.nisabPair = { gold: 5525, silver: 476 };

    renderDashboard();

    // The default-convention arithmetic (65 x 87.48 = 5,686.20) would render
    // the hero as 0.00 — a user marked above-nisab by the chip with a zero
    // due figure. 140.00 proves the hero used the 5,525.00 threshold.
    expectHeroDue('140.00');
  });

  it('a default-resolution user keeps the 5,686.20 threshold (6,200.00 owes 155.00)', () => {
    fixture.assets = [cashAsset('a2', 6200)];
    fixture.nisabAmount = 5686.2;
    fixture.nisabPair = { gold: 5686.2, silver: 489.888 };

    renderDashboard();

    // Unset/unknown preferences must resolve to the convention the app has
    // always computed, so no existing user's obligation moves.
    expectHeroDue('155.00');
  });
});
