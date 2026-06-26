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
5|import chalk from 'chalk';
6|
7|// Mock dependencies
8|vi.mock('inquirer');
9|vi.mock('../src/config', async () => {
10|  const actual = await vi.importActual('../src/config');
11|  return {
12|    ...actual,
13|    loadConfig: vi.fn(),
14|    saveConfig: vi.fn(),
15|  };
16|});
17|
18|// Mock console.log to avoid clutter
19|const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
20|
21|describe('Setup Command Interaction', () => {
22|  beforeEach(() => {
23|    vi.resetAllMocks();
24|  });
25|
26|  it('should load existing config and use it as defaults', async () => {
27|    // Arrange
28|    const existingConfig = {
29|      currency: 'EUR',
30|      language: 'ar',
31|      zakatMethod: 'hanafi',
32|      calendarType: 'solar',
33|    };
34|    (configModule.loadConfig as any).mockReturnValue(existingConfig);
35|    
36|    // Mock inquirer to return a promise that resolves to answers
37|    const promptSpy = vi.spyOn(inquirer, 'prompt').mockResolvedValue({
38|      continue: true,
39|      currency: 'EUR',
40|      language: 'ar',
41|      zakatMethod: 'hanafi',
42|      calendarType: 'solar',
43|    });
44|
45|    // Act
46|    await setupCommand.parseAsync(['node', 'test', 'setup']);
47|
48|    // Assert
49|    expect(configModule.loadConfig).toHaveBeenCalled();
50|    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Existing configuration found'));
51|    
52|    // Check if defaults were passed correctly to inquirer
53|    const calls = promptSpy.mock.calls;
54|    expect(calls.length).toBeGreaterThan(0);
55|    const questions = calls[0][0] as any[];
56|    
57|    const currencyQ = questions.find(q => q.name === 'currency');
58|    expect(currencyQ.default).toBe('EUR');
59|    
60|    const languageQ = questions.find(q => q.name === 'language');
61|    expect(languageQ.default).toBe('ar');
62|
63|    expect(configModule.saveConfig).toHaveBeenCalledWith(existingConfig);
64|  });
65|
66|  it('should use default config if no existing config found', async () => {
67|    // Arrange
68|    (configModule.loadConfig as any).mockReturnValue(null);
69|    
70|    const promptSpy = vi.spyOn(inquirer, 'prompt').mockResolvedValue({
71|      continue: true,
72|      currency: 'USD',
73|      language: 'en',
74|      zakatMethod: 'standard',
75|      calendarType: 'lunar',
76|    });
77|
78|    // Act
79|    await setupCommand.parseAsync(['node', 'test', 'setup']);
80|
81|    // Assert
82|    expect(configModule.loadConfig).toHaveBeenCalled();
83|    
84|    const questions = (promptSpy.mock.calls[0][0] as any[]);
85|    const currencyQ = questions.find(q => q.name === 'currency');
86|    expect(currencyQ.default).toBe(configModule.DEFAULT_CONFIG.currency);
87|  });
88|
89|  it('should save the new configuration', async () => {
90|    // Arrange
91|    (configModule.loadConfig as any).mockReturnValue(null);
92|    
93|    const newAnswers = {
94|      continue: true,
95|      currency: 'GBP',
96|      language: 'en',
97|      zakatMethod: 'shafii',
98|      calendarType: 'lunar',
99|    };
100|    
101|    vi.spyOn(inquirer, 'prompt').mockResolvedValue(newAnswers);
102|
103|    // Act
104|    await setupCommand.parseAsync(['node', 'test', 'setup']);
105|
106|    // Assert
107|    const expectedConfig = {
108|      currency: 'GBP',
109|      language: 'en',
110|      zakatMethod: 'shafii',
111|      calendarType: 'lunar',
112|    };
113|    expect(configModule.saveConfig).toHaveBeenCalledWith(expectedConfig);
114|    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Configuration saved successfully'));
115|  });
116|
117|  it('should not save if setup is cancelled', async () => {
118|    // Arrange
119|    (configModule.loadConfig as any).mockReturnValue(null);
120|    
121|    vi.spyOn(inquirer, 'prompt').mockResolvedValue({
122|      continue: false
123|    });
124|
125|    // Act
126|    await setupCommand.parseAsync(['node', 'test', 'setup']);
127|
128|    // Assert
129|    expect(configModule.saveConfig).not.toHaveBeenCalled();
130|    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Setup cancelled'));
131|  });
132|});
133|