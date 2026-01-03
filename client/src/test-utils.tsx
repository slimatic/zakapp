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
