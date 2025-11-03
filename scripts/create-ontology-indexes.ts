import { DynamoDBClient, UpdateTableCommand, DescribeTableCommand, waitUntilTableExists } from '@aws-sdk/client-dynamodb';

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });

interface IndexConfig {
  tableName: string;
  indexName: string;
  attributes: Array<{ name: string; type: 'S' | 'N' | 'B' }>;
  keySchema: Array<{ attributeName: string; keyType: 'HASH' | 'RANGE' }>;
}

const INDEXES: IndexConfig[] = [
  // Node table indexes
  {
    tableName: 'captify-core-ontology-node',
    indexName: 'name-index',
    attributes: [{ name: 'name', type: 'S' }],
    keySchema: [{ attributeName: 'name', keyType: 'HASH' }]
  },
  {
    tableName: 'captify-core-ontology-node',
    indexName: 'app-type-index',
    attributes: [
      { name: 'app', type: 'S' },
      { name: 'type', type: 'S' }
    ],
    keySchema: [
      { attributeName: 'app', keyType: 'HASH' },
      { attributeName: 'type', keyType: 'RANGE' }
    ]
  },
  {
    tableName: 'captify-core-ontology-node',
    indexName: 'domain-category-index',
    attributes: [
      { name: 'domain', type: 'S' },
      { name: 'category', type: 'S' }
    ],
    keySchema: [
      { attributeName: 'domain', keyType: 'HASH' },
      { attributeName: 'category', keyType: 'RANGE' }
    ]
  },
  {
    tableName: 'captify-core-ontology-node',
    indexName: 'tenantId-createdAt-index',
    attributes: [
      { name: 'tenantId', type: 'S' },
      { name: 'createdAt', type: 'S' }
    ],
    keySchema: [
      { attributeName: 'tenantId', keyType: 'HASH' },
      { attributeName: 'createdAt', keyType: 'RANGE' }
    ]
  },
  // Edge table indexes
  {
    tableName: 'captify-core-ontology-edge',
    indexName: 'source-target-index',
    attributes: [
      { name: 'source', type: 'S' },
      { name: 'target', type: 'S' }
    ],
    keySchema: [
      { attributeName: 'source', keyType: 'HASH' },
      { attributeName: 'target', keyType: 'RANGE' }
    ]
  }
];

async function indexExists(tableName: string, indexName: string): Promise<boolean> {
  try {
    const command = new DescribeTableCommand({ TableName: tableName });
    const response = await client.send(command);
    const indexes = response.Table?.GlobalSecondaryIndexes || [];
    return indexes.some(idx => idx.IndexName === indexName);
  } catch (error) {
    console.error(`Error checking if index exists:`, error);
    return false;
  }
}

async function waitForIndexActive(tableName: string, indexName: string, maxAttempts = 60): Promise<void> {
  console.log(`⏳ Waiting for ${indexName} to become ACTIVE (max ${maxAttempts * 10}s)...`);

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const command = new DescribeTableCommand({ TableName: tableName });
      const response = await client.send(command);
      const index = response.Table?.GlobalSecondaryIndexes?.find(idx => idx.IndexName === indexName);

      if (index?.IndexStatus === 'ACTIVE') {
        console.log(`✅ ${indexName} is now ACTIVE`);
        return;
      }

      if (index?.IndexStatus === 'CREATING') {
        process.stdout.write(`\r   Attempt ${attempt}/${maxAttempts}: ${index.IndexStatus}...`);
      } else if (index) {
        console.log(`\n   Status: ${index.IndexStatus}`);
      }

      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
    } catch (error) {
      console.error(`\n❌ Error checking index status:`, error);
      throw error;
    }
  }

  throw new Error(`Timeout waiting for ${indexName} to become ACTIVE`);
}

async function createIndex(config: IndexConfig): Promise<void> {
  const { tableName, indexName, attributes, keySchema } = config;

  console.log(`\n📊 Creating ${indexName} on ${tableName}...`);

  // Check if index already exists
  if (await indexExists(tableName, indexName)) {
    console.log(`⏭️  ${indexName} already exists, skipping...`);
    return;
  }

  try {
    const command = new UpdateTableCommand({
      TableName: tableName,
      AttributeDefinitions: attributes.map(attr => ({
        AttributeName: attr.name,
        AttributeType: attr.type
      })),
      GlobalSecondaryIndexUpdates: [
        {
          Create: {
            IndexName: indexName,
            KeySchema: keySchema.map(key => ({
              AttributeName: key.attributeName,
              KeyType: key.keyType
            })),
            Projection: {
              ProjectionType: 'ALL'
            }
          }
        }
      ]
    });

    await client.send(command);
    console.log(`✅ ${indexName} creation initiated`);

    // Wait for index to become active
    await waitForIndexActive(tableName, indexName);

  } catch (error: any) {
    if (error.name === 'ResourceInUseException') {
      console.log(`⚠️  Table is being updated, waiting...`);
      await new Promise(resolve => setTimeout(resolve, 30000));
      // Retry
      return createIndex(config);
    }
    console.error(`❌ Failed to create ${indexName}:`, error.message);
    throw error;
  }
}

async function main() {
  console.log('🚀 Starting Ontology Index Creation\n');
  console.log('═'.repeat(60));

  let created = 0;
  let skipped = 0;
  let failed = 0;

  for (const indexConfig of INDEXES) {
    try {
      await createIndex(indexConfig);
      if (await indexExists(indexConfig.tableName, indexConfig.indexName)) {
        created++;
      } else {
        skipped++;
      }
    } catch (error) {
      console.error(`\n❌ Failed to create ${indexConfig.indexName}`);
      failed++;
      // Continue with next index
    }
  }

  console.log('\n' + '═'.repeat(60));
  console.log('📊 Index Creation Summary:');
  console.log(`   Created: ${created}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Failed: ${failed}`);
  console.log('═'.repeat(60));

  // Verify all indexes
  console.log('\n📋 Verifying final state...\n');

  const nodeCommand = new DescribeTableCommand({ TableName: 'captify-core-ontology-node' });
  const nodeResponse = await client.send(nodeCommand);
  console.log('ontology-node indexes:');
  nodeResponse.Table?.GlobalSecondaryIndexes?.forEach(idx => {
    console.log(`  ✅ ${idx.IndexName} (${idx.IndexStatus})`);
  });

  const edgeCommand = new DescribeTableCommand({ TableName: 'captify-core-ontology-edge' });
  const edgeResponse = await client.send(edgeCommand);
  console.log('\nontology-edge indexes:');
  edgeResponse.Table?.GlobalSecondaryIndexes?.forEach(idx => {
    console.log(`  ✅ ${idx.IndexName} (${idx.IndexStatus})`);
  });

  if (failed > 0) {
    console.log('\n⚠️  Some indexes failed to create. Please review errors above.');
    process.exit(1);
  } else {
    console.log('\n✅ All indexes created successfully!');
  }
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
