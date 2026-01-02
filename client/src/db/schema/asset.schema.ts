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

export const AssetSchema = {
    version: 4,
    primaryKey: 'id',
    type: 'object',
    properties: {
        id: {
            type: 'string',
            maxLength: 100
        },
        userId: {
            type: 'string'
        },
        name: {
            type: 'string',
            encrypted: true
        },
        type: {
            type: 'string',
            maxLength: 50
        },
        value: {
            anyOf: [
                { type: 'number' },
                { type: 'string' }
            ],
            encrypted: true
        },
        currency: {
            type: 'string',
            default: 'USD',
            maxLength: 3
        },
        description: {
            type: 'string',
            encrypted: true
        },
        metadata: {
            type: 'string', // Encrypted JSON
            encrypted: true
        },
        isActive: {
            type: 'boolean',
            default: true
        },
        createdAt: {
            type: 'string',
            format: 'date-time'
        },
        updatedAt: {
            type: 'string',
            format: 'date-time'
        },
        acquisitionDate: {
            type: 'string',
            format: 'date-time',
            maxLength: 30
        },
        notes: {
            type: 'string',
            encrypted: true
        },
        calculationModifier: {
            type: 'number',
            default: 1.0
        },
        isPassiveInvestment: {
            type: 'boolean',
            default: false
        },
        isRestrictedAccount: {
            type: 'boolean',
            default: false
        }
    },
    required: ['id', 'name', 'type', 'value', 'acquisitionDate', 'isActive'],
    indexes: ['type', 'isActive', 'acquisitionDate']
};
