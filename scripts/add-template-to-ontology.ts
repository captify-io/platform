/**
 * Add Fabric Template to Ontology Script
 *
 * Adds the fabric-template entity type to the ontology system
 *
 * Usage: npx tsx scripts/add-template-to-ontology.ts
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';

// Configuration
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const SCHEMA = process.env.SCHEMA || 'captify';
const ONTOLOGY_OBJECT_TYPE_TABLE = `${SCHEMA}-ontology-object-type`;

async function addTemplateToOntology() {
  console.log('🧬 Adding Fabric Template to Ontology...\n');

  const client = new DynamoDBClient({
    region: AWS_REGION,
  });

  const docClient = DynamoDBDocumentClient.from(client);

  const now = new Date().toISOString();
  const slug = 'template';

  // Check if already exists
  try {
    const existing = await docClient.send(
      new GetCommand({
        TableName: ONTOLOGY_OBJECT_TYPE_TABLE,
        Key: { slug },
      })
    );

    if (existing.Item) {
      console.log(`✅ Ontology object type "${slug}" already exists!`);
      console.log('   Skipping creation.\n');
      return;
    }
  } catch (error: any) {
    // Item doesn't exist, proceed with creation
  }

  const ontologyNode = {
    slug: 'template',
    app: 'fabric',
    name: 'Template',
    description: 'Reusable document templates with variable substitution for creating consistent notes and documents',
    icon: 'FileType',
    color: '#8b5cf6', // Purple
    status: 'active',
    createdAt: now,
    updatedAt: now,
    version: 1,
    properties: {
      spaceId: {
        type: 'string',
        description: 'Parent space ID',
        required: true,
      },
      organizationId: {
        type: 'string',
        description: 'Organization ID for access control',
        required: true,
      },
      category: {
        type: 'string',
        description: 'Template category',
        validation: {
          options: ['SOP', 'Meeting Notes', 'Report', 'Project', 'Technical', 'Decision', 'Incident', 'Other'],
        },
      },
      icon: {
        type: 'string',
        description: 'Lucide icon name',
      },
      folder: {
        type: 'string',
        description: 'Default folder path',
      },
      tags: {
        type: 'array',
        description: 'Template tags',
      },
      content: {
        type: 'object',
        description: 'ProseMirror JSON content',
        required: true,
      },
      variables: {
        type: 'array',
        description: 'Template variable definitions with type, label, required, default, options',
      },
      frontmatter: {
        type: 'object',
        description: 'Default frontmatter for notes created from this template',
      },
      lockedProperties: {
        type: 'array',
        description: 'Properties that cannot be edited in generated notes',
      },
      clearanceLevel: {
        type: 'string',
        description: 'Security clearance level (IL5 NIST 800-53 Rev 5)',
        validation: {
          options: ['UNCLASSIFIED', 'CUI', 'SECRET', 'TOP_SECRET'],
        },
      },
    },
    examples: {
      name: 'Security Incident Response SOP',
      category: 'SOP',
      folder: '/sops',
      tags: ['security', 'compliance', 'incident-response'],
      clearanceLevel: 'CUI',
    },
  };

  try {
    await docClient.send(
      new PutCommand({
        TableName: ONTOLOGY_OBJECT_TYPE_TABLE,
        Item: ontologyNode,
        ConditionExpression: 'attribute_not_exists(slug)',
      })
    );

    console.log('✅ Ontology object type created successfully!');
    console.log('\n📊 Object Type Details:');
    console.log(`   Slug: ${ontologyNode.slug}`);
    console.log(`   App: ${ontologyNode.app}`);
    console.log(`   Name: ${ontologyNode.name}`);
    console.log(`   Status: ${ontologyNode.status}`);
    console.log(`   Icon: ${ontologyNode.icon}`);
    console.log(`   Color: ${ontologyNode.color}`);
    console.log('\n📋 Properties:');
    Object.entries(ontologyNode.properties).forEach(([name, def]: [string, any]) => {
      const required = def.required ? ' (required)' : '';
      console.log(`   - ${name}: ${def.type}${required} - ${def.description}`);
    });
    console.log('\n📝 Examples:');
    Object.entries(ontologyNode.examples || {}).forEach(([key, value]) => {
      console.log(`   - ${key}: ${JSON.stringify(value)}`);
    });
    console.log('');
  } catch (error: any) {
    if (error.name === 'ConditionalCheckFailedException') {
      console.log(`⏭️  Ontology object type "${slug}" already exists (skipped)`);
    } else {
      console.error('❌ Error creating ontology object type:', error.message);
      throw error;
    }
  }
}

// Run the script
addTemplateToOntology()
  .then(() => {
    console.log('\n✨ Ontology update completed!');
    console.log('\nNext step:');
    console.log('Seed templates: npx tsx scripts/seed-fabric-templates.ts');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
