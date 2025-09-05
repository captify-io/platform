#!/usr/bin/env node

import { execSync } from "child_process";
import { existsSync, writeFileSync, mkdirSync, copyFileSync, cpSync } from "fs";
import { join } from "path";

const APP_NAME = "anautics-ai";
const ENV_ID = "e-2ng9ryhf3p";
const REGION = "us-east-1";

console.log("🚀 Starting Simple Next.js Deployment...\n");

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

function createSimpleDeploymentPackage() {
  console.log("📦 Creating simple deployment package...");

  const deployDir = "simple-deploy-package";
  if (existsSync(deployDir)) {
    runCommand(
      `rmdir /s /q "${deployDir}"`,
      "Cleaning previous deployment package"
    );
  }
  mkdirSync(deployDir);

  // Copy .next folder (built Next.js app)
  if (existsSync(".next")) {
    cpSync(".next", join(deployDir, ".next"), { recursive: true });
    console.log("✅ Copied .next directory");
  }

  // Copy public folder (static assets)
  if (existsSync("public")) {
    cpSync("public", join(deployDir, "public"), { recursive: true });
    console.log("✅ Copied public directory");
  }

  // Copy environment files if they exist
  if (existsSync(".env.local")) {
    copyFileSync(".env.local", join(deployDir, ".env.local"));
    console.log("✅ Copied .env.local");
  }
  if (existsSync(".env.production")) {
    copyFileSync(".env.production", join(deployDir, ".env.production"));
    console.log("✅ Copied .env.production");
  }

  // Copy Next.js config
  if (existsSync("next.config.ts")) {
    copyFileSync("next.config.ts", join(deployDir, "next.config.ts"));
    console.log("✅ Copied next.config.ts");
  }

  // Create minimal package.json for EB (following Medium article approach)
  const simplePackageJson = {
    name: "captify-platform",
    version: "1.0.0",
    scripts: {
      start: "node app.js",
    },
    dependencies: {
      next: "15.5.2",
      react: "19.1.1",
      "react-dom": "19.1.1",
      "@aws-sdk/client-cognito-identity": "^3.876.0",
      "@aws-sdk/client-cognito-identity-provider": "^3.873.0",
      "@aws-sdk/client-dynamodb": "^3.873.0",
      "@aws-sdk/client-s3": "^3.873.0",
      "@aws-sdk/credential-providers": "^3.873.0",
      "@aws-sdk/lib-dynamodb": "^3.873.0",
      "next-auth": "5.0.0-beta.29",
      "next-themes": "^0.4.6",
      clsx: "^2.1.1",
      "lucide-react": "^0.542.0",
      "tailwind-merge": "^3.3.1",
      tailwindcss: "^4.1.12",
      "@tailwindcss/postcss": "^4.1.12",
      postcss: "^8.5.6",
      uuid: "^11.1.0",
    },
    engines: {
      node: ">=20.0.0",
    },
  };

  writeFileSync(
    join(deployDir, "package.json"),
    JSON.stringify(simplePackageJson, null, 2)
  );
  console.log("✅ Created simplified package.json");

  // Create app.js entry point for EB Node.js platform
  const appJsContent = `const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 8080;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  }).listen(port, (err) => {
    if (err) throw err;
    console.log(\`> Ready on http://\${hostname}:\${port}\`);
  });
});`;

  writeFileSync(join(deployDir, "app.js"), appJsContent);
  console.log("✅ Created app.js entry point");

  console.log("✅ Simple deployment package created\n");
  return deployDir;
}

function createZipPackage(deployDir) {
  console.log("📦 Creating ZIP package...");
  const zipFile = "simple-captify-deployment.zip";

  if (existsSync(zipFile)) {
    runCommand(`del "${zipFile}"`, "Removing old ZIP file");
  }

  // CRITICAL: Must ZIP the contents FROM WITHIN the directory, not the directory itself
  // This ensures no parent folder is created in the ZIP
  runCommand(
    `powershell -Command "cd '${deployDir}'; Compress-Archive -Path '.' -DestinationPath '../${zipFile}' -Force"`,
    "Creating ZIP package without parent directory"
  );

  if (!existsSync(zipFile)) {
    throw new Error("Failed to create ZIP package");
  }

  console.log("✅ ZIP package created\n");
  return zipFile;
}

function uploadToS3(zipFile) {
  console.log("📤 Uploading to S3...");

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const s3Key = `deployments/simple-captify-${timestamp}.zip`;
  const bucketName = "elasticbeanstalk-us-east-1-211125459951";

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
  const versionLabel = `simple-captify-${timestamp}`;

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
    // Verify AWS credentials
    console.log("🔍 Verifying AWS configuration...");
    const accountInfo = runCommandSilent(
      `aws sts get-caller-identity --query "Account" --output text --region ${REGION}`
    );
    if (!accountInfo) {
      console.error("❌ AWS credentials not configured or invalid");
      process.exit(1);
    }
    console.log(`✅ AWS Account: ${accountInfo}\n`);

    // Verify .next folder exists (app should be built)
    if (!existsSync(".next")) {
      console.error(
        '❌ .next folder not found. Please run "pnpm run build" first.'
      );
      process.exit(1);
    }
    console.log("✅ Next.js build found\n");

    // Create simple deployment package
    const deployDir = createSimpleDeploymentPackage();

    // Create ZIP package
    const zipFile = createZipPackage(deployDir);

    // Upload to S3
    const s3Location = uploadToS3(zipFile);

    // Create application version
    const versionLabel = createApplicationVersion(s3Location);

    // Deploy to environment
    deployToEnvironment(versionLabel);

    // Wait and show status
    waitForDeployment();
    showEnvironmentStatus();

    // Cleanup
    console.log("🧹 Cleaning up temporary files...");
    runCommand(`rmdir /s /q "${deployDir}"`, "Removing deployment directory");
    runCommand(`del "${zipFile}"`, "Removing ZIP file");

    console.log("🎉 Simple deployment completed!");
    console.log(
      `🌐 Check your application at: http://anautics-ai.us-east-1.elasticbeanstalk.com`
    );
  } catch (error) {
    console.error("❌ Deployment failed:", error.message);
    process.exit(1);
  }
}

main();
