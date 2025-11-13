#!/usr/bin/env tsx
/**
 * Create App Member Table
 *
 * Creates the core-app-member table for centralized app access management.
 * This table controls which users have access to which apps and their roles.
 */

import {
  DynamoDBClient,
  CreateTableCommand,
  DescribeTableCommand,
  waitUntilTableExists,
  type CreateTableCommandInput,
} from '@aws-sdk/client-dynamodb';

const SCHEMA = process.env.SCHEMA || 'captify';
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';

const client = new DynamoDBClient({ region: AWS_REGION });

const tableDefinition: CreateTableCommandInput = {
  TableName: `${SCHEMA}-core-app-member`,
  KeySchema: [
    { AttributeName: 'id', KeyType: 'HASH' }, // Primary key: unique membership ID
  ],
  AttributeDefinitions: [
    { AttributeName: 'id', AttributeType: 'S' },
    { AttributeName: 'userId', AttributeType: 'S' },
    { AttributeName: 'appId', AttributeType: 'S' },
    { AttributeName: 'status', AttributeType: 'S' },
    { AttributeName: 'role', AttributeType: 'S' },
  ],
  GlobalSecondaryIndexes: [
    {
      IndexName: 'userId-appId-index',
      KeySchema: [
        { AttributeName: 'userId', KeyType: 'HASH' },
        { AttributeName: 'appId', KeyType: 'RANGE' },
      ],
      Projection: { ProjectionType: 'ALL' },
    },
    {
      IndexName: 'appId-status-index',
      KeySchema: [
        { AttributeName: 'appId', KeyType: 'HASH' },
        { AttributeName: 'status', KeyType: 'RANGE' },
      ],
      Projection: { ProjectionType: 'ALL' },
    },
    {
      IndexName: 'appId-role-index',
      KeySchema: [
        { AttributeName: 'appId', KeyType: 'HASH' },
        { AttributeName: 'role', KeyType: 'RANGE' },
      ],
      Projection: { ProjectionType: 'ALL' },
    },
  ],
  BillingMode: 'PAY_PER_REQUEST',
};

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

async function main() {
  console.log('🚀 Creating App Member Table');
  console.log(`📍 Region: ${AWS_REGION}`);
  console.log(`🏷️  Schema: ${SCHEMA}`);
  console.log(`📊 Table: ${SCHEMA}-core-app-member`);
  console.log('');

  // Check if table already exists
  if (await tableExists(`${SCHEMA}-core-app-member`)) {
    console.log('⏭️  Table already exists, skipping creation');
    process.exit(0);
  }

  console.log('📝 Creating table with schema:');
  console.log('   Primary Key: id (HASH)');
  console.log('   GSI 1: userId-appId-index (for lookups)');
  console.log('   GSI 2: appId-status-index (for listing active members)');
  console.log('   GSI 3: appId-role-index (for role-based queries)');
  console.log('');

  // Create table
  console.log('⏳ Creating table...');
  await client.send(new CreateTableCommand(tableDefinition));

  // Wait for table to be active
  console.log('⏳ Waiting for table to become active...');
  await waitUntilTableExists(
    { client, maxWaitTime: 300, minDelay: 2, maxDelay: 10 },
    { TableName: `${SCHEMA}-core-app-member` }
  );

  console.log('✅ Table created successfully!');
  console.log('');
  console.log('📋 Table Details:');
  console.log(`   Name: ${SCHEMA}-core-app-member`);
  console.log('   Billing: PAY_PER_REQUEST');
  console.log('   GSIs: 3 (all ACTIVE)');
  console.log('');
  console.log('📝 Next Steps:');
  console.log('   1. Run: tsx platform/scripts/grant-admin-access.ts');
  console.log('   2. Rebuild platform: npm run build');
  console.log('   3. Restart platform: pm2 restart platform');
}

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
