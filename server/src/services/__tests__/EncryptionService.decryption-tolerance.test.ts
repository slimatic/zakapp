import { EncryptionService } from '../EncryptionService';

describe('EncryptionService decryption tolerance', () => {
  test('decryptObject should return object for non-encrypted object input (sync)', () => {
    const input = { name: 'Alice', age: 30 };
    const result = EncryptionService.decryptObject(input as any);
    expect(result).toEqual(input);
  });

  test('decryptObject should return number for non-encrypted numeric input (sync)', () => {
    const input = 12345;
    const result = EncryptionService.decryptObject(input as any);
    expect(result).toBe(12345);
  });

  test('decryptObject should return stringified object for non-encrypted object using async path (with key)', async () => {
    const input = { x: true, items: [1, 2, 3] };
    const key = EncryptionService.generateKey();
    const result = await EncryptionService.decryptObject(input as any, key as any);
    // async path returns the JSON string when input is an object; decryptObject should parse it back
    expect(result).toEqual(input);
  });
});
