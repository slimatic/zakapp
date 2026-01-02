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

export const PaymentRecordSchema = {
    version: 4,
    primaryKey: 'id',
    type: 'object',
    properties: {
        id: {
            type: 'string',
            maxLength: 100
        },
        userId: {
            type: 'string',
            maxLength: 100
        },
        snapshotId: {
            type: 'string',
            maxLength: 100
        },
        calculationId: {
            type: 'string'
        },
        amount: {
            anyOf: [{ type: 'number' }, { type: 'string' }],
            encrypted: true
        },
        paymentDate: {
            type: 'string',
            format: 'date-time',
            maxLength: 30
        },
        recipientName: {
            type: 'string', // Encrypted? Local storage might allow plain if whole DB is encrypted
            encrypted: true
        },
        recipientType: {
            type: 'string'
        },
        recipientCategory: {
            type: 'string'
        },
        notes: {
            type: 'string',
            encrypted: true
        },
        receiptReference: {
            type: 'string',
            encrypted: true
        },
        paymentMethod: {
            type: 'string'
        },
        status: {
            type: 'string' // 'recorded', 'verified'
        },
        currency: {
            type: 'string',
            default: 'USD'
        },
        exchangeRate: {
            type: 'number',
            default: 1.0
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
    required: ['id', 'userId', 'amount', 'paymentDate'],
    indexes: ['userId', 'paymentDate']
};
