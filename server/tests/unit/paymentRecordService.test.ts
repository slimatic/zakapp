/**
 * PaymentRecordService — money correctness and encryption round trips.
 *
 * Coverage was 1.4% (144 statements) on a service whose job is storing and
 * totalling zakat payments. Two properties matter most:
 *
 *   1. A payment amount survives a write/read round trip EXACTLY. Money that
 *      changes on the way to the database is the worst defect here.
 *   2. Totals and per-category statistics are arithmetically correct, including
 *      the degenerate cases (no payments, all zero) which is where a naive
 *      percentage calculation divides by zero.
 *
 * The model layer is mocked so a failure points at this service, not at Prisma.
 * Everything else — including the REAL EncryptionService — is exercised for real,
 * because the encryption round trip is precisely what is under test.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// The model is the only thing replaced. Encryption is real.
const store: { rows: any[] } = { rows: [] };

vi.mock('../../src/models/PaymentRecord', () => {
  return {
    PaymentRecordModel: {
      create: vi.fn(async (userId: string, data: any) => {
        const row = {
          id: `pay-${store.rows.length + 1}`,
          userId,
          ...data,
          createdAt: new Date().toISOString(),
        };
        store.rows.push(row);
        return row;
      }),
      findById: vi.fn(async (id: string, userId: string) => {
        return store.rows.find((r) => r.id === id && r.userId === userId) ?? null;
      }),
      findByUser: vi.fn(async (userId: string, params: any) => {
        let rows = store.rows.filter((r) => r.userId === userId);
        if (params?.snapshotId) rows = rows.filter((r) => r.snapshotId === params.snapshotId);
        if (params?.recipientCategory)
          rows = rows.filter((r) => r.recipientCategory === params.recipientCategory);
        if (params?.status) rows = rows.filter((r) => r.status === params.status);
        const total = rows.length;
        const page = params?.page ?? 1;
        const limit = params?.limit ?? (rows.length || 1);
        const start = (page - 1) * limit;
        return { data: rows.slice(start, start + limit), total };
      }),
      findBySnapshot: vi.fn(async (snapshotId: string, userId: string) => {
        return store.rows.filter((r) => r.snapshotId === snapshotId && r.userId === userId);
      }),
      update: vi.fn(async (id: string, userId: string, data: any) => {
        const row = store.rows.find((r) => r.id === id && r.userId === userId);
        if (!row) throw new Error('not found');
        Object.assign(row, data);
        return row;
      }),
      delete: vi.fn(async (id: string, userId: string) => {
        const i = store.rows.findIndex((r) => r.id === id && r.userId === userId);
        if (i >= 0) store.rows.splice(i, 1);
      }),
    },
  };
});

process.env.ENCRYPTION_KEY = 'test-encryption-key-32-chars-ok!';

const { PaymentRecordService } = await import('../../src/services/PaymentRecordService');
const { EncryptionService } = await import('../../src/services/EncryptionService');

const KEY = 'test-encryption-key-32-chars-ok!';

function makePayment(over: Record<string, unknown> = {}) {
  return {
    snapshotId: 'snap-1',
    amount: 250.5,
    currency: 'USD',
    recipientCategory: 'fakir',
    recipientName: 'Someone in need',
    paymentDate: new Date('2026-09-01'),
    status: 'completed',
    notes: 'zakat payment',
    ...over,
  } as never;
}

beforeEach(() => {
  store.rows.length = 0;
});

describe('money survives the round trip exactly', () => {
  it('returns the amount that was written, unrounded', async () => {
    const svc = new PaymentRecordService();
    const created = await svc.createPayment('u1', makePayment({ amount: 250.5 }));
    expect(created.amount).toBe(250.5);
  });

  it.each([
    ['a whole number', 100],
    ['two decimals', 1234.56],
    ['one decimal', 0.5],
    ['a small fraction', 0.01],
    ['a large amount', 9_876_543.21],
    ['zero', 0],
    ['a repeating decimal', 1234.56 / 3],
    ['a very small value', 0.001],
  ])('round-trips %s', async (_label, amount) => {
    const svc = new PaymentRecordService();
    const created = await svc.createPayment('u1', makePayment({ amount }));
    expect(created.amount).toBeCloseTo(amount as number, 9);
  });

  it('stores the amount ENCRYPTED, not as plaintext', async () => {
    const svc = new PaymentRecordService();
    await svc.createPayment('u1', makePayment({ amount: 9876.54 }));
    const raw = store.rows[0];

    // The stored value must not equal the plaintext number.
    expect(String(raw.amount)).not.toBe('9876.54');
    // And it must be recognisable as ciphertext.
    expect(EncryptionService.isEncrypted(String(raw.amount))).toBe(true);
  });

  it('reads back a payment created in the same session', async () => {
    const svc = new PaymentRecordService();
    const created = await svc.createPayment('u1', makePayment({ amount: 777.77 }));
    const read = await svc.getPayment(created.id, 'u1');
    expect(read?.amount).toBeCloseTo(777.77, 9);
  });

  it('does not return another user\'s payment', async () => {
    const svc = new PaymentRecordService();
    const created = await svc.createPayment('u1', makePayment());
    expect(await svc.getPayment(created.id, 'u2')).toBeNull();
  });
});

describe('sensitive text fields survive the round trip', () => {
  it('decrypts the recipient name', async () => {
    const svc = new PaymentRecordService();
    const created = await svc.createPayment(
      'u1',
      makePayment({ recipientName: 'Abdullah ibn Ahmad' })
    );
    expect(created.recipientName).toBe('Abdullah ibn Ahmad');
  });

  it('decrypts unicode names', async () => {
    const svc = new PaymentRecordService();
    const created = await svc.createPayment('u1', makePayment({ recipientName: 'زكاة 🕌' }));
    expect(created.recipientName).toBe('زكاة 🕌');
  });

  it('stores the recipient name encrypted', async () => {
    const svc = new PaymentRecordService();
    await svc.createPayment('u1', makePayment({ recipientName: 'Plain Name' }));
    expect(store.rows[0].recipientName).not.toBe('Plain Name');
  });

  it('handles a null optional field without throwing', async () => {
    const svc = new PaymentRecordService();
    const created = await svc.createPayment('u1', makePayment({ notes: null, receiptReference: null }));
    expect(created).toBeDefined();
  });
});

describe('totals are arithmetically correct', () => {
  it('sums payments for a snapshot', async () => {
    const svc = new PaymentRecordService();
    for (const amount of [100, 250.5, 49.5]) {
      await svc.createPayment('u1', makePayment({ amount, snapshotId: 'snap-1' }));
    }
    // 100 + 250.5 + 49.5 = 400 exactly
    expect(await svc.getTotalPaid('snap-1', 'u1')).toBeCloseTo(400, 9);
  });

  it('returns 0 for a snapshot with no payments (not NaN)', async () => {
    const svc = new PaymentRecordService();
    const total = await svc.getTotalPaid('snap-empty', 'u1');
    expect(total).toBe(0);
    expect(Number.isNaN(total)).toBe(false);
  });

  it('does not include another snapshot in the total', async () => {
    const svc = new PaymentRecordService();
    await svc.createPayment('u1', makePayment({ amount: 1000, snapshotId: 'snap-1' }));
    await svc.createPayment('u1', makePayment({ amount: 5000, snapshotId: 'snap-2' }));
    expect(await svc.getTotalPaid('snap-1', 'u1')).toBeCloseTo(1000, 9);
  });

  it('does not include another user in the total', async () => {
    const svc = new PaymentRecordService();
    await svc.createPayment('u1', makePayment({ amount: 1000 }));
    await svc.createPayment('u2', makePayment({ amount: 9999 }));
    expect(await svc.getTotalPaid('snap-1', 'u1')).toBeCloseTo(1000, 9);
  });
});

describe('per-category statistics', () => {
  it('counts and sums each category correctly', async () => {
    const svc = new PaymentRecordService();
    await svc.createPayment('u1', makePayment({ amount: 100, recipientCategory: 'fakir' }));
    await svc.createPayment('u1', makePayment({ amount: 300, recipientCategory: 'fakir' }));
    await svc.createPayment('u1', makePayment({ amount: 600, recipientCategory: 'gharimin' }));

    const stats = await svc.getStatisticsByCategory('snap-1', 'u1');
    const fakir = stats.find((s) => s.category === 'fakir')!;
    const gharimin = stats.find((s) => s.category === 'gharimin')!;

    expect(fakir.count).toBe(2);
    expect(fakir.totalAmount).toBeCloseTo(400, 9);
    expect(gharimin.count).toBe(1);
    expect(gharimin.totalAmount).toBeCloseTo(600, 9);
  });

  it('percentages sum to 100 and match the amounts', async () => {
    const svc = new PaymentRecordService();
    await svc.createPayment('u1', makePayment({ amount: 250, recipientCategory: 'fakir' }));
    await svc.createPayment('u1', makePayment({ amount: 750, recipientCategory: 'gharimin' }));

    const stats = await svc.getStatisticsByCategory('snap-1', 'u1');
    const fakir = stats.find((s) => s.category === 'fakir')!;
    const gharimin = stats.find((s) => s.category === 'gharimin')!;

    // 250 / 1000 = 25%, 750 / 1000 = 75%
    expect(fakir.percentage).toBeCloseTo(25, 6);
    expect(gharimin.percentage).toBeCloseTo(75, 6);
    expect(stats.reduce((s, x) => s + x.percentage, 0)).toBeCloseTo(100, 6);
  });

  it('returns an empty list rather than crashing when there are no payments', async () => {
    const svc = new PaymentRecordService();
    expect(await svc.getStatisticsByCategory('snap-empty', 'u1')).toEqual([]);
  });

  it('avoids division by zero when the only payment is zero', async () => {
    // totalAmount === 0, so the naive `stats.totalAmount / totalAmount` is NaN.
    const svc = new PaymentRecordService();
    await svc.createPayment('u1', makePayment({ amount: 0, recipientCategory: 'fakir' }));

    const stats = await svc.getStatisticsByCategory('snap-1', 'u1');
    expect(stats).toHaveLength(1);
    // The guard yields 0, not NaN.
    expect(stats[0].percentage).toBe(0);
    expect(Number.isNaN(stats[0].percentage)).toBe(false);
  });
});

describe('listing and pagination', () => {
  it('lists a user\'s payments', async () => {
    const svc = new PaymentRecordService();
    for (let i = 0; i < 5; i++) await svc.createPayment('u1', makePayment({ amount: 10 + i }));

    const result = await svc.listPayments('u1', { page: 1, limit: 10 } as never);
    expect(result.data).toHaveLength(5);
    expect(result.pagination.totalItems).toBe(5);
  });

  it('reports the true total independently of the page size', async () => {
    const svc = new PaymentRecordService();
    for (let i = 0; i < 7; i++) await svc.createPayment('u1', makePayment({ amount: 5 }));

    const result = await svc.listPayments('u1', { page: 1, limit: 3 } as never);
    expect(result.data).toHaveLength(3);
    // The total must be the full count, not the page length.
    expect(result.pagination.totalItems).toBe(7);
  });

  it('decrypts amounts in the listed rows', async () => {
    const svc = new PaymentRecordService();
    await svc.createPayment('u1', makePayment({ amount: 4242.42 }));

    const result = await svc.listPayments('u1', { page: 1, limit: 10 } as never);
    expect(result.data[0].amount).toBeCloseTo(4242.42, 9);
  });

  it('never lists another user\'s payments', async () => {
    const svc = new PaymentRecordService();
    await svc.createPayment('u1', makePayment());
    await svc.createPayment('u2', makePayment());

    const result = await svc.listPayments('u1', { page: 1, limit: 10 } as never);
    expect(result.data).toHaveLength(1);
  });
});

describe('the stored formats that actually exist in production', () => {
  // These two formats are not hypothetical. Measured against the live database
  // (read-only): every existing payment row is the 2-part legacy CBC form with
  // 24-character groups. The 3-part GCM form with a SHORT body is what
  // EncryptionService.encrypt() produces today for any amount below 1,000,000 —
  // and it is the form isEncrypted() fails to recognise.

  it('reads the legacy 2-part CBC format that production stores', async () => {
    const svc = new PaymentRecordService();

    // Build a CBC ciphertext the way the older code path did.
    const crypto = await import('crypto');
    const key = Buffer.from(KEY, 'utf8').subarray(0, 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    const body = Buffer.concat([cipher.update('103.64', 'utf8'), cipher.final()]);
    const legacy = `${iv.toString('base64')}:${body.toString('base64')}`;

    // Insert it directly, bypassing the write path, to simulate an existing row.
    store.rows.push({
      id: 'legacy-1',
      userId: 'u1',
      snapshotId: 'snap-1',
      amount: legacy,
      recipientCategory: 'fakir',
    });

    const read = await svc.getPayment('legacy-1', 'u1');
    expect(read?.amount).toBeCloseTo(103.64, 6);
  });

  it('reads the 3-part GCM format whose body is too short for isEncrypted()', async () => {
    const svc = new PaymentRecordService();
    const created = await svc.createPayment('u1', makePayment({ amount: 500 }));

    // Confirm this really is the format isEncrypted() rejects — otherwise the
    // test would pass for the wrong reason.
    const raw = String(store.rows[0].amount);
    expect(raw.split(':')).toHaveLength(3);
    expect(raw.split(':')[1].length).toBeLessThan(12);
    expect(EncryptionService.isEncrypted(raw)).toBe(false);

    // And the service still returns the right number.
    expect(created.amount).toBeCloseTo(500, 9);
  });

  it('surfaces an unreadable amount instead of returning NaN', async () => {
    const svc = new PaymentRecordService();
    store.rows.push({
      id: 'garbage-1',
      userId: 'u1',
      snapshotId: 'snap-1',
      amount: 'not-a-number-and-not-ciphertext',
      recipientCategory: 'fakir',
    });

    // The old code returned NaN here, which silently poisoned every total that
    // included the row. Throwing makes the corruption visible.
    await expect(svc.getPayment('garbage-1', 'u1')).rejects.toThrow(/amount/i);
  });
});

describe('the encryption key this service uses', () => {
  it('requires ENCRYPTION_KEY to be set', () => {
    const saved = process.env.ENCRYPTION_KEY;
    delete process.env.ENCRYPTION_KEY;
    try {
      expect(() => new PaymentRecordService()).toThrow(/ENCRYPTION_KEY/);
    } finally {
      process.env.ENCRYPTION_KEY = saved;
    }
  });

  it('uses the raw env value directly as the key', async () => {
    // Pinned deliberately: this constructor does NOT normalise (no base64/hex/pad),
    // unlike EncryptionService.normalizeKey. So a hex key here means a DIFFERENT
    // AES key than the same string passed through normalizeKey.
    const svc = new PaymentRecordService();
    const created = await svc.createPayment('u1', makePayment({ amount: 123.45 }));

    // Decrypting with the raw key works...
    const raw = store.rows[0].amount as string;
    expect(await EncryptionService.decrypt(raw, KEY)).toBe('123.45');

    // ...and the service reads it back too.
    expect(created.amount).toBeCloseTo(123.45, 9);
  });
});
