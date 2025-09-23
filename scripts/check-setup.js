#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Check if the development environment is properly set up
 * and install/build dependencies if needed
 */
function checkSetup() {
  const projectRoot = path.resolve(__dirname, '..');
  const sharedDistPath = path.join(projectRoot, 'shared', 'dist');
  const sharedNodeModulesPath = path.join(
    projectRoot,
    'shared',
    'node_modules'
  );
  const backendNodeModulesPath = path.join(
    projectRoot,
    'backend',
    'node_modules'
  );
  const frontendNodeModulesPath = path.join(
    projectRoot,
    'frontend',
    'node_modules'
  );

  let needsSetup = false;
  const missing = [];

  // Check if shared package is built
  if (!fs.existsSync(sharedDistPath)) {
    missing.push('shared/dist (built shared package)');
    needsSetup = true;
  }

  // Check if dependencies are installed
  if (!fs.existsSync(sharedNodeModulesPath)) {
    missing.push('shared/node_modules');
    needsSetup = true;
  }

  if (!fs.existsSync(backendNodeModulesPath)) {
    missing.push('backend/node_modules');
    needsSetup = true;
  }

  if (!fs.existsSync(frontendNodeModulesPath)) {
    missing.push('frontend/node_modules');
    needsSetup = true;
  }

  if (needsSetup) {
    console.log('🔧 Development environment not properly set up.');
    console.log('Missing:', missing.join(', '));
    console.log('');
    console.log('🚀 Running setup automatically...');
    console.log('This may take a few minutes on first run.');
    console.log('');

    try {
      execSync('npm run install:all', { stdio: 'inherit', cwd: projectRoot });
      console.log('');
      console.log('✅ Setup completed successfully!');
      console.log('');
    } catch (error) {
      console.error('❌ Setup failed:', error.message);
      console.log('');
      console.log('Please run manually:');
      console.log('  npm run install:all');
      console.log('');
      process.exit(1);
    }
  } else {
    console.log('✅ Development environment is ready!');
  }
}

// Run the check if this script is executed directly
if (require.main === module) {
  checkSetup();
}

module.exports = { checkSetup };
