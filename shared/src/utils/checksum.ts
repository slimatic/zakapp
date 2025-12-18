import { sha256 } from 'js-sha256';
import stableStringify from './deterministicJson.js';

export function sha256Hex(input: string): string {
  return sha256(input);
}

export function checksumOfArray(arr: any[]): string {
  // Arrays should be provided already stable-sorted by caller. We still serialize deterministically.
  const json = stableStringify(arr);
  return sha256Hex(json);
}

export default { sha256Hex, checksumOfArray };
