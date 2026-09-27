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

import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * The admin envelope contract.
 *
 * `/admin/stats` returned `{ success, stats }` while every sibling endpoint
 * (`/admin/settings`, `/admin/system/status`, `/admin/users`) returned
 * `{ success, data }`. The client reads one convention - `res.data` - so the
 * stats payload resolved to undefined, `AdminDashboard` fell into its error
 * branch, and `/admin` showed "Unexpected Error" while the rest of the app was
 * perfectly healthy. The request even logged HTTP 200, so nothing looked wrong
 * from the outside.
 *
 * These tests pin the envelope rather than the numbers: a payload that drifts
 * out of `data` breaks the dashboard with no error anywhere to explain it.
 */

const prismaMock = {
  user: { count: vi.fn() },
};

vi.mock('../../utils/prisma', () => ({ prisma: prismaMock }));
vi.mock('../../utils/logger', () => {
  // `couchStats` builds its own logger at import time with `new Logger(...)`,
  // so the mock has to export the class - a plain object leaves it undefined
  // and the whole module fails to load before any test runs.
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

const { getStats } = await import('../AdminController');

const mockRes = () => {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

describe('AdminController.getStats - response envelope', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.user.count.mockResolvedValue(0);
  });

  it('nests the stats payload under data, matching the other admin endpoints', async () => {
    const res = mockRes();
    await getStats({} as any, res);

    const body = res.json.mock.calls[0][0];
    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();
    expect(body.data.stats).toBeDefined();

    // The exact regression: a top-level `stats` is what the client never reads.
    expect(body.stats).toBeUndefined();
  });

  it('carries every field the dashboard renders', async () => {
    // A missing field is rendered by `stats?.x || 0` as a confident zero, which
    // reads to an admin as "no users" rather than "broken response".
    prismaMock.user.count
      .mockResolvedValueOnce(12)   // totalUsers
      .mockResolvedValueOnce(5)    // activeUsers
      .mockResolvedValueOnce(7);   // dormantUsers

    const res = mockRes();
    await getStats({} as any, res);

    expect(res.json.mock.calls[0][0].data.stats).toMatchObject({
      totalUsers: 12,
      activeUsers: 5,
      dormantUsers: 7,
      storageUsed: 'N/A',
    });
  });

  it('reports failure as success:false rather than a partial envelope', async () => {
    prismaMock.user.count.mockRejectedValue(new Error('db down'));

    const res = mockRes();
    await getStats({} as any, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json.mock.calls[0][0].success).toBe(false);
  });
});
