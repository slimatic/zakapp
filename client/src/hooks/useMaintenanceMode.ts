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

import { useState, useEffect } from 'react';

interface MaintenanceStatus {
    isMaintenanceMode: boolean;
    isLoading: boolean;
    error: Error | null;
}

/**
 * useMaintenanceMode Hook
 * 
 * Checks if the application is in maintenance mode by polling the backend status endpoint.
 * Automatically re-checks every 30 seconds to detect when maintenance ends.
 * 
 * Privacy-First: No user data is transmitted during status checks.
 * Offline-First: Gracefully handles network failures by assuming maintenance mode.
 * 
 * @returns {MaintenanceStatus} Current maintenance mode status and loading state
 * 
 * @example
 * ```tsx
 * const { isMaintenanceMode, isLoading } = useMaintenanceMode();
 * 
 * if (isLoading) return <LoadingSpinner />;
 * if (isMaintenanceMode) return <MaintenancePage />;
 * return <App />;
 * ```
 */
export const useMaintenanceMode = (): MaintenanceStatus => {
    const [status, setStatus] = useState<MaintenanceStatus>({
        isMaintenanceMode: false,
        isLoading: true,
        error: null,
    });

    useEffect(() => {
        const checkMaintenanceStatus = async () => {
            try {
                // Construct API URL from environment variable or fallback to relative path
                const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ||
                    import.meta.env.REACT_APP_API_BASE_URL ||
                    '/api';

                const response = await fetch(`${apiBaseUrl}/maintenance-status`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    // Use a short timeout to fail fast
                    signal: AbortSignal.timeout(5000),
                });

                const data = await response.json();

                setStatus({
                    isMaintenanceMode: data.maintenanceMode || false,
                    isLoading: false,
                    error: null,
                });
            } catch (error) {
                // If we can't reach the server, assume maintenance mode (fail-safe)
                // This ensures that network issues don't lock users out with a broken UI
                console.warn('Failed to check maintenance status, assuming maintenance mode:', error);

                setStatus({
                    isMaintenanceMode: true,
                    isLoading: false,
                    error: error as Error,
                });
            }
        };

        // Initial check
        checkMaintenanceStatus();

        // Poll every 30 seconds to detect when maintenance ends
        // This allows users to automatically see the app when it comes back online
        const interval = setInterval(checkMaintenanceStatus, 30000);

        return () => clearInterval(interval);
    }, []);

    return status;
};
