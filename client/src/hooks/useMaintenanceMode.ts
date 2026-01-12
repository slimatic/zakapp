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
 * Simple, predictable behavior: only shows maintenance page when MAINTENANCE_ENABLED=true.
 * 
 * Default Behavior: If API call fails, assumes normal operation (false) to prevent false positives.
 * Privacy-First: No user data is transmitted during status checks.
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

                // Only proceed if response is OK
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const data = await response.json();

                setStatus({
                    isMaintenanceMode: data.maintenanceMode === true, // Explicit true check
                    isLoading: false,
                    error: null,
                });
            } catch (error) {
                // Default to FALSE on error (normal operation)
                // This prevents false positives from temporary network issues
                console.warn('Failed to check maintenance status, defaulting to normal operation:', error);

                setStatus({
                    isMaintenanceMode: false, // Default to normal operation
                    isLoading: false,
                    error: error as Error,
                });
            }
        };

        // Initial check
        checkMaintenanceStatus();

        // Poll every 60 seconds (reduced from 30 to minimize network overhead)
        // Only poll if user is actively viewing the page
        const interval = setInterval(() => {
            if (document.visibilityState === 'visible') {
                checkMaintenanceStatus();
            }
        }, 60000);

        return () => clearInterval(interval);
    }, []);

    return status;
};
