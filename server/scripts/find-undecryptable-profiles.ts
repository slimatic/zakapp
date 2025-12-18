import { PrismaClient } from '@prisma/client';
import { EncryptionService } from '../src/services/EncryptionService';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({ select: { id: true, profile: true, email: true } });
  const failures: Array<{ id: string; email: string; sample: string; error: string }> = [];

  for (const u of users) {
    if (!u.profile) continue;
    try {
      await EncryptionService.decryptObject(u.profile, process.env.ENCRYPTION_KEY || '');
    } catch (e) {
      failures.push({ id: u.id, email: u.email, sample: String(u.profile).slice(0, 200), error: e instanceof Error ? e.message : String(e) });
    }
  }

  console.log(`Checked ${users.length} users. Failures: ${failures.length}`);
  for (const f of failures) {
    console.log('---');
    console.log('id:', f.id);
    console.log('email:', f.email);
    console.log('sample:', f.sample);
    console.log('error:', f.error);
  }

  await prisma.$disconnect();
}

main().catch(err => {
  console.error('Scan failed:', err instanceof Error ? err.message : err);
  process.exit(1);
});
