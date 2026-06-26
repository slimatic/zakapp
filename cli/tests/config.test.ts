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

1|import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
2|import fs from 'fs';
3|import path from 'path';
4|import os from 'os';
5|import { loadConfig, saveConfig, DEFAULT_CONFIG, UserConfig } from '../src/config';
6|
7|// Mock fs and os
8|vi.mock('fs');
9|vi.mock('os', () => ({
10|  default: {
11|    homedir: () => '/mock/home',
12|  },
13|  homedir: () => '/mock/home',
14|}));
15|
16|describe('Config Manager', () => {
17|  const mockHomeDir = '/mock/home';
18|  const mockConfigDir = path.join(mockHomeDir, '.zakapp');
19|  const mockConfigFile = path.join(mockConfigDir, 'config.json');
20|
21|  beforeEach(() => {
22|    vi.resetAllMocks();
23|  });
24|
25|  describe('loadConfig', () => {
26|    it('should return null if config file does not exist', () => {
27|      (fs.existsSync as any).mockReturnValue(false);
28|      const config = loadConfig();
29|      expect(config).toBeNull();
30|      expect(fs.existsSync).toHaveBeenCalledWith(mockConfigFile);
31|    });
32|
33|    it('should return parsed config if file exists', () => {
34|      const mockConfig: UserConfig = { ...DEFAULT_CONFIG, currency: 'EUR' };
35|      (fs.existsSync as any).mockReturnValue(true);
36|      (fs.readFileSync as any).mockReturnValue(JSON.stringify(mockConfig));
37|
38|      const config = loadConfig();
39|      expect(config).toEqual(mockConfig);
40|      expect(fs.readFileSync).toHaveBeenCalledWith(mockConfigFile, 'utf-8');
41|    });
42|
43|    it('should return null if file content is invalid JSON', () => {
44|      (fs.existsSync as any).mockReturnValue(true);
45|      (fs.readFileSync as any).mockReturnValue('invalid json');
46|
47|      const config = loadConfig();
48|      expect(config).toBeNull();
49|    });
50|  });
51|
52|  describe('saveConfig', () => {
53|    it('should create directory if it does not exist', () => {
54|      (fs.existsSync as any).mockReturnValue(false);
55|      const newConfig: UserConfig = { ...DEFAULT_CONFIG };
56|
57|      saveConfig(newConfig);
58|
59|      expect(fs.existsSync).toHaveBeenCalledWith(mockConfigDir);
60|      expect(fs.mkdirSync).toHaveBeenCalledWith(mockConfigDir, { recursive: true });
61|      expect(fs.writeFileSync).toHaveBeenCalledWith(
62|        mockConfigFile,
63|        JSON.stringify(newConfig, null, 2),
64|        'utf-8'
65|      );
66|    });
67|
68|    it('should save config to file', () => {
69|      (fs.existsSync as any).mockReturnValue(true);
70|      const newConfig: UserConfig = { ...DEFAULT_CONFIG, language: 'ar' };
71|
72|      saveConfig(newConfig);
73|
74|      expect(fs.mkdirSync).not.toHaveBeenCalled();
75|      expect(fs.writeFileSync).toHaveBeenCalledWith(
76|        mockConfigFile,
77|        JSON.stringify(newConfig, null, 2),
78|        'utf-8'
79|      );
80|    });
81|  });
82|});
83|