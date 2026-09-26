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
import { switchMap } from 'rxjs/operators';
import { cryptoService } from '../services/CryptoService';

/**
 * Fields the zero-knowledge plugin encrypts on write, so they must be decrypted on
 * read like every other repository does.
 *
 * This repo was the only one that never decrypted. The consequence was not cosmetic:
 * `settings` is part of the backup, so an export carried `ZK1:...` ciphertext for
 * these instead of readable values. A backup has to be readable WITHOUT the vault key
 * or it is not a backup - that is the whole point of asking users to export before an
 * upgrade. Decrypting here also means the ciphertext never reaches the export scan.
 */
const ENCRYPTED_SETTINGS_FIELDS = ['profileName', 'firstName', 'lastName', 'email'];

export interface UserSettings {
    id: string; // userId
    profileName?: string;
    email?: string;
    preferredCalendar: string;
    preferredMethodology: string;
    baseCurrency: string;
    language: string;
    theme: string;
    lastLoginAt?: string;
    isSetupCompleted: boolean;
    securityProfile?: {
        salt: string;
        verifier: string;
    };
    createdAt: string;
    updatedAt: string;
}

export function useUserSettingsRepository() {
    const db = useDb();
    const { user } = useAuth();
    const [settings, setSettings] = useState<UserSettings | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!db || !user || !user.id) return;

        const sub = db.user_settings.findOne(user.id).$
            .pipe(
                switchMap(async (doc: any) => {
                    if (!doc) return null;
                    const data = { ...doc.toJSON() };

                    // Decrypt the encrypted fields, mirroring the other repositories.
                    // A failure here must not blank the value silently: the user would
                    // see an empty profile and never learn why.
                    for (const field of ENCRYPTED_SETTINGS_FIELDS) {
                        const value = data[field];
                        if (typeof value !== 'string' || !cryptoService.isEncrypted(value)) continue;
                        try {
                            const packed = cryptoService.unpackEncrypted(value);
                            if (packed) {
                                data[field] = await cryptoService.decrypt(packed.ciphertext, packed.iv);
                            }
                        } catch (e) {
                            console.warn(`[useUserSettingsRepository] could not decrypt ${field}`, e);
                            // Leave the value as-is rather than replacing it with ''.
                            // The backup export scan will then refuse the file and say
                            // why, instead of quietly exporting a blank profile.
                        }
                    }

                    return data as UserSettings;
                })
            )
            .subscribe({
                next: (data: UserSettings | null) => {
                    setSettings(data);
                    setIsLoading(false);
                },
                error: (err: any) => {
                    setError(err);
                    setIsLoading(false);
                }
            });

        return () => sub.unsubscribe();
    }, [db, user]);

    const updateSettings = async (updates: Partial<UserSettings>) => {
        if (!db || !user || !user.id) throw new Error('Database not initialized or user not authenticated');

        const doc = await db.user_settings.findOne(user.id).exec();
        if (doc) {
            return doc.patch({
                ...updates,
                updatedAt: new Date().toISOString()
            });
        } else {
            // Create if doesn't exist
            return db.user_settings.insert({
                ...updates,
                id: user.id,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                preferredCalendar: updates.preferredCalendar || 'gregorian',
                preferredMethodology: updates.preferredMethodology || 'standard',
                baseCurrency: updates.baseCurrency || 'USD',
                language: updates.language || 'en',
                theme: updates.theme || 'system',
                isSetupCompleted: updates.isSetupCompleted ?? false
            });
        }
    };

    const saveBulkSettings = async (settingsList: UserSettings[]) => {
        if (!db) throw new Error('Database not initialized');
        // For import, we might want to insert multiple settings if it's a multi-user backup, 
        // though typically it's just the current user.
        return db.user_settings.bulkInsert(settingsList);
    };

    return { settings, isLoading, error, updateSettings, saveBulkSettings };
}
