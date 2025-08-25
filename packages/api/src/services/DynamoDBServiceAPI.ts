/**
 * DynamoDB Service API
 * Handles all DynamoDB operations with centralized credential management
 */

import { DynamoDBService } from "@/aws/dynamodb";
import type { ApiResponse } from "@/types";

interface UserSession {
  userId: string;
  email: string;
  orgId?: string;
  appId?: string;
  idToken?: string;
  awsSessionToken?: string;
  awsExpiresAt?: number;
  permissions?: string[];
}

export interface DynamoDBRequest {
  operation: "get" | "put" | "update" | "delete" | "query" | "scan";
  tableName: string;
  data: any;
}

export class DynamoDBServiceAPI {
  private static services: Map<string, DynamoDBService> = new Map();

  /**
   * Execute DynamoDB operation
   */
  static async execute(
    request: DynamoDBRequest,
    userSession: UserSession
  ): Promise<ApiResponse> {
    try {
      const service = this.getService(userSession);
      const { operation, tableName, data } = request;

      let result;

      switch (operation) {
        case "get":
          result = await service.getItem(tableName, data.key || data);
          break;

        case "put":
          result = await service.putItem(tableName, data.item || data);
          break;

        case "update":
          if (!data.updateExpression || !data.expressionAttributeValues) {
            throw new Error(
              "updateExpression and expressionAttributeValues required for update operation"
            );
          }
          result = await service.updateItem(
            tableName,
            data.key,
            data.updateExpression,
            data.expressionAttributeValues,
            data.expressionAttributeNames
          );
          break;

        case "delete":
          result = await service.deleteItem(tableName, data.key || data);
          break;

        case "query":
          result = await service.query({
            tableName,
            keyConditionExpression: data.keyConditionExpression,
            expressionAttributeValues: data.expressionAttributeValues,
            filterExpression: data.filterExpression,
            indexName: data.indexName,
            limit: data.limit,
          });
          break;

        case "scan":
          result = await service.scan({
            tableName,
            filterExpression: data.filterExpression,
            expressionAttributeValues: data.expressionAttributeValues,
            limit: data.limit, // No default limit - get all results unless specified
          });
          break;

        default:
          throw new Error(`Unsupported DynamoDB operation: ${operation}`);
      }

      return {
        success: true,
        data: result,
        metadata: {
          requestId: this.generateRequestId(),
          timestamp: new Date().toISOString(),
          source: "DynamoDBServiceAPI",
        },
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "DynamoDB operation failed",
        metadata: {
          requestId: this.generateRequestId(),
          timestamp: new Date().toISOString(),
          source: "DynamoDBServiceAPI",
        },
      };
    }
  }

  /**
   * Get DynamoDB service instance with credential management
   */
  private static getService(userSession: UserSession): DynamoDBService {
    const cacheKey = userSession.userId || "default";

    if (!this.services.has(cacheKey)) {
      let credentials;

      // For now, just use environment variables - session token support needs DynamoDB service update
      if (userSession.awsSessionToken) {
        // TODO: Enhance DynamoDB service to support session tokens
        console.log(
          "Session token available but not yet supported in DynamoDB service"
        );
      }

      const service = new DynamoDBService("us-east-1", credentials);
      this.services.set(cacheKey, service);
    }

    return this.services.get(cacheKey)!;
  }

  private static generateRequestId(): string {
    return `dynamo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
