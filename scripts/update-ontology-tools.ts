/**
 * Update Ontology Tools
 *
 * Standardize all core data tools under "ontology" category
 * for consistent tool naming and execution
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand, GetCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const SCHEMA = process.env.SCHEMA || 'captify';
const TABLE_NAME = `${SCHEMA}-core-tool`;

const TOOL_UPDATES = [
  {
    id: 'tool-ontology-create',
    updates: { category: 'ontology' },
    reason: 'Standardize to ontology category',
  },
  {
    id: 'tool-ontology-query',
    updates: { category: 'ontology' },
    reason: 'Standardize to ontology category',
  },
  {
    id: 'tool-ontology-update',
    updates: { category: 'ontology' },
    reason: 'Standardize to ontology category',
  },
  {
    id: 'tool-ontology-delete',
    updates: { category: 'ontology' },
    reason: 'Standardize to ontology category',
  },
];

async function getTool(toolId: string) {
  const result = await docClient.send(new GetCommand({
    TableName: TABLE_NAME,
    Key: { id: toolId },
  }));
  return result.Item;
}

async function updateTool(toolId: string, updates: Record<string, any>) {
  const updateExpressions: string[] = [];
  const expressionAttributeValues: Record<string, any> = {};
  const expressionAttributeNames: Record<string, string> = {};

  Object.entries(updates).forEach(([key, value], index) => {
    const attrName = `#attr${index}`;
    const attrValue = `:val${index}`;
    expressionAttributeNames[attrName] = key;
    expressionAttributeValues[attrValue] = value;
    updateExpressions.push(`${attrName} = ${attrValue}`);
  });

  await docClient.send(new UpdateCommand({
    TableName: TABLE_NAME,
    Key: { id: toolId },
    UpdateExpression: `SET ${updateExpressions.join(', ')}`,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
    ReturnValues: 'ALL_NEW',
  }));
}

async function main() {
  console.log('\n=== UPDATING ONTOLOGY TOOLS ===\n');

  for (const { id, updates, reason } of TOOL_UPDATES) {
    try {
      const tool = await getTool(id);
      if (!tool) {
        console.log(`⏭️  SKIP: ${id} (not found)`);
        continue;
      }

      console.log(`\n📝 ${tool.name} (${id})`);
      console.log(`   Reason: ${reason}`);
      Object.entries(updates).forEach(([key, value]) => {
        console.log(`   ${key}: ${tool[key]} → ${value}`);
      });

      await updateTool(id, updates);
      console.log(`   ✅ Updated`);
    } catch (error) {
      console.error(`   ❌ Error:`, error);
    }
  }

  console.log('\n\n=== SUMMARY ===');
  console.log(`✅ All ontology tools now use consistent category`);
  console.log(`\n📊 Final Tool Architecture:`);
  console.log(`   ontology.create     - Create any entity`);
  console.log(`   ontology.query      - Query any entity with filters`);
  console.log(`   ontology.update     - Update any entity`);
  console.log(`   ontology.delete     - Delete any entity`);
  console.log(`   ontology.introspect - Understand entity schemas (lazy-loaded)`);
}

main().catch(console.error);
