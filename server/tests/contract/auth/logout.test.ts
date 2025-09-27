import request from 'supertest';
import app from '../../../src/app'; // This will fail until we create the app

describe('POST /api/auth/logout', () => {
  let accessToken: string;
  let refreshToken: string;

  beforeEach(async () => {
    // Register and login to get tokens
    await request(app)
      .post('/api/auth/register')
      .send({
        email: 'logout@example.com',
        password: 'SecurePassword123!',
        username: 'logoutuser'
      });

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'logout@example.com',
        password: 'SecurePassword123!'
      });

    accessToken = loginResponse.body.accessToken;
    refreshToken = loginResponse.body.refreshToken;
  });

  it('should logout successfully with valid access token', async () => {
    const response = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('message', 'Logged out successfully');
  });

  it('should invalidate session and tokens after logout', async () => {
    // Logout successfully
    await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    // Access token should no longer work
    const meResponse = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(401);

    expect(meResponse.body).toHaveProperty('success', false);
    expect(meResponse.body).toHaveProperty('error', 'TOKEN_INVALIDATED');
  });

  it('should invalidate refresh token after logout', async () => {
    // Logout successfully
    await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    // Refresh token should no longer work
    const refreshResponse = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken })
      .expect(401);

    expect(refreshResponse.body).toHaveProperty('success', false);
    expect(refreshResponse.body).toHaveProperty('error', 'TOKEN_INVALIDATED');
  });

  it('should return 401 for missing authorization header', async () => {
    const response = await request(app)
      .post('/api/auth/logout')
      .expect(401);

    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('error', 'NO_TOKEN');
    expect(response.body).toHaveProperty('message', 'Access token required');
  });

  it('should return 401 for invalid access token', async () => {
    const response = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', 'Bearer invalid.access.token')
      .expect(401);

    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('error', 'INVALID_TOKEN');
  });

  it('should return 401 for malformed authorization header', async () => {
    const response = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', 'InvalidFormat token')
      .expect(401);

    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('error', 'INVALID_AUTH_FORMAT');
  });

  it('should handle logout for already logged out session', async () => {
    // First logout
    await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    // Second logout attempt should return appropriate error
    const response = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(401);

    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('error', 'TOKEN_INVALIDATED');
  });

  it('should cleanup user session data on logout', async () => {
    const response = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ logoutFromAllDevices: false })
      .expect(200);

    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('message', 'Logged out successfully');
  });

  it('should support logout from all devices', async () => {
    // Create multiple sessions by logging in multiple times
    const session2 = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'logout@example.com',
        password: 'SecurePassword123!'
      });

    const session3 = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'logout@example.com',
        password: 'SecurePassword123!'
      });

    // Logout from all devices using first session
    const response = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ logoutFromAllDevices: true })
      .expect(200);

    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('message', 'Logged out from all devices successfully');

    // All other sessions should be invalidated
    await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${session2.body.accessToken}`)
      .expect(401);

    await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${session3.body.accessToken}`)
      .expect(401);
  });
});