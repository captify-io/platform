/**
 * Script to add universal properties to all ontology nodes
 *
 * Universal properties that should exist on ALL entities:
 * - id, createdAt, updatedAt (already standard)
 * - createdBy, updatedBy (user tracking)
 * - tags (flexible categorization)
 * - description (universal utility)
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const region = process.env.AWS_REGION || 'us-east-1';
const schema = process.env.SCHEMA || 'captify';

const client = new DynamoDBClient({ region });
const docClient = DynamoDBDocumentClient.from(client);

const ONTOLOGY_NODE_TABLE = `${schema}-ontology-object-type`;

// Universal properties that should be on every entity
const UNIVERSAL_PROPERTIES = {
  id: {
    type: 'string',
    description: 'Unique identifier',
    required: true,
  },
  createdAt: {
    type: 'string',
    description: 'Creation timestamp (ISO 8601)',
    required: true,
  },
  updatedAt: {
    type: 'string',
    description: 'Last update timestamp (ISO 8601)',
    required: true,
  },
  createdBy: {
    type: 'string',
    description: 'User ID who created this entity',
    required: true,
  },
  updatedBy: {
    type: 'string',
    description: 'User ID who last updated this entity',
  },
  tags: {
    type: 'array',
    items: { type: 'string' },
    description: 'Flexible tags for categorization',
  },
  description: {
    type: 'string',
    description: 'Description of this entity',
  },
};

async function getAllNodes() {
  console.log(`\nScanning ${ONTOLOGY_NODE_TABLE}...`);

  const command = new ScanCommand({
    TableName: ONTOLOGY_NODE_TABLE,
  });

  const response = await docClient.send(command);
  return response.Items || [];
}

async function updateNodeSchema(node: any) {
  console.log(`\nUpdating node: ${node.slug} (${node.name})`);

  // Get existing properties (flat map structure)
  const existingProperties = node.properties || {};

  // Merge universal properties with existing properties
  // Existing properties take precedence to preserve custom configurations
  const updatedProperties = {
    ...UNIVERSAL_PROPERTIES,
    ...existingProperties,
  };

  // Update the node
  const updateCommand = new UpdateCommand({
    TableName: ONTOLOGY_NODE_TABLE,
    Key: { slug: node.slug },
    UpdateExpression: 'SET properties = :properties, updatedAt = :updatedAt',
    ExpressionAttributeValues: {
      ':properties': updatedProperties,
      ':updatedAt': new Date().toISOString(),
    },
  });

  await docClient.send(updateCommand);
  console.log(`✓ Updated ${node.slug}`);
}

async function main() {
  try {
    console.log('======================================');
    console.log('Adding Universal Properties to Ontology');
    console.log('======================================');

    // Get all nodes
    const nodes = await getAllNodes();
    console.log(`\nFound ${nodes.length} nodes`);

    // Filter to entity nodes only (category = "entity")
    const entityNodes = nodes.filter(n => n.category === 'entity');
    console.log(`Found ${entityNodes.length} entity nodes to update`);

    // Update each node
    for (const node of entityNodes) {
      await updateNodeSchema(node);
    }

    console.log('\n======================================');
    console.log('✓ Successfully updated all entity nodes');
    console.log('======================================\n');

  } catch (error) {
    console.error('Error updating ontology:', error);
    process.exit(1);
  }
}

main();
