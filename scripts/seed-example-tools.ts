/**
 * Seed example tools to core-Tool table
 * This demonstrates different tool patterns including multi-step confirmation
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const docClient = DynamoDBDocumentClient.from(client);
const schema = process.env.SCHEMA || 'captify';

const exampleTools = [
  {
    id: 'tool-create-change-request',
    name: 'create_change_request',
    description: `Create a new change request in the system. This is a MULTI-STEP tool with confirmation flow:

1. First call (without confirmed=true): AI prepares the change request and shows user what will be created
2. User reviews and says "yes", "confirm", or "create it"
3. AI calls this tool again with the SAME parameters PLUS confirmed=true to actually create the record

The AI must preserve all parameters from the first call when making the confirmation call.`,
    schema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'The title of the change request',
        },
        description: {
          type: 'string',
          description: 'Detailed description of the change request',
        },
        priority: {
          type: 'string',
          description: 'Priority level: Low, Medium, High, or Critical',
          enum: ['Low', 'Medium', 'High', 'Critical'],
        },
        category: {
          type: 'string',
          description: 'Category: Infrastructure, Software, Process, Security, or Other',
          enum: ['Infrastructure', 'Software', 'Process', 'Security', 'Other'],
        },
        confirmed: {
          type: 'boolean',
          description: 'CONFIRMATION FLAG: Set to true only after user explicitly confirms. Leave false or omit for initial preparation.',
        },
      },
      required: ['title', 'description'],
    },
    implementation: 'dynamodb',
    table: 'pmbook-ChangeRequest',
    multiStep: true,
    confirmationRequired: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tool-search-knowledge-base',
    name: 'search_knowledge_base',
    description: 'Search through a knowledge base Space using semantic search. Returns relevant documents and passages that match the query.',
    schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The search query text',
        },
        spaceId: {
          type: 'string',
          description: 'The Space ID to search in (optional - defaults to current conversation space)',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results to return (default: 5)',
        },
      },
      required: ['query'],
    },
    implementation: 'custom',
    endpoint: 'space.searchSpace',
    multiStep: false,
    confirmationRequired: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tool-create-capability',
    name: 'create_capability',
    description: `Create a new capability definition in the strategic roadmap. This tool uses confirmation flow:

When confirmed is false/not provided:
- Validates the capability data
- Shows the user what will be created
- Asks for confirmation

When user confirms and confirmed=true:
- Creates the capability record in DynamoDB
- Links to outcomes if provided
- Returns the created capability ID`,
    schema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Name of the capability',
        },
        description: {
          type: 'string',
          description: 'Detailed description of what this capability enables',
        },
        domain: {
          type: 'string',
          description: 'Domain: People, Process, Technology, or Data',
          enum: ['People', 'Process', 'Technology', 'Data'],
        },
        maturity: {
          type: 'string',
          description: 'Current maturity level',
          enum: ['Initial', 'Developing', 'Defined', 'Managed', 'Optimizing'],
        },
        priority: {
          type: 'string',
          description: 'Strategic priority',
          enum: ['Low', 'Medium', 'High', 'Critical'],
        },
        linkedOutcomes: {
          type: 'array',
          description: 'Array of outcome IDs this capability supports',
          items: { type: 'string' },
        },
        confirmed: {
          type: 'boolean',
          description: 'Set to true after user confirms creation',
        },
      },
      required: ['name', 'description', 'domain'],
    },
    implementation: 'dynamodb',
    table: 'core-Capability',
    multiStep: true,
    confirmationRequired: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tool-query-contracts',
    name: 'query_contracts',
    description: 'Query contract records from the database. Use this to search for contracts by various criteria like status, vendor, date range, etc.',
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          description: 'Filter by contract status',
          enum: ['active', 'pending', 'expired', 'terminated'],
        },
        vendor: {
          type: 'string',
          description: 'Filter by vendor name (partial match)',
        },
        startDateAfter: {
          type: 'string',
          description: 'Filter contracts starting after this date (ISO format)',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results (default: 20)',
        },
      },
      required: [],
    },
    implementation: 'dynamodb',
    table: 'pmbook-Contract',
    multiStep: false,
    confirmationRequired: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tool-upload-document',
    name: 'upload_document',
    description: `Upload a document to a Space for indexing. Multi-step process:

1. First call: Prepare the upload, validate parameters, get presigned URL
2. User confirms: Actually perform the upload and trigger indexing

This ensures the user knows what will be uploaded before it happens.`,
    schema: {
      type: 'object',
      properties: {
        spaceId: {
          type: 'string',
          description: 'The Space ID to upload to',
        },
        fileName: {
          type: 'string',
          description: 'Name of the file to upload',
        },
        fileContent: {
          type: 'string',
          description: 'Base64 encoded file content or file path',
        },
        metadata: {
          type: 'object',
          description: 'Additional metadata about the document',
          properties: {
            author: { type: 'string' },
            tags: { type: 'array', items: { type: 'string' } },
            category: { type: 'string' },
          },
        },
        confirmed: {
          type: 'boolean',
          description: 'Set to true to confirm and perform the upload',
        },
      },
      required: ['spaceId', 'fileName', 'fileContent'],
    },
    implementation: 's3',
    bucket: 'captify-spaces',
    multiStep: true,
    confirmationRequired: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

async function seedTools() {
  console.log('🌱 Seeding example tools...\n');

  for (const tool of exampleTools) {
    try {
      console.log(`Creating tool: ${tool.name}`);
      console.log(`  - Multi-step: ${tool.multiStep ? 'Yes' : 'No'}`);
      console.log(`  - Confirmation: ${tool.confirmationRequired ? 'Required' : 'Not required'}`);

      await docClient.send(
        new PutCommand({
          TableName: `${schema}-core-Tool`,
          Item: tool,
        })
      );

      console.log(`  ✅ Created successfully\n`);
    } catch (error) {
      console.error(`  ❌ Failed to create ${tool.name}:`, error);
      console.log('');
    }
  }

  console.log('✨ Seeding complete!\n');
  console.log('📚 Example Tools Created:');
  console.log('  1. create_change_request - Multi-step with confirmation');
  console.log('  2. search_knowledge_base - Simple search tool');
  console.log('  3. create_capability - Multi-step strategic planning');
  console.log('  4. query_contracts - Database query tool');
  console.log('  5. upload_document - Multi-step document upload\n');
}

seedTools().catch(console.error);
