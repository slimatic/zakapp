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
    firstName?: string;
    lastName?: string;
  }) {
    const defaultData = {
      email: `test-${Date.now()}@example.com`,
      password: 'Test123!@#',
      firstName: 'Test',
      lastName: 'User',
    };

    const data = { ...defaultData, ...userData };
    
    const registrationData = {
      ...data,
      confirmPassword: data.password, // Ensure confirmPassword always matches password
    };

    // Register user
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send(registrationData);
    
    if (registerResponse.status !== 201) {
      console.error('Registration failed:', registerResponse.status, JSON.stringify(registerResponse.body, null, 2));
    }
    
    if (registerResponse.status !== 201) {
      throw new Error(`Expected 201, got ${registerResponse.status}`);
    }

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
