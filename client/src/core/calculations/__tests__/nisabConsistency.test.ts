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
 * The nisab gram weights must agree wherever they are resolved from.
 *
 * There are two literal sources, and there are two because the server resolves
 * `@zakapp/shared` to a local type shim rather than to the package:
 *
 *   shared/src/constants/islamicConstants.ts   the canonical constant
 *   server/src/shared_local.ts                 what the server actually executes
 *
 * The client no longer hardcodes a pair: it selects one of NISAB_STANDARDS, so its
 * value is checked through the module rather than by reading the file's text.
 *
 * They DISAGREED: the canonical constant and the client said 87.48/612.36 while the
 * shim said 85/595, so a user could be shown one threshold and calculated against
 * another. Nothing failed — both are valid fiqh positions, so the bug was invisible
 * to every test that only checked "a threshold was produced".
 *
 * Both conventions are now offered to the user, and the default is the one the app
 * has always computed. This test pins that: the two literal sources agree, the
 * default equals the canonical pair, and an unrecognised preference falls back
 * rather than producing the other convention or NaN.
 */
import { describe, it, expect } from 'vitest';
import {
  NISAB_STANDARDS,
  DEFAULT_NISAB_STANDARD,
  getNisabStandard,
  normalizeNisabPayload,
} from '../nisab';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const repoRoot = resolve(__dirname, '../../../../..');
const read = (rel: string) => readFileSync(resolve(repoRoot, rel), 'utf8');

/** Pull `KEY: <number>` out of an object literal in the given file. */
function numberFor(rel: string, key: string): number {
  const m = read(rel).match(new RegExp(`\\b${key}\\s*:\\s*([0-9.]+)`));
  if (!m) throw new Error(`${key} not found in ${rel}`);
  return Number(m[1]);
}

const CANONICAL = 'shared/src/constants/islamicConstants.ts';
const SHIM = 'server/src/shared_local.ts';

describe('nisab gram weights are consistent across every source', () => {
  it('all three sources are discoverable (guards against passing vacuously)', () => {
    // If a regex above stops matching, numberFor throws — but assert the shape too,
    // so a silent change to a different constant cannot make these comparisons pass
    // while checking nothing.
    expect(numberFor(CANONICAL, 'GOLD_GRAMS')).toBeGreaterThan(50);
    expect(numberFor(CANONICAL, 'SILVER_GRAMS')).toBeGreaterThan(50);
    expect(numberFor(SHIM, 'GOLD_GRAMS')).toBeGreaterThan(50);
  });

  it('the server shim matches the canonical constant', () => {
    expect(numberFor(SHIM, 'GOLD_GRAMS')).toBe(numberFor(CANONICAL, 'GOLD_GRAMS'));
    expect(numberFor(SHIM, 'SILVER_GRAMS')).toBe(numberFor(CANONICAL, 'SILVER_GRAMS'));
  });

  it('the client engine uses the same weights as the canonical constant', () => {
    // The engine's DEFAULT must match the canonical constant and the shim, because
    // that is what an existing user gets when they have chosen nothing. Read the
    // client value through the module rather than by regex: the literals now live in
    // NISAB_STANDARDS, so a source-text match would be checking the wrong line.
    expect(NISAB_STANDARDS[DEFAULT_NISAB_STANDARD].goldGrams)
      .toBe(numberFor(CANONICAL, 'GOLD_GRAMS'));
    expect(NISAB_STANDARDS[DEFAULT_NISAB_STANDARD].silverGrams)
      .toBe(numberFor(CANONICAL, 'SILVER_GRAMS'));
  });

  it('offers both conventions, with the shipped default unchanged', () => {
    // The user-selectable pair. Both are legitimate scholarly positions — the same
    // classical obligation converted with a different unit weight — so both are
    // offered and the default is the one the app has always computed, which keeps
    // any existing user's threshold where it was.
    expect(NISAB_STANDARDS.tola.goldGrams).toBe(87.48);
    expect(NISAB_STANDARDS.tola.silverGrams).toBe(612.36);
    expect(NISAB_STANDARDS.aaoifi.goldGrams).toBe(85);
    expect(NISAB_STANDARDS.aaoifi.silverGrams).toBe(595);

    // An id that is missing, unknown, or a typo must not silently produce the other
    // convention — or a threshold of NaN.
    expect(getNisabStandard(undefined).id).toBe(DEFAULT_NISAB_STANDARD);
    expect(getNisabStandard(null).id).toBe(DEFAULT_NISAB_STANDARD);
    expect(getNisabStandard('').id).toBe(DEFAULT_NISAB_STANDARD);
    expect(getNisabStandard('nonsense').id).toBe(DEFAULT_NISAB_STANDARD);
    expect(getNisabStandard('aaoifi').id).toBe('aaoifi');
  });

  it('the default matches the canonical constant, so nobody is migrated silently', () => {
    const chosen = NISAB_STANDARDS[DEFAULT_NISAB_STANDARD];
    expect(chosen.goldGrams).toBe(numberFor(CANONICAL, 'GOLD_GRAMS'));
    expect(chosen.silverGrams).toBe(numberFor(CANONICAL, 'SILVER_GRAMS'));
  });

  it('normalizeNisabPayload applies the requested convention', () => {
    const payload = { goldPrice: { pricePerGram: 100 }, silverPrice: { pricePerGram: 1 } };
    expect(normalizeNisabPayload(payload, 'tola').goldNisabGrams).toBe(87.48);
    expect(normalizeNisabPayload(payload, 'aaoifi').goldNisabGrams).toBe(85);
    expect(normalizeNisabPayload(payload, 'aaoifi').silverNisabGrams).toBe(595);
    // Defaulting must equal the default standard, not something else.
    expect(normalizeNisabPayload(payload).goldNisabGrams)
      .toBe(NISAB_STANDARDS[DEFAULT_NISAB_STANDARD].goldGrams);
  });

  it('no user-facing string still quotes the other threshold', () => {
    // The gold figure is the one that drifted into prose, because "85 grams" is the
    // rounder number and reads better in a sentence.
    const proseFiles = [
      'client/src/data/faqs.ts',
      'client/src/data/methodologies.ts',
      'client/src/data/rulings.ts',
      'client/src/data/glossary.ts',
      'client/src/components/assets/AssetCategories.tsx',
      'client/src/components/help/GettingStarted.tsx',
    ];
    const offenders: string[] = [];
    for (const rel of proseFiles) {
      const text = read(rel);
      // Allow the canonical pair and the explanatory mentions that name 85/595 as
      // the alternative; flag bare claims of the wrong threshold.
      for (const line of text.split('\n')) {
        if (/85\s*g(rams?)?\s+of\s+gold/i.test(line) || /595\s*g(rams?)?\s+of\s+silver/i.test(line)) {
          offenders.push(`${rel}: ${line.trim().slice(0, 90)}`);
        }
      }
    }
    expect(offenders, `these quote the AAOIFI threshold as if it were ours:\n${offenders.join('\n')}`)
      .toEqual([]);
  });
});
