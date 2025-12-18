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
    expect(decrypted.amount).toBeCloseTo(12.34);
  });
});
