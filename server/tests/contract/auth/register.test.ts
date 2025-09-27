import request from 'supertest';
import app from '../../../src/app'; // This will fail until we create the app

describe('POST /api/auth/register', () => {
  it('should register a new user with valid data', async () => {
    const validUser = {
      email: 'test@example.com',
      password: 'SecurePassword123!',
      username: 'testuser'
    };

    const response = await request(app)
      .post('/api/auth/register')
      .send(validUser)
      .expect(201);

    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('message', 'User registered successfully');
    expect(response.body.user).toHaveProperty('id');
    expect(response.body.user).toHaveProperty('email', validUser.email);
    expect(response.body.user).toHaveProperty('username', validUser.username);
    expect(response.body.user).not.toHaveProperty('password');
    expect(response.body.user).not.toHaveProperty('passwordHash');
  });

  it('should return 400 for missing required fields', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@example.com' })
      .expect(400);

    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('error', 'VALIDATION_ERROR');
    expect(response.body).toHaveProperty('details');
    expect(response.body.details).toBeInstanceOf(Array);
  });

  it('should return 400 for invalid email format', async () => {
    const invalidUser = {
      email: 'invalid-email',
      password: 'SecurePassword123!',
      username: 'testuser'
    };

    const response = await request(app)
      .post('/api/auth/register')
      .send(invalidUser)
      .expect(400);

    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('error', 'VALIDATION_ERROR');
  });

  it('should return 400 for weak password', async () => {
    const weakPasswordUser = {
      email: 'test@example.com',
      password: '123',
      username: 'testuser'
    };

    const response = await request(app)
      .post('/api/auth/register')
      .send(weakPasswordUser)
      .expect(400);

    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('error', 'VALIDATION_ERROR');
  });

  it('should return 409 for duplicate email', async () => {
    const user = {
      email: 'duplicate@example.com',
      password: 'SecurePassword123!',
      username: 'user1'
    };

    // First registration should succeed
    await request(app)
      .post('/api/auth/register')
      .send(user)
      .expect(201);

    // Second registration with same email should fail
    const response = await request(app)
      .post('/api/auth/register')
      .send({ ...user, username: 'user2' })
      .expect(409);

    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('error', 'EMAIL_ALREADY_EXISTS');
  });

  it('should encrypt sensitive user data', async () => {
    const user = {
      email: 'encrypt@example.com',
      password: 'SecurePassword123!',
      username: 'encryptuser'
    };

    const response = await request(app)
      .post('/api/auth/register')
      .send(user)
      .expect(201);

    expect(response.body.user).toHaveProperty('id');
    // Verify that sensitive data is not exposed in response
    expect(response.body.user).not.toHaveProperty('passwordHash');
    expect(response.body.user).not.toHaveProperty('settings');
    expect(response.body.user).not.toHaveProperty('profile');
  });
});