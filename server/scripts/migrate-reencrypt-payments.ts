#!/usr/bin/env ts-node
import { PrismaClient } from '@prisma/client';
import { encryptionService as EncryptionService } from '../src/services/EncryptionService';

/**
 * Migration script: re-encrypt payment record fields using the current ENCRYPTION_KEY.
 * - Attempts to decrypt each encrypted field using the current key + ENCRYPTION_PREVIOUS_KEYS (handled by EncryptionService.decrypt when key provided).
 * - If decryption succeeds for a field, re-encrypts with the current key and updates the DB record.
 * - Logs successes/failures and prints a summary at the end.
 */

async function main() {
  const prisma = new PrismaClient();
  try {
    console.log('[migrate-payments] Starting payment re-encryption migration');
    const payments = await prisma.paymentRecord.findMany();
    console.log(`[migrate-payments] Found ${payments.length} payment records`);

    const currentKey = process.env.ENCRYPTION_KEY;
    if (!currentKey) {
      console.error('[migrate-payments] ENCRYPTION_KEY not set in environment. Aborting.');
      process.exit(1);
    }

    let migrated = 0;
    let partiallyMigrated = 0;
    let failed = 0;

    for (const p of payments) {
      const updates: any = {};
      let anyUpdated = false;

      try {
        // Attempt amount
        if (p.amount) {
          try {
            const decryptedAmount = await EncryptionService.decrypt(p.amount as string, currentKey);
            const reEncrypted = await EncryptionService.encrypt(String(decryptedAmount), currentKey);
            updates.amount = reEncrypted;
            anyUpdated = true;
          } catch (e) {
            console.warn('[migrate-payments] amount decryption failed for', p.id);
          }
        }

        if (p.recipientName) {
          try {
            const dec = await EncryptionService.decrypt(p.recipientName as string, currentKey);
            const enc = await EncryptionService.encrypt(String(dec), currentKey);
            updates.recipientName = enc;
            anyUpdated = true;
          } catch (e) {
            console.warn('[migrate-payments] recipientName decryption failed for', p.id);
          }
        }

        if (p.notes) {
          try {
            const dec = await EncryptionService.decrypt(p.notes as string, currentKey);
            const enc = await EncryptionService.encrypt(String(dec), currentKey);
            updates.notes = enc;
            anyUpdated = true;
          } catch (e) {
            console.warn('[migrate-payments] notes decryption failed for', p.id);
          }
        }

        if (p.receiptReference) {
          try {
            const dec = await EncryptionService.decrypt(p.receiptReference as string, currentKey);
            const enc = await EncryptionService.encrypt(String(dec), currentKey);
            updates.receiptReference = enc;
            anyUpdated = true;
          } catch (e) {
            console.warn('[migrate-payments] receiptReference decryption failed for', p.id);
          }
        }

        if (anyUpdated) {
          await prisma.paymentRecord.update({ where: { id: p.id }, data: updates });
          migrated++;
          console.log('[migrate-payments] Migrated record', p.id);
        } else {
          failed++;
          console.warn('[migrate-payments] No fields migrated for', p.id);
        }
      } catch (outerErr) {
        failed++;
        console.error('[migrate-payments] Unexpected error migrating', p.id, outerErr instanceof Error ? outerErr.message : outerErr);
      }
    }

    console.log('[migrate-payments] Migration complete');
    console.log(`[migrate-payments] migrated=${migrated}, failed=${failed}`);
  } catch (err) {
    console.error('[migrate-payments] Fatal error', err instanceof Error ? err.message : err);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});

