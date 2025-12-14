import crypto from 'crypto';
import stableStringify from './deterministicJson';

export function sha256Hex(input: string): string {
  return crypto.createHash('sha256').update(input, 'utf8').digest('hex');
}

export function checksumOfArray(arr: any[]): string {
  // Arrays should be provided already stable-sorted by caller. We still serialize deterministically.
  const json = stableStringify(arr);
  return sha256Hex(json);
}

export default { sha256Hex, checksumOfArray };
