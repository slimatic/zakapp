// Import Prisma client at runtime using `require` so tests can run even when
// `prisma generate` hasn't been executed in the environment (some CI/dev
// containers may lack permission to regenerate client files).
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { PrismaClient } = require('@prisma/client') as { PrismaClient: new () => any };
import { EncryptionService } from './EncryptionService';

const prisma: any = new PrismaClient();

export class EncryptionAdminService {
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
