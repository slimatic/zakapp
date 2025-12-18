import request from 'supertest';

// Mock @zakapp/shared to avoid consuming ESM build artifacts in Jest runtime
jest.mock('@zakapp/shared', () => ({
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
