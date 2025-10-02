#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Captify AWS Infrastructure Deployment Tool');

// Check if deploy.sh exists in current directory
const deployScript = path.join(process.cwd(), 'deploy.sh');
const templateScript = path.join(__dirname, '..', 'deploy.sh');

if (!fs.existsSync(deployScript)) {
  console.log('📋 No deploy.sh found in current directory. Creating one...');

  if (fs.existsSync(templateScript)) {
    fs.copyFileSync(templateScript, deployScript);
    console.log('✅ deploy.sh copied to current directory');
  } else {
    console.error('❌ Template deploy.sh not found');
    process.exit(1);
  }
}

// Make script executable
try {
  execSync('chmod +x deploy.sh', { stdio: 'inherit' });
} catch (error) {
  // Windows doesn't need chmod, ignore error
}

// Execute the deployment script
try {
  console.log('🚀 Starting deployment...\n');
  execSync('./deploy.sh', { stdio: 'inherit', cwd: process.cwd() });
} catch (error) {
  console.error('❌ Deployment failed:', error.message);
  process.exit(1);
}