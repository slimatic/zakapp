/**
 * Copyright (c) 2024-2026 ZakApp Contributors
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
import { setupCommand } from '../src/commands/setup';

describe('Setup Command', () => {
  it('should be defined', () => {
    expect(setupCommand).toBeDefined();
  });

  it('should have the correct name', () => {
    expect(setupCommand.name()).toBe('setup');
  });

  it('should have the correct description', () => {
    expect(setupCommand.description()).toBe('Setup Zakapp configuration');
  });
});
