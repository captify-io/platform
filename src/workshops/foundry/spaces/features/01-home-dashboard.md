# Feature 01: Home Dashboard (Technical)

**Persona**: Technical (Doers)
**Priority**: P0 - Critical
**Effort**: 8 story points

---

## Requirements

### Functional Requirements
- FR1: Display all tasks assigned to current user across all spaces
- FR2: Filter tasks by status (all, in-progress, blocked, ready, completed)
- FR3: Show visual status indicators (color + icon)
- FR4: Quick actions: Start, Complete, Block, Edit task
- FR5: Display weekly time summary
- FR6: Navigate to task detail modal

### Non-Functional Requirements
- NFR1: Dashboard loads in <1s (p95)
- NFR2: Support 100+ tasks without performance degradation
- NFR3: Mobile responsive (works on phones/tablets)
- NFR4: Accessible (WCAG 2.1 AA)

---

## Ontology

### Nodes Used
```typescript
// Primary entity
Task {
  id: string
  spaceId: string
  userStoryId?: string  // Optional - service spaces have tasks without stories
  assignee: string      // User ID
  title: string
  description: string
  status: 'ready' | 'in-progress' | 'blocked' | 'completed'
  priority: 'critical' | 'high' | 'medium' | 'low'
  dueDate?: string
  blockerReason?: string
  estimatedHours?: number
  createdAt: string
  updatedAt: string
}

// Related entities (read-only for dashboard)
Space {
  id: string
  name: string
  type: 'product' | 'service' | 'support'
}

TimeEntry {
  id: string
  userId: string
  taskId: string
  hours: number
  date: string
}
```

### Edges Used
```typescript
// User → Task (one-to-many)
{
  source: 'user',
  target: 'task',
  relation: 'assignedTo',
  type: 'one-to-many'
}

// Space → Task (one-to-many)
{
  source: 'space',
  target: 'task',
  relation: 'contains',
  type: 'one-to-many'
}

// Task → TimeEntry (one-to-many)
{
  source: 'task',
  target: 'time-entry',
  relation: 'hasTimeEntries',
  type: 'one-to-many'
}
```

### New Ontology Nodes Required
```typescript
// Add to core/services/ontology/definitions/task.ts
export const taskNode: OntologyNode = {
  id: 'core-task',
  name: 'Task',
  type: 'task',
  category: 'entity',
  domain: 'Work Management',
  description: 'Work item to be completed by a user',
  icon: 'CheckSquare',
  color: '#10b981',
  active: 'true',
  properties: {
    dataSource: 'core-task',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        spaceId: { type: 'string', required: true },
        userStoryId: { type: 'string' },
        assignee: { type: 'string', required: true },
        title: { type: 'string', required: true },
        description: { type: 'string' },
        status: {
          type: 'string',
          enum: ['ready', 'in-progress', 'blocked', 'completed'],
          required: true
        },
        priority: {
          type: 'string',
          enum: ['critical', 'high', 'medium', 'low']
        },
        dueDate: { type: 'string' },
        blockerReason: { type: 'string' },
        estimatedHours: { type: 'number' }
      }
    },
    indexes: {
      'assignee-status-index': {
        hashKey: 'assignee',
        rangeKey: 'status',
        type: 'GSI'
      },
      'spaceId-status-index': {
        hashKey: 'spaceId',
        rangeKey: 'status',
        type: 'GSI'
      }
    }
  }
}
```

---

## Components

### Reuse Existing Captify Components
```typescript
// From @captify-io/core/components/ui
import { Card, CardHeader, CardContent } from '@captify-io/core/components/ui/card'
import { Badge } from '@captify-io/core/components/ui/badge'
import { Button } from '@captify-io/core/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@captify-io/core/components/ui/tabs'
import { Skeleton } from '@captify-io/core/components/ui/skeleton'
import { Dialog, DialogContent } from '@captify-io/core/components/ui/dialog'

// From @captify-io/core/hooks
import { useSession } from '@captify-io/core/hooks'

// From @captify-io/core/lib
import { apiClient } from '@captify-io/core/lib/api'
```

### New Components to Create
```
/components/spaces/panels/technical/
  home-dashboard.tsx           # Main layout
  my-work-panel.tsx           # Task list panel
  time-summary-widget.tsx     # Weekly hours widget

/components/spaces/items/
  task-item.tsx               # Task card component (REUSABLE)
  status-badge.tsx            # Status indicator (REUSABLE)
  priority-badge.tsx          # Priority indicator (REUSABLE)

/components/spaces/dialogs/
  task-detail.tsx             # Task detail modal (REUSABLE)
  block-task.tsx              # Block reason dialog
```

---

## Actions

### API Actions
```typescript
// Service: platform.space
// Operation: listMyTasks

interface ListMyTasksRequest {
  service: 'platform.space'
  operation: 'listMyTasks'
  data: {
    userId: string
    status?: 'ready' | 'in-progress' | 'blocked' | 'completed' | 'all'
    limit?: number
    sortBy?: 'priority' | 'dueDate' | 'updatedAt'
  }
}

interface ListMyTasksResponse {
  tasks: Task[]
  total: number
}

// Implementation in /services/space/task.ts
export async function listMyTasks(
  params: { userId: string, status?: string, limit?: number },
  credentials: AwsCredentials
): Promise<Task[]> {
  const { userId, status, limit = 100 } = params

  // Query using assignee-status-index
  const queryParams: QueryCommandInput = {
    TableName: await resolveTableName('core-task', process.env.SCHEMA!, credentials),
    IndexName: 'assignee-status-index',
    KeyConditionExpression: status && status !== 'all'
      ? 'assignee = :userId AND #status = :status'
      : 'assignee = :userId',
    ExpressionAttributeNames: status && status !== 'all'
      ? { '#status': 'status' }
      : undefined,
    ExpressionAttributeValues: {
      ':userId': { S: userId },
      ...(status && status !== 'all' ? { ':status': { S: status } } : {})
    },
    Limit: limit
  }

  const result = await dynamodb.query(queryParams, credentials)
  return result.Items?.map(item => unmarshall(item)) || []
}
```

### Update Task Status Action
```typescript
// Service: platform.space
// Operation: updateTaskStatus

interface UpdateTaskStatusRequest {
  service: 'platform.space'
  operation: 'updateTaskStatus'
  data: {
    taskId: string
    status: 'ready' | 'in-progress' | 'blocked' | 'completed'
    blockerReason?: string  // Required if status = 'blocked'
  }
}

// Implementation
export async function updateTaskStatus(
  params: { taskId: string, status: string, blockerReason?: string },
  credentials: AwsCredentials
): Promise<Task> {
  const { taskId, status, blockerReason } = params

  const updateParams: UpdateItemCommandInput = {
    TableName: await resolveTableName('core-task', process.env.SCHEMA!, credentials),
    Key: { id: { S: taskId } },
    UpdateExpression: 'SET #status = :status, updatedAt = :updatedAt' +
      (blockerReason ? ', blockerReason = :blockerReason' : ''),
    ExpressionAttributeNames: { '#status': 'status' },
    ExpressionAttributeValues: {
      ':status': { S: status },
      ':updatedAt': { S: new Date().toISOString() },
      ...(blockerReason ? { ':blockerReason': { S: blockerReason } } : {})
    },
    ReturnValues: 'ALL_NEW'
  }

  const result = await dynamodb.update(updateParams, credentials)
  return unmarshall(result.Attributes!)
}
```

### Get Weekly Time Entries Action
```typescript
// Service: platform.space
// Operation: getMyTimeEntries

interface GetMyTimeEntriesRequest {
  service: 'platform.space'
  operation: 'getMyTimeEntries'
  data: {
    userId: string
    startDate: string  // ISO date
    endDate: string    // ISO date
  }
}

// Returns sum of hours for the date range
```

---

## User Stories & Tasks

### Story 1: View Assigned Tasks
**As a** technical user
**I want to** see all my assigned tasks in one place
**So that** I know what work I need to do

**Tasks**:
- [ ] Task 1.1: Create `home-dashboard.tsx` layout component
- [ ] Task 1.2: Implement `listMyTasks` service operation
- [ ] Task 1.3: Add `assignee-status-index` GSI to task table
- [ ] Task 1.4: Create `task-item.tsx` component (reusable)
- [ ] Task 1.5: Implement loading skeleton with Captify Skeleton component
- [ ] Task 1.6: Add empty state when no tasks

**Acceptance Criteria**:
- [ ] Dashboard shows all tasks assigned to user
- [ ] Tasks ordered by priority (blocked → critical → high → medium → low)
- [ ] Each task shows: title, space name, status, due date, priority
- [ ] Empty state displays helpful message

---

### Story 2: Filter by Status
**As a** technical user
**I want to** filter tasks by status
**So that** I can focus on specific work

**Tasks**:
- [ ] Task 2.1: Add Tabs component from Captify UI
- [ ] Task 2.2: Implement filter state management
- [ ] Task 2.3: Add URL parameter for filter (shareable links)
- [ ] Task 2.4: Persist filter to localStorage
- [ ] Task 2.5: Update query to filter by status

**Acceptance Criteria**:
- [ ] Tabs show counts: "In Progress (2)", "Blocked (1)", etc.
- [ ] Clicking tab filters list instantly
- [ ] Filter persists across sessions
- [ ] URL updates with filter parameter

---

### Story 3: Quick Actions
**As a** technical user
**I want to** update task status quickly
**So that** I can work efficiently

**Tasks**:
- [ ] Task 3.1: Add action buttons to task-item component
- [ ] Task 3.2: Implement `updateTaskStatus` service operation
- [ ] Task 3.3: Create `block-task.tsx` dialog using Captify Dialog
- [ ] Task 3.4: Add optimistic UI updates
- [ ] Task 3.5: Implement success animations

**Acceptance Criteria**:
- [ ] Hover shows: Start, Complete, Block buttons
- [ ] Clicking updates task immediately (optimistic)
- [ ] Block shows dialog for reason
- [ ] Success animation on completion

---

### Story 4: Weekly Time Summary
**As a** technical user
**I want to** see hours logged this week
**So that** I know if I'm on track

**Tasks**:
- [ ] Task 4.1: Create `time-summary-widget.tsx` component
- [ ] Task 4.2: Implement `getMyTimeEntries` query
- [ ] Task 4.3: Calculate weekly total
- [ ] Task 4.4: Add tooltip with daily breakdown
- [ ] Task 4.5: Link to daily checkin dialog

**Acceptance Criteria**:
- [ ] Widget shows "This week: 28 hours"
- [ ] Green/yellow/red based on target
- [ ] Tooltip shows daily breakdown
- [ ] Clicking opens daily checkin

---

## Implementation Notes

### State Management
Use React Query for data fetching:
```typescript
const { data: tasks, isLoading } = useQuery({
  queryKey: ['myTasks', userId, filter],
  queryFn: async () => {
    const response = await apiClient.run({
      service: 'platform.space',
      operation: 'listMyTasks',
      data: { userId, status: filter }
    })
    return response.tasks
  },
  refetchInterval: 30000 // Refresh every 30s
})
```

### Optimistic Updates
```typescript
const updateMutation = useMutation({
  mutationFn: async ({ taskId, status }) => {
    return apiClient.run({
      service: 'platform.space',
      operation: 'updateTaskStatus',
      data: { taskId, status }
    })
  },
  onMutate: async ({ taskId, status }) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries(['myTasks'])

    // Snapshot previous value
    const previous = queryClient.getQueryData(['myTasks'])

    // Optimistically update
    queryClient.setQueryData(['myTasks'], old =>
      old.map(t => t.id === taskId ? { ...t, status } : t)
    )

    return { previous }
  },
  onError: (err, variables, context) => {
    // Rollback on error
    queryClient.setQueryData(['myTasks'], context.previous)
  }
})
```

### Accessibility
- Keyboard navigation: Tab through tasks, Enter to open
- Screen reader: "Task: [title], Status: [status], Priority: [priority]"
- Focus indicators on all interactive elements
- Color not sole indicator (use icons + text)

---

## Testing

### Unit Tests
```typescript
describe('HomeDashboard', () => {
  it('renders loading skeleton initially', () => {
    render(<HomeDashboard />)
    expect(screen.getByTestId('task-skeleton')).toBeInTheDocument()
  })

  it('displays tasks after loading', async () => {
    render(<HomeDashboard />)
    await waitFor(() => {
      expect(screen.getByText('OAuth Integration')).toBeInTheDocument()
    })
  })

  it('filters tasks by status', async () => {
    render(<HomeDashboard />)
    fireEvent.click(screen.getByText('In Progress'))
    await waitFor(() => {
      expect(mockApiClient).toHaveBeenCalledWith({
        service: 'platform.space',
        operation: 'listMyTasks',
        data: { userId: 'test-user', status: 'in-progress' }
      })
    })
  })
})
```

### Integration Tests
```typescript
describe('Task Status Update', () => {
  it('updates status in DynamoDB', async () => {
    const result = await updateTaskStatus(
      { taskId: 'task-1', status: 'in-progress' },
      mockCredentials
    )

    expect(result.status).toBe('in-progress')
    expect(result.updatedAt).toBeDefined()
  })
})
```

---

## Dependencies
- Task ontology node (create first)
- TimeEntry ontology node (for weekly summary)
- DynamoDB table: `{schema}-core-task` with GSIs
- Captify UI components (Card, Badge, Button, Tabs, Dialog)
- React Query
- Framer Motion (animations)

---

**Status**: Ready for Implementation
**Sprint**: Phase 2, Week 3
