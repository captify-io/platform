/**
 * Create Ontology Nodes for App Management System
 *
 * This script creates ontology nodes for:
 * - core-app-member
 * - core-app-role
 * - core-app-access-request
 * - core-app (if not exists)
 *
 * Run with: npx tsx scripts/create-app-ontology-nodes.ts
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import type { OntologyNode } from "@captify-io/core/services/ontology/types";
import { createRequire } from 'module';

// Load shared environment
const require = createRequire(import.meta.url);
const sharedEnv = require('../../shared.env.cjs');

const SCHEMA = sharedEnv.SCHEMA || 'captify';
const AWS_REGION = sharedEnv.AWS_REGION || 'us-east-1';
const AWS_ACCESS_KEY_ID = sharedEnv.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = sharedEnv.AWS_SECRET_ACCESS_KEY;

// Create DynamoDB client with credentials
const client = new DynamoDBClient({
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY
  }
});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = `${SCHEMA}-core-ontology-node`;

// ===============================================================
// ONTOLOGY NODE DEFINITIONS
// ===============================================================

const appMemberNode: OntologyNode = {
  // Identity
  id: 'core-appMember',
  type: 'appMember',
  category: 'entity',
  domain: 'Core',

  // Application context
  app: 'core',
  schema: SCHEMA,
  tenantId: 'default',

  // Human-readable
  slug: 'app-member',
  name: 'App Member',
  description: 'Links users to applications with specific roles and permissions',

  // Visual properties
  icon: 'Users',
  color: '#3b82f6',

  // Metadata
  order: '100',
  fields: {},

  // Schema definition
  properties: {
    dataSource: 'core-app-member',
    schema: {
      properties: {
        id: {
          type: 'string',
          description: 'Unique identifier (UUID)',
          required: true,
          format: 'uuid'
        },
        userId: {
          type: 'string',
          description: 'User ID (Cognito sub)',
          required: true
        },
        appId: {
          type: 'string',
          description: 'Application ID (slug)',
          required: true
        },
        appSlug: {
          type: 'string',
          description: 'Application slug (same as appId)',
          required: true
        },
        role: {
          type: 'enum',
          enum: ['technical', 'manager', 'executive', 'admin', 'user', 'viewer'],
          description: 'User role within the application',
          required: true,
          default: 'user'
        },
        status: {
          type: 'enum',
          enum: ['pending', 'active', 'suspended', 'revoked'],
          description: 'Membership status',
          required: true,
          default: 'pending'
        },
        iamRoleArn: {
          type: 'string',
          description: 'AWS IAM role ARN for this user in this app',
          nullable: true
        },
        requestedAt: {
          type: 'string',
          format: 'date-time',
          description: 'When access was requested (ISO 8601)',
          nullable: true
        },
        approvedAt: {
          type: 'string',
          format: 'date-time',
          description: 'When access was approved (ISO 8601)',
          nullable: true
        },
        approvedBy: {
          type: 'string',
          description: 'Admin who approved access (user ID)',
          nullable: true
        },
        grantedBy: {
          type: 'string',
          description: 'User who granted access (user ID)',
          nullable: true
        },
        grantedAt: {
          type: 'string',
          format: 'date-time',
          description: 'When access was granted (ISO 8601)',
          nullable: true
        },
        expiresAt: {
          type: 'string',
          format: 'date-time',
          description: 'Optional expiration date (ISO 8601)',
          nullable: true
        },
        managedSpaces: {
          type: 'array',
          items: { type: 'string' },
          description: 'Space IDs managed by this user (for manager role)',
          nullable: true
        },
        customPermissions: {
          type: 'array',
          items: { type: 'object' },
          description: 'Additional IAM policy statements',
          nullable: true
        },
        metadata: {
          type: 'object',
          description: 'App-specific metadata',
          nullable: true
        }
      },
      required: ['userId', 'appId', 'role', 'status']
    },
    indexes: {
      'userId-appSlug-index': {
        hashKey: 'userId',
        rangeKey: 'appSlug',
        type: 'GSI'
      },
      'appSlug-status-index': {
        hashKey: 'appSlug',
        rangeKey: 'status',
        type: 'GSI'
      },
      'appSlug-userId-index': {
        hashKey: 'appSlug',
        rangeKey: 'userId',
        type: 'GSI'
      },
      'status-index': {
        hashKey: 'status',
        type: 'GSI'
      }
    }
  },

  // Ownership & audit
  ownerId: 'system',
  createdAt: new Date().toISOString(),
  createdBy: 'system',
  updatedAt: new Date().toISOString(),
  updatedBy: 'system'
};

const appRoleNode: OntologyNode = {
  // Identity
  id: 'core-appRole',
  type: 'appRole',
  category: 'entity',
  domain: 'Core',

  // Application context
  app: 'core',
  schema: SCHEMA,
  tenantId: 'default',

  // Human-readable
  slug: 'app-role',
  name: 'App Role',
  description: 'Defines available IAM roles and permissions for applications',

  // Visual properties
  icon: 'Shield',
  color: '#8b5cf6',

  // Metadata
  order: '101',
  fields: {},

  // Schema definition
  properties: {
    dataSource: 'core-app-role',
    schema: {
      properties: {
        id: {
          type: 'string',
          description: 'Unique identifier (format: {appId}-{role})',
          required: true
        },
        appId: {
          type: 'string',
          description: 'Application ID',
          required: true
        },
        appSlug: {
          type: 'string',
          description: 'Application slug (same as appId)',
          required: true
        },
        role: {
          type: 'enum',
          enum: ['technical', 'manager', 'executive', 'admin', 'user', 'viewer'],
          description: 'Role name',
          required: true
        },
        displayName: {
          type: 'string',
          description: 'Human-readable role name (e.g., "Administrator")',
          required: true
        },
        description: {
          type: 'string',
          description: 'Role description',
          required: true
        },
        iamRoleArn: {
          type: 'string',
          description: 'AWS IAM role ARN',
          nullable: true
        },
        iamPolicyDocument: {
          type: 'object',
          description: 'IAM policy JSON document',
          nullable: true
        },
        permissions: {
          type: 'array',
          items: { type: 'string' },
          description: 'High-level permissions list for display',
          nullable: true
        },
        isDefault: {
          type: 'boolean',
          description: 'Whether this is the default role for new members',
          default: false
        }
      },
      required: ['appId', 'role', 'displayName', 'description']
    },
    indexes: {
      'appSlug-role-index': {
        hashKey: 'appSlug',
        rangeKey: 'role',
        type: 'GSI'
      },
      'appSlug-index': {
        hashKey: 'appSlug',
        type: 'GSI'
      }
    }
  },

  // Ownership & audit
  ownerId: 'system',
  createdAt: new Date().toISOString(),
  createdBy: 'system',
  updatedAt: new Date().toISOString(),
  updatedBy: 'system'
};

const appAccessRequestNode: OntologyNode = {
  // Identity
  id: 'core-appAccessRequest',
  type: 'appAccessRequest',
  category: 'entity',
  domain: 'Core',

  // Application context
  app: 'core',
  schema: SCHEMA,
  tenantId: 'default',

  // Human-readable
  slug: 'app-access-request',
  name: 'App Access Request',
  description: 'User requests for application access',

  // Visual properties
  icon: 'UserPlus',
  color: '#10b981',

  // Metadata
  order: '102',
  fields: {},

  // Schema definition
  properties: {
    dataSource: 'core-app-access-request',
    schema: {
      properties: {
        id: {
          type: 'string',
          description: 'Unique identifier (UUID)',
          required: true,
          format: 'uuid'
        },
        userId: {
          type: 'string',
          description: 'Requesting user ID',
          required: true
        },
        appId: {
          type: 'string',
          description: 'Target application ID',
          required: true
        },
        appSlug: {
          type: 'string',
          description: 'Application slug (same as appId)',
          required: true
        },
        requestedRole: {
          type: 'enum',
          enum: ['technical', 'manager', 'executive', 'admin', 'user', 'viewer'],
          description: 'Requested role',
          required: true,
          default: 'user'
        },
        justification: {
          type: 'string',
          description: 'Why access is needed',
          nullable: true,
          maxLength: 1000
        },
        status: {
          type: 'enum',
          enum: ['pending', 'approved', 'denied'],
          description: 'Request status',
          required: true,
          default: 'pending'
        },
        requestedAt: {
          type: 'string',
          format: 'date-time',
          description: 'Request timestamp (ISO 8601)',
          required: true
        },
        reviewedAt: {
          type: 'string',
          format: 'date-time',
          description: 'Review timestamp (ISO 8601)',
          nullable: true
        },
        reviewedBy: {
          type: 'string',
          description: 'Admin who reviewed (user ID)',
          nullable: true
        },
        reviewNotes: {
          type: 'string',
          description: 'Admin notes about the decision',
          nullable: true,
          maxLength: 1000
        }
      },
      required: ['userId', 'appId', 'requestedRole', 'status', 'requestedAt']
    },
    indexes: {
      'userId-requestedAt-index': {
        hashKey: 'userId',
        rangeKey: 'requestedAt',
        type: 'GSI'
      },
      'appSlug-status-index': {
        hashKey: 'appSlug',
        rangeKey: 'status',
        type: 'GSI'
      },
      'status-requestedAt-index': {
        hashKey: 'status',
        rangeKey: 'requestedAt',
        type: 'GSI'
      },
      'appSlug-requestedAt-index': {
        hashKey: 'appSlug',
        rangeKey: 'requestedAt',
        type: 'GSI'
      }
    }
  },

  // Ownership & audit
  ownerId: 'system',
  createdAt: new Date().toISOString(),
  createdBy: 'system',
  updatedAt: new Date().toISOString(),
  updatedBy: 'system'
};

const appNode: OntologyNode = {
  // Identity
  id: 'core-app',
  type: 'app',
  category: 'entity',
  domain: 'Core',

  // Application context
  app: 'core',
  schema: SCHEMA,
  tenantId: 'default',

  // Human-readable
  slug: 'app',
  name: 'Application',
  description: 'Platform applications and their configurations',

  // Visual properties
  icon: 'AppWindow',
  color: '#f59e0b',

  // Metadata
  order: '99',
  fields: {},

  // Schema definition
  properties: {
    dataSource: 'core-app',
    schema: {
      properties: {
        id: {
          type: 'string',
          description: 'Unique identifier (UUID)',
          required: true,
          format: 'uuid'
        },
        slug: {
          type: 'string',
          description: 'URL-safe identifier',
          required: true,
          pattern: '^[a-z0-9-]+$'
        },
        name: {
          type: 'string',
          description: 'Display name',
          required: true
        },
        description: {
          type: 'string',
          description: 'App description',
          required: true
        },
        icon: {
          type: 'string',
          description: 'Icon name',
          default: 'AppWindow'
        },
        color: {
          type: 'string',
          description: 'Brand color',
          default: '#3b82f6'
        },
        category: {
          type: 'enum',
          enum: ['productivity', 'collaboration', 'analytics', 'development', 'admin', 'system'],
          description: 'App category',
          default: 'productivity'
        },
        visibility: {
          type: 'enum',
          enum: ['public', 'internal', 'private'],
          description: 'Visibility level',
          required: true,
          default: 'internal'
        },
        status: {
          type: 'enum',
          enum: ['active', 'inactive', 'maintenance'],
          description: 'App status',
          required: true,
          default: 'active'
        },
        version: {
          type: 'string',
          description: 'Semantic version',
          pattern: '^\\d+\\.\\d+\\.\\d+$',
          default: '1.0.0'
        },
        menu: {
          type: 'array',
          items: { type: 'object' },
          description: 'Menu structure',
          nullable: true
        },
        features: {
          type: 'array',
          items: { type: 'object' },
          description: 'Feature list',
          nullable: true
        },
        agentId: {
          type: 'string',
          description: 'Bedrock agent ID',
          nullable: true
        },
        agentAliasId: {
          type: 'string',
          description: 'Bedrock agent alias',
          nullable: true
        },
        knowledgeBaseId: {
          type: 'string',
          description: 'Bedrock knowledge base ID',
          nullable: true
        },
        s3BucketName: {
          type: 'string',
          description: 'S3 bucket name',
          nullable: true
        },
        identityPoolId: {
          type: 'string',
          description: 'Cognito identity pool ID',
          nullable: true
        }
      },
      required: ['slug', 'name', 'description', 'visibility', 'status']
    },
    indexes: {
      'slug-index': {
        hashKey: 'slug',
        type: 'GSI'
      },
      'status-index': {
        hashKey: 'status',
        type: 'GSI'
      },
      'category-status-index': {
        hashKey: 'category',
        rangeKey: 'status',
        type: 'GSI'
      }
    }
  },

  // Ownership & audit
  ownerId: 'system',
  createdAt: new Date().toISOString(),
  createdBy: 'system',
  updatedAt: new Date().toISOString(),
  updatedBy: 'system'
};

// ===============================================================
// INSERT FUNCTIONS
// ===============================================================

async function insertNode(node: OntologyNode): Promise<void> {
  console.log(`\nInserting node: ${node.id}`);

  // Check if exists
  const getCommand = new GetCommand({
    TableName: TABLE_NAME,
    Key: { id: node.id }
  });

  const existing = await docClient.send(getCommand);
  if (existing.Item) {
    console.log(`  ⚠️  Node ${node.id} already exists. Updating...`);
  }

  // Insert or update
  const putCommand = new PutCommand({
    TableName: TABLE_NAME,
    Item: node
  });

  await docClient.send(putCommand);
  console.log(`  ✅ Node ${node.id} inserted successfully`);
  console.log(`     Type: ${node.type}`);
  console.log(`     Name: ${node.name}`);
  console.log(`     DataSource: ${node.properties?.dataSource}`);
  console.log(`     Indexes: ${Object.keys(node.properties?.indexes || {}).join(', ')}`);
}

// ===============================================================
// MAIN
// ===============================================================

async function main() {
  console.log('='.repeat(60));
  console.log('Creating App Management Ontology Nodes');
  console.log('='.repeat(60));
  console.log(`Schema: ${SCHEMA}`);
  console.log(`Table: ${TABLE_NAME}`);
  console.log(`Region: ${AWS_REGION}`);

  try {
    // Insert nodes
    await insertNode(appNode);
    await insertNode(appMemberNode);
    await insertNode(appRoleNode);
    await insertNode(appAccessRequestNode);

    console.log('\n' + '='.repeat(60));
    console.log('✅ All ontology nodes created successfully!');
    console.log('='.repeat(60));
    console.log('\nNext steps:');
    console.log('1. Create ontology edges for relationships');
    console.log('2. Build membership service');
    console.log('3. Update access control logic');
    console.log('4. Build app catalog UI');

  } catch (error) {
    console.error('\n❌ Error creating ontology nodes:', error);
    process.exit(1);
  }
}

main();
