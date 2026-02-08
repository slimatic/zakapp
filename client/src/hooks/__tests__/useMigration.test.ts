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
import { renderHook, waitFor } from '@testing-library/react';
import { useMigration } from '../useMigration';
import { apiService } from '../../services/api';

// Mock the API service
vi.mock('../../services/api', () => ({
  apiService: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

// Note: PaymentEncryptionService mock not needed as encryption is stubbed in the hook
// This will be updated when the zero-knowledge encryption service is available

describe('useMigration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should check migration status on mount', async () => {
    const mockStatus = {
      needsMigration: true,
      totalPayments: 10,
      zkPayments: 0,
      serverPayments: 10,
    };

    vi.mocked(apiService.get).mockResolvedValueOnce({
      success: true,
      data: mockStatus,
    });

    const { result } = renderHook(() => useMigration());

    await waitFor(() => {
      expect(result.current.status).toEqual(mockStatus);
      expect(result.current.needsMigration).toBe(true);
    });
  });

  it('should return needsMigration false when no migration needed', async () => {
    const mockStatus = {
      needsMigration: false,
      totalPayments: 10,
      zkPayments: 10,
      serverPayments: 0,
    };

    vi.mocked(apiService.get).mockResolvedValueOnce({
      success: true,
      data: mockStatus,
    });

    const { result } = renderHook(() => useMigration());

    await waitFor(() => {
      expect(result.current.needsMigration).toBe(false);
    });
  });

  it('should handle migration with no payments', async () => {
    const mockStatus = {
      needsMigration: true,
      totalPayments: 0,
      zkPayments: 0,
      serverPayments: 0,
    };

    vi.mocked(apiService.get).mockResolvedValueOnce({
      success: true,
      data: mockStatus,
    });

    vi.mocked(apiService.post).mockResolvedValueOnce({
      success: true,
      data: { payments: [] },
    });

    vi.mocked(apiService.post).mockResolvedValueOnce({
      success: true,
    });

    const { result } = renderHook(() => useMigration());

    await waitFor(() => {
      expect(result.current.status).toBeTruthy();
    });

    const migrationResult = await result.current.startMigration();

    expect(migrationResult.success).toBe(true);
    
    // Wait for state updates to complete
    await waitFor(() => {
      expect(result.current.migrationProgress).toBe(100);
    });
  });

  it('should handle migration errors', async () => {
    const mockStatus = {
      needsMigration: true,
      totalPayments: 5,
      zkPayments: 0,
      serverPayments: 5,
    };

    vi.mocked(apiService.get).mockResolvedValueOnce({
      success: true,
      data: mockStatus,
    });

    vi.mocked(apiService.post).mockRejectedValueOnce(
      new Error('Network error')
    );

    const { result } = renderHook(() => useMigration());

    await waitFor(() => {
      expect(result.current.status).toBeTruthy();
    });

    const migrationResult = await result.current.startMigration();

    expect(migrationResult.success).toBe(false);
    expect(migrationResult.error).toBe('Network error');
    
    // Wait for state updates to complete
    await waitFor(() => {
      expect(result.current.error).toBe('Network error');
    });
  });
});
