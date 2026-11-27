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
 * Logger Utility (Frontend)
 * Standard logging wrapper for consistent diagnostic output in React
 */

export class Logger {
    constructor(private context: string) { }

    info(message: string, ...args: any[]): void {
        if (process.env.NODE_ENV === 'development') {
            console.log('[%s] INFO: %s', this.context, message, ...args);
        }
    }

    error(message: string, ...args: any[]): void {
        console.error('[%s] ERROR: %s', this.context, message, ...args);
    }

    warn(message: string, ...args: any[]): void {
        console.warn('[%s] WARN: %s', this.context, message, ...args);
    }

    debug(message: string, ...args: any[]): void {
        if (process.env.NODE_ENV === 'development') {
            console.debug('[%s] DEBUG: %s', this.context, message, ...args);
        }
    }
}

export const logger = new Logger('APP');
