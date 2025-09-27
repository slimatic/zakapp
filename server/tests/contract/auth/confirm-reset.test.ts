import request from 'supertest';
import app from '../../../src/app'; // This will fail until we create the app

describe('POST /api/auth/confirm-reset', () => {
  let resetToken: string;
  let resetTokenId: string;

  beforeEach(async () => {
    // Register test user
    await request(app)
      .post('/api/auth/register')
      .send({
        email: 'confirm@example.com',
        password: 'OldPassword123!',
        username: 'confirmuser'
      });

    // Initiate password reset
    const resetResponse = await request(app)
      .post('/api/auth/reset-password')
      .send({ email: 'confirm@example.com' });

    resetTokenId = resetResponse.body.resetTokenId;
    // In real implementation, token would be sent via email
    // For testing, we'll assume we can access it somehow
    resetToken = 'mock-reset-token-from-email';
  });

  it('should confirm password reset with valid token and new password', async () => {
    const newPassword = 'NewSecurePassword123!';
    
    const response = await request(app)
      .post('/api/auth/confirm-reset')
      .send({
        token: resetToken,
        password: newPassword,
        confirmPassword: newPassword
      })
      .expect(200);

    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('message', 'Password reset successfully');
    
    // Should not return sensitive data
    expect(response.body).not.toHaveProperty('user');
    expect(response.body).not.toHaveProperty('password');
  });

  it('should allow login with new password after reset', async () => {
    const newPassword = 'NewSecurePassword123!';
    
    // Confirm password reset
    await request(app)
      .post('/api/auth/confirm-reset')
      .send({
        token: resetToken,
        password: newPassword,
        confirmPassword: newPassword
      })
      .expect(200);

    // Login with new password should work
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'confirm@example.com',
        password: newPassword
      })
      .expect(200);

    expect(loginResponse.body).toHaveProperty('success', true);
    expect(loginResponse.body).toHaveProperty('accessToken');
  });

  it('should reject old password after reset', async () => {
    const newPassword = 'NewSecurePassword123!';
    
    // Confirm password reset
    await request(app)
      .post('/api/auth/confirm-reset')
      .send({
        token: resetToken,
        password: newPassword,
        confirmPassword: newPassword
      })
      .expect(200);

    // Login with old password should fail
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'confirm@example.com',
        password: 'OldPassword123!'
      })
      .expect(401);

    expect(loginResponse.body).toHaveProperty('success', false);
    expect(loginResponse.body).toHaveProperty('error', 'INVALID_CREDENTIALS');
  });

  it('should return 400 for missing required fields', async () => {
    const response = await request(app)
      .post('/api/auth/confirm-reset')
      .send({ token: resetToken })
      .expect(400);

    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('error', 'VALIDATION_ERROR');
    expect(response.body).toHaveProperty('details');
    expect(response.body.details).toBeInstanceOf(Array);
  });

  it('should return 400 for password mismatch', async () => {
    const response = await request(app)
      .post('/api/auth/confirm-reset')
      .send({
        token: resetToken,
        password: 'NewPassword123!',
        confirmPassword: 'DifferentPassword123!'
      })
      .expect(400);

    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('error', 'VALIDATION_ERROR');
    expect(response.body).toHaveProperty('message', 'Passwords do not match');
  });

  it('should return 400 for weak password', async () => {
    const response = await request(app)
      .post('/api/auth/confirm-reset')
      .send({
        token: resetToken,
        password: '123',
        confirmPassword: '123'
      })
      .expect(400);

    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('error', 'VALIDATION_ERROR');
    expect(response.body.details).toContain('Password must be at least 8 characters long');
  });

  it('should return 400 for invalid reset token', async () => {
    const response = await request(app)
      .post('/api/auth/confirm-reset')
      .send({
        token: 'invalid-reset-token',
        password: 'NewPassword123!',
        confirmPassword: 'NewPassword123!'
      })
      .expect(400);

    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('error', 'INVALID_TOKEN');
    expect(response.body).toHaveProperty('message', 'Invalid or expired reset token');
  });

  it('should return 400 for expired reset token', async () => {
    // Mock expired token
    const expiredToken = 'expired-reset-token';
    
    const response = await request(app)
      .post('/api/auth/confirm-reset')
      .send({
        token: expiredToken,
        password: 'NewPassword123!',
        confirmPassword: 'NewPassword123!'
      })
      .expect(400);

    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('error', 'TOKEN_EXPIRED');
  });

  it('should invalidate reset token after successful use', async () => {
    const newPassword = 'NewSecurePassword123!';
    
    // First use should succeed
    await request(app)
      .post('/api/auth/confirm-reset')
      .send({
        token: resetToken,
        password: newPassword,
        confirmPassword: newPassword
      })
      .expect(200);

    // Second use of same token should fail
    const response = await request(app)
      .post('/api/auth/confirm-reset')
      .send({
        token: resetToken,
        password: 'AnotherPassword123!',
        confirmPassword: 'AnotherPassword123!'
      })
      .expect(400);

    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('error', 'TOKEN_USED');
  });

  it('should invalidate all user sessions after password reset', async () => {
    // Create a session by logging in first
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'confirm@example.com',
        password: 'OldPassword123!'
      });

    const oldAccessToken = loginResponse.body.accessToken;

    // Reset password
    await request(app)
      .post('/api/auth/confirm-reset')
      .send({
        token: resetToken,
        password: 'NewSecurePassword123!',
        confirmPassword: 'NewSecurePassword123!'
      })
      .expect(200);

    // Old session should be invalidated
    const meResponse = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${oldAccessToken}`)
      .expect(401);

    expect(meResponse.body).toHaveProperty('success', false);
    expect(meResponse.body).toHaveProperty('error', 'SESSION_INVALIDATED');
  });

  it('should enforce password complexity requirements', async () => {
    const weakPasswords = [
      'password',          // No numbers or special chars
      '12345678',          // No letters
      'Password',          // No numbers or special chars
      'password123',       // No special chars
      'PASSWORD123!',      // No lowercase
      'password123!',      // No uppercase
    ];

    for (const weakPassword of weakPasswords) {
      const response = await request(app)
        .post('/api/auth/confirm-reset')
        .send({
          token: resetToken,
          password: weakPassword,
          confirmPassword: weakPassword
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'VALIDATION_ERROR');
    }
  });

  it('should log security event for password reset', async () => {
    const response = await request(app)
      .post('/api/auth/confirm-reset')
      .send({
        token: resetToken,
        password: 'NewSecurePassword123!',
        confirmPassword: 'NewSecurePassword123!'
      })
      .expect(200);

    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('eventId');
    expect(typeof response.body.eventId).toBe('string');
  });
});