import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function inspect(ids: string[]) {
  for (const id of ids) {
    const p = await prisma.paymentRecord.findUnique({ where: { id } });
    if (!p) {
      console.log(`Payment ${id} not found`);
      continue;
    }

    console.log('---');
    console.log('id:', p.id);
    console.log('amount sample:', String(p.amount).slice(0, 120));
    console.log('recipientName sample:', String(p.recipientName).slice(0, 200));
    console.log('notes sample:', String(p.notes || '').slice(0, 200));
    console.log('receiptReference sample:', String(p.receiptReference || '').slice(0, 200));
  }
}

(async () => {
  const ids = process.argv.slice(2);
  if (ids.length === 0) {
    console.error('Usage: ts-node inspect-payments.ts <id> [id2 ...]');
    process.exit(1);
  }

  await inspect(ids);
  await prisma.$disconnect();
})();
