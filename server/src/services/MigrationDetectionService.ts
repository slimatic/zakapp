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

import { prisma } from '../utils/prisma';
import { EncryptionService } from './EncryptionService';
import { getEncryptionKey } from '../config/security';

export interface UserEncryptionStatus {
  needsMigration: boolean;
  totalPayments: number;
  zkPayments: number;
  serverPayments: number;
}

export interface MigrationPaymentData {
  id: string;
  recipient?: string;
  notes?: string;
  amount: number;
  paymentDate: string;
}

/**
 * MigrationDetectionService
 * 
 * Handles detection and preparation of user data for migration from
 * server-side encryption to zero-knowledge (client-side) encryption.
 */
export class MigrationDetectionService {
  /**
   * Get user's encryption status
   * @param userId - User ID
   * @returns Encryption status with counts
   */
  static async getUserEncryptionStatus(userId: string): Promise<UserEncryptionStatus> {
    const payments = await prisma.zakatPayment.findMany({
      where: { userId },
      select: { verificationDetails: true },
    });

    let zkCount = 0;
    let serverCount = 0;

    for (const payment of payments) {
      const details = JSON.parse(payment.verificationDetails || '{}');
      if (details.encryptionFormat === 'ZK1') {
        zkCount++;
      } else {
        serverCount++;
      }
    }

    return {
      needsMigration: serverCount > 0,
      totalPayments: payments.length,
      zkPayments: zkCount,
      serverPayments: serverCount,
    };
  }

  /**
   * Prepare legacy data for client re-encryption
   * Server decrypts with its key ONE LAST TIME
   * @param userId - User ID
   * @returns Decrypted payment data for client re-encryption
   */
  static async prepareMigrationData(userId: string): Promise<{ payments: MigrationPaymentData[] }> {
    const payments = await prisma.zakatPayment.findMany({
      where: { userId },
    });

    const paymentsToReencrypt: MigrationPaymentData[] = [];
    const ENCRYPTION_KEY = getEncryptionKey();

    for (const payment of payments) {
      const details = JSON.parse(payment.verificationDetails || '{}');

      // Only include legacy (non-ZK1) payments
      if (details.encryptionFormat !== 'ZK1') {
        // Decrypt recipient with server key (ONE LAST TIME)
        let decryptedRecipient: string | undefined;
        if (details.recipient) {
          try {
            decryptedRecipient = await EncryptionService.decrypt(details.recipient, ENCRYPTION_KEY);
          } catch (error) {
            // If decryption fails, leave undefined (payment may not have had recipient)
            decryptedRecipient = undefined;
          }
        }

        // Decrypt notes with server key
        let decryptedNotes: string | undefined;
        if (payment.notes) {
          try {
            decryptedNotes = await EncryptionService.decrypt(payment.notes, ENCRYPTION_KEY);
          } catch (error) {
            // If decryption fails, leave undefined
            decryptedNotes = undefined;
          }
        }

        paymentsToReencrypt.push({
          id: payment.id,
          recipient: decryptedRecipient,
          notes: decryptedNotes,
          amount: payment.amount,
          paymentDate: payment.paymentDate.toISOString().split('T')[0],
        });
      }
    }

    return { payments: paymentsToReencrypt };
  }

  /**
   * Mark user as fully migrated
   * @param userId - User ID
   */
  static async markUserMigrated(userId: string): Promise<void> {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Parse existing settings
    let settings: any = {};
    if (user.settings) {
      try {
        // Settings are encrypted, so decrypt first
        const ENCRYPTION_KEY = getEncryptionKey();
        const decryptedSettings = await EncryptionService.decrypt(user.settings, ENCRYPTION_KEY);
        settings = JSON.parse(decryptedSettings);
      } catch {
        // If parsing/decryption fails, start with empty object
        settings = {};
      }
    }

    // Update with migration info
    settings.encryptionMigrated = true;
    settings.migratedAt = new Date().toISOString();

    // Encrypt and save back to database
    const ENCRYPTION_KEY = getEncryptionKey();
    const encryptedSettings = await EncryptionService.encrypt(JSON.stringify(settings), ENCRYPTION_KEY);

    await prisma.user.update({
      where: { id: userId },
      data: {
        settings: encryptedSettings,
      },
    });
  }
}
