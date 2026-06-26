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

import React, { ReactNode } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthContext } from './contexts/AuthContext';
import { Toaster } from 'react-hot-toast';
import { vi } from 'vitest';

// Create a custom render function that includes providers
const createWrapper = (userOverride: any = null) => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
            },
        },
    });

    // Mock authentication state
    const mockAuthContext = {
        user: userOverride || {
            id: 'test-user',
            email: 'test@example.com',
            username: 'testuser',
            firstName: 'Test',
            lastName: 'User',
            settings: {}
        },
        isAuthenticated: true,
        login: vi.fn(),
        logout: vi.fn(),
        register: vi.fn(),
        updateProfile: vi.fn(),
        loading: false,
        error: null,
        // Add other required AuthContext properties if necessary
    };

    return ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>
            <AuthContext.Provider value={mockAuthContext as any}>
                <MemoryRouter>
                    {children}
                    <Toaster />
                </MemoryRouter>
            </AuthContext.Provider>
        </QueryClientProvider>
    );
};

// Custom render method
const customRender = (
    ui: React.ReactElement,
    options?: Omit<RenderOptions, 'wrapper'> & { user?: any }
) => {
    const { user, ...renderOptions } = options || {};
    return render(ui, { wrapper: createWrapper(user), ...renderOptions });
};

// Re-export everything
import userEvent from '@testing-library/user-event';
export * from '@testing-library/react';
export { customRender as render, userEvent };
