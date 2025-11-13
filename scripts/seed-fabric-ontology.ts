#!/usr/bin/env tsx
/**
 * Seed Fabric Ontology Types
 *
 * Creates ontology object types and table definitions for Fabric
 * living documentation system.
 *
 * Usage:
 *   npx tsx scripts/seed-fabric-ontology.ts
 *   AWS_REGION="us-east-1" AWS_ACCESS_KEY_ID="..." npx tsx scripts/seed-fabric-ontology.ts
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';

const REGION = process.env.AWS_REGION || 'us-east-1';
const SCHEMA = process.env.SCHEMA || 'captify';

const credentials = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
};

const client = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: REGION, credentials })
);

/**
 * Fabric Ontology Types to Create
 */
const fabricTypes = [
  {
    slug: 'fabric-note',
    name: 'Fabric Note',
    type: 'note',
    category: 'fabric',
    domain: 'Documentation',
    description: 'Living documentation note with Y.js CRDT state',
    icon: 'FileText',
    color: '#10b981',
    status: 'active',
    app: 'fabric',
    properties: {
      dataSource: 'fabric-note',
      schema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Note ID' },
          spaceId: { type: 'string', description: 'Parent space ID' },
          title: { type: 'string', description: 'Note title', required: true },
          yjsState: { type: 'string', description: 'Y.js document state (binary)', format: 'base64' },
          yjsStateVersion: { type: 'number', description: 'State version number' },
          folder: { type: 'string', description: 'Folder path', default: '/' },
          tags: { type: 'array', items: { type: 'string' }, description: 'Note tags' },
          wikilinks: { type: 'array', items: { type: 'string' }, description: 'Extracted wikilinks' },
          frontmatter: { type: 'object', description: 'YAML frontmatter' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
          lastEditedBy: { type: 'string', description: 'User ID' },
          organizationId: { type: 'string', description: 'Organization ID' },
          clearanceLevel: {
            type: 'string',
            enum: ['UNCLASSIFIED', 'CUI', 'SECRET', 'TOP_SECRET'],
            description: 'Required clearance level'
          },
          markings: { type: 'array', items: { type: 'string' }, description: 'Security markings' },
        },
        required: ['id', 'spaceId', 'title', 'yjsState'],
      },
      indexes: {
        'spaceId-updatedAt-index': {
          hashKey: 'spaceId',
          rangeKey: 'updatedAt',
          type: 'GSI',
        },
        'folder-title-index': {
          hashKey: 'folder',
          rangeKey: 'title',
          type: 'GSI',
        },
      },
    },
  },
  {
    slug: 'fabric-folder',
    name: 'Fabric Folder',
    type: 'folder',
    category: 'fabric',
    domain: 'Documentation',
    description: 'Folder for organizing notes',
    icon: 'Folder',
    color: '#6366f1',
    status: 'active',
    app: 'fabric',
    properties: {
      dataSource: 'fabric-folder',
      schema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Folder ID (hash of path)' },
          spaceId: { type: 'string', description: 'Parent space ID' },
          path: { type: 'string', description: 'Full folder path' },
          name: { type: 'string', description: 'Display name' },
          icon: { type: 'string', description: 'Custom icon' },
          color: { type: 'string', description: 'Custom color (hex)' },
          noteCount: { type: 'number', description: 'Number of notes', default: 0 },
          parentPath: { type: 'string', description: 'Parent folder path' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
        required: ['id', 'spaceId', 'path', 'name'],
      },
      indexes: {
        'spaceId-path-index': {
          hashKey: 'spaceId',
          rangeKey: 'path',
          type: 'GSI',
        },
      },
    },
  },
  {
    slug: 'fabric-template',
    name: 'Fabric Template',
    type: 'template',
    category: 'fabric',
    domain: 'Documentation',
    description: 'Note template with variable substitution',
    icon: 'LayoutTemplate',
    color: '#f59e0b',
    status: 'active',
    app: 'fabric',
    properties: {
      dataSource: 'fabric-template',
      schema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Template ID' },
          spaceId: { type: 'string', description: 'Parent space ID' },
          name: { type: 'string', description: 'Template name' },
          description: { type: 'string', description: 'Template description' },
          icon: { type: 'string', description: 'Icon for template picker' },
          content: { type: 'string', description: 'Template content with {{variables}}' },
          variables: { type: 'array', description: 'Variable definitions' },
          frontmatter: { type: 'object', description: 'Default frontmatter' },
          lockedProperties: { type: 'array', items: { type: 'string' }, description: 'Properties users cannot change' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
        required: ['id', 'spaceId', 'name', 'content'],
      },
      indexes: {
        'spaceId-name-index': {
          hashKey: 'spaceId',
          rangeKey: 'name',
          type: 'GSI',
        },
      },
    },
  },
  {
    slug: 'fabric-canvas',
    name: 'Fabric Canvas',
    type: 'canvas',
    category: 'fabric',
    domain: 'Documentation',
    description: 'Visual canvas for organizing notes and entities',
    icon: 'Layout',
    color: '#8b5cf6',
    status: 'active',
    app: 'fabric',
    properties: {
      dataSource: 'fabric-canvas',
      schema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Canvas ID' },
          spaceId: { type: 'string', description: 'Parent space ID' },
          name: { type: 'string', description: 'Canvas name' },
          description: { type: 'string', description: 'Canvas description' },
          nodes: { type: 'array', description: 'Visual nodes (notes, entities, groups)' },
          edges: { type: 'array', description: 'Connections between nodes' },
          viewport: { type: 'object', description: 'Camera position/zoom' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
        required: ['id', 'spaceId', 'name'],
      },
      indexes: {
        'spaceId-name-index': {
          hashKey: 'spaceId',
          rangeKey: 'name',
          type: 'GSI',
        },
      },
    },
  },
];

/**
 * Main execution
 */
async function main() {
  console.log('🌱 Seeding Fabric Ontology Types\n');

  // Check if types already exist
  const tableName = `${SCHEMA}-ontology-object-type`;

  console.log(`Checking existing types in ${tableName}...`);

  const scanResult = await client.send(
    new ScanCommand({
      TableName: tableName,
      FilterExpression: 'app = :app',
      ExpressionAttributeValues: {
        ':app': 'fabric',
      },
    })
  );

  const existingTypes = new Set((scanResult.Items || []).map((item: any) => item.slug));

  console.log(`Found ${existingTypes.size} existing Fabric types\n`);

  // Create types
  let createdCount = 0;
  let skippedCount = 0;

  for (const fabricType of fabricTypes) {
    if (existingTypes.has(fabricType.slug)) {
      console.log(`⏭️  Skipping ${fabricType.slug} (already exists)`);
      skippedCount++;
      continue;
    }

    console.log(`✨ Creating ${fabricType.slug}...`);

    await client.send(
      new PutCommand({
        TableName: tableName,
        Item: {
          ...fabricType,
          id: fabricType.slug,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      })
    );

    createdCount++;
  }

  console.log(`\n✅ Complete!`);
  console.log(`   Created: ${createdCount} types`);
  console.log(`   Skipped: ${skippedCount} types (already exist)`);

  console.log(`\n📋 Fabric Types:`);
  fabricTypes.forEach(t => {
    console.log(`   - ${t.slug}: ${SCHEMA}-${t.properties.dataSource}`);
  });

  console.log(`\n⚠️  Note: DynamoDB tables need to be created separately.`);
  console.log(`   The ontology types define the schema, but tables must be created with:`);
  console.log(`   - AWS Console`);
  console.log(`   - CloudFormation/Terraform`);
  console.log(`   - AWS CLI`);
}

// Run
main().catch(console.error);
