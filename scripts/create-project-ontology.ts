/**
 * Script to create Project ontology node with all project-specific properties
 *
 * Project-specific properties:
 * - name, workspaceId, slug, summary
 * - status (planned, active, paused, completed, cancelled)
 * - priority (none, low, medium, high, urgent)
 * - health (on-track, at-risk, off-track, update-missing, no-update-expected)
 * - projectType (problem-statement, use-case, feature, initiative, other)
 * - lead, members
 * - startDate, targetDate, completedDate, lastStatusUpdate
 * - initiativeId, teamIds, dependencies
 * - progress, issueCount, completedIssueCount
 * - icon, color
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';

const region = process.env.AWS_REGION || 'us-east-1';
const schema = process.env.SCHEMA || 'captify';

const client = new DynamoDBClient({ region });
const docClient = DynamoDBDocumentClient.from(client);

const ONTOLOGY_NODE_TABLE = `${schema}-ontology-object-type`;
const PROJECT_NODE_ID = 'core-project';

// Project-specific schema
const PROJECT_SCHEMA = {
  type: 'object',
  properties: {
    // Universal properties
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
    slug: { type: 'string', description: 'URL-friendly slug' },
    summary: { type: 'string', description: 'Short summary (rich text)' },

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
      description: 'Type of project',
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

    // Relationships (stored as IDs, actual relationships use OntologyEdge)
    initiativeId: { type: 'string', description: 'Parent initiative ID' },
    teamIds: {
      type: 'array',
      items: { type: 'string' },
      description: 'Associated team IDs',
    },
    dependencies: {
      type: 'array',
      items: { type: 'string' },
      description: 'Project IDs this project depends on',
    },

    // Progress tracking
    progress: { type: 'number', description: 'Completion percentage (0-100)' },
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

async function createProjectNode() {
  console.log('======================================');
  console.log('Creating Project Ontology Node');
  console.log('======================================\n');

  // Check if node already exists
  const getCommand = new GetCommand({
    TableName: ONTOLOGY_NODE_TABLE,
    Key: { id: PROJECT_NODE_ID },
  });

  const existingNode = await docClient.send(getCommand);

  if (existingNode.Item) {
    console.log(`Node ${PROJECT_NODE_ID} already exists: ${existingNode.Item.name}`);
    console.log('Skipping creation.');
    process.exit(0);
  }

  // Create the node
  const now = new Date().toISOString();
  const projectNode = {
    id: PROJECT_NODE_ID,
    name: 'Project',
    type: 'project',
    category: 'entity',
    domain: 'Work',
    description: 'Units of work with clear outcomes, comprised of issues and documents',
    icon: 'FolderKanban',
    color: '#3b82f6',
    active: 'true',
    properties: {
      dataSource: 'core-project',
      schema: PROJECT_SCHEMA,
      indexes: PROJECT_INDEXES,
    },
    createdAt: now,
    updatedAt: now,
  };

  const putCommand = new PutCommand({
    TableName: ONTOLOGY_NODE_TABLE,
    Item: projectNode,
  });

  await docClient.send(putCommand);

  console.log('\n✓ Successfully created Project node');
  console.log('  - Added project-specific schema');
  console.log('  - Added GSI definitions');
  console.log('  - DataSource: core-project');
  console.log('======================================\n');
}

async function main() {
  try {
    await createProjectNode();
  } catch (error) {
    console.error('Error creating Project node:', error);
    process.exit(1);
  }
}

main();
