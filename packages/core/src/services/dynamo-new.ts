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
    data?: any;
  },
  credentials: AwsCredentials
) {
  try {
    const { operation, table, data = {} } = request;
    const client = await createDynamoClient(credentials);

    switch (operation) {
      case "scan": {
        const command = new ScanCommand({ TableName: table, ...data });
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
        const command = new QueryCommand({ TableName: table, ...data });
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
          TableName: table,
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
          TableName: table,
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
          TableName: table,
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
          TableName: table,
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
