/**
 * Script to create Issue object type in ontology
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';

const region = process.env.AWS_REGION || 'us-east-1';
const schema = process.env.SCHEMA || 'captify';

const client = new DynamoDBClient({ region });
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = `${schema}-ontology-object-type`;
const SLUG = 'issue';

// Issue properties matching the ontology structure
const ISSUE_PROPERTIES = {
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

  // Issue-specific fields
  identifier: {
    type: 'string',
    description: 'Issue identifier (e.g., ENG-123)',
    required: true,
  },
  number: {
    type: 'number',
    description: 'Sequential number within team',
    required: true,
  },
  title: {
    type: 'string',
    description: 'Issue title',
    required: true,
  },
  workspaceId: {
    type: 'string',
    description: 'Workspace ID',
    required: true,
  },
  teamId: {
    type: 'string',
    description: 'Team ID',
    required: true,
  },
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
  assigneeId: {
    type: 'string',
    description: 'User ID of assignee',
  },
  reporterId: {
    type: 'string',
    description: 'User ID of reporter',
  },
  estimate: {
    type: 'number',
    description: 'Story points or time estimate',
  },
  dueDate: {
    type: 'string',
    description: 'Due date (ISO 8601)',
  },
  completedAt: {
    type: 'string',
    description: 'Completion timestamp',
  },
  archivedAt: {
    type: 'string',
    description: 'Archive timestamp',
  },
  projectId: {
    type: 'string',
    description: 'Parent project ID',
  },
  milestoneId: {
    type: 'string',
    description: 'Milestone ID',
  },
  cycleId: {
    type: 'string',
    description: 'Sprint/Cycle ID',
  },
  parentIssueId: {
    type: 'string',
    description: 'Parent issue ID (for sub-issues)',
  },
  blockedBy: {
    type: 'array',
    description: 'Issue IDs that block this issue',
  },
  blocking: {
    type: 'array',
    description: 'Issue IDs that this issue blocks',
  },
  labels: {
    type: 'array',
    description: 'Labels for categorization',
  },
};

async function createIssueNode() {
  console.log('======================================');
  console.log('Creating Issue Object Type');
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
  const issueNode = {
    slug: SLUG,
    name: 'Issue',
    app: 'core',
    version: 1,
    category: 'entity',
    domain: 'Work',
    description: 'Individual units of work tracked within projects and teams',
    icon: 'CheckSquare',
    color: '#10b981',
    status: 'active',
    tableName: 'core-issue',
    properties: ISSUE_PROPERTIES,
    examples: [],
    x: 0,
    y: 0,
    createdAt: now,
    updatedAt: now,
  };

  const putCommand = new PutCommand({
    TableName: TABLE_NAME,
    Item: issueNode,
  });

  await docClient.send(putCommand);

  console.log('\n✓ Successfully created Issue object type');
  console.log('  - Slug: issue');
  console.log('  - Table: core-issue');
  console.log('  - Properties: 27 fields defined');
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
