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
    version: 2,
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
            type: 'string'
        },
        type: {
            type: 'string',
            maxLength: 50
        },
        amount: {
            type: 'number'
        },
        currency: {
            type: 'string',
            default: 'USD',
            maxLength: 3
        },
        description: {
            type: 'string'
        },
        metadata: {
            type: 'string' // Encrypted JSON
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
            type: 'string'
        },
        notes: {
            type: 'string'
        }
    },
    required: ['id', 'name', 'type', 'amount', 'isActive', 'dueDate'],
    indexes: ['type', 'isActive', 'dueDate']
};
