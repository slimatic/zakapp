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
 * The settings tab must live in the URL.
 *
 * It was component state only, so every visit landed on Profile no matter what the
 * user came for - there was no way to link anyone to the backup controls, and a
 * refresh threw you back to Profile. For a screen whose main job is "go to Settings
 * and export", that made the one documented recovery step awkward to reach.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const src = readFileSync(
  resolve(__dirname, '../../pages/settings/SettingsPage.tsx'),
  'utf8'
);

describe('settings tabs are addressable', () => {
  it('reads and writes the tab via the URL', () => {
    expect(src).toContain('useSearchParams');
    expect(src).toContain("searchParams.get('tab')");
    expect(src).toContain('setSearchParams');
  });

  it('falls back to profile for an unknown or missing tab', () => {
    // A hand-edited ?tab=nonsense must not render a blank content area.
    expect(src).toMatch(/TAB_IDS\.includes\(requested\)\s*\?\s*requested\s*:\s*'profile'/);
  });

  it('does not push a history entry per tab switch', () => {
    // replace:true, or Back would walk through every tab the user clicked.
    expect(src).toMatch(/replace:\s*true/);
  });

  it('gives Help & Support its own icon', () => {
    // It previously reused `User`, so Profile and Help rendered identically.
    expect(src).toContain('HelpCircle');
    const helpEntry = src.match(/\{ id: 'help'[^}]*\}/);
    expect(helpEntry).toBeTruthy();
    expect(helpEntry![0]).not.toContain('icon: User');
  });

  it('no longer keeps tab state in component state', () => {
    expect(src).not.toMatch(/useState<SettingsTab>/);
  });
});
