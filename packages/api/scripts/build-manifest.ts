/**
 * Manifest Builder for @captify/api
 * Combines routes with service handlers to create complete API manifest
 */
import { writeFileSync } from "fs";
import { join } from "path";

const manifestContent = `// Auto-generated API manifest - DO NOT EDIT MANUALLY
// Generated at: ${new Date().toISOString()}

import { authRoutes, apiRoutes } from "./routes.js";
import { nextAuthHandlers } from "./services/auth.js";
import * as dynamoService from "./services/dynamo.js";
import * as chatService from "./services/chat.js";
import * as s3Service from "./services/s3.js";
import * as neptuneService from "./services/neptune.js";
import { CaptifyApi } from "./CaptifyApi.js";

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

// Service handler mapping
const serviceHandlers = {
  auth: {
    nextauth: nextAuthHandlers.GET, // NextAuth handles routing internally
  },
  dynamo: {
    scan: (req: Request) => dynamoService.execute(req, { operation: "scan" }),
    query: (req: Request) => dynamoService.execute(req, { operation: "query" }),
    get: (req: Request) => dynamoService.execute(req, { operation: "get" }),
    put: (req: Request) => dynamoService.execute(req, { operation: "put" }),
    update: (req: Request) => dynamoService.execute(req, { operation: "update" }),
    delete: (req: Request) => dynamoService.execute(req, { operation: "delete" }),
  },
  chat: {
    send: (req: Request) => chatService.execute(req, { operation: "send" }),
    history: (req: Request) => chatService.execute(req, { operation: "history" }),
  },
  s3: {
    upload: (req: Request) => s3Service.execute(req, { operation: "upload" }),
    download: (req: Request) => s3Service.execute(req, { operation: "download" }),
  },
  neptune: {
    query: (req: Request) => neptuneService.execute(req, { operation: "query" }),
  }
};

// Build auth manifest
export const authManifest: ApplicationManifest = {
  slug: "auth",
  name: "Authentication Service",
  version: "1.0.0",
  routes: authRoutes.map(route => ({
    path: route.path,
    method: route.method,
    secure: route.secure,
    roles: route.roles,
    description: route.description,
    handler: serviceHandlers[route.service as keyof typeof serviceHandlers][route.operation]
  }))
};

// Build API manifest  
export const apiManifest: ApplicationManifest = {
  slug: "api",
  name: "Core API Services",
  version: "1.0.0",
  routes: apiRoutes.map(route => ({
    path: route.path,
    method: route.method,
    secure: route.secure,
    roles: route.roles,
    description: route.description,
    handler: serviceHandlers[route.service as keyof typeof serviceHandlers][route.operation]
  }))
};

export const manifests = {
  auth: authManifest,
  api: apiManifest,
};

// Export the CaptifyApi for direct usage
export { CaptifyApi };
`;

// Write the manifest file
const outputPath = join(process.cwd(), "src", "api.manifest.ts");
writeFileSync(outputPath, manifestContent, "utf8");

console.log("✅ API Manifest generated successfully at:", outputPath);
