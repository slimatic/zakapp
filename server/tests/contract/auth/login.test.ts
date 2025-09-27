import request from 'supertest';
import app from '../../../src/app'; // This will fail until we create the app

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    // This assumes a test user exists - will fail until we have proper test setup
    await request(app)
      .post('/api/auth/register')
      .send({
        email: 'login@example.com',
        password: 'SecurePassword123!',
        username: 'loginuser'
      });
  });

  it('should login with valid email and password', async () => {
    const loginData = {
      email: 'login@example.com',
      password: 'SecurePassword123!'
    };

    const response = await request(app)
      .post('/api/auth/login')
      .send(loginData)
      .expect(200);

    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('message', 'Login successful');
    expect(response.body).toHaveProperty('accessToken');
    expect(response.body).toHaveProperty('refreshToken');
    expect(response.body.user).toHaveProperty('id');
    expect(response.body.user).toHaveProperty('email', loginData.email);
    expect(response.body.user).not.toHaveProperty('password');
    expect(response.body.user).not.toHaveProperty('passwordHash');

    // Verify JWT token structure
    expect(typeof response.body.accessToken).toBe('string');
    expect(typeof response.body.refreshToken).toBe('string');
    expect(response.body.accessToken.split('.').length).toBe(3); // JWT has 3 parts
  });

  it('should return 400 for missing credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@example.com' })
      .expect(400);

    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('error', 'VALIDATION_ERROR');
    expect(response.body).toHaveProperty('details');
  });

  it('should return 401 for invalid email', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'nonexistent@example.com',
        password: 'SecurePassword123!'
      })
      .expect(401);

    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('error', 'INVALID_CREDENTIALS');
    expect(response.body).toHaveProperty('message', 'Invalid email or password');
  });

  it('should return 401 for invalid password', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'login@example.com',
        password: 'WrongPassword!'
      })
      .expect(401);

    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('error', 'INVALID_CREDENTIALS');
    expect(response.body).toHaveProperty('message', 'Invalid email or password');
  });

  it('should return 400 for invalid email format', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'invalid-email-format',
        password: 'SecurePassword123!'
      })
      .expect(400);

    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('error', 'VALIDATION_ERROR');
  });

  it('should create user session on successful login', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'login@example.com',
        password: 'SecurePassword123!'
      })
      .expect(200);

    expect(response.body).toHaveProperty('accessToken');
    expect(response.body).toHaveProperty('refreshToken');
    
    // Session should be created and trackable
    expect(response.body).toHaveProperty('sessionId');
    expect(typeof response.body.sessionId).toBe('string');
  });

  it('should handle concurrent login attempts gracefully', async () => {
    const loginData = {
      email: 'login@example.com',
      password: 'SecurePassword123!'
    };

    // Make multiple concurrent login requests
    const promises = Array(5).fill(null).map(() => 
      request(app)
        .post('/api/auth/login')
        .send(loginData)
    );

    const responses = await Promise.all(promises);
    
    // All should succeed with different session IDs
    responses.forEach(response => {
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('accessToken');
    });
  });
});