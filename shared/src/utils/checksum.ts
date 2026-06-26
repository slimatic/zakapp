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
