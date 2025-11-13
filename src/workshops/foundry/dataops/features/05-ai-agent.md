# Feature: AI-Powered Data Agent

## Overview

The AI Data Agent is an intelligent assistant that helps users discover data, build pipelines, troubleshoot issues, and understand quality problems using natural language. Powered by AWS Bedrock (Claude), it makes data operations accessible to non-technical users.

**Feature ID**: 05
**Priority**: P1 - High (major differentiator)
**Story Points**: 55
**Dependencies**: Phase 1-4 complete, Feature 01-04
**Implementation Phase**: Phase 6 (Weeks 25-28)

## Requirements

### Functional Requirements

#### FR-1: Natural Language Discovery
- Search datasets using natural language queries
- Examples:
  - "Find me contract data from the last 6 months"
  - "Show datasets about personnel with PII masked"
  - "What's the best data for analyzing vendor performance?"
- AI interprets intent and converts to structured search
- Returns ranked results with explanations
- Follow-up questions to refine search

#### FR-2: AI Pipeline Generation
- Describe desired data product in plain English
- Examples:
  - "Build a monthly contract spend report grouped by vendor"
  - "Create a dashboard showing top 10 vendors by spend"
  - "Combine contract data with performance metrics"
- AI generates pipeline with appropriate nodes and transformations
- User reviews and edits generated pipeline
- AI explains what each part of pipeline does

#### FR-3: Quality Assistant
- Ask questions about data quality
- Examples:
  - "Why is Contract Spend 2024 flagged?"
  - "What's wrong with this dataset's quality?"
  - "How can I improve the quality score?"
- AI analyzes quality metrics and explains issues
- Suggests remediation steps
- Generates quality rules automatically

#### FR-4: Anomaly Explainer
- Explain detected anomalies
- Examples:
  - "Why did quality suddenly drop?"
  - "What caused this spike in the data?"
  - "Is this data pattern normal?"
- AI analyzes historical patterns and identifies root causes
- Suggests fixes or investigations

#### FR-5: Documentation Generator
- Auto-generate documentation
- Examples:
  - "Create a data dictionary for Contract Spend 2024"
  - "Generate README for this data product"
  - "Explain what this pipeline does"
- AI analyzes schemas, lineage, and code
- Generates markdown documentation
- Updates documentation on changes

#### FR-6: Recommendation Engine
- Suggest relevant datasets and data products
- "Users who used this also used..."
- "Datasets similar to this one"
- "Suggested quality rules for this dataset"
- "Related data products you might need"

#### FR-7: Conversational Interface
- Chat-like interface embedded in DataOps UI
- Multi-turn conversations (context preserved)
- Show AI "thinking" (loading states)
- Display results inline (datasets, pipelines, docs)
- Copy/paste, export chat history

### Non-Functional Requirements

#### NFR-1: Performance
- AI response time: <5 seconds for most queries
- <10 seconds for complex analysis
- Real-time streaming of responses (not all at once)
- Caching of common queries

#### NFR-2: Accuracy
- >80% accuracy for pipeline generation
- >90% accuracy for natural language search
- Clear confidence scores for uncertain responses
- "I don't know" when truly uncertain

#### NFR-3: Security
- AI cannot access data it shouldn't (respect permissions)
- No PII/secrets exposed in responses
- Audit log of all AI interactions
- Data anonymization for AI training (if applicable)

#### NFR-4: Cost Management
- Cache frequent queries
- Rate limiting per user
- Use smaller models for simple queries
- Batch processing when possible

## Architecture

### Component Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    AI Agent Layer                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌────────────┐  ┌────────────┐  ┌────────────────────┐   │
│  │ Discovery  │  │  Pipeline  │  │     Quality        │   │
│  │   Agent    │  │  Generator │  │     Assistant      │   │
│  └─────┬──────┘  └─────┬──────┘  └─────────┬──────────┘   │
│        │               │                    │              │
│        └───────────────┴────────────────────┘              │
│                        │                                    │
│                ┌───────▼────────┐                           │
│                │   Agent Core   │                           │
│                │  (Orchestrator)│                           │
│                └───────┬────────┘                           │
│                        │                                    │
├────────────────────────┼─────────────────────────────────────┤
│                   LLM Layer                                 │
├────────────────────────┼─────────────────────────────────────┤
│         │              │              │                     │
│  ┌──────▼──────┐ ┌─────▼──────┐ ┌────▼──────────┐         │
│  │   Bedrock   │ │   Tools    │ │   Context     │         │
│  │   Claude    │ │  Registry  │ │   Manager     │         │
│  └─────────────┘ └────────────┘ └───────────────┘         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Agent Tools Architecture

```typescript
// Agent has access to tools via function calling
const agentTools = [
  {
    name: "search_datasets",
    description: "Search for datasets by keywords, filters",
    parameters: { query, filters, sort }
  },
  {
    name: "get_dataset_details",
    description: "Get complete profile of a dataset",
    parameters: { datasetId }
  },
  {
    name: "get_quality_metrics",
    description: "Get quality metrics and history",
    parameters: { datasetId }
  },
  {
    name: "analyze_quality_issues",
    description: "Analyze why quality score is low",
    parameters: { datasetId }
  },
  {
    name: "get_lineage",
    description: "Get upstream/downstream lineage",
    parameters: { entityId, direction }
  },
  {
    name: "generate_pipeline",
    description: "Generate pipeline definition from description",
    parameters: { description, sourceDatasetsIds, targetFormat }
  },
  {
    name: "explain_anomaly",
    description: "Explain detected data anomaly",
    parameters: { datasetId, anomalyType, timestamp }
  },
  {
    name: "generate_documentation",
    description: "Generate markdown documentation",
    parameters: { entityId, entityType, sections }
  },
  {
    name: "recommend_datasets",
    description: "Recommend related datasets",
    parameters: { datasetId, limit }
  }
];
```

## Data Model

### AgentConversation Entity

```typescript
{
  id: string                        // "conversation-{userId}-{timestamp}"
  userId: string
  title: string                     // Auto-generated from first message
  messages: Array<{
    id: string
    role: "user" | "assistant"
    content: string
    timestamp: string
    toolCalls?: Array<{
      toolName: string
      parameters: any
      result: any
    }>
  }>
  context: {
    datasetId?: string              // If conversation about specific dataset
    dataProductId?: string
    domain?: string
  }
  status: "active" | "archived"
  createdAt: string
  updatedAt: string
  lastMessageAt: string
}

Table: dataops-agent-conversation
PK: id
GSI: userId-lastMessageAt-index (query user's conversations)
```

### AgentQuery (for analytics)

```typescript
{
  id: string
  conversationId: string
  userId: string
  query: string                     // User's question
  intent: string                    // Detected intent (search, generate, explain)
  toolsUsed: string[]               // Tools called
  responseTime: number              // milliseconds
  satisfaction?: "helpful" | "not_helpful"
  createdAt: string
}

Table: dataops-agent-query
GSI: userId-index
GSI: intent-index (analyze popular intents)
```

## UI/UX

### AI Agent Chat Interface Mockup

```
┌─────────────────────────────────────────────────────────────┐
│ 🤖 Data Agent                                        [✕]    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  💬 New Conversation                                        │
│  ─────────────────────────────────────────                 │
│  📊 Contract analysis (2 hours ago)                         │
│  🔍 Find personnel data (Yesterday)                         │
│  📈 Quality issues (2 days ago)                             │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  👤 You:                                                    │
│  Find me contract data from the last 6 months with good    │
│  quality that I can use for spend analysis                  │
│                                                             │
│  🤖 Agent:                                                  │
│  I'll search for contract datasets from the last 6 months  │
│  with quality scores >70. Let me find those for you...      │
│                                                             │
│  [Searching datasets...] ⏳                                 │
│                                                             │
│  ✅ Found 3 relevant datasets:                              │
│                                                             │
│  1. 📊 Contract Spend 2024                                  │
│     Quality: 85/100 · 🔓 Unclassified                       │
│     Updated: 2 days ago · 2.4M records                      │
│     "Monthly contract spend aggregated by vendor..."        │
│     [View Profile] [Use in Pipeline]                        │
│                                                             │
│  2. 📊 Active Contracts Q4                                  │
│     Quality: 92/100 · 🔓 Unclassified                       │
│     Updated: 5 hours ago · 1.8M records                     │
│     "All active contracts with CLINs and funding..."        │
│     [View Profile] [Use in Pipeline]                        │
│                                                             │
│  3. 📊 Historical Contract Data                             │
│     Quality: 78/100 · 🔒 Secret                             │
│     Updated: 1 week ago · 5.2M records                      │
│     "Historical contract archive 2020-2024..."              │
│     [View Profile] [Use in Pipeline]                        │
│                                                             │
│  💡 Recommendation: "Contract Spend 2024" has the best     │
│  quality and is most recently updated. It's designed for   │
│  spend analysis.                                            │
│                                                             │
│  Would you like me to help you build a pipeline using this │
│  data?                                                      │
│                                                             │
│  👤 You:                                                    │
│  Yes, build a monthly spend report by vendor               │
│                                                             │
│  🤖 Agent:                                                  │
│  I'll create a pipeline that:                              │
│  1. Reads from "Contract Spend 2024"                       │
│  2. Filters for valid amounts (>0)                         │
│  3. Aggregates by vendor and month                         │
│  4. Outputs to S3 as Parquet                               │
│                                                             │
│  [Generating pipeline...] ⏳                                │
│                                                             │
│  ✅ Pipeline generated! Here's what it does:                │
│                                                             │
│  [Pipeline Preview - Mini Canvas]                          │
│  S3 Source → Filter → Aggregate → S3 Destination           │
│                                                             │
│  [Open in Pipeline Builder] [Modify] [Deploy]              │
│                                                             │
│  ─────────────────────────────────────────────────────     │
│                                                             │
│  💬 Type your message...                                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Quality Assistant Example

```
┌─────────────────────────────────────────────────────────────┐
│ 🤖 Quality Assistant                                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  👤 You:                                                    │
│  Why is Contract Spend 2024 quality score only 45?         │
│                                                             │
│  🤖 Agent:                                                  │
│  Let me analyze the quality metrics for this dataset...     │
│                                                             │
│  [Analyzing quality metrics...] ⏳                          │
│                                                             │
│  ✅ Quality Analysis Complete                               │
│                                                             │
│  📉 The quality score dropped from 92 to 45 due to:         │
│                                                             │
│  1. **Completeness Issue (Critical)**: 55% missing values   │
│     - Column 'amount' has 45% null values (was 2%)         │
│     - Column 'vendor_id' has 38% null values (was 0%)      │
│     - This happened after the last data load (2 hours ago)  │
│                                                             │
│  2. **Consistency Issue (High)**: 18% invalid foreign keys  │
│     - 1,800 records have vendor_ids not in vendor table    │
│     - Started appearing yesterday                          │
│                                                             │
│  3. **Timeliness Issue (Medium)**: Data is 3 days old      │
│     - Expected daily updates but last update was 3 days    │
│     - Pipeline may be failing                              │
│                                                             │
│  🔍 **Root Cause**: Looks like the last ETL job failed      │
│  to properly load vendor information. Check pipeline logs   │
│  from 2 hours ago.                                          │
│                                                             │
│  💡 **Recommended Actions**:                                │
│  1. Re-run the ETL pipeline from 2 hours ago               │
│  2. Add quality check for required columns (amount, vendor)│
│  3. Set up alert for completeness dropping below 90%       │
│  4. Verify vendor table is up-to-date                      │
│                                                             │
│  Would you like me to create these quality rules for you?  │
│                                                             │
│  [Yes, Create Rules] [View Pipeline Logs] [Dismiss]        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## API Actions

### sendAgentMessage(conversationId, message)

**Purpose**: Send message to AI agent

**Input**:
```typescript
{
  conversationId?: string           // Optional - create new if not provided
  message: string
  context?: {
    datasetId?: string
    dataProductId?: string
    domain?: string
  }
}
```

**Output**:
```typescript
{
  success: boolean
  conversationId: string
  message: {
    id: string
    role: "assistant"
    content: string
    toolCalls: Array<{
      toolName: string
      parameters: any
      result: any
    }>
    timestamp: string
  }
}
```

### generatePipeline(description, options)

**Purpose**: AI-powered pipeline generation

**Input**:
```typescript
{
  description: string               // Natural language description
  sourceDatasetIds?: string[]       // Optional: specific sources to use
  outputFormat?: "s3" | "aurora" | "dynamodb"
  domain?: string
}
```

**Output**:
```typescript
{
  success: boolean
  pipeline: {
    nodes: Node[]
    edges: Edge[]
    explanation: string             // What the pipeline does
    confidence: number              // 0-1 confidence score
  }
  warnings: string[]                // Potential issues
  suggestions: string[]             // Improvement ideas
}
```

### explainQualityIssue(datasetId)

**Purpose**: AI analysis of quality problems

**Input**:
```typescript
{
  datasetId: string
}
```

**Output**:
```typescript
{
  success: boolean
  analysis: {
    summary: string                 // High-level explanation
    issues: Array<{
      dimension: string             // "completeness", "validity", etc.
      severity: string
      description: string
      rootCause: string
      impact: string
    }>
    recommendations: Array<{
      action: string
      priority: "high" | "medium" | "low"
      effort: "quick" | "moderate" | "complex"
      expectedImprovement: number  // Points
    }>
  }
}
```

### generateDocumentation(entityId, entityType, sections)

**Purpose**: Auto-generate documentation

**Input**:
```typescript
{
  entityId: string
  entityType: "dataset" | "dataproduct"
  sections: Array<"overview" | "schema" | "quality" | "lineage" | "usage">
}
```

**Output**:
```typescript
{
  success: boolean
  documentation: string             // Markdown documentation
  metadata: {
    generatedAt: string
    model: string
    tokensUsed: number
  }
}
```

## Implementation Notes

### Bedrock Agent Setup

Configure Bedrock agent with tools:
```typescript
import { BedrockAgentRuntimeClient, InvokeAgentCommand } from "@aws-sdk/client-bedrock-agent-runtime";

const bedrockAgent = new BedrockAgentRuntimeClient({ region: "us-east-1" });

async function invokeAgent(message: string, context: any) {
  const response = await bedrockAgent.send(new InvokeAgentCommand({
    agentId: "AGENT_ID",
    agentAliasId: "ALIAS_ID",
    sessionId: context.conversationId,
    inputText: message
  }));

  // Stream response
  for await (const event of response.completion) {
    if (event.chunk) {
      yield event.chunk.bytes.toString();
    }
  }
}
```

### Tool Implementation

Implement tools that agent can call:
```typescript
const tools = {
  async search_datasets(params: { query: string, filters: any }) {
    return await searchDatasets({
      query: params.query,
      filters: params.filters,
      sort: "quality"
    });
  },

  async get_dataset_details(params: { datasetId: string }) {
    return await getDataset(params.datasetId);
  },

  async get_quality_metrics(params: { datasetId: string }) {
    const dataset = await getDataset(params.datasetId);
    return {
      qualityScore: dataset.qualityScore,
      metrics: dataset.qualityMetrics,
      trend: await getQualityTrend(params.datasetId, 30)
    };
  },

  async analyze_quality_issues(params: { datasetId: string }) {
    // Use Claude to analyze quality metrics
    const dataset = await getDataset(params.datasetId);
    const history = await getQualityTrend(params.datasetId, 30);

    const prompt = `
      Analyze why this dataset has low quality:
      Current score: ${dataset.qualityScore}
      Metrics: ${JSON.stringify(dataset.qualityMetrics)}
      History: ${JSON.stringify(history)}

      Identify:
      1. Which dimension is worst
      2. When did it start degrading
      3. Likely root cause
      4. Recommendations for improvement
    `;

    return await invokeClaudeForAnalysis(prompt);
  },

  async generate_pipeline(params: {
    description: string,
    sourceDatasetIds: string[]
  }) {
    // Use Claude to generate pipeline
    const prompt = `
      Generate a data pipeline with these requirements:
      Description: ${params.description}
      Source datasets: ${params.sourceDatasetIds.join(", ")}

      Return JSON with:
      - nodes (type, config)
      - edges (source, target)
      - explanation
    `;

    const result = await invokeClaudeForGeneration(prompt);
    return JSON.parse(result);
  }
};
```

### Natural Language to Structured Search

Convert natural language to filters:
```typescript
async function convertNLToSearch(query: string) {
  const prompt = `
    Convert this natural language query to structured search parameters:
    Query: "${query}"

    Return JSON with:
    {
      "keywords": [...],          // Search keywords
      "filters": {
        "domain": [...],
        "classification": [...],
        "qualityMin": number,
        "dateRange": { from, to }
      },
      "sort": "quality" | "relevance" | "date"
    }

    Examples:
    - "contract data from last 6 months" →
      { keywords: ["contract"], filters: { dateRange: { from: "2024-07-01" } } }
    - "high quality personnel data" →
      { keywords: ["personnel"], filters: { qualityMin: 80 } }
  `;

  const result = await invokeClaude(prompt);
  return JSON.parse(result);
}
```

### Cost Management

Cache frequent queries:
```typescript
const queryCache = new Map<string, { result: any, timestamp: number }>();

async function sendAgentMessage(conversationId: string, message: string) {
  // Check cache
  const cacheKey = `${conversationId}:${message}`;
  const cached = queryCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < 3600000) {  // 1 hour TTL
    return cached.result;
  }

  // Call agent
  const result = await invokeAgent(message, { conversationId });

  // Cache result
  queryCache.set(cacheKey, { result, timestamp: Date.now() });

  return result;
}
```

## Testing

### Unit Tests
- Tool function implementations
- NL query parsing
- Pipeline generation validation
- Documentation generation

### Integration Tests
- End-to-end agent conversation
- Tool calling and results
- Context preservation across messages
- Error handling

### User Acceptance Tests
- User finds dataset via natural language (<2 minutes)
- User generates pipeline via description (<5 minutes)
- User gets quality explanation that makes sense
- User successfully creates quality rules from AI suggestions

## Success Metrics

- **Discovery Efficiency**: 80% of searches successful on first try
- **Pipeline Generation**: 80% of generated pipelines work without modification
- **Quality Help**: 90% of users find quality explanations helpful
- **User Adoption**: 60% of users use AI agent at least weekly
- **Time Savings**: 50% reduction in time to find and understand data

## Related Features

- [01-data-catalog.md](./01-data-catalog.md) - AI-powered search in catalog
- [02-pipeline-builder.md](./02-pipeline-builder.md) - AI pipeline generation
- [03-quality-engine.md](./03-quality-engine.md) - AI quality analysis
- [04-lineage-graph.md](./04-lineage-graph.md) - AI lineage explanations
