/**
 * Dark-mode gray-coverage guard.
 *
 * The gray retrofit in index.css maps `gray-*` utilities to dark-mode values so
 * components written before dark mode existed render correctly. It is an
 * allow-list, though: any gray utility the retrofit omits silently keeps its
 * LIGHT value on dark surfaces. That is how #426 shipped — gradient stops,
 * ring-*, and border-gray-500 were used in components but absent from the
 * mapping, so loading skeletons flashed light gray and focus rings vanished.
 *
 * A per-page visual sweep cannot catch this reliably: a wrong focus ring reads
 * as "no focus ring", a mis-shaded skeleton reads as "loading". This test
 * compares the mapping against actual usage instead, so the gap cannot reopen.
 *
 * Implementation note: class tokens are harvested from every string literal, not
 * from `className=` attributes. Parsing JSX by regex desynchronizes on template
 * literals, which hid the conditional branches this guard most needs to check
 * (`cond ? 'a' : 'bg-gray-400 border-gray-500'`). Scanning literals is blunt but
 * cannot miss those, and gray utility tokens do not meaningfully occur outside
 * class names.
 */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const SRC = path.resolve(__dirname, '..');
const css = fs.readFileSync(path.join(SRC, 'index.css'), 'utf-8');

/** Any gray utility family that can appear in a class list. */
const GRAY_UTIL = /\b((?:text|bg|border|from|to|via|ring|divide|placeholder)-gray-\d{2,3}(?:\/\d+)?)\b/g;

/** String literals: single, double, and template (template parts included). */
const LITERAL = /'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|`(?:\\.|[^`\\])*`/g;

/**
 * Every gray utility the retrofit overrides.
 * Comments are stripped first — the retrofit's own comment mentions ".dark
 * overrides", which would otherwise be parsed as a selector. CSS escapes are then
 * unwound (`bg-gray-50\/50` → `bg-gray-50/50`) and class tokens read off selectors.
 */
function mappedUtilities(): Set<string> {
  const stripped = css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\\(.)/g, '$1');

  const covered = new Set<string>();
  for (const [, selector] of stripped.matchAll(/\.dark\b([^{}]*)\{/g)) {
    for (const token of selector.matchAll(/\.([A-Za-z0-9_-]+(?:\/\d+)?)/g)) {
      covered.add(token[1]);
    }
  }
  return covered;
}

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === '__tests__' || entry.name === 'node_modules') continue;
      walk(full, out);
    } else if (entry.name.endsWith('.tsx')) {
      out.push(full);
    }
  }
  return out;
}

describe('dark mode: gray utility coverage', () => {
  it('reads the retrofit mapping from index.css', () => {
    const covered = mappedUtilities();
    expect(covered.size).toBeGreaterThan(25); // the mapper found the bulk of it
    expect(covered.has('bg-gray-50')).toBe(true);
    expect(covered.has('text-gray-900')).toBe(true);
    expect(covered.has('bg-gray-50/50')).toBe(true); // de-escaping works
    expect(covered.has('border-gray-500')).toBe(true); // the #426 fix
  });

  it('every gray utility used without a dark: variant is mapped in index.css', () => {
    const covered = mappedUtilities();
    const uncovered = new Map<string, Set<string>>();

    for (const file of walk(SRC)) {
      const txt = fs.readFileSync(file, 'utf-8');

      for (const [literal] of txt.matchAll(LITERAL)) {
        if (literal.includes('dark:')) continue; // authored dark variant present
        for (const util of literal.match(GRAY_UTIL) ?? []) {
          if (!covered.has(util)) {
            if (!uncovered.has(util)) uncovered.set(util, new Set());
            uncovered.get(util)!.add(path.relative(SRC, file));
          }
        }
      }
    }

    const report = [...uncovered.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([util, files]) => `  ${util} — ${[...files].sort().join(', ')}`)
      .join('\n');

    expect(
      uncovered.size,
      uncovered.size
        ? `Gray utilities render at LIGHT values in dark mode (no .dark rule in index.css):\n${report}`
        : ''
    ).toBe(0);
  });
});
