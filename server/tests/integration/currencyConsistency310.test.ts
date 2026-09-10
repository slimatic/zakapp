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
 * Issue #310 regression tests — currency consistency (round 3).
 *
 * The user (IDR) reported on v0.15 that Dashboard/assets/liabilities still
 * show USD and the zakat calculation is computed on USD. Root causes found:
 *
 * 1. GET /api/zakat/nisab hardcoded 'USD' and ignored the user's preference.
 * 2. Client useNisabThreshold call-sites hardcoded 'USD' (5 of 6 sites).
 * 3. AssetList's local formatCurrency defaulted to 'USD'.
 * 4. POST /api/zakat/calculate returned USD totals with no currency field.
 *
 * These tests pin the FIX CONTRACT so the class of bug cannot silently return.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// The server /nisab route source must not hardcode a calculateNisab currency
// argument — it must resolve from query param or user settings.
import fs from 'node:fs';
import path from 'node:path';

const readRepo = (rel: string) =>
  fs.readFileSync(path.join(__dirname, rel), 'utf-8');

describe('issue #310 — server currency resolution', () => {
  let zakatRoutes: string;
  beforeEach(() => {
    zakatRoutes = readRepo('../../src/routes/zakat.ts');
  });

  it('/nisab endpoint no longer hardcodes USD in calculateNisab call', () => {
    const nisabBlock = zakatRoutes.slice(
      zakatRoutes.indexOf("router.get('/nisab'"),
      zakatRoutes.indexOf("router.get('/nisab'") + 3000
    );
    expect(nisabBlock).not.toMatch(/calculateNisab\([^)]*'USD'/);
    expect(nisabBlock).toMatch(/calculateNisab\(methodology,\s*currency\)/);
  });

  it('/nisab endpoint resolves user preference from encrypted settings', () => {
    expect(zakatRoutes).toMatch(/getSettings\(req\.userId/);
    expect(zakatRoutes).toMatch(/settings.*currency|currency.*settings/s);
  });

  it('/nisab endpoint accepts explicit ?currency= override', () => {
    expect(zakatRoutes).toMatch(/req\.query\.currency/);
  });

  it('/nisab endpoint returns the resolved currency in the response', () => {
    const nisabBlock = zakatRoutes.slice(
      zakatRoutes.indexOf("router.get('/nisab'"),
      zakatRoutes.indexOf("router.get('/nisab'") + 3500
    );
    expect(nisabBlock).toMatch(/currency,/);
  });

  it('/calculate accepts optional currency in request schema', () => {
    expect(zakatRoutes).toMatch(/currency:\s*z\.string\(\)\.length\(3\)\.optional\(\)/);
  });

  it('/calculate converts the summary into the display currency', () => {
    const calcBlock = zakatRoutes.slice(
      zakatRoutes.indexOf("router.post('/calculate'"),
      zakatRoutes.indexOf("router.post('/calculate'") + 12000
    );
    expect(calcBlock).toMatch(/getExchangeRate\('USD',\s*displayCurrency\)/);
    expect(calcBlock).toMatch(/currency:\s*displayCurrency/);
  });

  it('exchange-rate failure falls back to USD, never a silent 1.0 mislabel', () => {
    const calcBlock = zakatRoutes.slice(
      zakatRoutes.indexOf("router.post('/calculate'"),
      zakatRoutes.indexOf("router.post('/calculate'") + 14000
    );
    // On conversion failure the response must NOT claim the target currency
    expect(calcBlock).toMatch(/displayCurrency = 'USD'/);
  });
});

describe('issue #310 — client call-sites use the user currency', () => {
  const clientRoot = path.join(__dirname, '..', '..', '..');

  const cases: Array<{ file: string; mustMatch: RegExp; label: string }> = [
    {
      file: 'client/src/components/dashboard/ActiveRecordWidget.tsx',
      mustMatch: /useNisabThreshold\(userCurrency,\s*nisabBasis\)/,
      label: 'ActiveRecordWidget hawl widget',
    },
    {
      file: 'client/src/pages/onboarding/steps/ZakatSetupStep.tsx',
      mustMatch: /useNisabThreshold\(onboardingCurrency,\s*nisabBasis\)/,
      label: 'ZakatSetupStep onboarding',
    },
    {
      file: 'client/src/pages/onboarding/steps/MetalsStep.tsx',
      mustMatch: /useNisabThreshold\(userCurrency,\s*'GOLD'\)/,
      label: 'MetalsStep metal prices',
    },
  ];

  for (const { file, mustMatch, label } of cases) {
    it(`${label} passes a user-derived currency (no hardcoded USD)`, () => {
      const src = fs.readFileSync(path.join(clientRoot, file), 'utf-8');
      expect(src.match(mustMatch), `${label} still hardcodes USD`).toBeTruthy();
      // And no remaining hardcoded 'USD' first-arg at a useNisabThreshold call
      const hardcoded = src.match(/useNisabThreshold\(\s*'USD'/);
      expect(hardcoded, `${label} hardcodes 'USD'`).toBeNull();
    });
  }

  it('AssetList formatCurrency falls back to userCurrency, not USD', () => {
    const src = fs.readFileSync(
      path.join(clientRoot, 'client/src/components/assets/AssetList.tsx'),
      'utf-8'
    );
    expect(src).toMatch(/currency:\s*currency \|\| userCurrency/);
    expect(src).not.toMatch(/formatCurrency = \(value: number,\s*currency = 'USD'/);
  });
});