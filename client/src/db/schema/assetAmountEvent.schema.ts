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
 * Asset amount events — the local history of what an asset was worth, and when.
 *
 * Assets are stored client-side (RxDB/IndexedDB) and `Asset.value` is
 * `encrypted: true`, so the server can neither read a value nor compute a
 * history from one. History is therefore recorded and read locally, exactly like
 * the asset it describes — the same reason `notes` and `metadata` never leave
 * this layer in cleartext.
 *
 * `amount` is `encrypted: true` to match the protection `Asset.value` already
 * has. A history that stored values in cleartext would be a way to read an
 * asset's worth without its encryption, which would quietly undo that
 * protection.
 *
 * `effectiveDate` and `eventType` are deliberately NOT encrypted: they are
 * sorted and filtered locally, and a date and a fixed verb are not the sensitive
 * part. The same reasoning the server documents for payment dates.
 */
export const AssetAmountEventSchema = {
    version: 1,
    primaryKey: 'id',
    type: 'object',
    properties: {
        id: {
            type: 'string',
            maxLength: 100
        },
        assetId: {
            type: 'string',
            maxLength: 100
        },
        userId: {
            type: 'string',
            maxLength: 100
        },
        /**
         * CREATED | UPDATED | CORRECTION
         * Kept open (no enum) so a future type does not fail validation on an
         * existing database. Unknown values render as-is.
         */
        eventType: {
            type: 'string',
            maxLength: 30
        },
        amount: {
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
        /**
         * When the amount took effect. A user may back-date an entry, which is
         * the point of the feature: a nisab date can be reconciled against what
         * the asset was actually worth on that day.
         */
        effectiveDate: {
            type: 'string',
            format: 'date-time',
            maxLength: 30
        },
        /** When the entry was written. Never back-dated. */
        recordedAt: {
            type: 'string',
            format: 'date-time',
            maxLength: 30
        },
        description: {
            type: 'string'
        },
        source: {
            type: 'string',
            maxLength: 30
        }
    },
    required: ['id', 'assetId', 'userId', 'eventType', 'amount', 'effectiveDate', 'recordedAt'],
    indexes: ['assetId', 'effectiveDate', ['assetId', 'effectiveDate']]
};
