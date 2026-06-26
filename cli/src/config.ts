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

1|import fs from 'fs';
2|import path from 'path';
3|import os from 'os';
4|
5|export interface UserConfig {
6|  currency: string;
7|  language: string;
8|  zakatMethod: string;
9|  calendarType: 'lunar' | 'solar';
10|  securityKeys?: {
11|    encryptionKey: string;
12|    jwtSecret: string;
13|  };
14|}
15|
16|const CONFIG_DIR = path.join(os.homedir(), '.zakapp');
17|const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');
18|
19|export const DEFAULT_CONFIG: UserConfig = {
20|  currency: 'USD',
21|  language: 'en',
22|  zakatMethod: 'standard',
23|  calendarType: 'lunar',
24|};
25|
26|export function loadConfig(): UserConfig | null {
27|  try {
28|    if (!fs.existsSync(CONFIG_FILE)) {
29|      return null;
30|    }
31|    const data = fs.readFileSync(CONFIG_FILE, 'utf-8');
32|    return JSON.parse(data) as UserConfig;
33|  } catch (error) {
34|    return null;
35|  }
36|}
37|
38|export function saveConfig(config: UserConfig): void {
39|  if (!fs.existsSync(CONFIG_DIR)) {
40|    fs.mkdirSync(CONFIG_DIR, { recursive: true });
41|  }
42|  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
43|}
44|