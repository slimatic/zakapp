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

export const UserSettingsSchema = {
    version: 3,
    primaryKey: 'id',
    type: 'object',
    properties: {
        id: {
            type: 'string',
            maxLength: 100
        },
        profileName: {
            type: 'string' // e.g. "My Profile"
        },
        firstName: {
            type: 'string'
        },
        lastName: {
            type: 'string'
        },
        email: {
            type: 'string'
        },
        preferredCalendar: {
            type: 'string',
            default: 'gregorian' // 'hijri' or 'gregorian'
        },
        preferredMethodology: {
            type: 'string',
            default: 'standard' // 'standard', 'hanafi', 'shafi', 'custom'
        },
        baseCurrency: {
            type: 'string',
            default: 'USD'
        },
        language: {
            type: 'string',
            default: 'en'
        },
        theme: {
            type: 'string', // 'light', 'dark', 'system'
            default: 'system'
        },
        lastLoginAt: {
            type: 'string',
            format: 'date-time'
        },
        isSetupCompleted: {
            type: 'boolean',
            default: false
        },
        securityProfile: {
            type: 'object',
            properties: {
                salt: { type: 'string' },
                // A hash of a known token (e.g. "valid") encrypted with the derived key.
                // If we can decrypt and see "valid", the key is correct.
                // OR: a standard hash of the derived key itself (e.g. SHA256(derivedKey)).
                // We'll stick to a simple verifier: "Verifier stored is hash of the key? No that exposes the key."
                // Better: PBKDF2(password, salt) -> Key.
                // Stored Verifier = Hash(Key).
                // Login check: Hash(derivedKey) === Stored Verifier.
                verifier: { type: 'string' }
            }
        },
        createdAt: {
            type: 'string',
            format: 'date-time'
        },
        updatedAt: {
            type: 'string',
            format: 'date-time'
        }
    },
    required: ['id'],
    indexes: []
};
