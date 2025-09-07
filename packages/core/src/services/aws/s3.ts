/**
 * S3 Service
 * Handles all S3 operations for the Captify platform
 */

import type { ApiUserSession, AwsCredentials } from "../../types";

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
 * Execute S3 operations
 */
export async function execute(
  operation: string,
  params: any,
  credentials: AwsCredentials & { region: string }
): Promise<any> {
  try {
    // Validate operation
    const validOperations = ["get", "put", "delete", "list"];
    if (!validOperations.includes(operation)) {
      throw new Error(
        `Invalid S3 operation: ${operation}. Valid operations: ${validOperations.join(
          ", "
        )}`
      );
    }

    // Extract bucket and key from params
    const bucket = params?.bucket;
    const key = params?.key;

    if (!bucket) {
      throw new Error("Bucket is required for S3 operations");
    }

    // Create S3 client
    const client = createS3Client(credentials);

    // Route to specific operation
    switch (operation) {
      case "get":
        return await executeGet(client, bucket, key, params);
      case "put":
        return await executePut(client, bucket, key, params);
      case "delete":
        return await executeDelete(client, bucket, key, params);
      case "list":
        return await executeList(client, bucket, params);
      default:
        throw new Error(`Unsupported operation: ${operation}`);
    }
  } catch (error) {
    throw error;
  }
}

/**
 * Execute GET operation
 */
async function executeGet(
  client: S3Client,
  bucket: string,
  key: string,
  data: any
): Promise<any> {
  if (!key) {
    throw new Error("Key is required for S3 GET operation");
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
    body,
    contentType: result.ContentType,
    contentLength: result.ContentLength,
    lastModified: result.LastModified,
    etag: result.ETag,
    metadata: result.Metadata,
  };
}

/**
 * Execute PUT operation
 */
async function executePut(
  client: S3Client,
  bucket: string,
  key: string,
  data: any
): Promise<any> {
  if (!key) {
    throw new Error("Key is required for S3 PUT operation");
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
    etag: result.ETag,
    location: `https://${bucket}.s3.amazonaws.com/${key}`,
  };
}

/**
 * Execute DELETE operation
 */
async function executeDelete(
  client: S3Client,
  bucket: string,
  key: string,
  data: any
): Promise<any> {
  if (!key) {
    throw new Error("Key is required for S3 DELETE operation");
  }

  const params: DeleteObjectCommandInput = {
    Bucket: bucket,
    Key: key,
    ...data,
  };

  const command = new DeleteObjectCommand(params);
  await client.send(command);

  return { message: "Object deleted successfully" };
}

/**
 * Execute LIST operation
 */
async function executeList(
  client: S3Client,
  bucket: string,
  data: any
): Promise<any> {
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
    objects: result.Contents || [],
    count: result.KeyCount || 0,
    isTruncated: result.IsTruncated || false,
    nextContinuationToken: result.NextContinuationToken,
    prefix: result.Prefix,
  };
}

const manifest = {
  name: 's3',
  version: '1.0.0',
  description: 'S3 service for file operations',
  operations: ['getObject', 'putObject', 'deleteObject', 'listObjects'],
  requiredParams: {
    getObject: ['bucket', 'key'],
    putObject: ['bucket', 'key', 'body'],
    deleteObject: ['bucket', 'key'],
    listObjects: ['bucket'],
  },
};

export const s3 = { execute, manifest };
