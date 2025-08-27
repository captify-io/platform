/**
 * Central API orchestrator for the Captify platform
 * Generic service router with centralized AWS credential management and automatic authentication
 */

import type { ApiRequest, ApiResponse, ApiUserSession } from "./types";

/**
 * Centralized AWS credential manager
 */
class AWSCredentialManager {
  private static instance: AWSCredentialManager;

  private constructor() {}

  static getInstance(): AWSCredentialManager {
    if (!AWSCredentialManager.instance) {
      AWSCredentialManager.instance = new AWSCredentialManager();
    }
    return AWSCredentialManager.instance;
  }

  /**
   * Get credentials for AWS services with three-tier fallback
   */
  getCredentials(userSession: ApiUserSession): {
    accessKeyId?: string;
    secretAccessKey?: string;
    sessionToken?: string;
    region: string;
  } {
    const region = process.env.AWS_REGION || "us-east-1";

    // Tier 1: Session token (preferred) - from NextAuth JWT callback
    if (userSession.awsSessionToken && userSession.idToken) {
      return {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        sessionToken: userSession.awsSessionToken,
        region,
      };
    }

    // Tier 2: Environment variables for user scope
    // TODO: Add user-specific credentials from Cognito Identity Pool

    // Tier 3: Static fallback - service account (environment variables)
    return {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region,
    };
  }
}

/**
 * Main CaptifyApi class - Generic service router
 * Routes requests to appropriate service handlers based on the service parameter
 */
export class CaptifyApi {
  private credentialManager: AWSCredentialManager;

  constructor() {
    this.credentialManager = AWSCredentialManager.getInstance();
  }

  /**
   * Main request handler - routes to appropriate service
   */
  async request(request: ApiRequest): Promise<ApiResponse> {
    try {
      // Validate required fields
      if (!request.service) {
        return this.createErrorResponse(
          "Service is required",
          "CaptifyApi.request"
        );
      }

      if (!request.userSession) {
        return this.createErrorResponse(
          "User session is required",
          "CaptifyApi.request"
        );
      }

      // Get AWS credentials for the session
      const credentials = this.credentialManager.getCredentials(
        request.userSession
      );

      // Ensure we have required credentials
      if (!credentials.accessKeyId || !credentials.secretAccessKey) {
        return this.createErrorResponse(
          "AWS credentials not available",
          "CaptifyApi.request"
        );
      }

      const awsCredentials = {
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
        sessionToken: credentials.sessionToken,
        region: credentials.region,
      };

      // Special case for discovering operations
      if (request.operation === "getOps") {
        return await this.getServiceOperations(request.service);
      }

      // Route to appropriate service
      switch (request.service.toLowerCase()) {
        case "dynamodb":
        case "dynamo":
          const { execute: dynamoExecute } = await import("./services/dynamo");
          return await dynamoExecute(
            request,
            request.userSession,
            awsCredentials
          );

        case "s3":
          const { execute: s3Execute } = await import("./services/s3");
          return await s3Execute(request, request.userSession, awsCredentials);

        case "chat":
          const { execute: chatExecute } = await import("./services/chat");
          return await chatExecute(
            request,
            request.userSession,
            awsCredentials
          );

        case "neptune":
          const { execute: neptuneExecute } = await import(
            "./services/neptune"
          );
          return await neptuneExecute(
            request,
            request.userSession,
            awsCredentials
          );

        default:
          return this.createErrorResponse(
            `Unknown service: ${request.service}`,
            "CaptifyApi.request"
          );
      }
    } catch (error) {
      return this.createErrorResponse(
        error instanceof Error ? error.message : "Service routing failed",
        "CaptifyApi.request"
      );
    }
  }

  /**
   * Get available operations for a service
   */
  private async getServiceOperations(service: string): Promise<ApiResponse> {
    try {
      switch (service.toLowerCase()) {
        case "dynamodb":
        case "dynamo":
          const { getOps: dynamoGetOps } = await import("./services/dynamo");
          return {
            success: true,
            data: dynamoGetOps(),
            metadata: {
              requestId: this.generateRequestId(),
              timestamp: new Date().toISOString(),
              source: "CaptifyApi.getServiceOperations",
            },
          };

        case "s3":
          const { getOps: s3GetOps } = await import("./services/s3");
          return {
            success: true,
            data: s3GetOps(),
            metadata: {
              requestId: this.generateRequestId(),
              timestamp: new Date().toISOString(),
              source: "CaptifyApi.getServiceOperations",
            },
          };

        case "chat":
          const { getOps: chatGetOps } = await import("./services/chat");
          return {
            success: true,
            data: chatGetOps(),
            metadata: {
              requestId: this.generateRequestId(),
              timestamp: new Date().toISOString(),
              source: "CaptifyApi.getServiceOperations",
            },
          };

        case "neptune":
          const { getOps: neptuneGetOps } = await import("./services/neptune");
          return {
            success: true,
            data: neptuneGetOps(),
            metadata: {
              requestId: this.generateRequestId(),
              timestamp: new Date().toISOString(),
              source: "CaptifyApi.getServiceOperations",
            },
          };

        default:
          return this.createErrorResponse(
            `Unknown service: ${service}`,
            "CaptifyApi.getServiceOperations"
          );
      }
    } catch (error) {
      return this.createErrorResponse(
        error instanceof Error
          ? error.message
          : "Failed to get service operations",
        "CaptifyApi.getServiceOperations"
      );
    }
  }

  /**
   * Helper methods
   */
  private createErrorResponse(error: string, source: string): ApiResponse {
    return {
      success: false,
      error,
      metadata: {
        requestId: this.generateRequestId(),
        timestamp: new Date().toISOString(),
        source,
      },
    };
  }

  /**
   * Generate a unique request ID
   */
  private generateRequestId(): string {
    return `captify-api-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 9)}`;
  }
}

/**
 * Request-aware CaptifyApi factory
 * Creates a new instance and processes the request
 */
export function createCaptifyApi(): CaptifyApi {
  return new CaptifyApi();
}

// Export the main instance
export const captifyApi = new CaptifyApi();
