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

export const NisabYearRecordSchema = {
    version: 3,
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
        // Hawl Tracking
        hawlStartDate: {
            type: 'string',
            format: 'date-time',
            maxLength: 30
        },
        hawlStartDateHijri: {
            type: 'string'
        },
        hawlCompletionDate: {
            type: 'string',
            format: 'date-time'
        },
        hawlCompletionDateHijri: {
            type: 'string'
        },
        nisabThresholdAtStart: {
            type: 'string' // Encrypted or plain? Using plain for local default, assume encryption handled by service
        },
        nisabBasis: {
            type: 'string' // 'gold' or 'silver'
        },

        // Calculation Results
        calculationDate: {
            type: 'string',
            format: 'date-time'
        },
        gregorianYear: {
            type: 'number'
        },
        hijriYear: {
            type: 'number'
        },
        totalWealth: {
            type: 'number'
        },
        totalLiabilities: {
            type: 'number'
        },
        zakatableWealth: {
            type: 'number'
        },
        zakatAmount: {
            type: 'number'
        },
        currency: {
            type: 'string',
            default: 'USD'
        },
        methodologyUsed: {
            type: 'string'
        },

        status: {
            type: 'string', // 'DRAFT', 'FINALIZED', 'UNLOCKED'
            default: 'DRAFT',
            maxLength: 20
        },

        assetBreakdown: {
            type: 'string' // JSON
        },
        calculationDetails: {
            type: 'string' // JSON
        },
        userNotes: {
            type: 'string'
        },
        isPrimary: {
            type: 'boolean',
            default: false
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
    required: ['id', 'userId', 'status', 'hawlStartDate'],
    indexes: ['userId', 'hawlStartDate', 'status']
};
