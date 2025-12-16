import { PrismaClient } from '@prisma/client';
import { EncryptionService } from '../src/services/EncryptionService';

const prisma = new PrismaClient();

async function main() {
  const all = await prisma.paymentRecord.findMany({ select: { id: true, recipientName: true } });
  const failures: Array<{ id: string; sample: string; isEncrypted: boolean; decryptError?: string }> = [];

  for (const p of all) {
    const val = p.recipientName as string | null;
    if (!val) continue;

    // Quick check
    const looksEncrypted = EncryptionService.isEncrypted(val);
    if (!looksEncrypted) {
      // Try to decrypt anyway in case it's JSON or legacy
      try {
        await EncryptionService.decrypt(val, process.env.ENCRYPTION_KEY || '');
      } catch (e) {
        failures.push({ id: p.id, sample: String(val).slice(0, 200), isEncrypted: false, decryptError: e instanceof Error ? e.message : String(e) });
      }
      continue;
    }

    // Looks encrypted; try to decrypt
    try {
      await EncryptionService.decrypt(val, process.env.ENCRYPTION_KEY || '');
    } catch (e) {
      failures.push({ id: p.id, sample: String(val).slice(0, 200), isEncrypted: true, decryptError: e instanceof Error ? e.message : String(e) });
    }
  }

  console.log(`Checked ${all.length} payments. Failures: ${failures.length}`);
  for (const f of failures.slice(0, 200)) {
    console.log('---');
    console.log('id:', f.id);
    console.log('isEncrypted detection:', f.isEncrypted);
    console.log('sample:', f.sample);
    console.log('error:', f.decryptError);
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Scan failed:', err instanceof Error ? err.message : err);
  process.exit(1);
});
