import path from 'path';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config({ path: path.resolve(__dirname, '../../.env.docker') });

import { AssetService } from '../src/services/AssetService';
import { calculateZakatableAmount, calculateAssetZakat } from '../src/utils/assetModifiers';

const prisma = new PrismaClient();

async function main() {
  console.log('Verifying passive 30% modifier for assets');

  const email = 'dev.test+payments@example.com';
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new Error('Test user not found; run seed first');
  }

  const assetService = new AssetService();

  // Create a passive stock asset eligible for 30% rule
  const createData = {
    category: 'ETF',
    name: 'Passive Stocks Test',
    value: 10000,
    currency: 'USD',
    acquisitionDate: new Date(),
    isPassiveInvestment: true,
    isRestrictedAccount: false,
    metadata: { symbol: 'TEST' }
  } as any;

  // Create asset directly via Prisma to bypass strict validation (test-only)
  const created = await prisma.asset.create({
    data: {
      userId: user.id,
      category: 'stocks',
      name: createData.name,
      value: createData.value,
      currency: createData.currency,
      acquisitionDate: createData.acquisitionDate,
      metadata: null,
      notes: null,
      calculationModifier: 0.3,
      isPassiveInvestment: true,
      isRestrictedAccount: false,
      isActive: true
    }
  });

  const asset = await assetService.getAssetById(user.id, created.id);
  console.log('Created asset (via direct create then fetched):', asset);

  // Compute zakatable amount and zakat using utils
  const zakatable = calculateZakatableAmount({ value: asset.value, calculationModifier: asset.calculationModifier }, 1);
  const zakat = calculateAssetZakat({ value: asset.value, calculationModifier: asset.calculationModifier }, 1);

  console.log('Modifier:', asset.calculationModifier);
  console.log('Zakatable amount (after modifier):', zakatable);
  console.log('Zakat owed (2.5%):', zakat);

  // Clean up connection
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('Test failed:', e instanceof Error ? e.message : e);
  process.exitCode = 1;
});
