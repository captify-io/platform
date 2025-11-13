/**
 * Create Fabric Template Table Script
 *
 * Creates the captify-fabric-template DynamoDB table with appropriate indexes
 *
 * Usage: npx tsx scripts/create-fabric-template-table.ts
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { CreateTableCommand, DescribeTableCommand } from '@aws-sdk/client-dynamodb';

// Configuration
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const SCHEMA = process.env.SCHEMA || 'captify';
const TABLE_NAME = `${SCHEMA}-fabric-template`;

async function createTable() {
  console.log('🏗️  Creating Fabric Template Table...\n');
  console.log(`Region: ${AWS_REGION}`);
  console.log(`Schema: ${SCHEMA}`);
  console.log(`Table Name: ${TABLE_NAME}\n`);

  const client = new DynamoDBClient({
    region: AWS_REGION,
  });

  // Check if table already exists
  try {
    await client.send(
      new DescribeTableCommand({
        TableName: TABLE_NAME,
      })
    );
    console.log(`✅ Table ${TABLE_NAME} already exists!`);
    console.log('   Skipping creation.\n');
    return;
  } catch (error: any) {
    if (error.name !== 'ResourceNotFoundException') {
      throw error;
    }
    // Table doesn't exist, proceed with creation
  }

  try {
    const command = new CreateTableCommand({
      TableName: TABLE_NAME,
      AttributeDefinitions: [
        {
          AttributeName: 'id',
          AttributeType: 'S',
        },
        {
          AttributeName: 'organizationId',
          AttributeType: 'S',
        },
        {
          AttributeName: 'category',
          AttributeType: 'S',
        },
        {
          AttributeName: 'updatedAt',
          AttributeType: 'S',
        },
      ],
      KeySchema: [
        {
          AttributeName: 'id',
          KeyType: 'HASH',
        },
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: 'organizationId-category-index',
          KeySchema: [
            {
              AttributeName: 'organizationId',
              KeyType: 'HASH',
            },
            {
              AttributeName: 'category',
              KeyType: 'RANGE',
            },
          ],
          Projection: {
            ProjectionType: 'ALL',
          },
          ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5,
          },
        },
        {
          IndexName: 'organizationId-updatedAt-index',
          KeySchema: [
            {
              AttributeName: 'organizationId',
              KeyType: 'HASH',
            },
            {
              AttributeName: 'updatedAt',
              KeyType: 'RANGE',
            },
          ],
          Projection: {
            ProjectionType: 'ALL',
          },
          ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5,
          },
        },
      ],
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5,
      },
    });

    const response = await client.send(command);

    console.log('✅ Table created successfully!');
    console.log('\n📊 Table Details:');
    console.log(`   Name: ${TABLE_NAME}`);
    console.log(`   Status: ${response.TableDescription?.TableStatus}`);
    console.log('\n📑 Indexes:');
    console.log('   1. organizationId-category-index (for filtering by org and category)');
    console.log('   2. organizationId-updatedAt-index (for sorting by last updated)');
    console.log('\n⏳ Table is being created... This may take a few moments.');
    console.log('   Run the describe command to check status:');
    console.log(`   aws dynamodb describe-table --table-name ${TABLE_NAME}\n`);
  } catch (error: any) {
    console.error('❌ Error creating table:', error.message);
    throw error;
  }
}

// Run the script
createTable()
  .then(() => {
    console.log('\n✨ Table creation script completed!');
    console.log('\nNext steps:');
    console.log('1. Wait for table to become ACTIVE (usually 30-60 seconds)');
    console.log('2. Add fabric-template to ontology: npx tsx scripts/add-template-to-ontology.ts');
    console.log('3. Seed templates: npx tsx scripts/seed-fabric-templates.ts');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
