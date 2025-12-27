import { useState, useEffect } from 'react';
import { useDb } from '../db';
import { useAuth } from '../contexts/AuthContext';
import { map } from 'rxjs/operators';

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
                map((doc: any) => doc ? doc.toJSON() : null)
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
