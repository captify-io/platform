#!/usr/bin/env tsx
/**
 * Create DynamoDB Tables for Spaces Feature
 *
 * Creates all required tables for the Spaces work management system:
 * - 13 core entity tables
 * - 2 join tables (many-to-many relationships)
 * - ~25 Global Secondary Indexes for efficient querying
 *
 * Usage:
 *   tsx platform/scripts/create-spaces-tables.ts
 *
 * Requirements:
 *   - AWS credentials configured (via env or ~/.aws/credentials)
 *   - DynamoDB create/describe permissions
 *   - SCHEMA environment variable set (defaults to 'captify')
 */

import {
  DynamoDBClient,
  CreateTableCommand,
  DescribeTableCommand,
  waitUntilTableExists,
  type CreateTableCommandInput,
  type KeySchemaElement,
  type AttributeDefinition,
  type GlobalSecondaryIndex,
} from '@aws-sdk/client-dynamodb';

const SCHEMA = process.env.SCHEMA || 'captify';
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';

const client = new DynamoDBClient({ region: AWS_REGION });

// Table definitions
const tables: CreateTableCommandInput[] = [
  // ===== CORE ENTITY TABLES =====

  {
    TableName: `${SCHEMA}-core-spaces-space`,
    KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
    AttributeDefinitions: [
      { AttributeName: 'id', AttributeType: 'S' },
      { AttributeName: 'ownerId', AttributeType: 'S' },
      { AttributeName: 'type', AttributeType: 'S' },
      { AttributeName: 'tenantId', AttributeType: 'S' },
      { AttributeName: 'status', AttributeType: 'S' },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'ownerId-index',
        KeySchema: [{ AttributeName: 'ownerId', KeyType: 'HASH' }],
        Projection: { ProjectionType: 'ALL' },
      },
      {
        IndexName: 'type-index',
        KeySchema: [{ AttributeName: 'type', KeyType: 'HASH' }],
        Projection: { ProjectionType: 'ALL' },
      },
      {
        IndexName: 'tenantId-index',
        KeySchema: [{ AttributeName: 'tenantId', KeyType: 'HASH' }],
        Projection: { ProjectionType: 'ALL' },
      },
      {
        IndexName: 'status-index',
        KeySchema: [{ AttributeName: 'status', KeyType: 'HASH' }],
        Projection: { ProjectionType: 'ALL' },
      },
    ],
    BillingMode: 'PAY_PER_REQUEST',
  },

  {
    TableName: `${SCHEMA}-core-contract`,
    KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
    AttributeDefinitions: [
      { AttributeName: 'id', AttributeType: 'S' },
      { AttributeName: 'contractNumber', AttributeType: 'S' },
      { AttributeName: 'status', AttributeType: 'S' },
      { AttributeName: 'tenantId', AttributeType: 'S' },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'contractNumber-index',
        KeySchema: [{ AttributeName: 'contractNumber', KeyType: 'HASH' }],
        Projection: { ProjectionType: 'ALL' },
      },
      {
        IndexName: 'status-index',
        KeySchema: [{ AttributeName: 'status', KeyType: 'HASH' }],
        Projection: { ProjectionType: 'ALL' },
      },
      {
        IndexName: 'tenantId-index',
        KeySchema: [{ AttributeName: 'tenantId', KeyType: 'HASH' }],
        Projection: { ProjectionType: 'ALL' },
      },
    ],
    BillingMode: 'PAY_PER_REQUEST',
  },

  {
    TableName: `${SCHEMA}-core-clin`,
    KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
    AttributeDefinitions: [
      { AttributeName: 'id', AttributeType: 'S' },
      { AttributeName: 'contractId', AttributeType: 'S' },
      { AttributeName: 'clinNumber', AttributeType: 'S' },
      { AttributeName: 'status', AttributeType: 'S' },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'contractId-index',
        KeySchema: [{ AttributeName: 'contractId', KeyType: 'HASH' }],
        Projection: { ProjectionType: 'ALL' },
      },
      {
        IndexName: 'clinNumber-index',
        KeySchema: [{ AttributeName: 'clinNumber', KeyType: 'HASH' }],
        Projection: { ProjectionType: 'ALL' },
      },
      {
        IndexName: 'status-index',
        KeySchema: [{ AttributeName: 'status', KeyType: 'HASH' }],
        Projection: { ProjectionType: 'ALL' },
      },
    ],
    BillingMode: 'PAY_PER_REQUEST',
  },

  {
    TableName: `${SCHEMA}-core-spaces-workstream`,
    KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
    AttributeDefinitions: [
      { AttributeName: 'id', AttributeType: 'S' },
      { AttributeName: 'clinId', AttributeType: 'S' },
      { AttributeName: 'name', AttributeType: 'S' },
      { AttributeName: 'type', AttributeType: 'S' },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'clinId-index',
        KeySchema: [{ AttributeName: 'clinId', KeyType: 'HASH' }],
        Projection: { ProjectionType: 'ALL' },
      },
      {
        IndexName: 'name-index',
        KeySchema: [{ AttributeName: 'name', KeyType: 'HASH' }],
        Projection: { ProjectionType: 'ALL' },
      },
      {
        IndexName: 'type-index',
        KeySchema: [{ AttributeName: 'type', KeyType: 'HASH' }],
        Projection: { ProjectionType: 'ALL' },
      },
    ],
    BillingMode: 'PAY_PER_REQUEST',
  },

  {
    TableName: `${SCHEMA}-core-spaces-capability`,
    KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
    AttributeDefinitions: [
      { AttributeName: 'id', AttributeType: 'S' },
      { AttributeName: 'workstreamId', AttributeType: 'S' },
      { AttributeName: 'status', AttributeType: 'S' },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'workstreamId-index',
        KeySchema: [{ AttributeName: 'workstreamId', KeyType: 'HASH' }],
        Projection: { ProjectionType: 'ALL' },
      },
      {
        IndexName: 'status-index',
        KeySchema: [{ AttributeName: 'status', KeyType: 'HASH' }],
        Projection: { ProjectionType: 'ALL' },
      },
    ],
    BillingMode: 'PAY_PER_REQUEST',
  },

  {
    TableName: `${SCHEMA}-core-spaces-feature`,
    KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
    AttributeDefinitions: [
      { AttributeName: 'id', AttributeType: 'S' },
      { AttributeName: 'spaceId', AttributeType: 'S' },
      { AttributeName: 'status', AttributeType: 'S' },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'spaceId-index',
        KeySchema: [{ AttributeName: 'spaceId', KeyType: 'HASH' }],
        Projection: { ProjectionType: 'ALL' },
      },
      {
        IndexName: 'status-index',
        KeySchema: [{ AttributeName: 'status', KeyType: 'HASH' }],
        Projection: { ProjectionType: 'ALL' },
      },
    ],
    BillingMode: 'PAY_PER_REQUEST',
  },

  {
    TableName: `${SCHEMA}-core-spaces-user-story`,
    KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
    AttributeDefinitions: [
      { AttributeName: 'id', AttributeType: 'S' },
      { AttributeName: 'featureId', AttributeType: 'S' },
      { AttributeName: 'status', AttributeType: 'S' },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'featureId-index',
        KeySchema: [{ AttributeName: 'featureId', KeyType: 'HASH' }],
        Projection: { ProjectionType: 'ALL' },
      },
      {
        IndexName: 'status-index',
        KeySchema: [{ AttributeName: 'status', KeyType: 'HASH' }],
        Projection: { ProjectionType: 'ALL' },
      },
    ],
    BillingMode: 'PAY_PER_REQUEST',
  },

  {
    TableName: `${SCHEMA}-core-spaces-task`,
    KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
    AttributeDefinitions: [
      { AttributeName: 'id', AttributeType: 'S' },
      { AttributeName: 'spaceId', AttributeType: 'S' },
      { AttributeName: 'status', AttributeType: 'S' },
      { AttributeName: 'assignee', AttributeType: 'S' },
      { AttributeName: 'userStoryId', AttributeType: 'S' },
      { AttributeName: 'sprintId', AttributeType: 'S' },
      { AttributeName: 'featureId', AttributeType: 'S' },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'spaceId-status-index',
        KeySchema: [
          { AttributeName: 'spaceId', KeyType: 'HASH' },
          { AttributeName: 'status', KeyType: 'RANGE' },
        ],
        Projection: { ProjectionType: 'ALL' },
      },
      {
        IndexName: 'assignee-status-index',
        KeySchema: [
          { AttributeName: 'assignee', KeyType: 'HASH' },
          { AttributeName: 'status', KeyType: 'RANGE' },
        ],
        Projection: { ProjectionType: 'ALL' },
      },
      {
        IndexName: 'userStoryId-index',
        KeySchema: [{ AttributeName: 'userStoryId', KeyType: 'HASH' }],
        Projection: { ProjectionType: 'ALL' },
      },
      {
        IndexName: 'sprintId-index',
        KeySchema: [{ AttributeName: 'sprintId', KeyType: 'HASH' }],
        Projection: { ProjectionType: 'ALL' },
      },
      {
        IndexName: 'featureId-index',
        KeySchema: [{ AttributeName: 'featureId', KeyType: 'HASH' }],
        Projection: { ProjectionType: 'ALL' },
      },
    ],
    BillingMode: 'PAY_PER_REQUEST',
  },

  {
    TableName: `${SCHEMA}-core-spaces-ticket`,
    KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
    AttributeDefinitions: [
      { AttributeName: 'id', AttributeType: 'S' },
      { AttributeName: 'spaceId', AttributeType: 'S' },
      { AttributeName: 'status', AttributeType: 'S' },
      { AttributeName: 'assignee', AttributeType: 'S' },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'spaceId-status-index',
        KeySchema: [
          { AttributeName: 'spaceId', KeyType: 'HASH' },
          { AttributeName: 'status', KeyType: 'RANGE' },
        ],
        Projection: { ProjectionType: 'ALL' },
      },
      {
        IndexName: 'assignee-status-index',
        KeySchema: [
          { AttributeName: 'assignee', KeyType: 'HASH' },
          { AttributeName: 'status', KeyType: 'RANGE' },
        ],
        Projection: { ProjectionType: 'ALL' },
      },
    ],
    BillingMode: 'PAY_PER_REQUEST',
  },

  {
    TableName: `${SCHEMA}-core-spaces-time-entry`,
    KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
    AttributeDefinitions: [
      { AttributeName: 'id', AttributeType: 'S' },
      { AttributeName: 'userId', AttributeType: 'S' },
      { AttributeName: 'date', AttributeType: 'S' },
      { AttributeName: 'taskId', AttributeType: 'S' },
      { AttributeName: 'clinId', AttributeType: 'S' },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'userId-date-index',
        KeySchema: [
          { AttributeName: 'userId', KeyType: 'HASH' },
          { AttributeName: 'date', KeyType: 'RANGE' },
        ],
        Projection: { ProjectionType: 'ALL' },
      },
      {
        IndexName: 'taskId-index',
        KeySchema: [{ AttributeName: 'taskId', KeyType: 'HASH' }],
        Projection: { ProjectionType: 'ALL' },
      },
      {
        IndexName: 'clinId-index',
        KeySchema: [{ AttributeName: 'clinId', KeyType: 'HASH' }],
        Projection: { ProjectionType: 'ALL' },
      },
      {
        IndexName: 'date-index',
        KeySchema: [{ AttributeName: 'date', KeyType: 'HASH' }],
        Projection: { ProjectionType: 'ALL' },
      },
    ],
    BillingMode: 'PAY_PER_REQUEST',
  },

  {
    TableName: `${SCHEMA}-core-spaces-sprint`,
    KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
    AttributeDefinitions: [
      { AttributeName: 'id', AttributeType: 'S' },
      { AttributeName: 'workstreamId', AttributeType: 'S' },
      { AttributeName: 'startDate', AttributeType: 'S' },
      { AttributeName: 'status', AttributeType: 'S' },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'workstreamId-startDate-index',
        KeySchema: [
          { AttributeName: 'workstreamId', KeyType: 'HASH' },
          { AttributeName: 'startDate', KeyType: 'RANGE' },
        ],
        Projection: { ProjectionType: 'ALL' },
      },
      {
        IndexName: 'status-index',
        KeySchema: [{ AttributeName: 'status', KeyType: 'HASH' }],
        Projection: { ProjectionType: 'ALL' },
      },
    ],
    BillingMode: 'PAY_PER_REQUEST',
  },

  {
    TableName: `${SCHEMA}-core-spaces-objective`,
    KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
    AttributeDefinitions: [
      { AttributeName: 'id', AttributeType: 'S' },
      { AttributeName: 'workstreamId', AttributeType: 'S' },
      { AttributeName: 'ownerId', AttributeType: 'S' },
      { AttributeName: 'status', AttributeType: 'S' },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'workstreamId-index',
        KeySchema: [{ AttributeName: 'workstreamId', KeyType: 'HASH' }],
        Projection: { ProjectionType: 'ALL' },
      },
      {
        IndexName: 'ownerId-index',
        KeySchema: [{ AttributeName: 'ownerId', KeyType: 'HASH' }],
        Projection: { ProjectionType: 'ALL' },
      },
      {
        IndexName: 'status-index',
        KeySchema: [{ AttributeName: 'status', KeyType: 'HASH' }],
        Projection: { ProjectionType: 'ALL' },
      },
    ],
    BillingMode: 'PAY_PER_REQUEST',
  },

  {
    TableName: `${SCHEMA}-core-spaces-request`,
    KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
    AttributeDefinitions: [
      { AttributeName: 'id', AttributeType: 'S' },
      { AttributeName: 'workstreamId', AttributeType: 'S' },
      { AttributeName: 'status', AttributeType: 'S' },
      { AttributeName: 'requesterId', AttributeType: 'S' },
      { AttributeName: 'createdAt', AttributeType: 'S' },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'workstreamId-status-index',
        KeySchema: [
          { AttributeName: 'workstreamId', KeyType: 'HASH' },
          { AttributeName: 'status', KeyType: 'RANGE' },
        ],
        Projection: { ProjectionType: 'ALL' },
      },
      {
        IndexName: 'requesterId-index',
        KeySchema: [{ AttributeName: 'requesterId', KeyType: 'HASH' }],
        Projection: { ProjectionType: 'ALL' },
      },
      {
        IndexName: 'createdAt-index',
        KeySchema: [{ AttributeName: 'createdAt', KeyType: 'HASH' }],
        Projection: { ProjectionType: 'ALL' },
      },
    ],
    BillingMode: 'PAY_PER_REQUEST',
  },

  // ===== JOIN TABLES =====

  {
    TableName: `${SCHEMA}-core-spaces-feature-capability`,
    KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
    AttributeDefinitions: [
      { AttributeName: 'id', AttributeType: 'S' },
      { AttributeName: 'featureId', AttributeType: 'S' },
      { AttributeName: 'capabilityId', AttributeType: 'S' },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'featureId-index',
        KeySchema: [{ AttributeName: 'featureId', KeyType: 'HASH' }],
        Projection: { ProjectionType: 'ALL' },
      },
      {
        IndexName: 'capabilityId-index',
        KeySchema: [{ AttributeName: 'capabilityId', KeyType: 'HASH' }],
        Projection: { ProjectionType: 'ALL' },
      },
    ],
    BillingMode: 'PAY_PER_REQUEST',
  },

  {
    TableName: `${SCHEMA}-core-spaces-space-member`,
    KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
    AttributeDefinitions: [
      { AttributeName: 'id', AttributeType: 'S' },
      { AttributeName: 'spaceId', AttributeType: 'S' },
      { AttributeName: 'userId', AttributeType: 'S' },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'spaceId-index',
        KeySchema: [{ AttributeName: 'spaceId', KeyType: 'HASH' }],
        Projection: { ProjectionType: 'ALL' },
      },
      {
        IndexName: 'userId-index',
        KeySchema: [{ AttributeName: 'userId', KeyType: 'HASH' }],
        Projection: { ProjectionType: 'ALL' },
      },
    ],
    BillingMode: 'PAY_PER_REQUEST',
  },
];

/**
 * Check if a table already exists
 */
async function tableExists(tableName: string): Promise<boolean> {
  try {
    await client.send(new DescribeTableCommand({ TableName: tableName }));
    return true;
  } catch (error: any) {
    if (error.name === 'ResourceNotFoundException') {
      return false;
    }
    throw error;
  }
}

/**
 * Create a single table
 */
async function createTable(tableConfig: CreateTableCommandInput): Promise<void> {
  const tableName = tableConfig.TableName!;

  console.log(`\n📋 Creating table: ${tableName}`);

  // Check if table already exists
  if (await tableExists(tableName)) {
    console.log(`   ✅ Table already exists: ${tableName}`);
    return;
  }

  try {
    // Create the table
    await client.send(new CreateTableCommand(tableConfig));
    console.log(`   ⏳ Table creation initiated: ${tableName}`);

    // Wait for table to become active
    console.log(`   ⏳ Waiting for table to become active...`);
    await waitUntilTableExists(
      { client, maxWaitTime: 300, minDelay: 2, maxDelay: 10 },
      { TableName: tableName }
    );

    console.log(`   ✅ Table created successfully: ${tableName}`);

    // Show GSI info
    const gsiCount = tableConfig.GlobalSecondaryIndexes?.length || 0;
    if (gsiCount > 0) {
      console.log(`   📊 Created ${gsiCount} Global Secondary Indexes`);
      tableConfig.GlobalSecondaryIndexes!.forEach((gsi) => {
        console.log(`      - ${gsi.IndexName}`);
      });
    }
  } catch (error: any) {
    console.error(`   ❌ Error creating table ${tableName}:`, error.message);
    throw error;
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Starting DynamoDB table creation for Spaces feature');
  console.log(`📍 Region: ${AWS_REGION}`);
  console.log(`🏷️  Schema: ${SCHEMA}`);
  console.log(`📦 Tables to create: ${tables.length}`);

  const gsiCount = tables.reduce(
    (sum, t) => sum + (t.GlobalSecondaryIndexes?.length || 0),
    0
  );
  console.log(`📊 Total GSIs: ${gsiCount}`);

  console.log('\n' + '='.repeat(60));

  let created = 0;
  let skipped = 0;
  let failed = 0;

  for (const tableConfig of tables) {
    try {
      const existed = await tableExists(tableConfig.TableName!);
      await createTable(tableConfig);

      if (existed) {
        skipped++;
      } else {
        created++;
      }
    } catch (error) {
      failed++;
      console.error(`Failed to create table ${tableConfig.TableName}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Summary:');
  console.log(`   ✅ Created: ${created}`);
  console.log(`   ⏭️  Skipped (already exists): ${skipped}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📦 Total: ${tables.length}`);

  if (failed > 0) {
    console.log('\n⚠️  Some tables failed to create. Check errors above.');
    process.exit(1);
  }

  console.log('\n✨ All tables created successfully!');
  console.log('\n📝 Next steps:');
  console.log('   1. Verify tables in AWS Console');
  console.log('   2. Test CRUD operations');
  console.log('   3. Continue with useRolePermissions hook implementation');
}

// Run the script
main().catch((error) => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
