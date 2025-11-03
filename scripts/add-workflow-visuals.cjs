/**
 * Add visual workflow graphs to existing tools in captify-core-Workflow
 * This makes them displayable in the workflow builder
 */

const { DynamoDBClient, ScanCommand } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
});
const docClient = DynamoDBDocumentClient.from(client);

/**
 * Generate visual workflow graph from tool definition
 */
function generateVisualWorkflow(tool) {
  const nodes = [];
  const edges = [];

  let y = 100;
  const x = 400;
  const spacing = 180;

  // 1. START NODE - Tool Parameters
  const paramCount = Object.keys(tool.schema?.properties || {}).length;
  const requiredCount = (tool.schema?.required || []).length;

  nodes.push({
    id: 'start-1',
    type: 'start',
    position: { x, y },
    data: {
      label: 'Tool Parameters',
      description: `${paramCount} parameters${requiredCount > 0 ? ` (${requiredCount} required)` : ''}`,
      config: {
        inputParameters: Object.entries(tool.schema?.properties || {}).map(([name, prop]) => ({
          name,
          type: prop.type,
          description: prop.description,
          required: (tool.schema?.required || []).includes(name),
        })),
      },
    },
  });
  y += spacing;

  // 2. ACTION NODE - The actual operation
  const actionLabel = getActionLabel(tool);
  const actionDesc = getActionDescription(tool);

  nodes.push({
    id: 'action-1',
    type: 'action',
    position: { x, y },
    data: {
      label: actionLabel,
      description: actionDesc,
      config: {
        service: tool.implementation,
        operation: getOperation(tool),
        table: tool.table,
        bucket: tool.bucket,
      },
    },
  });

  edges.push({
    id: 'edge-start-action',
    source: 'start-1',
    target: 'action-1',
    label: 'execute',
  });
  y += spacing;

  // 3. CONFIRMATION NODE (if required)
  if (tool.confirmationRequired) {
    nodes.push({
      id: 'confirm-1',
      type: 'confirmation',
      position: { x, y },
      data: {
        label: 'User Confirmation',
        description: 'Waits for user approval before proceeding',
        config: {
          message: 'Please review and confirm the action',
          showPreview: true,
        },
      },
    });

    edges.push({
      id: 'edge-action-confirm',
      source: 'action-1',
      target: 'confirm-1',
      label: 'needs approval',
    });
    y += spacing;
  }

  // 4. END NODE - Result
  nodes.push({
    id: 'end-1',
    type: 'end',
    position: { x, y },
    data: {
      label: 'Complete',
      description: 'Returns result to user',
      config: {
        outputVariable: 'result',
      },
    },
  });

  edges.push({
    id: tool.confirmationRequired ? 'edge-confirm-end' : 'edge-action-end',
    source: tool.confirmationRequired ? 'confirm-1' : 'action-1',
    target: 'end-1',
    label: 'return result',
  });

  return { nodes, edges };
}

function getActionLabel(tool) {
  const impl = tool.implementation;
  const name = tool.name || '';

  if (impl === 'dynamodb') {
    if (name.includes('create')) return 'Create Record';
    if (name.includes('query')) return 'Query Database';
    if (name.includes('update')) return 'Update Record';
    if (name.includes('delete')) return 'Delete Record';
    return 'Database Operation';
  } else if (impl === 's3') {
    if (name.includes('upload')) return 'Upload File';
    if (name.includes('download')) return 'Download File';
    return 'S3 Operation';
  } else if (impl === 'bedrock') {
    return 'AI Model';
  } else if (impl === 'kendra') {
    return 'Search Knowledge';
  } else if (impl === 'custom') {
    return 'Custom Operation';
  }

  return 'Execute';
}

function getActionDescription(tool) {
  const impl = tool.implementation;

  if (impl === 'dynamodb' && tool.table) {
    return `Table: ${tool.table}`;
  } else if (impl === 's3' && tool.bucket) {
    return `Bucket: ${tool.bucket}`;
  } else if (impl === 'kendra') {
    return 'Search documents';
  }

  return tool.implementation || 'Operation';
}

function getOperation(tool) {
  const name = (tool.name || '').toLowerCase();
  if (name.includes('create')) return 'put';
  if (name.includes('query')) return 'query';
  if (name.includes('update')) return 'update';
  if (name.includes('delete')) return 'delete';
  if (name.includes('upload')) return 'upload';
  if (name.includes('search')) return 'query';
  return 'execute';
}

async function main() {
  console.log('📊 Adding visual workflows to captify-core-Workflow...\n');

  // Scan all workflows
  const scanResult = await docClient.send(new ScanCommand({
    TableName: 'captify-core-Workflow',
  }));

  const tools = scanResult.Items || [];
  console.log(`Found ${tools.length} workflows\n`);

  let updated = 0;
  let skipped = 0;

  for (const tool of tools) {
    console.log(`\n📦 ${tool.id}`);
    console.log(`   Name: ${tool.name}`);
    console.log(`   Implementation: ${tool.implementation || 'none'}`);
    console.log(`   Confirmation: ${tool.confirmationRequired ? 'Yes' : 'No'}`);

    // Skip if already has workflow visualization
    if (tool.workflow?.nodes && tool.workflow?.edges) {
      console.log(`   ✓ Already has visual workflow (${tool.workflow.nodes.length} nodes)`);
      skipped++;
      continue;
    }

    // Generate visual workflow
    const workflow = generateVisualWorkflow(tool);
    console.log(`   📊 Generated visual: ${workflow.nodes.length} nodes, ${workflow.edges.length} edges`);

    // Update in database
    const updatedTool = {
      ...tool,
      workflow,
      updatedAt: new Date().toISOString(),
    };

    await client.send(new PutCommand({
      TableName: 'captify-core-Workflow',
      Item: marshall(updatedTool, { removeUndefinedValues: true }),
    }));

    console.log(`   ✅ Updated with visual workflow`);
    updated++;
  }

  console.log(`\n\n✅ Complete!`);
  console.log(`   Updated: ${updated}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Total: ${tools.length}`);
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
