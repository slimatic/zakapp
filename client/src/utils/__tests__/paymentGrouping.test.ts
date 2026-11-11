/**
 * Copyright (c) 2024 ZakApp Contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import { describe, it, expect } from 'vitest';
import { groupPaymentsByRecipient } from '../paymentGrouping';

const payment = (over: Partial<any>): any => ({
  id: 'p',
  amount: 100,
  currency: 'USD',
  paymentDate: '2026-01-01T00:00:00.000Z',
  recipientName: 'Masjid',
  ...over,
});

describe('groupPaymentsByRecipient', () => {
  it('totals per recipient regardless of name casing and spacing', () => {
    const result = groupPaymentsByRecipient([
      payment({ id: '1', recipientName: 'Masjid Al-Noor', amount: 100, paymentDate: '2026-01-01T00:00:00.000Z' }),
      payment({ id: '2', recipientName: '  masjid   AL-NOOR ', amount: 250, paymentDate: '2026-03-01T00:00:00.000Z' }),
      payment({ id: '3', recipientName: 'Family', amount: 50 }),
    ]);

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ name: 'Masjid Al-Noor', count: 2, last: '2026-03-01T00:00:00.000Z' });
    expect(result[0].total.toNumber()).toBe(350);
    expect(result[1]).toMatchObject({ name: 'Family', count: 1 });
  });

  it('keeps unreadable (ciphertext) names in one honest row', () => {
    const result = groupPaymentsByRecipient([
      payment({ id: '1', recipientName: 'ZK1:aaaaaaaaaaaaaaaa:bbbbbbbbbbbbbbbbbbbb' }),
      payment({ id: '2', recipientName: 'ZK1:cccccccccccccccc:dddddddddddddddddddd' }),
    ]);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ name: 'Unreadable', count: 2 });
  });

  it('sorts by total, largest first', () => {
    const result = groupPaymentsByRecipient([
      payment({ id: '1', recipientName: 'Small', amount: 10 }),
      payment({ id: '2', recipientName: 'Large', amount: 900 }),
    ]);
    expect(result.map((r) => r.name)).toEqual(['Large', 'Small']);
  });
});
