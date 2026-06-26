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
