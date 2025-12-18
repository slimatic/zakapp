import path from 'path';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Load environment from .env.docker so EncryptionService picks up ENCRYPTION_KEY
dotenv.config({ path: path.resolve(__dirname, '../../.env.docker') });

// Import services from source so encryption logic is used
import { YearlySnapshotService } from '../src/services/YearlySnapshotService';
import { PaymentRecordService } from '../src/services/PaymentRecordService';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding dev data: test user, asset, nisab, and 3 encrypted payments');

  // Create or find a dev test user
  const email = 'dev.test+payments@example.com';
  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        passwordHash: '$2b$04$dev.seed.hash.for.testing.only',
        profile: JSON.stringify({ name: 'Dev Test User' }),
        isActive: true
      }
    });
    console.log('Created test user:', user.id);
  } else {
    console.log('Found existing test user:', user.id);
  }

  // Create a simple asset for the user (not encrypted in this schema)
  const asset = await prisma.asset.create({
    data: {
      userId: user.id,
      category: 'cash',
      name: 'Dev Seed Cash',
      value: 1000,
      currency: 'USD',
      acquisitionDate: new Date(),
      isActive: true
    }
  });
  console.log('Created test asset:', asset.id);

  // Ensure a nisab threshold exists (the project has prisma/seed but create a minimal one if needed)
  const existingThreshold = await prisma.nisabThreshold.findFirst({ where: { isActive: true } });
  if (!existingThreshold) {
    const nt = await prisma.nisabThreshold.create({
      data: {
        effectiveDate: new Date(),
        goldPricePerGram: 65.5,
        silverPricePerGram: 0.85,
        currency: 'USD',
        goldNisabGrams: 87.48,
        silverNisabGrams: 612.36,
        goldNisabValue: 65.5 * 87.48,
        silverNisabValue: 0.85 * 612.36,
        priceSource: 'manual_seed',
        exchangeRates: JSON.stringify({ USD: 1 }),
        isActive: true
      }
    });
    console.log('Created nisab threshold:', nt.id);
  } else {
    console.log('Nisab threshold already present:', existingThreshold.id);
  }

  // Create a Yearly Snapshot via service so fields are encrypted properly
  const snapshotService = new YearlySnapshotService();
  const snapshotData = {
    calculationDate: new Date().toISOString(),
    gregorianYear: new Date().getFullYear(),
    hijriYear: 1447,
    nisabType: 'gold',
    totalWealth: 2000,
    totalLiabilities: 200,
    zakatableWealth: 1800,
    zakatAmount: 45,
    nisabThreshold: 5729.94,
    methodologyUsed: 'Standard',
    assetBreakdown: { cash: 1000 },
    calculationDetails: { notes: 'Dev seed snapshot' }
  } as any;

  const snapshot = await snapshotService.createSnapshot(user.id, snapshotData);
  console.log('Created snapshot:', snapshot.id);

  // Create three encrypted payments using PaymentRecordService
  const paymentService = new PaymentRecordService();

  const paymentsToCreate = [
    {
      amount: 10,
      paymentDate: new Date().toISOString(),
      recipientName: 'Recipient A',
      recipientType: 'individual',
      recipientCategory: 'fakir',
      paymentMethod: 'cash',
      currency: 'USD',
      exchangeRate: 1.0,
      snapshotId: snapshot.id
    },
    {
      amount: 15.5,
      paymentDate: new Date().toISOString(),
      recipientName: 'Recipient B',
      recipientType: 'charity',
      recipientCategory: 'miskin',
      paymentMethod: 'bank_transfer',
      currency: 'USD',
      exchangeRate: 1.0,
      snapshotId: snapshot.id
    },
    {
      amount: 20,
      paymentDate: new Date().toISOString(),
      recipientName: 'Recipient C',
      recipientType: 'organization',
      recipientCategory: 'fisabilillah',
      paymentMethod: 'online',
      currency: 'USD',
      exchangeRate: 1.0,
      snapshotId: snapshot.id
    }
  ];

  const createdPayments: any[] = [];
  for (const p of paymentsToCreate) {
    try {
      const created = await paymentService.createPayment(user.id, p as any);
      console.log('Created payment (decrypted result):', { id: (created as any).id || '[no-id]', amount: (created as any).amount, recipientName: (created as any).recipientName });
      createdPayments.push(created);
    } catch (err) {
      console.error('Failed to create payment via service:', err instanceof Error ? err.message : err);
    }
  }

  // Verify by reading payments by snapshot via service
  try {
    const payments = await paymentService.getPaymentsBySnapshot(snapshot.id, user.id);
    console.log('Verified payments (decrypted):');
    payments.forEach((pp: any) => console.log({ id: pp.id, amount: pp.amount, recipientName: pp.recipientName }));
  } catch (err) {
    console.error('Failed to list/decrypt payments:', err instanceof Error ? err.message : err);
  }

  console.log('Seeding complete');
}

main()
  .catch((e) => {
    console.error('Seed script failed:', e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await prisma.$disconnect();
    } catch (e) {
      // ignore
    }
  });
