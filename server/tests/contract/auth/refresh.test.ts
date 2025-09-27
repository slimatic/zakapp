import request from 'supertest';
import app from '../../../src/app'; // This will fail until we create the app

describe('POST /api/auth/refresh', () => {
  let refreshToken: string;
  let accessToken: string;

  beforeEach(async () => {
    // Register and login to get tokens
    await request(app)
      .post('/api/auth/register')
      .send({
        email: 'refresh@example.com',
        password: 'SecurePassword123!',
        username: 'refreshuser'
      });

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'refresh@example.com',
        password: 'SecurePassword123!'
      });

    refreshToken = loginResponse.body.refreshToken;
    accessToken = loginResponse.body.accessToken;
  });

  it('should refresh tokens with valid refresh token', async () => {
    const response = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken })
      .expect(200);

    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('accessToken');
    expect(response.body).toHaveProperty('refreshToken');
    
    // New tokens should be different from old ones
    expect(response.body.accessToken).not.toBe(accessToken);
    expect(response.body.refreshToken).not.toBe(refreshToken);
    
    // Verify JWT structure
    expect(response.body.accessToken.split('.').length).toBe(3);
    expect(response.body.refreshToken.split('.').length).toBe(3);
  });

  it('should return 400 for missing refresh token', async () => {
    const response = await request(app)
      .post('/api/auth/refresh')
      .send({})
      .expect(400);

    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('error', 'VALIDATION_ERROR');
    expect(response.body).toHaveProperty('message', 'Refresh token is required');
  });

  it('should return 401 for invalid refresh token', async () => {
    const response = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: 'invalid.refresh.token' })
      .expect(401);

    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('error', 'INVALID_TOKEN');
    expect(response.body).toHaveProperty('message', 'Invalid refresh token');
  });

  it('should return 401 for expired refresh token', async () => {
    // This would require mocking time or using an expired token
    const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.invalid';
    
    const response = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: expiredToken })
      .expect(401);

    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('error', 'TOKEN_EXPIRED');
  });

  it('should invalidate old refresh token after successful refresh', async () => {
    // First refresh should succeed
    const firstResponse = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken })
      .expect(200);

    expect(firstResponse.body).toHaveProperty('success', true);
    
    // Using old refresh token should fail
    const secondResponse = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken })
      .expect(401);

    expect(secondResponse.body).toHaveProperty('success', false);
    expect(secondResponse.body).toHaveProperty('error', 'TOKEN_USED');
  });

  it('should update session with new tokens', async () => {
    const response = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken })
      .expect(200);

    expect(response.body).toHaveProperty('sessionId');
    expect(typeof response.body.sessionId).toBe('string');
    
    // Should be able to use new access token immediately
    const meResponse = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${response.body.accessToken}`)
      .expect(200);

    expect(meResponse.body).toHaveProperty('success', true);
  });

  it('should return 401 for refresh token from different user session', async () => {
    // Create another user and get their refresh token
    await request(app)
      .post('/api/auth/register')
      .send({
        email: 'other@example.com',
        password: 'SecurePassword123!',
        username: 'otheruser'
      });

    const otherLoginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'other@example.com',
        password: 'SecurePassword123!'
      });

    // Try to use first user's refresh token with second user's session context
    const response = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: otherLoginResponse.body.refreshToken })
      .set('Authorization', `Bearer ${accessToken}`) // First user's access token
      .expect(401);

    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('error', 'TOKEN_MISMATCH');
  });
});