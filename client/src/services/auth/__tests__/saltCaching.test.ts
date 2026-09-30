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
 * A device must hold a local copy of its salt after any successful login.
 *
 * The salt decides the vault key, so a device that cannot recall its own salt
 * cannot read its own rows. The write previously sat inside the "the server has
 * no salt, mint one" branch, so an ordinary login cached nothing; when the server
 * later failed to return the salt, the code fell through to minting a fresh one,
 * derived a DIFFERENT key, and encrypted the next import under a key that cannot
 * decrypt what was already stored. Those rows keep their ZK1: prefix and the UI
 * shows "Encrypted recipient".
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('react-hot-toast', () => ({ default: { error: vi.fn(), success: vi.fn(), loading: vi.fn() } }));

import { authService } from '../AuthService';

describe('authService.cacheSalt', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('stores the salt under the key the healing path reads', () => {
        authService.cacheSalt('acct-1', 'salt-from-server');
        // The heal path reads exactly `zakapp_salt_<backendUserId>`.
        expect(localStorage.getItem('zakapp_salt_acct-1')).toBe('salt-from-server');
    });

    it('overwrites a stale value rather than keeping the old salt', () => {
        // A rotated salt must replace the old one; keeping both would let a later
        // read pick the wrong one and derive a key that reads nothing.
        authService.cacheSalt('acct-2', 'old');
        authService.cacheSalt('acct-2', 'new');
        expect(localStorage.getItem('zakapp_salt_acct-2')).toBe('new');
    });

    it('scopes the key per account', () => {
        authService.cacheSalt('acct-a', 'salt-a');
        authService.cacheSalt('acct-b', 'salt-b');
        expect(localStorage.getItem('zakapp_salt_acct-a')).toBe('salt-a');
        expect(localStorage.getItem('zakapp_salt_acct-b')).toBe('salt-b');
    });

    it('does not throw when storage is unavailable', () => {
        // Private mode or a full quota must never fail a login: the key in memory
        // is still correct for this session.
        const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
            throw new Error('QuotaExceededError');
        });
        expect(() => authService.cacheSalt('acct-3', 'salt')).not.toThrow();
        setItem.mockRestore();
    });
});
