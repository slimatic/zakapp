import { vi, type Mock } from 'vitest';
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

import request from 'supertest';

// Mock @zakapp/shared to avoid consuming ESM build artifacts in Jest runtime
vi.mock('@zakapp/shared', () => ({
  VALID_ASSET_CATEGORY_VALUES: ['cash','gold','silver','business','property','stocks','crypto','debts','expenses'],
  PASSIVE_INVESTMENT_TYPES: ['Stock','ETF','Mutual Fund','Roth IRA']
}));

import { app } from '../../app';

describe('Integration: Asset eligibility and passive modifier', () => {
  it('creates a passive asset, then disables eligibility and verifies summary excludes it', async () => {
    const email = `elig.test.${Date.now()}@example.com`;
    const password = 'TestPass123$';

    // Register
    await request(app)
      .post('/api/auth/register')
      .send({ email, username: email, password, confirmPassword: password, firstName: 'E', lastName: 'T' })
      .expect(201);

    // Login
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ username: email, password })
      .expect(200);

    const token = loginRes.body?.data?.tokens?.accessToken;
    expect(token).toBeTruthy();

    // Create a passive stock asset with zakatEligible true
    const createRes = await request(app)
      .post('/api/assets')
      .set('Authorization', `Bearer ${token}`)
      .send({ category: 'stocks', name: 'Passive Fund', value: 6000, currency: 'USD', acquisitionDate: new Date().toISOString(), isPassiveInvestment: true, zakatEligible: true })
      .expect(201);

    const asset = createRes.body.data.asset;
    expect(asset).toBeTruthy();
    expect(asset.isPassiveInvestment).toBe(true);
    expect(asset.zakatEligible).toBe(true);

    // Check assets summary includes zakatable value (0.3 * 6000 = 1800)
    const listRes1 = await request(app)
      .get('/api/assets')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(listRes1.body.data.summary).toHaveProperty('totalZakatableValue');
    expect(Number(listRes1.body.data.summary.totalZakatableValue)).toBeGreaterThan(0);

    // Update asset to set zakatEligible false
    await request(app)
      .put(`/api/assets/${asset.assetId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ zakatEligible: false })
      .expect(200);

    // Check assets summary now excludes the asset from zakatable total
    const listRes2 = await request(app)
      .get('/api/assets')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(listRes2.body.data.summary.totalZakatableValue).toBe(0);
  }, 20000);
});
