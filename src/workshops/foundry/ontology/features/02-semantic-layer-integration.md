# Feature: Semantic Layer Integration

## Overview

Integrate the ontology semantic layer into the UI, providing GenAI agents and users with visual tools for inference rules, pattern detection, recommendations, learning insights, and impact analysis. This transforms the ontology from a static data model into an intelligent, self-improving knowledge system.

### Current State

- Semantic layer exists in `core/src/services/ontology/semantic/` with inference, recommendations, pattern detection, anomaly detection, and learning capabilities
- Backend services are functional but have limited UI exposure
- No visual tools for creating or managing inference rules
- Pattern detection runs in background without user visibility
- Recommendations are computed but not surfaced in agent workflows
- Learning insights stored but not visualized
- Impact analysis available but not integrated into destructive operations

### Target State

- Visual inference rule builder with drag-drop condition/action editor
- Real-time pattern detection dashboard with anomaly alerts
- Contextual recommendations panel in agent workflows
- Learning insights dashboard showing query patterns and ontology evolution
- Impact preview modal for update/delete operations with affected entity visualization
- Semantic search powered by embeddings and Kendra
- Rule execution history and audit log

## Requirements

### Functional Requirements

**FR1: Inference Rule Management**
- FR1.1: Visual rule builder with condition/action editor
- FR1.2: Rule testing sandbox with sample data
- FR1.3: Rule activation/deactivation toggle
- FR1.4: Rule execution history and audit log
- FR1.5: Rule versioning and rollback
- FR1.6: Rule dependency visualization (which rules trigger others)
- FR1.7: Bulk rule operations (enable/disable/delete multiple)

**FR2: Pattern Detection Dashboard**
- FR2.1: Real-time pattern detection status and results
- FR2.2: Visual pattern viewer showing detected patterns with confidence scores
- FR2.3: Anomaly detection alerts with severity levels
- FR2.4: Pattern history timeline showing when patterns were detected
- FR2.5: Pattern investigation tools (drill-down to entities)
- FR2.6: Pattern suppression (mark false positives)
- FR2.7: Export patterns for analysis

**FR3: Recommendations Panel**
- FR3.1: Contextual recommendations in agent chat
- FR3.2: Recommendation cards with rationale and confidence
- FR3.3: Accept/reject recommendation actions
- FR3.4: Recommendation feedback collection
- FR3.5: Recommendation history per user/agent
- FR3.6: Smart recommendations based on current context
- FR3.7: Batch apply recommendations

**FR4: Learning Insights Dashboard**
- FR4.1: Query pattern analysis (most frequent queries, fields, filters)
- FR4.2: Ontology evolution timeline (nodes/edges added/modified)
- FR4.3: Schema change impact analysis
- FR4.4: User behavior analytics (tool usage, entity access patterns)
- FR4.5: Performance metrics (query latency, cache hit rates)
- FR4.6: Data quality metrics (completeness, consistency, accuracy)
- FR4.7: Trend detection and forecasting

**FR5: Impact Analysis Preview**
- FR5.1: Pre-delete impact modal showing affected entities
- FR5.2: Visual graph of cascade deletes
- FR5.3: Pre-update impact showing affected workflows/agents
- FR5.4: Safety assessment with risk level indicators
- FR5.5: Recommended actions before proceeding
- FR5.6: Undo capability after destructive operations
- FR5.7: Impact simulation without executing

**FR6: Semantic Search**
- FR6.1: Natural language search across ontology
- FR6.2: Embedding-based similarity search
- FR6.3: Kendra-powered document search
- FR6.4: Search result ranking with relevance scores
- FR6.5: Search facets (filter by category, domain, type)
- FR6.6: Saved searches and search history
- FR6.7: Search analytics (popular queries, no-result queries)

### Non-Functional Requirements

**NFR1: Performance**
- Rule execution: < 100ms per rule
- Pattern detection: Complete scan in < 30 seconds
- Recommendations: Generate in < 500ms
- Impact analysis: Complete in < 2 seconds
- Semantic search: Return results in < 1 second

**NFR2: Real-Time Updates**
- Pattern detection alerts appear within 1 minute of detection
- Recommendations update when context changes
- Learning insights refresh every 5 minutes
- WebSocket updates for rule execution status

**NFR3: Scalability**
- Support 1000+ inference rules
- Process 10,000+ entities for pattern detection
- Handle 100+ concurrent users
- Store 1M+ learning events

**NFR4: Usability**
- Rule builder requires no coding knowledge
- Pattern visualizations are intuitive
- Recommendations include clear explanations
- Impact previews are easy to understand

**NFR5: Observability**
- Track all rule executions with timestamps
- Log pattern detection runs
- Monitor recommendation acceptance rates
- Alert on anomaly detection failures

## Architecture

### Component Structure

```
platform/src/app/ontology/
├── semantic/
│   ├── rules/
│   │   ├── page.tsx                 # Rules dashboard
│   │   ├── components/
│   │   │   ├── RuleBuilder.tsx      # Visual rule editor
│   │   │   ├── RuleCard.tsx         # Rule display card
│   │   │   ├── RuleConditionEditor.tsx  # Condition builder
│   │   │   ├── RuleActionEditor.tsx     # Action builder
│   │   │   ├── RuleTestingPanel.tsx     # Testing sandbox
│   │   │   ├── RuleExecutionHistory.tsx # Audit log
│   │   │   └── RuleDependencyGraph.tsx  # Dependency viz
│   │   └── [id]/
│   │       └── page.tsx             # Rule detail/edit
│   │
│   ├── patterns/
│   │   ├── page.tsx                 # Patterns dashboard
│   │   ├── components/
│   │   │   ├── PatternCard.tsx      # Pattern display
│   │   │   ├── PatternViewer.tsx    # Visual pattern display
│   │   │   ├── AnomalyAlert.tsx     # Anomaly notification
│   │   │   ├── PatternTimeline.tsx  # History timeline
│   │   │   └── PatternInvestigator.tsx  # Drill-down tool
│   │   └── [id]/
│   │       └── page.tsx             # Pattern detail
│   │
│   ├── recommendations/
│   │   ├── page.tsx                 # Recommendations dashboard
│   │   └── components/
│   │       ├── RecommendationPanel.tsx   # Main panel
│   │       ├── RecommendationCard.tsx    # Individual recommendation
│   │       ├── RecommendationFeedback.tsx  # Feedback form
│   │       └── RecommendationHistory.tsx   # History view
│   │
│   ├── insights/
│   │   ├── page.tsx                 # Insights dashboard
│   │   └── components/
│   │       ├── QueryPatternChart.tsx     # Query analytics
│   │       ├── OntologyEvolution.tsx     # Timeline view
│   │       ├── SchemaImpactAnalysis.tsx  # Impact viz
│   │       ├── UserBehaviorChart.tsx     # User analytics
│   │       ├── PerformanceMetrics.tsx    # Performance dashboard
│   │       └── DataQualityMetrics.tsx    # Quality dashboard
│   │
│   └── search/
│       ├── page.tsx                 # Search interface
│       └── components/
│           ├── SemanticSearchBar.tsx     # Search input
│           ├── SearchResults.tsx         # Results display
│           ├── SearchFacets.tsx          # Filter facets
│           └── SearchHistory.tsx         # History view
│
├── components/
│   ├── ImpactPreviewModal.tsx      # Impact analysis modal (shared)
│   ├── ImpactGraph.tsx              # Visual impact graph
│   └── SafetyAssessment.tsx         # Risk level display
│
└── hooks/
    ├── useInferenceRules.ts         # Rules data hook
    ├── usePatterns.ts               # Patterns data hook
    ├── useRecommendations.ts        # Recommendations hook
    ├── useLearningInsights.ts       # Insights hook
    └── useSemanticSearch.ts         # Search hook
```

### Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    User/Agent Action                         │
│  (Create entity, Update field, Delete node, Query data)     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                   Semantic Layer Trigger                     │
│  - Record learning event                                     │
│  - Check inference rules                                     │
│  - Generate recommendations                                  │
│  - Detect patterns (scheduled)                               │
└────────────────────────┬────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         ↓               ↓               ↓
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Inference    │  │ Pattern      │  │ Learning     │
│ Engine       │  │ Detection    │  │ Service      │
│              │  │              │  │              │
│ - Evaluate   │  │ - Scan graph │  │ - Store      │
│   conditions │  │ - Find       │  │   events     │
│ - Execute    │  │   anomalies  │  │ - Aggregate  │
│   actions    │  │ - Compute    │  │ - Analyze    │
│ - Log        │  │   confidence │  │   trends     │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       │                 │                 │
       ↓                 ↓                 ↓
┌─────────────────────────────────────────────────────────────┐
│                    Storage Layer                             │
│  - DynamoDB: Rules, patterns, recommendations, events       │
│  - S3: Learning insights, exported data                     │
│  - Kendra: Search index                                     │
│  - Bedrock: Embeddings for semantic search                  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                      UI Layer                                │
│  - Real-time updates via WebSocket                          │
│  - Visual dashboards and charts                             │
│  - Interactive rule builder                                 │
│  - Contextual recommendations                               │
└─────────────────────────────────────────────────────────────┘
```

## Data Model

### Inference Rule

```typescript
interface InferenceRule {
  id: string;                        // Rule ID
  name: string;                      // Human-readable name
  description?: string;              // Purpose of rule

  // Rule definition
  conditions: RuleCondition[];       // All must be true (AND)
  actions: RuleAction[];             // Executed if conditions met

  // Configuration
  active: boolean;                   // Is rule enabled?
  priority: number;                  // Execution order (1 = highest)
  version: number;                   // Rule version

  // Scope
  entityTypes?: string[];            // Apply to these types (null = all)
  domains?: string[];                // Apply to these domains (null = all)

  // Dependencies
  dependsOn?: string[];              // Other rule IDs that must run first

  // Execution
  executionCount: number;            // Total executions
  successCount: number;              // Successful executions
  lastExecuted?: Date;               // Last execution time

  // Metadata
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

interface RuleCondition {
  type: 'field' | 'relationship' | 'pattern' | 'custom';
  field?: string;                    // Field to check
  operator: 'equals' | 'contains' | 'gt' | 'lt' | 'exists' | 'matches';
  value?: any;                       // Expected value
  customFunction?: string;           // Custom validation function
}

interface RuleAction {
  type: 'set_field' | 'create_edge' | 'send_notification' | 'trigger_workflow' | 'custom';
  field?: string;                    // Field to set
  value?: any;                       // Value to set
  targetEntity?: string;             // For create_edge
  relation?: string;                 // For create_edge
  notificationTemplate?: string;     // For send_notification
  workflowId?: string;               // For trigger_workflow
  customFunction?: string;           // Custom action function
}
```

### Detected Pattern

```typescript
interface DetectedPattern {
  id: string;                        // Pattern ID
  name: string;                      // Pattern name
  type: 'structural' | 'temporal' | 'semantic' | 'anomaly';

  // Pattern details
  description: string;               // What was detected
  entities: string[];                // Affected entity IDs
  confidence: number;                // 0-1 confidence score

  // Metadata
  detectedAt: Date;
  status: 'new' | 'acknowledged' | 'investigating' | 'resolved' | 'suppressed';
  severity?: 'low' | 'medium' | 'high' | 'critical';  // For anomalies

  // Investigation
  investigatedBy?: string;
  investigationNotes?: string;
  resolution?: string;
  resolvedAt?: Date;
}
```

### Recommendation

```typescript
interface Recommendation {
  id: string;                        // Recommendation ID
  type: 'create' | 'update' | 'delete' | 'link' | 'query' | 'action';

  // Recommendation details
  title: string;                     // Short title
  description: string;               // Detailed explanation
  rationale: string;                 // Why this is recommended
  confidence: number;                // 0-1 confidence score

  // Context
  entityType?: string;               // Related entity type
  entityId?: string;                 // Related entity ID
  context?: Record<string, any>;     // Additional context

  // Action
  action?: {
    tool: string;                    // Tool to execute
    parameters: Record<string, any>; // Tool parameters
  };

  // Status
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  acceptedBy?: string;
  acceptedAt?: Date;
  feedback?: string;                 // User feedback

  // Metadata
  generatedBy: string;               // 'system' or user ID
  generatedAt: Date;
  expiresAt?: Date;                  // Recommendation expiry
}
```

### Learning Event

```typescript
interface LearningEvent {
  id: string;                        // Event ID
  type: 'query' | 'create' | 'update' | 'delete' | 'tool_execution' | 'error';

  // Event details
  userId: string;
  agentId?: string;
  entityType?: string;
  operation?: string;

  // Metrics
  duration?: number;                 // Operation duration (ms)
  success: boolean;
  errorMessage?: string;

  // Context
  parameters?: Record<string, any>;  // Operation parameters
  result?: Record<string, any>;      // Operation result

  // Timestamp
  timestamp: Date;
}
```

## API Actions

### Inference Rules API

```typescript
// core/src/services/ontology/semantic/rules.ts

/**
 * Get all inference rules with optional filtering
 */
export async function getInferenceRules(
  filters?: {
    active?: boolean;
    entityType?: string;
    domain?: string;
  },
  credentials?: AwsCredentials
): Promise<InferenceRule[]>;

/**
 * Get single rule by ID
 */
export async function getInferenceRule(
  id: string,
  credentials?: AwsCredentials
): Promise<InferenceRule>;

/**
 * Create new inference rule
 */
export async function createInferenceRule(
  rule: Omit<InferenceRule, 'id' | 'createdAt' | 'updatedAt'>,
  credentials?: AwsCredentials
): Promise<InferenceRule>;

/**
 * Update existing rule
 */
export async function updateInferenceRule(
  id: string,
  updates: Partial<InferenceRule>,
  credentials?: AwsCredentials
): Promise<InferenceRule>;

/**
 * Delete rule
 */
export async function deleteInferenceRule(
  id: string,
  credentials?: AwsCredentials
): Promise<void>;

/**
 * Test rule against sample data
 */
export async function testInferenceRule(
  rule: InferenceRule,
  sampleData: any[],
  credentials?: AwsCredentials
): Promise<{
  matches: number;
  nonMatches: number;
  results: Array<{ entity: any; matched: boolean; actionsExecuted: RuleAction[] }>;
}>;

/**
 * Execute rule against all entities
 */
export async function executeInferenceRule(
  id: string,
  credentials?: AwsCredentials
): Promise<{
  entitiesProcessed: number;
  rulesTriggered: number;
  actionsExecuted: number;
  errors: string[];
}>;
```

### Pattern Detection API

```typescript
// core/src/services/ontology/semantic/patterns.ts

/**
 * Get all detected patterns with filtering
 */
export async function getDetectedPatterns(
  filters?: {
    type?: string;
    status?: string;
    severity?: string;
    since?: Date;
  },
  credentials?: AwsCredentials
): Promise<DetectedPattern[]>;

/**
 * Get single pattern by ID
 */
export async function getDetectedPattern(
  id: string,
  credentials?: AwsCredentials
): Promise<DetectedPattern>;

/**
 * Run pattern detection scan
 */
export async function runPatternDetection(
  options?: {
    types?: string[];              // Pattern types to detect
    entityTypes?: string[];        // Limit to these entity types
    domains?: string[];            // Limit to these domains
  },
  credentials?: AwsCredentials
): Promise<{
  patternsDetected: number;
  anomaliesDetected: number;
  duration: number;
}>;

/**
 * Update pattern status
 */
export async function updatePatternStatus(
  id: string,
  status: string,
  notes?: string,
  credentials?: AwsCredentials
): Promise<DetectedPattern>;

/**
 * Suppress pattern (mark as false positive)
 */
export async function suppressPattern(
  id: string,
  reason: string,
  credentials?: AwsCredentials
): Promise<void>;
```

### Recommendations API

```typescript
// core/src/services/ontology/semantic/recommendations.ts

/**
 * Get recommendations for context
 */
export async function getRecommendations(
  context: {
    userId?: string;
    agentId?: string;
    entityType?: string;
    entityId?: string;
    operation?: string;
  },
  credentials?: AwsCredentials
): Promise<Recommendation[]>;

/**
 * Accept recommendation and execute action
 */
export async function acceptRecommendation(
  id: string,
  feedback?: string,
  credentials?: AwsCredentials
): Promise<{
  recommendation: Recommendation;
  result?: any;  // Action execution result
}>;

/**
 * Reject recommendation with feedback
 */
export async function rejectRecommendation(
  id: string,
  feedback: string,
  credentials?: AwsCredentials
): Promise<void>;

/**
 * Generate recommendations (can be called manually or automatically)
 */
export async function generateRecommendations(
  context: {
    userId: string;
    recentActions?: LearningEvent[];
    currentEntity?: any;
  },
  credentials?: AwsCredentials
): Promise<Recommendation[]>;
```

### Learning Insights API

```typescript
// core/src/services/ontology/semantic/learning.ts

/**
 * Get query pattern insights
 */
export async function getQueryPatterns(
  timeRange: { start: Date; end: Date },
  credentials?: AwsCredentials
): Promise<{
  topQueries: Array<{ query: string; count: number }>;
  topFilters: Array<{ field: string; count: number }>;
  topEntityTypes: Array<{ type: string; count: number }>;
}>;

/**
 * Get ontology evolution timeline
 */
export async function getOntologyEvolution(
  timeRange: { start: Date; end: Date },
  credentials?: AwsCredentials
): Promise<Array<{
  timestamp: Date;
  event: string;
  details: string;
}>>;

/**
 * Get performance metrics
 */
export async function getPerformanceMetrics(
  timeRange: { start: Date; end: Date },
  credentials?: AwsCredentials
): Promise<{
  avgQueryLatency: number;
  p95QueryLatency: number;
  cacheHitRate: number;
  errorRate: number;
}>;

/**
 * Get data quality metrics
 */
export async function getDataQualityMetrics(
  credentials?: AwsCredentials
): Promise<{
  completeness: number;      // % of fields filled
  consistency: number;        // % passing validation
  accuracy: number;           // % matching expected patterns
  timeliness: number;         // % updated recently
}>;
```

## Implementation Notes

### Phase 2A: Rules UI (Week 3)

1. Create rules dashboard showing all rules with status
2. Implement visual rule builder:
   - Drag-drop condition builder
   - Action editor with parameter validation
   - Testing sandbox with sample data
3. Add rule execution history table
4. Implement dependency graph visualization with d3-force

### Phase 2B: Patterns Dashboard (Week 3)

1. Create patterns dashboard with filtering
2. Implement pattern cards showing confidence and status
3. Add anomaly alert notifications
4. Create pattern timeline view
5. Build pattern investigation drill-down tool

### Phase 2C: Recommendations (Week 4)

1. Add recommendations panel to agent chat
2. Create recommendation cards with rationale
3. Implement accept/reject actions
4. Add feedback collection form
5. Build recommendation history view

### Phase 2D: Learning Insights (Week 4)

1. Create insights dashboard with multiple tabs
2. Implement query pattern charts (bar, pie, timeline)
3. Add ontology evolution timeline
4. Build performance metrics dashboard
5. Implement data quality metrics with gauges

### Testing Strategy

- **Unit tests**: Test rule condition evaluation, action execution
- **Integration tests**: Test pattern detection algorithms, recommendation generation
- **UI tests**: Test rule builder, pattern viewer, recommendation panel
- **Performance tests**: Verify pattern detection completes in < 30s for 10k entities

### Performance Optimization

1. **Rule Execution**: Pre-compile rules, batch entity processing
2. **Pattern Detection**: Use parallel processing, incremental detection
3. **Recommendations**: Cache context analysis, pre-compute common recommendations
4. **Learning Insights**: Pre-aggregate metrics, use materialized views

## Success Metrics

### Adoption
- 50+ inference rules created
- Pattern detection runs daily with 0 failures
- 80% recommendation acceptance rate
- 100+ insights dashboard views per day

### Performance
- Rule execution: < 100ms average
- Pattern detection: < 30s for full scan
- Recommendations: < 500ms generation time
- Insights dashboard: < 2s load time

### Quality
- 0 rule execution errors
- < 5% false positive pattern detection
- Recommendations have > 70% relevance (user feedback)
- Learning insights updated every 5 minutes

## Related Documentation

- [Semantic Layer Services](../../../core/src/services/ontology/semantic/)
- [Inference Engine](../../../core/src/services/ontology/semantic/inference.ts)
- [Pattern Detection](../../../core/src/services/ontology/semantic/patterns.ts)
- [Recommendations](../../../core/src/services/ontology/semantic/recommendations.ts)

---

**Feature Owner**: Platform Team
**Priority**: P0 (Critical)
**Estimated Effort**: 2 weeks
**Dependencies**: AI SDK Tool Standardization (Phase 1)
