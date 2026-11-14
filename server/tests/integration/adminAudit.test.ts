/**
 * Copyright (c) 2024 ZakApp Contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import app from '../../src/app';
import { PrismaClient } from '@prisma/client';
import { sqliteAdapter } from '../../src/config/prismaAdapter';
import { jwtService } from '../../src/services/JWTService';

const STAMP = Date.now();
const ADMIN_EMAIL = `audit-admin-${STAMP}@example.com`;
const TARGET_EMAIL = `audit-target-${STAMP}@example.com`;

describe('Integration: admin mutations leave an audit trail', () => {
  const prisma = new PrismaClient({ adapter: sqliteAdapter() });
  let adminId = '';
  let targetId = '';
  let token = '';

  beforeAll(async () => {
    const admin = await prisma.user.create({
      data: {
        email: ADMIN_EMAIL,
        passwordHash: 'x',
        userType: 'ADMIN_USER',
        isActive: true,
        isVerified: true,
      },
    });
    adminId = admin.id;
    token = jwtService.createAccessToken({ userId: admin.id, email: ADMIN_EMAIL, role: 'admin' });

    const target = await prisma.user.create({
      data: { email: TARGET_EMAIL, passwordHash: 'x', userType: 'USER', isActive: true },
    });
    targetId = target.id;
  });

  afterAll(async () => {
    await prisma.auditTrailEntry.deleteMany({ where: { userId: adminId } });
    await prisma.user.deleteMany({ where: { id: { in: [adminId, targetId] } } });
    await prisma.$disconnect();
  });

  it('records a role change with the acting admin', async () => {
    const res = await request(app)
      .patch(`/api/admin/users/${targetId}/role`)
      .set('Authorization', `Bearer ${token}`)
      .send({ role: 'ADMIN_USER' });

    expect(res.status).toBe(200);

    const entry = await prisma.auditTrailEntry.findFirst({
      where: { userId: adminId, eventType: 'ADMIN_ROLE_CHANGED' },
      orderBy: { timestamp: 'desc' },
    });
    expect(entry).not.toBeNull();
    // The summary is encrypted; the row's own columns are what an operator filters on.
    expect(entry?.changesSummary).toBeTruthy();
  });

  it('records a status change', async () => {
    const res = await request(app)
      .patch(`/api/admin/users/${targetId}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ isActive: false });

    expect(res.status).toBe(200);
    const entry = await prisma.auditTrailEntry.findFirst({
      where: { userId: adminId, eventType: 'ADMIN_STATUS_CHANGED' },
    });
    expect(entry).not.toBeNull();
  });
});
