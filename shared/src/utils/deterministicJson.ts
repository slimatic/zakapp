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

/**
 * Deterministic JSON serializer with stable key ordering.
 * Produces compact JSON with keys sorted lexicographically.
 */
export function stableStringify(value: any): string {
  return serialize(value);
}

function serialize(value: any): string {
  if (value === null) return 'null';
  const t = typeof value;
  if (t === 'string') return JSON.stringify(value);
  if (t === 'number' || t === 'boolean') return String(value);
  if (Array.isArray(value)) {
    const items = value.map((v) => serialize(v));
    return '[' + items.join(',') + ']';
  }
  if (t === 'object') {
    const keys = Object.keys(value).sort();
    const parts = keys.map((k) => JSON.stringify(k) + ':' + serialize(value[k]));
    return '{' + parts.join(',') + '}';
  }
  // fallback
  return JSON.stringify(value);
}

export default stableStringify;
