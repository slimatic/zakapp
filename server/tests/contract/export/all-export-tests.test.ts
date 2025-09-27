// T047-T056 - Data Export Contract Tests
import request from 'supertest';
import app from '../../../src/app';

describe('Data Export API Contract Tests', () => {
  let accessToken: string;

  beforeEach(async () => {
    await request(app).post('/api/auth/register').send({
      email: 'dataexport@example.com', password: 'SecurePassword123!', username: 'dataexportuser'
    });
    const loginResponse = await request(app).post('/api/auth/login').send({
      email: 'dataexport@example.com', password: 'SecurePassword123!'
    });
    accessToken = loginResponse.body.accessToken;
  });

  describe('POST /api/export/full', () => {
    it('should export all user data', async () => {
      const response = await request(app).post('/api/export/full').set('Authorization', `Bearer ${accessToken}`)
        .send({format: 'JSON', includeHistory: true}).expect(200);
      expect(response.body).toHaveProperty('success', true);
    });
  });

  describe('POST /api/export/assets', () => {
    it('should export user assets', async () => {
      const response = await request(app).post('/api/export/assets').set('Authorization', `Bearer ${accessToken}`)
        .send({format: 'CSV', dateRange: {from: '2024-01-01', to: '2024-12-31'}}).expect(200);
      expect(response.body).toHaveProperty('success', true);
    });
  });

  describe('POST /api/export/zakat-history', () => {
    it('should export Zakat calculation history', async () => {
      const response = await request(app).post('/api/export/zakat-history').set('Authorization', `Bearer ${accessToken}`)
        .send({format: 'PDF', includePayments: true}).expect(200);
      expect(response.body).toHaveProperty('success', true);
    });
  });

  describe('POST /api/export/payments', () => {
    it('should export payment records', async () => {
      const response = await request(app).post('/api/export/payments').set('Authorization', `Bearer ${accessToken}`)
        .send({format: 'EXCEL', year: 2024}).expect(200);
      expect(response.body).toHaveProperty('success', true);
    });
  });

  describe('GET /api/export/templates', () => {
    it('should return available export templates', async () => {
      const response = await request(app).get('/api/export/templates').set('Authorization', `Bearer ${accessToken}`).expect(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('templates');
    });
  });

  describe('POST /api/export/custom', () => {
    it('should create custom export', async () => {
      const response = await request(app).post('/api/export/custom').set('Authorization', `Bearer ${accessToken}`)
        .send({templateId: 'custom-template', fields: ['assets', 'calculations'], format: 'JSON'}).expect(200);
      expect(response.body).toHaveProperty('success', true);
    });
  });

  describe('GET /api/export/status/:exportId', () => {
    it('should return export status', async () => {
      const response = await request(app).get('/api/export/status/test-export-id').set('Authorization', `Bearer ${accessToken}`).expect(200);
      expect(response.body).toHaveProperty('success', true);
    });
  });

  describe('GET /api/export/download/:exportId', () => {
    it('should download completed export', async () => {
      const response = await request(app).get('/api/export/download/test-export-id').set('Authorization', `Bearer ${accessToken}`).expect(200);
      expect(response.body).toHaveProperty('success', true);
    });
  });

  describe('DELETE /api/export/:exportId', () => {
    it('should delete export file', async () => {
      const response = await request(app).delete('/api/export/test-export-id').set('Authorization', `Bearer ${accessToken}`).expect(200);
      expect(response.body).toHaveProperty('success', true);
    });
  });

  describe('POST /api/import/validate', () => {
    it('should validate import data', async () => {
      const response = await request(app).post('/api/import/validate').set('Authorization', `Bearer ${accessToken}`)
        .send({format: 'CSV', data: 'type,name,value\\nCASH,Test,1000'}).expect(200);
      expect(response.body).toHaveProperty('success', true);
    });
  });
});