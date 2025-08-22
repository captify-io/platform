import {
  DynamoDBClient,
  ScanCommand,
  QueryCommand,
  DeleteItemCommand,
  PutItemCommand,
  UpdateItemCommand,
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import type { DynamoDbOptions, SessionInfo } from "../types";

export class DynamoDBService {
  private client: DynamoDBClient;

  constructor(
    region: string = "us-east-1",
    credentials?: { accessKeyId: string; secretAccessKey: string }
  ) {
    this.client = new DynamoDBClient({
      region,
      credentials: credentials || {
        accessKeyId: process.env.ACCESS_KEY_ID!,
        secretAccessKey: process.env.SECRET_ACCESS_KEY!,
      },
    });
  }

  /**
   * Scan a DynamoDB table with optional filters
   */
  async scan<T = any>(options: DynamoDbOptions): Promise<T[]> {
    const command = new ScanCommand({
      TableName: options.tableName,
      FilterExpression: options.filterExpression,
      ExpressionAttributeValues: options.expressionAttributeValues
        ? marshall(options.expressionAttributeValues)
        : undefined,
      Limit: options.limit,
    });

    const result = await this.client.send(command);
    return result.Items
      ? result.Items.map((item) => unmarshall(item) as T)
      : [];
  }

  /**
   * Query a DynamoDB table
   */
  async query<T = any>(
    options: DynamoDbOptions & { keyConditionExpression: string }
  ): Promise<T[]> {
    const command = new QueryCommand({
      TableName: options.tableName,
      KeyConditionExpression: options.keyConditionExpression,
      ExpressionAttributeValues: options.expressionAttributeValues
        ? marshall(options.expressionAttributeValues)
        : undefined,
      IndexName: options.indexName,
      Limit: options.limit,
    });

    const result = await this.client.send(command);
    return result.Items
      ? result.Items.map((item) => unmarshall(item) as T)
      : [];
  }

  /**
   * Get a single item by key
   */
  async getItem<T = any>(
    tableName: string,
    key: Record<string, any>
  ): Promise<T | null> {
    const items = await this.scan<T>({
      tableName,
      filterExpression: Object.keys(key)
        .map((k) => `${k} = :${k}`)
        .join(" AND "),
      expressionAttributeValues: Object.fromEntries(
        Object.entries(key).map(([k, v]) => [`:${k}`, v])
      ),
      limit: 1,
    });

    return items.length > 0 ? items[0] : null;
  }

  /**
   * Delete an item by key
   */
  async deleteItem(tableName: string, key: Record<string, any>): Promise<void> {
    const command = new DeleteItemCommand({
      TableName: tableName,
      Key: marshall(key),
    });

    await this.client.send(command);
  }

  /**
   * Put (create/update) an item
   */
  async putItem<T = any>(
    tableName: string,
    item: T,
    conditionExpression?: string
  ): Promise<void> {
    const command = new PutItemCommand({
      TableName: tableName,
      Item: marshall(item as Record<string, any>),
      ConditionExpression: conditionExpression,
    });

    await this.client.send(command);
  }

  /**
   * Update an item
   */
  async updateItem(
    tableName: string,
    key: Record<string, any>,
    updateExpression: string,
    expressionAttributeValues: Record<string, any>,
    expressionAttributeNames?: Record<string, string>
  ): Promise<any> {
    const command = new UpdateItemCommand({
      TableName: tableName,
      Key: marshall(key),
      UpdateExpression: updateExpression,
      ExpressionAttributeValues: marshall(expressionAttributeValues),
      ExpressionAttributeNames: expressionAttributeNames,
      ReturnValues: "ALL_NEW",
    });

    const result = await this.client.send(command);
    return result.Attributes ? unmarshall(result.Attributes) : null;
  }

  /**
   * Get threads for a user
   */
  async getThreads(tableName: string, userId: string): Promise<any[]> {
    return this.query({
      tableName,
      keyConditionExpression: "userId = :userId",
      expressionAttributeValues: { ":userId": userId },
    });
  }

  /**
   * Get messages for a thread
   */
  async getMessages(tableName: string, threadId: string): Promise<any[]> {
    return this.query({
      tableName,
      keyConditionExpression: "threadId = :threadId",
      expressionAttributeValues: { ":threadId": threadId },
    });
  }

  /**
   * Get application by ID
   */
  async getApplication(tableName: string, appId: string): Promise<any | null> {
    return this.getItem(tableName, { id: appId });
  }
}
