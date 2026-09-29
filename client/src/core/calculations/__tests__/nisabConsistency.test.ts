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
 * The nisab gram weights must be one number everywhere.
 *
 * There are three places the value legally lives, and they are three because the
 * server resolves `@zakapp/shared` to a local type shim rather than the package:
 *
 *   shared/src/constants/islamicConstants.ts   the canonical constant
 *   server/src/shared_local.ts                 what the server actually executes
 *   client/src/core/calculations/nisab.ts      the client's engine
 *
 * They DISAGREED: the canonical constant and the client said 87.48/612.36 while the
 * shim said 85/595, so a user could be shown one threshold and calculated against
 * another. Nothing failed — both are valid fiqh positions, so the bug was invisible
 * to every test that only checked "a threshold was produced".
 *
 * This test reads all three out of the source, so it holds across the resolution
 * split, and it fails loudly if they drift again.
 *
 * Why 87.48/612.36 and not 85/595 is recorded at each site. In short: the canonical
 * constant documents it as scholarly consensus with 85 g as the variant "in some
 * madhabs", and 85/595 is the AAOIFI reading. Both are sound; the project uses one.
 */
import { describe, it, expect } from 'vitest';
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
const CLIENT = 'client/src/core/calculations/nisab.ts';

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
    expect(numberFor(CLIENT, 'goldNisabGrams')).toBe(numberFor(CANONICAL, 'GOLD_GRAMS'));
    expect(numberFor(CLIENT, 'silverNisabGrams')).toBe(numberFor(CANONICAL, 'SILVER_GRAMS'));
  });

  it('the two weights are the tola reading, not the AAOIFI one', () => {
    // Records WHICH standard is in force, so switching is a deliberate act that
    // fails here first. 7.5 tola = 87.48 g, 52.5 tola = 612.36 g.
    // The AAOIFI alternative (20 dinars at 4.25 g) is 85 g / 595 g.
    const gold = numberFor(CANONICAL, 'GOLD_GRAMS');
    const silver = numberFor(CANONICAL, 'SILVER_GRAMS');
    expect(gold).toBeCloseTo(87.48, 2);
    expect(silver).toBeCloseTo(612.36, 2);
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
