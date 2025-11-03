/**
 * Generate visual workflow graphs from existing simple tool definitions
 * This script reads captify-core-Workflow and adds nodes/edges for visualization
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, PutCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

interface WorkflowNode {
  id: string;
  type: 'input' | 'action' | 'confirm' | 'output';
  position: { x: number; y: number };
  data: {
    label: string;
    config?: any;
  };
}

interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

/**
 * Generate workflow graph from simple tool definition
 */
function generateWorkflowGraph(tool: any): { nodes: WorkflowNode[]; edges: WorkflowEdge[] } {
  const nodes: WorkflowNode[] = [];
  const edges: WorkflowEdge[] = [];

  let yPosition = 100;
  const xCenter = 400;
  const nodeSpacing = 150;

  // 1. INPUT NODE - Shows parameters from schema
  const inputNode: WorkflowNode = {
    id: 'input-1',
    type: 'input',
    position: { x: xCenter, y: yPosition },
    data: {
      label: 'Tool Parameters',
      config: {
        parameters: tool.schema?.properties || {},
        required: tool.schema?.required || [],
      },
    },
  };
  nodes.push(inputNode);
  yPosition += nodeSpacing;

  // 2. ACTION NODE - Shows the implementation
  const actionNode: WorkflowNode = {
    id: 'action-1',
    type: 'action',
    position: { x: xCenter, y: yPosition },
    data: {
      label: getActionLabel(tool),
      config: {
        implementation: tool.implementation,
        table: tool.table,
        bucket: tool.bucket,
        operation: getOperation(tool),
      },
    },
  };
  nodes.push(actionNode);
  edges.push({
    id: 'e-input-action',
    source: 'input-1',
    target: 'action-1',
    label: 'execute',
  });
  yPosition += nodeSpacing;

  // 3. CONFIRM NODE (if confirmationRequired)
  if (tool.confirmationRequired) {
    const confirmNode: WorkflowNode = {
      id: 'confirm-1',
      type: 'confirm',
      position: { x: xCenter, y: yPosition },
      data: {
        label: 'User Confirmation',
        config: {
          message: 'Please review and confirm the action',
          requiresConfirmed: true,
        },
      },
    };
    nodes.push(confirmNode);
    edges.push({
      id: 'e-action-confirm',
      source: 'action-1',
      target: 'confirm-1',
      label: 'requires approval',
    });
    yPosition += nodeSpacing;
  }

  // 4. OUTPUT NODE - Shows result
  const outputNode: WorkflowNode = {
    id: 'output-1',
    type: 'output',
    position: { x: xCenter, y: yPosition },
    data: {
      label: 'Result',
      config: {
        outputType: 'success',
      },
    },
  };
  nodes.push(outputNode);
  edges.push({
    id: tool.confirmationRequired ? 'e-confirm-output' : 'e-action-output',
    source: tool.confirmationRequired ? 'confirm-1' : 'action-1',
    target: 'output-1',
    label: 'complete',
  });

  return { nodes, edges };
}

/**
 * Get human-readable action label
 */
function getActionLabel(tool: any): string {
  const impl = tool.implementation;
  const name = tool.name;

  if (impl === 'dynamodb' && tool.table) {
    if (name.includes('create') || name.includes('put')) {
      return `Create Record in ${tool.table}`;
    } else if (name.includes('query') || name.includes('get')) {
      return `Query ${tool.table}`;
    } else if (name.includes('update')) {
      return `Update Record in ${tool.table}`;
    } else if (name.includes('delete')) {
      return `Delete from ${tool.table}`;
    }
    return `DynamoDB: ${tool.table}`;
  } else if (impl === 's3' && tool.bucket) {
    if (name.includes('upload')) {
      return `Upload to S3: ${tool.bucket}`;
    } else if (name.includes('download')) {
      return `Download from S3: ${tool.bucket}`;
    }
    return `S3: ${tool.bucket}`;
  } else if (impl === 'bedrock') {
    return 'Invoke Bedrock Agent';
  } else if (impl === 'kendra') {
    return 'Search Knowledge Base';
  } else if (impl === 'custom') {
    return 'Custom Operation';
  }

  return `${impl} Operation`;
}

/**
 * Get operation type
 */
function getOperation(tool: any): string {
  const name = tool.name.toLowerCase();
  if (name.includes('create')) return 'create';
  if (name.includes('query')) return 'query';
  if (name.includes('update')) return 'update';
  if (name.includes('delete')) return 'delete';
  if (name.includes('upload')) return 'upload';
  if (name.includes('download')) return 'download';
  if (name.includes('search')) return 'search';
  return 'execute';
}

/**
 * Main function
 */
async function main() {
  console.log('🔄 Scanning captify-core-Workflow...');

  // Scan all workflows
  const result = await docClient.send(
    new ScanCommand({
      TableName: 'captify-core-Workflow',
    })
  );

  const tools = result.Items || [];
  console.log(`📦 Found ${tools.length} workflows`);

  // Generate and update each workflow
  for (const tool of tools) {
    console.log(`\n🛠️  Processing: ${tool.id}`);

    // Skip if already has workflow graph
    if (tool.workflow?.nodes && tool.workflow?.edges) {
      console.log(`   ✓ Already has workflow graph, skipping`);
      continue;
    }

    // Generate workflow graph
    const workflow = generateWorkflowGraph(tool);
    console.log(`   📊 Generated ${workflow.nodes.length} nodes, ${workflow.edges.length} edges`);

    // Update in database
    await docClient.send(
      new PutCommand({
        TableName: 'captify-core-Workflow',
        Item: {
          ...tool,
          workflow,
          updatedAt: new Date().toISOString(),
        },
      })
    );
    console.log(`   ✓ Updated in database`);
  }

  console.log('\n✅ Complete!');
}

main().catch(console.error);
