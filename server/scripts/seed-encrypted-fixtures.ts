import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';
import { YearlySnapshotService } from '../src/services/YearlySnapshotService';
import { PaymentRecordService } from '../src/services/PaymentRecordService';

// Load defaults from .env.docker if present (so other env values are populated)
dotenv.config({ path: path.resolve(__dirname, '../../.env.docker') });

const prisma = new PrismaClient();

async function main() {
  // Accept key from SEED_PREV_KEY or environment ENCRYPTION_KEY (command-line override recommended)
  const seedKey = process.env.SEED_PREV_KEY || process.env.ENCRYPTION_KEY;
  if (!seedKey) {
    console.error('Provide a key via SEED_PREV_KEY or ENCRYPTION_KEY environment variable');
    process.exit(1);
  }

  // Temporarily set runtime ENCRYPTION_KEY to seedKey for services that read it at construction-time
  const origKey = process.env.ENCRYPTION_KEY;
  process.env.ENCRYPTION_KEY = seedKey;

  try {
    // Create or find a dev test user (encrypted profile will use seedKey)
    const email = 'dev.seed+encrypted@example.com';
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          passwordHash: '$2b$04$dev.seed.hash.for.testing.only',
          profile: JSON.stringify({ name: 'Dev Seed User (prev-key)' }),
          isActive: true
        }
      });
      console.log('Created test user:', user.id);
    } else {
      console.log('Found existing test user:', user.id);
    }

    // Create a snapshot using the service (ensures encryption via ENCRYPTION_KEY)
    const snapshotSvc = new YearlySnapshotService();
    const snapshot = await snapshotSvc.createSnapshot(user.id, {
      calculationDate: new Date().toISOString(),
      gregorianYear: new Date().getFullYear(),
      hijriYear: 1447,
      nisabType: 'gold',
      totalWealth: 2000,
      totalLiabilities: 100,
      zakatableWealth: 1900,
      zakatAmount: 47.5,
      nisabThreshold: 5729.94,
      methodologyUsed: 'Standard',
      assetBreakdown: { cash: 2000 },
      calculationDetails: { notes: 'Seed with prev key' }
    } as any);
    console.log('Created snapshot:', snapshot.id);

    // Create a single payment using PaymentRecordService
    const paymentSvc = new PaymentRecordService();
    const payment = await paymentSvc.createPayment(user.id, {
      amount: 25.0,
      paymentDate: new Date().toISOString(),
      recipientName: 'Encrypted Recipient (prev-key)',
      recipientType: 'individual',
      recipientCategory: 'fakir',
      paymentMethod: 'bank_transfer',
      currency: 'USD',
      exchangeRate: 1.0,
      snapshotId: snapshot.id
    } as any);

    console.log('Created payment:', payment.id);
    console.log('Payment recipient (stored encrypted):', (payment as any).recipientName);

    console.log('\nSeeding complete.');
    console.log('To migrate this data to your current key:');
    console.log("1) Set your runtime to the current key and also set ENCRYPTION_PREVIOUS_KEYS to the seed key:\n   ENCRYPTION_KEY='<CURRENT_KEY>' ENCRYPTION_PREVIOUS_KEYS='<SEED_PREV_KEY>' npx ts-node --transpile-only ./scripts/normalize-payments.ts");
  } finally {
    // Restore original key in the process environment
    if (origKey !== undefined) process.env.ENCRYPTION_KEY = origKey;
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('Seed (encrypted fixtures) failed:', err instanceof Error ? err.message : err);
  process.exit(1);
});
