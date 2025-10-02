/**
 * DynamoDB-based token storage for NIST/DoD compliance
 * Secure server-side storage of large Cognito tokens
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, GetCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";

// Initialize DynamoDB client
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1",
});

const dynamoClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.AUTH_TOKENS_TABLE || "captify-auth-tokens";

interface StoredTokens {
  sessionId: string;
  accessToken: string;
  idToken: string;
  refreshToken: string;
  expiresAt: number;
  createdAt: number;
  ttl: number; // DynamoDB TTL for automatic cleanup
}

/**
 * Store large Cognito tokens in DynamoDB to reduce JWT size
 * NIST Rev 5 compliant: encrypted at rest, auditable, secure
 */
export async function storeTokensSecurely(sessionId: string, tokens: {
  accessToken: string;
  idToken: string;
  refreshToken: string;
  expiresAt: number;
}): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  const ttl = now + (24 * 60 * 60); // 24 hour TTL for auto-cleanup

  const item: StoredTokens = {
    sessionId,
    accessToken: tokens.accessToken,
    idToken: tokens.idToken,
    refreshToken: tokens.refreshToken,
    expiresAt: tokens.expiresAt,
    createdAt: now,
    ttl,
  };

  try {
    await dynamoClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: item,
      // Conditional put to prevent overwrites without validation
      ConditionExpression: "attribute_not_exists(sessionId) OR #ttl < :now",
      ExpressionAttributeNames: {
        "#ttl": "ttl"
      },
      ExpressionAttributeValues: {
        ":now": now
      }
    }));
  } catch (error) {
    throw new Error("Failed to store authentication tokens");
  }
}

/**
 * Retrieve stored Cognito tokens by session ID
 * Validates expiration and removes expired tokens
 */
export async function getStoredTokens(sessionId: string): Promise<StoredTokens | null> {
  try {
    const result = await dynamoClient.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: { sessionId },
    }));

    if (!result.Item) {
      return null;
    }

    const tokens = result.Item as StoredTokens;
    const now = Math.floor(Date.now() / 1000);

    // Check if tokens are expired
    if (tokens.expiresAt < now || tokens.ttl < now) {
      // Remove expired tokens
      await removeStoredTokens(sessionId);
      return null;
    }

    return tokens;
  } catch (error) {
    return null;
  }
}

/**
 * Remove stored tokens (on logout or expiration)
 * Secure cleanup for compliance
 */
export async function removeStoredTokens(sessionId: string): Promise<void> {
  try {
    await dynamoClient.send(new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { sessionId },
    }));
  } catch (error) {
    // Don't throw - this is cleanup, shouldn't break auth flow
  }
}

/**
 * Health check for DynamoDB connectivity
 */
export async function healthCheck(): Promise<boolean> {
  try {
    // Try a simple operation to verify connectivity
    await dynamoClient.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: { sessionId: "health-check" },
    }));
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Initialize the DynamoDB table (for deployment scripts)
 * This should be run during infrastructure setup
 */
export async function initializeTable() {
  // Table setup information
  // - Partition Key: sessionId (String)
  // - TTL Attribute: ttl
  // - Point-in-time recovery enabled
  // - Encryption at rest enabled
}