import { vi, type Mock } from 'vitest';
/**
 * Copyright (c) 2024 ZakApp Contributors
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

import request from 'supertest';
import { describe, it, expect, beforeAll } from 'vitest';
import app from '@/app';

describe('Analytics API Integration Tests', () => {
  let authToken: string;
  let testUser: { id: string; email: string };

  beforeAll(async () => {
    // Register test user
    const timestamp = Date.now();
    const registrationResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: `analytics-test-user-${timestamp}@test.com`,
        password: 'TestPassword123!',
        confirmPassword: 'TestPassword123!',
        firstName: 'Analytics',
        lastName: 'Test'
      });

    if (registrationResponse.status !== 201) {
      throw new Error(`Registration Failed: ${JSON.stringify(registrationResponse.body, null, 2)}`);
    }
    expect(registrationResponse.status).toBe(201);
    testUser = registrationResponse.body.data.user;
    authToken = registrationResponse.body.data.tokens.accessToken;
  });

  describe('GET /api/analytics/summary', () => {
    it('should return analytics summary for current year', async () => {
      const response = await request(app)
        .get('/api/analytics/summary')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('summary');
      expect(response.body.data.summary).toHaveProperty('year');
      expect(response.body.data.summary).toHaveProperty('metrics');
    });

    it('should return analytics summary for specific year', async () => {
      const response = await request(app)
        .get('/api/analytics/summary?year=2024')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.summary.year).toBe(2024);
    });

    it('should return analytics summary with trends when requested', async () => {
      const response = await request(app)
        .get('/api/analytics/summary?includeTrends=true')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      // Check if trends are included (may be empty if no data)
      expect(response.body.data.summary.metrics).toBeDefined();
    });
  });

  describe('GET /api/analytics/metrics', () => {
    it('should return multiple analytics metrics', async () => {
      const response = await request(app)
        .get('/api/analytics/metrics')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('metrics');
      expect(typeof response.body.data.metrics).toBe('object');
    });

    it('should return specific metric types when requested', async () => {
      const response = await request(app)
        .get('/api/analytics/metrics?metricTypes=wealth_trend,zakat_trend')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.metrics).toBeDefined();
    });
  });

  describe('GET /api/analytics/trends', () => {
    it('should return analytics trends for default period', async () => {
      const response = await request(app)
        .get('/api/analytics/trends')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('trends');
      expect(response.body.data.trends).toHaveProperty('period');
    });

    it('should return analytics trends for specific period', async () => {
      const response = await request(app)
        .get('/api/analytics/trends?period=6months')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.trends.period).toBe('6months');
    });
  });

  describe('GET /api/analytics/comparison', () => {
    it('should return analytics comparison for default years', async () => {
      const response = await request(app)
        .get('/api/analytics/comparison')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('comparison');
    });

    it('should return analytics comparison for specific years', async () => {
      const currentYear = new Date().getFullYear();
      const response = await request(app)
        .get(`/api/analytics/comparison?period1=${currentYear - 1}&period2=${currentYear}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/analytics/cache/clear', () => {
    it('should clear analytics cache successfully', async () => {
      const response = await request(app)
        .post('/api/analytics/cache/clear')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('cleared');
    });
  });
});