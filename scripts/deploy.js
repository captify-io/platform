#!/usr/bin/env node

import { execSync } from "child_process";
import {
  existsSync,
  writeFileSync,
  mkdirSync,
  statSync,
  readFileSync,
} from "fs";
import * as fs from "fs";
import { join } from "path";

const APP_NAME = "anautics-ai";
const ENV_ID = "e-2ng9ryhf3p";
const REGION = "us-east-1";

console.log("🚀 Starting Captify Platform Deployment...\n");

function runCommand(command, description) {
  console.log(`📋 ${description}...`);
  try {
    execSync(command, { stdio: "inherit", shell: true });
    console.log(`✅ ${description} completed\n`);
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
    process.exit(1);
  }
}

function runCommandSilent(command) {
  try {
    return execSync(command, { stdio: "pipe", shell: true }).toString().trim();
  } catch (error) {
    return null;
  }
}

function createDeploymentPackage() {
  console.log("📦 Creating deployment package...");

  // Create deployment directory
  const deployDir = "deploy-package";
  if (existsSync(deployDir)) {
    runCommand(`rimraf ${deployDir}`, "Cleaning previous deployment package");
  }
  mkdirSync(deployDir);

  // Copy necessary files (based on successful Next.js EB deployment pattern)
  const filesToCopy = [
    ".next",
    "public",
    "package.json",
    "next.config.ts",
    "package-lock.json",
  ];

  filesToCopy.forEach((file) => {
    if (existsSync(file)) {
      // Check if it's actually a directory using filesystem
      const stats = statSync(file);
      if (stats.isDirectory()) {
        runCommand(
          `xcopy "${file}" "${deployDir}\\${file}" /E /I /H /Y`,
          `Copying ${file} directory`
        );
      } else {
        runCommand(`copy "${file}" "${deployDir}\\"`, `Copying ${file}`);
      }
    }
  });

  // Copy environment file if it exists
  if (existsSync(".env.local")) {
    runCommand(
      `copy ".env.local" "${deployDir}\\.env"`,
      "Copying environment file"
    );
  }

  // Create or update package.json with proper EB start script
  const originalPackageJson = JSON.parse(
    fs.readFileSync("package.json", "utf8")
  );
  const deployPackageJson = {
    ...originalPackageJson,
    scripts: {
      ...originalPackageJson.scripts,
      start: "next start -p ${PORT:-8080}",
    },
    // Remove pnpm-specific fields that might cause issues
    packageManager: undefined,
    workspaces: undefined,
  };

  // Clean up undefined fields
  Object.keys(deployPackageJson).forEach((key) => {
    if (deployPackageJson[key] === undefined) {
      delete deployPackageJson[key];
    }
  });

  writeFileSync(
    join(deployDir, "package.json"),
    JSON.stringify(deployPackageJson, null, 2)
  );
  console.log("✅ Deployment package created\n");
  return deployDir;
}

function createZipPackage(deployDir) {
  console.log("📦 Creating ZIP package...");
  const zipFile = "captify-deployment.zip";

  if (existsSync(zipFile)) {
    runCommand(`del "${zipFile}"`, "Removing old ZIP file");
  }

  // Use PowerShell to create ZIP (built into Windows)
  runCommand(
    `powershell -Command "Compress-Archive -Path '${deployDir}\\*' -DestinationPath '${zipFile}' -Force"`,
    "Creating ZIP package"
  );

  console.log("✅ ZIP package created\n");
  return zipFile;
}

function uploadToS3(zipFile) {
  console.log("📤 Uploading to S3...");

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const s3Key = `deployments/captify-${timestamp}.zip`;
  const bucketName = "elasticbeanstalk-us-east-1-211125459951";

  // Upload to S3
  runCommand(
    `aws s3 cp "${zipFile}" s3://${bucketName}/${s3Key} --region ${REGION}`,
    "Uploading deployment package to S3"
  );

  console.log("✅ Upload completed\n");
  return { bucket: bucketName, key: s3Key };
}

function createApplicationVersion(s3Location) {
  console.log("🔄 Creating application version...");

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const versionLabel = `captify-${timestamp}`;

  const createVersionCmd = `aws elasticbeanstalk create-application-version --application-name "${APP_NAME}" --version-label "${versionLabel}" --source-bundle S3Bucket="${s3Location.bucket}",S3Key="${s3Location.key}" --region ${REGION}`;

  runCommand(createVersionCmd, "Creating application version");

  console.log("✅ Application version created\n");
  return versionLabel;
}

function deployToEnvironment(versionLabel) {
  console.log("🚢 Deploying to environment...");

  const deployCmd = `aws elasticbeanstalk update-environment --environment-id "${ENV_ID}" --version-label "${versionLabel}" --region ${REGION}`;

  runCommand(deployCmd, "Deploying to Elastic Beanstalk environment");

  console.log("✅ Deployment initiated\n");
}

function waitForDeployment() {
  console.log("⏳ Waiting for deployment to complete...");

  const waitCmd = `aws elasticbeanstalk wait environment-updated --environment-ids "${ENV_ID}" --region ${REGION}`;

  try {
    runCommand(waitCmd, "Waiting for environment update");
    console.log("✅ Deployment completed successfully!\n");
  } catch (error) {
    console.log(
      "⚠️  Deployment may still be in progress. Check AWS console for status.\n"
    );
  }
}

function showEnvironmentStatus() {
  console.log("📊 Environment Status:");
  const statusCmd = `aws elasticbeanstalk describe-environments --environment-ids "${ENV_ID}" --region ${REGION} --query "Environments[0].{Status:Status,Health:Health,URL:CNAME}" --output table`;

  try {
    runCommand(statusCmd, "Checking environment status");
  } catch (error) {
    console.log("Could not retrieve environment status");
  }
}

async function main() {
  try {
    // Step 1: Verify AWS credentials and environment
    console.log("🔍 Verifying AWS configuration...");
    const accountInfo = runCommandSilent(
      `aws sts get-caller-identity --query "Account" --output text --region ${REGION}`
    );
    if (!accountInfo) {
      console.error("❌ AWS credentials not configured or invalid");
      console.log("Please run: aws configure");
      process.exit(1);
    }
    console.log(`✅ AWS Account: ${accountInfo}\n`);

    // Step 2: Verify EB environment exists
    console.log("🔍 Verifying EB environment...");
    const envCheck = runCommandSilent(
      `aws elasticbeanstalk describe-environments --environment-ids ${ENV_ID} --region ${REGION} --query "Environments[0].EnvironmentName" --output text`
    );
    if (!envCheck || envCheck === "None") {
      console.error(`❌ Environment ${ENV_ID} not found or not accessible`);
      process.exit(1);
    }
    console.log(`✅ Environment verified: ${envCheck}\n`);

    // Step 3: Build the application
    runCommand("pnpm run deploy:build", "Building application for production");

    // Step 4: Create deployment package
    const deployDir = createDeploymentPackage();

    // Step 5: Create ZIP package
    const zipFile = createZipPackage(deployDir);

    // Step 6: Upload to S3
    const s3Location = uploadToS3(zipFile);

    // Step 7: Create application version
    const versionLabel = createApplicationVersion(s3Location);

    // Step 8: Deploy to environment
    deployToEnvironment(versionLabel);

    // Step 9: Wait for deployment and show status
    waitForDeployment();
    showEnvironmentStatus();

    // Cleanup
    console.log("🧹 Cleaning up temporary files...");
    runCommand(`rimraf ${deployDir}`, "Removing deployment directory");
    runCommand(`del "${zipFile}"`, "Removing ZIP file");

    console.log("🎉 Deployment completed successfully!");
    console.log(
      `🌐 Your application should be available at your EB environment URL`
    );
  } catch (error) {
    console.error("❌ Deployment failed:", error.message);
    process.exit(1);
  }
}

main();
