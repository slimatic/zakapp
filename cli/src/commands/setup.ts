import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';

export const setupCommand = new Command('setup')
  .description('Setup Zakapp configuration')
  .action(async () => {
    console.log(chalk.blue('Welcome to Zakapp Setup Wizard!'));
    
    const answers = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'continue',
        message: 'Do you want to proceed with the setup?',
        default: true
      }
    ]);

    if (answers.continue) {
      console.log(chalk.green('Setup starting...'));
    } else {
      console.log(chalk.yellow('Setup cancelled.'));
    }
  });
