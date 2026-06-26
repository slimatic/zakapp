/**
 * Copyright (c) 2024-2026 ZakApp Contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import { vi, type Mock } from 'vitest';
import { EncryptionService } from '../../src/services/EncryptionService';
import { PaymentRecordService } from '../../src/services/PaymentRecordService';

describe('EncryptionService alternative separator handling', () => {
  it('should decrypt encrypted payloads where separator has been replaced with `.=`, and isEncrypted should detect it', async () => {
    const key = EncryptionService.generateKey();
    const plaintext = 'sensitive test payload';

    const encrypted = await EncryptionService.encrypt(plaintext, key);
    // Simulate legacy/DB alteration where ':' is replaced with '.='
    const alt = encrypted.replace(':', '.=');

    expect(EncryptionService.isEncrypted(alt)).toBe(true);
    const decrypted = await EncryptionService.decrypt(alt, key);
    expect(decrypted).toBe(plaintext);
  });

  it('PaymentRecordService should decrypt fields that use ".=" separator', async () => {
    const key = EncryptionService.generateKey();
    const plaintext = 'recipient name example';

    const enc = await EncryptionService.encrypt(plaintext, key);
    const malformed = enc.replace(':', '.=');

    process.env.ENCRYPTION_KEY = key; // ensure service uses same key as test
    const svc = new PaymentRecordService();
    // build a fake payment object with malformed encrypted recipientName and amount
    const fakePayment: any = {
      id: 'x',
      amount: (await EncryptionService.encrypt('12.34', key))?.replace(':', '.='),
      recipientName: malformed,
      notes: null,
      receiptReference: null
    };

    // Call private method via cast for test purposes
    const decrypted = await (svc as any).decryptPaymentData(fakePayment);

    expect(decrypted.recipientName).toBe(plaintext);
    expect(parseFloat(decrypted.amount)).toBeCloseTo(12.34);
  });
});
