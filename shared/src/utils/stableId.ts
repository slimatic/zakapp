import { sha256 } from 'js-sha256';

/**
 * Canonicalize a string for stableId generation.
 * - Normalize to NFKC
 * - Trim
 * - Collapse internal whitespace to single space
 * - Optionally lowercase
 */
export function canonicalize(input: string, options?: { lowercase?: boolean }) {
  if (typeof input !== 'string') return '';
  let s = input.normalize('NFKC');
  s = s.replace(/\s+/g, ' ').trim();
  if (options?.lowercase) s = s.toLowerCase();
  return s;
}

/**
 * Generate a stableId for an entity.
 * stableId = sha256_hex(namespace + ':' + entityType + ':' + canonicalizedKey)
 */
export function generateStableId(entityType: string, canonicalKey: string, namespace = 'zakapp') {
  const key = `${namespace}:${entityType}:${canonicalKey}`;
  return sha256(key);
}

export default generateStableId;
