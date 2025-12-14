#!/usr/bin/env ts-node
import { PrismaClient } from '@prisma/client';
import { encryptionService as EncryptionService } from '../src/services/EncryptionService';

async function main() {
  const prisma = new PrismaClient();
  try {
    // Find any payment record where amount is not null
    // Prisma string filters don't support a simple NOT null predicate for strings in older schemas.
    // We'll fetch the first record without a where filter and skip those with null amount.
    const maybe = await prisma.paymentRecord.findMany({ take: 20 });
    const rec = maybe.find(r => r.amount !== null && r.amount !== undefined);
    if (!rec) {
      console.log('No payment records with encrypted amount found');
      return;
    }

    const sample = rec.amount as string;
    console.log('[diagnose] sample id=', rec.id);
    console.log('[diagnose] sample (truncated)=', sample.slice(0, 120));

    const keysRaw = (process.env.ENCRYPTION_PREVIOUS_KEYS || '').split(',').map(k => k.trim()).filter(Boolean);
    const primary = process.env.ENCRYPTION_KEY ? [process.env.ENCRYPTION_KEY] : [];
    const allKeys = primary.concat(keysRaw);

    if (allKeys.length === 0) {
      console.log('No keys available in ENCRYPTION_KEY or ENCRYPTION_PREVIOUS_KEYS');
      return;
    }

    for (let i = 0; i < allKeys.length; i++) {
      const attemptKey = allKeys[i];
      try {
        const dec = await EncryptionService.decrypt(sample, attemptKey);
        console.log(`[diagnose] Key index ${i} succeeded (indexing primary first). Decrypted sample (truncated):`, String(dec).slice(0,60));
        return;
      } catch (e) {
        console.log(`[diagnose] Key index ${i} failed: ${(e instanceof Error) ? e.message : e}`);
      }
    }

    console.log('[diagnose] No provided keys succeeded');
  } catch (err) {
    console.error('[diagnose] Fatal error', err);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(e => { console.error(e); process.exit(1); });
