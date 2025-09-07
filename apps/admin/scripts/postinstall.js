#!/usr/bin/env node

/**
 * Post-install script for @captify/core
 * This script runs after npm install and ensures the app is properly registered
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

async function installCoreApp() {
  console.log("🚀 Installing @captify/core app...");

  try {
    // Check if we're in a captify workspace
    const packageJsonPath = path.resolve(process.cwd(), "../../package.json");

    if (!fs.existsSync(packageJsonPath)) {
      console.log("ℹ️  Not in a captify workspace, skipping app registration");
      return;
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));

    if (packageJson.name !== "captify-platform") {
      console.log(
        "ℹ️  Not in captify-platform workspace, skipping app registration"
      );
      return;
    }

    // Read the core app manifest
    const manifestPath = path.resolve(__dirname, "../src/captify.manifest.ts");

    if (!fs.existsSync(manifestPath)) {
      console.log("⚠️  Core app manifest not found, creating default");
      await createDefaultManifest(manifestPath);
    }

    // Create installation marker
    const installMarkerPath = path.resolve(__dirname, "../.installed");
    fs.writeFileSync(
      installMarkerPath,
      JSON.stringify({
        installedAt: new Date().toISOString(),
        version: require("../package.json").version,
      })
    );

    console.log("✅ @captify/core app installed successfully");
    console.log("📝 App manifest: packages/core/src/captify.manifest.ts");
    console.log(
      "🔧 Configure your environment variables for AWS Identity Pool"
    );
  } catch (error) {
    console.error("❌ Error installing @captify/core app:", error.message);
    process.exit(1);
  }
}

async function createDefaultManifest(manifestPath) {
  const defaultManifest = `/**
 * @captify/core App Manifest
 * Configuration and metadata for the core Captify application
 */

import { CaptifyManifest } from '../../src/types';

export const manifest: CaptifyManifest = {
  name: "Captify Core",
  slug: "core",
  version: "1.0.0",
  description: "Core services and components for the Captify platform",
  
  // Database schema
  schema: {
    tables: [
      {
        name: "Applications",
        partitionKey: "appId",
        attributes: {
          appId: "S",
          slug: "S",
          name: "S",
          identityPoolId: "S",
          status: "S"
        }
      },
      {
        name: "UserState", 
        partitionKey: "userStateId",
        sortKey: "userId",
        attributes: {
          userStateId: "S",
          userId: "S",
          favoriteApps: "SS",
          theme: "S"
        }
      }
    ]
  },
  
  // Required permissions
  permissions: [
    "cognito:GetCredentialsForIdentity",
    "dynamodb:Query",
    "dynamodb:Scan",
    "dynamodb:GetItem",
    "dynamodb:PutItem",
    "dynamodb:UpdateItem"
  ]
};

// AWS Configuration
export const awsConfig = {
  identityPoolId: process.env.COGNITO_IDENTITY_POOL_CORE,
  region: process.env.AWS_REGION || "us-east-1"
};
`;

  fs.writeFileSync(manifestPath, defaultManifest);
}

// Run the installation when script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  installCoreApp();
}

export { installCoreApp };
