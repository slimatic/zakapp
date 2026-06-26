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

1|import { Command } from 'commander';
2|import chalk from 'chalk';
3|import inquirer from 'inquirer';
4|import crypto from 'crypto';
5|import { loadConfig, saveConfig, DEFAULT_CONFIG, UserConfig } from '../config';
6|import { ZAKAT_METHODS } from '@zakapp/shared';
7|
8|export const setupCommand = new Command('setup')
9|  .description('Setup Zakapp configuration')
10|  .action(async () => {
11|    console.log(chalk.blue('Welcome to Zakapp Setup Wizard!'));
12|
13|    const existingConfig = loadConfig();
14|    const defaults = existingConfig || DEFAULT_CONFIG;
15|
16|    if (existingConfig) {
17|      console.log(chalk.yellow('Existing configuration found. You can update it now.'));
18|    }
19|
20|    const answers = await inquirer.prompt([
21|      {
22|        type: 'confirm',
23|        name: 'continue',
24|        message: 'Do you want to proceed with the setup?',
25|        default: true
26|      },
27|      {
28|        type: 'input',
29|        name: 'currency',
30|        message: 'Enter your preferred currency (e.g., USD, EUR):',
31|        default: defaults.currency,
32|        when: (answers) => answers.continue
33|      },
34|      {
35|        type: 'list',
36|        name: 'language',
37|        message: 'Select your preferred language:',
38|        choices: ['en', 'ar', 'ur'],
39|        default: defaults.language,
40|        when: (answers) => answers.continue
41|      },
42|      {
43|        type: 'list',
44|        name: 'zakatMethod',
45|        message: 'Select your Zakat calculation method:',
46|        choices: Object.values(ZAKAT_METHODS).map(method => ({
47|          name: method.name,
48|          value: method.id
49|        })),
50|        default: defaults.zakatMethod,
51|        when: (answers) => answers.continue
52|      },
53|      {
54|        type: 'list',
55|        name: 'calendarType',
56|        message: 'Select your preferred calendar type:',
57|        choices: ['lunar', 'solar'],
58|        default: defaults.calendarType,
59|        when: (answers) => answers.continue
60|      }
61|    ]);
62|
63|    if (answers.continue) {
64|      const securityKeys = defaults.securityKeys || {
65|        encryptionKey: crypto.randomBytes(32).toString('hex'),
66|        jwtSecret: crypto.randomBytes(32).toString('hex')
67|      };
68|
69|      const newConfig: UserConfig = {
70|        currency: answers.currency,
71|        language: answers.language,
72|        zakatMethod: answers.zakatMethod,
73|        calendarType: answers.calendarType,
74|        securityKeys
75|      };
76|
77|      saveConfig(newConfig);
78|      console.log(chalk.green('Configuration saved successfully!'));
79|      console.log(chalk.green('Security keys generated.'));
80|      console.log(chalk.gray(JSON.stringify(newConfig, null, 2)));
81|    } else {
82|      console.log(chalk.yellow('Setup cancelled.'));
83|    }
84|  });
85|