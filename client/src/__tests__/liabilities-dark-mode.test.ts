/**
 * Guard: the Liabilities subtree must use semantic theme tokens, not raw grays.
 *
 * Dark mode QA found the Liabilities page partially unreadable while every other
 * page was fine. Cause: the page shell used semantic tokens (`text-foreground`,
 * `border-border`, `bg-muted`), which flip with the `dark` class, but its child
 * components used raw Tailwind grays (`text-gray-900`, `bg-gray-50`), which are
 * fixed values and stay dark-on-dark.
 *
 * This is a static check rather than a render test on purpose: the failure mode is
 * a colour literal in a className, which no assertion on rendered text or DOM
 * structure would catch. It also catches the class of bug anywhere in the subtree,
 * including markup added later.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const ROOT = join(__dirname, '..', '..', 'src');

function collect(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      collect(full, out);
    } else if (/\.tsx?$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

// Raw Tailwind palette utilities that do not respond to the `dark` class.
const RAW_GRAY = /\b(?:bg|text|border|divide|ring|placeholder|from|to|via)-gray-\d{2,3}\b/g;

const TARGETS = [
  join(ROOT, 'pages', 'LiabilitiesPage.tsx'),
  ...collect(join(ROOT, 'components', 'liabilities')),
];

describe('dark mode: Liabilities subtree uses semantic tokens', () => {
  it('has target files to check', () => {
    expect(TARGETS.length).toBeGreaterThanOrEqual(3);
  });

  it.each(TARGETS)('%s contains no raw gray-* utilities', (file) => {
    const source = readFileSync(file, 'utf8');
    const hits = source.match(RAW_GRAY) ?? [];
    expect(hits, `raw gray tokens in ${file}: ${hits.join(', ')}`).toEqual([]);
  });
});
