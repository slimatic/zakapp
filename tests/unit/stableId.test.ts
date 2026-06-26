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

import { canonicalize, generateStableId } from '../../shared/src/utils/stableId';
import crypto from 'crypto';

describe('stableId utility', () => {
  test('canonicalize collapses whitespace and normalizes unicode', () => {
    const a = 'Foo\u00A0\u2003Bar  Baz';
    const b = 'foo Bar Baz';
    expect(canonicalize(a, { lowercase: true })).toBe(canonicalize(b, { lowercase: true }));
  });

  test('generateStableId produces hex sha256 of expected input', () => {
    const namespace = 'zakapp';
    const entityType = 'asset';
    const canonicalKey = canonicalize('Type: My Asset: acct123', { lowercase: true });
    const expected = crypto.createHash('sha256').update(`${namespace}:${entityType}:${canonicalKey}`, 'utf8').digest('hex');
    const id = generateStableId(entityType, canonicalKey, namespace);
    expect(id).toBe(expected);
    expect(id).toHaveLength(64);
  });

  test('different inputs produce different stableIds', () => {
    const k1 = canonicalize('a b c', { lowercase: true });
    const k2 = canonicalize('a  b   c d', { lowercase: true });
    const id1 = generateStableId('payment', k1);
    const id2 = generateStableId('payment', k2);
    expect(id1).not.toBe(id2);
  });
});
