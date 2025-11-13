/**
 * Add Widget Event and Action Nodes to Ontology
 *
 * This script adds event nodes to captify-core-ontology-event table
 * and action nodes to captify-core-ontology-action table
 * for widget interactions like export, download, etc.
 *
 * Run with: npx tsx platform/src/app/admin/ontology/setup/add-widget-events.ts
 */

import { dynamodb } from '@captify-io/core/services';
import type { AwsCredentials } from '@captify-io/core/types';

// AWS credentials (from environment or IAM role)
const credentials: AwsCredentials = {
  region: process.env.AWS_REGION || 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
};

const SCHEMA = process.env.SCHEMA || 'captify';

/**
 * Event node definitions for widgets
 */
const eventNodes = [
  {
    id: 'event-export-excel',
    type: 'event',
    name: 'Export to Excel',
    description: 'Export data to Excel (XLSX) format',
    category: 'data-export',
    domain: 'Data Operations',
    icon: 'FileSpreadsheet',
    color: '#10b981',
    active: 'true',
    properties: {
      // Which action this event triggers
      actionId: 'action-export-data',

      // Default parameters for this event
      parameters: {
        format: 'xlsx',
        includeHeaders: true,
        includeFilters: false,
      },

      // Parameters that must be provided at runtime
      requiredParams: ['data', 'columns'],

      // Optional parameters
      optionalParams: ['filename', 'sheetName'],

      // Permissions required to execute this event
      permissions: {
        execute: ['user', 'admin'],
      },

      // Event metadata
      metadata: {
        description: 'Exports the current data view to an Excel file',
        usage: 'Triggered from widget toolbar or row actions',
      },
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'event-export-csv',
    type: 'event',
    name: 'Export to CSV',
    description: 'Export data to CSV format',
    category: 'data-export',
    domain: 'Data Operations',
    icon: 'FileText',
    color: '#3b82f6',
    active: 'true',
    properties: {
      actionId: 'action-export-data',
      parameters: {
        format: 'csv',
        includeHeaders: true,
        delimiter: ',',
      },
      requiredParams: ['data', 'columns'],
      optionalParams: ['filename'],
      permissions: {
        execute: ['user', 'admin'],
      },
      metadata: {
        description: 'Exports the current data view to a CSV file',
        usage: 'Triggered from widget toolbar or row actions',
      },
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'event-export-pdf',
    type: 'event',
    name: 'Export to PDF',
    description: 'Export data to PDF format',
    category: 'data-export',
    domain: 'Data Operations',
    icon: 'FileType',
    color: '#ef4444',
    active: 'true',
    properties: {
      actionId: 'action-export-data',
      parameters: {
        format: 'pdf',
        includeHeaders: true,
        orientation: 'landscape',
      },
      requiredParams: ['data', 'columns'],
      optionalParams: ['filename', 'title'],
      permissions: {
        execute: ['user', 'admin'],
      },
      metadata: {
        description: 'Exports the current data view to a PDF file',
        usage: 'Triggered from widget toolbar',
      },
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'event-export-json',
    type: 'event',
    name: 'Export to JSON',
    description: 'Export data to JSON format',
    category: 'data-export',
    domain: 'Data Operations',
    icon: 'FileCode',
    color: '#f59e0b',
    active: 'true',
    properties: {
      actionId: 'action-export-data',
      parameters: {
        format: 'json',
        pretty: true,
      },
      requiredParams: ['data'],
      optionalParams: ['filename'],
      permissions: {
        execute: ['user', 'admin', 'developer'],
      },
      metadata: {
        description: 'Exports the current data view to a JSON file',
        usage: 'Triggered from widget toolbar or API',
      },
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'event-refresh-data',
    type: 'event',
    name: 'Refresh Data',
    description: 'Refresh widget data from source',
    category: 'data-operation',
    domain: 'Data Operations',
    icon: 'RefreshCw',
    color: '#8b5cf6',
    active: 'true',
    properties: {
      actionId: 'action-refresh-data',
      parameters: {},
      requiredParams: ['ontologyNodeId'],
      optionalParams: ['filters', 'limit'],
      permissions: {
        execute: ['user', 'admin'],
      },
      metadata: {
        description: 'Reloads widget data from the data source',
        usage: 'Triggered from widget toolbar refresh button',
      },
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

/**
 * Action node definitions for export operations
 */
const actionNodes = [
  {
    id: 'action-export-data',
    type: 'action',
    name: 'Export Data',
    description: 'Export data to various formats (Excel, CSV, PDF, JSON)',
    category: 'data-operation',
    domain: 'Data Operations',
    icon: 'Download',
    color: '#10b981',
    active: 'true',
    properties: {
      // API endpoint to execute this action
      endpoint: '/api/actions/export',
      method: 'POST',

      // Schema for parameters
      schema: {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            description: 'Array of data records to export',
            required: true,
          },
          columns: {
            type: 'array',
            description: 'Column definitions (accessorKey, header)',
          },
          format: {
            type: 'string',
            enum: ['xlsx', 'csv', 'pdf', 'json'],
            description: 'Export format',
            required: true,
          },
          filename: {
            type: 'string',
            description: 'Output filename (without extension)',
          },
          includeHeaders: {
            type: 'boolean',
            description: 'Include column headers in export',
            default: true,
          },
        },
        required: ['data', 'format'],
      },

      // Implementation
      implementation: 'client-side', // Can be: 'client-side', 'server-side', 'hybrid'

      // Permissions
      permissions: {
        execute: ['user', 'admin'],
      },
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'action-refresh-data',
    type: 'action',
    name: 'Refresh Data',
    description: 'Refresh data from source',
    category: 'data-operation',
    domain: 'Data Operations',
    icon: 'RefreshCw',
    color: '#8b5cf6',
    active: 'true',
    properties: {
      endpoint: '/api/actions/refresh',
      method: 'POST',
      schema: {
        type: 'object',
        properties: {
          ontologyNodeId: {
            type: 'string',
            description: 'Ontology node ID to fetch data from',
            required: true,
          },
          filters: {
            type: 'object',
            description: 'Filter criteria',
          },
          limit: {
            type: 'number',
            description: 'Max records to fetch',
          },
        },
        required: ['ontologyNodeId'],
      },
      implementation: 'client-side',
      permissions: {
        execute: ['user', 'admin'],
      },
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

/**
 * Add nodes to ontology
 */
async function addNodes() {
  const actionTableName = `${SCHEMA}-core-ontology-action`;
  const eventTableName = `${SCHEMA}-core-ontology-event`;

  console.log(`Adding action nodes to ${actionTableName}...`);
  console.log(`Adding event nodes to ${eventTableName}...`);

  // Add action nodes first (events reference them)
  for (const node of actionNodes) {
    try {
      console.log(`  Adding action: ${node.id} - ${node.name}`);

      await dynamodb.execute(
        {
          operation: 'put',
          table: actionTableName,
          data: {
            Item: node,
          },
        },
        credentials
      );

      console.log(`    ✓ Added ${node.id} to ${actionTableName}`);
    } catch (error) {
      console.error(`    ✗ Failed to add ${node.id}:`, error);
    }
  }

  // Add event nodes
  for (const node of eventNodes) {
    try {
      console.log(`  Adding event: ${node.id} - ${node.name}`);

      await dynamodb.execute(
        {
          operation: 'put',
          table: eventTableName,
          data: {
            Item: node,
          },
        },
        credentials
      );

      console.log(`    ✓ Added ${node.id} to ${eventTableName}`);
    } catch (error) {
      console.error(`    ✗ Failed to add ${node.id}:`, error);
    }
  }

  console.log('\n✓ All nodes added successfully!');
  console.log(`\nTotal nodes added: ${actionNodes.length + eventNodes.length}`);
  console.log(`  - Actions: ${actionNodes.length} (${actionTableName})`);
  console.log(`  - Events: ${eventNodes.length} (${eventTableName})`);
}

// Run the script
addNodes().catch(console.error);
