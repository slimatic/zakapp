import request from 'supertest';
import app from '../../../src/app'; // This will fail until we create the app

describe('POST /api/auth/reset-password', () => {
  beforeEach(async () => {
    // Register test user
    await request(app)
      .post('/api/auth/register')
      .send({
        email: 'reset@example.com',
        password: 'SecurePassword123!',
        username: 'resetuser'
      });
  });

  it('should initiate password reset with valid email', async () => {
    const response = await request(app)
      .post('/api/auth/reset-password')
      .send({ email: 'reset@example.com' })
      .expect(200);

    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('message', 'Password reset email sent');
    expect(response.body).toHaveProperty('resetTokenId'); // For tracking, not the actual token
    
    // Should not expose sensitive information
    expect(response.body).not.toHaveProperty('resetToken');
    expect(response.body).not.toHaveProperty('user');
  });

  it('should return 400 for missing email', async () => {
    const response = await request(app)
      .post('/api/auth/reset-password')
      .send({})
      .expect(400);

    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('error', 'VALIDATION_ERROR');
    expect(response.body).toHaveProperty('details');
    expect(response.body.details).toBeInstanceOf(Array);
  });

  it('should return 400 for invalid email format', async () => {
    const response = await request(app)
      .post('/api/auth/reset-password')
      .send({ email: 'invalid-email-format' })
      .expect(400);

    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('error', 'VALIDATION_ERROR');
  });

  it('should return success even for non-existent email (security)', async () => {
    // Should not reveal if email exists or not
    const response = await request(app)
      .post('/api/auth/reset-password')
      .send({ email: 'nonexistent@example.com' })
      .expect(200);

    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('message', 'Password reset email sent');
    
    // Should not indicate whether email was found
    expect(response.body).not.toHaveProperty('userFound');
    expect(response.body).not.toHaveProperty('emailSent');
  });

  it('should generate secure reset token', async () => {
    const response = await request(app)
      .post('/api/auth/reset-password')
      .send({ email: 'reset@example.com' })
      .expect(200);

    expect(response.body).toHaveProperty('resetTokenId');
    expect(typeof response.body.resetTokenId).toBe('string');
    expect(response.body.resetTokenId.length).toBeGreaterThan(10);
    
    // Should be UUID format or similar secure identifier
    expect(response.body.resetTokenId).toMatch(/^[a-f0-9-]{36}$|^[a-zA-Z0-9_-]+$/);
  });

  it('should invalidate previous reset tokens', async () => {
    // First reset request
    const firstResponse = await request(app)
      .post('/api/auth/reset-password')
      .send({ email: 'reset@example.com' })
      .expect(200);

    const firstTokenId = firstResponse.body.resetTokenId;

    // Second reset request should invalidate first
    const secondResponse = await request(app)
      .post('/api/auth/reset-password')
      .send({ email: 'reset@example.com' })
      .expect(200);

    const secondTokenId = secondResponse.body.resetTokenId;

    expect(firstTokenId).not.toBe(secondTokenId);
    expect(secondResponse.body).toHaveProperty('success', true);
  });

  it('should rate limit reset attempts', async () => {
    // Make multiple rapid requests
    const promises = Array(6).fill(null).map(() =>
      request(app)
        .post('/api/auth/reset-password')
        .send({ email: 'reset@example.com' })
    );

    const responses = await Promise.all(promises);
    
    // First few should succeed, later ones should be rate limited
    expect(responses[0]?.status).toBe(200);
    expect(responses[1]?.status).toBe(200);
    
    // Later requests should be rate limited
    const rateLimitedResponses = responses.slice(-2);
    rateLimitedResponses.forEach(response => {
      if (response.status === 429) {
        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('error', 'RATE_LIMIT_EXCEEDED');
        expect(response.body).toHaveProperty('retryAfter');
      }
    });
  });

  it('should set appropriate token expiration', async () => {
    const response = await request(app)
      .post('/api/auth/reset-password')
      .send({ email: 'reset@example.com' })
      .expect(200);

    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('resetTokenId');
    
    // The token should have reasonable expiration (checked in confirm-reset test)
    expect(response.body).toHaveProperty('expiresIn');
    expect(typeof response.body.expiresIn).toBe('number');
    expect(response.body.expiresIn).toBeGreaterThan(0);
    expect(response.body.expiresIn).toBeLessThanOrEqual(3600); // Max 1 hour
  });

  it('should handle concurrent reset requests gracefully', async () => {
    const promises = Array(3).fill(null).map(() =>
      request(app)
        .post('/api/auth/reset-password')
        .send({ email: 'reset@example.com' })
    );

    const responses = await Promise.all(promises);
    
    // All should either succeed or be rate limited
    responses.forEach(response => {
      expect([200, 429]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body).toHaveProperty('success', true);
      } else {
        expect(response.body).toHaveProperty('error', 'RATE_LIMIT_EXCEEDED');
      }
    });
  });

  it('should log security events for monitoring', async () => {
    const response = await request(app)
      .post('/api/auth/reset-password')
      .send({ email: 'reset@example.com' })
      .expect(200);

    expect(response.body).toHaveProperty('success', true);
    // Security logging is internal, but response should indicate success
    expect(response.body).toHaveProperty('eventId');
    expect(typeof response.body.eventId).toBe('string');
  });
});