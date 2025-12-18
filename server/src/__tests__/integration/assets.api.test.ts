import request from 'supertest';

// Mock @zakapp/shared to avoid consuming ESM build artifacts in Jest runtime
jest.mock('@zakapp/shared', () => ({
  VALID_ASSET_CATEGORY_VALUES: ['cash','gold','silver','business','property','stocks','crypto','debts','expenses']
}));

import { app } from '../../app';

describe('Integration: Auth and Assets API', () => {
  it('should register, login, and create an asset successfully', async () => {
    const email = `integration.test.${Date.now()}@example.com`;
    const password = 'TestPass123$';

    // Register
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({
        email,
        username: email,
        password,
        confirmPassword: password,
        firstName: 'Integration',
        lastName: 'Tester'
      })
      .expect(201);

    expect(regRes.body).toHaveProperty('success', true);
    expect(regRes.body.data).toHaveProperty('tokens');

    // Login
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ username: email, password })
      .expect(200);

    const token = loginRes.body?.data?.tokens?.accessToken;
    expect(token).toBeTruthy();

    // Create asset with canonical category 'property'
    const assetPayload = {
      category: 'property',
      name: 'Integration House',
      value: 12345,
      currency: 'USD',
      acquisitionDate: new Date().toISOString()
    };

    const createRes = await request(app)
      .post('/api/assets')
      .set('Authorization', `Bearer ${token}`)
      .send(assetPayload)
      .expect(201);

    expect(createRes.body).toHaveProperty('success', true);
    expect(createRes.body.data).toHaveProperty('asset');
    expect(createRes.body.data.asset).toMatchObject({ name: 'Integration House', category: 'property' });
  }, 20000);
});
