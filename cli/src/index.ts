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

1|#!/usr/bin/env node
2|import { Command } from 'commander';
3|import { setupCommand } from './commands/setup';
4|
5|const program = new Command();
6|
7|program
8|  .name('zakapp-cli')
9|  .description('CLI wizard for Zakapp')
10|  .version('0.1.0');
11|
12|program.addCommand(setupCommand);
13|
14|program.parse(process.argv);
15|
16|if (!process.argv.slice(2).length) {
17|  program.outputHelp();
18|}
19|