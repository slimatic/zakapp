/**
 * Copyright (c) 2024-2026 ZakApp Contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

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
      email: `test-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`,
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
