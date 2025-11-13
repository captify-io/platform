# Captify Spaces - Ontology Reference

## Overview

The Captify Spaces ontology is a comprehensive data model defining all entities, relationships, properties, and storage patterns used throughout the platform. This ontology-driven architecture provides a single source of truth for the entire system, enabling dynamic table resolution, type safety, and consistent data modeling across all features.

### Why Ontology-Driven Architecture?

1. **Single Source of Truth**: All entity definitions, schemas, and relationships defined in one central location
2. **Dynamic Table Resolution**: API automatically resolves short table names (e.g., `core-task`) to full DynamoDB table names (e.g., `captify-core-task`)
3. **Multi-Tenant Support**: Same codebase works across environments with different schema prefixes (dev, staging, prod)
4. **Type Safety**: Ontology schemas generate TypeScript types and Zod validators
5. **Relationship Mapping**: Ontology edges define allowed relationships between entities with cardinality rules
6. **UI Generation**: Forms, tables, and visualizations generated from ontology schemas

### Ontology Storage

The ontology itself is stored in DynamoDB:
- **Tables**: `{schema}-core-ontology-node` and `{schema}-core-ontology-edge`
- **Caching**: Nodes cached for 5 minutes per process for performance
- **Resolution**: First request loads all nodes (single scan), subsequent requests use cache

---

## Core Concepts

### Naming Conventions

The platform uses consistent naming across different contexts:

| Context | Format | Example | Notes |
|---------|--------|---------|-------|
| **Node IDs** | `{app}-{typeCamelCase}` | `core-task`, `core-user`, `core-changeRequest` | Unique identifier for ontology lookup |
| **Table Names (AWS)** | `{schema}-{app}-{type-kebab-case}` | `captify-core-task`, `captify-core-user`, `captify-core-change-request` | Full name in DynamoDB with schema prefix |
| **DataSource (Ontology)** | `{app}-{type-kebab-case}` | `core-task`, `core-user`, `core-change-request` | Stored in node properties WITHOUT schema prefix |
| **API Requests** | `{app}-{type}` | `core-task`, `core-user` | Short format in API calls, resolved via ontology |

**Why Different Formats?**
- **Node IDs use camelCase**: Enables unambiguous parsing (e.g., `core-changeRequest` vs `core-change-request`)
- **Table Names use kebab-case**: Follows database naming conventions
- **DataSource without schema**: Allows multi-tenant support with environment-specific schema prefixes

### Table Name Resolution Flow

```
1. API Request
   ↓ table: "core-task"

2. Table Resolver (lib/table-resolver.ts)
   ↓ Look up node ID: "core-task"
   ↓ Retrieve properties.dataSource: "core-task"

3. Schema Prepending
   ↓ Get schema from environment (e.g., "captify")
   ↓ Prepend: "captify-" + "core-task"

4. DynamoDB Operation
   ↓ Execute query on table: "captify-core-task"
```

### Audit Fields

All entities include standard audit fields:
- `id` (string): Unique identifier, typically `{type}_{timestamp}_{random}`
- `createdAt` (string): ISO 8601 timestamp of creation
- `updatedAt` (string): ISO 8601 timestamp of last update
- `createdBy` (string, optional): User ID who created the entity
- `updatedBy` (string, optional): User ID who last updated the entity
- `active` (string, optional): "true" or "false" for soft deletes (DynamoDB stores booleans as strings)

---

## Entity Hierarchy

```
Contract
├── CLIN (Contract Line Item Number)
│   └── Deliverable
│
Space
├── Workstream
│   ├── Feature
│   │   ├── UserStory
│   │   │   └── Task
│   │   └── Deliverable
│   └── Sprint
│       └── Task
├── Objective (OKR)
│   └── KeyResult
│   └── OKRCheckIn
├── Request
│   └── (converts to) Task | Feature | Workstream
├── Risk
├── InvestmentAllocation
└── RoadmapItem

Team
├── User
│   ├── Task (assigned)
│   ├── TimeEntry
│   ├── TimerSession
│   ├── Timesheet
│   ├── CapacityEvent
│   ├── AgentThread
│   │   └── AgentMessage
│   └── Activity
├── Sprint
└── Workstream

Shared Entities:
- Blocker (links to Task)
- Notification (links to User)
- Comment (links to any entity)
- Document (links to any entity)
- ReportTemplate
- PortfolioDashboardConfig
```

---

## Complete Entity Catalog

### Activity

**Purpose**: User activity event for tracking team member actions across the platform

**Node ID**: `core-activity`
**Table Name**: `{schema}-core-activity`
**Domain**: Work Management
**Icon**: Activity
**Color**: #6366f1

**Properties**:
```typescript
interface Activity {
  id: string;
  userId: string;
  type: 'task_created' | 'task_updated' | 'task_completed' | 'time_logged' | 'blocker_created' | 'comment_added';
  entityType: 'task' | 'time-entry' | 'blocker' | 'comment';
  entityId: string;
  metadata: {
    taskTitle?: string;
    oldStatus?: string;
    newStatus?: string;
    hours?: number;
    commentText?: string;
  };
  spaceId?: string;
  createdAt: string;
}
```

**Indexes**:
- `userId-createdAt-index` (GSI): hashKey=userId, rangeKey=createdAt
- `spaceId-createdAt-index` (GSI): hashKey=spaceId, rangeKey=createdAt
- `type-createdAt-index` (GSI): hashKey=type, rangeKey=createdAt

**Relationships**:
- **Incoming**: User → Activity (performed)
- **Outgoing**: None

**Used By Features**: 06 (Activity Stream)

**Example**:
```json
{
  "id": "activity_1730342400000_abc123",
  "userId": "user-1",
  "type": "task_completed",
  "entityType": "task",
  "entityId": "task-123",
  "metadata": {
    "taskTitle": "Implement login feature",
    "oldStatus": "in-progress",
    "newStatus": "completed"
  },
  "spaceId": "space-1",
  "createdAt": "2025-10-31T12:00:00Z"
}
```

---

### AgentMessage

**Purpose**: Message in agent conversation thread (user or AI assistant messages)

**Node ID**: `core-agent-message`
**Table Name**: `{schema}-core-agent-message`
**Domain**: AI
**Icon**: MessageCircle
**Color**: #8b5cf6

**Properties**:
```typescript
interface AgentMessage {
  id: string;
  threadId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  toolCalls?: Array<{
    toolName: string;
    parameters: any;
    result?: any;
  }>;
  metadata?: any;
  timestamp: string;
  createdAt: string;
  updatedAt: string;
}
```

**Indexes**:
- `threadId-timestamp-index` (GSI): hashKey=threadId, rangeKey=timestamp

**Relationships**:
- **Incoming**: AgentThread → AgentMessage (hasMessages)
- **Outgoing**: None

**Used By Features**: 02 (AI Daily Checkin), 36 (AI Request Intake), 38 (Chat Assistant)

**Example**:
```json
{
  "id": "msg_1730342400000_user",
  "threadId": "thread_abc123",
  "role": "user",
  "content": "I spent 3 hours on OAuth integration yesterday",
  "timestamp": "2025-10-31T12:00:00Z",
  "createdAt": "2025-10-31T12:00:00Z",
  "updatedAt": "2025-10-31T12:00:00Z"
}
```

---

### AgentThread

**Purpose**: Conversation thread with AI agent for daily checkins, request intake, or general assistance

**Node ID**: `core-agent-thread`
**Table Name**: `{schema}-core-agent-thread`
**Domain**: AI
**Icon**: MessageSquare
**Color**: #8b5cf6

**Properties**:
```typescript
interface AgentThread {
  id: string;
  userId: string;
  agentId: string;
  type: 'daily-checkin' | 'request-intake' | 'general';
  metadata: {
    date?: string;
    summary?: string;
    tasksDiscussed?: string[];
    timeEntered?: number;
    blockersIdentified?: number;
  };
  status: 'active' | 'completed' | 'abandoned';
  createdAt: string;
  updatedAt: string;
}
```

**Indexes**:
- `userId-createdAt-index` (GSI): hashKey=userId, rangeKey=createdAt
- `type-index` (GSI): hashKey=type

**Relationships**:
- **Incoming**: User → AgentThread (hasThreads)
- **Outgoing**: AgentThread → AgentMessage (hasMessages)

**Used By Features**: 02 (AI Daily Checkin), 36 (AI Request Intake), 38 (Chat Assistant)

**Example**:
```json
{
  "id": "thread_1730342400000_abc123",
  "userId": "user-1",
  "agentId": "agent-daily-checkin",
  "type": "daily-checkin",
  "metadata": {
    "date": "2025-10-31",
    "tasksDiscussed": ["task-1", "task-2"],
    "timeEntered": 8,
    "blockersIdentified": 1
  },
  "status": "completed",
  "createdAt": "2025-10-31T12:00:00Z",
  "updatedAt": "2025-10-31T12:30:00Z"
}
```

---

### Blocker

**Purpose**: Issue blocking task progress with severity tracking and resolution workflow

**Node ID**: `core-blocker`
**Table Name**: `{schema}-core-blocker`
**Domain**: Work Management
**Icon**: AlertTriangle
**Color**: #ef4444

**Properties**:
```typescript
interface Blocker {
  id: string;
  taskId: string;
  userId: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in-progress' | 'resolved';
  resolvedAt?: string;
  resolvedBy?: string;
  createdAt: string;
  updatedAt: string;
}
```

**Indexes**:
- `taskId-status-index` (GSI): hashKey=taskId, rangeKey=status
- `userId-createdAt-index` (GSI): hashKey=userId, rangeKey=createdAt

**Relationships**:
- **Incoming**: Task → Blocker (hasBlockers), User → Blocker (created)
- **Outgoing**: None

**Used By Features**: 02 (AI Daily Checkin), 19 (Risk & Issues Management)

**Example**:
```json
{
  "id": "blocker_1730342400000_abc123",
  "taskId": "task-123",
  "userId": "user-1",
  "description": "API credentials missing for OAuth integration",
  "severity": "high",
  "status": "open",
  "createdAt": "2025-10-31T12:00:00Z",
  "updatedAt": "2025-10-31T12:00:00Z"
}
```

---

### CapacityEvent

**Purpose**: Team member availability event (PTO, holiday, training) impacting capacity planning

**Node ID**: `core-capacity-event`
**Table Name**: `{schema}-core-capacity-event`
**Domain**: Planning
**Icon**: CalendarDays
**Color**: #06b6d4

**Properties**:
```typescript
interface CapacityEvent {
  id: string;
  userId: string;
  spaceId: string;
  eventType: 'pto' | 'holiday' | 'training' | 'meeting' | 'reduced-capacity';
  startDate: string;
  endDate: string;
  impactHours?: number;
  impactPercentage?: number;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
  approvedBy?: string;
  createdAt: string;
  updatedAt: string;
}
```

**Indexes**:
- `userId-startDate-index` (GSI): hashKey=userId, rangeKey=startDate
- `spaceId-startDate-index` (GSI): hashKey=spaceId, rangeKey=startDate

**Relationships**:
- **Incoming**: User → CapacityEvent (has), Space → CapacityEvent (impacts)
- **Outgoing**: None

**Used By Features**: 12 (Capacity Planning)

**Example**:
```json
{
  "id": "capacity_1730342400000_abc123",
  "userId": "user-1",
  "spaceId": "space-1",
  "eventType": "pto",
  "startDate": "2025-11-01",
  "endDate": "2025-11-05",
  "impactHours": 40,
  "status": "approved",
  "notes": "Vacation",
  "approvedBy": "manager-1",
  "createdAt": "2025-10-31T12:00:00Z",
  "updatedAt": "2025-10-31T14:00:00Z"
}
```

---

### InvestmentAllocation

**Purpose**: Budget allocation to workstream or strategic theme for portfolio investment tracking

**Node ID**: `core-investment-allocation`
**Table Name**: `{schema}-core-investment-allocation`
**Domain**: Financial
**Icon**: PieChart
**Color**: #8b5cf6

**Properties**:
```typescript
interface InvestmentAllocation {
  id: string;
  spaceId: string;
  fiscalYear: string;
  workstreamId?: string;
  theme?: string;
  allocatedAmount: number;
  spentAmount?: number;
  forecastAmount?: number;
  roi?: number;
  valueDelivered?: string;
  status: 'planned' | 'active' | 'complete';
  createdAt: string;
  updatedAt: string;
}
```

**Indexes**:
- `spaceId-fiscalYear-index` (GSI): hashKey=spaceId, rangeKey=fiscalYear
- `theme-index` (GSI): hashKey=theme

**Relationships**:
- **Incoming**: Space → InvestmentAllocation (hasAllocations), Workstream → InvestmentAllocation (funded by)
- **Outgoing**: None

**Used By Features**: 17 (Investment Allocation), 21 (Financial Dashboard)

**Example**:
```json
{
  "id": "invest_1730342400000_abc123",
  "spaceId": "space-1",
  "fiscalYear": "FY2025",
  "workstreamId": "workstream-1",
  "theme": "Platform Modernization",
  "allocatedAmount": 500000,
  "spentAmount": 320000,
  "forecastAmount": 480000,
  "roi": 15.5,
  "valueDelivered": "Migrated 80% of legacy services",
  "status": "active",
  "createdAt": "2025-01-01T00:00:00Z",
  "updatedAt": "2025-10-31T12:00:00Z"
}
```

---

### Objective

**Purpose**: Strategic objective with measurable key results (OKR) for goal tracking

**Node ID**: `core-objective`
**Table Name**: `{schema}-core-objective`
**Domain**: Strategy
**Icon**: Target
**Color**: #3b82f6

**Properties**:
```typescript
interface Objective {
  id: string;
  spaceId: string;
  parentObjectiveId?: string;
  title: string;
  description?: string;
  ownerId: string;
  quarter: string; // "2025-Q1"
  status: 'draft' | 'active' | 'completed' | 'cancelled' | 'missed';
  progress: number; // 0-100
  confidenceLevel?: 'on-track' | 'at-risk' | 'off-track';
  keyResults: Array<{
    id: string;
    description: string;
    metric: string;
    startValue: number;
    targetValue: number;
    currentValue: number;
    unit: string;
    progress: number;
  }>;
  linkedWorkstreams?: string[];
  linkedFeatures?: string[];
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}
```

**Indexes**:
- `spaceId-quarter-index` (GSI): hashKey=spaceId, rangeKey=quarter
- `ownerId-status-index` (GSI): hashKey=ownerId, rangeKey=status
- `quarter-status-index` (GSI): hashKey=quarter, rangeKey=status

**Relationships**:
- **Incoming**: Space → Objective (hasObjectives), User → Objective (owns), Objective → Objective (cascades to)
- **Outgoing**: Objective → OKRCheckIn (hasCheckIns), Objective → Workstream (linked to), Objective → Feature (linked to)

**Used By Features**: 16 (Objective Tracking), 14 (Portfolio Dashboard), 20 (Strategic Reports)

**Example**:
```json
{
  "id": "objective_1730342400000_abc123",
  "spaceId": "space-1",
  "title": "Launch new customer portal",
  "description": "Deliver self-service portal for customers",
  "ownerId": "exec-1",
  "quarter": "2025-Q4",
  "status": "active",
  "progress": 65,
  "confidenceLevel": "on-track",
  "keyResults": [
    {
      "id": "kr-1",
      "description": "Achieve 80% customer adoption",
      "metric": "adoption_rate",
      "startValue": 0,
      "targetValue": 80,
      "currentValue": 52,
      "unit": "%",
      "progress": 65
    }
  ],
  "linkedWorkstreams": ["workstream-1"],
  "tags": ["customer-experience"],
  "createdAt": "2025-10-01T00:00:00Z",
  "updatedAt": "2025-10-31T12:00:00Z"
}
```

---

### OKRCheckIn

**Purpose**: Weekly check-in update for objective progress tracking

**Node ID**: `core-okr-checkin`
**Table Name**: `{schema}-core-okr-checkin`
**Domain**: Strategy
**Icon**: CheckSquare
**Color**: #10b981

**Properties**:
```typescript
interface OKRCheckIn {
  id: string;
  objectiveId: string;
  userId: string;
  weekEnding: string;
  progress?: number;
  confidenceLevel?: 'on-track' | 'at-risk' | 'off-track';
  accomplishments?: string;
  blockers?: string;
  nextSteps?: string;
  keyResultUpdates?: Array<{
    keyResultId: string;
    newValue: number;
    notes?: string;
  }>;
  createdAt: string;
}
```

**Indexes**:
- `objectiveId-weekEnding-index` (GSI): hashKey=objectiveId, rangeKey=weekEnding
- `userId-weekEnding-index` (GSI): hashKey=userId, rangeKey=weekEnding

**Relationships**:
- **Incoming**: Objective → OKRCheckIn (hasCheckIns), User → OKRCheckIn (submitted)
- **Outgoing**: None

**Used By Features**: 16 (Objective Tracking)

**Example**:
```json
{
  "id": "checkin_1730342400000_abc123",
  "objectiveId": "objective_abc123",
  "userId": "exec-1",
  "weekEnding": "2025-11-01",
  "progress": 65,
  "confidenceLevel": "on-track",
  "accomplishments": "Completed user testing with 50 customers",
  "blockers": "None",
  "nextSteps": "Launch marketing campaign",
  "keyResultUpdates": [
    {
      "keyResultId": "kr-1",
      "newValue": 52,
      "notes": "Adoption increasing week over week"
    }
  ],
  "createdAt": "2025-10-31T12:00:00Z"
}
```

---

### PortfolioDashboardConfig

**Purpose**: User-specific portfolio dashboard configuration for widget layout and filters

**Node ID**: `core-portfolio-dashboard-config`
**Table Name**: `{schema}-core-portfolio-dashboard-config`
**Domain**: Executive
**Icon**: LayoutDashboard
**Color**: #8b5cf6

**Properties**:
```typescript
interface PortfolioDashboardConfig {
  id: string;
  userId: string;
  widgets: Array<{
    id: string;
    type: 'spaces' | 'okrs' | 'risks' | 'budget' | 'velocity';
    position: { x: number; y: number };
    size: { width: number; height: number };
    config: any;
  }>;
  filters: {
    spaceIds?: string[];
    healthStatus?: string[];
    dateRange?: { start: string; end: string };
  };
  createdAt: string;
  updatedAt: string;
}
```

**Indexes**:
- `userId-index` (GSI): hashKey=userId

**Relationships**:
- **Incoming**: User → PortfolioDashboardConfig (hasConfig)
- **Outgoing**: None

**Used By Features**: 14 (Portfolio Dashboard)

**Example**:
```json
{
  "id": "config_1730342400000_abc123",
  "userId": "exec-1",
  "widgets": [
    {
      "id": "widget-1",
      "type": "spaces",
      "position": { "x": 0, "y": 0 },
      "size": { "width": 6, "height": 4 },
      "config": { "sortBy": "health" }
    }
  ],
  "filters": {
    "healthStatus": ["red", "yellow"]
  },
  "createdAt": "2025-10-31T12:00:00Z",
  "updatedAt": "2025-10-31T12:00:00Z"
}
```

---

### Request

**Purpose**: Incoming work request requiring triage and routing to appropriate workstreams

**Node ID**: `core-request`
**Table Name**: `{schema}-core-request`
**Domain**: Workflow
**Icon**: Inbox
**Color**: #f59e0b

**Properties**:
```typescript
interface Request {
  id: string;
  spaceId: string;
  title: string;
  description?: string;
  source: 'email' | 'form' | 'chat' | 'api' | 'manual';
  status: 'new' | 'triaged' | 'converted' | 'rejected' | 'duplicate';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  requestorId?: string;
  requestorEmail?: string;
  assignedTo?: string;
  workstreamId?: string;

  // AI-generated fields
  aiSummary?: string;
  aiCategory?: 'feature' | 'bug' | 'task' | 'question' | 'support';
  aiPriority?: 'low' | 'medium' | 'high' | 'critical';
  aiRecommendedAssignee?: string;
  aiConfidence?: number;

  // Conversion tracking
  convertedToType?: 'task' | 'feature' | 'workstream';
  convertedToId?: string;

  tags?: string[];
  attachments?: any[];
  createdAt: string;
  updatedAt: string;
  triagedAt?: string;
  triagedBy?: string;
}
```

**Indexes**:
- `spaceId-status-index` (GSI): hashKey=spaceId, rangeKey=status
- `assignedTo-status-index` (GSI): hashKey=assignedTo, rangeKey=status
- `status-createdAt-index` (GSI): hashKey=status, rangeKey=createdAt

**Relationships**:
- **Incoming**: Space → Request (receives), User → Request (submitted/assigned)
- **Outgoing**: Request → Task (converts to), Request → Feature (converts to), Request → Workstream (routes to)

**Used By Features**: 08 (Request Inbox), 36 (AI Request Intake)

**Example**:
```json
{
  "id": "request_1730342400000_abc123",
  "spaceId": "space-1",
  "title": "Add OAuth2 authentication",
  "description": "Need to implement OAuth2 login flow for Google and Microsoft",
  "source": "email",
  "status": "new",
  "priority": "high",
  "requestorEmail": "customer@example.com",
  "aiSummary": "Request to add OAuth2 authentication with Google and Microsoft providers",
  "aiCategory": "feature",
  "aiPriority": "high",
  "aiConfidence": 0.92,
  "createdAt": "2025-10-31T12:00:00Z",
  "updatedAt": "2025-10-31T12:00:00Z"
}
```

---

### ReportTemplate

**Purpose**: Reusable report template definition for automated strategic report generation

**Node ID**: `core-report-template`
**Table Name**: `{schema}-core-report-template`
**Domain**: Reporting
**Icon**: FileText
**Color**: #6366f1

**Properties**:
```typescript
interface ReportTemplate {
  id: string;
  name: string;
  description?: string;
  sections: Array<{
    type: 'summary' | 'okrs' | 'risks' | 'budget' | 'progress' | 'custom';
    title: string;
    config: any;
  }>;
  schedule?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'manual';
  recipients?: string[];
  format: 'pdf' | 'pptx' | 'docx';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
```

**Indexes**:
- `createdBy-index` (GSI): hashKey=createdBy

**Relationships**:
- **Incoming**: User → ReportTemplate (created)
- **Outgoing**: None

**Used By Features**: 20 (Strategic Reports)

**Example**:
```json
{
  "id": "template_1730342400000_abc123",
  "name": "Weekly Executive Summary",
  "description": "Weekly portfolio summary for executives",
  "sections": [
    { "type": "summary", "title": "Portfolio Overview", "config": {} },
    { "type": "okrs", "title": "OKR Progress", "config": { "showTrends": true } },
    { "type": "risks", "title": "Top Risks", "config": { "limit": 10 } }
  ],
  "schedule": "weekly",
  "recipients": ["exec-1", "exec-2"],
  "format": "pptx",
  "createdBy": "exec-1",
  "createdAt": "2025-10-31T12:00:00Z",
  "updatedAt": "2025-10-31T12:00:00Z"
}
```

---

### Risk

**Purpose**: Identified risk or issue with mitigation plan and severity tracking

**Node ID**: `core-risk`
**Table Name**: `{schema}-core-risk`
**Domain**: Governance
**Icon**: AlertTriangle
**Color**: #ef4444

**Properties**:
```typescript
interface Risk {
  id: string;
  spaceId: string;
  workstreamId?: string;
  title: string;
  description?: string;
  type: 'risk' | 'issue';
  category?: 'technical' | 'resource' | 'schedule' | 'budget' | 'external';
  severity: 'low' | 'medium' | 'high' | 'critical';
  probability?: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'mitigating' | 'resolved' | 'accepted';
  ownerId: string;
  mitigationPlan?: string;
  mitigationActions?: string[];
  identifiedDate: string;
  targetResolutionDate?: string;
  resolvedDate?: string;
  escalated?: boolean;
  escalatedTo?: string;
  createdAt: string;
  updatedAt: string;
}
```

**Indexes**:
- `spaceId-severity-index` (GSI): hashKey=spaceId, rangeKey=severity
- `ownerId-status-index` (GSI): hashKey=ownerId, rangeKey=status
- `workstreamId-status-index` (GSI): hashKey=workstreamId, rangeKey=status

**Relationships**:
- **Incoming**: Space → Risk (has), Workstream → Risk (impacts), User → Risk (owns)
- **Outgoing**: None

**Used By Features**: 19 (Risk & Issues Management), 14 (Portfolio Dashboard), 20 (Strategic Reports)

**Example**:
```json
{
  "id": "risk_1730342400000_abc123",
  "spaceId": "space-1",
  "workstreamId": "workstream-1",
  "title": "Third-party API instability",
  "description": "OAuth provider experiencing frequent outages",
  "type": "risk",
  "category": "external",
  "severity": "high",
  "probability": "medium",
  "impact": "high",
  "status": "mitigating",
  "ownerId": "manager-1",
  "mitigationPlan": "Implement fallback authentication method",
  "mitigationActions": ["Research alternative providers", "Implement retry logic"],
  "identifiedDate": "2025-10-15",
  "targetResolutionDate": "2025-11-15",
  "createdAt": "2025-10-15T12:00:00Z",
  "updatedAt": "2025-10-31T12:00:00Z"
}
```

---

### RoadmapItem

**Purpose**: Strategic roadmap item (capability, initiative, milestone) for long-term planning

**Node ID**: `core-roadmap-item`
**Table Name**: `{schema}-core-roadmap-item`
**Domain**: Planning
**Icon**: Map
**Color**: #f59e0b

**Properties**:
```typescript
interface RoadmapItem {
  id: string;
  spaceId: string;
  type: 'capability' | 'feature' | 'initiative' | 'milestone';
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  status?: 'planned' | 'in-progress' | 'delivered' | 'cancelled';
  theme?: string;
  workstreamId?: string;
  featureId?: string;
  dependencies?: string[];
  blockedBy?: string[];
  confidenceLevel?: 'low' | 'medium' | 'high';
  resourcesRequired?: number;
  color?: string;
  createdAt: string;
  updatedAt: string;
}
```

**Indexes**:
- `spaceId-startDate-index` (GSI): hashKey=spaceId, rangeKey=startDate
- `theme-startDate-index` (GSI): hashKey=theme, rangeKey=startDate

**Relationships**:
- **Incoming**: Space → RoadmapItem (hasRoadmapItems), Workstream → RoadmapItem (includes), Feature → RoadmapItem (represented by)
- **Outgoing**: RoadmapItem → RoadmapItem (depends on/blocks)

**Used By Features**: 15 (Capability Roadmap)

**Example**:
```json
{
  "id": "roadmap_1730342400000_abc123",
  "spaceId": "space-1",
  "type": "capability",
  "title": "Multi-tenant Architecture",
  "description": "Implement multi-tenant data isolation and access control",
  "startDate": "2025-11-01",
  "endDate": "2026-02-28",
  "status": "planned",
  "theme": "Platform Scalability",
  "workstreamId": "workstream-1",
  "confidenceLevel": "medium",
  "resourcesRequired": 3,
  "color": "#3b82f6",
  "createdAt": "2025-10-31T12:00:00Z",
  "updatedAt": "2025-10-31T12:00:00Z"
}
```

---

### Space

**Purpose**: Top-level organizational unit representing a product, service, or support area

**Node ID**: `core-space`
**Table Name**: `{schema}-core-space`
**Domain**: Organization
**Icon**: Layers
**Color**: #3b82f6

**Properties**:
```typescript
interface Space {
  id: string;
  name: string;
  description?: string;
  type: 'product' | 'service' | 'support';
  status: 'active' | 'archived';
  health?: 'green' | 'yellow' | 'red';
  progress?: number; // 0-100
  ownerId: string;
  teamMemberIds?: string[];
  contractId?: string;
  totalBudget?: number;
  spentBudget?: number;
  tags?: string[];
  settings?: any;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  active: string; // "true" or "false"
}
```

**Indexes**:
- `ownerId-index` (GSI): hashKey=ownerId
- `status-index` (GSI): hashKey=status
- `type-index` (GSI): hashKey=type

**Relationships**:
- **Incoming**: User → Space (owns/member), Contract → Space (funds)
- **Outgoing**: Space → Workstream (contains), Space → Request (receives), Space → Objective (hasObjectives), Space → Risk (hasRisks), Space → InvestmentAllocation (hasAllocations)

**Used By Features**: All features (28-33 for management, others for scoping)

**Example**:
```json
{
  "id": "space_1730342400000_abc123",
  "name": "Customer Portal",
  "description": "Self-service customer portal and mobile app",
  "type": "product",
  "status": "active",
  "health": "green",
  "progress": 75,
  "ownerId": "manager-1",
  "teamMemberIds": ["user-1", "user-2", "user-3"],
  "totalBudget": 1000000,
  "spentBudget": 750000,
  "tags": ["customer-facing", "high-priority"],
  "createdAt": "2025-01-01T00:00:00Z",
  "updatedAt": "2025-10-31T12:00:00Z",
  "createdBy": "exec-1",
  "active": "true"
}
```

---

### Sprint

**Purpose**: Time-boxed iteration for completing work with capacity planning and velocity tracking

**Node ID**: `core-sprint`
**Table Name**: `{schema}-core-sprint`
**Domain**: Workflow
**Icon**: Calendar
**Color**: #8b5cf6

**Properties**:
```typescript
interface Sprint {
  id: string;
  spaceId: string;
  workstreamId?: string;
  name: string;
  goal?: string;
  startDate: string;
  endDate: string;
  duration?: number;
  status: 'planning' | 'active' | 'completed' | 'cancelled';

  // Capacity
  plannedCapacity?: number;
  committedPoints?: number;
  committedHours?: number;

  // Velocity
  completedPoints?: number;
  completedHours?: number;
  velocity?: number;

  // Team
  teamMembers?: Array<{
    userId: string;
    capacity: number;
    allocation: number;
  }>;

  tags?: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  startedAt?: string;
  completedAt?: string;
}
```

**Indexes**:
- `spaceId-startDate-index` (GSI): hashKey=spaceId, rangeKey=startDate
- `status-startDate-index` (GSI): hashKey=status, rangeKey=startDate
- `workstreamId-startDate-index` (GSI): hashKey=workstreamId, rangeKey=startDate

**Relationships**:
- **Incoming**: Space → Sprint (hasSprints), Workstream → Sprint (executes via), Team → Sprint (works in)
- **Outgoing**: Sprint → Task (contains)

**Used By Features**: 07 (Team Dashboard), 10 (Sprint Planning), 11 (Team Board), 12 (Capacity Planning)

**Example**:
```json
{
  "id": "sprint_1730342400000_abc123",
  "spaceId": "space-1",
  "workstreamId": "workstream-1",
  "name": "Sprint 42",
  "goal": "Complete OAuth integration and user dashboard",
  "startDate": "2025-11-01",
  "endDate": "2025-11-14",
  "duration": 14,
  "status": "active",
  "plannedCapacity": 160,
  "committedPoints": 21,
  "committedHours": 140,
  "completedPoints": 13,
  "completedHours": 89,
  "velocity": 19,
  "teamMembers": [
    { "userId": "user-1", "capacity": 80, "allocation": 1.0 },
    { "userId": "user-2", "capacity": 80, "allocation": 1.0 }
  ],
  "createdAt": "2025-10-25T12:00:00Z",
  "updatedAt": "2025-10-31T12:00:00Z",
  "createdBy": "manager-1",
  "startedAt": "2025-11-01T00:00:00Z"
}
```

---

### Task

**Purpose**: Work item to be completed by a user, assignable to sprints and features

**Node ID**: `core-task`
**Table Name**: `{schema}-core-task`
**Domain**: Work Management
**Icon**: CheckSquare
**Color**: #10b981

**Properties**:
```typescript
interface Task {
  id: string;
  spaceId: string;
  userStoryId?: string;
  featureId?: string;
  workstreamId?: string;
  sprintId?: string;
  assignee: string;
  title: string;
  description?: string;
  status: 'backlog' | 'ready' | 'todo' | 'in-progress' | 'review' | 'blocked' | 'done' | 'completed';
  priority: 'critical' | 'high' | 'medium' | 'low';
  dueDate?: string;
  blockerReason?: string;
  estimatedHours?: number;
  actualHours?: number;
  storyPoints?: number;
  backlogRank?: number;
  backlogRankUpdatedAt?: string;
  backlogRankUpdatedBy?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}
```

**Indexes**:
- `assignee-status-index` (GSI): hashKey=assignee, rangeKey=status
- `spaceId-status-index` (GSI): hashKey=spaceId, rangeKey=status
- `sprintId-status-index` (GSI): hashKey=sprintId, rangeKey=status
- `featureId-status-index` (GSI): hashKey=featureId, rangeKey=status

**Relationships**:
- **Incoming**: User → Task (assignedTo), Space → Task (contains), Sprint → Task (contains), Feature → Task (implements), Workstream → Task (includes)
- **Outgoing**: Task → TimeEntry (hasTimeEntries), Task → Blocker (hasBlockers), Task → Task (blocks/depends on)

**Used By Features**: 01 (Home Dashboard), 02 (AI Daily Checkin), 03 (Task Board), 04 (Time Tracking), 05 (Quick Task Entry), 09 (Backlog Management), 11 (Team Board)

**Example**:
```json
{
  "id": "task_1730342400000_abc123",
  "spaceId": "space-1",
  "featureId": "feature-1",
  "sprintId": "sprint-1",
  "assignee": "user-1",
  "title": "Implement OAuth2 login flow",
  "description": "Add Google and Microsoft OAuth2 authentication",
  "status": "in-progress",
  "priority": "high",
  "dueDate": "2025-11-05",
  "estimatedHours": 16,
  "actualHours": 10,
  "storyPoints": 5,
  "tags": ["authentication", "security"],
  "createdAt": "2025-10-25T12:00:00Z",
  "updatedAt": "2025-10-31T12:00:00Z",
  "createdBy": "manager-1"
}
```

---

### Team

**Purpose**: Group of users working together on spaces and workstreams

**Node ID**: `core-team`
**Table Name**: `{schema}-core-team`
**Domain**: Work Management
**Icon**: Users
**Color**: #3b82f6

**Properties**:
```typescript
interface Team {
  id: string;
  name: string;
  memberIds: string[];
  managerId: string;
  spaceIds?: string[];
  description?: string;
  createdAt: string;
  updatedAt: string;
}
```

**Indexes**:
- `managerId-index` (GSI): hashKey=managerId

**Relationships**:
- **Incoming**: User → Team (manages/member of), Space → Team (assigned to)
- **Outgoing**: Team → Sprint (works in)

**Used By Features**: 07 (Team Dashboard), 11 (Team Board), 12 (Capacity Planning)

**Example**:
```json
{
  "id": "team_1730342400000_abc123",
  "name": "Platform Engineering",
  "memberIds": ["user-1", "user-2", "user-3"],
  "managerId": "manager-1",
  "spaceIds": ["space-1", "space-2"],
  "description": "Core platform development team",
  "createdAt": "2025-01-01T00:00:00Z",
  "updatedAt": "2025-10-31T12:00:00Z"
}
```

---

### TimeEntry

**Purpose**: Logged work hours for a task with date tracking

**Node ID**: `core-time-entry`
**Table Name**: `{schema}-core-time-entry`
**Domain**: Work Management
**Icon**: Clock
**Color**: #10b981

**Properties**:
```typescript
interface TimeEntry {
  id: string;
  userId: string;
  taskId: string;
  date: string; // YYYY-MM-DD
  hours: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
}
```

**Indexes**:
- `userId-date-index` (GSI): hashKey=userId, rangeKey=date
- `taskId-date-index` (GSI): hashKey=taskId, rangeKey=date

**Relationships**:
- **Incoming**: User → TimeEntry (logged), Task → TimeEntry (hasTimeEntries)
- **Outgoing**: None

**Used By Features**: 01 (Home Dashboard), 02 (AI Daily Checkin), 04 (Time Tracking), 13 (Time Approval)

**Example**:
```json
{
  "id": "time_1730342400000_abc123",
  "userId": "user-1",
  "taskId": "task-123",
  "date": "2025-10-31",
  "hours": 4.5,
  "description": "Implemented OAuth2 callback handler",
  "createdAt": "2025-10-31T18:00:00Z",
  "updatedAt": "2025-10-31T18:00:00Z"
}
```

---

### TimerSession

**Purpose**: Active or historical timer session for automatic time tracking

**Node ID**: `core-timer-session`
**Table Name**: `{schema}-core-timer-session`
**Domain**: Work Management
**Icon**: Timer
**Color**: #f59e0b

**Properties**:
```typescript
interface TimerSession {
  id: string;
  userId: string;
  taskId: string;
  startTime: string;
  endTime?: string;
  status: 'running' | 'paused' | 'stopped';
  elapsedSeconds: number;
  createdAt: string;
  updatedAt: string;
}
```

**Indexes**:
- `userId-status-index` (GSI): hashKey=userId, rangeKey=status

**Relationships**:
- **Incoming**: User → TimerSession (has), Task → TimerSession (tracks)
- **Outgoing**: None

**Used By Features**: 04 (Time Tracking)

**Example**:
```json
{
  "id": "timer_1730342400000_abc123",
  "userId": "user-1",
  "taskId": "task-123",
  "startTime": "2025-10-31T14:00:00Z",
  "endTime": "2025-10-31T18:00:00Z",
  "status": "stopped",
  "elapsedSeconds": 14400,
  "createdAt": "2025-10-31T14:00:00Z",
  "updatedAt": "2025-10-31T18:00:00Z"
}
```

---

### Timesheet

**Purpose**: Time entry submission for work performed during a specific week

**Node ID**: `core-timesheet`
**Table Name**: `{schema}-core-timesheet`
**Domain**: Workflow
**Icon**: Clock
**Color**: #10b981

**Properties**:
```typescript
interface Timesheet {
  id: string;
  userId: string;
  spaceId: string;
  weekEnding: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'locked';
  entries: Array<{
    date: string;
    taskId: string;
    hours: number;
    notes?: string;
  }>;
  totalHours?: number;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  submittedAt?: string;
  createdAt: string;
  updatedAt: string;
}
```

**Indexes**:
- `userId-weekEnding-index` (GSI): hashKey=userId, rangeKey=weekEnding
- `spaceId-status-index` (GSI): hashKey=spaceId, rangeKey=status

**Relationships**:
- **Incoming**: User → Timesheet (submits), Space → Timesheet (approves for)
- **Outgoing**: None

**Used By Features**: 13 (Time Approval)

**Example**:
```json
{
  "id": "timesheet_1730342400000_abc123",
  "userId": "user-1",
  "spaceId": "space-1",
  "weekEnding": "2025-11-01",
  "status": "submitted",
  "entries": [
    { "date": "2025-10-28", "taskId": "task-123", "hours": 8, "notes": "OAuth implementation" },
    { "date": "2025-10-29", "taskId": "task-123", "hours": 6, "notes": "Testing and bug fixes" }
  ],
  "totalHours": 40,
  "submittedAt": "2025-11-01T17:00:00Z",
  "createdAt": "2025-10-28T09:00:00Z",
  "updatedAt": "2025-11-01T17:00:00Z"
}
```

---

### User

**Purpose**: Platform user with authentication, roles, and team membership

**Node ID**: `core-user`
**Table Name**: `{schema}-core-user`
**Domain**: Identity
**Icon**: User
**Color**: #3b82f6

**Properties**:
```typescript
interface User {
  id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  role: 'admin' | 'executive' | 'manager' | 'technical';
  teamIds?: string[];
  workHoursPerWeek?: number;
  hoursPerDay?: number;
  timezone?: string;
  settings?: any;
  active: string;
  createdAt: string;
  updatedAt: string;
}
```

**Indexes**:
- `email-index` (GSI): hashKey=email
- `role-index` (GSI): hashKey=role

**Relationships**:
- **Incoming**: None (root entity)
- **Outgoing**: User → Task (assignedTo), User → Space (owns/member), User → Team (member of), User → TimeEntry (logged), User → AgentThread (has), User → Activity (performed), User → Objective (owns), User → Risk (owns)

**Used By Features**: All features (authentication and assignment)

**Example**:
```json
{
  "id": "user_1730342400000_abc123",
  "email": "john.doe@example.com",
  "name": "John Doe",
  "firstName": "John",
  "lastName": "Doe",
  "avatar": "https://avatar.url/john.jpg",
  "role": "technical",
  "teamIds": ["team-1"],
  "workHoursPerWeek": 40,
  "hoursPerDay": 8,
  "timezone": "America/New_York",
  "active": "true",
  "createdAt": "2025-01-01T00:00:00Z",
  "updatedAt": "2025-10-31T12:00:00Z"
}
```

---

## Relationship Catalog

### Activity Relationships

| Source | Target | Relation | Cardinality | Foreign Key | Description |
|--------|--------|----------|-------------|-------------|-------------|
| User | Activity | performed | one-to-many | userId | User performs activities |

### AgentMessage Relationships

| Source | Target | Relation | Cardinality | Foreign Key | Description |
|--------|--------|----------|-------------|-------------|-------------|
| AgentThread | AgentMessage | hasMessages | one-to-many | threadId | Thread contains messages |

### AgentThread Relationships

| Source | Target | Relation | Cardinality | Foreign Key | Description |
|--------|--------|----------|-------------|-------------|-------------|
| User | AgentThread | hasThreads | one-to-many | userId | User has conversation threads |
| AgentThread | AgentMessage | hasMessages | one-to-many | threadId | Thread contains messages |

### Blocker Relationships

| Source | Target | Relation | Cardinality | Foreign Key | Description |
|--------|--------|----------|-------------|-------------|-------------|
| Task | Blocker | hasBlockers | one-to-many | taskId | Task has blockers |
| User | Blocker | created | one-to-many | userId | User creates blockers |

### CapacityEvent Relationships

| Source | Target | Relation | Cardinality | Foreign Key | Description |
|--------|--------|----------|-------------|-------------|-------------|
| User | CapacityEvent | has | one-to-many | userId | User has capacity events |
| Space | CapacityEvent | impacts | one-to-many | spaceId | Space impacted by capacity events |

### InvestmentAllocation Relationships

| Source | Target | Relation | Cardinality | Foreign Key | Description |
|--------|--------|----------|-------------|-------------|-------------|
| Space | InvestmentAllocation | hasAllocations | one-to-many | spaceId | Space has budget allocations |
| Workstream | InvestmentAllocation | fundedBy | many-to-one | workstreamId | Workstream funded by allocation |

### Objective Relationships

| Source | Target | Relation | Cardinality | Foreign Key | Description |
|--------|--------|----------|-------------|-------------|-------------|
| Space | Objective | hasObjectives | one-to-many | spaceId | Space has strategic objectives |
| User | Objective | owns | one-to-many | ownerId | User owns objectives |
| Objective | Objective | cascadesTo | one-to-many | parentObjectiveId | Parent objective cascades to children |
| Objective | OKRCheckIn | hasCheckIns | one-to-many | objectiveId | Objective has weekly check-ins |
| Objective | Workstream | linkedTo | many-to-many | linkedWorkstreams | Objective linked to workstreams |
| Objective | Feature | linkedTo | many-to-many | linkedFeatures | Objective linked to features |

### OKRCheckIn Relationships

| Source | Target | Relation | Cardinality | Foreign Key | Description |
|--------|--------|----------|-------------|-------------|-------------|
| Objective | OKRCheckIn | hasCheckIns | one-to-many | objectiveId | Objective has check-ins |
| User | OKRCheckIn | submitted | one-to-many | userId | User submits check-ins |

### Request Relationships

| Source | Target | Relation | Cardinality | Foreign Key | Description |
|--------|--------|----------|-------------|-------------|-------------|
| Space | Request | receives | one-to-many | spaceId | Space receives requests |
| User | Request | submitted | one-to-many | requestorId | User submits requests |
| User | Request | assigned | one-to-many | assignedTo | User triages requests |
| Request | Task | convertsTo | one-to-one | convertedToId | Request converts to task |
| Request | Feature | convertsTo | one-to-one | convertedToId | Request converts to feature |
| Request | Workstream | routesTo | many-to-one | workstreamId | Request routed to workstream |

### Risk Relationships

| Source | Target | Relation | Cardinality | Foreign Key | Description |
|--------|--------|----------|-------------|-------------|-------------|
| Space | Risk | hasRisks | one-to-many | spaceId | Space has risks |
| Workstream | Risk | impacts | one-to-many | workstreamId | Workstream impacted by risks |
| User | Risk | owns | one-to-many | ownerId | User owns risk mitigation |

### RoadmapItem Relationships

| Source | Target | Relation | Cardinality | Foreign Key | Description |
|--------|--------|----------|-------------|-------------|-------------|
| Space | RoadmapItem | hasRoadmapItems | one-to-many | spaceId | Space has roadmap items |
| Workstream | RoadmapItem | includes | one-to-many | workstreamId | Workstream includes roadmap items |
| Feature | RoadmapItem | representedBy | one-to-one | featureId | Feature represented on roadmap |
| RoadmapItem | RoadmapItem | dependsOn | many-to-many | dependencies | Roadmap item depends on others |
| RoadmapItem | RoadmapItem | blocks | many-to-many | blockedBy | Roadmap item blocked by others |

### Space Relationships

| Source | Target | Relation | Cardinality | Foreign Key | Description |
|--------|--------|----------|-------------|-------------|-------------|
| User | Space | owns | one-to-many | ownerId | User owns spaces |
| User | Space | memberOf | many-to-many | teamMemberIds | User is member of spaces |
| Space | Workstream | contains | one-to-many | spaceId | Space contains workstreams |
| Space | Request | receives | one-to-many | spaceId | Space receives requests |
| Space | Objective | hasObjectives | one-to-many | spaceId | Space has objectives |
| Space | Risk | hasRisks | one-to-many | spaceId | Space has risks |
| Space | InvestmentAllocation | hasAllocations | one-to-many | spaceId | Space has budget allocations |
| Space | Sprint | hasSprints | one-to-many | spaceId | Space has sprints |
| Space | RoadmapItem | hasRoadmapItems | one-to-many | spaceId | Space has roadmap items |
| Space | CapacityEvent | impacts | one-to-many | spaceId | Space impacted by capacity events |

### Sprint Relationships

| Source | Target | Relation | Cardinality | Foreign Key | Description |
|--------|--------|----------|-------------|-------------|-------------|
| Space | Sprint | hasSprints | one-to-many | spaceId | Space has sprints |
| Workstream | Sprint | executesVia | one-to-many | workstreamId | Workstream executes via sprints |
| Team | Sprint | worksIn | many-to-many | teamMembers | Team works in sprints |
| Sprint | Task | contains | one-to-many | sprintId | Sprint contains tasks |

### Task Relationships

| Source | Target | Relation | Cardinality | Foreign Key | Description |
|--------|--------|----------|-------------|-------------|-------------|
| User | Task | assignedTo | one-to-many | assignee | User assigned to tasks |
| Space | Task | contains | one-to-many | spaceId | Space contains tasks |
| Sprint | Task | contains | one-to-many | sprintId | Sprint contains tasks |
| Feature | Task | implements | one-to-many | featureId | Feature implemented by tasks |
| Workstream | Task | includes | one-to-many | workstreamId | Workstream includes tasks |
| Task | TimeEntry | hasTimeEntries | one-to-many | taskId | Task has time entries |
| Task | Blocker | hasBlockers | one-to-many | taskId | Task has blockers |
| Task | Task | dependsOn | many-to-many | dependencies | Task depends on other tasks |
| Task | Task | blocks | many-to-many | blockedBy | Task blocked by other tasks |

### Team Relationships

| Source | Target | Relation | Cardinality | Foreign Key | Description |
|--------|--------|----------|-------------|-------------|-------------|
| User | Team | manages | one-to-many | managerId | User manages teams |
| User | Team | memberOf | many-to-many | memberIds | User is member of teams |
| Space | Team | assignedTo | many-to-many | spaceIds | Team assigned to spaces |
| Team | Sprint | worksIn | many-to-many | teamMembers | Team works in sprints |

### TimeEntry Relationships

| Source | Target | Relation | Cardinality | Foreign Key | Description |
|--------|--------|----------|-------------|-------------|-------------|
| User | TimeEntry | logged | one-to-many | userId | User logs time entries |
| Task | TimeEntry | hasTimeEntries | one-to-many | taskId | Task has time entries |

### TimerSession Relationships

| Source | Target | Relation | Cardinality | Foreign Key | Description |
|--------|--------|----------|-------------|-------------|-------------|
| User | TimerSession | has | one-to-many | userId | User has timer sessions |
| Task | TimerSession | tracks | one-to-many | taskId | Task tracked by timer sessions |

### Timesheet Relationships

| Source | Target | Relation | Cardinality | Foreign Key | Description |
|--------|--------|----------|-------------|-------------|-------------|
| User | Timesheet | submits | one-to-many | userId | User submits timesheets |
| Space | Timesheet | approvesFor | one-to-many | spaceId | Space approves timesheets |

### User Relationships

| Source | Target | Relation | Cardinality | Foreign Key | Description |
|--------|--------|----------|-------------|-------------|-------------|
| User | Task | assignedTo | one-to-many | assignee | User assigned to tasks |
| User | Space | owns | one-to-many | ownerId | User owns spaces |
| User | Space | memberOf | many-to-many | teamMemberIds | User is member of spaces |
| User | Team | memberOf | many-to-many | memberIds | User is member of teams |
| User | Team | manages | one-to-many | managerId | User manages teams |
| User | TimeEntry | logged | one-to-many | userId | User logs time entries |
| User | AgentThread | hasThreads | one-to-many | userId | User has conversation threads |
| User | Activity | performed | one-to-many | userId | User performs activities |
| User | Objective | owns | one-to-many | ownerId | User owns objectives |
| User | Risk | owns | one-to-many | ownerId | User owns risks |
| User | Request | submitted | one-to-many | requestorId | User submits requests |
| User | TimerSession | has | one-to-many | userId | User has timer sessions |
| User | Blocker | created | one-to-many | userId | User creates blockers |
| User | CapacityEvent | has | one-to-many | userId | User has capacity events |
| User | Timesheet | submits | one-to-many | userId | User submits timesheets |
| User | OKRCheckIn | submitted | one-to-many | userId | User submits OKR check-ins |

---

## Index Strategy

### Primary Key Patterns

All entities use a simple primary key:
- **Hash Key**: `id` (string)
- **Sort Key**: None

This allows for:
- Fast lookups by ID: `GetItem(id)`
- Simple creation and updates
- Consistent access pattern

### GSI Patterns

#### User-Scoped Queries
Most entities include a `userId-*-index` for retrieving user-specific data:
- `userId-date-index`: Time-based user data (TimeEntry, CapacityEvent)
- `userId-status-index`: Status filtering (AgentThread, TimerSession)
- `userId-createdAt-index`: Chronological user data (Activity, AgentThread, Blocker)

#### Space-Scoped Queries
Space-level queries use `spaceId-*-index`:
- `spaceId-status-index`: Filter by status within space (Task, Request, Sprint)
- `spaceId-quarter-index`: Quarterly data (Objective)
- `spaceId-startDate-index`: Chronological space data (Sprint, RoadmapItem, CapacityEvent)

#### Status-Based Queries
Many entities include status indexes for workflow management:
- `status-createdAt-index`: Chronological status filtering (Request)
- `status-startDate-index`: Time-scoped status queries (Sprint)
- `quarter-status-index`: OKR status by quarter (Objective)

#### Relationship Queries
Foreign key indexes for navigating relationships:
- `taskId-*-index`: Task-related data (TimeEntry, Blocker)
- `objectiveId-*-index`: Objective-related data (OKRCheckIn)
- `threadId-*-index`: Thread-related data (AgentMessage)
- `sprintId-status-index`: Sprint tasks (Task)
- `featureId-status-index`: Feature tasks (Task)

### Query Optimization Guidelines

1. **Use appropriate index**: Always query using indexed fields to avoid scans
2. **Composite sort keys**: Use rangeKey for additional filtering (e.g., `userId` + `date`)
3. **Limit results**: Use `Limit` parameter to reduce data transfer
4. **Filter expressions**: Apply additional filters after index query for complex criteria
5. **Pagination**: Use `LastEvaluatedKey` for pagination instead of loading all items
6. **Avoid scans**: Never scan without FilterExpression; always use Query with index

**Example Query Patterns**:
```typescript
// Get user's tasks by status
query({
  IndexName: 'assignee-status-index',
  KeyConditionExpression: 'assignee = :userId AND status = :status',
  ExpressionAttributeValues: { ':userId': userId, ':status': 'in-progress' }
})

// Get space objectives for quarter
query({
  IndexName: 'spaceId-quarter-index',
  KeyConditionExpression: 'spaceId = :spaceId AND quarter = :quarter',
  ExpressionAttributeValues: { ':spaceId': spaceId, ':quarter': '2025-Q4' }
})

// Get time entries for user and date range
query({
  IndexName: 'userId-date-index',
  KeyConditionExpression: 'userId = :userId AND #date BETWEEN :start AND :end',
  ExpressionAttributeNames: { '#date': 'date' },
  ExpressionAttributeValues: {
    ':userId': userId,
    ':start': '2025-10-01',
    ':end': '2025-10-31'
  }
})
```

---

## Data Model Patterns

### Audit Fields

All entities include standard audit tracking:
```typescript
{
  createdAt: string;    // ISO 8601 timestamp of creation
  updatedAt: string;    // ISO 8601 timestamp of last update
  createdBy?: string;   // User ID who created (optional)
  updatedBy?: string;   // User ID who last updated (optional)
}
```

**Implementation**:
```typescript
const now = new Date().toISOString();
const entity = {
  ...data,
  createdAt: now,
  updatedAt: now,
  createdBy: currentUserId
};

// On update
const updated = {
  ...entity,
  updatedAt: new Date().toISOString(),
  updatedBy: currentUserId
};
```

### Soft Deletes

Entities use `active` field for soft deletes instead of hard deletes:
```typescript
{
  active: string; // "true" or "false" (DynamoDB stores as string)
}
```

**Why strings?** DynamoDB doesn't support boolean types in expressions, so we use strings.

**Implementation**:
```typescript
// Soft delete
update({
  Key: { id },
  UpdateExpression: 'SET active = :false, updatedAt = :now',
  ExpressionAttributeValues: {
    ':false': 'false',
    ':now': new Date().toISOString()
  }
});

// Query only active items
query({
  FilterExpression: 'active = :true',
  ExpressionAttributeValues: { ':true': 'true' }
});
```

### Versioning Patterns

Some entities support versioning for audit history:
```typescript
{
  version: number;      // Incremented on each update
  history?: Array<{     // Previous versions
    version: number;
    data: any;
    updatedAt: string;
    updatedBy: string;
  }>;
}
```

**Implementation**:
```typescript
// Optimistic locking
update({
  Key: { id },
  UpdateExpression: 'SET #data = :newData, version = version + :inc',
  ConditionExpression: 'version = :expectedVersion',
  ExpressionAttributeNames: { '#data': 'data' },
  ExpressionAttributeValues: {
    ':newData': updatedData,
    ':inc': 1,
    ':expectedVersion': currentVersion
  }
});
```

### Multi-Tenancy

The schema prefix enables multi-tenant deployment:
```typescript
// Development
SCHEMA=captify-dev
Table: captify-dev-core-task

// Staging
SCHEMA=captify-staging
Table: captify-staging-core-task

// Production
SCHEMA=captify
Table: captify-core-task
```

**Resolution**:
```typescript
import { resolveTableName } from '@captify-io/core/services/aws/table-resolver';

const tableName = await resolveTableName(
  'core-task',           // Short name
  process.env.SCHEMA,    // Schema prefix from environment
  credentials
);
// Returns: "captify-core-task" (or "captify-dev-core-task" in dev)
```

### Fractional Indexing (Backlog Rank)

For ordering backlog items without mass updates:
```typescript
{
  backlogRank: number;  // Fractional value for ordering
}
```

**Implementation**:
```typescript
function calculateNewRank(prevRank: number | null, nextRank: number | null): number {
  if (!prevRank && !nextRank) return 1000;
  if (!prevRank) return nextRank - 1000;
  if (!nextRank) return prevRank + 1000;
  return (prevRank + nextRank) / 2;
}

// Rebalance when ranks get too close (<0.001 apart)
async function rebalanceRanks(spaceId: string) {
  const items = await getBacklogItems(spaceId);
  items.sort((a, b) => a.backlogRank - b.backlogRank);

  const updates = items.map((item, index) => ({
    id: item.id,
    backlogRank: (index + 1) * 1000
  }));

  await batchUpdateRanks(updates);
}
```

---

## Complete Entity List

| Entity ID | TypeScript Type | Table Name | Primary Key | GSI Count | Related Entities |
|-----------|----------------|------------|-------------|-----------|------------------|
| `core-activity` | Activity | `{schema}-core-activity` | id | 3 | User |
| `core-agent-message` | AgentMessage | `{schema}-core-agent-message` | id | 1 | AgentThread |
| `core-agent-thread` | AgentThread | `{schema}-core-agent-thread` | id | 2 | User, AgentMessage |
| `core-blocker` | Blocker | `{schema}-core-blocker` | id | 2 | Task, User |
| `core-capacity-event` | CapacityEvent | `{schema}-core-capacity-event` | id | 2 | User, Space |
| `core-investment-allocation` | InvestmentAllocation | `{schema}-core-investment-allocation` | id | 2 | Space, Workstream |
| `core-objective` | Objective | `{schema}-core-objective` | id | 3 | Space, User, OKRCheckIn, Workstream, Feature |
| `core-okr-checkin` | OKRCheckIn | `{schema}-core-okr-checkin` | id | 2 | Objective, User |
| `core-portfolio-dashboard-config` | PortfolioDashboardConfig | `{schema}-core-portfolio-dashboard-config` | id | 1 | User |
| `core-request` | Request | `{schema}-core-request` | id | 3 | Space, User, Task, Feature, Workstream |
| `core-report-template` | ReportTemplate | `{schema}-core-report-template` | id | 1 | User |
| `core-risk` | Risk | `{schema}-core-risk` | id | 3 | Space, Workstream, User |
| `core-roadmap-item` | RoadmapItem | `{schema}-core-roadmap-item` | id | 2 | Space, Workstream, Feature |
| `core-space` | Space | `{schema}-core-space` | id | 3 | User, Workstream, Request, Objective, Risk, InvestmentAllocation, Sprint, RoadmapItem |
| `core-sprint` | Sprint | `{schema}-core-sprint` | id | 3 | Space, Workstream, Team, Task |
| `core-task` | Task | `{schema}-core-task` | id | 4 | User, Space, Sprint, Feature, Workstream, TimeEntry, Blocker |
| `core-team` | Team | `{schema}-core-team` | id | 1 | User, Space, Sprint |
| `core-time-entry` | TimeEntry | `{schema}-core-time-entry` | id | 2 | User, Task |
| `core-timer-session` | TimerSession | `{schema}-core-timer-session` | id | 1 | User, Task |
| `core-timesheet` | Timesheet | `{schema}-core-timesheet` | id | 2 | User, Space |
| `core-user` | User | `{schema}-core-user` | id | 2 | Task, Space, Team, TimeEntry, AgentThread, Activity, Objective, Risk, Request |

**Total Entities**: 21 core entities defined across all features

**Total Relationships**: 50+ edges connecting entities

**Total Indexes**: 46 GSIs for optimized queries

---

## Summary

This ontology reference provides a comprehensive view of the Captify Spaces data model, including:

- **21 Core Entities**: All major domain objects from User to RoadmapItem
- **50+ Relationships**: Complete mapping of edges between entities with cardinality
- **46 Global Secondary Indexes**: Optimized query patterns for all access patterns
- **Consistent Patterns**: Audit fields, soft deletes, multi-tenancy, fractional indexing
- **Table Resolution**: Dynamic resolution from short names to full table names via ontology
- **Type Safety**: TypeScript interfaces for all entities with property definitions

### Key Takeaways

1. **Ontology is the single source of truth** - all entity definitions, schemas, and relationships defined here
2. **Dynamic resolution** - use short table names (`core-task`), API resolves to full names (`captify-core-task`)
3. **Multi-tenant by design** - schema prefix enables environment isolation
4. **Index strategy** - every query uses an appropriate GSI, no table scans
5. **Audit trail** - all entities track creation, updates, and soft deletes
6. **Relationship integrity** - foreign keys and cardinality rules enforced through ontology edges

### Usage

- **Development**: Reference this document when adding new features or modifying entities
- **API Development**: Use short table names in API calls, let resolver handle full names
- **Query Optimization**: Choose appropriate indexes from the Index Strategy section
- **Type Generation**: Use ontology schemas to generate TypeScript types and Zod validators
- **UI Generation**: Use schemas to generate forms, tables, and visualizations

---

**Document Version**: 1.0
**Last Updated**: 2025-10-31
**Entities**: 21
**Relationships**: 50+
**Indexes**: 46
