/**
 * Pending Changes Storage
 *
 * Manages storage and retrieval of pending agent changes from DynamoDB
 */

import type { PendingChangesStorage } from '@captify-io/core/types';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';

const PENDING_CHANGES_TABLE = `${process.env.SCHEMA || 'captify'}-core-fabric-pending-change`;

/**
 * Create DynamoDB client from credentials
 */
function createDynamoClient(credentials) {
  const client = new DynamoDBClient({
    region: credentials.region || process.env.AWS_REGION || 'us-east-1',
    credentials: {
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
      sessionToken: credentials.sessionToken,
    },
  });

  return DynamoDBDocumentClient.from(client);
}

/**
 * Store a pending change in DynamoDB
 *
 * @param {Object} change - Pending change object
 * @param {Object} credentials - AWS credentials
 * @returns {Promise<Object>} Stored change
 */
export async function storePendingChange(change, credentials) {
  const docClient = createDynamoClient(credentials);

  const item = {
    id: change.id,
    documentId: change.documentId,
    userId: change.userId,
    agentId: change.agentId,
    threadId: change.threadId,

    // Change details
    type: change.type,
    version: change.version,
    position: change.position,
    steps: change.steps, // Store as JSON
    inverseSteps: change.inverseSteps, // Store as JSON

    // Display
    preview: change.preview,
    content: change.content, // Store as JSON
    reason: change.reason,

    // Status
    status: change.status || 'pending',
    createdAt: change.createdAt || Date.now(),
    expiresAt: change.expiresAt || Date.now() + 24 * 60 * 60 * 1000, // 24 hours default
    sequence: change.sequence || 0,

    // Metadata
    ttl: Math.floor((change.expiresAt || Date.now() + 24 * 60 * 60 * 1000) / 1000), // DynamoDB TTL
  };

  try {
    const command = new PutCommand({
      TableName: PENDING_CHANGES_TABLE,
      Item: item,
    });

    await docClient.send(command);

    console.log(`[PendingChangesStorage] Stored change ${change.id} for document ${change.documentId}`);
    return item;
  } catch (error) {
    console.error('[PendingChangesStorage] Error storing pending change:', error);
    throw error;
  }
}

/**
 * Get a pending change by ID
 *
 * @param {string} changeId - Change ID
 * @param {Object} credentials - AWS credentials
 * @returns {Promise<Object|null>} Pending change or null
 */
export async function getPendingChange(changeId, credentials) {
  const docClient = createDynamoClient(credentials);

  try {
    const command = new GetCommand({
      TableName: PENDING_CHANGES_TABLE,
      Key: { id: changeId },
    });

    const response = await docClient.send(command);
    return response.Item || null;
  } catch (error) {
    console.error('[PendingChangesStorage] Error getting pending change:', error);
    throw error;
  }
}

/**
 * Get all pending changes for a document
 *
 * @param {string} documentId - Document ID
 * @param {Object} credentials - AWS credentials
 * @returns {Promise<Array>} Array of pending changes
 */
export async function getPendingChangesForDocument(documentId, credentials) {
  const docClient = createDynamoClient(credentials);

  try {
    const command = new QueryCommand({
      TableName: PENDING_CHANGES_TABLE,
      IndexName: 'documentId-createdAt-index',
      KeyConditionExpression: 'documentId = :documentId',
      FilterExpression: '#status = :status',
      ExpressionAttributeNames: {
        '#status': 'status',
      },
      ExpressionAttributeValues: {
        ':documentId': documentId,
        ':status': 'pending',
      },
    });

    const response = await docClient.send(command);
    return response.Items || [];
  } catch (error) {
    console.error('[PendingChangesStorage] Error querying pending changes:', error);
    throw error;
  }
}

/**
 * Update change status (accept/reject)
 *
 * @param {string} changeId - Change ID
 * @param {string} status - New status ('accepted' or 'rejected')
 * @param {Object} credentials - AWS credentials
 * @returns {Promise<Object>} Updated change
 */
export async function updateChangeStatus(changeId, status, credentials) {
  const docClient = createDynamoClient(credentials);

  try {
    const command = new UpdateCommand({
      TableName: PENDING_CHANGES_TABLE,
      Key: { id: changeId },
      UpdateExpression: 'SET #status = :status, resolvedAt = :resolvedAt',
      ExpressionAttributeNames: {
        '#status': 'status',
      },
      ExpressionAttributeValues: {
        ':status': status,
        ':resolvedAt': Date.now(),
      },
      ReturnValues: 'ALL_NEW',
    });

    const response = await docClient.send(command);

    console.log(`[PendingChangesStorage] Updated change ${changeId} status to ${status}`);
    return response.Attributes;
  } catch (error) {
    console.error('[PendingChangesStorage] Error updating change status:', error);
    throw error;
  }
}

/**
 * Delete a pending change
 *
 * @param {string} changeId - Change ID
 * @param {Object} credentials - AWS credentials
 * @returns {Promise<void>}
 */
export async function deletePendingChange(changeId, credentials) {
  const docClient = createDynamoClient(credentials);

  try {
    const command = new DeleteCommand({
      TableName: PENDING_CHANGES_TABLE,
      Key: { id: changeId },
    });

    await docClient.send(command);

    console.log(`[PendingChangesStorage] Deleted change ${changeId}`);
  } catch (error) {
    console.error('[PendingChangesStorage] Error deleting pending change:', error);
    throw error;
  }
}

/**
 * Get pending changes for a user
 *
 * @param {string} userId - User ID
 * @param {Object} credentials - AWS credentials
 * @returns {Promise<Array>} Array of pending changes
 */
export async function getPendingChangesForUser(userId, credentials) {
  const docClient = createDynamoClient(credentials);

  try {
    const command = new QueryCommand({
      TableName: PENDING_CHANGES_TABLE,
      IndexName: 'userId-createdAt-index',
      KeyConditionExpression: 'userId = :userId',
      FilterExpression: '#status = :status',
      ExpressionAttributeNames: {
        '#status': 'status',
      },
      ExpressionAttributeValues: {
        ':userId': userId,
        ':status': 'pending',
      },
    });

    const response = await docClient.send(command);
    return response.Items || [];
  } catch (error) {
    console.error('[PendingChangesStorage] Error querying pending changes for user:', error);
    throw error;
  }
}

/**
 * Platform implementation of PendingChangesStorage interface
 *
 * This adapter provides the storage implementation that gets injected
 * into core's fabric service via the API route.
 */
export const platformPendingChangesStorage: PendingChangesStorage = {
  getPendingChange,
  updateChangeStatus,
  getPendingChangesForDocument,

  // Create pending change - maps to storePendingChange
  async createPendingChange(change, credentials) {
    return await storePendingChange(
      {
        id: `change-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        ...change,
      },
      credentials
    );
  },

  deletePendingChange,
};
