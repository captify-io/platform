#!/usr/bin/env node

/**
 * Manifest Builder for @captify/api
 * Rebuilds the package and generates the complete API manifest
 */

const { execSync } = require("child_process");
const { writeFileSync, readFileSync } = require("fs");
const { join } = require("path");

console.log("🚀 Building @captify/api manifest...");

// Step 1: Clean and build the package
console.log("📦 Building package...");
try {
  execSync("npm run clean", { stdio: "inherit", cwd: __dirname });
  execSync("npm run build", { stdio: "inherit", cwd: __dirname });
  console.log("✅ Package built successfully");
} catch (error) {
  console.error("❌ Package build failed:", error.message);
  process.exit(1);
}

// Step 2: Generate the manifest file
console.log("📋 Generating manifest...");

const manifestContent = `// Auto-generated API manifest - DO NOT EDIT MANUALLY
// Generated at: ${new Date().toISOString()}

import { nextAuthHandlers } from "./services/auth.js";
import * as dynamoService from "./services/dynamo.js";
import * as chatService from "./services/chat.js";
import * as s3Service from "./services/s3.js";
import * as neptuneService from "./services/neptune.js";

export interface RouteHandler {
  (request: Request, context?: any): Promise<Response>;
}

export interface ManifestRoute {
  path: string;
  method: string;
  secure?: boolean;
  roles?: string[];
  description?: string;
  handler: RouteHandler;
}

export interface ApplicationManifest {
  slug: string;
  name: string;
  version: string;
  routes: ManifestRoute[];
}

// Auth manifest with NextAuth handlers
export const authManifest: ApplicationManifest = {
  slug: "auth",
  name: "Authentication Service",
  version: "1.0.0",
  routes: [
    {
      path: "/api/auth/[...nextauth]",
      method: "GET",
      secure: false,
      description: "NextAuth GET handler",
      handler: nextAuthHandlers.GET
    },
    {
      path: "/api/auth/[...nextauth]",
      method: "POST",
      secure: false,
      description: "NextAuth POST handler",
      handler: nextAuthHandlers.POST
    }
  ]
};

// API manifest with service handlers
export const apiManifest: ApplicationManifest = {
  slug: "api",
  name: "Core API Services",
  version: "1.0.0",
  routes: [
    // DynamoDB operations
    {
      path: "/api/dynamo/scan",
      method: "POST",
      secure: true,
      description: "Scan DynamoDB table",
      handler: (req) => dynamoService.execute(req, { operation: "scan" })
    },
    {
      path: "/api/dynamo/query",
      method: "POST",
      secure: true,
      description: "Query DynamoDB table",
      handler: (req) => dynamoService.execute(req, { operation: "query" })
    },
    {
      path: "/api/dynamo/get",
      method: "POST",
      secure: true,
      description: "Get item from DynamoDB",
      handler: (req) => dynamoService.execute(req, { operation: "get" })
    },
    {
      path: "/api/dynamo/put",
      method: "POST",
      secure: true,
      description: "Put item to DynamoDB",
      handler: (req) => dynamoService.execute(req, { operation: "put" })
    },
    {
      path: "/api/dynamo/update",
      method: "POST",
      secure: true,
      description: "Update DynamoDB item",
      handler: (req) => dynamoService.execute(req, { operation: "update" })
    },
    {
      path: "/api/dynamo/delete",
      method: "POST",
      secure: true,
      description: "Delete DynamoDB item",
      handler: (req) => dynamoService.execute(req, { operation: "delete" })
    },
    // Chat service operations
    {
      path: "/api/chat/send",
      method: "POST",
      secure: true,
      description: "Send chat message",
      handler: (req) => chatService.execute(req, { operation: "send" })
    },
    {
      path: "/api/chat/history",
      method: "GET",
      secure: true,
      description: "Get chat history",
      handler: (req) => chatService.execute(req, { operation: "history" })
    },
    // S3 operations
    {
      path: "/api/s3/upload",
      method: "POST",
      secure: true,
      description: "Upload file to S3",
      handler: (req) => s3Service.execute(req, { operation: "upload" })
    },
    {
      path: "/api/s3/download",
      method: "GET",
      secure: true,
      description: "Download file from S3",
      handler: (req) => s3Service.execute(req, { operation: "download" })
    },
    // Neptune operations
    {
      path: "/api/neptune/query",
      method: "POST",
      secure: true,
      description: "Query Neptune graph database",
      handler: (req) => neptuneService.execute(req, { operation: "query" })
    }
  ]
};

export const manifests = {
  auth: authManifest,
  api: apiManifest,
};
`;

// Write the manifest file
const manifestPath = join(__dirname, "src", "api.manifest.ts");
writeFileSync(manifestPath, manifestContent, "utf8");

console.log("✅ Manifest generated at:", manifestPath);

// Step 3: Rebuild with the new manifest
console.log("🔄 Rebuilding with manifest...");
try {
  execSync("npm run build", { stdio: "inherit", cwd: __dirname });
  console.log("✅ Package rebuilt with manifest successfully");
} catch (error) {
  console.error("❌ Rebuild failed:", error.message);
  process.exit(1);
}

console.log("🎉 @captify/api manifest build complete!");
