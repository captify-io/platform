# Feature 08: Request Inbox

**Persona:** Manager
**Priority:** High
**Effort:** Large
**Status:** Sprint 2

## Overview

AI-powered request triage and intake system that automatically categorizes, prioritizes, and routes incoming requests to appropriate workstreams and team members.

## Requirements

### Functional Requirements
1. Display all incoming requests with AI-generated summaries and classifications
2. Support bulk triage actions (assign, prioritize, convert to task/feature)
3. Filter and search requests by status, type, priority, source
4. Show AI-recommended assignments based on team capacity and expertise
5. Convert requests to tasks, features, or workstreams with one click
6. Track request lifecycle from intake to completion
7. Support request templates and quick actions

### Non-Functional Requirements
1. Load inbox view in <500ms for up to 1000 requests
2. AI classification completes within 2 seconds
3. Real-time updates when new requests arrive
4. Support keyboard shortcuts for rapid triage
5. Accessible UI with screen reader support
6. Mobile-responsive inbox view
7. Audit log for all triage decisions

## Ontology

### Nodes Used

```typescript
// Existing from Feature 01
interface Task {
  id: string;
  spaceId: string;
  featureId?: string;
  workstreamId?: string;
  title: string;
  status: 'backlog' | 'todo' | 'in-progress' | 'review' | 'done' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assigneeId?: string;
  // ... rest from Feature 01
}

// Existing from Feature 02
interface Feature {
  id: string;
  spaceId: string;
  workstreamId?: string;
  title: string;
  // ... rest from Feature 02
}
```

### Edges Used

```typescript
// request → task (converts to)
// request → feature (converts to)
// request → workstream (routes to)
// user → request (assigned)
```

### New Ontology Nodes Required

```typescript
// OntologyNode for Request
{
  id: "core-request",
  name: "Request",
  type: "request",
  category: "entity",
  domain: "Workflow",
  description: "Incoming work request requiring triage and routing",
  icon: "Inbox",
  color: "#f59e0b",
  active: "true",
  properties: {
    dataSource: "core-request",
    schema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Unique identifier" },
        spaceId: { type: "string", description: "Space this request belongs to", required: true },
        title: { type: "string", description: "Request title", required: true },
        description: { type: "string", description: "Full request description" },
        source: {
          type: "string",
          enum: ["email", "form", "chat", "api", "manual"],
          description: "How request was submitted"
        },
        status: {
          type: "string",
          enum: ["new", "triaged", "converted", "rejected", "duplicate"],
          description: "Request status",
          required: true
        },
        priority: {
          type: "string",
          enum: ["low", "medium", "high", "critical"],
          description: "Request priority"
        },
        requestorId: { type: "string", description: "User who submitted request" },
        requestorEmail: { type: "string", description: "Requestor email if external" },
        assignedTo: { type: "string", description: "User assigned to triage" },
        workstreamId: { type: "string", description: "Target workstream" },

        // AI-generated fields
        aiSummary: { type: "string", description: "AI-generated summary" },
        aiCategory: {
          type: "string",
          enum: ["feature", "bug", "task", "question", "support"],
          description: "AI classification"
        },
        aiPriority: {
          type: "string",
          enum: ["low", "medium", "high", "critical"],
          description: "AI-suggested priority"
        },
        aiRecommendedAssignee: { type: "string", description: "AI-suggested assignee" },
        aiConfidence: { type: "number", description: "AI classification confidence 0-1" },

        // Conversion tracking
        convertedToType: {
          type: "string",
          enum: ["task", "feature", "workstream"],
          description: "What this request became"
        },
        convertedToId: { type: "string", description: "ID of converted entity" },

        // Metadata
        tags: { type: "array", items: { type: "string" }, description: "Request tags" },
        attachments: {
          type: "array",
          items: { type: "object" },
          description: "File attachments"
        },

        createdAt: { type: "string", description: "Creation timestamp" },
        updatedAt: { type: "string", description: "Last update timestamp" },
        triagedAt: { type: "string", description: "When triaged" },
        triagedBy: { type: "string", description: "Who triaged" }
      },
      required: ["spaceId", "title", "status"]
    },
    indexes: {
      "spaceId-status-index": {
        hashKey: "spaceId",
        rangeKey: "status",
        type: "GSI"
      },
      "assignedTo-status-index": {
        hashKey: "assignedTo",
        rangeKey: "status",
        type: "GSI"
      },
      "status-createdAt-index": {
        hashKey: "status",
        rangeKey: "createdAt",
        type: "GSI"
      }
    }
  },
  createdAt: "2025-10-31T00:00:00Z",
  updatedAt: "2025-10-31T00:00:00Z"
}
```

## Components

### Reuse Existing Captify Components

```typescript
import { Button } from '@captify-io/core/components/ui/button';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '@captify-io/core/components/ui/table';
import { Badge } from '@captify-io/core/components/ui/badge';
import { Select } from '@captify-io/core/components/ui/select';
import { Dialog } from '@captify-io/core/components/ui/dialog';
import { Input } from '@captify-io/core/components/ui/input';
import { Textarea } from '@captify-io/core/components/ui/textarea';
import { Avatar } from '@captify-io/core/components/ui/avatar';
import { DropdownMenu } from '@captify-io/core/components/ui/dropdown-menu';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@captify-io/core/components/ui/tabs';
import { Checkbox } from '@captify-io/core/components/ui/checkbox';
```

### New Components to Create

```typescript
// /opt/captify-apps/core/src/components/spaces/features/request/inbox.tsx (REUSABLE)
export function RequestInbox({ spaceId }: { spaceId: string }) {
  // Main inbox view with filters, bulk actions, AI insights
}

// /opt/captify-apps/core/src/components/spaces/features/request/item.tsx (REUSABLE)
export function RequestItem({ request }: { request: Request }) {
  // Individual request card with AI summary, quick actions
}

// /opt/captify-apps/core/src/components/spaces/features/request/triage-dialog.tsx (REUSABLE)
export function RequestTriageDialog({ request }: { request: Request }) {
  // Dialog for triaging a request (assign, convert, reject)
}

// /opt/captify-apps/core/src/components/spaces/features/request/ai-insights.tsx (REUSABLE)
export function RequestAIInsights({ request }: { request: Request }) {
  // Display AI classification, confidence, recommendations
}

// /opt/captify-apps/core/src/components/spaces/features/request/bulk-actions.tsx (REUSABLE)
export function RequestBulkActions({ selectedIds }: { selectedIds: string[] }) {
  // Bulk triage actions toolbar
}
```

## Actions

### 1. List Requests

```typescript
interface ListRequestsRequest {
  service: 'platform.dynamodb';
  operation: 'query';
  table: 'core-request';
  data: {
    IndexName: 'spaceId-status-index';
    KeyConditionExpression: 'spaceId = :spaceId';
    FilterExpression?: 'status = :status OR priority = :priority';
    ExpressionAttributeValues: {
      ':spaceId': string;
      ':status'?: string;
      ':priority'?: string;
    };
  };
}
```

**Implementation:**
- Query by spaceId-status-index for filtered inbox views
- Support multiple filter combinations (status, priority, assignee)
- Return with AI insights for quick scanning

### 2. Classify Request with AI

```typescript
interface ClassifyRequestRequest {
  service: 'platform.bedrock';
  operation: 'invoke';
  data: {
    modelId: 'anthropic.claude-3-sonnet-20240229-v1:0';
    messages: [{
      role: 'user';
      content: string; // Request title + description
    }];
    systemPrompt: string; // Classification instructions
  };
}

interface ClassificationResult {
  category: 'feature' | 'bug' | 'task' | 'question' | 'support';
  priority: 'low' | 'medium' | 'high' | 'critical';
  summary: string;
  recommendedAssignee?: string;
  confidence: number;
  reasoning: string;
}
```

**Implementation:**
- Use Bedrock Claude to analyze request text
- Classify by category, priority, complexity
- Recommend assignee based on past similar requests
- Store AI insights in request record

### 3. Convert Request to Task/Feature

```typescript
interface ConvertRequestRequest {
  requestId: string;
  convertTo: 'task' | 'feature' | 'workstream';
  targetWorkstreamId?: string;
  additionalFields: Partial<Task | Feature>;
}

interface ConvertRequestResponse {
  success: boolean;
  convertedEntity: {
    type: string;
    id: string;
  };
  updatedRequest: Request;
}
```

**Implementation:**
- Create new Task/Feature entity with request data
- Update request status to 'converted'
- Store reference to converted entity
- Copy over AI insights and metadata

### 4. Bulk Triage Requests

```typescript
interface BulkTriageRequest {
  requestIds: string[];
  action: 'assign' | 'prioritize' | 'convert' | 'reject';
  assignTo?: string;
  priority?: string;
  convertTo?: 'task' | 'feature';
  workstreamId?: string;
}

interface BulkTriageResponse {
  successful: string[]; // Request IDs
  failed: Array<{ requestId: string; error: string }>;
}
```

**Implementation:**
- Batch update requests with DynamoDB BatchWriteItem
- Support atomic bulk operations
- Return detailed success/failure results

## User Stories & Tasks

### Story 1: Manager Views and Filters Inbox
**As a** manager,
**I want to** view all incoming requests with AI insights,
**So that** I can quickly understand what needs attention.

**Tasks:**
1. Create RequestInbox component with table view
   - Display request title, source, status, priority
   - Show AI summary and category badges
   - Include confidence indicators
2. Implement filter controls (status, priority, category)
   - Multi-select dropdowns
   - Real-time filtering
   - Persist filter state
3. Add sort functionality (date, priority, confidence)
4. Implement infinite scroll for large request lists
5. Add keyboard shortcuts (j/k navigation, x select)
6. Create responsive mobile inbox view

**Acceptance Criteria:**
- Inbox loads in <500ms with 100+ requests
- Filters update view instantly
- AI insights visible at a glance
- Keyboard navigation works smoothly

### Story 2: Manager Triages Single Request
**As a** manager,
**I want to** quickly triage a request by assigning it or converting it to a task,
**So that** work can begin immediately.

**Tasks:**
1. Create RequestTriageDialog component
   - Show full request details
   - Display AI recommendations prominently
   - Provide quick action buttons
2. Implement "Convert to Task" flow
   - Pre-fill task form with request data
   - Inherit AI priority and assignee suggestions
   - Update request status automatically
3. Implement "Convert to Feature" flow
4. Add "Assign to Team Member" action
   - Show team member availability
   - Consider workload when suggesting
5. Add "Reject Request" with reason tracking
6. Implement optimistic UI updates

**Acceptance Criteria:**
- Dialog opens in <200ms
- Conversion creates valid Task/Feature
- Request status updates correctly
- All actions are reversible

### Story 3: Manager Performs Bulk Triage
**As a** manager,
**I want to** triage multiple requests at once,
**So that** I can efficiently process large batches.

**Tasks:**
1. Add bulk selection checkboxes to inbox
   - Select all / select none
   - Select by filter (all high priority)
   - Show selection count
2. Create BulkActions toolbar
   - Assign all to user
   - Set priority for all
   - Convert all to tasks
   - Reject all with reason
3. Implement batch DynamoDB operations
   - Use BatchWriteItem for updates
   - Handle partial failures gracefully
   - Show progress indicator
4. Add undo functionality for bulk actions
5. Display success/failure summary

**Acceptance Criteria:**
- Can select and process 50+ requests
- Bulk operations complete in <5s
- Partial failures don't block success cases
- Clear feedback on operation results

### Story 4: AI Automatically Categorizes New Requests
**As a** system,
**I want to** automatically classify incoming requests,
**So that** managers can triage faster.

**Tasks:**
1. Create AI classification service
   - Integrate Bedrock Claude API
   - Design system prompt for classification
   - Extract key entities and topics
2. Implement classification on request creation
   - Trigger AI analysis asynchronously
   - Store results in request record
   - Update UI when complete
3. Track classification accuracy
   - Allow managers to override AI
   - Log corrections for model improvement
   - Calculate confidence scores
4. Add AI learning from corrections
5. Implement fallback for AI service failures

**Acceptance Criteria:**
- AI classifies requests in <2s
- >80% accuracy on category
- >70% accuracy on priority
- Graceful degradation if AI unavailable

### Story 5: Manager Searches Request History
**As a** manager,
**I want to** search past requests to find duplicates or patterns,
**So that** I can avoid duplicate work.

**Tasks:**
1. Implement full-text search across requests
   - Search title, description, AI summary
   - Return ranked results
   - Highlight matching terms
2. Add duplicate detection
   - Compare new requests to recent history
   - Flag potential duplicates
   - Suggest linking to existing work
3. Create request history view
   - Filter by date range
   - Group by category or workstream
   - Export to CSV
4. Add search suggestions and autocomplete
5. Implement saved search filters

**Acceptance Criteria:**
- Search returns results in <1s
- Duplicate detection has >70% accuracy
- Can search across all request fields
- Export includes all relevant data

## Implementation Notes

### AI Classification System Prompt

```typescript
const CLASSIFICATION_PROMPT = `You are a request triage assistant. Analyze the following work request and provide:

1. Category: feature, bug, task, question, or support
2. Priority: low, medium, high, or critical
3. Summary: One sentence describing the request
4. Recommended assignee: Based on skills required (if determinable)
5. Confidence: Your confidence in this classification (0-1)
6. Reasoning: Brief explanation of your classification

Request Title: {title}
Request Description: {description}
Context: {spaceContext}

Respond in JSON format.`;
```

### Bulk Triage Implementation

```typescript
async function bulkTriageRequests(
  requestIds: string[],
  action: BulkTriageAction,
  credentials: AwsCredentials
): Promise<BulkTriageResponse> {
  const results = { successful: [], failed: [] };

  // Batch into groups of 25 (DynamoDB limit)
  const batches = chunk(requestIds, 25);

  for (const batch of batches) {
    const updateItems = batch.map(id => ({
      PutRequest: {
        Item: {
          id,
          status: action.newStatus,
          assignedTo: action.assignTo,
          priority: action.priority,
          triagedAt: new Date().toISOString(),
          triagedBy: action.userId,
          updatedAt: new Date().toISOString()
        }
      }
    }));

    try {
      await dynamodb.batchWrite({
        table: 'core-request',
        items: updateItems
      }, credentials);
      results.successful.push(...batch);
    } catch (error) {
      results.failed.push(...batch.map(id => ({
        requestId: id,
        error: error.message
      })));
    }
  }

  return results;
}
```

## Testing

```typescript
describe('RequestInbox', () => {
  it('loads requests for space', async () => {
    const { getByText } = render(<RequestInbox spaceId="space-1" />);
    await waitFor(() => {
      expect(getByText('New Feature Request')).toBeInTheDocument();
    });
  });

  it('filters by status', async () => {
    const { getByLabelText, queryByText } = render(<RequestInbox spaceId="space-1" />);

    fireEvent.change(getByLabelText('Status'), { target: { value: 'new' } });

    await waitFor(() => {
      expect(queryByText('Triaged Request')).not.toBeInTheDocument();
      expect(queryByText('New Request')).toBeInTheDocument();
    });
  });

  it('converts request to task', async () => {
    const { getByText, getByRole } = render(<RequestInbox spaceId="space-1" />);

    fireEvent.click(getByText('Request Title'));
    fireEvent.click(getByRole('button', { name: 'Convert to Task' }));

    await waitFor(() => {
      expect(getByText('Task created successfully')).toBeInTheDocument();
    });
  });
});

describe('AI Classification', () => {
  it('classifies request with high confidence', async () => {
    const result = await classifyRequest({
      title: 'Add user authentication',
      description: 'Need OAuth2 login flow'
    });

    expect(result.category).toBe('feature');
    expect(result.priority).toBe('high');
    expect(result.confidence).toBeGreaterThan(0.8);
  });
});
```

## Dependencies

**Upstream:**
- Feature 01 (Task Management) - for converting requests to tasks
- Feature 02 (Feature Planning) - for converting requests to features
- Feature 36 (AI Request Intake) - for AI classification service

**Downstream:**
- Feature 09 (Backlog Management) - requests feed backlog
- Feature 28 (Spaces Management) - requests belong to spaces
- Feature 34 (Notifications) - notify on request status changes

## Status

- **Current Sprint:** Sprint 2
- **Status:** Not Started
- **Blocked By:** Feature 36 (AI Request Intake)
- **Next Steps:** Define AI classification model and training data
