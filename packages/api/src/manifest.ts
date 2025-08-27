/**
 * @captify/api Package Manifest
 * Defines the API surface for authentication and core services
 */

export const apiManifest = {
  name: "@captify/api",
  version: "1.0.0",
  description: "Core authentication and API services",

  // API Routes - accessible at /api/auth/*
  routes: {
    // NextAuth route - handles [...nextauth] pattern
    "[...nextauth]": {
      method: "ALL",
      handler: "handlers/auth/nextauth-handler.ts",
      description: "NextAuth.js authentication handler",
      public: true,
    },

    // Authentication routes
    "cognito-identity": {
      method: "POST",
      handler: "handlers/auth/cognito-identity.ts",
      description: "Get AWS credentials from Cognito Identity Pool",
      authenticated: true,
    },
    "client-info": {
      method: "GET",
      handler: "handlers/auth/client-info.ts",
      description: "Get client IP and user agent information",
      public: true,
    },
    "validate-session": {
      method: "POST",
      handler: "handlers/auth/validate-session.ts",
      description: "Validate user session and tokens",
      public: true,
    },
    "validate-email": {
      method: "POST",
      handler: "handlers/auth/validate-email.ts",
      description: "Validate email exists in Cognito User Pool",
      public: true,
    },
    "save-email": {
      method: "POST",
      handler: "handlers/auth/save-email.ts",
      description: "Save user email in secure session cookie",
      public: true,
    },
    "secure-storage": {
      method: "ALL",
      handler: "handlers/auth/secure-storage.ts",
      description: "NIST-compliant secure storage operations",
      authenticated: true,
    },
    "set-login-hint": {
      method: "POST",
      handler: "handlers/auth/set-login-hint.ts",
      description: "Set login hint cookie for authentication flow",
      public: true,
    },
    "signin-with-hint": {
      method: "POST",
      handler: "handlers/auth/signin-with-hint.ts",
      description: "Generate signin URL with login hints",
      public: true,
    },
    "cognito-auth": {
      method: "GET",
      handler: "handlers/auth/cognito-auth.ts",
      description: "Direct Cognito OAuth2 authorization flow",
      public: true,
    },
  },

  // AWS Resources - for infrastructure as code
  resources: {
    cognito: {
      userPool: {
        name: "captify-users",
        description: "Main user pool for authentication",
        policies: ["MFA", "PasswordPolicy"],
      },
      identityPool: {
        name: "captify-identity",
        description: "Identity pool for AWS resource access",
        roles: ["authenticated", "unauthenticated"],
      },
    },
    dynamodb: {
      tables: [
        {
          name: "captify-core-users",
          description: "User profiles and metadata",
          keySchema: "userId",
        },
        {
          name: "captify-core-sessions",
          description: "Session storage",
          keySchema: "sessionId",
          ttl: true,
        },
      ],
    },
  },

  // Service Dependencies
  dependencies: {
    packages: ["@captify/core"],
    aws: ["cognito-idp", "cognito-identity", "dynamodb"],
    external: ["next-auth"],
  },
};

// Default export for the dynamic loader
export default apiManifest;
