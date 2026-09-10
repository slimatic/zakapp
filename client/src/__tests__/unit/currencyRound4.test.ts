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
 * Issue #310 (round 4) regression tests — the TWO currency stores.
 *
 * QA proved live on v0.15.1: saving GBP in Settings wrote ONLY
 * profile.preferences.currency; the server-side resolver reads
 * settings.currency, so /api/zakat/nisab kept returning the OLD currency.
 *
 * Contract pinned here:
 * 1. ProfileForm.save syncs settings.currency via PUT /api/user/settings.
 * 2. getNisab() forwards the user's currency as ?currency=.
 * 3. Server /nisab falls back to the profile store when settings.currency
 *    is unset (pre-fix users).
 * 4. Server exposes GET /api/zakat/fx-rates for client-side normalization.
 */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(__dirname, '../../../..');
const readRepo = (rel: string) => fs.readFileSync(path.join(repoRoot, rel), 'utf-8');

describe('issue #310 round 4 — settings save writes BOTH currency stores', () => {
  const profileForm = readRepo('client/src/pages/settings/components/ProfileForm.tsx');

  it('Settings save syncs the server settings store (PUT /user/settings with currency)', () => {
    expect(profileForm).toMatch(/apiService\.updateSettings\(/);
    const syncBlock = profileForm.slice(
      profileForm.indexOf('updateProfile(data)'),
      profileForm.indexOf('updateProfile(data)') + 1200
    );
    expect(syncBlock).toMatch(/currency:\s*data\.preferences\.currency/);
  });

  it('reads current settings before overwriting (no settings-blob data loss)', () => {
    expect(profileForm).toMatch(/apiService\.getSettings\(\)/);
  });
});

describe('issue #310 round 4 — client passes the currency explicitly', () => {
  const api = readRepo('client/src/services/api.ts');

  it('getNisab forwards the currency as a query param', () => {
    expect(api).toMatch(/getNisab\(currency\?: string\)/);
    expect(api).toMatch(/zakat\/nisab\?currency=/);
  });

  it('exposes getFxRates for normalization', () => {
    expect(api).toMatch(/getFxRates\(/);
    expect(api).toMatch(/zakat\/fx-rates/);
  });

  it('useNisabThresholds sends the user currency and keys the cache by it', () => {
    const hooks = readRepo('client/src/services/apiHooks.ts');
    expect(hooks).toMatch(/getNisab\(userCurrency\)/);
    expect(hooks).toMatch(/queryKey: \['zakat', 'nisab', userCurrency\]/);
  });
});

describe('issue #310 round 4 — server fallback + FX endpoint', () => {
  const zakatRoutes = readRepo('server/src/routes/zakat.ts');

  it('/nisab falls back to the profile store when settings.currency is unset', () => {
    const nisabBlock = zakatRoutes.slice(
      zakatRoutes.indexOf("router.get('/nisab'"),
      zakatRoutes.indexOf("router.get('/fx-rates'")
    );
    expect(nisabBlock).toMatch(/getProfile\(req\.userId\)/);
    expect(nisabBlock).toMatch(/\?\.currency/);
  });

  it('exposes GET /fx-rates with USD base', () => {
    expect(zakatRoutes).toMatch(/router\.get\('\/fx-rates'/);
    const fxBlock = zakatRoutes.slice(
      zakatRoutes.indexOf("router.get('/fx-rates'"),
      zakatRoutes.indexOf("router.get('/fx-rates'") + 2000
    );
    expect(fxBlock).toMatch(/base:\s*'USD'/);
    expect(fxBlock).toMatch(/getAllRatesToUSD\(\)/);
  });
});

describe('issue #310 round 4 — SW navigation fallback', () => {
  it('navigateFallback is the app shell, NOT offline.html', () => {
    const viteConfig = readRepo('client/vite.config.ts');
    expect(viteConfig).toMatch(/navigateFallback:\s*'\/index\.html'/);
    expect(viteConfig).not.toMatch(/navigateFallback:\s*'\/offline\.html'/);
  });
});

describe('issue #310 round 4 — nginx SPA fallback', () => {
  it('try_files does NOT probe $uri/ (403-on-directory regression)', () => {
    const conf = readRepo('docker/nginx-production.conf');
    expect(conf).toMatch(/try_files \$uri \/index\.html;/);
    expect(conf).not.toMatch(/try_files \$uri \$uri\//);
  });
});