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

import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import crypto from 'crypto';
import { loadConfig, saveConfig, DEFAULT_CONFIG, UserConfig } from '../config';
import { ZAKAT_METHODS } from '@zakapp/shared';

export const setupCommand = new Command('setup')
  .description('Setup Zakapp configuration')
  .action(async () => {
    console.log(chalk.blue('Welcome to Zakapp Setup Wizard!'));

    const existingConfig = loadConfig();
    const defaults = existingConfig || DEFAULT_CONFIG;

    if (existingConfig) {
      console.log(chalk.yellow('Existing configuration found. You can update it now.'));
    }

    const answers = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'continue',
        message: 'Do you want to proceed with the setup?',
        default: true
      },
      {
        type: 'input',
        name: 'currency',
        message: 'Enter your preferred currency (e.g., USD, EUR):',
        default: defaults.currency,
        when: (answers) => answers.continue
      },
      {
        type: 'list',
        name: 'language',
        message: 'Select your preferred language:',
        choices: ['en', 'ar', 'ur'],
        default: defaults.language,
        when: (answers) => answers.continue
      },
      {
        type: 'list',
        name: 'zakatMethod',
        message: 'Select your Zakat calculation method:',
        choices: Object.values(ZAKAT_METHODS).map(method => ({
          name: method.name,
          value: method.id
        })),
        default: defaults.zakatMethod,
        when: (answers) => answers.continue
      },
      {
        type: 'list',
        name: 'calendarType',
        message: 'Select your preferred calendar type:',
        choices: ['lunar', 'solar'],
        default: defaults.calendarType,
        when: (answers) => answers.continue
      }
    ]);

    if (answers.continue) {
      const securityKeys = defaults.securityKeys || {
        encryptionKey: crypto.randomBytes(32).toString('hex'),
        jwtSecret: crypto.randomBytes(32).toString('hex')
      };

      const newConfig: UserConfig = {
        currency: answers.currency,
        language: answers.language,
        zakatMethod: answers.zakatMethod,
        calendarType: answers.calendarType,
        securityKeys
      };

      saveConfig(newConfig);
      console.log(chalk.green('Configuration saved successfully!'));
      console.log(chalk.green('Security keys generated.'));
      console.log(chalk.gray(JSON.stringify(newConfig, null, 2)));
    } else {
      console.log(chalk.yellow('Setup cancelled.'));
    }
  });
