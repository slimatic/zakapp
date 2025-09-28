import request from 'supertest';
import app from '../../../src/app'; // This will fail until we create the app

describe('GET /api/auth/me', () => {
  let accessToken: string;
  let userId: string;

  beforeEach(async () => {
    // Register and login to get tokens
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'me@example.com',
        password: 'SecurePassword123!',
        username: 'meuser'
      });

    userId = registerResponse.body.user.id;

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'me@example.com',
        password: 'SecurePassword123!'
      });

    accessToken = loginResponse.body.accessToken;
  });

  it('should return current user data with valid access token', async () => {
    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body).toHaveProperty('success', true);
    expect(response.body.user).toHaveProperty('id', userId);
    expect(response.body.user).toHaveProperty('email', 'me@example.com');
    expect(response.body.user).toHaveProperty('username', 'meuser');
    expect(response.body.user).toHaveProperty('createdAt');
    expect(response.body.user).toHaveProperty('updatedAt');

    // Sensitive data should not be exposed
    expect(response.body.user).not.toHaveProperty('password');
    expect(response.body.user).not.toHaveProperty('passwordHash');
  });

  it('should include user profile and settings', async () => {
    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.user).toHaveProperty('profile');
    expect(response.body.user).toHaveProperty('settings');
    
    // Profile fields (may be null initially)
    expect(response.body.user.profile).toHaveProperty('firstName');
    expect(response.body.user.profile).toHaveProperty('lastName');
    expect(response.body.user.profile).toHaveProperty('currency');
    expect(response.body.user.profile).toHaveProperty('locale');
    expect(response.body.user.profile).toHaveProperty('timezone');
    
    // Settings fields
    expect(response.body.user.settings).toHaveProperty('defaultCalculationMethod');
    expect(response.body.user.settings).toHaveProperty('nisabMethod');
    expect(response.body.user.settings).toHaveProperty('notifications');
    expect(response.body.user.settings).toHaveProperty('privacy');
  });

  it('should return 401 for missing authorization header', async () => {
    const response = await request(app)
      .get('/api/auth/me')
      .expect(401);

    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('error', 'NO_TOKEN');
    expect(response.body).toHaveProperty('message', 'Access token required');
  });

  it('should return 401 for invalid access token', async () => {
    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalid.access.token')
      .expect(401);

    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('error', 'INVALID_TOKEN');
  });

  it('should return 401 for malformed authorization header', async () => {
    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'InvalidFormat token')
      .expect(401);

    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('error', 'INVALID_AUTH_FORMAT');
  });

  it('should return 401 for expired access token', async () => {
    // Register and login to get a valid access token
    const timestamp = Date.now();
    const user = {
      email: `expired-${timestamp}@test.com`,
      password: 'Test123456!',
      username: `expired${timestamp}`,
      firstName: 'Expired',
      lastName: 'User'
    };

    await request(app)
      .post('/api/auth/register')
      .send(user)
      .expect(201);

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: user.email,
        password: user.password
      })
      .expect(200);

    const validAccessToken = loginResponse.body.accessToken;

    // Use Jest fake timers to make the token appear expired (16 minutes later, access tokens expire in 15 min)
    jest.useFakeTimers();
    
    try {
      jest.setSystemTime(new Date(Date.now() + 16 * 60 * 1000)); // 16 minutes later

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${validAccessToken}`)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'TOKEN_EXPIRED');
    } finally {
      jest.useRealTimers();
    }
  });

  it('should return 401 for revoked/logged out token', async () => {
    // Logout to invalidate the token
    await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    // Try to use the now-invalidated token
    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(401);

    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('error', 'TOKEN_INVALIDATED');
  });

  it('should decrypt and return user profile data correctly', async () => {
    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.user.profile).toBeDefined();
    expect(response.body.user.settings).toBeDefined();
    
    // Verify data is properly decrypted (not showing encrypted values)
    if (response.body.user.profile.firstName) {
      expect(typeof response.body.user.profile.firstName).toBe('string');
      expect(response.body.user.profile.firstName).not.toMatch(/^[a-f0-9]+$/); // Not encrypted hex
    }
    
    if (response.body.user.profile.currency) {
      expect(typeof response.body.user.profile.currency).toBe('string');
      expect(['USD', 'EUR', 'GBP', 'SAR', 'AED', 'PKR', 'INR']).toContain(response.body.user.profile.currency);
    }
  });

  it('should include session information', async () => {
    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body).toHaveProperty('session');
    expect(response.body.session).toHaveProperty('id');
    expect(response.body.session).toHaveProperty('lastAccessAt');
    expect(response.body.session).toHaveProperty('userAgent');
    expect(response.body.session).toHaveProperty('ipAddress');
  });
});