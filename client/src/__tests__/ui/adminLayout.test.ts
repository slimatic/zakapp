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
 * Measured, not assumed: the strip of four tabs with `whitespace-nowrap` is wider
 * than a 390px viewport, and without an overflow wrapper it pushed the document
 * sideways, giving page-level horizontal scroll on every admin page.
 *
 * A real browser measurement needs a browser, so this asserts the classes that
 * produce the behaviour instead - if a class is removed the regression returns.
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
    // Without this the strip widens the document. Assert the classes on the
    // wrapper div rather than a loose span - a span test passed while the class sat
    // in a comment 3 lines away. Order-independent so a class added for the
    // scroll-affordance work does not fail a test about overflow.
    //
    // `border-b` used to be asserted here too: it was the underline rail under the
    // old underline-style tabs. The tabs became pills to match the Settings page,
    // and a rail under pills is not part of that design - so it is no longer
    // required. What must remain is the thing this test exists for: the overflow
    // wrapper, without which the page-level sideways scroll comes back.
    const wrapper = src.match(/<div className="([^"]*)"[^>]*>\s*\{?[\s\S]{0,400}?aria-label="Tabs"/);
    expect(wrapper, 'no wrapper div found around the nav').toBeTruthy();
    expect(wrapper![1]).toContain('overflow-x-auto');
  });

  it('keeps the tab labels on one line so the strip scrolls, not the page', () => {
    // `whitespace-nowrap` is what makes the nav wider than a phone and forces the
    // strip to scroll instead of the document. The four labels render from one
    // template now, so assert BOTH: the class is applied, and all four labels are
    // still present (a template that lost a label would otherwise pass).
    expect(src).toContain('whitespace-nowrap');
    for (const label of ['Overview', 'User Management', 'System Settings', 'System Health']) {
      expect(src).toContain(label);
    }
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
