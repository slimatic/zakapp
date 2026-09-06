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

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Feature-reachability gate (introduced after the v0.15.0 finding where
 * ZakatCalculator was commented out of App.tsx and the feature shipped dead).
 *
 * Every page component in the codebase that has a top-level route MUST be
 * imported in App.tsx and registered in a <Route> element. This test reads
 * the live App.tsx source and fails if any "public page" page component is
 * not mounted.
 */
describe('App.tsx route reachability', () => {
  const appTsx = fs.readFileSync(
    path.join(__dirname, '..', '..', 'App.tsx'),
    'utf-8'
  );

  // Page components that must be reachable from a route. Each entry is
  // either already exported as a default from its file, or has a known
  // named export wired into App.tsx via a `lazy(() => import('...').then(m => ({ default: m.X })))`.
  // Update this list when adding/removing public pages.
  //
  // Regex must be a word-boundary match on the export name; e.g. use
  // `ZakatCalculator` (not `ZakatCalculatorComponent`) so commented-out
  // siblings with similar names don't false-positive.
  const requiredPublicPages: Array<{ importPath: RegExp; componentName: string }> = [
    { importPath: /\bZakatCalculator\b/, componentName: 'ZakatCalculator' },
    { importPath: /\bNisabYearRecordsPage\b/, componentName: 'NisabYearRecordsPage' },
    { importPath: /\bconst Dashboard\b/, componentName: 'Dashboard' },
  ];

  for (const { importPath, componentName } of requiredPublicPages) {
    it(`imports ${componentName} into App.tsx (not commented out)`, () => {
      // Find a line that mentions the component name
      const lines = appTsx.split('\n').filter(l => importPath.test(l));
      expect(lines.length, `${componentName} not found in App.tsx`).toBeGreaterThan(0);
      // None of those lines may be commented out (//)
      const commented = lines.filter(l => l.trim().startsWith('//'));
      expect(commented, `${componentName} appears only in commented lines:\n${commented.join('\n')}`).toHaveLength(0);
    });
  }

  it('ZakatCalculator is mounted on a /calculator Route', () => {
    expect(appTsx).toMatch(/path=["']\/calculator["']/);
  });
});