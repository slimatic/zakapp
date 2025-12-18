import path from 'path';
import dotenv from 'dotenv';
import { prisma } from '../src/utils/prisma';
import { AssetService } from '../src/services/AssetService';

dotenv.config({ path: path.resolve(__dirname, '../../.env.docker') });

async function main() {
  const email = 'dev.test+payments@example.com';
  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({ data: { email, firstName: 'Dev', lastName: 'Test', passwordHash: 'noop', username: 'devtest' } as any });
    console.log('Created test user', user.id);
  }

  const svc = new AssetService();

  try {
    const asset = await svc.createAsset(user.id, {
      category: 'PRIMARY_RESIDENCE',
      name: 'Test House',
      value: 12345,
      currency: 'USD',
      acquisitionDate: new Date()
    } as any);

    console.log('Asset created:', (asset as any).assetId || (asset as any).id, 'category=', asset.category);
  } catch (err: any) {
    console.error('Create failed:', err instanceof Error ? err.message : err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error('Script failed:', e instanceof Error ? e.message : e);
  process.exitCode = 1;
});
