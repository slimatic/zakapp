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

1|import { vi, type Mock } from 'vitest';
2|import { EncryptionService } from '../../src/services/EncryptionService';
3|import { PaymentRecordService } from '../../src/services/PaymentRecordService';
4|
5|describe('EncryptionService alternative separator handling', () => {
6|  it('should decrypt encrypted payloads where separator has been replaced with `.=`, and isEncrypted should detect it', async () => {
7|    const key = EncryptionService.generateKey();
8|    const plaintext = 'sensitive test payload';
9|
10|    const encrypted = await EncryptionService.encrypt(plaintext, key);
11|    // Simulate legacy/DB alteration where ':' is replaced with '.='
12|    const alt = encrypted.replace(':', '.=');
13|
14|    expect(EncryptionService.isEncrypted(alt)).toBe(true);
15|    const decrypted = await EncryptionService.decrypt(alt, key);
16|    expect(decrypted).toBe(plaintext);
17|  });
18|
19|  it('PaymentRecordService should decrypt fields that use ".=" separator', async () => {
20|    const key = EncryptionService.generateKey();
21|    const plaintext = 'recipient name example';
22|
23|    const enc = await EncryptionService.encrypt(plaintext, key);
24|    const malformed = enc.replace(':', '.=');
25|
26|    process.env.ENCRYPTION_KEY = key; // ensure service uses same key as test
27|    const svc = new PaymentRecordService();
28|    // build a fake payment object with malformed encrypted recipientName and amount
29|    const fakePayment: any = {
30|      id: 'x',
31|      amount: (await EncryptionService.encrypt('12.34', key))?.replace(':', '.='),
32|      recipientName: malformed,
33|      notes: null,
34|      receiptReference: null
35|    };
36|
37|    // Call private method via cast for test purposes
38|    const decrypted = await (svc as any).decryptPaymentData(fakePayment);
39|
40|    expect(decrypted.recipientName).toBe(plaintext);
41|    expect(parseFloat(decrypted.amount)).toBeCloseTo(12.34);
42|  });
43|});
44|