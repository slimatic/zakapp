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
 * The salt-healing sync must REPORT, not silently continue.
 *
 * When the server has no salt for an account, `login()` mints one locally and
 * derives the vault key from it. If that salt never reaches the server, this
 * device writes rows under a key the server will not hand back elsewhere - and
 * every field encrypted under it is unreadable there, with nothing on screen to
 * explain it. The sync was previously fire-and-forget, so a rejected or hung
 * request looked identical to a successful one.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const updateProfile = vi.fn();

vi.mock('../../api', () => ({
  apiService: { updateProfile: (...args: unknown[]) => updateProfile(...args) },
}));
vi.mock('react-hot-toast', () => ({ default: { error: vi.fn(), success: vi.fn(), loading: vi.fn() } }));

import { authService } from '../AuthService';

describe('authService.syncHealedSalt', () => {
  beforeEach(() => {
    updateProfile.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns null when the server accepts the salt', async () => {
    updateProfile.mockResolvedValue({ success: true });
    await expect(authService.syncHealedSalt('salt-a')).resolves.toBeNull();
    expect(updateProfile).toHaveBeenCalledWith({ salt: 'salt-a' });
  });

  it('returns the reason when the server rejects the salt', async () => {
    updateProfile.mockResolvedValue({ success: false, message: 'Validation failed' });
    await expect(authService.syncHealedSalt('salt-b')).resolves.toBe('Validation failed');
  });

  it('returns the reason when the request itself throws', async () => {
    updateProfile.mockRejectedValue(new Error('Network unreachable'));
    await expect(authService.syncHealedSalt('salt-c')).resolves.toBe('Network unreachable');
  });

  it('reports a timeout when the request never settles', async () => {
    vi.useFakeTimers();
    // A promise that never settles: exactly the shape a bare `.catch()` cannot
    // see, and the case that would otherwise park the login forever.
    updateProfile.mockReturnValue(new Promise(() => {}));

    const pending = authService.syncHealedSalt('salt-d');
    await vi.advanceTimersByTimeAsync(6000);
    await expect(pending).resolves.toBe('timed out');
  });

  it('does not treat a success with no message as a failure', async () => {
    updateProfile.mockResolvedValue({ success: true, message: undefined });
    await expect(authService.syncHealedSalt('salt-e')).resolves.toBeNull();
  });
});
