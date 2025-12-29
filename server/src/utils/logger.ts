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
 * Logger Utility
 * Simple logging wrapper for consistent logging across services
 */

export class Logger {
  constructor(private context: string) {}

  info(message: string, data?: any): void {
    console.log(`[${this.context}] INFO: ${message}`, data || '');
  }

  error(message: string, error?: any): void {
    console.error(`[${this.context}] ERROR: ${message}`, error || '');
  }

  warn(message: string, data?: any): void {
    console.warn(`[${this.context}] WARN: ${message}`, data || '');
  }

  debug(message: string, data?: any): void {
    if (process.env.DEBUG) {
      console.debug(`[${this.context}] DEBUG: ${message}`, data || '');
    }
  }
}

// Export default singleton logger instance for use in preciousMetalsApi.ts
export const logger = new Logger('APP');
