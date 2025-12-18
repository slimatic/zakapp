#!/usr/bin/env ts-node
import 'dotenv/config';
import { PaymentRecordModel } from '../src/models/PaymentRecord';
import { PrismaClient } from '@prisma/client';
import { EncryptionService } from '../src/services/EncryptionService';

const prisma = new PrismaClient();

async function normalize() {
  console.log('Starting payment normalization');
  const payments = await prisma.paymentRecord.findMany({ take: 10000 });
  let updated = 0;

  // If previous keys present, split them for decryption attempts
  const prevRaw = process.env.ENCRYPTION_PREVIOUS_KEYS || '';
  const prevKeys = prevRaw.split(',').map(k => k.trim()).filter(Boolean);

  for (const p of payments) {
    const updateData: any = {};

    const tryDecryptWithFallbacks = async (raw?: string) => {
      if (!raw || typeof raw !== 'string') return null;

      // Helper to call EncryptionService.decrypt *without* allowing it to consult
      // ENCRYPTION_PREVIOUS_KEYS env var (we temporarily clear it for the call)
      const callWithoutPrev = async (key: string) => {
        const origPrev = process.env.ENCRYPTION_PREVIOUS_KEYS;
        try {
          delete process.env.ENCRYPTION_PREVIOUS_KEYS;
          const dec = await EncryptionService.decrypt(raw, key);
          return dec;
        } finally {
          if (origPrev !== undefined) process.env.ENCRYPTION_PREVIOUS_KEYS = origPrev;
        }
      };

      // First try current key only
      try {
        const dec = await callWithoutPrev(process.env.ENCRYPTION_KEY || '');
        return { decrypted: dec, usedKey: 'current' };
      } catch (e) {
        // try previous keys explicitly
        for (let i = 0; i < prevKeys.length; i++) {
          try {
            const dec = await callWithoutPrev(prevKeys[i]);
            return { decrypted: dec, usedKey: prevKeys[i] };
          } catch (e) {
            // continue
          }
        }
      }

      return null;
    };

    // Fields to normalize/decrypt
    for (const field of ['recipientName', 'amount', 'notes', 'receiptReference']) {
      const raw = (p as any)[field];
      if (!raw || typeof raw !== 'string') continue;

      // If it's already decryptable with the *current* key, skip.
      // Note: EncryptionService.decrypt() may try previous keys automatically via the
      // ENCRYPTION_PREVIOUS_KEYS env var, so we temporarily clear it to ensure we're
      // testing *only* the current key.
      const origPrev = process.env.ENCRYPTION_PREVIOUS_KEYS;
      try {
        delete process.env.ENCRYPTION_PREVIOUS_KEYS;
        await EncryptionService.decrypt(raw, process.env.ENCRYPTION_KEY || '');
        // It decrypted using the current key without needing fallbacks
        process.env.ENCRYPTION_PREVIOUS_KEYS = origPrev;
        continue;
      } catch {
        // Not decryptable with current key alone; restore prev keys and continue
        process.env.ENCRYPTION_PREVIOUS_KEYS = origPrev;
      }

      const tryAlt = await tryDecryptWithFallbacks(raw);
      if (tryAlt && tryAlt.usedKey !== 'current') {
        // Re-encrypt with current key using EncryptionService.encrypt
        try {
          const reenc = await EncryptionService.encrypt(String(tryAlt.decrypted), process.env.ENCRYPTION_KEY || '');
          updateData[field] = reenc;
          console.log(`Re-encrypted field ${field} for payment ${p.id} (was encrypted with previous key)`);
        } catch (e) {
          console.log(`Failed to re-encrypt field ${field} for payment ${p.id}:`, e instanceof Error ? e.message : e);
        }
      } else {
        // Try simple separator normalization ('.=' or '.') -> ':' where it helps detection
        if (!raw.includes(':')) {
          if (raw.includes('.=')) {
            const cand = raw.replace('.=', ':');
            if (EncryptionService.isEncrypted(cand)) {
              updateData[field] = cand;
              console.log(`Normalized separator for field ${field} on payment ${p.id}`);
            }
          } else if (raw.includes('.')) {
            const parts = raw.split('.');
            if (parts.length === 2) {
              const cand = parts.join(':');
              if (EncryptionService.isEncrypted(cand)) {
                updateData[field] = cand;
                console.log(`Normalized separator for field ${field} on payment ${p.id}`);
              }
            }
          }
        }
      }
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.paymentRecord.update({ where: { id: p.id }, data: updateData });
      updated++;
      console.log(`Normalized payment ${p.id}`);
    }
  }

  console.log(`Normalization complete. Updated ${updated} records.`);
  await prisma.$disconnect();
}

normalize().catch(err => {
  console.error('Normalization failed', err);
  process.exit(1);
});
