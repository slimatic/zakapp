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

import { vi } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import App from './App';

// Mock CryptoService to avoid "Web Crypto API unavailable" error
vi.mock('./services/CryptoService', () => ({
  cryptoService: {
    deriveKey: vi.fn(),
    encrypt: vi.fn(() => Promise.resolve('mock-encrypted')),
    decrypt: vi.fn(() => Promise.resolve('mock-decrypted')),
    generateSalt: vi.fn(() => 'mock-salt'),
  },
  CryptoService: {
    generateSalt: () => 'mock-salt'
  }
}));

// Mock DB to prevent DB9 and side effects
const mockDb = {
  user_settings: {
    findOne: () => ({
      exec: () => Promise.resolve(null)
    })
  }
};

vi.mock('./db', () => ({
  useDb: () => null,
  getDb: () => Promise.resolve(mockDb),
  resetDb: vi.fn(),
}));

// Mock PWA components
vi.mock('./components/pwa/InstallPrompt', () => ({
  default: () => null,
}));
vi.mock('./components/pwa/UpdateNotification', () => ({
  default: () => null,
}));

// Mock lazy config
vi.mock('./config', () => ({
  getFeedbackEnabled: () => false,
  getVapidPublicKey: () => 'mock-key',
}));

describe('App', () => {
  test('renders ZakApp branding or Sign In page', async () => {
    render(<App />);
    // Should render Login page by default (auth guarded)
    // Login page title
    expect(await screen.findByText(/Welcome Back/i)).toBeInTheDocument();

    // Login button (Text is "Login", not "Sign In")
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });
});
