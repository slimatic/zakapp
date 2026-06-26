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

import { vi, type Mock } from 'vitest';
/**
 * Integration Test: AuthController isVerified Response
 * 
 * Tests that the backend correctly returns isVerified in auth responses.
 * 
 * REGRESSION COVERAGE:
 * - /auth/login returns isVerified
 * - /auth/register returns isVerified
 * - /auth/me returns isVerified
 */

import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import app from '../app';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('AuthController isVerified Response', () => {
    const testUser = {
        email: `test-isverified-${Date.now()}@example.com`,
        password: 'TestPassword123!',
        confirmPassword: 'TestPassword123!',
        username: 'testisverifieduser',
        firstName: 'Test',
        lastName: 'User',
    };

    let accessToken: string;
    let userId: string;

    afterAll(async () => {
        // Cleanup test user
        if (userId) {
            await prisma.user.delete({ where: { id: userId } }).catch(() => { });
        }
        await prisma.$disconnect();
    });

    describe('POST /auth/register', () => {
        it('should return isVerified field in response', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send(testUser)
                .expect(201);

            expect(response.body.data).toHaveProperty('user');
            expect(response.body.data.user).toHaveProperty('isVerified');
            expect(typeof response.body.data.user.isVerified).toBe('boolean');
            expect(response.body.data.user.isVerified).toBe(false); // New users are unverified

            userId = response.body.data.user.id;
            accessToken = response.body.data.tokens.accessToken;
        });
    });

    describe('POST /auth/login', () => {
        it('should return isVerified field in response', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testUser.email,
                    password: testUser.password,
                })
                .expect(200);

            expect(response.body.data).toHaveProperty('user');
            expect(response.body.data.user).toHaveProperty('isVerified');
            expect(typeof response.body.data.user.isVerified).toBe('boolean');

            accessToken = response.body.data.tokens.accessToken;
        });
    });

    describe('GET /auth/me', () => {
        it('should return isVerified field in response', async () => {
            const response = await request(app)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200);

            expect(response.body.data).toHaveProperty('user');
            expect(response.body.data.user).toHaveProperty('isVerified');
            expect(typeof response.body.data.user.isVerified).toBe('boolean');
        });
    });

    describe('Admin verification flow', () => {
        it('should update isVerified status when admin verifies user', async () => {
            // This test requires admin credentials
            // Login as admin
            const adminLogin = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'admin@zakapp.local',
                    password: 'AdminPassword123!',
                });

            if (adminLogin.status !== 200) {
                console.log('Skipping admin test - no admin user available');
                return;
            }

            const adminToken = adminLogin.body.accessToken;

            // Verify the test user
            const verifyResponse = await request(app)
                .post(`/api/admin/settings/users/${userId}/verify`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(verifyResponse.body.success).toBe(true);

            // Now check that the user shows as verified
            const meResponse = await request(app)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200);

            expect(meResponse.body.user.isVerified).toBe(true);
        });
    });
});
