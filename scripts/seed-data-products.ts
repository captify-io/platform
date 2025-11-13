#!/usr/bin/env node

/**
 * Seed Data Products Ontology Node
 * Creates the ontology node and DynamoDB table for data products
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import {
  CreateTableCommand,
  DescribeTableCommand,
  ResourceInUseException,
} from '@aws-sdk/client-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const ONTOLOGY_TABLE = 'captify-core-ontology-node';
const SCHEMA = 'captify';

interface OntologyNode {
  id: string;
  name: string;
  type: string;
  category: string;
  domain: string;
  description?: string;
  icon?: string;
  color?: string;
  active: string;
  properties?: {
    dataSource?: string;
    schema?: any;
  };
  createdAt: string;
  updatedAt: string;
}

async function nodeExists(id: string): Promise<boolean> {
  try {
    const result = await docClient.send(
      new GetCommand({
        TableName: ONTOLOGY_TABLE,
        Key: { id },
      })
    );
    return !!result.Item;
  } catch (error) {
    return false;
  }
}

async function createNode(node: OntologyNode): Promise<void> {
  const exists = await nodeExists(node.id);
  if (exists) {
    console.log(`✓ Node already exists: ${node.id} (${node.name})`);
    return;
  }

  await docClient.send(
    new PutCommand({
      TableName: ONTOLOGY_TABLE,
      Item: node,
    })
  );

  console.log(`✓ Created node: ${node.id} (${node.name})`);
}

async function createDataProductTable(): Promise<void> {
  const tableName = `${SCHEMA}-core-dataops-data-product`;

  try {
    await client.send(new DescribeTableCommand({ TableName: tableName }));
    console.log(`✓ Table already exists: ${tableName}`);
    return;
  } catch (error) {
    // Table doesn't exist, create it
  }

  try {
    await client.send(
      new CreateTableCommand({
        TableName: tableName,
        AttributeDefinitions: [
          { AttributeName: 'id', AttributeType: 'S' },
          { AttributeName: 'domain', AttributeType: 'S' },
          { AttributeName: 'status', AttributeType: 'S' },
          { AttributeName: 'owner', AttributeType: 'S' },
          { AttributeName: 'updatedAt', AttributeType: 'S' },
        ],
        KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
        GlobalSecondaryIndexes: [
          {
            IndexName: 'domain-updatedAt-index',
            KeySchema: [
              { AttributeName: 'domain', KeyType: 'HASH' },
              { AttributeName: 'updatedAt', KeyType: 'RANGE' },
            ],
            Projection: { ProjectionType: 'ALL' },
            ProvisionedThroughput: {
              ReadCapacityUnits: 5,
              WriteCapacityUnits: 5,
            },
          },
          {
            IndexName: 'status-updatedAt-index',
            KeySchema: [
              { AttributeName: 'status', KeyType: 'HASH' },
              { AttributeName: 'updatedAt', KeyType: 'RANGE' },
            ],
            Projection: { ProjectionType: 'ALL' },
            ProvisionedThroughput: {
              ReadCapacityUnits: 5,
              WriteCapacityUnits: 5,
            },
          },
          {
            IndexName: 'owner-updatedAt-index',
            KeySchema: [
              { AttributeName: 'owner', KeyType: 'HASH' },
              { AttributeName: 'updatedAt', KeyType: 'RANGE' },
            ],
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
        Tags: [
          { Key: 'Application', Value: 'DataOps' },
          { Key: 'Environment', Value: 'Production' },
          { Key: 'Compliance', Value: 'IL5-NIST-Rev5' },
        ],
      })
    );
    console.log(`✓ Created table: ${tableName}`);
  } catch (error) {
    if (error instanceof ResourceInUseException) {
      console.log(`✓ Table already exists: ${tableName}`);
    } else {
      throw error;
    }
  }
}

async function main() {
  console.log('🚀 Seeding Data Products Infrastructure...\n');

  // Create ontology node
  const now = new Date().toISOString();
  const dataProductNode: OntologyNode = {
    id: 'dataops-data-product',
    name: 'Data Product',
    type: 'dataProduct',
    category: 'product',
    domain: 'DataOps',
    description:
      'Curated, API-accessible data product with SLOs, versioning, and governance',
    icon: 'Package',
    color: '#10b981',
    active: 'true',
    properties: {
      dataSource: 'dataops-data-product',
      schema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Unique identifier' },
          name: { type: 'string', description: 'Product name', required: true },
          domain: { type: 'string', description: 'Owning domain', required: true },
          version: { type: 'string', description: 'Semantic version', required: true },
          owner: { type: 'string', description: 'Product manager', required: true },
          team: { type: 'string', description: 'Owning team' },
          steward: { type: 'string', description: 'Data steward' },
          description: { type: 'string', description: 'Business purpose', required: true },
          businessUseCase: { type: 'string', description: 'What problem it solves' },
          consumers: { type: 'array', description: 'Consumer teams/apps' },
          classification: {
            type: 'string',
            enum: ['U', 'C', 'S', 'TS'],
            description: 'Data classification (IL5)',
          },
          tags: { type: 'array', description: 'Searchable tags' },
          keywords: { type: 'array', description: 'Discovery keywords' },
          sourceDatasets: { type: 'array', description: 'Source dataset IDs' },
          outputSchema: { type: 'object', description: 'Output schema definition' },
          endpoints: {
            type: 'object',
            description: 'API endpoints',
            properties: {
              rest: { type: 'object', description: 'REST API endpoint' },
              graphql: { type: 'object', description: 'GraphQL endpoint' },
              sql: { type: 'object', description: 'SQL interface' },
              grpc: { type: 'object', description: 'gRPC endpoint' },
            },
          },
          qualityScore: { type: 'number', description: 'Quality score 0-100' },
          qualityDimensions: { type: 'object', description: '6-dimensional quality' },
          slos: {
            type: 'object',
            description: 'Service level objectives',
            properties: {
              availability: { type: 'number', description: 'Target availability %' },
              latencyP95: { type: 'number', description: 'P95 latency ms' },
              freshnessMinutes: { type: 'number', description: 'Data freshness' },
            },
          },
          status: {
            type: 'string',
            enum: ['draft', 'dev', 'staging', 'production', 'deprecated'],
            description: 'Lifecycle status',
          },
          maturity: {
            type: 'string',
            enum: ['experimental', 'beta', 'stable', 'mature'],
            description: 'Product maturity',
          },
          accessCount: { type: 'number', description: 'Total API calls' },
          uniqueConsumers: { type: 'number', description: 'Unique consumer count' },
          rating: { type: 'number', description: 'Rating 0-5' },
          ratingCount: { type: 'number', description: 'Number of ratings' },
          piiFields: { type: 'array', description: 'PII field names' },
          certifications: { type: 'array', description: 'Certifications (IL5, FedRAMP)' },
          documentation: { type: 'string', description: 'Markdown documentation' },
          refreshSchedule: { type: 'string', description: 'Cron schedule' },
          transformationPipelineId: {
            type: 'string',
            description: 'Transformation pipeline ID',
          },
        },
        required: ['name', 'domain', 'version', 'owner', 'description', 'classification'],
      },
    },
    createdAt: now,
    updatedAt: now,
  };

  await createNode(dataProductNode);

  // Create DynamoDB table
  console.log('\nCreating DynamoDB table...');
  await createDataProductTable();

  console.log('\n✅ Data Products infrastructure complete!');
  console.log('   - 1 ontology node created');
  console.log('   - 1 DynamoDB table created with 3 GSIs');
}

main().catch(console.error);
