#!/usr/bin/env node

/**
 * Create DynamoDB tables for DataOps entities
 *
 * Tables:
 * - captify-core-dataops-data-source
 * - captify-core-dataops-quality-rule
 * - captify-core-dataops-quality-check
 * - captify-core-dataops-lineage
 * - captify-core-dataops-policy
 * - captify-core-dataops-classification
 * - captify-core-dataops-pii-field
 * - captify-core-dataops-compliance-check
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  CreateTableCommand,
  DescribeTableCommand,
  ResourceInUseException
} from '@aws-sdk/client-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1' });
const SCHEMA = 'captify';

interface TableDefinition {
  name: string;
  description: string;
  attributes: { name: string; type: string }[];
  keySchema: { attributeName: string; keyType: string }[];
  gsis?: {
    indexName: string;
    keySchema: { attributeName: string; keyType: string }[];
    projection: string;
  }[];
}

const tables: TableDefinition[] = [
  {
    name: 'dataops-data-source',
    description: 'External data sources (Databricks, Snowflake, S3, etc.)',
    attributes: [
      { name: 'id', type: 'S' },
      { name: 'type', type: 'S' },
      { name: 'classification', type: 'S' },
      { name: 'qualityScore', type: 'N' },
      { name: 'updatedAt', type: 'S' },
    ],
    keySchema: [
      { attributeName: 'id', keyType: 'HASH' },
    ],
    gsis: [
      {
        indexName: 'type-updatedAt-index',
        keySchema: [
          { attributeName: 'type', keyType: 'HASH' },
          { attributeName: 'updatedAt', keyType: 'RANGE' },
        ],
        projection: 'ALL',
      },
      {
        indexName: 'classification-qualityScore-index',
        keySchema: [
          { attributeName: 'classification', keyType: 'HASH' },
          { attributeName: 'qualityScore', keyType: 'RANGE' },
        ],
        projection: 'ALL',
      },
    ],
  },
  {
    name: 'dataops-quality-rule',
    description: 'Quality validation rules',
    attributes: [
      { name: 'id', type: 'S' },
      { name: 'category', type: 'S' },
      { name: 'active', type: 'S' },
      { name: 'createdAt', type: 'S' },
    ],
    keySchema: [
      { attributeName: 'id', keyType: 'HASH' },
    ],
    gsis: [
      {
        indexName: 'category-createdAt-index',
        keySchema: [
          { attributeName: 'category', keyType: 'HASH' },
          { attributeName: 'createdAt', keyType: 'RANGE' },
        ],
        projection: 'ALL',
      },
      {
        indexName: 'active-category-index',
        keySchema: [
          { attributeName: 'active', keyType: 'HASH' },
          { attributeName: 'category', keyType: 'RANGE' },
        ],
        projection: 'ALL',
      },
    ],
  },
  {
    name: 'dataops-quality-check',
    description: 'Quality check results',
    attributes: [
      { name: 'id', type: 'S' },
      { name: 'datasetId', type: 'S' },
      { name: 'ruleId', type: 'S' },
      { name: 'status', type: 'S' },
      { name: 'executedAt', type: 'S' },
    ],
    keySchema: [
      { attributeName: 'id', keyType: 'HASH' },
    ],
    gsis: [
      {
        indexName: 'datasetId-executedAt-index',
        keySchema: [
          { attributeName: 'datasetId', keyType: 'HASH' },
          { attributeName: 'executedAt', keyType: 'RANGE' },
        ],
        projection: 'ALL',
      },
      {
        indexName: 'ruleId-status-index',
        keySchema: [
          { attributeName: 'ruleId', keyType: 'HASH' },
          { attributeName: 'status', keyType: 'RANGE' },
        ],
        projection: 'ALL',
      },
    ],
  },
  {
    name: 'dataops-lineage',
    description: 'Data lineage relationships',
    attributes: [
      { name: 'id', type: 'S' },
      { name: 'sourceId', type: 'S' },
      { name: 'targetId', type: 'S' },
      { name: 'type', type: 'S' },
      { name: 'createdAt', type: 'S' },
    ],
    keySchema: [
      { attributeName: 'id', keyType: 'HASH' },
    ],
    gsis: [
      {
        indexName: 'sourceId-createdAt-index',
        keySchema: [
          { attributeName: 'sourceId', keyType: 'HASH' },
          { attributeName: 'createdAt', keyType: 'RANGE' },
        ],
        projection: 'ALL',
      },
      {
        indexName: 'targetId-type-index',
        keySchema: [
          { attributeName: 'targetId', keyType: 'HASH' },
          { attributeName: 'type', keyType: 'RANGE' },
        ],
        projection: 'ALL',
      },
    ],
  },
  {
    name: 'dataops-policy',
    description: 'Governance policies with NIST controls',
    attributes: [
      { name: 'id', type: 'S' },
      { name: 'category', type: 'S' },
      { name: 'active', type: 'S' },
      { name: 'classification', type: 'S' },
      { name: 'updatedAt', type: 'S' },
    ],
    keySchema: [
      { attributeName: 'id', keyType: 'HASH' },
    ],
    gsis: [
      {
        indexName: 'category-updatedAt-index',
        keySchema: [
          { attributeName: 'category', keyType: 'HASH' },
          { attributeName: 'updatedAt', keyType: 'RANGE' },
        ],
        projection: 'ALL',
      },
      {
        indexName: 'classification-active-index',
        keySchema: [
          { attributeName: 'classification', keyType: 'HASH' },
          { attributeName: 'active', keyType: 'RANGE' },
        ],
        projection: 'ALL',
      },
    ],
  },
  {
    name: 'dataops-classification',
    description: 'IL5 classification metadata',
    attributes: [
      { name: 'id', type: 'S' },
      { name: 'entityId', type: 'S' },
      { name: 'level', type: 'S' },
      { name: 'updatedAt', type: 'S' },
    ],
    keySchema: [
      { attributeName: 'id', keyType: 'HASH' },
    ],
    gsis: [
      {
        indexName: 'entityId-updatedAt-index',
        keySchema: [
          { attributeName: 'entityId', keyType: 'HASH' },
          { attributeName: 'updatedAt', keyType: 'RANGE' },
        ],
        projection: 'ALL',
      },
      {
        indexName: 'level-updatedAt-index',
        keySchema: [
          { attributeName: 'level', keyType: 'HASH' },
          { attributeName: 'updatedAt', keyType: 'RANGE' },
        ],
        projection: 'ALL',
      },
    ],
  },
  {
    name: 'dataops-pii-field',
    description: 'PII field metadata',
    attributes: [
      { name: 'id', type: 'S' },
      { name: 'datasetId', type: 'S' },
      { name: 'fieldName', type: 'S' },
      { name: 'piiType', type: 'S' },
      { name: 'detectedAt', type: 'S' },
    ],
    keySchema: [
      { attributeName: 'id', keyType: 'HASH' },
    ],
    gsis: [
      {
        indexName: 'datasetId-detectedAt-index',
        keySchema: [
          { attributeName: 'datasetId', keyType: 'HASH' },
          { attributeName: 'detectedAt', keyType: 'RANGE' },
        ],
        projection: 'ALL',
      },
      {
        indexName: 'piiType-fieldName-index',
        keySchema: [
          { attributeName: 'piiType', keyType: 'HASH' },
          { attributeName: 'fieldName', keyType: 'RANGE' },
        ],
        projection: 'ALL',
      },
    ],
  },
  {
    name: 'dataops-compliance-check',
    description: 'NIST 800-53 Rev 5 compliance checks',
    attributes: [
      { name: 'id', type: 'S' },
      { name: 'controlId', type: 'S' },
      { name: 'entityId', type: 'S' },
      { name: 'status', type: 'S' },
      { name: 'checkedAt', type: 'S' },
    ],
    keySchema: [
      { attributeName: 'id', keyType: 'HASH' },
    ],
    gsis: [
      {
        indexName: 'controlId-checkedAt-index',
        keySchema: [
          { attributeName: 'controlId', keyType: 'HASH' },
          { attributeName: 'checkedAt', keyType: 'RANGE' },
        ],
        projection: 'ALL',
      },
      {
        indexName: 'entityId-status-index',
        keySchema: [
          { attributeName: 'entityId', keyType: 'HASH' },
          { attributeName: 'status', keyType: 'RANGE' },
        ],
        projection: 'ALL',
      },
    ],
  },
];

async function tableExists(tableName: string): Promise<boolean> {
  try {
    await client.send(new DescribeTableCommand({ TableName: tableName }));
    return true;
  } catch (error) {
    return false;
  }
}

async function createTable(definition: TableDefinition): Promise<void> {
  const fullTableName = `${SCHEMA}-core-${definition.name}`;

  const exists = await tableExists(fullTableName);
  if (exists) {
    console.log(`✓ Table already exists: ${fullTableName}`);
    return;
  }

  const attributeDefinitions = definition.attributes.map(attr => ({
    AttributeName: attr.name,
    AttributeType: attr.type,
  }));

  const keySchema = definition.keySchema.map(key => ({
    AttributeName: key.attributeName,
    KeyType: key.keyType,
  }));

  const globalSecondaryIndexes = definition.gsis?.map(gsi => ({
    IndexName: gsi.indexName,
    KeySchema: gsi.keySchema.map(key => ({
      AttributeName: key.attributeName,
      KeyType: key.keyType,
    })),
    Projection: { ProjectionType: gsi.projection },
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5,
    },
  }));

  try {
    await client.send(
      new CreateTableCommand({
        TableName: fullTableName,
        AttributeDefinitions: attributeDefinitions,
        KeySchema: keySchema,
        GlobalSecondaryIndexes: globalSecondaryIndexes,
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
    console.log(`✓ Created table: ${fullTableName} (${definition.description})`);
  } catch (error) {
    if (error instanceof ResourceInUseException) {
      console.log(`✓ Table already exists: ${fullTableName}`);
    } else {
      throw error;
    }
  }
}

async function main() {
  console.log('🚀 Creating DataOps DynamoDB tables...\n');

  for (const table of tables) {
    await createTable(table);
  }

  console.log('\n✅ DataOps table creation complete!');
  console.log(`   Total tables: ${tables.length}`);
}

main().catch(console.error);
