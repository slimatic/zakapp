#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

/**
 * Development script to clear all user data and database files for testing
 * This script provides a clean slate for development and testing
 */

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bright: '\x1b[1m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logInfo(message) {
  log(`ℹ️  ${message}`, colors.blue);
}

function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
}

function logWarning(message) {
  log(`⚠️  ${message}`, colors.yellow);
}

function logError(message) {
  log(`❌ ${message}`, colors.red);
}

/**
 * Check if we're in a safe environment to run this script
 */
function checkEnvironment() {
  // Check NODE_ENV
  const nodeEnv = process.env.NODE_ENV;
  if (nodeEnv === 'production') {
    logError('This script cannot be run in production environment!');
    logError('NODE_ENV is set to "production"');
    process.exit(1);
  }

  // Check if we're in the right directory
  const projectRoot = path.resolve(__dirname, '..');
  const packageJsonPath = path.join(projectRoot, 'package.json');

  if (!fs.existsSync(packageJsonPath)) {
    logError('Could not find package.json in the expected location');
    logError(
      'Please run this script from the project root or scripts directory'
    );
    process.exit(1);
  }

  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    if (packageJson.name !== 'zakapp') {
      logError('This does not appear to be the zakapp project');
      process.exit(1);
    }
  } catch (error) {
    logError('Could not read package.json');
    process.exit(1);
  }

  logSuccess('Environment check passed - safe to proceed');
  return projectRoot;
}

/**
 * Get data directories based on environment configuration
 */
function getDataDirectories(projectRoot) {
  // Check for .env file in backend directory
  const backendEnvPath = path.join(projectRoot, 'backend', '.env');
  let dataDir = path.join(projectRoot, 'backend', 'data'); // Default location

  if (fs.existsSync(backendEnvPath)) {
    try {
      const envContent = fs.readFileSync(backendEnvPath, 'utf8');
      const dataDirMatch = envContent.match(/^DATA_DIR=(.+)$/m);
      if (dataDirMatch) {
        const configuredDataDir = dataDirMatch[1].trim();
        // Handle relative paths
        if (configuredDataDir.startsWith('./')) {
          dataDir = path.join(
            projectRoot,
            'backend',
            configuredDataDir.slice(2)
          );
        } else if (!path.isAbsolute(configuredDataDir)) {
          dataDir = path.join(projectRoot, 'backend', configuredDataDir);
        } else {
          dataDir = configuredDataDir;
        }
      }
    } catch (error) {
      logWarning(
        'Could not read backend .env file, using default data directory'
      );
    }
  }

  const usersDir = path.join(dataDir, 'users');
  const backupsDir = path.join(dataDir, 'backups');
  const sessionsDir = path.join(dataDir, 'sessions');

  return {
    dataDir,
    usersDir,
    backupsDir,
    sessionsDir,
  };
}

/**
 * Safely remove directory and all its contents
 */
async function removeDirectory(dirPath, description) {
  if (!fs.existsSync(dirPath)) {
    logInfo(`${description} directory does not exist: ${dirPath}`);
    return { removed: false, reason: 'not_found' };
  }

  try {
    const stats = fs.statSync(dirPath);
    if (!stats.isDirectory()) {
      logWarning(
        `${description} path exists but is not a directory: ${dirPath}`
      );
      return { removed: false, reason: 'not_directory' };
    }

    // Count items before deletion
    const items = fs.readdirSync(dirPath);
    const itemCount = items.length;

    if (itemCount === 0) {
      logInfo(`${description} directory is already empty: ${dirPath}`);
      return { removed: false, reason: 'already_empty' };
    }

    // Remove the directory and all contents
    fs.rmSync(dirPath, { recursive: true, force: true });

    // Recreate the empty directory
    fs.mkdirSync(dirPath, { recursive: true });

    logSuccess(
      `${description} cleared (${itemCount} items removed): ${dirPath}`
    );
    return { removed: true, itemCount };
  } catch (error) {
    logError(`Failed to clear ${description}: ${error.message}`);
    return { removed: false, reason: 'error', error };
  }
}

/**
 * List directory contents for confirmation
 */
function listDirectoryContents(dirPath, description) {
  if (!fs.existsSync(dirPath)) {
    logInfo(`${description}: Directory not found`);
    return [];
  }

  try {
    const items = fs.readdirSync(dirPath);
    if (items.length === 0) {
      logInfo(`${description}: Empty`);
      return [];
    }

    logInfo(`${description}: ${items.length} items found`);
    items.slice(0, 10).forEach(item => {
      log(`  - ${item}`, colors.cyan);
    });

    if (items.length > 10) {
      log(`  ... and ${items.length - 10} more items`, colors.cyan);
    }

    return items;
  } catch (error) {
    logWarning(`Could not list contents of ${description}: ${error.message}`);
    return [];
  }
}

/**
 * Ask for user confirmation
 */
function askConfirmation(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => {
    rl.question(`${question} (y/N): `, answer => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

/**
 * Main function to reset the database
 */
async function resetDatabase() {
  log('\n🧹 zakapp Development Database Reset Tool\n', colors.bright);

  // Environment safety checks
  const projectRoot = checkEnvironment();

  // Get data directories
  const { dataDir, usersDir, backupsDir, sessionsDir } =
    getDataDirectories(projectRoot);

  log('\n📁 Data Directory Configuration:', colors.bright);
  logInfo(`Data directory: ${dataDir}`);
  logInfo(`Users directory: ${usersDir}`);
  logInfo(`Backups directory: ${backupsDir}`);
  logInfo(`Sessions directory: ${sessionsDir}`);

  // Show current state
  log('\n📊 Current Data State:', colors.bright);
  const userItems = listDirectoryContents(usersDir, 'Users');
  const backupItems = listDirectoryContents(backupsDir, 'Backups');
  const sessionItems = listDirectoryContents(sessionsDir, 'Sessions');

  const totalItems =
    userItems.length + backupItems.length + sessionItems.length;

  if (totalItems === 0) {
    logSuccess('All directories are already empty - nothing to clear!');
    process.exit(0);
  }

  // Ask for confirmation
  log(
    '\n⚠️  WARNING: This will permanently delete all development data!',
    colors.red
  );
  logWarning('This action cannot be undone.');

  const confirmed = await askConfirmation(
    '\nDo you want to proceed with clearing all data?'
  );

  if (!confirmed) {
    logInfo('Operation cancelled by user');
    process.exit(0);
  }

  // Perform the reset
  log('\n🗑️  Clearing data directories...', colors.bright);

  const results = {
    users: await removeDirectory(usersDir, 'Users'),
    backups: await removeDirectory(backupsDir, 'Backups'),
    sessions: await removeDirectory(sessionsDir, 'Sessions'),
  };

  // Summary
  log('\n📋 Summary:', colors.bright);
  let totalCleared = 0;

  Object.entries(results).forEach(([type, result]) => {
    if (result.removed) {
      logSuccess(`${type}: ${result.itemCount} items cleared`);
      totalCleared += result.itemCount;
    } else {
      const reason =
        result.reason === 'not_found'
          ? 'not found'
          : result.reason === 'already_empty'
            ? 'already empty'
            : result.reason === 'not_directory'
              ? 'not a directory'
              : 'failed';
      logInfo(`${type}: ${reason}`);
    }
  });

  if (totalCleared > 0) {
    logSuccess(
      `\n🎉 Database reset complete! ${totalCleared} total items cleared.`
    );
  } else {
    logInfo(
      '\n✨ No data was cleared (directories were already empty or not found).'
    );
  }

  logInfo('\nYou can now run your application with a clean slate for testing.');
}

// Run the script if called directly
if (require.main === module) {
  resetDatabase().catch(error => {
    logError(`Script failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { resetDatabase };
