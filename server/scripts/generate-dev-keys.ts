import { EncryptionService } from '../src/services/EncryptionService';

function main() {
  const prevKey = EncryptionService.generateKey();
  const currKey = EncryptionService.generateKey();

  console.log('Dev key generation (dev only)');
  console.log('--------------------------------');
  console.log('Previous key (base64):\n', prevKey);
  console.log('\nCurrent key (base64):\n', currKey);
  console.log('\nExample quick workflow to seed data encrypted with previous key and then migrate:');
  console.log("1) Seed data encrypted with previous key:\n   SEED_PREV_KEY='<PREV_KEY>' ENCRYPTION_KEY='<PREV_KEY>' npx ts-node --transpile-only ./scripts/seed-encrypted-fixtures.ts");
  console.log("2) Switch runtime to the current key and set the previous key for migration:\n   ENCRYPTION_KEY='<CURRENT_KEY>' ENCRYPTION_PREVIOUS_KEYS='<PREV_KEY>' npx ts-node --transpile-only ./scripts/normalize-payments.ts");
  console.log('\nReplace <PREV_KEY> and <CURRENT_KEY> with the values printed above.');
}

main();
