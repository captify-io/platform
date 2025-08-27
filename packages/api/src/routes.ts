/**
 * API Routes Definition
 * Maps API endpoints to service operations
 */

export interface RouteDefinition {
  path: string;
  method: string;
  service: string;
  operation: string;
  secure?: boolean;
  roles?: string[];
  description?: string;
}

// Auth routes - handled by auth service
export const authRoutes: RouteDefinition[] = [
  {
    path: "/api/auth/[...nextauth]",
    method: "GET",
    service: "auth",
    operation: "nextauth",
    secure: false,
    description: "NextAuth GET handler",
  },
  {
    path: "/api/auth/[...nextauth]",
    method: "POST",
    service: "auth",
    operation: "nextauth",
    secure: false,
    description: "NextAuth POST handler",
  },
];

// Core API routes - handled by various services
export const apiRoutes: RouteDefinition[] = [
  // DynamoDB operations
  {
    path: "/api/dynamo/scan",
    method: "POST",
    service: "dynamo",
    operation: "scan",
    secure: true,
    description: "Scan DynamoDB table",
  },
  {
    path: "/api/dynamo/query",
    method: "POST",
    service: "dynamo",
    operation: "query",
    secure: true,
    description: "Query DynamoDB table",
  },
  {
    path: "/api/dynamo/get",
    method: "POST",
    service: "dynamo",
    operation: "get",
    secure: true,
    description: "Get item from DynamoDB",
  },
  {
    path: "/api/dynamo/put",
    method: "POST",
    service: "dynamo",
    operation: "put",
    secure: true,
    description: "Put item to DynamoDB",
  },
  {
    path: "/api/dynamo/update",
    method: "POST",
    service: "dynamo",
    operation: "update",
    secure: true,
    description: "Update DynamoDB item",
  },
  {
    path: "/api/dynamo/delete",
    method: "POST",
    service: "dynamo",
    operation: "delete",
    secure: true,
    description: "Delete DynamoDB item",
  },

  // Chat service operations
  {
    path: "/api/chat/send",
    method: "POST",
    service: "chat",
    operation: "send",
    secure: true,
    description: "Send chat message",
  },
  {
    path: "/api/chat/history",
    method: "GET",
    service: "chat",
    operation: "history",
    secure: true,
    description: "Get chat history",
  },

  // S3 operations
  {
    path: "/api/s3/upload",
    method: "POST",
    service: "s3",
    operation: "upload",
    secure: true,
    description: "Upload file to S3",
  },
  {
    path: "/api/s3/download",
    method: "GET",
    service: "s3",
    operation: "download",
    secure: true,
    description: "Download file from S3",
  },

  // Neptune operations
  {
    path: "/api/neptune/query",
    method: "POST",
    service: "neptune",
    operation: "query",
    secure: true,
    description: "Query Neptune graph database",
  },
];

export const allRoutes = [...authRoutes, ...apiRoutes];
