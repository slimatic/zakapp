/**
 * Copyright (c) 2024 ZakApp Contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * The admin user-management write paths.
 *
 * Three of these have a failure mode that is invisible from the UI:
 *
 * - `getUsers` takes a sort field from the query string. Prisma throws on an
 *   unknown `orderBy` rather than ignoring it, so an unvalidated field turns a
 *   bad request into a 500. The allow-list is the thing under test.
 * - `updateUserStatus` must refuse to deactivate the admin making the request,
 *   and must end the target's open sessions - otherwise the toggle is display
 *   -only and a live token keeps working.
 * - `updateAllUserLimits` must RAISE a limit, never lower one. `lt` (strictly
 *   less-than) is what makes it a floor; `lte` would take capacity away from a
 *   user who already had more than the new default.
 */

const prismaMock = {
  user: {
    count: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    delete: vi.fn(),
  },
  userSession: { findMany: vi.fn(), updateMany: vi.fn() },
  $transaction: vi.fn(),
};

const revokeTokenMock = vi.fn();
const mockSyncDelete = vi.fn();

vi.mock('../../utils/prisma', () => ({ prisma: prismaMock }));
vi.mock('../../services/SyncService', () => ({
  syncService: { deleteUser: mockSyncDelete },
}));
vi.mock('../../utils/couchStats', () => ({
  getUserCouchDBStats: vi.fn().mockResolvedValue({
    assets: 1, liabilities: 0, nisabRecords: 0, payments: 0,
  }),
}));
vi.mock('../../routes/auth/_shared', () => ({ revokeToken: revokeTokenMock }));
vi.mock('../../utils/logger', () => {
  const instance = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() };
  return {
    Logger: class {
      info = instance.info;
      warn = instance.warn;
      error = instance.error;
      debug = instance.debug;
    },
    logger: instance,
    default: instance,
  };
});

const { getUsers, deleteUser, updateUserStatus, updateAllUserLimits, getUserLimitDefaults } = await import('../AdminController');
const { DEFAULT_LIMITS } = await import('../../config/limits');

const mockRes = () => {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

const body = (res: any) => res.json.mock.calls[0][0];

beforeEach(() => {
  vi.clearAllMocks();
  prismaMock.$transaction.mockResolvedValue([[], 0]);
  prismaMock.user.update.mockResolvedValue({});
  prismaMock.user.updateMany.mockResolvedValue({ count: 0 });
  prismaMock.userSession.findMany.mockResolvedValue([]);
  prismaMock.userSession.updateMany.mockResolvedValue({ count: 0 });
});

describe('AdminController.getUsers - sort allow-list', () => {
  it('passes a known field and direction through to Prisma', async () => {
    await getUsers({ query: { sortBy: 'lastLoginAt', sortDir: 'asc' } } as any, mockRes());
    // Read the query the controller built - `$transaction` receives the array of
    // promises, and this mock's `findMany` resolves to undefined, so the array
    // carries nothing inspectable.
    expect(prismaMock.user.findMany.mock.calls[0][0].orderBy).toEqual({ lastLoginAt: 'asc' });
  });

  it('falls back to createdAt for an unknown field instead of letting Prisma 500', async () => {
    await getUsers({ query: { sortBy: 'passwordHash', sortDir: 'asc' } } as any, mockRes());
    // The FIELD is what falls back; the requested direction is harmless and kept.
    expect(prismaMock.user.findMany.mock.calls[0][0].orderBy).toEqual({ createdAt: 'asc' });
  });

  it('treats any direction other than "asc" as descending', async () => {
    await getUsers({ query: { sortBy: 'email', sortDir: 'sideways' } } as any, mockRes());
    expect(prismaMock.user.findMany.mock.calls[0][0].orderBy).toEqual({ email: 'desc' });
  });
});

describe('AdminController.updateUserStatus', () => {
  it('refuses to deactivate the requesting admin, and writes nothing', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 'admin-1', isActive: true });
    const res = mockRes();

    await updateUserStatus({ params: { id: 'admin-1' }, userId: 'admin-1', body: { isActive: false } } as any, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it('deactivates another user, revoking the tokens their open sessions hold', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 'user-2', isActive: true });
    prismaMock.userSession.findMany.mockResolvedValue([
      { accessToken: 'fake-token-a' }, { accessToken: 'fake-token-b' }, { accessToken: null },
    ]);
    const res = mockRes();

    await updateUserStatus({ params: { id: 'user-2' }, userId: 'admin-1', body: { isActive: false } } as any, res);

    expect(body(res).success).toBe(true);
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: 'user-2' }, data: { isActive: false },
    });
    // Only the non-null tokens; revoking `null` would be a no-op that hides a bug.
    expect(revokeTokenMock).toHaveBeenCalledTimes(2);
    expect(revokeTokenMock).toHaveBeenCalledWith('fake-token-a');
    expect(prismaMock.userSession.updateMany).toHaveBeenCalledWith({
      where: { userId: 'user-2', isActive: true }, data: { isActive: false },
    });
  });

  it('does not revoke anything when activating', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 'user-2', isActive: false });
    await updateUserStatus({ params: { id: 'user-2' }, userId: 'admin-1', body: { isActive: true } } as any, mockRes());

    expect(revokeTokenMock).not.toHaveBeenCalled();
    expect(prismaMock.userSession.updateMany).not.toHaveBeenCalled();
  });

  it('rejects a non-boolean status', async () => {
    const res = mockRes();
    await updateUserStatus({ params: { id: 'user-2' }, userId: 'admin-1', body: { isActive: 'false' } } as any, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });
});

describe('AdminController.updateAllUserLimits', () => {
  it('raises with a strict less-than, so a user already above the value is untouched', async () => {
    const res = mockRes();
    await updateAllUserLimits({ body: { maxAssets: 30 } } as any, res);

    expect(body(res).success).toBe(true);
    expect(prismaMock.user.updateMany).toHaveBeenCalledWith({
      where: { OR: [{ maxAssets: null }, { maxAssets: { lt: 30 } }] },
      data: { maxAssets: 30 },
    });
  });

  it('honours only the fields supplied', async () => {
    await updateAllUserLimits({ body: { maxPayments: 75 } } as any, mockRes());
    expect(prismaMock.user.updateMany).toHaveBeenCalledTimes(1);
    expect(prismaMock.user.updateMany.mock.calls[0][0].data).toEqual({ maxPayments: 75 });
  });

  it('rejects a request carrying no usable values', async () => {
    const res = mockRes();
    await updateAllUserLimits({ body: { maxAssets: 'lots', maxPayments: -3 } } as any, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(prismaMock.user.updateMany).not.toHaveBeenCalled();
  });
});

/**
 * The destructive path. Two things have to hold, and both were absent:
 *
 * - An admin must not be able to delete their own account. The guard on the
 *   status route existed; on this one the check was a comment.
 * - The user's CouchDB data must be purged, and it must happen BEFORE the row
 *   delete. Prisma cascades the Postgres rows away, so deleting first loses the
 *   only handle on the CouchDB side and orphans the data permanently.
 */
describe('AdminController.deleteUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSyncDelete.mockResolvedValue(undefined);
  });

  it('refuses to delete the requesting admin', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 'admin-1' });
    const res = mockRes();
    await deleteUser({ params: { id: 'admin-1' }, userId: 'admin-1' } as any, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(prismaMock.user.delete).not.toHaveBeenCalled();
    // The guard must fire before the purge too - a refused delete must not wipe
    // cloud data as a side effect.
    expect(mockSyncDelete).not.toHaveBeenCalled();
  });

  it('purges the CouchDB data before the row delete', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 'user-2' });
    prismaMock.user.delete.mockResolvedValue({ id: 'user-2' });
    const res = mockRes();
    await deleteUser({ params: { id: 'user-2' }, userId: 'admin-1' } as any, res);

    expect(body(res).success).toBe(true);
    expect(mockSyncDelete).toHaveBeenCalledWith('user-2');
    const purgeOrder = mockSyncDelete.mock.invocationCallOrder[0];
    const deleteOrder = prismaMock.user.delete.mock.invocationCallOrder[0];
    expect(purgeOrder).toBeLessThan(deleteOrder);
  });

  it('still deletes the row when the CouchDB purge fails', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 'user-3' });
    prismaMock.user.delete.mockResolvedValue({ id: 'user-3' });
    mockSyncDelete.mockRejectedValue(new Error('couch down'));

    const res = mockRes();
    await deleteUser({ params: { id: 'user-3' }, userId: 'admin-1' } as any, res);

    // A CouchDB outage must not make an admin unable to remove a user.
    expect(body(res).success).toBe(true);
    expect(prismaMock.user.delete).toHaveBeenCalledWith({ where: { id: 'user-3' } });
  });

  it('404s for an unknown user without deleting anything', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    const res = mockRes();
    await deleteUser({ params: { id: 'nope' }, userId: 'admin-1' } as any, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(prismaMock.user.delete).not.toHaveBeenCalled();
    expect(mockSyncDelete).not.toHaveBeenCalled();
  });
});

/**
 * The endpoint that ends the client's second copy of the defaults.
 *
 * The admin UI used to render a hardcoded 20/3/25 while this module enforced
 * 30/5/50, so the usage denominators were wrong and the bulk-raise computed its
 * targets from numbers that were no longer real. Anything the UI shows must
 * come from here.
 */
describe('AdminController.getUserLimitDefaults', () => {
  it('reports the effective defaults the server actually enforces', async () => {
    const res = mockRes();
    await getUserLimitDefaults({} as any, res);

    const payload = body(res);
    expect(payload.success).toBe(true);
    expect(payload.data).toEqual({
      maxAssets: DEFAULT_LIMITS.MAX_ASSETS,
      maxNisabRecords: DEFAULT_LIMITS.MAX_NISAB_RECORDS,
      maxPayments: DEFAULT_LIMITS.MAX_PAYMENTS,
      maxLiabilities: DEFAULT_LIMITS.MAX_LIABILITIES,
    });
  });

  it('serves the same numbers the enforcement path resolves against', async () => {
    // A default that is reported here but not resolved in `?? DEFAULT_LIMITS.maxX`
    // would reintroduce the drift, so the two are pinned to one another.
    const res = mockRes();
    await getUserLimitDefaults({} as any, res);

    expect(body(res).data.maxAssets).toBe(DEFAULT_LIMITS.MAX_ASSETS);
    expect(DEFAULT_LIMITS.MAX_ASSETS).toBe(Number(process.env.DEFAULT_MAX_ASSETS) || 30);
  });
});
