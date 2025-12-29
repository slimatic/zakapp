import { EncryptionService } from '../src/services/EncryptionService';

async function test(value: string) {
  const key = process.env.ENCRYPTION_KEY || '';
  console.log('Using runtime ENCRYPTION_KEY length', key.length);

  try {
    const dec = await EncryptionService.decrypt(value, key);
    console.log('Decrypted (current key):', dec);
    return;
  } catch (e) {
    console.error('Decrypt with current key failed:', e instanceof Error ? e.message : e);
  }

  const prev = (process.env.ENCRYPTION_PREVIOUS_KEYS || '').split(',').map(k => k.trim()).filter(Boolean);
  for (let i = 0; i < prev.length; i++) {
    try {
      const dec = await EncryptionService.decrypt(value, prev[i]);
      console.log(`Decrypted with previous key index ${i}:`, dec);
      return;
    } catch (e) {
      console.error(`Previous key ${i} failed:`, e instanceof Error ? e.message : e);
    }
  }

  console.error('All decryption attempts failed');
}

(async () => {
  const val = process.argv[2];
  if (!val) {
    console.error('Usage: npx ts-node scripts/test-decrypt.ts <encrypted-string>');
    process.exit(1);
  }

  await test(val);
})();
