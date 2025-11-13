/**
 * Create New Ontology DynamoDB Tables
 *
 * This script creates the DynamoDB tables for the new simplified ontology system:
 * 1. {schema}-ontology-object-type - Object type definitions (schemas)
 * 2. {schema}-ontology-link-type - Link type definitions (relationships)
 * 3. {schema}-ontology-action-type - Action type definitions (operations)
 *
 * Key Design Decisions:
 * - Primary key: slug (kebab-case: "contract", "company-employs-employee", "approve-contract")
 * - GSIs for efficient queries (app-index, status-index, objectType-index, etc.)
 * - Version tracking on all records
 * - Bidirectional link support with inverseName
 *
 * Usage:
 * AWS_REGION="us-east-1" \
 * AWS_ACCESS_KEY_ID="..." \
 * AWS_SECRET_ACCESS_KEY="..." \
 * SCHEMA="captify" \
 * npx tsx scripts/create-new-ontology-tables.ts
 */

import { DynamoDBClient, CreateTableCommand, DescribeTableCommand } from '@aws-sdk/client-dynamodb';

const REGION = process.env.AWS_REGION || 'us-east-1';
const SCHEMA = process.env.SCHEMA || 'captify';

const client = new DynamoDBClient({
  region: REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

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

async function createObjectTypeTable() {
  const tableName = `${SCHEMA}-ontology-object-type`;

  if (await tableExists(tableName)) {
    console.log(`ℹ️  Table ${tableName} already exists`);
    return;
  }

  console.log(`Creating table: ${tableName}...`);

  await client.send(
    new CreateTableCommand({
      TableName: tableName,
      KeySchema: [{ AttributeName: 'slug', KeyType: 'HASH' }],
      AttributeDefinitions: [
        { AttributeName: 'slug', AttributeType: 'S' },
        { AttributeName: 'app', AttributeType: 'S' },
        { AttributeName: 'status', AttributeType: 'S' },
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: 'app-index',
          KeySchema: [{ AttributeName: 'app', KeyType: 'HASH' }],
          Projection: { ProjectionType: 'ALL' },
          ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5,
          },
        },
        {
          IndexName: 'status-index',
          KeySchema: [{ AttributeName: 'status', KeyType: 'HASH' }],
          Projection: { ProjectionType: 'ALL' },
          ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5,
          },
        },
      ],
      BillingMode: 'PROVISIONED',
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5,
      },
    })
  );

  console.log(`✅ Created table: ${tableName}`);
}

async function createLinkTypeTable() {
  const tableName = `${SCHEMA}-ontology-link-type`;

  if (await tableExists(tableName)) {
    console.log(`ℹ️  Table ${tableName} already exists`);
    return;
  }

  console.log(`Creating table: ${tableName}...`);

  await client.send(
    new CreateTableCommand({
      TableName: tableName,
      KeySchema: [{ AttributeName: 'slug', KeyType: 'HASH' }],
      AttributeDefinitions: [
        { AttributeName: 'slug', AttributeType: 'S' },
        { AttributeName: 'sourceObjectType', AttributeType: 'S' },
        { AttributeName: 'targetObjectType', AttributeType: 'S' },
        { AttributeName: 'status', AttributeType: 'S' },
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: 'sourceObjectType-index',
          KeySchema: [{ AttributeName: 'sourceObjectType', KeyType: 'HASH' }],
          Projection: { ProjectionType: 'ALL' },
          ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5,
          },
        },
        {
          IndexName: 'targetObjectType-index',
          KeySchema: [{ AttributeName: 'targetObjectType', KeyType: 'HASH' }],
          Projection: { ProjectionType: 'ALL' },
          ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5,
          },
        },
        {
          IndexName: 'status-index',
          KeySchema: [{ AttributeName: 'status', KeyType: 'HASH' }],
          Projection: { ProjectionType: 'ALL' },
          ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5,
          },
        },
      ],
      BillingMode: 'PROVISIONED',
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5,
      },
    })
  );

  console.log(`✅ Created table: ${tableName}`);
}

async function createActionTypeTable() {
  const tableName = `${SCHEMA}-ontology-action-type`;

  if (await tableExists(tableName)) {
    console.log(`ℹ️  Table ${tableName} already exists`);
    return;
  }

  console.log(`Creating table: ${tableName}...`);

  await client.send(
    new CreateTableCommand({
      TableName: tableName,
      KeySchema: [{ AttributeName: 'slug', KeyType: 'HASH' }],
      AttributeDefinitions: [
        { AttributeName: 'slug', AttributeType: 'S' },
        { AttributeName: 'objectType', AttributeType: 'S' },
        { AttributeName: 'status', AttributeType: 'S' },
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: 'objectType-index',
          KeySchema: [{ AttributeName: 'objectType', KeyType: 'HASH' }],
          Projection: { ProjectionType: 'ALL' },
          ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5,
          },
        },
        {
          IndexName: 'status-index',
          KeySchema: [{ AttributeName: 'status', KeyType: 'HASH' }],
          Projection: { ProjectionType: 'ALL' },
          ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5,
          },
        },
      ],
      BillingMode: 'PROVISIONED',
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5,
      },
    })
  );

  console.log(`✅ Created table: ${tableName}`);
}

async function main() {
  console.log('🚀 Creating new ontology tables...');
  console.log(`Region: ${REGION}`);
  console.log(`Schema: ${SCHEMA}`);
  console.log('');

  try {
    await createObjectTypeTable();
    await createLinkTypeTable();
    await createActionTypeTable();

    console.log('');
    console.log('✅ All tables created successfully!');
    console.log('');
    console.log('Tables created:');
    console.log(`  - ${SCHEMA}-ontology-object-type (Primary Key: slug, GSIs: app-index, status-index)`);
    console.log(`  - ${SCHEMA}-ontology-link-type (Primary Key: slug, GSIs: sourceObjectType-index, targetObjectType-index, status-index)`);
    console.log(`  - ${SCHEMA}-ontology-action-type (Primary Key: slug, GSIs: objectType-index, status-index)`);
    console.log('');
    console.log('Next steps:');
    console.log('  1. Create object types using createObjectType()');
    console.log('  2. Create link types using createLinkType()');
    console.log('  3. Create action types using createActionType()');
    console.log('  4. Use operations service for agent queries (describe, listItems, queryByEdge, etc.)');
  } catch (error) {
    console.error('❌ Error creating tables:', error);
    process.exit(1);
  }
}

main();
