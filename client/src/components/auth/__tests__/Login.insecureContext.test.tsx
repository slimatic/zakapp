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

import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// The login path pulls in AuthContext; stub it so this test exercises the
// insecure-context guard in isolation and never touches real auth.
const loginMock = vi.fn().mockResolvedValue(undefined);
vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: false,
    login: loginMock,
    isLoading: false,
    error: null,
    errorCode: null,
  }),
}));

vi.mock('../../../services/api', () => ({
  apiService: { resendVerificationEmail: vi.fn().mockResolvedValue({ success: false }) },
}));

import { Login } from '../Login';
import '../../../i18n';

const renderLogin = () =>
  render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  );

/**
 * `crypto.subtle` is absent on a plain-http, non-local origin. jsdom always
 * provides it, so the only way to reproduce the real condition is to remove it.
 * It must stay removed for the whole interaction, not just the render - the guard
 * runs on submit.
 *
 * Capture the real value ONCE at module load. Reading it inside a helper would
 * read whatever the previous test left behind, because in jsdom `window` and
 * `globalThis` are the same object - so a "restore" that re-read `crypto` would
 * restore the stubbed version and every later test would fail.
 */
const REAL_SUBTLE = globalThis.crypto.subtle;

const removeSubtle = () => {
  Object.defineProperty(globalThis.crypto, 'subtle', {
    value: undefined,
    configurable: true,
    writable: true,
  });
};

const restoreSubtle = () => {
  Object.defineProperty(globalThis.crypto, 'subtle', {
    value: REAL_SUBTLE,
    configurable: true,
    writable: true,
  });
};

describe('Login on an insecure origin', () => {
  beforeEach(() => {
    loginMock.mockClear();
  });

  afterEach(() => {
    restoreSubtle();
    vi.restoreAllMocks();
  });

  it('does NOT attempt a login that cannot decrypt, and explains why', async () => {
    removeSubtle();
    renderLogin();

    await userEvent.type(screen.getByLabelText(/username/i), 'vismoke');
    await userEvent.type(screen.getByLabelText(/^password$/i), 'some-password');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    // The regression this guards: previously login() ran anyway and the UI sat on
    // "Decrypting vault..." forever. It must not be attempted at all.
    expect(loginMock).not.toHaveBeenCalled();

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/encryption is unavailable/i);
    // The message must name the address so the user knows which URL is the problem.
    expect(alert.textContent).toContain(window.location.origin);
  });

  it('does not show the warning while crypto.subtle is available', async () => {
    renderLogin();

    await userEvent.type(screen.getByLabelText(/username/i), 'vismoke');
    await userEvent.type(screen.getByLabelText(/^password$/i), 'some-password');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(loginMock).toHaveBeenCalled();
  });
});
