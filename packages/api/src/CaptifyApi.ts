/**
 * Central API orchestrator for the Captify platform
 * Service-based architecture with centralized AWS credential management and automatic authentication
 */

import { SessionService } from "./SessionService";
import type { ApiRequest, ApiResponse } from "./types";
import type { UserSession } from "@captify/core";

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
  getCredentials(userSession: UserSession): {
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
 * Service executor interface for each AWS service
 */
interface ServiceExecutor {
  execute(operation: string, params: any): Promise<ApiResponse>;
}

/**
 * DynamoDB service executor with simplified interface
 */
class DynamoDBExecutor implements ServiceExecutor {
  constructor(private userSession: UserSession) {}

  async execute(operation: string, params: any): Promise<ApiResponse> {
    const { DynamoDBServiceAPI } = await import(
      "./services/DynamoDBServiceAPI"
    );

    // Validate operation type
    const validOperations = ["scan", "query", "get", "put", "update", "delete"];
    if (!validOperations.includes(operation)) {
      return {
        success: false,
        error: `Invalid DynamoDB operation: ${operation}. Valid operations: ${validOperations.join(
          ", "
        )}`,
        metadata: {
          requestId: `dynamo-error-${Date.now()}`,
          timestamp: new Date().toISOString(),
          source: "DynamoDBExecutor",
        },
      };
    }

    const request = {
      operation: operation as
        | "scan"
        | "query"
        | "get"
        | "put"
        | "update"
        | "delete",
      tableName: params.tableName || params.table,
      data: params.data || params,
    };

    return await DynamoDBServiceAPI.execute(request, this.userSession);
  }

  // Convenience methods for common operations
  async scan(tableName: string, params?: any): Promise<ApiResponse> {
    return this.execute("scan", { tableName, data: params });
  }

  async query(tableName: string, params: any): Promise<ApiResponse> {
    return this.execute("query", { tableName, data: params });
  }

  async get(tableName: string, key: any): Promise<ApiResponse> {
    return this.execute("get", { tableName, data: { key } });
  }

  async put(tableName: string, item: any): Promise<ApiResponse> {
    return this.execute("put", { tableName, data: { item } });
  }

  async update(
    tableName: string,
    key: any,
    updateData: any
  ): Promise<ApiResponse> {
    return this.execute("update", { tableName, data: { key, ...updateData } });
  }

  async delete(tableName: string, key: any): Promise<ApiResponse> {
    return this.execute("delete", { tableName, data: { key } });
  }
}

/**
 * S3 service executor with simplified interface
 */
class S3Executor implements ServiceExecutor {
  constructor(private userSession: UserSession) {}

  async execute(operation: string, params: any): Promise<ApiResponse> {
    const { S3ServiceAPI } = await import("./services/S3ServiceAPI");

    // Validate operation type
    const validOperations = ["get", "put", "delete", "list"];
    if (!validOperations.includes(operation)) {
      return {
        success: false,
        error: `Invalid S3 operation: ${operation}. Valid operations: ${validOperations.join(
          ", "
        )}`,
        metadata: {
          requestId: `s3-error-${Date.now()}`,
          timestamp: new Date().toISOString(),
          source: "S3Executor",
        },
      };
    }

    const request = {
      operation: operation as "get" | "put" | "delete" | "list",
      bucket: params.bucket,
      key: params.key,
      data: params.data || params,
    };

    return await S3ServiceAPI.execute(request, this.userSession);
  }

  // Convenience methods for common operations
  async get(bucket: string, key: string): Promise<ApiResponse> {
    return this.execute("get", { bucket, key });
  }

  async put(
    bucket: string,
    key: string,
    body: any,
    contentType?: string
  ): Promise<ApiResponse> {
    return this.execute("put", { bucket, key, data: { body, contentType } });
  }

  async delete(bucket: string, key: string): Promise<ApiResponse> {
    return this.execute("delete", { bucket, key });
  }

  async list(bucket: string, prefix?: string): Promise<ApiResponse> {
    return this.execute("list", { bucket, data: { prefix } });
  }
}

/**
 * Neptune service executor (placeholder for future implementation)
 */
class NeptuneExecutor implements ServiceExecutor {
  constructor(private userSession: UserSession) {}

  async execute(operation: string, params: any): Promise<ApiResponse> {
    return {
      success: false,
      error: "Neptune service not yet implemented",
      metadata: {
        requestId: `neptune-${Date.now()}`,
        timestamp: new Date().toISOString(),
        source: "NeptuneExecutor",
      },
    };
  }
}

/**
 * Main CaptifyApi class with request-aware initialization
 */
class CaptifyApiInstance {
  private userSession: UserSession | null = null;
  private _dynamodb: DynamoDBExecutor | null = null;
  private _s3: S3Executor | null = null;
  private _neptune: NeptuneExecutor | null = null;

  /**
   * Manual initialization with session (for server-side usage)
   */
  initializeWithSession(userSession: UserSession): void {
    this.userSession = userSession;
    this._dynamodb = new DynamoDBExecutor(userSession);
    this._s3 = new S3Executor(userSession);
    this._neptune = new NeptuneExecutor(userSession);
  }

  /**
   * Get DynamoDB executor
   */
  get dynamodb(): DynamoDBExecutor {
    if (!this._dynamodb) {
      throw new Error(
        "CaptifyApi not initialized. Call captifyApi.initializeWithSession() first"
      );
    }
    return this._dynamodb;
  }

  /**
   * Get S3 executor
   */
  get s3(): S3Executor {
    if (!this._s3) {
      throw new Error(
        "CaptifyApi not initialized. Call captifyApi.initializeWithSession() first"
      );
    }
    return this._s3;
  }

  /**
   * Get Neptune executor
   */
  get neptune(): NeptuneExecutor {
    if (!this._neptune) {
      throw new Error(
        "CaptifyApi not initialized. Call captifyApi.initializeWithSession() first"
      );
    }
    return this._neptune;
  }

  /**
   * Reset instance (for testing or re-initialization)
   */
  reset(): void {
    this.userSession = null;
    this._dynamodb = null;
    this._s3 = null;
    this._neptune = null;
  }
}

/**
 * Request-aware CaptifyApi factory
 * Creates a new instance initialized with the current request context
 */
export function createCaptifyApi(request: Request): CaptifyApiInstance {
  const instance = new CaptifyApiInstance();
  const userSession = SessionService.extractSession(request);
  if (!userSession) {
    throw new Error(
      "Authentication required - valid session headers not found"
    );
  }
  instance.initializeWithSession(userSession);
  return instance;
}

/**
 * Legacy CaptifyApi class for backward compatibility
 * Service-based API Router that routes requests to specific AWS service handlers
 */
export class CaptifyApi {
  /**
   * Route requests to appropriate service based on path
   * /api/captify/dynamodb - DynamoDB operations
   * /api/captify/s3 - S3 operations
   * /api/captify/neptune - Neptune operations
   * /api/captify/cognito - Cognito operations
   */
  async routeServiceRequest(
    service: string,
    request: any,
    userSession: UserSession
  ): Promise<ApiResponse> {
    try {
      const credentialManager = AWSCredentialManager.getInstance();
      const credentials = credentialManager.getCredentials(userSession);

      switch (service.toLowerCase()) {
        case "dynamodb":
          const { DynamoDBServiceAPI } = await import(
            "./services/DynamoDBServiceAPI"
          );
          return await DynamoDBServiceAPI.execute(request, userSession);

        case "s3":
          const { S3ServiceAPI } = await import("./services/S3ServiceAPI");
          return await S3ServiceAPI.execute(request, userSession);

        case "neptune":
          return {
            success: false,
            error: "Neptune service not yet implemented",
            metadata: this.createMetadata("CaptifyApi.routeServiceRequest"),
          };

        case "cognito":
          return {
            success: false,
            error: "Cognito service not yet implemented",
            metadata: this.createMetadata("CaptifyApi.routeServiceRequest"),
          };

        default:
          return {
            success: false,
            error: `Unknown service: ${service}`,
            metadata: this.createMetadata("CaptifyApi.routeServiceRequest"),
          };
      }
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Service routing failed",
        metadata: this.createMetadata("CaptifyApi.routeServiceRequest"),
      };
    }
  }

  /**
   * Legacy request method for backward compatibility
   */
  async request(request: ApiRequest): Promise<ApiResponse> {
    // For now, map old resource-based requests to new service-based routing
    const { resource, userSession } = request;

    if (!userSession) {
      return {
        success: false,
        error: "User session required",
        metadata: this.createMetadata("CaptifyApi.request"),
      };
    }

    // Map resources to services
    if (this.isDynamoDBResource(resource)) {
      const dynamoRequest = {
        operation: request.operation,
        tableName: this.getTableName(resource),
        data: request.data,
      };
      return this.routeServiceRequest("dynamodb", dynamoRequest, userSession);
    }

    return {
      success: false,
      error: `Legacy resource routing not implemented for: ${resource}`,
      metadata: this.createMetadata("CaptifyApi.request"),
    };
  }

  /**
   * Smart resource detection for DynamoDB (for legacy compatibility)
   */
  private isDynamoDBResource(resource: string): boolean {
    const dynamoPatterns = [
      /^table\//,
      /^apps$/,
      /^users$/,
      /^user-app-states$/,
      /^threads$/,
      /^messages$/,
      /^organizations$/,
      /^agents$/,
    ];
    return dynamoPatterns.some((pattern) => pattern.test(resource));
  }

  /**
   * Map resource names to actual table names (for legacy compatibility)
   */
  private getTableName(resource: string): string {
    // Handle table/ prefix
    if (resource.startsWith("table/")) {
      return resource.substring(6);
    }

    // Map logical names to actual table names
    const tableNameMap: Record<string, string> = {
      apps: "captify-appman-App",
      "user-app-states": "captify-user-app-states",
      users: "captify-users",
      threads: "captify-threads",
      messages: "captify-messages",
      organizations: "captify-organizations",
      agents: "captify-agents",
    };

    return tableNameMap[resource] || resource;
  }

  /**
   * Helper methods
   */
  private createMetadata(source: string) {
    return {
      requestId: this.generateRequestId(),
      timestamp: new Date().toISOString(),
      source,
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

// Export the legacy instance for backward compatibility
export const captifyApi = new CaptifyApi();
