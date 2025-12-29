import path from 'path';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config({ path: path.resolve(__dirname, '../../.env.docker') });

import { AssetService } from '../src/services/AssetService';

const prisma = new PrismaClient();

async function main() {
  const email = 'dev.test+payments@example.com';
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error('Test user not found');

  // Get one asset for the user
  const assets = await prisma.asset.findMany({ where: { userId: user.id, isActive: true }, take: 1 });
  if (!assets || assets.length === 0) throw new Error('No assets found for test user');

  const asset = assets[0];
  console.log('Before update acquisitionDate:', asset.acquisitionDate.toISOString());

  const newDate = new Date(2020, 0, 15); // 2020-01-15
  const assetService = new AssetService();
  const updated = await assetService.updateAsset(user.id, asset.id, { acquisitionDate: newDate as any });

  console.log('After update (service returned):', updated);

  const reloaded = await prisma.asset.findUnique({ where: { id: asset.id } });
  console.log('Reloaded from DB acquisitionDate:', reloaded?.acquisitionDate?.toISOString());

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('Test failed:', e instanceof Error ? e.message : e);
  process.exitCode = 1;
});
