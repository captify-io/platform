/**
 * Add Widget Types to Ontology
 *
 * This script adds all widget types to the captify-core-ontology-node table
 * and links them to the core app.
 *
 * Run with: npx tsx platform/src/app/admin/ontology/setup/add-widgets.ts
 */

import { dynamodb } from '@captify-io/core/services/aws';
import type { AwsCredentials } from '@captify-io/core/types';

// AWS credentials (from environment or IAM role)
const credentials: AwsCredentials = {
  region: process.env.AWS_REGION || 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
};

const SCHEMA = process.env.SCHEMA || 'captify';

/**
 * Widget type definitions
 */
const widgetTypes = [
  // Display widgets - Data
  {
    id: 'core-widget-table',
    type: 'widget',
    name: 'Data Table',
    description: 'Display data in sortable, filterable table with row actions',
    widgetType: 'table',
    category: 'display',
    domain: 'Data Visualization',
    icon: 'Table',
    color: '#3b82f6',
    properties: {
      schema: {
        type: 'object',
        properties: {
          columns: {
            type: 'array',
            description: 'Table columns configuration',
            required: true,
          },
          sortable: { type: 'boolean', description: 'Enable column sorting' },
          filterable: { type: 'boolean', description: 'Enable column filtering' },
          pagination: { type: 'boolean', description: 'Enable pagination' },
          pageSize: { type: 'number', description: 'Rows per page' },
          rowActions: { type: 'array', description: 'Actions available for each row' },
        },
      },
    },
  },
  {
    id: 'core-widget-pivot-table',
    type: 'widget',
    name: 'Pivot Table',
    description: 'Dynamic grouping and aggregation of data in tabular form',
    widgetType: 'pivot-table',
    category: 'display',
    domain: 'Data Visualization',
    icon: 'Table2',
    color: '#8b5cf6',
  },
  {
    id: 'core-widget-resource-list',
    type: 'widget',
    name: 'Resource List',
    description: 'Display list of Foundry resources with filtering',
    widgetType: 'resource-list',
    category: 'display',
    domain: 'Data Visualization',
    icon: 'List',
    color: '#10b981',
  },

  // Display widgets - Charts
  {
    id: 'core-widget-chart-xy',
    type: 'widget',
    name: 'XY Chart',
    description: 'Bar, line, area, or scatter chart with multiple series support',
    widgetType: 'chart-xy',
    category: 'display',
    domain: 'Charts',
    icon: 'BarChart3',
    color: '#f59e0b',
    properties: {
      schema: {
        type: 'object',
        properties: {
          chartType: {
            type: 'string',
            enum: ['bar', 'line', 'area', 'scatter'],
            description: 'Type of chart to display',
            required: true,
          },
          xAxis: { type: 'string', description: 'Field for X axis', required: true },
          yAxis: { type: 'string', description: 'Field(s) for Y axis (can be array)', required: true },
          xAxisLabel: { type: 'string', description: 'Label for X axis' },
          yAxisLabel: { type: 'string', description: 'Label for Y axis' },
          showLegend: { type: 'boolean', description: 'Show legend' },
          showGrid: { type: 'boolean', description: 'Show grid lines' },
          colors: { type: 'array', description: 'Custom colors for series' },
        },
      },
    },
  },
  {
    id: 'core-widget-chart-pie',
    type: 'widget',
    name: 'Pie Chart',
    description: 'Pie or donut chart for proportional data',
    widgetType: 'chart-pie',
    category: 'display',
    domain: 'Charts',
    icon: 'PieChart',
    color: '#ec4899',
  },
  {
    id: 'core-widget-chart-vega',
    type: 'widget',
    name: 'Vega Chart',
    description: 'Advanced charts using Vega-Lite grammar',
    widgetType: 'chart-vega',
    category: 'display',
    domain: 'Charts',
    icon: 'LineChart',
    color: '#6366f1',
  },
  {
    id: 'core-widget-chart-waterfall',
    type: 'widget',
    name: 'Waterfall Chart',
    description: 'Waterfall chart for cumulative effect visualization',
    widgetType: 'chart-waterfall',
    category: 'display',
    domain: 'Charts',
    icon: 'TrendingUp',
    color: '#14b8a6',
  },

  // Display widgets - Spatial/Temporal
  {
    id: 'core-widget-map',
    type: 'widget',
    name: 'Map',
    description: 'Interactive geospatial map visualization',
    widgetType: 'map',
    category: 'display',
    domain: 'Spatial',
    icon: 'Map',
    color: '#22c55e',
  },
  {
    id: 'core-widget-gantt',
    type: 'widget',
    name: 'Gantt Chart',
    description: 'Timeline view with task dependencies',
    widgetType: 'gantt',
    category: 'display',
    domain: 'Temporal',
    icon: 'Calendar',
    color: '#f97316',
  },
  {
    id: 'core-widget-timeline',
    type: 'widget',
    name: 'Timeline',
    description: 'Event timeline visualization',
    widgetType: 'timeline',
    category: 'display',
    domain: 'Temporal',
    icon: 'Clock',
    color: '#06b6d4',
  },

  // Display widgets - Content
  {
    id: 'core-widget-card',
    type: 'widget',
    name: 'Card',
    description: 'Display information in card format',
    widgetType: 'card',
    category: 'display',
    domain: 'Content',
    icon: 'CreditCard',
    color: '#3b82f6',
  },
  {
    id: 'core-widget-metric-card',
    type: 'widget',
    name: 'Metric Card',
    description: 'Highlight key metrics with trends',
    widgetType: 'metric-card',
    category: 'display',
    domain: 'Content',
    icon: 'Activity',
    color: '#8b5cf6',
  },
  {
    id: 'core-widget-markdown',
    type: 'widget',
    name: 'Markdown',
    description: 'Render formatted markdown text',
    widgetType: 'markdown',
    category: 'display',
    domain: 'Content',
    icon: 'FileText',
    color: '#64748b',
  },
  {
    id: 'core-widget-message',
    type: 'widget',
    name: 'Message',
    description: 'Display informational messages',
    widgetType: 'message',
    category: 'display',
    domain: 'Content',
    icon: 'MessageSquare',
    color: '#3b82f6',
  },

  // Capture widgets
  {
    id: 'core-widget-text',
    type: 'widget',
    name: 'Text Input',
    description: 'Capture text input from user',
    widgetType: 'text',
    category: 'capture',
    domain: 'Input',
    icon: 'Type',
    color: '#6366f1',
  },
  {
    id: 'core-widget-select',
    type: 'widget',
    name: 'Select',
    description: 'Select from dropdown options',
    widgetType: 'select',
    category: 'capture',
    domain: 'Input',
    icon: 'ChevronDown',
    color: '#8b5cf6',
  },
  {
    id: 'core-widget-date',
    type: 'widget',
    name: 'Date Picker',
    description: 'Select date or date range',
    widgetType: 'date',
    category: 'capture',
    domain: 'Input',
    icon: 'Calendar',
    color: '#ec4899',
  },
  {
    id: 'core-widget-file',
    type: 'widget',
    name: 'File Upload',
    description: 'Upload files',
    widgetType: 'file',
    category: 'capture',
    domain: 'Input',
    icon: 'Upload',
    color: '#f59e0b',
  },
  {
    id: 'core-widget-form',
    type: 'widget',
    name: 'Form',
    description: 'Multi-field form with validation',
    widgetType: 'form',
    category: 'capture',
    domain: 'Input',
    icon: 'FileEdit',
    color: '#10b981',
  },

  // Navigation widgets
  {
    id: 'core-widget-button-group',
    type: 'widget',
    name: 'Button Group',
    description: 'Group of action buttons',
    widgetType: 'button-group',
    category: 'navigation',
    domain: 'Actions',
    icon: 'MousePointerClick',
    color: '#3b82f6',
  },
  {
    id: 'core-widget-tabs',
    type: 'widget',
    name: 'Tabs',
    description: 'Tabbed navigation between views',
    widgetType: 'tabs',
    category: 'navigation',
    domain: 'Navigation',
    icon: 'Tabs',
    color: '#8b5cf6',
  },
];

async function addWidgetsToOntology() {
  console.log('🚀 Adding widget types to ontology...\n');

  const tableName = `${SCHEMA}-core-ontology-node`;
  const timestamp = new Date().toISOString();

  for (const widget of widgetTypes) {
    const item = {
      ...widget,
      app: 'core',
      schema: SCHEMA,
      tenantId: 'default',
      slug: widget.id,
      active: 'true',
      createdAt: timestamp,
      createdBy: 'system',
      updatedAt: timestamp,
      updatedBy: 'system',
      ownerId: 'system',
      order: '0',
      fields: {},
    };

    try {
      await dynamodb.put(
        tableName,
        item,
        credentials
      );
      console.log(`✅ Added ${widget.name} (${widget.widgetType})`);
    } catch (error) {
      console.error(`❌ Failed to add ${widget.name}:`, error);
    }
  }

  console.log(`\n✨ Successfully added ${widgetTypes.length} widget types to ontology!`);
  console.log(`\n📊 Summary:`);
  console.log(`   - Display widgets: ${widgetTypes.filter(w => w.category === 'display').length}`);
  console.log(`   - Capture widgets: ${widgetTypes.filter(w => w.category === 'capture').length}`);
  console.log(`   - Navigation widgets: ${widgetTypes.filter(w => w.category === 'navigation').length}`);
}

// Run if called directly
if (require.main === module) {
  addWidgetsToOntology()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { addWidgetsToOntology };
