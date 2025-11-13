/**
 * Tool Consolidation Script
 *
 * Removes redundant tools identified in analysis:
 * - 32 tools → 21 tools (11 removed)
 *
 * KEEPS:
 * - 5 core ontology tools (query, introspect, create, update, delete)
 * - 6 widget tools (all display tools)
 * - 4 app-specific tools (createRequest, createCapability, search, upload)
 * - 6 workflow tools (process orchestration)
 *
 * REMOVES:
 * - Redundant query/data tools
 * - Duplicate metadata/semantic catalog tools
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, DeleteCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const SCHEMA = process.env.SCHEMA || 'captify';
const TABLE_NAME = `${SCHEMA}-core-tool`;

// Tools to REMOVE (11 total)
const TOOLS_TO_REMOVE = [
  'tool-ontology-get',              // Use ontology.query with id filter
  'tool-discover-relationships',     // Use ontology.introspect + query
  'tool-query-data',                 // Use ontology.query
  'tool-query-contracts',            // Use ontology.query
  'tool-fetch-semantic-catalog',     // Use ontology.introspect
  'tool-get-entity-schema',          // Use ontology.introspect
  'tool-search-catalog',             // Use ontology.introspect with filters
  'tool-ontology-list-types',        // Use ontology.introspect without params
  'tool-build-query',                // LLM builds params directly
  'tool-validate-query',             // Ontology validates automatically
  'tool-execute-query',              // Combined with ontology.query
  'tool-aggregate-results',          // LLM aggregates in memory
];

// Tools to KEEP (21 total)
const TOOLS_TO_KEEP = [
  // Core ontology (5)
  'tool-ontology-create',            // ontology.create
  'tool-ontology-query',             // ontology.query
  'tool-ontology-update',            // ontology.update
  'tool-ontology-delete',            // ontology.delete
  'tool-introspect-ontology',        // ontology.introspect

  // Widgets (6)
  'tool-widget-table',               // widget.displayTable
  'tool-widget-chart',               // widget.displayChart
  'tool-widget-card',                // widget.displayCard
  'tool-widget-message',             // widget.displayMessage
  'tool-widget-form',                // widget.displayForm
  'tool-widget-list',                // widget.displayList

  // App-specific (4)
  'tool-create-request',             // workflow.createRequest
  'tool-create-capability',          // strategic.createCapability
  'tool-search-knowledge-base',      // search.searchKnowledgeBase
  'tool-upload-document',            // storage.uploadDocument

  // Workflow orchestration (6)
  'tool-finalize-planning-phase',
  'tool-finalize-building-phase',
  'tool-finalize-execution-phase',
  'tool-finalize-planning-no-data',
  'tool-clarify-user-intent',
  'tool-create-change-request',       // Note: Duplicate with tool-create-request?
];

async function scanAllTools() {
  const result = await docClient.send(new ScanCommand({
    TableName: TABLE_NAME,
    ProjectionExpression: 'id, #n, category, operation',
    ExpressionAttributeNames: { '#n': 'name' },
  }));

  return result.Items || [];
}

async function deleteTool(toolId: string) {
  await docClient.send(new DeleteCommand({
    TableName: TABLE_NAME,
    Key: { id: toolId },
  }));
}

async function main() {
  console.log('\n=== TOOL CONSOLIDATION ===\n');

  // Scan all current tools
  const allTools = await scanAllTools();
  console.log(`📊 Found ${allTools.length} total tools\n`);

  // Identify tools to remove
  const toolsToRemove = allTools.filter(t => TOOLS_TO_REMOVE.includes(t.id));
  const toolsToKeep = allTools.filter(t => TOOLS_TO_KEEP.includes(t.id));
  const unknownTools = allTools.filter(t =>
    !TOOLS_TO_REMOVE.includes(t.id) && !TOOLS_TO_KEEP.includes(t.id)
  );

  console.log(`✅ KEEPING (${toolsToKeep.length} tools):`);
  const byCategory: Record<string, any[]> = {};
  toolsToKeep.forEach(t => {
    if (!byCategory[t.category]) byCategory[t.category] = [];
    byCategory[t.category].push(t);
  });
  Object.entries(byCategory).forEach(([cat, tools]) => {
    console.log(`\n  ${cat}:`);
    tools.forEach(t => console.log(`    - ${t.name} (${t.id})`));
  });

  if (unknownTools.length > 0) {
    console.log(`\n⚠️  UNKNOWN (${unknownTools.length} tools - not in plan):`);
    unknownTools.forEach(t => {
      console.log(`    - ${t.name} (${t.id}) [${t.category}.${t.operation}]`);
    });
  }

  console.log(`\n\n❌ REMOVING (${toolsToRemove.length} tools):`);
  toolsToRemove.forEach(t => {
    console.log(`  - ${t.name} (${t.id})`);
  });

  // Confirm before proceeding
  console.log('\n\n⏳ Proceeding with deletion in 3 seconds...');
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Delete tools
  let deleted = 0;
  for (const tool of toolsToRemove) {
    try {
      await deleteTool(tool.id);
      console.log(`✅ Deleted: ${tool.name}`);
      deleted++;
    } catch (error) {
      console.error(`❌ Failed to delete ${tool.name}:`, error);
    }
  }

  console.log(`\n\n=== SUMMARY ===`);
  console.log(`✅ Deleted: ${deleted} tools`);
  console.log(`⏭️  Skipped: ${toolsToRemove.length - deleted} tools (errors)`);
  console.log(`📊 Remaining: ${allTools.length - deleted} tools`);
  console.log(`\n✨ Tool consolidation complete!`);
}

main().catch(console.error);
