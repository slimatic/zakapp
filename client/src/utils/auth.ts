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
 * Reads the auth JWT from session storage.
 *
 * Session shape (zakapp_session_v1): { user, jwk }. The access token is kept
 * in memory by AuthContext, but for Service Worker / PushManager requests
 * (which run outside React) we need a synchronous read. We store a separate
 * lightweight mirror `zakapp_token` at login so this utility can return it
 * without depending on React state.
 */

const TOKEN_KEY = 'zakapp_token';

export function getAuthToken(): string | null {
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

/** Called by AuthContext at login / logout so the SW can send authenticated requests. */
export function setAuthToken(token: string | null): void {
  try {
    if (token) sessionStorage.setItem(TOKEN_KEY, token);
    else sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}
