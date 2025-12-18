#!/usr/bin/env ts-node
/**
 * Script: normalize-profiles.ts
 * Scans all users and identifies profile fields that are not encrypted JSON
 * Optionally re-encrypts them with the current ENCRYPTION_KEY when --fix is provided
 * Usage: npx ts-node scripts/normalize-profiles.ts [--fix]
 */
import { getPrismaClient } from '../src/utils/prisma';
import { EncryptionService } from '../src/services/EncryptionService';

async function main() {
  const fix = process.argv.includes('--fix');
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    console.error('ENCRYPTION_KEY env var is required to run this script');
    process.exit(2);
  }

  const prisma = getPrismaClient();
  const users = await prisma.user.findMany({ select: { id: true, email: true, profile: true } });

  const problematic: Array<{ id: string; email: string; sample: string }> = [];

  for (const u of users) {
    const profile = u.profile;
    if (!profile) continue;

    try {
      const dec = await EncryptionService.decryptObject(profile as any, key);
      if (typeof dec === 'string') {
        // decrypted to string - might be plain JSON text or legacy plaintext
        let parsed = null;
        try {
          parsed = JSON.parse(dec);
        } catch (_e) {
          // not JSON
        }

        if (!parsed) {
          problematic.push({ id: u.id, email: u.email, sample: String(dec).slice(0, 200) });
          if (fix) {
            // Wrap string into an object and re-encrypt
            const normalized = { raw: dec };
            const encrypted = await EncryptionService.encryptObject(normalized, key);
            await prisma.user.update({ where: { id: u.id }, data: { profile: encrypted } });
            console.log(`[fix] Updated profile for user ${u.id} <${u.email}>`);
          }
        }
      }
    } catch (err) {
      problematic.push({ id: u.id, email: u.email, sample: String(profile).slice(0, 200) });
      if (fix) {
        try {
          const normalized = { raw: profile };
          const encrypted = await EncryptionService.encryptObject(normalized, key);
          await prisma.user.update({ where: { id: u.id }, data: { profile: encrypted } });
          console.log(`[fix] Re-encrypted profile for user ${u.id} <${u.email}> (previously unparseable)`);
        } catch (e) {
          console.error(`[fix] Failed to re-encrypt profile for user ${u.id}: ${e instanceof Error ? e.message : e}`);
        }
      }
    }
  }

  console.log('Scan complete. Problematic profiles:', problematic.length);
  for (const p of problematic) console.log(` - ${p.id} <${p.email}> sample=${p.sample}`);
  if (!fix) console.log('Run with --fix to attempt automatic normalization (may produce data changes).');
  process.exit(0);
}

main().catch(err => {
  console.error('Script failed:', err instanceof Error ? err.message : err);
  process.exit(1);
});
