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

/**
 * Reading numeric values out of encrypted columns.
 *
 * WHY THIS MODULE EXISTS
 *
 * Fourteen models store 36 columns as `String` with an `// Encrypted` comment, and
 * production holds real ciphertext — for example
 * `"HWXQ098Y/CRwFrkCo2j/Og==:7aqR3gmgwjBIlBBwiCNWJQ=="`.
 *
 * Thirteen of those columns are semantically numeric: money and thresholds. Reading
 * one without decrypting first does not crash. It produces `NaN`, and `NaN` is
 * quiet:
 *
 *   · `sum + NaN`              -> NaN        (totals become "NaN")
 *   · `x < NaN`, `x >= NaN`    -> false      (comparisons silently take one branch)
 *   · `Math.max(0, NaN)`       -> NaN
 *   · `JSON.stringify({a:NaN})`-> `{"a":null}` (the value vanishes)
 *
 * That failure mode has now been found three times in this codebase, each time in a
 * different layer: the payment API (0.16.7), the daily summary job, and the live
 * Hawl tracking path. A shared helper is the point — the reasoning below is subtle
 * enough that re-deriving it per call site is how it gets got wrong.
 *
 * WHY CONTENT DECIDES, NOT `isEncrypted()`
 *
 * `EncryptionService.isEncrypted()` requires every base64 group to be at least 12
 * characters. A GCM ciphertext is `ivB64:bodyB64:tagB64`, so a plaintext shorter
 * than 7 characters encrypts to a body that is under 12 characters — and
 * `isEncrypted()` reports that ciphertext as NOT encrypted. Then `parseFloat()` is
 * applied to the ciphertext itself.
 *
 *   plaintext   body (base64)   isEncrypted()   parseFloat(ciphertext)
 *   "1"         4 chars         false           NaN
 *   "500"       8 chars         false           NaN
 *   "1234.56"   12 chars        true            NaN (correctly detected)
 *
 * So the reliable order is: try to read it as a plain number FIRST, and only attempt
 * decryption when that fails. This is the ordering proven in `PaymentRecordService`
 * after the 0.16.7 fix; it is repeated here rather than re-derived.
 */

import { EncryptionService } from '../services/EncryptionService';

/** Separator variants found in ciphertext written by older releases. */
const SEPARATORS = [':', '.=', '.', '|', ';'];

/**
 * Read a stored numeric value that may be ciphertext.
 *
 * @param raw           the column value as Prisma returned it
 * @param encryptionKey the active ENCRYPTION_KEY
 * @returns the numeric value
 * @throws when the value is neither a plain number nor decryptable ciphertext
 *
 * Callers choose how to fail. A job that cannot read an amount should surface an
 * error rather than persist "NaN"; a display path may prefer to omit the value
 * rather than show a wrong one. Both are better than propagating NaN.
 */
export async function readEncryptedAmount(
  raw: unknown,
  encryptionKey: string
): Promise<number> {
  if (raw === null || raw === undefined) {
    return 0;
  }

  if (typeof raw === 'number') {
    if (!Number.isFinite(raw)) {
      throw new Error(`Value is not a finite number: ${JSON.stringify(raw)}`);
    }
    return raw;
  }

  const asString = String(raw);

  // Fast path: a plain numeric string. THIS MUST COME FIRST — see the module note.
  const asPlainNumber = Number(asString);
  if (asString.trim() !== '' && Number.isFinite(asPlainNumber)) {
    return asPlainNumber;
  }

  // Otherwise it should be ciphertext. Collect the plausible forms and let AES-GCM
  // authentication decide which is real, rather than trusting a format guess.
  const candidates: string[] = [];
  if (EncryptionService.isEncrypted(asString)) candidates.push(asString);

  for (const separator of SEPARATORS) {
    if (!asString.includes(separator)) continue;
    const parts = asString.split(separator);
    if (parts.length === 2 || parts.length === 3) {
      const normalized = parts.join(':');
      if (EncryptionService.isEncrypted(normalized)) candidates.push(normalized);
      // Also attempt the joined form even when isEncrypted() says no, so a short
      // body still reaches the decryption attempt below.
      candidates.push(normalized);
    }
  }
  candidates.push(asString);

  for (const candidate of candidates) {
    let decrypted: string;
    try {
      decrypted = await EncryptionService.decrypt(candidate, encryptionKey);
    } catch {
      continue; // Not this form — try the next.
    }

    // EncryptionService.decrypt FAILS OPEN: on an authentication failure it returns
    // its own input unchanged rather than throwing. So "it did not throw" is NOT
    // evidence of success, and the identity check is the only reliable signal.
    //
    // Without this, a wrong key or a corrupted value falls through to the parse
    // below and parseFloat() runs on CIPHERTEXT — which returns whatever leading
    // number it finds. A ciphertext beginning "8d3RTKu..." yields 8, a plausible
    // amount that is completely wrong. That is the exact silent-wrongness this
    // module exists to prevent, so it must be rejected here.
    if (decrypted === candidate) {
      continue;
    }

    // Require the ENTIRE decrypted value to be one numeric literal.
    // parseFloat("8abc") is 8 — permissive parsing would reintroduce the same
    // hazard from the other direction.
    const trimmed = decrypted.trim();
    if (!/^-?\d+(\.\d+)?$/.test(trimmed)) {
      continue;
    }

    const parsed = Number(trimmed);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  throw new Error(
    `Value is neither a plain number nor decryptable ciphertext (length ${asString.length})`
  );
}

/**
 * Non-throwing variant for display paths, where a missing value is preferable to a
 * wrong one but should not break the whole response.
 *
 * Returns `null` — deliberately NOT `0`. Zero is a real amount; returning it for an
 * unreadable value would present "could not read this" as "this is zero", which is
 * exactly the class of quiet wrongness this module exists to prevent. Callers must
 * decide explicitly what an unknown value means to them.
 */
export async function tryReadEncryptedAmount(
  raw: unknown,
  encryptionKey: string
): Promise<number | null> {
  try {
    return await readEncryptedAmount(raw, encryptionKey);
  } catch {
    return null;
  }
}

/**
 * Decrypt the named fields of a database row in place, leaving everything else
 * untouched.
 *
 * Returns a copy. Fields that cannot be read are left as their original raw value
 * and listed in `unreadable`, so a caller can distinguish "decrypted fine" from
 * "could not be read" rather than discovering the difference via a NaN later.
 */
export async function decryptNumericFields<T extends Record<string, unknown>>(
  row: T,
  fields: string[],
  encryptionKey: string
): Promise<{ row: T; unreadable: string[] }> {
  const decrypted: Record<string, unknown> = { ...row };
  const unreadable: string[] = [];

  for (const field of fields) {
    if (!(field in row)) continue;
    if (row[field] === null || row[field] === undefined) continue;

    const value = await tryReadEncryptedAmount(row[field], encryptionKey);
    if (value === null) {
      unreadable.push(field);
    } else {
      decrypted[field] = value;
    }
  }

  return { row: decrypted as T, unreadable };
}
