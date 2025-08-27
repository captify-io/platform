/**
 * DynamoDB Service
 * Handles all DynamoDB operations for the Captify platform
 */

import type {
  ApiRequest,
  ApiResponse,
  ApiUserSession,
  AwsCredentials,
} from "../types";

// AWS SDK imports
import {
  DynamoDBClient,
  ScanCommand,
  QueryCommand,
  GetItemCommand,
  PutItemCommand,
  UpdateItemCommand,
  DeleteItemCommand,
  type ScanCommandInput,
  type QueryCommandInput,
  type GetItemCommandInput,
  type PutItemCommandInput,
  type UpdateItemCommandInput,
  type DeleteItemCommandInput,
} from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  paginateScan,
  paginateQuery,
} from "@aws-sdk/lib-dynamodb";

/**
 * Create DynamoDB client with credentials
 */
/**
 * Create DynamoDB client with credentials
 */
function createDynamoDBClient(
  credentials: AwsCredentials & { region: string }
): DynamoDBDocumentClient {
  const client = new DynamoDBClient({
    region: credentials.region,
    credentials: {
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
      sessionToken: credentials.sessionToken,
    },
  });

  return DynamoDBDocumentClient.from(client);
}

/**
 * Get available operations for DynamoDB service
 */
export function getOps(): {
  operations: string[];
  description: string;
  examples: Record<string, any>;
} {
  return {
    operations: ["scan", "query", "get", "put", "update", "delete"],
    description: "DynamoDB service for NoSQL database operations",
    examples: {
      get: {
        operation: "get",
        table: "captify-core-User",
        data: { key: { userId: "user123" } },
      },
      put: {
        operation: "put",
        table: "captify-core-User",
        data: { item: { userId: "user123", email: "user@example.com" } },
      },
      scan: {
        operation: "scan",
        table: "captify-core-User",
        data: {
          FilterExpression: "orgId = :orgId",
          ExpressionAttributeValues: { ":orgId": "org123" },
        },
      },
      query: {
        operation: "query",
        table: "captify-core-User",
        data: {
          KeyConditionExpression: "userId = :userId",
          ExpressionAttributeValues: { ":userId": "user123" },
        },
      },
      update: {
        operation: "update",
        table: "captify-core-User",
        data: {
          key: { userId: "user123" },
          UpdateExpression: "SET email = :email",
          ExpressionAttributeValues: { ":email": "newemail@example.com" },
        },
      },
      delete: {
        operation: "delete",
        table: "captify-core-User",
        data: { key: { userId: "user123" } },
      },
    },
  };
}

/**
 * Execute DynamoDB operations
 * All DynamoDB requests are routed through this function
 */
export async function execute(
  request: ApiRequest,
  userSession: ApiUserSession,
  credentials: AwsCredentials & { region: string }
): Promise<ApiResponse> {
  try {
    // Validate operation
    const validOperations = ["scan", "query", "get", "put", "update", "delete"];
    if (request.operation && !validOperations.includes(request.operation)) {
      return {
        success: false,
        error: `Invalid DynamoDB operation: ${
          request.operation
        }. Valid operations: ${validOperations.join(", ")}`,
        metadata: {
          requestId: `dynamo-error-${Date.now()}`,
          timestamp: new Date().toISOString(),
          source: "dynamo.execute",
        },
      };
    }

    // Validate required fields
    const tableName = request.table || request.resource;
    if (!tableName) {
      return {
        success: false,
        error: "Table name is required for DynamoDB operations",
        metadata: {
          requestId: `dynamo-error-${Date.now()}`,
          timestamp: new Date().toISOString(),
          source: "dynamo.execute",
        },
      };
    }

    // Create DynamoDB client
    const client = createDynamoDBClient(credentials);
    const operation = request.operation || "scan";

    // Route to specific operation
    switch (operation) {
      case "get":
        return await executeGet(client, tableName, request.data, userSession);
      case "put":
        return await executePut(client, tableName, request.data, userSession);
      case "update":
        return await executeUpdate(
          client,
          tableName,
          request.data,
          userSession
        );
      case "delete":
        return await executeDelete(
          client,
          tableName,
          request.data,
          userSession
        );
      case "query":
        return await executeQuery(client, tableName, request.data, userSession);
      case "scan":
        return await executeScan(client, tableName, request.data, userSession);
      default:
        return {
          success: false,
          error: `Unsupported operation: ${operation}`,
          metadata: {
            requestId: `dynamo-error-${Date.now()}`,
            timestamp: new Date().toISOString(),
            source: "dynamo.execute",
          },
        };
    }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "DynamoDB operation failed",
      metadata: {
        requestId: `dynamo-error-${Date.now()}`,
        timestamp: new Date().toISOString(),
        source: "dynamo.execute",
      },
    };
  }
}

/**
 * Execute GET operation
 */
async function executeGet(
  client: DynamoDBDocumentClient,
  tableName: string,
  data: any,
  userSession: ApiUserSession
): Promise<ApiResponse> {
  try {
    const params: GetItemCommandInput = {
      TableName: tableName,
      Key: data.key || data.Key,
      ...data,
    };

    const command = new GetItemCommand(params);
    const result = await client.send(command);

    return {
      success: true,
      data: result.Item || null,
      metadata: {
        requestId: `dynamo-get-${Date.now()}`,
        timestamp: new Date().toISOString(),
        source: "dynamo.executeGet",
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Get operation failed",
      metadata: {
        requestId: `dynamo-get-error-${Date.now()}`,
        timestamp: new Date().toISOString(),
        source: "dynamo.executeGet",
      },
    };
  }
}

/**
 * Execute PUT operation
 */
async function executePut(
  client: DynamoDBDocumentClient,
  tableName: string,
  data: any,
  userSession: ApiUserSession
): Promise<ApiResponse> {
  try {
    const params: PutItemCommandInput = {
      TableName: tableName,
      Item: data.item || data.Item || data,
      ...data,
    };

    const command = new PutItemCommand(params);
    await client.send(command);

    return {
      success: true,
      data: { message: "Item created successfully" },
      metadata: {
        requestId: `dynamo-put-${Date.now()}`,
        timestamp: new Date().toISOString(),
        source: "dynamo.executePut",
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Put operation failed",
      metadata: {
        requestId: `dynamo-put-error-${Date.now()}`,
        timestamp: new Date().toISOString(),
        source: "dynamo.executePut",
      },
    };
  }
}

/**
 * Execute UPDATE operation
 */
async function executeUpdate(
  client: DynamoDBDocumentClient,
  tableName: string,
  data: any,
  userSession: ApiUserSession
): Promise<ApiResponse> {
  try {
    const params: UpdateItemCommandInput = {
      TableName: tableName,
      Key: data.key || data.Key,
      UpdateExpression: data.UpdateExpression,
      ExpressionAttributeValues: data.ExpressionAttributeValues,
      ExpressionAttributeNames: data.ExpressionAttributeNames,
      ReturnValues: data.ReturnValues || "ALL_NEW",
      ...data,
    };

    const command = new UpdateItemCommand(params);
    const result = await client.send(command);

    return {
      success: true,
      data: result.Attributes || { message: "Item updated successfully" },
      metadata: {
        requestId: `dynamo-update-${Date.now()}`,
        timestamp: new Date().toISOString(),
        source: "dynamo.executeUpdate",
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Update operation failed",
      metadata: {
        requestId: `dynamo-update-error-${Date.now()}`,
        timestamp: new Date().toISOString(),
        source: "dynamo.executeUpdate",
      },
    };
  }
}

/**
 * Execute DELETE operation
 */
async function executeDelete(
  client: DynamoDBDocumentClient,
  tableName: string,
  data: any,
  userSession: ApiUserSession
): Promise<ApiResponse> {
  try {
    const params: DeleteItemCommandInput = {
      TableName: tableName,
      Key: data.key || data.Key,
      ...data,
    };

    const command = new DeleteItemCommand(params);
    const result = await client.send(command);

    return {
      success: true,
      data: result.Attributes || { message: "Item deleted successfully" },
      metadata: {
        requestId: `dynamo-delete-${Date.now()}`,
        timestamp: new Date().toISOString(),
        source: "dynamo.executeDelete",
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Delete operation failed",
      metadata: {
        requestId: `dynamo-delete-error-${Date.now()}`,
        timestamp: new Date().toISOString(),
        source: "dynamo.executeDelete",
      },
    };
  }
}

/**
 * Execute QUERY operation
 */
async function executeQuery(
  client: DynamoDBDocumentClient,
  tableName: string,
  data: any,
  userSession: ApiUserSession
): Promise<ApiResponse> {
  try {
    const params: QueryCommandInput = {
      TableName: tableName,
      KeyConditionExpression: data.KeyConditionExpression,
      FilterExpression: data.FilterExpression,
      ExpressionAttributeValues: data.ExpressionAttributeValues,
      ExpressionAttributeNames: data.ExpressionAttributeNames,
      IndexName: data.IndexName,
      Limit: data.Limit,
      ExclusiveStartKey: data.ExclusiveStartKey,
      ScanIndexForward: data.ScanIndexForward,
      ...data,
    };

    const command = new QueryCommand(params);
    const result = await client.send(command);

    return {
      success: true,
      data: {
        items: result.Items || [],
        count: result.Count || 0,
        scannedCount: result.ScannedCount || 0,
        lastEvaluatedKey: result.LastEvaluatedKey,
      },
      metadata: {
        requestId: `dynamo-query-${Date.now()}`,
        timestamp: new Date().toISOString(),
        source: "dynamo.executeQuery",
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Query operation failed",
      metadata: {
        requestId: `dynamo-query-error-${Date.now()}`,
        timestamp: new Date().toISOString(),
        source: "dynamo.executeQuery",
      },
    };
  }
}

/**
 * Execute SCAN operation
 */
async function executeScan(
  client: DynamoDBDocumentClient,
  tableName: string,
  data: any,
  userSession: ApiUserSession
): Promise<ApiResponse> {
  try {
    const params: ScanCommandInput = {
      TableName: tableName,
      FilterExpression: data.FilterExpression,
      ExpressionAttributeValues: data.ExpressionAttributeValues,
      ExpressionAttributeNames: data.ExpressionAttributeNames,
      IndexName: data.IndexName,
      Limit: data.Limit,
      ExclusiveStartKey: data.ExclusiveStartKey,
      ...data,
    };

    const command = new ScanCommand(params);
    const result = await client.send(command);

    return {
      success: true,
      data: {
        items: result.Items || [],
        count: result.Count || 0,
        scannedCount: result.ScannedCount || 0,
        lastEvaluatedKey: result.LastEvaluatedKey,
      },
      metadata: {
        requestId: `dynamo-scan-${Date.now()}`,
        timestamp: new Date().toISOString(),
        source: "dynamo.executeScan",
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Scan operation failed",
      metadata: {
        requestId: `dynamo-scan-error-${Date.now()}`,
        timestamp: new Date().toISOString(),
        source: "dynamo.executeScan",
      },
    };
  }
}
