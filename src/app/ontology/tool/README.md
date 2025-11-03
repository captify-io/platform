# AI SDK Tool Management

This tool management system allows you to create custom tools for AI agents that are compatible with the AI SDK. Tools can be simple single-step operations or complex multi-step workflows with user confirmation.

## Overview

Tools are stored in the `captify-core-Tool` DynamoDB table and are automatically loaded by agents during conversations. The tool-generator system ([core/src/lib/tool-generator.ts](../../../../../../../../core/src/lib/tool-generator.ts)) converts the tool definitions into AI SDK-compatible tool functions.

## Tool Types

### 1. Simple Tools
Single-step operations that execute immediately without user confirmation.

**Example: Search Knowledge Base**
```typescript
{
  name: "search_knowledge_base",
  description: "Search through a knowledge base using semantic search",
  implementation: "custom",
  multiStep: false,
  confirmationRequired: false,
  schema: {
    type: "object",
    properties: {
      query: { type: "string", description: "The search query" },
      spaceId: { type: "string", description: "Space ID to search" }
    },
    required: ["query"]
  }
}
```

### 2. Multi-Step Tools with Confirmation
Tools that require user review and confirmation before execution. This pattern is ideal for:
- Creating database records
- Uploading files
- Making changes that can't be undone
- Operations that require user validation

**Flow:**
1. AI calls tool with parameters (without `confirmed=true`)
2. Tool prepares data and returns preview
3. User reviews and confirms
4. AI calls tool again with **same parameters** + `confirmed=true`
5. Tool executes the operation

**Example: Create Change Request**
```typescript
{
  name: "create_change_request",
  description: "Create a new change request with confirmation flow",
  implementation: "dynamodb",
  table: "pmbook-ChangeRequest",
  multiStep: true,
  confirmationRequired: true,
  schema: {
    type: "object",
    properties: {
      title: { type: "string", description: "Request title" },
      description: { type: "string", description: "Detailed description" },
      priority: {
        type: "string",
        description: "Priority level",
        enum: ["Low", "Medium", "High", "Critical"]
      },
      confirmed: {
        type: "boolean",
        description: "Set to true to confirm creation"
      }
    },
    required: ["title", "description"]
  }
}
```

## Implementation Types

### DynamoDB (`dynamodb`)
Execute operations on DynamoDB tables.

**Required:** `table` field (without schema prefix)

**Example:**
```typescript
{
  implementation: "dynamodb",
  table: "pmbook-Contract"  // Will be prefixed with schema (captify-)
}
```

### S3 (`s3`)
Upload, download, or manage S3 objects.

**Required:** `bucket` field

**Example:**
```typescript
{
  implementation: "s3",
  bucket: "captify-spaces"
}
```

### Custom (`custom`)
Reference an existing service operation.

**Required:** `endpoint` field pointing to service.operation

**Example:**
```typescript
{
  implementation: "custom",
  endpoint: "space.searchSpace"
}
```

### Other Services
Available: `bedrock`, `kendra`, `glue`, `sagemaker`, `quicksight`, `cognito`, `aurora`

## Schema Definition

Schemas follow the AI SDK format (which is compatible with JSON Schema):

```typescript
{
  type: "object",
  properties: {
    propertyName: {
      type: "string" | "number" | "boolean" | "object" | "array",
      description: "What this parameter is for",
      enum?: ["Option1", "Option2"],  // For dropdowns
      items?: { type: "string" }      // For arrays
    }
  },
  required: ["propertyName"]
}
```

### Property Types

- **string**: Text input
- **number**: Numeric input
- **boolean**: True/false flag
- **object**: Nested object with properties
- **array**: List of items

### Special Parameter: `confirmed`

For multi-step tools, add a `confirmed` boolean parameter:

```typescript
confirmed: {
  type: "boolean",
  description: "Set to true after user confirms. The AI should only set this after explicit user confirmation."
}
```

## How Multi-Step Tools Work

### 1. Tool Definition
```typescript
{
  id: "tool-create-capability",
  name: "create_capability",
  description: "Create a capability with confirmation",
  multiStep: true,
  confirmationRequired: true,
  schema: {
    properties: {
      name: { type: "string", description: "Capability name" },
      description: { type: "string", description: "Description" },
      confirmed: { type: "boolean", description: "Confirm creation" }
    },
    required: ["name", "description"]
  }
}
```

### 2. First Call (Preparation)
**User says:** "Create a capability called Data Analytics"

**AI calls tool:**
```json
{
  "name": "Data Analytics",
  "description": "Advanced analytics capabilities",
  "confirmed": false  // or omitted
}
```

**Tool returns:**
```json
{
  "success": true,
  "requiresConfirmation": true,
  "message": "I've prepared the following capability...",
  "pendingData": { /* prepared data */ },
  "confirmationParams": {
    "name": "Data Analytics",
    "description": "Advanced analytics capabilities",
    "confirmed": true
  }
}
```

### 3. User Confirmation
**User says:** "Yes, create it"

**AI calls tool again:**
```json
{
  "name": "Data Analytics",
  "description": "Advanced analytics capabilities",
  "confirmed": true  // Now set to true
}
```

**Tool executes:**
```json
{
  "success": true,
  "message": "✅ Capability created successfully",
  "id": "cap-12345",
  "data": { /* created record */ }
}
```

## Tool Generator Implementation

The tool generator ([core/src/lib/tool-generator.ts](../../../../../../../../core/src/lib/tool-generator.ts)) handles the confirmation flow:

```typescript
function generateCustomTool(toolRecord, credentials) {
  return tool({
    description: toolRecord.description,
    inputSchema: dynamoSchemaToZod(toolRecord.schema),
    execute: async (params) => {
      const { confirmed, ...itemParams } = params;

      if (confirmed === true) {
        // Execute: Create the record
        const response = await dynamodb.execute({
          operation: 'put',
          table: toolRecord.table,
          data: { Item: itemData }
        }, credentials);

        return {
          success: true,
          message: "✅ Created successfully",
          id: itemData.id
        };
      } else {
        // Prepare: Show preview and ask for confirmation
        return {
          success: true,
          requiresConfirmation: true,
          message: "Review this data. Confirm to create.",
          pendingData: itemData,
          confirmationParams: { ...itemParams, confirmed: true }
        };
      }
    }
  });
}
```

## Best Practices

### 1. Clear Descriptions
Write descriptions that help the AI understand **when** to use the tool:

```typescript
// ❌ Bad
description: "Creates a change request"

// ✅ Good
description: "Create a new change request in the system. Use this when the user wants to submit a request for infrastructure, software, or process changes. This tool requires user confirmation before creating the record."
```

### 2. Descriptive Parameters
Each parameter should clearly explain what it's for:

```typescript
priority: {
  type: "string",
  description: "Priority level: Low for routine changes, Medium for standard changes, High for urgent changes, Critical for emergency changes",
  enum: ["Low", "Medium", "High", "Critical"]
}
```

### 3. Use Enums for Fixed Options
Constrain inputs with enum values:

```typescript
status: {
  type: "string",
  enum: ["active", "pending", "expired", "terminated"]
}
```

### 4. Multi-Step for Side Effects
Always use confirmation for:
- Creating database records
- Uploading files
- Deleting data
- Making API calls to external systems
- Anything that can't be undone

### 5. Test Confirmation Flow
Before deploying a multi-step tool:
1. Call without `confirmed` - verify preview is shown
2. User confirms
3. Call with `confirmed=true` - verify execution works
4. Check database/storage for created records

## Available Services

All tools can integrate with these services:

| Service | Implementation | Use Case |
|---------|---------------|----------|
| **dynamodb** | CRUD operations | Database records |
| **s3** | Object storage | File uploads/downloads |
| **bedrock** | AI models | LLM interactions |
| **kendra** | Search | Document search |
| **glue** | ETL | Data transformations |
| **sagemaker** | ML models | Predictions |
| **quicksight** | Analytics | Dashboard queries |
| **cognito** | Auth | User management |
| **aurora** | SQL database | Relational queries |
| **space** | Knowledge base | Semantic search |
| **agent** | AI agents | Thread management |
| **provider** | LLM providers | Model selection |

## Example Tools

### Simple Query Tool
```typescript
{
  name: "query_contracts",
  implementation: "dynamodb",
  table: "pmbook-Contract",
  multiStep: false,
  schema: {
    properties: {
      status: { type: "string", enum: ["active", "pending", "expired"] },
      limit: { type: "number", description: "Max results" }
    }
  }
}
```

### Multi-Step Creation Tool
```typescript
{
  name: "create_change_request",
  implementation: "dynamodb",
  table: "pmbook-ChangeRequest",
  multiStep: true,
  confirmationRequired: true,
  schema: {
    properties: {
      title: { type: "string", description: "Request title" },
      description: { type: "string", description: "Details" },
      confirmed: { type: "boolean", description: "Confirm creation" }
    },
    required: ["title", "description"]
  }
}
```

### File Upload Tool
```typescript
{
  name: "upload_document",
  implementation: "s3",
  bucket: "captify-spaces",
  multiStep: true,
  confirmationRequired: true,
  schema: {
    properties: {
      fileName: { type: "string", description: "File name" },
      fileContent: { type: "string", description: "Base64 content" },
      spaceId: { type: "string", description: "Target space" },
      confirmed: { type: "boolean", description: "Confirm upload" }
    },
    required: ["fileName", "fileContent", "spaceId"]
  }
}
```

## Troubleshooting

### Tool Not Available to Agent
1. Check tool exists in `core-Tool` table
2. Verify `custom` service is enabled in agent settings
3. Check tool name matches AI SDK format (snake_case)

### Confirmation Not Working
1. Ensure `confirmationRequired: true`
2. Verify `confirmed` parameter in schema
3. Check AI is calling with same parameters + `confirmed=true`

### Execution Errors
1. Check credentials are passed to tool generator
2. Verify table/bucket names are correct
3. Check schema matches expected data structure
4. Review logs in `/tmp/agent-debug.log`

## Architecture

```
┌─────────────────────────────────────────────────────┐
│ User: "Create a change request for server upgrade" │
└───────────────────┬─────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────┐
│ AI Agent (using AI SDK)                             │
│ - Selects create_change_request tool                │
│ - Calls with: {title, description, priority}        │
└───────────────────┬─────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────┐
│ Tool Generator (tool-generator.ts)                  │
│ - Loads tool definition from core-Tool              │
│ - Checks confirmed parameter                        │
│ - confirmed=false → Return preview                  │
└───────────────────┬─────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────┐
│ AI: "I've prepared this request. Confirm?"          │
└───────────────────┬─────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────┐
│ User: "Yes, create it"                              │
└───────────────────┬─────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────┐
│ AI Agent                                            │
│ - Calls SAME tool with confirmed=true               │
└───────────────────┬─────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────┐
│ Tool Generator                                      │
│ - confirmed=true → Execute                          │
│ - Calls DynamoDB service                            │
│ - Creates record in pmbook-ChangeRequest            │
└───────────────────┬─────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────┐
│ AI: "✅ Created change request CR-12345"            │
└─────────────────────────────────────────────────────┘
```

## Next Steps

1. Create your first tool using the UI at [/core/designer/tool](page.tsx)
2. Test it with an agent conversation
3. Review the tool-generator code for advanced customization
4. Check example tools in the database for patterns
5. Read the [agent.spec.md](../agent/builder/agent.spec.md) for agent integration

## Related Files

- **UI:** [page.tsx](page.tsx) - Tool management interface
- **Generator:** [core/src/lib/tool-generator.ts](../../../../../../../../core/src/lib/tool-generator.ts) - Tool execution
- **Types:** [core/src/types/core.ts](../../../../../../../../core/src/types/core.ts) - Tool type definition
- **Seeder:** [scripts/seed-example-tools.ts](../../../../../scripts/seed-example-tools.ts) - Example tools
