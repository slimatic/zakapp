/**
 * Authentication Helper Functions for Integration Tests
 */

import request from 'supertest';
import app from '../../../server/src/app';

export const authHelpers = {
  /**
   * Creates a new user and returns authentication token
   */
  async createAuthenticatedUser(userData?: {
    email?: string;
    password?: string;
    name?: string;
  }) {
    const defaultData = {
      email: `test-${Date.now()}@example.com`,
      password: 'Test123!@#',
      name: 'Test User',
    };

    const registrationData = { ...defaultData, ...userData };

    // Register user
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send(registrationData)
      .expect(201);

    // Login to get token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: registrationData.email,
        password: registrationData.password,
      })
      .expect(200);

    return {
      token: loginResponse.body.data.tokens.accessToken,
      userId: loginResponse.body.data.user.id,
      user: loginResponse.body.data.user,
    };
  },
};
