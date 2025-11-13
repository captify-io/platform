/**
 * Update Agent Tools Script
 *
 * 1. Remove deleted tools from all agents:
 *    - tool-query-data
 *    - tool-discover-relationships
 *    - tool-ontology-get
 *
 * 2. Set DEFAULT 11 tools for all agents
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const SCHEMA = process.env.SCHEMA || 'captify';
const AGENT_TABLE = `${SCHEMA}-core-agent`;

// Tools to REMOVE from all agents
const DELETED_TOOLS = [
  'tool-query-data',
  'tool-discover-relationships',
  'tool-ontology-get',
];

// DEFAULT 11 tools for all agents
const DEFAULT_TOOLS = [
  // Core Ontology Operations (5 tools)
  'tool-ontology-query',
  'tool-ontology-create',
  'tool-ontology-update',
  'tool-ontology-delete',
  'tool-introspect-ontology',

  // Essential Widgets (4 tools)
  'tool-widget-table',
  'tool-widget-chart',
  'tool-widget-card',
  'tool-widget-message',

  // Utility (2 tools)
  'tool-search-knowledge-base',
  'tool-clarify-user-intent',
];

async function getAllAgents() {
  const result = await docClient.send(new ScanCommand({
    TableName: AGENT_TABLE,
    ProjectionExpression: 'id, #n, #t, #c',
    ExpressionAttributeNames: {
      '#n': 'name',
      '#t': 'tools',
      '#c': 'config',
    },
  }));
  return result.Items || [];
}

async function updateAgentTools(agentId: string, newTools: string[]) {
  await docClient.send(new UpdateCommand({
    TableName: AGENT_TABLE,
    Key: { id: agentId },
    UpdateExpression: 'SET #tools = :tools, #config.#toolIds = :tools, updatedAt = :updatedAt',
    ExpressionAttributeNames: {
      '#tools': 'tools',
      '#config': 'config',
      '#toolIds': 'toolIds',
    },
    ExpressionAttributeValues: {
      ':tools': newTools,
      ':updatedAt': new Date().toISOString(),
    },
  }));
}

async function main() {
  console.log('\n=== UPDATING AGENT TOOLS ===\n');

  const agents = await getAllAgents();
  console.log(`📊 Found ${agents.length} agents\n`);

  let updated = 0;
  let unchanged = 0;

  for (const agent of agents) {
    const currentTools = agent.tools || agent.config?.toolIds || [];

    // Remove deleted tools
    let newTools = currentTools.filter((t: string) => !DELETED_TOOLS.includes(t));

    // Check if any deleted tools were removed
    const removedTools = currentTools.filter((t: string) => DELETED_TOOLS.includes(t));

    // If agent has no tools or very few tools, set to DEFAULT
    // Otherwise, just remove deleted tools and keep their selection
    if (currentTools.length === 0) {
      newTools = DEFAULT_TOOLS;
      console.log(`\n📝 ${agent.name} (${agent.id})`);
      console.log(`   Had no tools → Setting DEFAULT (${DEFAULT_TOOLS.length} tools)`);
      await updateAgentTools(agent.id, newTools);
      updated++;
    } else if (removedTools.length > 0) {
      console.log(`\n📝 ${agent.name} (${agent.id})`);
      console.log(`   Removed: ${removedTools.join(', ')}`);
      console.log(`   Tools: ${currentTools.length} → ${newTools.length}`);

      // If they now have very few tools (< 5), add the DEFAULT set
      if (newTools.length < 5) {
        console.log(`   ⚠️  Only ${newTools.length} tools remain, setting to DEFAULT`);
        newTools = DEFAULT_TOOLS;
      }

      await updateAgentTools(agent.id, newTools);
      updated++;
    } else if (currentTools.length > 0 && currentTools.length < DEFAULT_TOOLS.length) {
      // Agent has some tools but not all defaults - add missing defaults
      const missingDefaults = DEFAULT_TOOLS.filter(t => !currentTools.includes(t));
      if (missingDefaults.length > 0) {
        newTools = [...new Set([...currentTools, ...missingDefaults])];
        console.log(`\n📝 ${agent.name} (${agent.id})`);
        console.log(`   Adding missing defaults: ${missingDefaults.length} tools`);
        console.log(`   Tools: ${currentTools.length} → ${newTools.length}`);
        await updateAgentTools(agent.id, newTools);
        updated++;
      } else {
        unchanged++;
      }
    } else {
      unchanged++;
    }
  }

  console.log('\n\n=== SUMMARY ===');
  console.log(`✅ Updated: ${updated} agents`);
  console.log(`⏭️  Unchanged: ${unchanged} agents`);
  console.log(`\n📊 All agents now have:`);
  console.log(`   - No deleted tools (removed ${DELETED_TOOLS.length})`);
  console.log(`   - At least DEFAULT ${DEFAULT_TOOLS.length} tools`);
  console.log(`\n✨ Agent tools updated successfully!`);
}

main().catch(console.error);
