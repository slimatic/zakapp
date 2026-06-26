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

1|import { describe, it, expect, vi, beforeEach } from 'vitest';
2|import inquirer from 'inquirer';
3|import { setupCommand } from '../src/commands/setup';
4|import * as configModule from '../src/config';
5|
6|// Mock dependencies
7|vi.mock('inquirer');
8|vi.mock('../src/config', async () => {
9|  const actual = await vi.importActual('../src/config');
10|  return {
11|    ...actual,
12|    loadConfig: vi.fn(),
13|    saveConfig: vi.fn(),
14|  };
15|});
16|
17|// Mock console.log to avoid clutter
18|const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
19|
20|describe('Setup Command - Security Keys', () => {
21|  beforeEach(() => {
22|    vi.resetAllMocks();
23|  });
24|
25|  it('should generate security keys if they do not exist', async () => {
26|    // Arrange
27|    (configModule.loadConfig as any).mockReturnValue(null);
28|    
29|    const newAnswers = {
30|      continue: true,
31|      currency: 'GBP',
32|      language: 'en',
33|      zakatMethod: 'standard',
34|      calendarType: 'lunar',
35|    };
36|    
37|    vi.spyOn(inquirer, 'prompt').mockResolvedValue(newAnswers);
38|
39|    // Act
40|    await setupCommand.parseAsync(['node', 'test', 'setup']);
41|
42|    // Assert
43|    expect(configModule.saveConfig).toHaveBeenCalled();
44|    const savedConfig = (configModule.saveConfig as any).mock.calls[0][0];
45|    
46|    expect(savedConfig.securityKeys).toBeDefined();
47|    expect(savedConfig.securityKeys.encryptionKey).toBeDefined();
48|    expect(savedConfig.securityKeys.jwtSecret).toBeDefined();
49|    expect(savedConfig.securityKeys.encryptionKey).toHaveLength(64); // 32 bytes hex
50|    expect(savedConfig.securityKeys.jwtSecret).toHaveLength(64); // 32 bytes hex
51|    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Security keys generated'));
52|  });
53|
54|  it('should preserve existing security keys', async () => {
55|    // Arrange
56|    const existingConfig = {
57|      currency: 'EUR',
58|      language: 'ar',
59|      zakatMethod: 'hanafi',
60|      calendarType: 'solar',
61|      securityKeys: {
62|        encryptionKey: 'existing-encryption-key',
63|        jwtSecret: 'existing-jwt-secret'
64|      }
65|    };
66|    (configModule.loadConfig as any).mockReturnValue(existingConfig);
67|    
68|    const newAnswers = {
69|      continue: true,
70|      currency: 'USD',
71|      language: 'en',
72|      zakatMethod: 'shafii',
73|      calendarType: 'lunar',
74|    };
75|    
76|    vi.spyOn(inquirer, 'prompt').mockResolvedValue(newAnswers);
77|
78|    // Act
79|    await setupCommand.parseAsync(['node', 'test', 'setup']);
80|
81|    // Assert
82|    expect(configModule.saveConfig).toHaveBeenCalled();
83|    const savedConfig = (configModule.saveConfig as any).mock.calls[0][0];
84|    
85|    expect(savedConfig.securityKeys).toEqual(existingConfig.securityKeys);
86|    expect(savedConfig.currency).toBe('USD'); // Verify other changes applied
87|  });
88|});
89|