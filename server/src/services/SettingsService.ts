/**
 * Copyright (c) 2024-2026 ZakApp Contributors
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

import { PrismaClient } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { EncryptionService } from './EncryptionService';
import { Logger } from '../utils/logger';

const logger = new Logger('SettingsService');


export const SETTINGS_ID = 'global';

export interface PublicSystemSettings {
    smtpHost: string | null;
    smtpPort: number | null;
    smtpSecure: boolean;
    smtpUser: string | null;
    smtpFromEmail: string | null;
    smtpFromName: string | null;
    emailProvider: string;
    requireEmailVerification: boolean;
    allowRegistration: boolean;
    resendApiKeyMasked: boolean; // True if a key is set
    smtpPassMasked: boolean;     // True if a password is set
}

export class SettingsService {
    /**
     * Get system settings with sensitive data masked
     */
    static async getSettings(): Promise<PublicSystemSettings> {
        const settings = await prisma.systemSettings.findUnique({
            where: { id: SETTINGS_ID }
        });

        if (!settings) {
            return {
                smtpHost: null,
                smtpPort: null,
                smtpSecure: true,
                smtpUser: null,
                smtpFromEmail: null,
                smtpFromName: null,
                emailProvider: 'smtp',
                requireEmailVerification: false,
                allowRegistration: true,
                resendApiKeyMasked: false,
                smtpPassMasked: false
            };
        }

        return {
            smtpHost: settings.smtpHost,
            smtpPort: settings.smtpPort,
            smtpSecure: settings.smtpSecure,
            smtpUser: settings.smtpUser,
            smtpFromEmail: settings.smtpFromEmail,
            smtpFromName: settings.smtpFromName,
            emailProvider: settings.emailProvider,
            requireEmailVerification: settings.requireEmailVerification,
            allowRegistration: settings.allowRegistration,
            resendApiKeyMasked: !!settings.resendApiKey,
            smtpPassMasked: !!settings.smtpPass
        };
    }

    /**
     * Get full decrypted settings for internal use (EmailService)
     */
    static async getDecryptedSettings() {
        const settings = await prisma.systemSettings.findUnique({
            where: { id: SETTINGS_ID }
        });

        if (!settings) return null;

        let smtpPass = settings.smtpPass;
        if (smtpPass && process.env.APP_SECRET) {
            try {
                smtpPass = await EncryptionService.decrypt(smtpPass, process.env.APP_SECRET);
            } catch (error) {
                logger.error('Failed to decrypt SMTP password:', error);

                smtpPass = null;
            }
        }

        let resendApiKey = settings.resendApiKey;
        if (resendApiKey && process.env.APP_SECRET) {
            try {
                resendApiKey = await EncryptionService.decrypt(resendApiKey, process.env.APP_SECRET);
            } catch (error) {
                logger.error('Failed to decrypt Resend API Key:', error);

                resendApiKey = null;
            }
        }

        return {
            ...settings,
            smtpPass,
            resendApiKey
        };
    }

    /**
     * Update system settings
     */
    static async updateSettings(data: {
        smtpHost?: string;
        smtpPort?: number;
        smtpSecure?: boolean;
        smtpUser?: string;
        smtpPass?: string; // Plaintext, will be encrypted
        smtpFromEmail?: string;
        smtpFromName?: string;
        emailProvider?: string;
        resendApiKey?: string; // Plaintext, will be encrypted
        requireEmailVerification?: boolean;
        allowRegistration?: boolean;
    }) {
        const updateData: any = { ...data };

        // Encrypt sensitive fields if they are being updated
        if (data.smtpPass && process.env.APP_SECRET) {
            updateData.smtpPass = await EncryptionService.encrypt(data.smtpPass, process.env.APP_SECRET);
        }

        if (data.resendApiKey && process.env.APP_SECRET) {
            updateData.resendApiKey = await EncryptionService.encrypt(data.resendApiKey, process.env.APP_SECRET);
        }

        // Handle partial updates vs upsert
        // Since we want to support both partial (PATCH) and full (PUT), 
        // but for the UI usually it's a full form save. 
        // However, masking fields means the UI might send `null` or `undefined` for passwords 
        // when they shouldn't be changed.


        // Check if we need to remove fields that shouldn't be updated (undefined)
        Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

        // Remove masked fields that act as UI indicators only
        delete updateData.resendApiKeyMasked;
        delete updateData.smtpPassMasked;

        return await prisma.systemSettings.upsert({
            where: { id: SETTINGS_ID },
            update: updateData,
            create: {
                id: SETTINGS_ID,
                ...updateData
            }
        });
    }
}
