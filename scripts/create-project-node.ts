/**
 * Script to create Project object type in ontology
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';

const region = process.env.AWS_REGION || 'us-east-1';
const schema = process.env.SCHEMA || 'captify';

const client = new DynamoDBClient({ region });
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = `${schema}-ontology-object-type`;
const SLUG = 'project';

// Project properties matching the ontology structure
const PROJECT_PROPERTIES = {
  // Universal properties
  id: {
    type: 'string',
    description: 'Unique identifier',
    required: true,
  },
  createdAt: {
    type: 'string',
    description: 'Creation timestamp (ISO 8601)',
    required: true,
  },
  updatedAt: {
    type: 'string',
    description: 'Last update timestamp (ISO 8601)',
    required: true,
  },
  createdBy: {
    type: 'string',
    description: 'User ID who created this entity',
    required: true,
  },
  updatedBy: {
    type: 'string',
    description: 'User ID who last updated this entity',
  },
  tags: {
    type: 'array',
    description: 'Flexible tags for categorization',
  },
  description: {
    type: 'string',
    description: 'Full description (rich text)',
  },

  // Project-specific fields
  name: {
    type: 'string',
    description: 'Project name',
    required: true,
  },
  workspaceId: {
    type: 'string',
    description: 'Workspace ID',
    required: true,
  },
  slug: {
    type: 'string',
    description: 'URL-friendly slug',
  },
  summary: {
    type: 'string',
    description: 'Short summary (rich text)',
  },
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
  lead: {
    type: 'string',
    description: 'User ID of project lead',
  },
  members: {
    type: 'array',
    description: 'User IDs of project members',
  },
  startDate: {
    type: 'string',
    description: 'Project start date (ISO 8601)',
  },
  targetDate: {
    type: 'string',
    description: 'Target completion date (ISO 8601)',
  },
  completedDate: {
    type: 'string',
    description: 'Actual completion date (ISO 8601)',
  },
  lastStatusUpdate: {
    type: 'string',
    description: 'Last status update timestamp',
  },
  initiativeId: {
    type: 'string',
    description: 'Parent initiative ID',
  },
  teamIds: {
    type: 'array',
    description: 'Associated team IDs',
  },
  dependencies: {
    type: 'array',
    description: 'Project IDs this project depends on',
  },
  progress: {
    type: 'number',
    description: 'Completion percentage (0-100)',
  },
  issueCount: {
    type: 'number',
    description: 'Total number of issues',
  },
  completedIssueCount: {
    type: 'number',
    description: 'Number of completed issues',
  },
  icon: {
    type: 'string',
    description: 'Icon name',
  },
  color: {
    type: 'string',
    description: 'Color hex code',
  },
};

async function createProjectNode() {
  console.log('======================================');
  console.log('Creating Project Object Type');
  console.log('======================================\n');

  // Check if node already exists
  const getCommand = new GetCommand({
    TableName: TABLE_NAME,
    Key: { slug: SLUG },
  });

  const existingNode = await docClient.send(getCommand);

  if (existingNode.Item) {
    console.log(`Object type "${SLUG}" already exists: ${existingNode.Item.name}`);
    console.log('Skipping creation.');
    return;
  }

  // Create the node
  const now = new Date().toISOString();
  const projectNode = {
    slug: SLUG,
    name: 'Project',
    app: 'core',
    version: 1,
    category: 'entity',
    domain: 'Work',
    description: 'Units of work with clear outcomes, comprised of issues and documents',
    icon: 'FolderKanban',
    color: '#3b82f6',
    status: 'active',
    tableName: 'core-project',
    properties: PROJECT_PROPERTIES,
    examples: [],
    x: 0,
    y: 0,
    createdAt: now,
    updatedAt: now,
  };

  const putCommand = new PutCommand({
    TableName: TABLE_NAME,
    Item: projectNode,
  });

  await docClient.send(putCommand);

  console.log('\n✓ Successfully created Project object type');
  console.log('  - Slug: project');
  console.log('  - Table: core-project');
  console.log('  - Properties: 25 fields defined');
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
