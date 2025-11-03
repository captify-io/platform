/**
 * Create Ontology Edges for App Management System
 *
 * This script creates ontology edges for relationships:
 * - User -> AppMember (hasMany)
 * - App -> AppMember (hasMany)
 * - App -> AppRole (hasMany)
 * - AppMember -> App (belongsTo)
 * - AppMember -> User (belongsTo)
 * - AppAccessRequest -> User (belongsTo)
 * - AppAccessRequest -> App (belongsTo)
 *
 * Run with: npx tsx scripts/create-app-ontology-edges.ts
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import type { OntologyEdge } from "@captify-io/core/services/ontology/types";
import { createRequire } from 'module';

// Load shared environment
const require = createRequire(import.meta.url);
const sharedEnv = require('../../shared.env.cjs');

const SCHEMA = sharedEnv.SCHEMA || 'captify';
const AWS_REGION = sharedEnv.AWS_REGION || 'us-east-1';
const AWS_ACCESS_KEY_ID = sharedEnv.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = sharedEnv.AWS_SECRET_ACCESS_KEY;

// Create DynamoDB client with credentials
const client = new DynamoDBClient({
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY
  }
});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = `${SCHEMA}-core-ontology-edge`;

// ===============================================================
// ONTOLOGY EDGE DEFINITIONS
// ===============================================================

const edges: OntologyEdge[] = [
  // User -> AppMember (one-to-many)
  {
    id: 'edge-core-user-hasMany-core-appMember',
    source: 'core-user',
    target: 'core-appMember',
    sourceType: 'user',
    targetType: 'appMember',
    type: 'hasMany',
    label: 'has memberships',
    properties: {
      cardinality: 'one-to-many',
      description: 'User can have many app memberships',
      foreignKey: 'userId',
      inverseRelation: 'belongsTo'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },

  // App -> AppMember (one-to-many)
  {
    id: 'edge-core-app-hasMany-core-appMember',
    source: 'core-app',
    target: 'core-appMember',
    sourceType: 'app',
    targetType: 'appMember',
    type: 'hasMany',
    label: 'has members',
    properties: {
      cardinality: 'one-to-many',
      description: 'App can have many members',
      foreignKey: 'appSlug',
      inverseRelation: 'belongsTo'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },

  // App -> AppRole (one-to-many)
  {
    id: 'edge-core-app-hasMany-core-appRole',
    source: 'core-app',
    target: 'core-appRole',
    sourceType: 'app',
    targetType: 'appRole',
    type: 'hasMany',
    label: 'has roles',
    properties: {
      cardinality: 'one-to-many',
      description: 'App can have many role definitions',
      foreignKey: 'appSlug',
      inverseRelation: 'belongsTo'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },

  // AppMember -> App (many-to-one)
  {
    id: 'edge-core-appMember-belongsTo-core-app',
    source: 'core-appMember',
    target: 'core-app',
    sourceType: 'appMember',
    targetType: 'app',
    type: 'belongsTo',
    label: 'belongs to app',
    properties: {
      cardinality: 'many-to-one',
      description: 'App membership belongs to an app',
      foreignKey: 'appSlug',
      inverseRelation: 'hasMany'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },

  // AppMember -> User (many-to-one)
  {
    id: 'edge-core-appMember-belongsTo-core-user',
    source: 'core-appMember',
    target: 'core-user',
    sourceType: 'appMember',
    targetType: 'user',
    type: 'belongsTo',
    label: 'belongs to user',
    properties: {
      cardinality: 'many-to-one',
      description: 'App membership belongs to a user',
      foreignKey: 'userId',
      inverseRelation: 'hasMany'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },

  // AppAccessRequest -> User (many-to-one)
  {
    id: 'edge-core-appAccessRequest-belongsTo-core-user',
    source: 'core-appAccessRequest',
    target: 'core-user',
    sourceType: 'appAccessRequest',
    targetType: 'user',
    type: 'belongsTo',
    label: 'requested by',
    properties: {
      cardinality: 'many-to-one',
      description: 'Access request belongs to a user',
      foreignKey: 'userId',
      inverseRelation: 'hasMany'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },

  // AppAccessRequest -> App (many-to-one)
  {
    id: 'edge-core-appAccessRequest-belongsTo-core-app',
    source: 'core-appAccessRequest',
    target: 'core-app',
    sourceType: 'appAccessRequest',
    targetType: 'app',
    type: 'belongsTo',
    label: 'requests access to',
    properties: {
      cardinality: 'many-to-one',
      description: 'Access request is for an app',
      foreignKey: 'appSlug',
      inverseRelation: 'hasMany'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },

  // User -> AppAccessRequest (one-to-many)
  {
    id: 'edge-core-user-hasMany-core-appAccessRequest',
    source: 'core-user',
    target: 'core-appAccessRequest',
    sourceType: 'user',
    targetType: 'appAccessRequest',
    type: 'hasMany',
    label: 'has requests',
    properties: {
      cardinality: 'one-to-many',
      description: 'User can have many access requests',
      foreignKey: 'userId',
      inverseRelation: 'belongsTo'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },

  // App -> AppAccessRequest (one-to-many)
  {
    id: 'edge-core-app-hasMany-core-appAccessRequest',
    source: 'core-app',
    target: 'core-appAccessRequest',
    sourceType: 'app',
    targetType: 'appAccessRequest',
    type: 'hasMany',
    label: 'has access requests',
    properties: {
      cardinality: 'one-to-many',
      description: 'App can have many access requests',
      foreignKey: 'appSlug',
      inverseRelation: 'belongsTo'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },

  // AppRole -> App (many-to-one)
  {
    id: 'edge-core-appRole-belongsTo-core-app',
    source: 'core-appRole',
    target: 'core-app',
    sourceType: 'appRole',
    targetType: 'app',
    type: 'belongsTo',
    label: 'belongs to app',
    properties: {
      cardinality: 'many-to-one',
      description: 'Role definition belongs to an app',
      foreignKey: 'appSlug',
      inverseRelation: 'hasMany'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },

  // AppMember -> AppRole (many-to-one) - reference relationship
  {
    id: 'edge-core-appMember-references-core-appRole',
    source: 'core-appMember',
    target: 'core-appRole',
    sourceType: 'appMember',
    targetType: 'appRole',
    type: 'references',
    label: 'has role',
    properties: {
      cardinality: 'many-to-one',
      description: 'App member has a role (via role field)',
      foreignKey: 'role',
      required: true
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// ===============================================================
// INSERT FUNCTIONS
// ===============================================================

async function insertEdge(edge: OntologyEdge): Promise<void> {
  console.log(`\nInserting edge: ${edge.id}`);

  // Check if exists
  const getCommand = new GetCommand({
    TableName: TABLE_NAME,
    Key: { id: edge.id }
  });

  const existing = await docClient.send(getCommand);
  if (existing.Item) {
    console.log(`  ⚠️  Edge ${edge.id} already exists. Updating...`);
  }

  // Insert or update
  const putCommand = new PutCommand({
    TableName: TABLE_NAME,
    Item: edge
  });

  await docClient.send(putCommand);
  console.log(`  ✅ Edge ${edge.id} inserted successfully`);
  console.log(`     ${edge.sourceType} --[${edge.type}]--> ${edge.targetType}`);
  console.log(`     Label: ${edge.label}`);
  console.log(`     Cardinality: ${edge.properties?.cardinality}`);
}

// ===============================================================
// MAIN
// ===============================================================

async function main() {
  console.log('='.repeat(60));
  console.log('Creating App Management Ontology Edges');
  console.log('='.repeat(60));
  console.log(`Schema: ${SCHEMA}`);
  console.log(`Table: ${TABLE_NAME}`);
  console.log(`Region: ${AWS_REGION}`);
  console.log(`Edges to create: ${edges.length}`);

  try {
    // Insert all edges
    for (const edge of edges) {
      await insertEdge(edge);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ All ontology edges created successfully!');
    console.log('='.repeat(60));
    console.log('\nRelationship Graph:');
    console.log('');
    console.log('  User ──┬─ hasMany ──> AppMember ── belongsTo ──> App');
    console.log('         │                 │');
    console.log('         │                 └── references ──> AppRole ── belongsTo ──> App');
    console.log('         │');
    console.log('         └─ hasMany ──> AppAccessRequest ── belongsTo ──> App');
    console.log('');
    console.log('  App ───┬─ hasMany ──> AppMember ── belongsTo ──> User');
    console.log('         │');
    console.log('         ├─ hasMany ──> AppRole');
    console.log('         │');
    console.log('         └─ hasMany ──> AppAccessRequest ── belongsTo ──> User');
    console.log('');

  } catch (error) {
    console.error('\n❌ Error creating ontology edges:', error);
    process.exit(1);
  }
}

main();
