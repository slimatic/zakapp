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
 * A Hawl is one lunar year, and its length has to be resolved from ONE place.
 *
 * It was resolved from four hand-rolled expressions in four files — a
 * millisecond constant in the record actions, `getDate() + 354` in the
 * onboarding wizard, a `targetDays` literal in the tracker and a
 * `TOTAL_HAWL_DAYS` literal on the Dashboard — while a fifth file (the
 * server's reminder service) used a Gregorian year instead, so the same
 * record could be "complete" on one screen and 11 days away on another.
 *
 * This guard fails on any surviving second implementation. It reads source
 * rather than importing the rule module so that it still runs — and still
 * names the offending files — when the module itself is absent.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, join, relative } from 'node:path';

const repoRoot = resolve(__dirname, '../../../../..');
const read = (rel: string) => readFileSync(resolve(repoRoot, rel), 'utf8');

const CANONICAL_MODULE = 'client/src/core/calculations/hawl.ts';
const SCAN_ROOT = resolve(repoRoot, 'client/src');

/** Files that are allowed to state the rule. */
const ALLOWED = new Set([CANONICAL_MODULE]);

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry === '__tests__' || entry === 'node_modules') continue;
      walk(full, out);
    } else if (/\.(ts|tsx)$/.test(entry) && !/\.(test|spec)\.(ts|tsx)$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

/** A second implementation of the lunar year, in any of its shapes. */
const SECOND_IMPLEMENTATIONS: Array<[RegExp, string]> = [
  [/\bHAWL_MS\b/, 'millisecond Hawl constant'],
  [/\b354\s*\*\s*24\b/, 'hand-rolled lunar-year millisecond arithmetic'],
  [/\+\s*354\b/, 'hand-rolled +354 day arithmetic'],
  [/\badd\(\s*354\b/, 'hand-rolled +354 day arithmetic (moment)'],
  [/[=:]\s*354\b/, 'lunar day-count literal'],
  [/\{354\}/, 'lunar day-count passed as a literal prop'],
];

describe('the Hawl length resolves from one place', () => {
  it('has no second implementation in the client tree', () => {
    const files = walk(SCAN_ROOT);
    // A scan that examined nothing cannot fail; fail before claiming a pass.
    expect(files.length).toBeGreaterThan(100);

    const hits: string[] = [];
    for (const file of files) {
      const rel = relative(repoRoot, file).split('\\').join('/');
      if (ALLOWED.has(rel)) continue;
      const source = readFileSync(file, 'utf8');
      source.split('\n').forEach((line, i) => {
        for (const [pattern, label] of SECOND_IMPLEMENTATIONS) {
          if (pattern.test(line)) hits.push(`${rel}:${i + 1} ${label}: ${line.trim()}`);
        }
      });
    }

    expect(hits).toEqual([]);
  });

  it('states the same lunar year in the canonical constant and the server shim', () => {
    const numberFor = (rel: string, key: string): number => {
      const m = read(rel).match(new RegExp(`\\b${key}\\s*[:=]\\s*([0-9]+)`));
      if (!m) throw new Error(`${key} not found in ${rel}`);
      return Number(m[1]);
    };

    const canonical = numberFor('shared/src/constants/islamicConstants.ts', 'DAYS_LUNAR');
    const shim = numberFor('server/src/shared_local.ts', 'DAYS_LUNAR');
    const client = numberFor(CANONICAL_MODULE, 'HAWL_DAYS');

    expect(canonical).toBe(354);
    expect(shim).toBe(canonical);
    expect(client).toBe(canonical);
  });

  it('has the server read the shared length instead of stating its own', () => {
    const tracker = read('server/src/services/hawlTrackingService.ts');

    expect(tracker).toContain('HAWL_CONSTANTS.DAYS_LUNAR');
    // The literal it replaced: `HAWL_DURATION_DAYS = 354`.
    expect(tracker).not.toMatch(/HAWL_DURATION_DAYS\s*=\s*[0-9]+/);

    // Neither reminder path adds a Gregorian year to reach an anniversary.
    expect(read('server/src/services/ReminderService.ts')).not.toMatch(/setFullYear/);
  });
});
