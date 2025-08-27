/**
 * Manifest Builder for @captify/api
 * TypeScript script to rebuild the package and generate the API manifest
 */

import { execSync } from "child_process";
import { writeFileSync } from "fs";
import { join } from "path";

console.log("🚀 Building @captify/api manifest...");

// Step 1: Generate the manifest file FIRST
console.log("📋 Generating manifest...");

const manifestContent = `// Auto-generated API manifest - DO NOT EDIT MANUALLY
// Generated at: ${new Date().toISOString()}

import { nextAuthHandlers } from "./services/auth";
import * as dynamoService from "./services/dynamo";
import * as chatService from "./services/chat";
import * as s3Service from "./services/s3";
import * as neptuneService from "./services/neptune";

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
      handler: async (req: Request) => {
        // Convert Request to Response using CaptifyApi
        const response = await dynamoService.execute(req as any, {} as any, {} as any);
        return new Response(JSON.stringify(response), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
    },
    {
      path: "/api/dynamo/query",
      method: "POST",
      secure: true,
      description: "Query DynamoDB table",
      handler: async (req: Request) => {
        const response = await dynamoService.execute(req as any, {} as any, {} as any);
        return new Response(JSON.stringify(response), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
    },
    {
      path: "/api/dynamo/get",
      method: "POST",
      secure: true,
      description: "Get item from DynamoDB",
      handler: async (req: Request) => {
        const response = await dynamoService.execute(req as any, {} as any, {} as any);
        return new Response(JSON.stringify(response), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
    },
    {
      path: "/api/dynamo/put",
      method: "POST",
      secure: true,
      description: "Put item to DynamoDB",
      handler: async (req: Request) => {
        const response = await dynamoService.execute(req as any, {} as any, {} as any);
        return new Response(JSON.stringify(response), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
    },
    {
      path: "/api/dynamo/update",
      method: "POST",
      secure: true,
      description: "Update DynamoDB item",
      handler: async (req: Request) => {
        const response = await dynamoService.execute(req as any, {} as any, {} as any);
        return new Response(JSON.stringify(response), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
    },
    {
      path: "/api/dynamo/delete",
      method: "POST",
      secure: true,
      description: "Delete DynamoDB item",
      handler: async (req: Request) => {
        const response = await dynamoService.execute(req as any, {} as any, {} as any);
        return new Response(JSON.stringify(response), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
    },
    // Chat service operations
    {
      path: "/api/chat/send",
      method: "POST",
      secure: true,
      description: "Send chat message",
      handler: async (req: Request) => {
        const response = await chatService.execute(req as any, {} as any, {} as any);
        return new Response(JSON.stringify(response), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
    },
    {
      path: "/api/chat/history",
      method: "GET",
      secure: true,
      description: "Get chat history",
      handler: async (req: Request) => {
        const response = await chatService.execute(req as any, {} as any, {} as any);
        return new Response(JSON.stringify(response), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
    },
    // S3 operations
    {
      path: "/api/s3/upload",
      method: "POST",
      secure: true,
      description: "Upload file to S3",
      handler: async (req: Request) => {
        const response = await s3Service.execute(req as any, {} as any, {} as any);
        return new Response(JSON.stringify(response), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
    },
    {
      path: "/api/s3/download",
      method: "GET",
      secure: true,
      description: "Download file from S3",
      handler: async (req: Request) => {
        const response = await s3Service.execute(req as any, {} as any, {} as any);
        return new Response(JSON.stringify(response), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
    },
    // Neptune operations
    {
      path: "/api/neptune/query",
      method: "POST",
      secure: true,
      description: "Query Neptune graph database",
      handler: async (req: Request) => {
        const response = await neptuneService.execute(req as any, {} as any, {} as any);
        return new Response(JSON.stringify(response), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
  ]
};

export const manifests = {
  auth: authManifest,
  api: apiManifest,
};
`;

// Write the manifest file
const manifestPath = join(process.cwd(), "src", "api.manifest.ts");
writeFileSync(manifestPath, manifestContent, "utf8");
console.log("✅ Manifest generated at:", manifestPath);

// Step 2: Clean and build the package
console.log("� Building package...");
try {
  execSync("npm run clean", { stdio: "inherit" });
  execSync("npm run build", { stdio: "inherit" });
  console.log("✅ Package built successfully");
} catch (error) {
  console.error("❌ Package build failed:", (error as Error).message);
  process.exit(1);
}

console.log("🎉 @captify/api manifest build complete!");
