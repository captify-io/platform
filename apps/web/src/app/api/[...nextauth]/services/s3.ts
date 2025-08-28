/**
 * S3 Service
 * Handles all S3 operations for the Captify platform
 */

import type {
  ApiRequest,
  ApiResponse,
  ApiUserSession,
  AwsCredentials,
} from "../types";

// AWS SDK imports
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  type GetObjectCommandInput,
  type PutObjectCommandInput,
  type DeleteObjectCommandInput,
  type ListObjectsV2CommandInput,
} from "@aws-sdk/client-s3";

/**
 * Create S3 client with credentials
 */
function createS3Client(
  credentials: AwsCredentials & { region: string }
): S3Client {
  return new S3Client({
    region: credentials.region,
    credentials: {
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
      sessionToken: credentials.sessionToken,
    },
  });
}

/**
 * Get available operations for S3 service
 */
export function getOps(): {
  operations: string[];
  description: string;
  examples: Record<string, any>;
} {
  return {
    operations: ["get", "put", "delete", "list"],
    description: "S3 service for object storage operations",
    examples: {
      get: {
        operation: "get",
        data: { bucket: "captify-uploads", key: "user123/document.pdf" },
      },
      put: {
        operation: "put",
        data: {
          bucket: "captify-uploads",
          key: "user123/document.pdf",
          body: "file content",
          contentType: "application/pdf",
        },
      },
      delete: {
        operation: "delete",
        data: { bucket: "captify-uploads", key: "user123/document.pdf" },
      },
      list: {
        operation: "list",
        data: { bucket: "captify-uploads", prefix: "user123/" },
      },
    },
  };
}

/**
 * Execute S3 operations
 * All S3 requests are routed through this function
 */
export async function execute(
  request: ApiRequest,
  userSession: ApiUserSession,
  credentials: AwsCredentials & { region: string }
): Promise<ApiResponse> {
  try {
    // Validate operation
    const validOperations = ["get", "put", "delete", "list"];
    if (request.operation && !validOperations.includes(request.operation)) {
      return {
        success: false,
        error: `Invalid S3 operation: ${
          request.operation
        }. Valid operations: ${validOperations.join(", ")}`,
        metadata: {
          requestId: `s3-error-${Date.now()}`,
          timestamp: new Date().toISOString(),
          source: "s3.execute",
        },
      };
    }

    // Extract bucket and key from data or params
    const bucket = request.data?.bucket || request.params?.bucket;
    const key = request.data?.key || request.params?.key;

    if (!bucket) {
      return {
        success: false,
        error: "Bucket is required for S3 operations",
        metadata: {
          requestId: `s3-error-${Date.now()}`,
          timestamp: new Date().toISOString(),
          source: "s3.execute",
        },
      };
    }

    // Create S3 client
    const client = createS3Client(credentials);
    const operation = request.operation || "get";

    // Route to specific operation
    switch (operation) {
      case "get":
        return await executeGet(client, bucket, key, request.data, userSession);
      case "put":
        return await executePut(client, bucket, key, request.data, userSession);
      case "delete":
        return await executeDelete(
          client,
          bucket,
          key,
          request.data,
          userSession
        );
      case "list":
        return await executeList(client, bucket, request.data, userSession);
      default:
        return {
          success: false,
          error: `Unsupported operation: ${operation}`,
          metadata: {
            requestId: `s3-error-${Date.now()}`,
            timestamp: new Date().toISOString(),
            source: "s3.execute",
          },
        };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "S3 operation failed",
      metadata: {
        requestId: `s3-error-${Date.now()}`,
        timestamp: new Date().toISOString(),
        source: "s3.execute",
      },
    };
  }
}

/**
 * Execute GET operation
 */
async function executeGet(
  client: S3Client,
  bucket: string,
  key: string,
  data: any,
  userSession: ApiUserSession
): Promise<ApiResponse> {
  try {
    if (!key) {
      return {
        success: false,
        error: "Key is required for S3 GET operation",
        metadata: {
          requestId: `s3-get-error-${Date.now()}`,
          timestamp: new Date().toISOString(),
          source: "s3.executeGet",
        },
      };
    }

    const params: GetObjectCommandInput = {
      Bucket: bucket,
      Key: key,
      ...data,
    };

    const command = new GetObjectCommand(params);
    const result = await client.send(command);

    // Convert the body to string if it's a readable stream
    let body = null;
    if (result.Body) {
      const chunks = [];
      for await (const chunk of result.Body as any) {
        chunks.push(chunk);
      }
      body = Buffer.concat(chunks).toString();
    }

    return {
      success: true,
      data: {
        body,
        contentType: result.ContentType,
        contentLength: result.ContentLength,
        lastModified: result.LastModified,
        etag: result.ETag,
        metadata: result.Metadata,
      },
      metadata: {
        requestId: `s3-get-${Date.now()}`,
        timestamp: new Date().toISOString(),
        source: "s3.executeGet",
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "S3 GET operation failed",
      metadata: {
        requestId: `s3-get-error-${Date.now()}`,
        timestamp: new Date().toISOString(),
        source: "s3.executeGet",
      },
    };
  }
}

/**
 * Execute PUT operation
 */
async function executePut(
  client: S3Client,
  bucket: string,
  key: string,
  data: any,
  userSession: ApiUserSession
): Promise<ApiResponse> {
  try {
    if (!key) {
      return {
        success: false,
        error: "Key is required for S3 PUT operation",
        metadata: {
          requestId: `s3-put-error-${Date.now()}`,
          timestamp: new Date().toISOString(),
          source: "s3.executePut",
        },
      };
    }

    const params: PutObjectCommandInput = {
      Bucket: bucket,
      Key: key,
      Body: data.body || data.Body,
      ContentType: data.contentType || data.ContentType,
      Metadata: data.metadata || data.Metadata,
      ...data,
    };

    const command = new PutObjectCommand(params);
    const result = await client.send(command);

    return {
      success: true,
      data: {
        etag: result.ETag,
        location: `https://${bucket}.s3.amazonaws.com/${key}`,
      },
      metadata: {
        requestId: `s3-put-${Date.now()}`,
        timestamp: new Date().toISOString(),
        source: "s3.executePut",
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "S3 PUT operation failed",
      metadata: {
        requestId: `s3-put-error-${Date.now()}`,
        timestamp: new Date().toISOString(),
        source: "s3.executePut",
      },
    };
  }
}

/**
 * Execute DELETE operation
 */
async function executeDelete(
  client: S3Client,
  bucket: string,
  key: string,
  data: any,
  userSession: ApiUserSession
): Promise<ApiResponse> {
  try {
    if (!key) {
      return {
        success: false,
        error: "Key is required for S3 DELETE operation",
        metadata: {
          requestId: `s3-delete-error-${Date.now()}`,
          timestamp: new Date().toISOString(),
          source: "s3.executeDelete",
        },
      };
    }

    const params: DeleteObjectCommandInput = {
      Bucket: bucket,
      Key: key,
      ...data,
    };

    const command = new DeleteObjectCommand(params);
    await client.send(command);

    return {
      success: true,
      data: { message: "Object deleted successfully" },
      metadata: {
        requestId: `s3-delete-${Date.now()}`,
        timestamp: new Date().toISOString(),
        source: "s3.executeDelete",
      },
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "S3 DELETE operation failed",
      metadata: {
        requestId: `s3-delete-error-${Date.now()}`,
        timestamp: new Date().toISOString(),
        source: "s3.executeDelete",
      },
    };
  }
}

/**
 * Execute LIST operation
 */
async function executeList(
  client: S3Client,
  bucket: string,
  data: any,
  userSession: ApiUserSession
): Promise<ApiResponse> {
  try {
    const params: ListObjectsV2CommandInput = {
      Bucket: bucket,
      Prefix: data.prefix || data.Prefix,
      MaxKeys: data.maxKeys || data.MaxKeys || 1000,
      ContinuationToken: data.continuationToken || data.ContinuationToken,
      ...data,
    };

    const command = new ListObjectsV2Command(params);
    const result = await client.send(command);

    return {
      success: true,
      data: {
        objects: result.Contents || [],
        count: result.KeyCount || 0,
        isTruncated: result.IsTruncated || false,
        nextContinuationToken: result.NextContinuationToken,
        prefix: result.Prefix,
      },
      metadata: {
        requestId: `s3-list-${Date.now()}`,
        timestamp: new Date().toISOString(),
        source: "s3.executeList",
      },
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "S3 LIST operation failed",
      metadata: {
        requestId: `s3-list-error-${Date.now()}`,
        timestamp: new Date().toISOString(),
        source: "s3.executeList",
      },
    };
  }
}
