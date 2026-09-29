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

import { logger } from '../utils/logger';
import { useState, useEffect } from 'react';
import { useDb } from '../db';
import { useAuth } from '../contexts/AuthContext';
import { Asset } from '../types';
import { switchMap } from 'rxjs/operators';
import { cryptoService } from '../services/CryptoService';

// Fields defined in asset.schema.ts
const ALLOWED_SCHEMA_FIELDS = [
    'id', 'userId', 'name', 'type', 'value', 'currency', 'description',
    'metadata', 'isActive', 'createdAt', 'updatedAt', 'acquisitionDate',
    'notes', 'calculationModifier', 'isPassiveInvestment', 'isRestrictedAccount',
    // The user's own zakatability answer, and the marker saying they gave it.
    // Both must survive a save: without the marker the next read cannot tell a
    // real override from the flag the onboarding wizard wrote on their behalf.
    'zakatEligible', 'isEligibilityManual'
];

export function useAssetRepository() {
    const db = useDb();
    const { user } = useAuth();
    const [assets, setAssets] = useState<Asset[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!db) return;

        // Subscribe to asset query with transparent decryption
        const sub = db.assets.find().$
            .pipe(
                switchMap(async (docs: any[]) => {
                    return Promise.all(docs.map(async (doc: any) => {
                        const data = { ...doc.toJSON() };

                        // Decrypt fields if needed
                        try {
                            if (cryptoService.isEncrypted(data.name)) {
                                const p = cryptoService.unpackEncrypted(data.name);
                                if (p) data.name = await cryptoService.decrypt(p.ciphertext, p.iv);
                            }

                            if (cryptoService.isEncrypted(data.value)) {
                                const p = cryptoService.unpackEncrypted(data.value);
                                if (p) {
                                    const valStr = await cryptoService.decrypt(p.ciphertext, p.iv);
                                    data.value = parseFloat(valStr);
                                }
                            }

                            if (cryptoService.isEncrypted(data.description)) {
                                const p = cryptoService.unpackEncrypted(data.description);
                                if (p) data.description = await cryptoService.decrypt(p.ciphertext, p.iv);
                            }

                            if (cryptoService.isEncrypted(data.notes)) {
                                const p = cryptoService.unpackEncrypted(data.notes);
                                if (p) data.notes = await cryptoService.decrypt(p.ciphertext, p.iv);
                            }

                            if (cryptoService.isEncrypted(data.metadata)) {
                                const p = cryptoService.unpackEncrypted(data.metadata);
                                if (p) data.metadata = await cryptoService.decrypt(p.ciphertext, p.iv);
                            }
                        } catch (e) {
                            console.error('Decryption failed for asset', data.id, e);
                            // Fallback? Keep ciphertext or render null?
                            // For now, keep as is (likely ciphertext) to avoid crash
                        }

                        // Unpack metadata to ensure UI sees all fields (subtype, zakatEligible, etc.)
                        if (data.metadata) {
                            try {
                                const meta = typeof data.metadata === 'string' ? JSON.parse(data.metadata) : data.metadata;
                                if (meta && typeof meta === 'object') {
                                    Object.assign(data, meta);
                                }
                            } catch (e) {
                                console.warn(`Failed to parse/merge metadata for asset ${data.id}. Error:`, e);
                            }
                        }
                        return data;
                    }));
                })
            )
            .subscribe({
                next: (data: Asset[]) => {
                    setAssets(data);
                    setIsLoading(false);
                },
                error: (err: any) => {
                    setError(err);
                    setIsLoading(false);
                }
            });

        return () => sub.unsubscribe();
    }, [db]);

    /**
     * Sanitizes the asset object to match the schema.
     * Moves any unknown fields into the 'metadata' JSON string.
     */
    const sanitizeAssetPayload = (asset: Partial<Asset>): any => {
        const clean: any = {};
        const extraMetadata: any = {};

        // 1. Parse existing metadata if present
        if (asset.metadata) {
            try {
                const parsed = typeof asset.metadata === 'string'
                    ? JSON.parse(asset.metadata)
                    : asset.metadata;
                Object.assign(extraMetadata, parsed);
            } catch (e) {
                console.warn('Failed to parse existing metadata:', e);
            }
        }

        // 2. Iterate keys and distribute
        Object.keys(asset).forEach(key => {
            if (key === 'metadata') return; // Handled above

            if (ALLOWED_SCHEMA_FIELDS.includes(key)) {
                clean[key] = asset[key as keyof Asset];

                // CRITICAL FIX: Double-write calculationModifier to metadata 
                // This ensures it persists even if the local RxDB schema is outdated (missing the column)
                if (key === 'calculationModifier') {
                    extraMetadata[key] = asset[key as keyof Asset];
                }
            } else if (key.startsWith('_')) {
                // Skip internal RxDB fields like _rev, _meta unless absolutely needed (usually managed by RxDB)
            } else {
                // Move unknown field to metadata (e.g. subtype, country, city)
                extraMetadata[key] = asset[key as keyof Asset];
            }
        });

        // 3. Re-serialize metadata
        clean.metadata = JSON.stringify(extraMetadata);

        return clean;
    };

    /**
     * Record what an asset was worth, and when.
     *
     * One helper so every write path routes through it rather than each caller
     * remembering to record. Best-effort on purpose: a history write must never
     * fail an asset save, because losing the edit is worse than losing its log
     * line. A failure is logged, not thrown.
     *
     * `value` arrives as a number or a numeric string depending on the caller;
     * anything unparseable is skipped rather than stored as NaN, which would
     * poison every later comparison.
     */
    const recordAmountEvent = async (
        assetId: string,
        rawAmount: unknown,
        eventType: 'CREATED' | 'UPDATED',
        description: string,
        currency = 'USD'
    ) => {
        if (!db) return;
        const amount = typeof rawAmount === 'string' ? parseFloat(rawAmount) : rawAmount;
        if (typeof amount !== 'number' || !Number.isFinite(amount)) {
            console.warn(`[useAssetRepository] Not recording ${eventType} for ${assetId}: amount is not a finite number`, rawAmount);
            return;
        }
        try {
            const now = new Date().toISOString();
            await db.asset_amount_events.insert({
                id: crypto.randomUUID(),
                assetId,
                userId: user?.id || '',
                eventType,
                amount,
                currency,
                effectiveDate: now,
                recordedAt: now,
                description,
                source: 'local'
            });
        } catch (e) {
            // ponytail: history is best-effort, an asset save must not fail on it.
            // Upgrade path: queue and retry if history loss ever matters more than availability.
            console.error('[useAssetRepository] Failed to record amount event', e);
        }
    };

    const addAsset = async (asset: Partial<Asset>) => {
        if (!db) throw new Error('Database not initialized');
        // Ensure user is authenticated to get the ID
        // Note: We check user.id to ensure we don't save with undefined ID
        if (!user || !user.id) {
            console.warn('[useAssetRepository] User not authenticated, cannot attach userId');
            // We could throw, OR we could allow it (fallback to current schema behavior which is undefined?)
            // But sticking to the fix plan:
            throw new Error('User not authenticated');
        }

        // Check Resource Limits (Client-Side)
        if (typeof user.maxAssets === 'number') {
            const currentCount = await db.assets.find({
                selector: {
                    isActive: { $eq: true },
                    userId: { $eq: user.id }
                }
            }).exec().then((docs: any[]) => docs.length);

            if (currentCount >= user.maxAssets) {
                throw new Error(`Asset limit reached. You can create a maximum of ${user.maxAssets} assets.`);
            }
        }

        const safePayload = sanitizeAssetPayload(asset);

        // Restoring a backup must be idempotent. Assets keep a stable id on
        // export (adaptAssets preserves it so re-import "prevents duplication"),
        // but this path always called db.assets.insert(), which throws
        // CONFLICT on an id that already exists - so a second import of the same
        // file failed and the Smart Import reported "Asset Error" per row,
        // leaving the user's balances at whatever the first import wrote.
        //
        // Update in place when the id is already present; insert otherwise.
        if (safePayload.id) {
            const existing = await db.assets.findOne(safePayload.id).exec();
            if (existing) {
                const patched = await existing.patch({
                    ...safePayload,
                    userId: user.id,
                    updatedAt: new Date().toISOString(),
                });
                // Still a value change, so it belongs in the history. Returning
                // early here would leave an overwritten asset with no record of
                // having moved. Only an actual change is recorded, matching the
                // update path's rule.
                if (Number(existing.value) !== Number(safePayload.value)) {
                    await recordAmountEvent(
                        safePayload.id,
                        safePayload.value,
                        'UPDATED',
                        'Asset restored from a backup',
                        safePayload.currency || existing.currency || 'USD'
                    );
                }
                return patched;
            }
        }

        // Ensure ID and timestamps
        const newAsset = {
            ...safePayload,
            id: safePayload.id || crypto.randomUUID(),
            userId: user.id, // Inject Real User ID
            // Preserve a supplied createdAt so a restored backup keeps its real dates.
            // The form never sends one, so normal creation is unaffected - but an
            // import does, and overwriting it reset every record's age. See #age.
            createdAt: safePayload.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isActive: safePayload.isActive ?? true,
            // Ensure defaults
            currency: safePayload.currency || 'USD',
            calculationModifier: safePayload.calculationModifier ?? 1.0
        };

        const inserted = await db.assets.insert(newAsset);

        await recordAmountEvent(
            inserted.id,
            newAsset.value,
            'CREATED',
            'Asset created',
            newAsset.currency
        );

        return inserted;
    };

    const removeAsset = async (id: string) => {
        if (!db) throw new Error('Database not initialized');
        const doc = await db.assets.findOne(id).exec();
        if (doc) {
            return doc.remove();
        }
    };

    const updateAsset = async (id: string, updates: Partial<Asset>) => {
        if (!db) throw new Error('Database not initialized');

        const doc = await db.assets.findOne(id).exec();

        if (doc) {
            // Need to handle metadata merging carefully
            // The sanitize function parses incoming metadata, but we should also consider existing doc metadata?
            // Yes, doc.patch merges top-level fields. 
            // If we overwrite 'metadata', we overwrite all of it.
            // So we should fetch existing doc metadata, merge, and save.

            let currentMeta = {};
            try {
                // Check if metadata is the encrypted string (starts with ZK1:)
                if (doc.metadata && typeof doc.metadata === 'string' && doc.metadata.startsWith('ZK1:')) {
                    console.warn('[useAssetRepository] Asset metadata is encrypted (ZK1:...), overwriting with new data to recover asset.', id);
                    // We knowingly discard the unreadable ciphertext and start fresh with the updates
                    currentMeta = {};
                } else {
                    currentMeta = doc.metadata ? JSON.parse(doc.metadata) : {};
                }
            } catch (e) {
                console.warn('[useAssetRepository] Failed to parse existing doc metadata. Overwriting with new data.', doc.metadata);
                // Also recover from bad JSON
                currentMeta = {};
            }

            const safeUpdates = sanitizeAssetPayload(updates);

            // Merge metadata
            let newMeta = {};
            try {
                newMeta = safeUpdates.metadata ? JSON.parse(safeUpdates.metadata) : {};
            } catch (e) {
                console.warn('[useAssetRepository] Failed to parse new metadata updates.', safeUpdates.metadata);
            }

            const mergedMeta = { ...currentMeta, ...newMeta };

            safeUpdates.metadata = JSON.stringify(mergedMeta);
            safeUpdates.updatedAt = new Date().toISOString();

            // Record before patching, while the previous value is still readable.
            //
            // Only a genuine change is recorded. The edit form submits the whole
            // asset, so saving without touching the value would otherwise append
            // an identical entry on every visit and bury the real changes — the
            // history is only useful if each row means something happened.
            //
            // doc.value may be the ZK1 ciphertext rather than a number, so it is
            // compared numerically only when it parses; an unreadable previous
            // value is treated as changed rather than silently skipped, because
            // dropping a real edit is worse than one duplicate row.
            const nextValue = updates.value;
            const prevValue = doc.value;
            const prevNum = typeof prevValue === 'string' ? parseFloat(prevValue) : prevValue;
            const nextNum = typeof nextValue === 'string' ? parseFloat(nextValue) : nextValue;
            const comparable =
                typeof prevNum === 'number' && Number.isFinite(prevNum) &&
                typeof nextNum === 'number' && Number.isFinite(nextNum);
            const changed = nextValue !== undefined && (!comparable || prevNum !== nextNum);

            const result = await doc.patch(safeUpdates);

            if (changed) {
                await recordAmountEvent(
                    id,
                    nextValue,
                    'UPDATED',
                    'Value updated',
                    (updates.currency ?? doc.currency) || 'USD'
                );
            }

            return result;
        } else {
            console.error('[useAssetRepository] Asset document not found for ID:', id);
        }
    };

    const reassessAssets = async (methodologyName: string) => {
        if (!db) throw new Error('Database not initialized');

        // Dynamic import to avoid circular dependencies if any
        const { METHODOLOGIES } = await import('../core/calculations/methodology');
        // @ts-ignore
        const config = METHODOLOGIES[methodologyName.toUpperCase()] || METHODOLOGIES.STANDARD;
        const isJewelryExempt = config.jewelryExempt || false;

        const allAssets = await db.assets.find().exec();

        for (const doc of allAssets) {
            const data = doc.toJSON();

            // Parse metadata to check manual override
            let meta: any = {};
            try {
                // Check if metadata is encrypted string
                if (data.metadata && typeof data.metadata === 'string' && data.metadata.startsWith('ZK1:')) {
                    console.warn(`[reassessAssets] Skipping Asset ${data.id}: Metadata is encrypted (ZK1:...), cannot read rules.`);
                    continue;
                }
                meta = data.metadata ? (typeof data.metadata === 'string' ? JSON.parse(data.metadata) : data.metadata) : {};
            } catch (e) {
                console.warn('Metadata parse fail', e);
            }

            // JOIN data and meta for easier checking
            const asset = { ...data, ...meta };

            // RULES:
            // 1. If isEligibilityManual is true, DO NOT TOUCH.
            if (asset.isEligibilityManual) {
                logger.debug(`Skipping Asset ${asset.name} (Manual Override)`);
                continue;
            }

            // 2. Logic for Jewelry (Gold/Silver/Jewelry subcat)
            // We verify if it matches the current methodology
            const isJewelry =
                (asset.subCategory === 'jewelry') ||
                (asset.type === 'GOLD' && (!asset.subCategory || asset.subCategory === 'jewelry')) ||
                (asset.type === 'SILVER' && (!asset.subCategory || asset.subCategory === 'jewelry'));

            if (isJewelry) {
                let shouldBeEligible = true;
                if (isJewelryExempt) {
                    shouldBeEligible = false;
                }

                // If current state differs from rule, update it
                if (asset.zakatEligible !== shouldBeEligible) {
                    await updateAsset(asset.id, { zakatEligible: shouldBeEligible });
                }
            }
        }
    };

    return { assets, isLoading, error, addAsset, removeAsset, updateAsset, reassessAssets };
}
