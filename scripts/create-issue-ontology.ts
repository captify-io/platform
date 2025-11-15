/**
 * Script to create Issue ontology node with issue-specific properties
 *
 * Issue-specific properties:
 * - status (backlog, todo, in-progress, in-review, done, cancelled)
 * - priority (none, low, medium, high, urgent)
 * - assigneeId, reporterId
 * - estimate, dueDate, completedAt
 * - identifier, number (e.g., ENG-123)
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';

const region = process.env.AWS_REGION || 'us-east-1';
const schema = process.env.SCHEMA || 'captify';

const client = new DynamoDBClient({ region });
const docClient = DynamoDBDocumentClient.from(client);

const ONTOLOGY_NODE_TABLE = `${schema}-ontology-object-type`;
const ISSUE_NODE_ID = 'core-issue';

// Issue-specific schema
const ISSUE_SCHEMA = {
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

    // Issue-specific fields
    identifier: { type: 'string', description: 'Issue identifier (e.g., ENG-123)', required: true },
    number: { type: 'number', description: 'Sequential number within team', required: true },
    title: { type: 'string', description: 'Issue title', required: true },
    workspaceId: { type: 'string', description: 'Workspace ID', required: true },
    teamId: { type: 'string', description: 'Team ID', required: true },

    status: {
      type: 'string',
      enum: ['backlog', 'todo', 'in-progress', 'in-review', 'done', 'cancelled'],
      description: 'Issue status',
      required: true,
    },
    priority: {
      type: 'string',
      enum: ['none', 'low', 'medium', 'high', 'urgent'],
      description: 'Issue priority',
    },

    // People
    assigneeId: { type: 'string', description: 'User ID of assignee' },
    reporterId: { type: 'string', description: 'User ID of reporter' },

    // Estimation & Dates
    estimate: { type: 'number', description: 'Story points or time estimate' },
    dueDate: { type: 'string', description: 'Due date (ISO 8601)' },
    completedAt: { type: 'string', description: 'Completion timestamp' },
    archivedAt: { type: 'string', description: 'Archive timestamp' },

    // Relationships (stored as IDs)
    projectId: { type: 'string', description: 'Parent project ID' },
    milestoneId: { type: 'string', description: 'Milestone ID' },
    cycleId: { type: 'string', description: 'Sprint/Cycle ID' },
    parentIssueId: { type: 'string', description: 'Parent issue ID (for sub-issues)' },
    blockedBy: {
      type: 'array',
      items: { type: 'string' },
      description: 'Issue IDs that block this issue',
    },
    blocking: {
      type: 'array',
      items: { type: 'string' },
      description: 'Issue IDs that this issue blocks',
    },
    labels: {
      type: 'array',
      items: { type: 'string' },
      description: 'Labels for categorization',
    },
  },
  required: ['id', 'identifier', 'number', 'title', 'workspaceId', 'teamId', 'status', 'createdAt', 'updatedAt', 'createdBy'],
};

// GSIs for Issue table
const ISSUE_INDEXES = {
  'workspaceId-status-index': {
    hashKey: 'workspaceId',
    rangeKey: 'status',
    type: 'GSI',
  },
  'teamId-status-index': {
    hashKey: 'teamId',
    rangeKey: 'status',
    type: 'GSI',
  },
  'projectId-status-index': {
    hashKey: 'projectId',
    rangeKey: 'status',
    type: 'GSI',
  },
  'assigneeId-index': {
    hashKey: 'assigneeId',
    type: 'GSI',
  },
  'status-priority-index': {
    hashKey: 'status',
    rangeKey: 'priority',
    type: 'GSI',
  },
  'identifier-index': {
    hashKey: 'identifier',
    type: 'GSI',
  },
};

async function createIssueNode() {
  console.log('======================================');
  console.log('Creating Issue Ontology Node');
  console.log('======================================\n');

  // Check if node exists
  const getCommand = new GetCommand({
    TableName: ONTOLOGY_NODE_TABLE,
    Key: { id: ISSUE_NODE_ID },
  });

  const existingNode = await docClient.send(getCommand);

  if (existingNode.Item) {
    console.log(`Node ${ISSUE_NODE_ID} already exists: ${existingNode.Item.name}`);
    console.log('Skipping creation.');
    process.exit(0);
  }

  // Create the node
  const now = new Date().toISOString();
  const issueNode = {
    id: ISSUE_NODE_ID,
    name: 'Issue',
    type: 'issue',
    category: 'entity',
    domain: 'Work',
    description: 'Individual units of work tracked within projects and teams',
    icon: 'CheckSquare',
    color: '#10b981',
    active: 'true',
    properties: {
      dataSource: 'core-issue',
      schema: ISSUE_SCHEMA,
      indexes: ISSUE_INDEXES,
    },
    createdAt: now,
    updatedAt: now,
  };

  const putCommand = new PutCommand({
    TableName: ONTOLOGY_NODE_TABLE,
    Item: issueNode,
  });

  await docClient.send(putCommand);

  console.log('\n✓ Successfully created Issue node');
  console.log('  - Added issue-specific schema');
  console.log('  - Added GSI definitions');
  console.log('  - DataSource: core-issue');
  console.log('======================================\n');
}

async function main() {
  try {
    await createIssueNode();
  } catch (error) {
    console.error('Error creating Issue node:', error);
    process.exit(1);
  }
}

main();
