/**
 * Seed Ontology Meta Nodes
 *
 * Adds missing meta-nodes to the ontology so it can describe itself.
 * This enables users to query:
 * - "What are ontology nodes?"
 * - "Show me all edges"
 * - "What data sources exist?"
 * - "List all events"
 * etc.
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';

const client = DynamoDBDocumentClient.from(new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  }
}));

const timestamp = new Date().toISOString();
const schema = 'captify';

// Meta nodes that allow the ontology to describe itself
const metaNodes = [
  // ============================================================================
  // ONTOLOGY SELF-REFERENCE (CRITICAL)
  // ============================================================================
  {
    id: 'core-ontologyNode',
    name: 'Ontology Node',
    type: 'ontologyNode',
    category: 'meta',
    domain: 'Ontology',
    description: 'A node in the ontology graph representing an entity type, concept, or system component',
    icon: 'Network',
    color: '#8b5cf6',
    active: 'true',
    properties: {
      dataSource: 'core-ontology-node',
      schema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Unique node identifier', required: true },
          name: { type: 'string', description: 'Display name', required: true },
          type: { type: 'string', description: 'Entity type (camelCase)', required: true },
          category: { type: 'string', description: 'Classification category', required: true },
          domain: { type: 'string', description: 'Business domain', required: true },
          description: { type: 'string', description: 'Node description', required: false },
          icon: { type: 'string', description: 'Icon name', required: false },
          color: { type: 'string', description: 'Display color', required: false },
          active: { type: 'string', description: 'Active status', required: true },
          properties: { type: 'object', description: 'Node properties including schema and dataSource', required: false }
        }
      }
    },
    createdAt: timestamp,
    updatedAt: timestamp,
    createdBy: 'system',
    updatedBy: 'system'
  },
  {
    id: 'core-ontologyEdge',
    name: 'Ontology Edge',
    type: 'ontologyEdge',
    category: 'meta',
    domain: 'Ontology',
    description: 'A relationship between two ontology nodes defining how entities connect',
    icon: 'ArrowRightLeft',
    color: '#8b5cf6',
    active: 'true',
    properties: {
      dataSource: 'core-ontology-edge',
      schema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Unique edge identifier', required: true },
          source: { type: 'string', description: 'Source node ID', required: true },
          target: { type: 'string', description: 'Target node ID', required: true },
          relation: { type: 'string', description: 'Relationship type (hasMany, belongsTo, references)', required: true },
          sourceType: { type: 'string', description: 'Source entity type', required: false },
          targetType: { type: 'string', description: 'Target entity type', required: false },
          properties: { type: 'object', description: 'Edge properties', required: false }
        }
      }
    },
    createdAt: timestamp,
    updatedAt: timestamp,
    createdBy: 'system',
    updatedBy: 'system'
  },

  // ============================================================================
  // INFRASTRUCTURE CONCEPTS
  // ============================================================================
  {
    id: 'core-datasource',
    name: 'Data Source',
    type: 'datasource',
    category: 'infrastructure',
    domain: 'Data',
    description: 'External data source or database connection',
    icon: 'Database',
    color: '#3b82f6',
    active: 'true',
    properties: {
      schema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Data source ID', required: true },
          name: { type: 'string', description: 'Data source name', required: true },
          type: { type: 'string', description: 'Type (dynamodb, s3, aurora, api)', required: true },
          connectionString: { type: 'string', description: 'Connection details', required: false },
          credentials: { type: 'object', description: 'Access credentials', required: false }
        }
      }
    },
    createdAt: timestamp,
    updatedAt: timestamp,
    createdBy: 'system',
    updatedBy: 'system'
  },
  {
    id: 'core-endpoint',
    name: 'API Endpoint',
    type: 'endpoint',
    category: 'infrastructure',
    domain: 'API',
    description: 'REST API endpoint or service route',
    icon: 'Webhook',
    color: '#10b981',
    active: 'true',
    properties: {
      schema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Endpoint ID', required: true },
          path: { type: 'string', description: 'URL path', required: true },
          method: { type: 'string', description: 'HTTP method', required: true },
          service: { type: 'string', description: 'Service name', required: true },
          description: { type: 'string', description: 'Endpoint description', required: false }
        }
      }
    },
    createdAt: timestamp,
    updatedAt: timestamp,
    createdBy: 'system',
    updatedBy: 'system'
  },
  {
    id: 'core-query',
    name: 'Query',
    type: 'query',
    category: 'data',
    domain: 'Data',
    description: 'Saved query or data retrieval operation',
    icon: 'Search',
    color: '#6366f1',
    active: 'true',
    properties: {
      schema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Query ID', required: true },
          name: { type: 'string', description: 'Query name', required: true },
          sql: { type: 'string', description: 'SQL or query text', required: false },
          parameters: { type: 'object', description: 'Query parameters', required: false }
        }
      }
    },
    createdAt: timestamp,
    updatedAt: timestamp,
    createdBy: 'system',
    updatedBy: 'system'
  },
  {
    id: 'core-command',
    name: 'Command',
    type: 'command',
    category: 'operations',
    domain: 'Operations',
    description: 'System command or operation',
    icon: 'Terminal',
    color: '#8b5cf6',
    active: 'true',
    properties: {
      schema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Command ID', required: true },
          name: { type: 'string', description: 'Command name', required: true },
          type: { type: 'string', description: 'Command type', required: true },
          parameters: { type: 'object', description: 'Command parameters', required: false }
        }
      }
    },
    createdAt: timestamp,
    updatedAt: timestamp,
    createdBy: 'system',
    updatedBy: 'system'
  },

  // ============================================================================
  // MONITORING & OPERATIONS
  // ============================================================================
  {
    id: 'core-health',
    name: 'Health Check',
    type: 'health',
    category: 'monitoring',
    domain: 'Operations',
    description: 'System health check or status indicator',
    icon: 'Activity',
    color: '#10b981',
    active: 'true',
    properties: {
      schema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Health check ID', required: true },
          service: { type: 'string', description: 'Service name', required: true },
          status: { type: 'string', description: 'Health status', required: true },
          lastCheck: { type: 'string', description: 'Last check timestamp', required: true }
        }
      }
    },
    createdAt: timestamp,
    updatedAt: timestamp,
    createdBy: 'system',
    updatedBy: 'system'
  },
  {
    id: 'core-log',
    name: 'Log Entry',
    type: 'log',
    category: 'monitoring',
    domain: 'Operations',
    description: 'System log entry or event record',
    icon: 'FileText',
    color: '#64748b',
    active: 'true',
    properties: {
      schema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Log ID', required: true },
          timestamp: { type: 'string', description: 'Log timestamp', required: true },
          level: { type: 'string', description: 'Log level (info, warn, error)', required: true },
          message: { type: 'string', description: 'Log message', required: true },
          service: { type: 'string', description: 'Source service', required: false }
        }
      }
    },
    createdAt: timestamp,
    updatedAt: timestamp,
    createdBy: 'system',
    updatedBy: 'system'
  },
  {
    id: 'core-job',
    name: 'Background Job',
    type: 'job',
    category: 'operations',
    domain: 'Operations',
    description: 'Background job or scheduled task execution',
    icon: 'Clock',
    color: '#f59e0b',
    active: 'true',
    properties: {
      schema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Job ID', required: true },
          name: { type: 'string', description: 'Job name', required: true },
          status: { type: 'string', description: 'Job status', required: true },
          startedAt: { type: 'string', description: 'Start time', required: false },
          completedAt: { type: 'string', description: 'Completion time', required: false }
        }
      }
    },
    createdAt: timestamp,
    updatedAt: timestamp,
    createdBy: 'system',
    updatedBy: 'system'
  },
  {
    id: 'core-schedule',
    name: 'Schedule',
    type: 'schedule',
    category: 'operations',
    domain: 'Operations',
    description: 'Scheduled task or recurring job definition',
    icon: 'Calendar',
    color: '#f59e0b',
    active: 'true',
    properties: {
      schema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Schedule ID', required: true },
          name: { type: 'string', description: 'Schedule name', required: true },
          cronExpression: { type: 'string', description: 'Cron expression', required: true },
          enabled: { type: 'boolean', description: 'Is enabled', required: true }
        }
      }
    },
    createdAt: timestamp,
    updatedAt: timestamp,
    createdBy: 'system',
    updatedBy: 'system'
  },
  {
    id: 'core-process',
    name: 'Process',
    type: 'process',
    category: 'operations',
    domain: 'Operations',
    description: 'Running process or system operation',
    icon: 'Cpu',
    color: '#8b5cf6',
    active: 'true',
    properties: {
      schema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Process ID', required: true },
          name: { type: 'string', description: 'Process name', required: true },
          status: { type: 'string', description: 'Process status', required: true },
          pid: { type: 'number', description: 'System process ID', required: false }
        }
      }
    },
    createdAt: timestamp,
    updatedAt: timestamp,
    createdBy: 'system',
    updatedBy: 'system'
  },

  // ============================================================================
  // EVENTS & FUNCTIONS
  // ============================================================================
  {
    id: 'core-event',
    name: 'Event',
    type: 'event',
    category: 'system',
    domain: 'Events',
    description: 'System event or user interaction',
    icon: 'Zap',
    color: '#eab308',
    active: 'true',
    properties: {
      schema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Event ID', required: true },
          name: { type: 'string', description: 'Event name', required: true },
          type: { type: 'string', description: 'Event type', required: true },
          timestamp: { type: 'string', description: 'Event timestamp', required: true },
          data: { type: 'object', description: 'Event data', required: false }
        }
      }
    },
    createdAt: timestamp,
    updatedAt: timestamp,
    createdBy: 'system',
    updatedBy: 'system'
  },
  {
    id: 'core-function',
    name: 'Function',
    type: 'function',
    category: 'system',
    domain: 'Functions',
    description: 'Serverless function or Lambda',
    icon: 'Code',
    color: '#06b6d4',
    active: 'true',
    properties: {
      schema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Function ID', required: true },
          name: { type: 'string', description: 'Function name', required: true },
          runtime: { type: 'string', description: 'Runtime environment', required: true },
          handler: { type: 'string', description: 'Handler function', required: true }
        }
      }
    },
    createdAt: timestamp,
    updatedAt: timestamp,
    createdBy: 'system',
    updatedBy: 'system'
  },
  {
    id: 'core-view',
    name: 'View',
    type: 'view',
    category: 'ui',
    domain: 'UI',
    description: 'UI view or dashboard',
    icon: 'Layout',
    color: '#3b82f6',
    active: 'true',
    properties: {
      schema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'View ID', required: true },
          name: { type: 'string', description: 'View name', required: true },
          path: { type: 'string', description: 'URL path', required: true },
          widgets: { type: 'array', description: 'Widget IDs', required: false }
        }
      }
    },
    createdAt: timestamp,
    updatedAt: timestamp,
    createdBy: 'system',
    updatedBy: 'system'
  },

  // ============================================================================
  // ACCESS CONTROL
  // ============================================================================
  {
    id: 'core-permission',
    name: 'Permission',
    type: 'permission',
    category: 'security',
    domain: 'Access Control',
    description: 'Access permission or authorization rule',
    icon: 'Key',
    color: '#ef4444',
    active: 'true',
    properties: {
      schema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Permission ID', required: true },
          name: { type: 'string', description: 'Permission name', required: true },
          resource: { type: 'string', description: 'Resource type', required: true },
          actions: { type: 'array', description: 'Allowed actions', required: true }
        }
      }
    },
    createdAt: timestamp,
    updatedAt: timestamp,
    createdBy: 'system',
    updatedBy: 'system'
  },

  // ============================================================================
  // GENERIC ALIASES (for natural language queries)
  // ============================================================================
  {
    id: 'core-node',
    name: 'Node',
    type: 'node',
    category: 'meta',
    domain: 'Ontology',
    description: 'Generic node reference - alias for ontologyNode',
    icon: 'Circle',
    color: '#8b5cf6',
    active: 'true',
    properties: {
      dataSource: 'core-ontology-node'
    },
    createdAt: timestamp,
    updatedAt: timestamp,
    createdBy: 'system',
    updatedBy: 'system'
  },
  {
    id: 'core-edge',
    name: 'Edge',
    type: 'edge',
    category: 'meta',
    domain: 'Ontology',
    description: 'Generic edge reference - alias for ontologyEdge',
    icon: 'GitBranch',
    color: '#8b5cf6',
    active: 'true',
    properties: {
      dataSource: 'core-ontology-edge'
    },
    createdAt: timestamp,
    updatedAt: timestamp,
    createdBy: 'system',
    updatedBy: 'system'
  },
  {
    id: 'core-link',
    name: 'Link',
    type: 'link',
    category: 'meta',
    domain: 'Ontology',
    description: 'Generic link reference - alias for ontologyEdge',
    icon: 'Link',
    color: '#8b5cf6',
    active: 'true',
    properties: {
      dataSource: 'core-ontology-edge'
    },
    createdAt: timestamp,
    updatedAt: timestamp,
    createdBy: 'system',
    updatedBy: 'system'
  },
  {
    id: 'core-object',
    name: 'Object',
    type: 'object',
    category: 'meta',
    domain: 'Ontology',
    description: 'Generic object reference - used for entity searches',
    icon: 'Box',
    color: '#8b5cf6',
    active: 'true',
    createdAt: timestamp,
    updatedAt: timestamp,
    createdBy: 'system',
    updatedBy: 'system'
  }
];

async function seedMetaNodes() {
  console.log('=== SEEDING ONTOLOGY META NODES ===\n');

  // Check existing nodes
  const existingResult = await client.send(new ScanCommand({
    TableName: `${schema}-core-ontology-node`,
    ProjectionExpression: '#t',
    ExpressionAttributeNames: { '#t': 'type' }
  }));

  const existingTypes = new Set((existingResult.Items || []).map(item => item.type));
  console.log(`Found ${existingTypes.size} existing node types\n`);

  let added = 0;
  let skipped = 0;

  for (const node of metaNodes) {
    if (existingTypes.has(node.type)) {
      console.log(`⏭️  SKIP: ${node.name} (${node.type}) - already exists`);
      skipped++;
      continue;
    }

    try {
      await client.send(new PutCommand({
        TableName: `${schema}-core-ontology-node`,
        Item: node
      }));
      console.log(`✅ ADD:  ${node.name} (${node.type})`);
      added++;
    } catch (error) {
      console.error(`❌ FAIL: ${node.name} (${node.type})`, error);
    }
  }

  console.log(`\n=== SUMMARY ===`);
  console.log(`✅ Added: ${added} nodes`);
  console.log(`⏭️  Skipped: ${skipped} nodes (already exist)`);
  console.log(`📊 Total: ${added + skipped} / ${metaNodes.length} processed`);

  console.log(`\n=== VERIFICATION ===`);
  console.log(`Run these queries to test:`);
  console.log(`  "Show me all ontology nodes"`);
  console.log(`  "What edges connect contracts to CLINs?"`);
  console.log(`  "List all data sources"`);
  console.log(`  "Show me all events"`);
}

seedMetaNodes().catch(console.error);
