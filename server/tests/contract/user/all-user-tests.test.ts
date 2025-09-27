// T032-T046 - User Management Contract Tests
import request from 'supertest';
import app from '../../../src/app';

describe('User Management API Contract Tests', () => {
  let accessToken: string;

  beforeEach(async () => {
    await request(app).post('/api/auth/register').send({
      email: 'usermanagement@example.com', password: 'SecurePassword123!', username: 'usermgmtuser'
    });
    const loginResponse = await request(app).post('/api/auth/login').send({
      email: 'usermanagement@example.com', password: 'SecurePassword123!'
    });
    accessToken = loginResponse.body.accessToken;
  });

  describe('GET /api/user/profile', () => {
    it('should return user profile data', async () => {
      const response = await request(app).get('/api/user/profile').set('Authorization', `Bearer ${accessToken}`).expect(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('profile');
    });
  });

  describe('PUT /api/user/profile', () => {
    it('should update user profile', async () => {
      const response = await request(app).put('/api/user/profile').set('Authorization', `Bearer ${accessToken}`)
        .send({firstName: 'John', lastName: 'Doe', currency: 'USD'}).expect(200);
      expect(response.body).toHaveProperty('success', true);
    });
  });

  describe('GET /api/user/settings', () => {
    it('should return user settings', async () => {
      const response = await request(app).get('/api/user/settings').set('Authorization', `Bearer ${accessToken}`).expect(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('settings');
    });
  });

  describe('PUT /api/user/settings', () => {
    it('should update user settings', async () => {
      const response = await request(app).put('/api/user/settings').set('Authorization', `Bearer ${accessToken}`)
        .send({defaultCalculationMethod: 'hanafi', notifications: true}).expect(200);
      expect(response.body).toHaveProperty('success', true);
    });
  });

  describe('POST /api/user/change-password', () => {
    it('should change user password', async () => {
      const response = await request(app).post('/api/user/change-password').set('Authorization', `Bearer ${accessToken}`)
        .send({currentPassword: 'SecurePassword123!', newPassword: 'NewSecurePassword123!'}).expect(200);
      expect(response.body).toHaveProperty('success', true);
    });
  });

  describe('DELETE /api/user/account', () => {
    it('should delete user account', async () => {
      const response = await request(app).delete('/api/user/account').set('Authorization', `Bearer ${accessToken}`)
        .send({password: 'SecurePassword123!', confirmation: 'DELETE'}).expect(200);
      expect(response.body).toHaveProperty('success', true);
    });
  });

  describe('GET /api/user/sessions', () => {
    it('should return active user sessions', async () => {
      const response = await request(app).get('/api/user/sessions').set('Authorization', `Bearer ${accessToken}`).expect(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('sessions');
    });
  });

  describe('DELETE /api/user/sessions/:id', () => {
    it('should revoke specific session', async () => {
      const response = await request(app).delete('/api/user/sessions/test-session-id').set('Authorization', `Bearer ${accessToken}`).expect(200);
      expect(response.body).toHaveProperty('success', true);
    });
  });

  describe('POST /api/user/export-request', () => {
    it('should request user data export', async () => {
      const response = await request(app).post('/api/user/export-request').set('Authorization', `Bearer ${accessToken}`)
        .send({format: 'JSON', includeAssets: true}).expect(200);
      expect(response.body).toHaveProperty('success', true);
    });
  });

  describe('GET /api/user/export-status/:requestId', () => {
    it('should check export request status', async () => {
      const response = await request(app).get('/api/user/export-status/test-request-id').set('Authorization', `Bearer ${accessToken}`).expect(200);
      expect(response.body).toHaveProperty('success', true);
    });
  });

  describe('GET /api/user/privacy-settings', () => {
    it('should return privacy settings', async () => {
      const response = await request(app).get('/api/user/privacy-settings').set('Authorization', `Bearer ${accessToken}`).expect(200);
      expect(response.body).toHaveProperty('success', true);
    });
  });

  describe('PUT /api/user/privacy-settings', () => {
    it('should update privacy settings', async () => {
      const response = await request(app).put('/api/user/privacy-settings').set('Authorization', `Bearer ${accessToken}`)
        .send({shareData: false, analytics: false}).expect(200);
      expect(response.body).toHaveProperty('success', true);
    });
  });

  describe('GET /api/user/audit-log', () => {
    it('should return user activity audit log', async () => {
      const response = await request(app).get('/api/user/audit-log').set('Authorization', `Bearer ${accessToken}`).expect(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('auditLog');
    });
  });

  describe('POST /api/user/backup', () => {
    it('should create user data backup', async () => {
      const response = await request(app).post('/api/user/backup').set('Authorization', `Bearer ${accessToken}`)
        .send({includeHistory: true, encrypted: true}).expect(201);
      expect(response.body).toHaveProperty('success', true);
    });
  });

  describe('POST /api/user/restore', () => {
    it('should restore user data from backup', async () => {
      const response = await request(app).post('/api/user/restore').set('Authorization', `Bearer ${accessToken}`)
        .send({backupId: 'test-backup-id', overwrite: false}).expect(200);
      expect(response.body).toHaveProperty('success', true);
    });
  });
});