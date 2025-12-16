import { PrismaClient } from '@prisma/client';
import { EncryptionService } from '../src/services/EncryptionService';

const prisma = new PrismaClient();

async function normalize() {
  const users = await prisma.user.findMany({ select: { id: true, profile: true, email: true } });
  let updated = 0;

  const prevRaw = process.env.ENCRYPTION_PREVIOUS_KEYS || '';
  const prevKeys = prevRaw.split(',').map(k => k.trim()).filter(Boolean);
  const currentKey = process.env.ENCRYPTION_KEY || '';

  for (const u of users) {
    const profileRaw = u.profile;
    if (!profileRaw) continue;

    // Try current key first
    try {
      await EncryptionService.decryptObject(profileRaw, currentKey);
      continue; // already decryptable
    } catch (e) {
      // try previous keys
    }

    let decrypted: any = null;
    for (let i = 0; i < prevKeys.length; i++) {
      try {
        decrypted = await EncryptionService.decryptObject(profileRaw, prevKeys[i]);
        console.log(`User ${u.id} decrypted using previous key index ${i}`);
        break;
      } catch (err) {
        // continue
      }
    }

    if (decrypted) {
      // Re-encrypt with current key
      try {
        const reenc = await EncryptionService.encryptObject(decrypted, currentKey);
        await prisma.user.update({ where: { id: u.id }, data: { profile: reenc } });
        updated++;
        console.log(`Re-encrypted profile for user ${u.id} (${u.email})`);
      } catch (err) {
        console.error(`Failed to re-encrypt profile for user ${u.id}:`, err instanceof Error ? err.message : err);
      }
    }
  }

  console.log(`Normalization complete. Updated ${updated} profiles.`);
  await prisma.$disconnect();
}

normalize().catch(err => {
  console.error('Normalization failed:', err instanceof Error ? err.message : err);
  process.exit(1);
});
