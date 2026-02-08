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

// Import Prisma client at runtime using `require` so tests can run even when
// `prisma generate` hasn't been executed in the environment (some CI/dev
// containers may lack permission to regenerate client files).
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { PrismaClient } = require('@prisma/client') as { PrismaClient: new () => any };
import { EncryptionService } from './EncryptionService';

const prisma: any = new PrismaClient();

export class EncryptionAdminService {
  /**
   * Get encryption status - determines if encrypted data uses CBC or GCM format
   * Returns counts of CBC vs GCM encrypted records and undecryptable records
   */
  static async getEncryptionStatus(): Promise<{
    encryptionFormat: 'CBC' | 'GCM' | 'MIXED' | 'UNKNOWN';
    paymentRecords: { total: number; gcmEncrypted: number; cbcEncrypted: number; undecryptable: number };
    userProfiles: { total: number; gcmEncrypted: number; cbcEncrypted: number; undecryptable: number };
    migrationRequired: boolean;
  }> {
    const users = await prisma.user.findMany({ select: { id: true, profile: true } });
    const payments = await prisma.paymentRecord.findMany({ select: { id: true, recipientName: true } });

    let userGcm = 0;
    let userCbc = 0;
    let userUndecryptable = 0;
    let paymentGcm = 0;
    let paymentCbc = 0;
    let paymentUndecryptable = 0;

    // Helper to detect encryption format from encrypted string
    const detectFormat = (encrypted: any): 'GCM' | 'CBC' | 'UNKNOWN' => {
      if (!encrypted || typeof encrypted !== 'string') return 'UNKNOWN';
      
      // Parse the encrypted string format
      const raw = encrypted.trim();
      
      // Check if it's a colon-separated format
      const parts = raw.split(':');
      if (parts.length === 3) {
        // GCM format: iv:encrypted:tag (3 parts)
        return 'GCM';
      } else if (parts.length === 2) {
        // CBC format: iv:encrypted (2 parts, no auth tag)
        return 'CBC';
      }
      
      // Check if it's an object format (legacy)
      try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object' && parsed.iv && parsed.encryptedData) {
          // Legacy object format (typically CBC)
          return 'CBC';
        }
      } catch (e) {
        // Not JSON
      }
      
      return 'UNKNOWN';
    };

    // Check user profiles
    for (const u of users) {
      if (!u.profile) continue;
      
      try {
        // Try to decrypt to verify it's valid
        await EncryptionService.decryptObject(u.profile as any, process.env.ENCRYPTION_KEY || '');
        
        // If decryption succeeds, detect format
        const profileStr = typeof u.profile === 'string' ? u.profile : JSON.stringify(u.profile);
        const format = detectFormat(profileStr);
        
        if (format === 'GCM') {
          userGcm++;
        } else if (format === 'CBC') {
          userCbc++;
        } else {
          userUndecryptable++;
        }
      } catch (e) {
        userUndecryptable++;
      }
    }

    // Check payment records
    for (const p of payments) {
      if (!p.recipientName) continue;
      
      try {
        // Try to decrypt to verify it's valid
        await EncryptionService.decrypt(p.recipientName as any, process.env.ENCRYPTION_KEY || '');
        
        // If decryption succeeds, detect format
        const format = detectFormat(p.recipientName);
        
        if (format === 'GCM') {
          paymentGcm++;
        } else if (format === 'CBC') {
          paymentCbc++;
        } else {
          paymentUndecryptable++;
        }
      } catch (e) {
        paymentUndecryptable++;
      }
    }

    // Determine overall format
    const totalGcm = userGcm + paymentGcm;
    const totalCbc = userCbc + paymentCbc;
    
    let encryptionFormat: 'CBC' | 'GCM' | 'MIXED' | 'UNKNOWN';
    if (totalGcm > 0 && totalCbc === 0) {
      encryptionFormat = 'GCM';
    } else if (totalCbc > 0 && totalGcm === 0) {
      encryptionFormat = 'CBC';
    } else if (totalGcm > 0 && totalCbc > 0) {
      encryptionFormat = 'MIXED';
    } else {
      encryptionFormat = 'UNKNOWN';
    }

    const migrationRequired = totalCbc > 0 || (userUndecryptable + paymentUndecryptable) > 0;

    return {
      encryptionFormat,
      paymentRecords: {
        total: payments.length,
        gcmEncrypted: paymentGcm,
        cbcEncrypted: paymentCbc,
        undecryptable: paymentUndecryptable
      },
      userProfiles: {
        total: users.filter(u => u.profile).length,
        gcmEncrypted: userGcm,
        cbcEncrypted: userCbc,
        undecryptable: userUndecryptable
      },
      migrationRequired
    };
  }

  static async scanForIssues(): Promise<{ created: number }> {
    const users = await prisma.user.findMany({ select: { id: true, profile: true, email: true } });
    const payments = await prisma.paymentRecord.findMany({ select: { id: true, recipientName: true, amount: true } });

    let created = 0;

    for (const u of users) {
      if (!u.profile) continue;
      try {
        await EncryptionService.decryptObject(u.profile, process.env.ENCRYPTION_KEY || '');
      } catch (e) {
        await prisma.encryptionRemediation.create({
          data: {
            targetType: 'user_profile',
            targetId: u.id,
            status: 'OPEN',
            sampleData: String(u.profile).slice(0, 200),
            note: `Failed to decrypt profile for ${u.email}: ${(e as Error).message}`
          }
        });
        created++;
      }
    }

    for (const p of payments) {
      if (!p.recipientName) continue;
      try {
        await EncryptionService.decrypt(p.recipientName, process.env.ENCRYPTION_KEY || '');
      } catch (e) {
        await prisma.encryptionRemediation.create({
          data: {
            targetType: 'payment',
            targetId: p.id,
            status: 'OPEN',
            sampleData: String(p.recipientName).slice(0, 200),
            note: `Failed to decrypt payment recipient for payment ${p.id}: ${(e as Error).message}`
          }
        });
        created++;
      }
    }

    return { created };
  }

  static async listIssues(): Promise<any[]> {
    return await prisma.encryptionRemediation.findMany({ orderBy: { createdAt: 'desc' } });
  }

  static async markUnrecoverable(id: string, adminId?: string, note?: string) {
    const rem = await prisma.encryptionRemediation.update({ where: { id }, data: { status: 'UNRECOVERABLE', note: note || undefined, createdBy: adminId } });
    return rem;
  }

  static async retryWithKey(id: string, key: string, adminId?: string) {
    const rem = await prisma.encryptionRemediation.findUnique({ where: { id } });
    if (!rem) throw new Error('Remediation not found');

    // Based on targetType, attempt to decrypt with provided key and re-encrypt with current runtime key
    const currentKey = process.env.ENCRYPTION_KEY || '';
    if (!currentKey) throw new Error('ENCRYPTION_KEY not set in runtime');

    if (rem.targetType === 'user_profile') {
      const u = await prisma.user.findUnique({ where: { id: rem.targetId } });
      if (!u) throw new Error('User not found');
      try {
        const decrypted = await EncryptionService.decryptObject(u.profile as any, key);
        // re-encrypt with current runtime key
        const reenc = await EncryptionService.encryptObject(decrypted, currentKey);
        await prisma.user.update({ where: { id: u.id }, data: { profile: reenc } });
        await prisma.encryptionRemediation.update({ where: { id }, data: { status: 'RESOLVED', resolvedAt: new Date(), createdBy: adminId } });
        return { success: true };
      } catch (e) {
        throw new Error('Retry failed: ' + ((e as Error).message || 'unknown'));
      }
    }

    if (rem.targetType === 'payment') {
      const p = await prisma.paymentRecord.findUnique({ where: { id: rem.targetId } });
      if (!p) throw new Error('Payment not found');
      try {
        const decrypted = await EncryptionService.decrypt(p.recipientName as any, key);
        const reenc = await EncryptionService.encrypt(String(decrypted), currentKey);
        await prisma.paymentRecord.update({ where: { id: p.id }, data: { recipientName: reenc } });
        await prisma.encryptionRemediation.update({ where: { id }, data: { status: 'RESOLVED', resolvedAt: new Date(), createdBy: adminId } });
        return { success: true };
      } catch (e) {
        throw new Error('Retry failed: ' + ((e as Error).message || 'unknown'));
      }
    }

    throw new Error('Unsupported remediation targetType');
  }
}

export default EncryptionAdminService;
