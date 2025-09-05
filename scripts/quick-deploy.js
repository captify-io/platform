#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync } from 'fs';

const APP_NAME = 'anautics-ai';
const ENV_ID = 'e-2ng9ryhf3p';
const REGION = 'us-east-1';

console.log('🚀 Quick Deploy - Skipping to S3 Upload...\n');

function runCommand(command, description) {
  console.log(`📋 ${description}...`);
  try {
    execSync(command, { stdio: 'inherit', shell: true });
    console.log(`✅ ${description} completed\n`);
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
    process.exit(1);
  }
}

function runCommandSilent(command) {
  try {
    return execSync(command, { stdio: 'pipe', shell: true }).toString().trim();
  } catch (error) {
    return null;
  }
}

async function main() {
  try {
    // Check if deployment package exists
    if (!existsSync('captify-deployment.zip')) {
      console.log('📦 ZIP package not found. Creating it...');
      runCommand(
        `powershell -Command "Compress-Archive -Path 'deploy-package\\*' -DestinationPath 'captify-deployment.zip' -Force"`,
        'Creating ZIP package'
      );
    }

    // Step 1: Upload to S3
    console.log('📤 Uploading to S3...');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const s3Key = `deployments/captify-${timestamp}.zip`;
    const bucketName = 'elasticbeanstalk-us-east-1-211125459951';

    runCommand(
      `aws s3 cp "captify-deployment.zip" s3://${bucketName}/${s3Key} --region ${REGION}`,
      'Uploading deployment package to S3'
    );

    // Step 2: Create application version
    console.log('🔄 Creating application version...');
    const versionLabel = `captify-${timestamp}`;

    const createVersionCmd = `aws elasticbeanstalk create-application-version --application-name "${APP_NAME}" --version-label "${versionLabel}" --source-bundle S3Bucket="${bucketName}",S3Key="${s3Key}" --region ${REGION}`;

    runCommand(createVersionCmd, 'Creating application version');

    // Step 3: Deploy to environment
    console.log('🚢 Deploying to environment...');
    const deployCmd = `aws elasticbeanstalk update-environment --environment-id "${ENV_ID}" --version-label "${versionLabel}" --region ${REGION}`;

    runCommand(deployCmd, 'Deploying to Elastic Beanstalk environment');

    // Step 4: Wait for deployment
    console.log('⏳ Waiting for deployment to complete...');
    const waitCmd = `aws elasticbeanstalk wait environment-updated --environment-ids "${ENV_ID}" --region ${REGION}`;
    
    try {
      runCommand(waitCmd, 'Waiting for environment update');
      console.log('✅ Deployment completed successfully!\n');
    } catch (error) {
      console.log('⚠️  Deployment may still be in progress. Check AWS console for status.\n');
    }

    // Step 5: Show environment status
    console.log('📊 Environment Status:');
    const statusCmd = `aws elasticbeanstalk describe-environments --environment-ids "${ENV_ID}" --region ${REGION} --query "Environments[0].{Status:Status,Health:Health,URL:CNAME}" --output table`;
    
    try {
      runCommand(statusCmd, 'Checking environment status');
    } catch (error) {
      console.log('Could not retrieve environment status');
    }

    // Cleanup
    console.log('🧹 Cleaning up temporary files...');
    if (existsSync('captify-deployment.zip')) {
      runCommand(`del "captify-deployment.zip"`, 'Removing ZIP file');
    }

    console.log('🎉 Deployment completed!');
    console.log(`🌐 Your application should be available at your EB environment URL`);

  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    process.exit(1);
  }
}

main();
