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

import { useState, useEffect } from 'react';
import { useDb } from '../db';
import { useAuth } from '../contexts/AuthContext';
import { Asset } from '../types';
import { map, switchMap } from 'rxjs/operators';
import { cryptoService } from '../services/CryptoService';

// Fields defined in asset.schema.ts
const ALLOWED_SCHEMA_FIELDS = [
    'id', 'userId', 'name', 'type', 'value', 'currency', 'description',
    'metadata', 'isActive', 'createdAt', 'updatedAt', 'acquisitionDate',
    'notes', 'calculationModifier', 'isPassiveInvestment', 'isRestrictedAccount'
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

        const safePayload = sanitizeAssetPayload(asset);

        // Ensure ID and timestamps
        const newAsset = {
            ...safePayload,
            id: safePayload.id || crypto.randomUUID(),
            userId: user.id, // Inject Real User ID
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isActive: safePayload.isActive ?? true,
            // Ensure defaults
            currency: safePayload.currency || 'USD',
            calculationModifier: safePayload.calculationModifier ?? 1.0
        };

        return db.assets.insert(newAsset);
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

            return doc.patch(safeUpdates);
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
                console.log(`Skipping Asset ${asset.name} (Manual Override)`);
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
