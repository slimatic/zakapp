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

/**
 * Logout must always end the session, even when a teardown step never settles.
 *
 * Reported from production: clicking Log out did nothing and left the user signed
 * in. The cause was not a missing handler - the handler ran, and then awaited a
 * promise that NEVER settles.
 *
 * `navigator.serviceWorker.ready` does not reject when no worker reaches
 * "active"; it simply never resolves. A try/catch cannot help (nothing is thrown),
 * so `await` parked forever, `dispatch({type:'LOGOUT'})` never fired, and the
 * session survived. `closeDb()` could park the same way, waiting on an in-progress
 * database creation.
 *
 * These tests hold a promise that never settles and assert logout still completes.
 * They are written against the real AuthService, not a stand-in.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/** A promise that never resolves - the shape of the bug. */
const never = () => new Promise<never>(() => {});

const mocks = vi.hoisted(() => ({
  unsubscribeCurrentDevice: vi.fn(),
  closeDb: vi.fn(),
  clearSession: vi.fn(),
}));

vi.mock('../pushService', () => ({
  unsubscribeCurrentDevice: mocks.unsubscribeCurrentDevice,
}));

vi.mock('../../db', () => ({
  getDb: vi.fn(),
  forceResetDatabase: vi.fn(),
  closeDb: mocks.closeDb,
}));

vi.mock('../CryptoService', async () => {
  const actual = await vi.importActual<any>('../CryptoService');
  return {
    ...actual,
    cryptoService: { ...actual.cryptoService, clearSession: mocks.clearSession },
  };
});

vi.mock('../api', () => ({
  apiService: { logout: vi.fn().mockResolvedValue({ success: true }) },
}));

import { authService } from '../auth/AuthService';

describe('logout cannot be stranded by a teardown step', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('accessToken', 'tok');
    localStorage.setItem('refreshToken', 'ref');
    sessionStorage.setItem('zakapp_session_v1', JSON.stringify({ user: { id: 'u1' } }));
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('completes when the service worker promise never settles', async () => {
    // This is the exact production hang.
    mocks.unsubscribeCurrentDevice.mockReturnValue(never());
    mocks.closeDb.mockResolvedValue(undefined);

    await expect(authService.logout()).resolves.toBeUndefined();
  }, 15000);

  it('completes when closeDb never settles', async () => {
    mocks.unsubscribeCurrentDevice.mockResolvedValue(true);
    mocks.closeDb.mockReturnValue(never());

    await expect(authService.logout()).resolves.toBeUndefined();
  }, 15000);

  it('clears the session even when a teardown step never settles', async () => {
    mocks.unsubscribeCurrentDevice.mockReturnValue(never());
    mocks.closeDb.mockReturnValue(never());

    await authService.logout();

    // The whole point: the device is actually logged out afterwards.
    expect(mocks.clearSession).toHaveBeenCalled();
    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(localStorage.getItem('refreshToken')).toBeNull();
    expect(sessionStorage.getItem('zakapp_session_v1')).toBeNull();
  }, 15000);

  it('still completes when teardown THROWS', async () => {
    mocks.unsubscribeCurrentDevice.mockRejectedValue(new Error('push exploded'));
    mocks.closeDb.mockRejectedValue(new Error('db exploded'));

    await expect(authService.logout()).resolves.toBeUndefined();
    expect(mocks.clearSession).toHaveBeenCalled();
    expect(localStorage.getItem('accessToken')).toBeNull();
  }, 15000);
});
