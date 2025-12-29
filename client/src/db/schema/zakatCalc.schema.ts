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

export const ZakatCalculationSchema = {
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
        calculationDate: {
            type: 'string',
            format: 'date-time'
        },
        methodology: {
            type: 'string'
        },
        calendarType: {
            type: 'string'
        },
        totalAssets: {
            type: 'number'
        },
        totalLiabilities: {
            type: 'number'
        },
        netWorth: {
            type: 'number'
        },
        nisabThreshold: {
            type: 'number'
        },
        nisabSource: {
            type: 'string'
        },
        isZakatObligatory: {
            type: 'boolean'
        },
        zakatAmount: {
            type: 'number'
        },
        zakatRate: {
            type: 'number'
        },
        breakdown: {
            type: 'string' // Encrypted JSON
        },
        assetsIncluded: {
            type: 'string' // Encrypted JSON
        },
        liabilitiesIncluded: {
            type: 'string' // Encrypted JSON
        },
        createdAt: {
            type: 'string',
            format: 'date-time'
        }
    },
    required: ['id', 'userId', 'calculationDate', 'zakatAmount']
};
