/**
 * Copyright (c) 2024-2026 ZakApp Contributors
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

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { SystemHealth } from '../SystemHealth';
import { adminService } from '../../../services/adminService';
import { vi, describe, it, expect, beforeEach, afterEach, Mock } from 'vitest';

// Mock the adminService
vi.mock('../../../services/adminService', () => ({
    adminService: {
        getSystemStatus: vi.fn(),
        getStats: vi.fn(),
    }
}));

describe('SystemHealth', () => {
    const mockStatus = {
        status: 'ok',
        version: '1.0.0',
        uptime: 12345,
        database: {
            connected: true,
            latencyMs: 10,
            schemaUpToDate: true,
            pendingMigrations: 0
        },
        memory: {
            rss: 100,
            heapTotal: 200,
            heapUsed: 150,
            external: 50
        },
        environment: {
            NODE_ENV: 'test',
            PORT: '3000',
            TZ: 'UTC'
        },
        timestamp: '2024-01-01T00:00:00.000Z'
    };

    beforeEach(() => {
        (adminService.getSystemStatus as Mock).mockResolvedValue({
            success: true,
            data: mockStatus
        });
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('renders loading state initially', () => {
        render(<SystemHealth />);
        expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('renders system status data after loading', async () => {
        render(<SystemHealth />);

        await waitFor(() => {
            expect(screen.getByText('System Health')).toBeInTheDocument();
        });

        expect(screen.getByText('General')).toBeInTheDocument();
        expect(screen.getByText('Database')).toBeInTheDocument();
        expect(screen.getByText('Memory')).toBeInTheDocument();
        expect(screen.getByText('Environment')).toBeInTheDocument();

        expect(screen.getByText('OK')).toBeInTheDocument();
        expect(screen.getByText('1.0.0')).toBeInTheDocument();
        expect(screen.getByText('YES')).toBeInTheDocument();
        expect(screen.getByText('10ms')).toBeInTheDocument();
        expect(screen.getByText('SYNCED')).toBeInTheDocument();
    });

    it('handles error state', async () => {
        (adminService.getSystemStatus as Mock).mockResolvedValue({
            success: false,
            error: 'Failed to fetch'
        });

        render(<SystemHealth />);

        await waitFor(() => {
            expect(screen.getByText(/Failed to fetch/i)).toBeInTheDocument();
        });
    });

    it('refreshes data when refresh button is clicked', async () => {
        render(<SystemHealth />);

        await waitFor(() => {
            expect(screen.getByText('System Health')).toBeInTheDocument();
        });

        const refreshButton = screen.getByText('Refresh');
        fireEvent.click(refreshButton);

        // First call on mount, second call on click
        expect(adminService.getSystemStatus).toHaveBeenCalledTimes(2);
    });
});
