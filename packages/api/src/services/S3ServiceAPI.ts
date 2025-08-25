/**
 * S3 Service API
 * Handles all S3 operations with centralized credential management
 */

import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import type { ApiResponse } from "@/types";
import { UserSession } from "@captify/core";

export interface S3Request {
  operation: "get" | "put" | "delete" | "list";
  bucket: string;
  key?: string;
  data?: any;
}

export class S3ServiceAPI {
  private static clients: Map<string, S3Client> = new Map();

  /**
   * Execute S3 operation
   */
  static async execute(
    request: S3Request,
    userSession: UserSession
  ): Promise<ApiResponse> {
    try {
      const client = this.getClient(userSession);
      const { operation, bucket, key, data } = request;

      let result;

      switch (operation) {
        case "get":
          if (!key) throw new Error("Key required for get operation");
          const getCommand = new GetObjectCommand({ Bucket: bucket, Key: key });
          result = await client.send(getCommand);
          break;

        case "put":
          if (!key || !data)
            throw new Error("Key and data required for put operation");
          const putCommand = new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: data.body,
            ContentType: data.contentType,
          });
          result = await client.send(putCommand);
          break;

        case "delete":
          if (!key) throw new Error("Key required for delete operation");
          const deleteCommand = new DeleteObjectCommand({
            Bucket: bucket,
            Key: key,
          });
          result = await client.send(deleteCommand);
          break;

        case "list":
          const listCommand = new ListObjectsV2Command({
            Bucket: bucket,
            Prefix: data?.prefix,
            MaxKeys: data?.maxKeys || 100,
          });
          result = await client.send(listCommand);
          break;

        default:
          throw new Error(`Unsupported S3 operation: ${operation}`);
      }

      return {
        success: true,
        data: result,
        metadata: {
          requestId: this.generateRequestId(),
          timestamp: new Date().toISOString(),
          source: "S3ServiceAPI",
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "S3 operation failed",
        metadata: {
          requestId: this.generateRequestId(),
          timestamp: new Date().toISOString(),
          source: "S3ServiceAPI",
        },
      };
    }
  }

  /**
   * Get S3 client with credential management
   */
  private static getClient(userSession: UserSession): S3Client {
    const cacheKey = userSession.userId || "default";

    if (!this.clients.has(cacheKey)) {
      const config: any = {
        region: process.env.AWS_REGION || "us-east-1",
      };

      // Add credentials if available
      if (userSession.awsSessionToken) {
        config.credentials = {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
          sessionToken: userSession.awsSessionToken,
        };
      }

      const client = new S3Client(config);
      this.clients.set(cacheKey, client);
    }

    return this.clients.get(cacheKey)!;
  }

  private static generateRequestId(): string {
    return `s3_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
