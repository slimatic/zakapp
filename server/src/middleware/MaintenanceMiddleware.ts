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

import { Request, Response, NextFunction } from 'express';

/**
 * Maintenance Mode Middleware
 * 
 * Blocks all requests when MAINTENANCE_ENABLED=true environment variable is set.
 * Allows /health endpoint to remain accessible for monitoring systems.
 * 
 * Architecture: Follows SOLID principles with centralized maintenance control.
 * Security: Prevents authentication and data access during maintenance.
 * Privacy: No user data is exposed in maintenance responses.
 * 
 * @example
 * ```typescript
 * const maintenanceMw = new MaintenanceMiddleware();
 * app.use(maintenanceMw.getMiddleware());
 * ```
 */
export class MaintenanceMiddleware {
    private isMaintenanceEnabled: boolean;

    constructor() {
        // Check environment variable - defaults to false if not set
        this.isMaintenanceEnabled = process.env.MAINTENANCE_ENABLED === 'true';

        if (this.isMaintenanceEnabled) {
            console.log('🚧 Maintenance Mode ENABLED - Application will be unavailable');
        }
    }

    /**
     * Get the main middleware function that blocks requests during maintenance
     * 
     * @returns Express middleware function
     */
    public getMiddleware() {
        return (req: Request, res: Response, next: NextFunction) => {
            // Always allow health check endpoint for monitoring
            if (req.path === '/health') {
                return next();
            }

            // Always allow maintenance status endpoint
            if (req.path === '/api/maintenance-status') {
                return next();
            }

            // Block all other requests if maintenance mode is enabled
            if (this.isMaintenanceEnabled) {
                return res.status(503).json({
                    success: false,
                    error: 'Service temporarily unavailable for maintenance',
                    message: 'ZakApp is currently undergoing scheduled maintenance. Please check back shortly.',
                    maintenanceMode: true,
                    timestamp: new Date().toISOString(),
                });
            }

            // Normal operation - proceed to next middleware
            next();
        };
    }

    /**
     * Get endpoint handler for maintenance status API
     * Allows frontend to check if maintenance mode is active
     * 
     * @returns Express route handler
     */
    public getStatusEndpoint() {
        return (req: Request, res: Response) => {
            res.json({
                success: true,
                maintenanceMode: this.isMaintenanceEnabled,
                timestamp: new Date().toISOString(),
            });
        };
    }

    /**
     * Get current maintenance mode status
     * Useful for conditional logic in other parts of the application
     * 
     * @returns boolean indicating if maintenance mode is enabled
     */
    public isEnabled(): boolean {
        return this.isMaintenanceEnabled;
    }
}
