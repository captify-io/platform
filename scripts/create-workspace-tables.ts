#!/usr/bin/env tsx
/**
 * Create Workspace DynamoDB Tables
 *
 * Creates all DynamoDB tables for the workspace platform with proper
 * indexes based on the ontology definitions.
 *
 * All tables use captify-core-workspace-* naming convention.
 *
 * Usage:
 *   npx tsx scripts/create-workspace-tables.ts
 *   AWS_REGION="us-east-1" AWS_ACCESS_KEY_ID="..." AWS_SECRET_ACCESS_KEY="..." npx tsx scripts/create-workspace-tables.ts
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  CreateTableCommand,
  DescribeTableCommand,
  ResourceInUseException,
  GlobalSecondaryIndex,
  KeyType,
  ScalarAttributeType,
  ProjectionType,
} from '@aws-sdk/client-dynamodb';

const REGION = process.env.AWS_REGION || 'us-east-1';
const SCHEMA = process.env.SCHEMA || 'captify';

const credentials = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
};

const client = new DynamoDBClient({ region: REGION, credentials });

/**
 * Table definitions with GSIs
 */
const tables = [
  {
    name: `${SCHEMA}-core-workspace`,
    description: 'Workspace entities',
    gsis: [
      { name: 'tenantId-index', hashKey: 'tenantId', type: 'S' },
      { name: 'slug-index', hashKey: 'slug', type: 'S' },
      { name: 'status-index', hashKey: 'status', type: 'S' },
    ],
  },
  {
    name: `${SCHEMA}-core-workspace-member`,
    description: 'Workspace member relationships',
    gsis: [
      { name: 'workspaceId-index', hashKey: 'workspaceId', type: 'S' },
      { name: 'userId-index', hashKey: 'userId', type: 'S' },
      { name: 'workspaceId-userId-index', hashKey: 'workspaceId', rangeKey: 'userId', type: 'S' },
    ],
  },
  {
    name: `${SCHEMA}-core-workspace-team`,
    description: 'Teams within workspaces',
    gsis: [
      { name: 'workspaceId-index', hashKey: 'workspaceId', type: 'S' },
      { name: 'workspaceId-identifier-index', hashKey: 'workspaceId', rangeKey: 'identifier', type: 'S' },
    ],
  },
  {
    name: `${SCHEMA}-core-workspace-issue`,
    description: 'Work items tracked by teams',
    gsis: [
      { name: 'workspaceId-index', hashKey: 'workspaceId', type: 'S' },
      { name: 'teamId-status-index', hashKey: 'teamId', rangeKey: 'status', type: 'S' },
      { name: 'assigneeId-index', hashKey: 'assigneeId', type: 'S' },
      { name: 'projectId-index', hashKey: 'projectId', type: 'S' },
      { name: 'cycleId-index', hashKey: 'cycleId', type: 'S' },
      { name: 'identifier-index', hashKey: 'identifier', type: 'S' },
    ],
  },
  {
    name: `${SCHEMA}-core-workspace-project`,
    description: 'Projects grouping issues',
    gsis: [
      { name: 'workspaceId-status-index', hashKey: 'workspaceId', rangeKey: 'status', type: 'S' },
      { name: 'initiativeId-index', hashKey: 'initiativeId', type: 'S' },
      { name: 'leadId-index', hashKey: 'leadId', type: 'S' },
    ],
  },
  {
    name: `${SCHEMA}-core-workspace-project-milestone`,
    description: 'Milestones within projects',
    gsis: [
      { name: 'projectId-sortOrder-index', hashKey: 'projectId', rangeKey: 'sortOrder', type: 'N' },
    ],
  },
  {
    name: `${SCHEMA}-core-workspace-cycle`,
    description: 'Team cycles/sprints',
    gsis: [
      { name: 'teamId-startDate-index', hashKey: 'teamId', rangeKey: 'startDate', type: 'S' },
      { name: 'workspaceId-index', hashKey: 'workspaceId', type: 'S' },
    ],
  },
  {
    name: `${SCHEMA}-core-workspace-initiative`,
    description: 'High-level initiatives',
    gsis: [
      { name: 'workspaceId-status-index', hashKey: 'workspaceId', rangeKey: 'status', type: 'S' },
    ],
  },
];

/**
 * Check if table exists
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
 * Create a single table with GSIs
 */
async function createTable(tableDef: typeof tables[0]) {
  console.log(`\n📋 Creating table: ${tableDef.name}`);
  console.log(`   Description: ${tableDef.description}`);
  console.log(`   GSIs: ${tableDef.gsis.length}`);

  // Collect all attribute definitions needed for keys
  const attributeDefinitions = [
    { AttributeName: 'id', AttributeType: ScalarAttributeType.S },
  ];

  const seenAttributes = new Set(['id']);

  // Add attributes for GSI keys
  for (const gsi of tableDef.gsis) {
    if (!seenAttributes.has(gsi.hashKey)) {
      attributeDefinitions.push({
        AttributeName: gsi.hashKey,
        AttributeType: gsi.type as ScalarAttributeType,
      });
      seenAttributes.add(gsi.hashKey);
    }

    if (gsi.rangeKey && !seenAttributes.has(gsi.rangeKey)) {
      attributeDefinitions.push({
        AttributeName: gsi.rangeKey,
        AttributeType: gsi.type as ScalarAttributeType,
      });
      seenAttributes.add(gsi.rangeKey);
    }
  }

  // Build GSI definitions
  const globalSecondaryIndexes: GlobalSecondaryIndex[] = tableDef.gsis.map((gsi) => ({
    IndexName: gsi.name,
    KeySchema: [
      { AttributeName: gsi.hashKey, KeyType: KeyType.HASH },
      ...(gsi.rangeKey ? [{ AttributeName: gsi.rangeKey, KeyType: KeyType.RANGE }] : []),
    ],
    Projection: { ProjectionType: ProjectionType.ALL },
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5,
    },
  }));

  try {
    await client.send(
      new CreateTableCommand({
        TableName: tableDef.name,
        KeySchema: [{ AttributeName: 'id', KeyType: KeyType.HASH }],
        AttributeDefinitions: attributeDefinitions,
        GlobalSecondaryIndexes: globalSecondaryIndexes,
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5,
        },
        Tags: [
          { Key: 'Application', Value: 'Captify' },
          { Key: 'Component', Value: 'Workspace' },
          { Key: 'Environment', Value: SCHEMA },
        ],
      })
    );

    console.log(`   ✅ Table created successfully`);

    // Print GSI details
    tableDef.gsis.forEach(gsi => {
      const keys = gsi.rangeKey ? `${gsi.hashKey}, ${gsi.rangeKey}` : gsi.hashKey;
      console.log(`      - ${gsi.name} (${keys})`);
    });

  } catch (error: any) {
    if (error instanceof ResourceInUseException) {
      console.log(`   ⏭️  Table already exists`);
    } else {
      console.error(`   ❌ Error creating table: ${error.message}`);
      throw error;
    }
  }
}

/**
 * Wait for table to be active
 */
async function waitForTable(tableName: string, maxWaitTime = 60000) {
  console.log(`   ⏳ Waiting for ${tableName} to be active...`);

  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitTime) {
    const result = await client.send(
      new DescribeTableCommand({ TableName: tableName })
    );

    const status = result.Table?.TableStatus;

    if (status === 'ACTIVE') {
      console.log(`   ✅ Table is active`);
      return;
    }

    if (status === 'CREATING') {
      await new Promise(resolve => setTimeout(resolve, 2000));
      continue;
    }

    throw new Error(`Unexpected table status: ${status}`);
  }

  throw new Error(`Timeout waiting for table ${tableName} to be active`);
}

/**
 * Main execution
 */
async function main() {
  console.log('🏗️  Creating Workspace DynamoDB Tables\n');
  console.log(`Schema: ${SCHEMA}`);
  console.log(`Region: ${REGION}`);
  console.log(`Tables to create: ${tables.length}\n`);

  let createdCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const tableDef of tables) {
    try {
      const exists = await tableExists(tableDef.name);

      if (exists) {
        console.log(`\n⏭️  Skipping ${tableDef.name} (already exists)`);
        skippedCount++;
        continue;
      }

      await createTable(tableDef);
      await waitForTable(tableDef.name);
      createdCount++;

    } catch (error: any) {
      console.error(`\n❌ Failed to create ${tableDef.name}: ${error.message}`);
      errorCount++;
    }
  }

  // Summary
  console.log(`\n${'='.repeat(60)}`);
  console.log(`✅ Table Creation Complete!\n`);
  console.log(`📊 Summary:`);
  console.log(`   Created: ${createdCount} tables`);
  console.log(`   Skipped: ${skippedCount} tables (already exist)`);
  console.log(`   Errors:  ${errorCount} tables`);

  console.log(`\n📋 All Workspace Tables:`);
  tables.forEach(t => {
    console.log(`   - ${t.name}`);
  });

  console.log(`\n✨ Next steps:`);
  console.log(`   1. Verify tables in AWS Console`);
  console.log(`   2. Test table name resolution with ontology`);
  console.log(`   3. Begin implementing workspace services`);

  if (errorCount > 0) {
    process.exit(1);
  }
}

// Run
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
