# Feature: AI SDK Tool Standardization

## Overview

Standardize all ontology tools for AI SDK 6 with Zod schema validation, enabling GenAI agents to discover, validate, and execute operations across the enterprise knowledge graph with full type safety and runtime validation.

### Current State

- 10 generic ontology tools exist in `core/src/services/ontology/tools/generic-tools.ts`
- Tools use JSON Schema format (OpenAI function calling format)
- Tool execution is generic but lacks AI SDK integration
- No Zod validation for runtime type safety
- Missing AWS service-specific tools (Glue, Athena, time-series)
- Widget rendering tools are separate from ontology tools

### Target State

- All tools converted to AI SDK 6 format with Zod schemas
- Tool registry integration with caching and analytics
- 25+ total tools:
  - 10 generic ontology tools (introspection, CRUD, relationships, analytics)
  - 10+ AWS service tools (DynamoDB, S3, Glue, Athena, CloudWatch, QuickSight)
  - 5+ widget rendering tools (tables, charts, cards, graphs)
- Runtime validation with descriptive error messages
- Tool discovery via introspection
- Execution analytics and performance monitoring

## Requirements

### Functional Requirements

**FR1: Generic Ontology Tools (10 tools)**
- FR1.1: `ontology_types` - List all available entity types with filtering by category/domain
- FR1.2: `ontology_type` - Get detailed schema for a specific entity type
- FR1.3: `query` - Universal query with dynamic filters validated against schema
- FR1.4: `get` - Fetch single entity by ID
- FR1.5: `create` - Create new entity with schema validation
- FR1.6: `update` - Update entity with partial update support
- FR1.7: `delete` - Delete entity with cascade rules
- FR1.8: `traverse` - Navigate relationships (1-5 hops)
- FR1.9: `aggregate` - Compute aggregations (count, sum, avg, min, max)
- FR1.10: `analyze_impact` - Preview impact of changes before execution

**FR2: AWS Service Tools (10+ tools)**
- FR2.1: DynamoDB tools: `dynamodb_scan`, `dynamodb_query`, `dynamodb_batch_get`
- FR2.2: S3 tools: `s3_list`, `s3_get`, `s3_search`
- FR2.3: Glue tools: `glue_get_databases`, `glue_get_tables`, `glue_get_table_schema`
- FR2.4: Athena tools: `athena_query`, `athena_get_query_results`
- FR2.5: CloudWatch tools: `cloudwatch_get_metrics`, `cloudwatch_get_time_series`
- FR2.6: QuickSight tools: `quicksight_list_dashboards`, `quicksight_get_dashboard`
- FR2.7: Kendra tools: `kendra_search`, `kendra_semantic_search`

**FR3: Widget Rendering Tools (5+ tools)**
- FR3.1: `display_table` - Render tabular data with sorting and filtering
- FR3.2: `display_chart` - Render charts (line, bar, pie, scatter)
- FR3.3: `display_card` - Render metric cards with icons
- FR3.4: `display_graph` - Render ontology subgraphs with xyflow
- FR3.5: `display_timeline` - Render temporal data on timeline

**FR4: Tool Discovery**
- FR4.1: Tool introspection endpoint listing all available tools
- FR4.2: Tool metadata includes category, tags, permissions, dependencies
- FR4.3: Search tools by name, category, or tag
- FR4.4: Get tool usage statistics and examples

**FR5: Validation and Error Handling**
- FR5.1: Zod schema validation for all tool parameters
- FR5.2: Descriptive validation error messages
- FR5.3: Schema mismatch detection (parameter vs ontology schema)
- FR5.4: Type coercion for common formats (dates, numbers)

### Non-Functional Requirements

**NFR1: Performance**
- Tool execution: < 2 seconds average
- Schema validation: < 50ms
- Tool discovery: < 500ms
- Cache hit rate: > 80%

**NFR2: Reliability**
- Tool success rate: > 99%
- Graceful degradation when cache unavailable
- Automatic retry with exponential backoff
- Circuit breaker for failing tools

**NFR3: Observability**
- Trace all tool executions with OpenTelemetry
- Log tool parameters and results (with PII masking)
- Track tool usage metrics (count, duration, errors)
- Alert on tool failures or performance degradation

**NFR4: Security**
- Permission checks before tool execution
- Rate limiting per user/agent
- Audit log for destructive operations (delete, update)
- Parameter sanitization to prevent injection attacks

**NFR5: Maintainability**
- Consistent tool naming convention: `{category}_{operation}`
- Shared Zod schema definitions
- Tool registration in centralized registry
- Automated testing for all tools

## Architecture

### Tool Definition Structure

```typescript
import { z } from 'zod';
import { tool } from 'ai';

// Example: Generic Query Tool
export const queryTool = tool({
  description: 'Universal query tool - works for ANY entity type. Dynamically validates filters against entity schema.',
  parameters: z.object({
    typeName: z.string()
      .describe('Entity type to query (e.g., "contract", "user", "task")'),

    filters: z.record(z.any())
      .optional()
      .describe('Dynamic filters based on entity schema. Examples: { status: "active" }, { totalValue_gte: 1000 }'),

    select: z.array(z.string())
      .optional()
      .describe('Fields to return (default: all fields)'),

    limit: z.number()
      .min(1)
      .max(100)
      .default(20)
      .describe('Maximum results to return'),

    offset: z.number()
      .min(0)
      .default(0)
      .describe('Number of results to skip (for pagination)'),

    orderBy: z.object({
      field: z.string(),
      direction: z.enum(['asc', 'desc'])
    })
      .optional()
      .describe('Sort order')
  }),

  execute: async ({ typeName, filters, select, limit, offset, orderBy }) => {
    // 1. Get entity schema from ontology
    const schema = await getEntitySchema(typeName);

    // 2. Validate filters against schema
    validateFilters(filters, schema);

    // 3. Execute query
    const results = await executeQuery({
      typeName,
      filters,
      select,
      limit,
      offset,
      orderBy
    });

    // 4. Return results
    return {
      data: results,
      count: results.length,
      hasMore: results.length === limit
    };
  }
});
```

### Tool Registry Integration

```typescript
// core/src/services/agent/tools/ontology-tools.ts
import { toolRegistry } from './registry';

// Register all ontology tools
export function registerOntologyTools() {
  // Generic tools
  toolRegistry.register({
    id: 'ontology_query',
    name: 'query',
    category: 'ontology',
    tags: ['query', 'read', 'filter'],
    tool: queryTool,
    permissions: ['ontology:read'],
    cacheable: true,
    cacheTTL: 300000, // 5 minutes
  });

  toolRegistry.register({
    id: 'ontology_create',
    name: 'create',
    category: 'ontology',
    tags: ['create', 'write'],
    tool: createTool,
    permissions: ['ontology:write'],
    cacheable: false,
    requiresApproval: false,
  });

  // ... register all 10 generic tools
}

// Register AWS service tools
export function registerAWSTools() {
  toolRegistry.register({
    id: 'glue_get_tables',
    name: 'glue_get_tables',
    category: 'aws',
    subcategory: 'glue',
    tags: ['glue', 'catalog', 'tables'],
    tool: glueGetTablesTool,
    permissions: ['aws:glue:read'],
    cacheable: true,
    cacheTTL: 600000, // 10 minutes
  });

  // ... register all AWS tools
}

// Register widget tools
export function registerWidgetTools() {
  toolRegistry.register({
    id: 'display_table',
    name: 'display_table',
    category: 'widget',
    tags: ['widget', 'table', 'ui'],
    tool: displayTableTool,
    permissions: ['widget:render'],
    cacheable: false,
    returnsUI: true,
  });

  // ... register all widget tools
}
```

### Tool Execution Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     GenAI Agent                              │
│  (Bedrock Agent or AI SDK LLM)                              │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ 1. Call tool with parameters
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                  Tool Execution Engine                       │
│  - Permission check                                          │
│  - Parameter validation (Zod)                                │
│  - Check cache                                               │
│  - Execute tool                                              │
│  - Log execution                                             │
│  - Update analytics                                          │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ 2. Dispatch to category handler
                         ↓
         ┌───────────────┴───────────────┐
         │                               │
         ↓                               ↓
┌──────────────────┐          ┌──────────────────┐
│  Ontology Tools  │          │   AWS Tools      │
│  - Introspection │          │   - DynamoDB     │
│  - CRUD          │          │   - S3           │
│  - Relationships │          │   - Glue         │
│  - Aggregation   │          │   - Athena       │
└────────┬─────────┘          │   - CloudWatch   │
         │                    │   - QuickSight   │
         │                    └────────┬─────────┘
         │                             │
         │ 3. Execute operation        │
         ↓                             ↓
┌─────────────────────────────────────────────────────────────┐
│                    Data Layer                                │
│  - Ontology Service (DynamoDB)                              │
│  - AWS Services (via SDK)                                   │
│  - Cache Layer (Redis/Memory)                               │
└─────────────────────────────────────────────────────────────┘
```

## Data Model

### Tool Metadata

```typescript
interface ToolMetadata {
  id: string;                    // Unique tool ID: "{category}_{operation}"
  name: string;                  // Tool name (used in AI SDK)
  category: string;              // "ontology" | "aws" | "widget"
  subcategory?: string;          // For AWS: "dynamodb" | "glue" | "athena" | etc.
  description: string;           // Human-readable description
  tags: string[];                // Searchable tags

  // AI SDK tool definition
  tool: ReturnType<typeof tool>; // AI SDK tool with Zod schema

  // Permissions and security
  permissions: string[];         // Required permissions
  requiresApproval?: boolean;    // Requires user confirmation

  // Caching
  cacheable: boolean;            // Can results be cached?
  cacheTTL?: number;             // Cache TTL in milliseconds
  cacheKey?: (params: any) => string; // Custom cache key generator

  // Dependencies
  dependsOn?: string[];          // Tool IDs this tool depends on

  // UI behavior
  returnsUI?: boolean;           // Returns widget/UI element
  streamable?: boolean;          // Supports streaming responses

  // Analytics
  executionCount?: number;       // Total executions
  avgDuration?: number;          // Average execution time (ms)
  errorRate?: number;            // Error rate (0-1)
  lastExecuted?: Date;           // Last execution timestamp
}
```

### Zod Schema Patterns

```typescript
// Common schema definitions
const EntityTypeSchema = z.string()
  .describe('Entity type (e.g., "contract", "user", "task")');

const EntityIDSchema = z.string()
  .describe('Entity ID');

const FiltersSchema = z.record(z.any())
  .describe('Dynamic filters based on entity schema');

const SelectFieldsSchema = z.array(z.string())
  .describe('Fields to return');

const PaginationSchema = z.object({
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0)
});

// AWS-specific schemas
const TableNameSchema = z.string()
  .describe('DynamoDB table name (short format: app-type)');

const S3BucketSchema = z.string()
  .describe('S3 bucket name');

const GlueDatabaseSchema = z.string()
  .describe('Glue database name');

const AthenaQuerySchema = z.string()
  .describe('Athena SQL query');

const CloudWatchMetricSchema = z.object({
  namespace: z.string(),
  metricName: z.string(),
  dimensions: z.array(z.object({
    name: z.string(),
    value: z.string()
  })).optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  period: z.number().min(60)
});
```

## API Actions

### Core Tool Functions

```typescript
// core/src/services/agent/tools/ontology-tools.ts

/**
 * Get all registered ontology tools for AI SDK
 */
export function getOntologyTools(): Array<ReturnType<typeof tool>> {
  return [
    ontologyTypesTool,
    ontologyTypeTool,
    queryTool,
    getTool,
    createTool,
    updateTool,
    deleteTool,
    traverseTool,
    aggregateTool,
    analyzeImpactTool
  ];
}

/**
 * Get all AWS service tools
 */
export function getAWSTools(): Array<ReturnType<typeof tool>> {
  return [
    dynamodbScanTool,
    dynamodbQueryTool,
    dynamodbBatchGetTool,
    s3ListTool,
    s3GetTool,
    glueGetDatabasesTool,
    glueGetTablesTool,
    glueGetTableSchemaTool,
    athenaQueryTool,
    athenaGetQueryResultsTool,
    cloudwatchGetMetricsTool,
    cloudwatchGetTimeSeriesTool,
    quicksightListDashboardsTool,
    kendraSearchTool
  ];
}

/**
 * Get all widget rendering tools
 */
export function getWidgetTools(): Array<ReturnType<typeof tool>> {
  return [
    displayTableTool,
    displayChartTool,
    displayCardTool,
    displayGraphTool,
    displayTimelineTool
  ];
}

/**
 * Get all tools (convenience function)
 */
export function getAllTools(): Array<ReturnType<typeof tool>> {
  return [
    ...getOntologyTools(),
    ...getAWSTools(),
    ...getWidgetTools()
  ];
}

/**
 * Register all tools in the tool registry
 */
export function registerAllTools(): void {
  registerOntologyTools();
  registerAWSTools();
  registerWidgetTools();
}
```

### Tool Execution API

```typescript
// core/src/services/agent/tools/execution-engine.ts

/**
 * Execute a tool with validation, caching, and analytics
 */
export async function executeTool(
  toolId: string,
  parameters: any,
  context: {
    userId: string;
    credentials: AwsCredentials;
    permissions: string[];
  }
): Promise<ExecutionResult> {
  const startTime = Date.now();

  try {
    // 1. Get tool from registry
    const toolMetadata = toolRegistry.get(toolId);
    if (!toolMetadata) {
      throw new Error(`Tool not found: ${toolId}`);
    }

    // 2. Check permissions
    const hasPermission = context.permissions.some(p =>
      toolMetadata.permissions.includes(p)
    );
    if (!hasPermission) {
      throw new Error(`Permission denied for tool: ${toolId}`);
    }

    // 3. Validate parameters with Zod
    const validationResult = toolMetadata.tool.parameters.safeParse(parameters);
    if (!validationResult.success) {
      throw new Error(`Validation failed: ${validationResult.error.message}`);
    }

    // 4. Check cache
    if (toolMetadata.cacheable) {
      const cacheKey = toolMetadata.cacheKey
        ? toolMetadata.cacheKey(parameters)
        : `${toolId}:${JSON.stringify(parameters)}`;

      const cached = await toolCache.get(cacheKey);
      if (cached) {
        return {
          success: true,
          data: cached,
          cached: true,
          duration: Date.now() - startTime
        };
      }
    }

    // 5. Execute tool
    const result = await toolMetadata.tool.execute(
      validationResult.data,
      context
    );

    // 6. Cache result
    if (toolMetadata.cacheable && toolMetadata.cacheTTL) {
      const cacheKey = toolMetadata.cacheKey
        ? toolMetadata.cacheKey(parameters)
        : `${toolId}:${JSON.stringify(parameters)}`;

      await toolCache.set(cacheKey, result, toolMetadata.cacheTTL);
    }

    // 7. Log execution
    await logExecution({
      toolId,
      userId: context.userId,
      parameters,
      result,
      duration: Date.now() - startTime,
      success: true
    });

    return {
      success: true,
      data: result,
      cached: false,
      duration: Date.now() - startTime
    };

  } catch (error) {
    // Log error
    await logExecution({
      toolId,
      userId: context.userId,
      parameters,
      error: error.message,
      duration: Date.now() - startTime,
      success: false
    });

    return {
      success: false,
      error: error.message,
      duration: Date.now() - startTime
    };
  }
}
```

## Implementation Notes

### Migration Strategy

**Phase 1: Convert Generic Tools (Week 1)**
1. Create `core/src/services/agent/tools/ontology/` directory
2. Convert each generic tool from JSON Schema to AI SDK + Zod:
   - `ontology-types.ts`
   - `ontology-type.ts`
   - `query.ts`
   - `get.ts`
   - `create.ts`
   - `update.ts`
   - `delete.ts`
   - `traverse.ts`
   - `aggregate.ts`
   - `analyze-impact.ts`
3. Create `index.ts` that exports all tools
4. Write unit tests for each tool
5. Update existing agent integration to use new tools

**Phase 2: Add AWS Service Tools (Week 2)**
1. Create `core/src/services/agent/tools/aws/` directory
2. Implement DynamoDB tools (scan, query, batch-get)
3. Implement S3 tools (list, get, search)
4. Implement Glue tools (databases, tables, schemas)
5. Implement Athena tools (query, results)
6. Implement CloudWatch tools (metrics, time-series)
7. Implement QuickSight tools (dashboards)
8. Implement Kendra tools (search)
9. Write integration tests for AWS tools

**Phase 3: Widget Tools (Week 2)**
1. Create `core/src/services/agent/tools/widgets/` directory
2. Implement display tools that return UI annotations
3. Test widget rendering in agent UI
4. Document widget tool patterns

### Testing Strategy

```typescript
// Example test: query tool
describe('queryTool', () => {
  it('validates parameters with Zod', async () => {
    const result = queryTool.parameters.safeParse({
      typeName: 'contract',
      filters: { status: 'active' },
      limit: 10
    });

    expect(result.success).toBe(true);
  });

  it('rejects invalid parameters', async () => {
    const result = queryTool.parameters.safeParse({
      typeName: 'contract',
      limit: 200 // exceeds max
    });

    expect(result.success).toBe(false);
    expect(result.error.issues[0].message).toContain('must be less than or equal to 100');
  });

  it('executes query and returns results', async () => {
    const result = await queryTool.execute({
      typeName: 'contract',
      filters: { status: 'active' },
      limit: 10
    }, mockContext);

    expect(result.data).toHaveLength(10);
    expect(result.count).toBe(10);
  });

  it('caches results on subsequent calls', async () => {
    const params = { typeName: 'contract', limit: 10 };

    // First call - cache miss
    const result1 = await executeTool('ontology_query', params, mockContext);
    expect(result1.cached).toBe(false);

    // Second call - cache hit
    const result2 = await executeTool('ontology_query', params, mockContext);
    expect(result2.cached).toBe(true);
    expect(result2.data).toEqual(result1.data);
  });
});
```

### Performance Considerations

1. **Caching Strategy**
   - Cache ontology schema lookups (5 min TTL)
   - Cache read-only query results (5 min TTL)
   - Cache AWS catalog data (10 min TTL)
   - Don't cache write operations
   - Use Redis for distributed caching in production

2. **Validation Optimization**
   - Pre-compile Zod schemas at startup
   - Use schema caching for repeated validations
   - Batch validations when possible

3. **Query Optimization**
   - Use DynamoDB indexes for filtered queries
   - Limit default page size to 20 items
   - Implement cursor-based pagination for large result sets
   - Use parallel queries for independent data fetches

4. **Monitoring**
   - Track P50, P95, P99 latencies for each tool
   - Alert on error rates > 1%
   - Alert on cache hit rate < 80%
   - Dashboard showing tool usage and performance

### Security Considerations

1. **Permission Model**
   - Define permission hierarchy: `ontology:read`, `ontology:write`, `ontology:admin`
   - AWS permissions: `aws:{service}:read`, `aws:{service}:write`
   - Widget permissions: `widget:render`
   - Check permissions before tool execution

2. **Rate Limiting**
   - Per-user limits: 100 requests/minute
   - Per-agent limits: 500 requests/minute
   - Exponential backoff for rate limit errors

3. **Audit Logging**
   - Log all write operations (create, update, delete)
   - Log permission-denied attempts
   - Log parameter validation failures
   - Store audit logs in DynamoDB with 90-day retention

4. **Parameter Sanitization**
   - Use Zod's built-in sanitization
   - Validate string lengths
   - Validate numeric ranges
   - Escape SQL in Athena queries
   - Validate S3 paths to prevent directory traversal

## Success Metrics

### Adoption Metrics
- 25+ tools registered in tool registry
- 10+ agents using ontology tools
- 1000+ tool executions per day

### Performance Metrics
- Average tool execution time: < 2 seconds
- P95 execution time: < 5 seconds
- Cache hit rate: > 80%
- Tool success rate: > 99%

### Quality Metrics
- 100% of tools have Zod validation
- 100% of tools have unit tests
- Test coverage: > 90%
- Zero production errors from validation failures

## Related Documentation

- [Generic Tools Implementation](../../../core/src/services/ontology/tools/generic-tools.ts)
- [Tool Registry](../../../core/src/services/agent/tools/registry.ts)
- [AI SDK Documentation](https://sdk.vercel.ai/docs)
- [Zod Documentation](https://zod.dev)

---

**Feature Owner**: Platform Team
**Priority**: P0 (Critical)
**Estimated Effort**: 2 weeks
**Dependencies**: None
