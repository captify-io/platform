#!/usr/bin/env tsx
/**
 * Create Fabric DynamoDB Tables
 *
 * Creates DynamoDB tables for Fabric entities based on ontology schemas.
 *
 * Usage:
 *   npx tsx scripts/create-fabric-tables.ts
 *   AWS_REGION="us-east-1" AWS_ACCESS_KEY_ID="..." npx tsx scripts/create-fabric-tables.ts
 */

import { DynamoDBClient, CreateTableCommand, DescribeTableCommand } from '@aws-sdk/client-dynamodb';

const REGION = process.env.AWS_REGION || 'us-east-1';
const SCHEMA = process.env.SCHEMA || 'captify';

const credentials = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
};

const client = new DynamoDBClient({ region: REGION, credentials });

/**
 * Fabric Table Definitions
 */
const fabricTables = [
  {
    TableName: `${SCHEMA}-fabric-node`,
    KeySchema: [
      { AttributeName: 'id', KeyType: 'HASH' },
    ],
    AttributeDefinitions: [
      { AttributeName: 'id', AttributeType: 'S' },
      { AttributeName: 'documentId', AttributeType: 'S' },
      { AttributeName: 'position', AttributeType: 'N' },
      { AttributeName: 'spaceId', AttributeType: 'S' },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'documentId-position-index',
        KeySchema: [
          { AttributeName: 'documentId', KeyType: 'HASH' },
          { AttributeName: 'position', KeyType: 'RANGE' },
        ],
        Projection: { ProjectionType: 'ALL' },
        ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
      },
      {
        IndexName: 'spaceId-index',
        KeySchema: [
          { AttributeName: 'spaceId', KeyType: 'HASH' },
        ],
        Projection: { ProjectionType: 'ALL' },
        ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
      },
    ],
    ProvisionedThroughput: { ReadCapacityUnits: 10, WriteCapacityUnits: 10 },
  },
  {
    TableName: `${SCHEMA}-fabric-note`,
    KeySchema: [
      { AttributeName: 'id', KeyType: 'HASH' },
    ],
    AttributeDefinitions: [
      { AttributeName: 'id', AttributeType: 'S' },
      { AttributeName: 'spaceId', AttributeType: 'S' },
      { AttributeName: 'updatedAt', AttributeType: 'S' },
      { AttributeName: 'folder', AttributeType: 'S' },
      { AttributeName: 'title', AttributeType: 'S' },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'spaceId-updatedAt-index',
        KeySchema: [
          { AttributeName: 'spaceId', KeyType: 'HASH' },
          { AttributeName: 'updatedAt', KeyType: 'RANGE' },
        ],
        Projection: { ProjectionType: 'ALL' },
        ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
      },
      {
        IndexName: 'folder-title-index',
        KeySchema: [
          { AttributeName: 'folder', KeyType: 'HASH' },
          { AttributeName: 'title', KeyType: 'RANGE' },
        ],
        Projection: { ProjectionType: 'ALL' },
        ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
      },
    ],
    ProvisionedThroughput: { ReadCapacityUnits: 10, WriteCapacityUnits: 10 },
  },
  {
    TableName: `${SCHEMA}-fabric-folder`,
    KeySchema: [
      { AttributeName: 'id', KeyType: 'HASH' },
    ],
    AttributeDefinitions: [
      { AttributeName: 'id', AttributeType: 'S' },
      { AttributeName: 'spaceId', AttributeType: 'S' },
      { AttributeName: 'path', AttributeType: 'S' },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'spaceId-path-index',
        KeySchema: [
          { AttributeName: 'spaceId', KeyType: 'HASH' },
          { AttributeName: 'path', KeyType: 'RANGE' },
        ],
        Projection: { ProjectionType: 'ALL' },
        ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
      },
    ],
    ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
  },
  {
    TableName: `${SCHEMA}-fabric-template`,
    KeySchema: [
      { AttributeName: 'id', KeyType: 'HASH' },
    ],
    AttributeDefinitions: [
      { AttributeName: 'id', AttributeType: 'S' },
      { AttributeName: 'spaceId', AttributeType: 'S' },
      { AttributeName: 'name', AttributeType: 'S' },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'spaceId-name-index',
        KeySchema: [
          { AttributeName: 'spaceId', KeyType: 'HASH' },
          { AttributeName: 'name', KeyType: 'RANGE' },
        ],
        Projection: { ProjectionType: 'ALL' },
        ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
      },
    ],
    ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
  },
  {
    TableName: `${SCHEMA}-fabric-canvas`,
    KeySchema: [
      { AttributeName: 'id', KeyType: 'HASH' },
    ],
    AttributeDefinitions: [
      { AttributeName: 'id', AttributeType: 'S' },
      { AttributeName: 'spaceId', AttributeType: 'S' },
      { AttributeName: 'name', AttributeType: 'S' },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'spaceId-name-index',
        KeySchema: [
          { AttributeName: 'spaceId', KeyType: 'HASH' },
          { AttributeName: 'name', KeyType: 'RANGE' },
        ],
        Projection: { ProjectionType: 'ALL' },
        ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
      },
    ],
    ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
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
 * Main execution
 */
async function main() {
  console.log('🗄️  Creating Fabric DynamoDB Tables\n');

  let createdCount = 0;
  let skippedCount = 0;

  for (const tableConfig of fabricTables) {
    const { TableName } = tableConfig;

    console.log(`Checking ${TableName}...`);

    const exists = await tableExists(TableName);

    if (exists) {
      console.log(`⏭️  Skipping ${TableName} (already exists)\n`);
      skippedCount++;
      continue;
    }

    console.log(`✨ Creating ${TableName}...`);

    await client.send(new CreateTableCommand(tableConfig));

    console.log(`✅ Created ${TableName}\n`);
    createdCount++;
  }

  console.log(`✅ Complete!`);
  console.log(`   Created: ${createdCount} tables`);
  console.log(`   Skipped: ${skippedCount} tables (already exist)`);

  console.log(`\n📋 Fabric Tables:`);
  fabricTables.forEach(t => {
    console.log(`   - ${t.TableName}`);
    if (t.GlobalSecondaryIndexes) {
      t.GlobalSecondaryIndexes.forEach(gsi => {
        console.log(`     • GSI: ${gsi.IndexName}`);
      });
    }
  });

  console.log(`\n⏳ Note: Tables may take a few moments to become ACTIVE.`);
  console.log(`   Check status with: aws dynamodb describe-table --table-name ${fabricTables[0].TableName}`);
}

// Run
main().catch(console.error);
