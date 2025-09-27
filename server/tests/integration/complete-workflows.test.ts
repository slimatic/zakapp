// T057-T063 - Integration Tests
import request from 'supertest';
import app from '../../src/app';

describe('Integration Tests - Complete User Workflows', () => {
  
  describe('T057: Complete User Registration to Zakat Calculation Flow', () => {
    it('should complete full user journey from registration to Zakat calculation', async () => {
      // Register new user
      const registerResponse = await request(app).post('/api/auth/register').send({
        email: 'integration@example.com', password: 'SecurePassword123!', username: 'integrationuser'
      }).expect(201);
      expect(registerResponse.body).toHaveProperty('success', true);

      // Login
      const loginResponse = await request(app).post('/api/auth/login').send({
        email: 'integration@example.com', password: 'SecurePassword123!'
      }).expect(200);
      const accessToken = loginResponse.body.accessToken;

      // Create assets
      await request(app).post('/api/assets').set('Authorization', `Bearer ${accessToken}`).send({
        type: 'CASH', name: 'Savings', value: 10000.00, currency: 'USD'
      }).expect(201);

      // Calculate Zakat
      const calculationResponse = await request(app).post('/api/zakat/calculate')
        .set('Authorization', `Bearer ${accessToken}`).send({
          methodologyId: 'standard', year: 2024
        }).expect(200);
      
      expect(calculationResponse.body.calculation).toHaveProperty('zakatOwed');
      expect(calculationResponse.body.calculation.zakatOwed).toBeGreaterThan(0);
    });
  });

  describe('T058: Asset Management with Zakat Recalculation Workflow', () => {
    it('should handle asset updates and automatic Zakat recalculation', async () => {
      // Setup user
      await request(app).post('/api/auth/register').send({
        email: 'assetflow@example.com', password: 'SecurePassword123!', username: 'assetflowuser'
      });
      const loginResponse = await request(app).post('/api/auth/login').send({
        email: 'assetflow@example.com', password: 'SecurePassword123!'
      });
      const accessToken = loginResponse.body.accessToken;

      // Create initial asset
      const assetResponse = await request(app).post('/api/assets').set('Authorization', `Bearer ${accessToken}`).send({
        type: 'CASH', name: 'Initial Asset', value: 5000.00, currency: 'USD'
      }).expect(201);
      const assetId = assetResponse.body.asset.id;

      // Initial calculation
      const firstCalculation = await request(app).post('/api/zakat/calculate')
        .set('Authorization', `Bearer ${accessToken}`).send({methodologyId: 'standard', year: 2024}).expect(200);
      
      // Update asset value
      await request(app).put(`/api/assets/${assetId}`).set('Authorization', `Bearer ${accessToken}`).send({
        value: 15000.00
      }).expect(200);

      // Recalculate Zakat
      const secondCalculation = await request(app).post('/api/zakat/calculate')
        .set('Authorization', `Bearer ${accessToken}`).send({methodologyId: 'standard', year: 2024}).expect(200);

      expect(secondCalculation.body.calculation.zakatOwed).toBeGreaterThan(firstCalculation.body.calculation.zakatOwed);
    });
  });

  describe('T059: Multi-Methodology Comparison Workflow', () => {
    it('should calculate Zakat using different methodologies for comparison', async () => {
      // Setup
      await request(app).post('/api/auth/register').send({
        email: 'methodology@example.com', password: 'SecurePassword123!', username: 'methodologyuser'
      });
      const loginResponse = await request(app).post('/api/auth/login').send({
        email: 'methodology@example.com', password: 'SecurePassword123!'
      });
      const accessToken = loginResponse.body.accessToken;

      await request(app).post('/api/assets').set('Authorization', `Bearer ${accessToken}`).send({
        type: 'GOLD', name: 'Gold Holdings', value: 10000.00, currency: 'USD', weight: 200.0, unit: 'GRAM'
      });

      // Calculate with Standard methodology
      const standardCalc = await request(app).post('/api/zakat/calculate')
        .set('Authorization', `Bearer ${accessToken}`).send({methodologyId: 'standard', year: 2024}).expect(200);

      // Calculate with Hanafi methodology
      const hanafiCalc = await request(app).post('/api/zakat/calculate')
        .set('Authorization', `Bearer ${accessToken}`).send({methodologyId: 'hanafi', year: 2024}).expect(200);

      expect(standardCalc.body.calculation.methodology).not.toEqual(hanafiCalc.body.calculation.methodology);
    });
  });

  describe('T060: Payment Recording and History Tracking', () => {
    it('should record payments and track payment history', async () => {
      // Setup
      await request(app).post('/api/auth/register').send({
        email: 'payments@example.com', password: 'SecurePassword123!', username: 'paymentsuser'
      });
      const loginResponse = await request(app).post('/api/auth/login').send({
        email: 'payments@example.com', password: 'SecurePassword123!'
      });
      const accessToken = loginResponse.body.accessToken;

      // Record payment
      await request(app).post('/api/zakat/payments').set('Authorization', `Bearer ${accessToken}`).send({
        amount: 250.00, currency: 'USD', recipient: 'Local Charity', date: '2024-01-15'
      }).expect(201);

      // Check payment history
      const historyResponse = await request(app).get('/api/zakat/payments')
        .set('Authorization', `Bearer ${accessToken}`).expect(200);
      
      expect(historyResponse.body.payments).toHaveLength(1);
      expect(historyResponse.body.payments[0]).toHaveProperty('amount', 250.00);
    });
  });

  describe('T061: Data Export and Import Workflow', () => {
    it('should export and import user data successfully', async () => {
      // Setup
      await request(app).post('/api/auth/register').send({
        email: 'exportimport@example.com', password: 'SecurePassword123!', username: 'exportimportuser'
      });
      const loginResponse = await request(app).post('/api/auth/login').send({
        email: 'exportimport@example.com', password: 'SecurePassword123!'
      });
      const accessToken = loginResponse.body.accessToken;

      // Create test data
      await request(app).post('/api/assets').set('Authorization', `Bearer ${accessToken}`).send({
        type: 'CASH', name: 'Test Asset', value: 5000.00, currency: 'USD'
      });

      // Export assets
      const exportResponse = await request(app).get('/api/assets/export?format=JSON')
        .set('Authorization', `Bearer ${accessToken}`).expect(200);
      
      expect(exportResponse.body.data).toHaveLength(1);
      expect(exportResponse.body.data[0]).toHaveProperty('name', 'Test Asset');
    });
  });

  describe('T062: User Profile and Settings Management', () => {
    it('should manage user profile and settings comprehensively', async () => {
      // Setup
      await request(app).post('/api/auth/register').send({
        email: 'profile@example.com', password: 'SecurePassword123!', username: 'profileuser'
      });
      const loginResponse = await request(app).post('/api/auth/login').send({
        email: 'profile@example.com', password: 'SecurePassword123!'
      });
      const accessToken = loginResponse.body.accessToken;

      // Update profile
      await request(app).put('/api/user/profile').set('Authorization', `Bearer ${accessToken}`).send({
        firstName: 'John', lastName: 'Doe', currency: 'USD'
      }).expect(200);

      // Update settings
      await request(app).put('/api/user/settings').set('Authorization', `Bearer ${accessToken}`).send({
        defaultCalculationMethod: 'hanafi', notifications: true
      }).expect(200);

      // Verify changes
      const profileResponse = await request(app).get('/api/user/profile')
        .set('Authorization', `Bearer ${accessToken}`).expect(200);
      
      expect(profileResponse.body.profile).toHaveProperty('firstName', 'John');
    });
  });

  describe('T063: Security and Session Management', () => {
    it('should handle authentication, session management, and password changes', async () => {
      // Register
      await request(app).post('/api/auth/register').send({
        email: 'security@example.com', password: 'SecurePassword123!', username: 'securityuser'
      }).expect(201);

      // Login
      const loginResponse = await request(app).post('/api/auth/login').send({
        email: 'security@example.com', password: 'SecurePassword123!'
      }).expect(200);
      const accessToken = loginResponse.body.accessToken;

      // Check active sessions
      const sessionsResponse = await request(app).get('/api/user/sessions')
        .set('Authorization', `Bearer ${accessToken}`).expect(200);
      expect(sessionsResponse.body.sessions).toHaveLength(1);

      // Change password
      await request(app).post('/api/user/change-password').set('Authorization', `Bearer ${accessToken}`).send({
        currentPassword: 'SecurePassword123!', newPassword: 'NewSecurePassword123!'
      }).expect(200);

      // Verify old password no longer works
      const oldPasswordLogin = await request(app).post('/api/auth/login').send({
        email: 'security@example.com', password: 'SecurePassword123!'
      }).expect(401);
      expect(oldPasswordLogin.body).toHaveProperty('success', false);

      // Verify new password works
      await request(app).post('/api/auth/login').send({
        email: 'security@example.com', password: 'NewSecurePassword123!'
      }).expect(200);
    });
  });
});