// T027, T028, T029, T030, T031 - Remaining Zakat tests
import request from 'supertest';
import app from '../../../src/app';

describe('GET /api/zakat/methodologies', () => {
  it('should return available calculation methodologies', async () => {
    const response = await request(app).get('/api/zakat/methodologies').expect(200);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('methodologies');
    expect(response.body.methodologies).toBeInstanceOf(Array);
  });
});

describe('GET /api/zakat/nisab', () => {
  it('should return current nisab thresholds', async () => {
    const response = await request(app).get('/api/zakat/nisab').expect(200);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('nisab');
  });
});

describe('POST /api/zakat/simulate', () => {
  let accessToken: string;
  beforeEach(async () => {
    await request(app).post('/api/auth/register').send({email: 'simulate@example.com', password: 'SecurePassword123!', username: 'simulateuser'});
    const loginResponse = await request(app).post('/api/auth/login').send({email: 'simulate@example.com', password: 'SecurePassword123!'});
    accessToken = loginResponse.body.accessToken;
  });
  it('should simulate Zakat calculation', async () => {
    const response = await request(app).post('/api/zakat/simulate').set('Authorization', `Bearer ${accessToken}`)
      .send({assets: [{type: 'CASH', value: 10000}], methodologyId: 'standard'}).expect(200);
    expect(response.body).toHaveProperty('success', true);
  });
});

describe('GET /api/zakat/reports/:id', () => {
  let accessToken: string;
  beforeEach(async () => {
    await request(app).post('/api/auth/register').send({email: 'report@example.com', password: 'SecurePassword123!', username: 'reportuser'});
    const loginResponse = await request(app).post('/api/auth/login').send({email: 'report@example.com', password: 'SecurePassword123!'});
    accessToken = loginResponse.body.accessToken;
  });
  it('should generate detailed Zakat report', async () => {
    const response = await request(app).get('/api/zakat/reports/test-id').set('Authorization', `Bearer ${accessToken}`).expect(200);
    expect(response.body).toHaveProperty('success', true);
  });
});

describe('POST /api/zakat/schedule', () => {
  let accessToken: string;
  beforeEach(async () => {
    await request(app).post('/api/auth/register').send({email: 'schedule@example.com', password: 'SecurePassword123!', username: 'scheduleuser'});
    const loginResponse = await request(app).post('/api/auth/login').send({email: 'schedule@example.com', password: 'SecurePassword123!'});
    accessToken = loginResponse.body.accessToken;
  });
  it('should schedule automatic Zakat calculations', async () => {
    const response = await request(app).post('/api/zakat/schedule').set('Authorization', `Bearer ${accessToken}`)
      .send({frequency: 'ANNUAL', nextCalculation: '2025-01-01'}).expect(201);
    expect(response.body).toHaveProperty('success', true);
  });
});