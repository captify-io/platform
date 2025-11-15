/**
 * Script to update Project ontology node with project-specific properties
 *
 * Project-specific properties:
 * - status, priority, health
 * - lead, members
 * - startDate, targetDate, completedDate, lastStatusUpdate
 * - projectType (problem-statement, use-case, feature, etc.)
 * - summary (short summary)
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const region = process.env.AWS_REGION || 'us-east-1';
const schema = process.env.SCHEMA || 'captify';

const client = new DynamoDBClient({ region });
const docClient = DynamoDBDocumentClient.from(client);

const ONTOLOGY_NODE_TABLE = `${schema}-core-ontology-node`;
const PROJECT_NODE_ID = 'core-project';

// Project-specific schema (extends universal properties)
const PROJECT_SCHEMA = {
  type: 'object',
  properties: {
    // Universal properties (will be merged)
    id: { type: 'string', description: 'Unique identifier', required: true },
    createdAt: { type: 'string', description: 'Creation timestamp', required: true },
    updatedAt: { type: 'string', description: 'Last update timestamp', required: true },
    createdBy: { type: 'string', description: 'User ID who created', required: true },
    updatedBy: { type: 'string', description: 'User ID who last updated' },
    tags: { type: 'array', items: { type: 'string' }, description: 'Tags' },
    description: { type: 'string', description: 'Full description (rich text)' },

    // Project-specific fields
    name: { type: 'string', description: 'Project name', required: true },
    workspaceId: { type: 'string', description: 'Workspace ID', required: true },
    slug: { type: 'string', description: 'URL-friendly identifier' },
    summary: { type: 'string', description: 'Short summary' },

    status: {
      type: 'string',
      enum: ['planned', 'active', 'paused', 'completed', 'cancelled'],
      description: 'Project status',
      required: true,
    },
    priority: {
      type: 'string',
      enum: ['none', 'low', 'medium', 'high', 'urgent'],
      description: 'Project priority',
    },
    health: {
      type: 'string',
      enum: ['on-track', 'at-risk', 'off-track', 'update-missing', 'no-update-expected'],
      description: 'Project health status',
    },
    projectType: {
      type: 'string',
      enum: ['problem-statement', 'use-case', 'feature', 'initiative', 'other'],
      description: 'Type/category of project',
    },

    // People
    lead: { type: 'string', description: 'User ID of project lead' },
    members: {
      type: 'array',
      items: { type: 'string' },
      description: 'User IDs of project members',
    },

    // Dates
    startDate: { type: 'string', description: 'Project start date (ISO 8601)' },
    targetDate: { type: 'string', description: 'Target completion date (ISO 8601)' },
    completedDate: { type: 'string', description: 'Actual completion date (ISO 8601)' },
    lastStatusUpdate: { type: 'string', description: 'Last status update timestamp' },

    // Relationships (stored as IDs, actual links in ontology-edge)
    initiativeId: { type: 'string', description: 'Parent initiative ID' },
    teamIds: {
      type: 'array',
      items: { type: 'string' },
      description: 'Team IDs (projects can span multiple teams)',
    },
    dependencies: {
      type: 'array',
      items: { type: 'string' },
      description: 'IDs of projects this depends on',
    },

    // Progress tracking
    progress: { type: 'number', description: 'Progress percentage (0-100)' },
    issueCount: { type: 'number', description: 'Total number of issues' },
    completedIssueCount: { type: 'number', description: 'Number of completed issues' },

    // Display
    icon: { type: 'string', description: 'Icon name' },
    color: { type: 'string', description: 'Color hex code' },
  },
  required: ['id', 'name', 'workspaceId', 'status', 'createdAt', 'updatedAt', 'createdBy'],
};

// GSIs for Project table
const PROJECT_INDEXES = {
  'workspaceId-status-index': {
    hashKey: 'workspaceId',
    rangeKey: 'status',
    type: 'GSI',
  },
  'workspaceId-targetDate-index': {
    hashKey: 'workspaceId',
    rangeKey: 'targetDate',
    type: 'GSI',
  },
  'lead-index': {
    hashKey: 'lead',
    type: 'GSI',
  },
  'status-priority-index': {
    hashKey: 'status',
    rangeKey: 'priority',
    type: 'GSI',
  },
};

async function updateProjectNode() {
  console.log('======================================');
  console.log('Updating Project Ontology Node');
  console.log('======================================\n');

  // Check if node exists
  const getCommand = new GetCommand({
    TableName: ONTOLOGY_NODE_TABLE,
    Key: { id: PROJECT_NODE_ID },
  });

  const existingNode = await docClient.send(getCommand);

  if (!existingNode.Item) {
    console.log(`Node ${PROJECT_NODE_ID} not found. Creating new node...`);

    // Create new Project node (you'll need to implement createProjectNode if it doesn't exist)
    console.error('Project node does not exist. Please create it first.');
    process.exit(1);
  }

  console.log(`Found existing node: ${existingNode.Item.name}`);

  // Update the node
  const updateCommand = new UpdateCommand({
    TableName: ONTOLOGY_NODE_TABLE,
    Key: { id: PROJECT_NODE_ID },
    UpdateExpression: 'SET properties.#schema = :schema, properties.#indexes = :indexes, updatedAt = :updatedAt',
    ExpressionAttributeNames: {
      '#schema': 'schema',
      '#indexes': 'indexes',
    },
    ExpressionAttributeValues: {
      ':schema': PROJECT_SCHEMA,
      ':indexes': PROJECT_INDEXES,
      ':updatedAt': new Date().toISOString(),
    },
  });

  await docClient.send(updateCommand);

  console.log('\n✓ Successfully updated Project node');
  console.log('  - Added project-specific schema');
  console.log('  - Added GSI definitions');
  console.log('======================================\n');
}

async function main() {
  try {
    await updateProjectNode();
  } catch (error) {
    console.error('Error updating Project node:', error);
    process.exit(1);
  }
}

main();
