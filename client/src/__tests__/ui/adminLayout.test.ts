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
 * The admin tab strip must not scroll the page sideways on a phone.
 *
 * Measured, not assumed: four tabs with `whitespace-nowrap` and `space-x-8` come to
 * ~511px, and the container is 358px wide at a 390px viewport. Without an
 * overflow wrapper the strip pushed the document to 527px, giving 137px of
 * page-level horizontal scroll on every admin page.
 *
 * A real browser measurement needs a browser, so this asserts the two classes that
 * produce the behaviour instead - if either is removed the regression returns.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const src = readFileSync(
  resolve(__dirname, '../../pages/admin/AdminDashboard.tsx'),
  'utf8'
);

describe('admin tab strip is mobile-safe', () => {
  it('wraps the tab nav in an overflow-x-auto container', () => {
    // Without this the ~511px strip widens the document. Assert the wrapper div
    // immediately around the nav, not a loose span - a span test passed while the
    // class sat in a comment 3 lines away.
    expect(src).toContain('className="border-b border-border overflow-x-auto"');
  });

  it('keeps the tab labels on one line so the strip scrolls, not the page', () => {
    // `whitespace-nowrap` on each tab is what makes the nav ~511px wide and forces
    // the strip to scroll. It must stay on all four labels.
    const nowrap = src.match(/whitespace-nowrap/g) || [];
    expect(nowrap.length).toBeGreaterThanOrEqual(4);
  });

  it('uses no class that generates zero CSS', () => {
    // `min-w-max` and `sm:min-w-0` were tried here and produce NO rule in this
    // project's Tailwind build, so they failed silently while looking correct.
    // The repo's check-dead-classes.py guard caught it; this keeps it caught.
    expect(src).not.toContain('min-w-max');
    expect(src).not.toContain('sm:min-w-0');
  });

  it('uses SVG icons for the stat cards, not emoji', () => {
    // Emoji render inconsistently across platforms and are read aloud as words.
    const emoji = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;
    expect(emoji.test(src)).toBe(false);
    for (const icon of ['Users', 'UserCheck', 'UserMinus', 'HardDrive']) {
      expect(src).toContain(icon);
    }
  });

  it('stacks the stat cards two-up before going four-up, so they fit a phone', () => {
    expect(src).toContain('grid-cols-1 sm:grid-cols-2 md:grid-cols-4');
  });
});
