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
 * Security Configuration
 * Centralized secret management to prevent hardcoded fallbacks.
 */

export const getEncryptionKey = (): string => {
    if (!process.env.ENCRYPTION_KEY) {
        throw new Error('CRITICAL SECURITY ERROR: ENCRYPTION_KEY environment variable is not set. Application cannot start securely.');
    }
    return process.env.ENCRYPTION_KEY;
};

export const getJwtSecret = (): string => {
    if (!process.env.JWT_SECRET) {
        throw new Error('CRITICAL SECURITY ERROR: JWT_SECRET environment variable is not set. Application cannot start securely.');
    }
    return process.env.JWT_SECRET;
};
