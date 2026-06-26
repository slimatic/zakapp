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

1|import { describe, it, expect } from 'vitest';
2|import { setupCommand } from '../src/commands/setup';
3|
4|describe('Setup Command', () => {
5|  it('should be defined', () => {
6|    expect(setupCommand).toBeDefined();
7|  });
8|
9|  it('should have the correct name', () => {
10|    expect(setupCommand.name()).toBe('setup');
11|  });
12|
13|  it('should have the correct description', () => {
14|    expect(setupCommand.description()).toBe('Setup Zakapp configuration');
15|  });
16|});
17|