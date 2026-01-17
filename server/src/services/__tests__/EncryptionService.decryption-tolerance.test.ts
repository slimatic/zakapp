import { vi, type Mock } from 'vitest';
/**
 * Copyright (c) 2024 ZakApp Contributors
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
