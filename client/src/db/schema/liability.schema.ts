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

export const LiabilitySchema = {
    version: 3,
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
        amount: {
            anyOf: [{ type: 'number' }, { type: 'string' }],
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
        dueDate: {
            type: 'string',
            format: 'date-time',
            maxLength: 30
        },
        creditor: {
            type: 'string',
            encrypted: true
        },
        notes: {
            type: 'string',
            encrypted: true
        }
    },
    required: ['id', 'name', 'type', 'amount', 'isActive', 'dueDate'],
    indexes: ['type', 'isActive', 'dueDate']
};
