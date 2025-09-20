import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import {
  ScanCommand,
  QueryCommand,
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";

interface AwsCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken: string;
  region: string;
}

async function createDynamoClient(
  credentials: AwsCredentials
): Promise<DynamoDBDocumentClient> {
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

async function execute(
  request: {
    service: string;
    operation: string;
    table: string;
    schema?: string;
    app?: string;
    data?: any;
  },
  credentials: AwsCredentials,
  session?: {
    user: {
      id: string;
      userId: string;
      email?: string;
      name?: string;
      groups?: string[];
      isAdmin?: boolean;
    };
    idToken?: string;
    groups?: string[];
    isAdmin?: boolean;
  }
) {
  try {
    const {
      operation,
      table,
      schema = "captify",
      app = "core",
      data = {},
    } = request;

    // Construct table name as schema-app-table
    const fullTableName = `${schema}-${app}-${table}`;

    // Add user context validation for captify-core-User table operations
    if (fullTableName === "captify-core-User" && session?.user) {
      const userId = session.user.id;
      const isAdmin = session.isAdmin || session.user.isAdmin;

      // For non-admin users, ensure they can only access their own record
      if (!isAdmin) {
        switch (operation) {
          case "get":
          case "update": {
            const itemKey = data?.Key || data?.key;
            if (itemKey?.id && itemKey.id !== userId) {
              return {
                success: false,
                error: "Access denied. You can only access your own user record.",
                metadata: {
                  requestId: `dynamo-access-denied-${Date.now()}`,
                  timestamp: new Date().toISOString(),
                  source: "dynamo.execute",
                  userId: userId,
                  attemptedAccess: itemKey?.id
                },
              };
            }
            break;
          }
          case "put": {
            // Allow users to create their own User record
            const item = data?.Item || data?.item;
            if (item?.id && item.id !== userId) {
              return {
                success: false,
                error: "Access denied. You can only create a User record with your own ID.",
                metadata: {
                  requestId: `dynamo-access-denied-${Date.now()}`,
                  timestamp: new Date().toISOString(),
                  source: "dynamo.execute",
                  userId: userId,
                  attemptedId: item.id
                },
              };
            }
            // If no ID in item, set it to the user's ID
            if (item && !item.id) {
              item.id = userId;
            }
            break;
          }
          case "delete": {
            // Non-admin users cannot delete user records
            return {
              success: false,
              error: "Access denied. Only administrators can delete user records.",
              metadata: {
                requestId: `dynamo-access-denied-${Date.now()}`,
                timestamp: new Date().toISOString(),
                source: "dynamo.execute",
                userId: userId
              },
            };
          }
          case "scan":
          case "query": {
            // For read operations on User table, add filter to only return user's own record
            if (!data.FilterExpression) {
              data.FilterExpression = "#userId = :userId";
              data.ExpressionAttributeNames = {
                ...data.ExpressionAttributeNames,
                "#userId": "id"
              };
              data.ExpressionAttributeValues = {
                ...data.ExpressionAttributeValues,
                ":userId": userId
              };
            } else {
              // If there's already a filter, AND it with user restriction
              data.FilterExpression = `(${data.FilterExpression}) AND #userId = :userId`;
              data.ExpressionAttributeNames = {
                ...data.ExpressionAttributeNames,
                "#userId": "id"
              };
              data.ExpressionAttributeValues = {
                ...data.ExpressionAttributeValues,
                ":userId": userId
              };
            }
            break;
          }
        }
      }
    }

    const client = await createDynamoClient(credentials);

    switch (operation) {
      case "scan": {
        const command = new ScanCommand({ TableName: fullTableName, ...data });
        const result = await client.send(command);
        return {
          success: true,
          data: result,
          metadata: {
            requestId: `dynamo-scan-${Date.now()}`,
            timestamp: new Date().toISOString(),
            source: "dynamo.scan",
          },
        };
      }
      case "query": {
        const command = new QueryCommand({ TableName: fullTableName, ...data });
        const result = await client.send(command);
        return {
          success: true,
          data: result,
          metadata: {
            requestId: `dynamo-query-${Date.now()}`,
            timestamp: new Date().toISOString(),
            source: "dynamo.query",
          },
        };
      }
      case "get": {
        const command = new GetCommand({
          TableName: fullTableName,
          Key: data.key,
          ...data,
        });
        const result = await client.send(command);
        return {
          success: true,
          data: result.Item || null,
          metadata: {
            requestId: `dynamo-get-${Date.now()}`,
            timestamp: new Date().toISOString(),
            source: "dynamo.get",
          },
        };
      }
      case "put": {
        const command = new PutCommand({
          TableName: fullTableName,
          Item: data.item,
          ...data,
        });
        await client.send(command);
        return {
          success: true,
          data: { message: "Item created successfully" },
          metadata: {
            requestId: `dynamo-put-${Date.now()}`,
            timestamp: new Date().toISOString(),
            source: "dynamo.put",
          },
        };
      }
      case "update": {
        const command = new UpdateCommand({
          TableName: fullTableName,
          Key: data.key,
          UpdateExpression: data.updateExpression,
          ExpressionAttributeValues: data.expressionAttributeValues,
          ...data,
        });
        const result = await client.send(command);
        return {
          success: true,
          data: result,
          metadata: {
            requestId: `dynamo-update-${Date.now()}`,
            timestamp: new Date().toISOString(),
            source: "dynamo.update",
          },
        };
      }
      case "delete": {
        const command = new DeleteCommand({
          TableName: fullTableName,
          Key: data.key,
          ...data,
        });
        await client.send(command);
        return {
          success: true,
          data: { message: "Item deleted successfully" },
          metadata: {
            requestId: `dynamo-delete-${Date.now()}`,
            timestamp: new Date().toISOString(),
            source: "dynamo.delete",
          },
        };
      }
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

const manifest = {
  name: "dynamo",
  version: "1.0.0",
  description: "DynamoDB service for data operations",
  operations: ["scan", "query", "get", "put", "update", "delete"],
  requiredParams: {
    scan: ["table"],
    query: ["table"],
    get: ["table", "key"],
    put: ["table", "item"],
    update: ["table", "key", "updateExpression"],
    delete: ["table", "key"],
  },
};

export const dynamo = { execute, manifest };
export { execute, manifest, createDynamoClient };
