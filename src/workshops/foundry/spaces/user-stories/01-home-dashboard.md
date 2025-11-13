# User Stories: Home Dashboard (Feature 01)

**Feature**: Home Dashboard (Technical)
**Persona**: Technical (Doers)
**Priority**: P0 - Critical
**Sprint**: Phase 2, Week 3
**Estimated Effort**: 8 story points

## Feature Overview

The Home Dashboard provides technical users with a centralized view of their assigned tasks, time entries, and work progress. It serves as the landing page for daily work and includes quick actions for task management.

## Ontology Dependencies

### Required Entities
- ✅ **Task** (`core-task`) - Primary entity for work items
- ✅ **Space** (`core-space`) - For task grouping and context
- ✅ **TimeEntry** (`core-time-entry`) - For weekly time summary
- ✅ **User** (`core-user`) - Current user context

### Required Indexes
- ✅ `assignee-status-index` (GSI) on Task table
- ✅ `userId-date-index` (GSI) on TimeEntry table

### Required Relationships
```typescript
// User → Task (assignedTo)
edge-core-user-assignedTo-core-task

// Space → Task (contains)
edge-core-space-contains-core-task

// Task → TimeEntry (hasTimeEntries)
edge-core-task-hasTimeEntries-core-time-entry
```

---

## User Story 1.1: View Assigned Tasks

**As a** technical user
**I want to** see all my assigned tasks in one place
**So that** I know what work I need to do

### Implementation Tasks

#### Task 1.1.1: Create Home Dashboard Layout Component
**File**: `core/src/components/spaces/panels/technical/home-dashboard.tsx`

```typescript
'use client'

import { useSession } from '@captify-io/core/hooks'
import { Card, CardHeader, CardContent } from '@captify-io/core/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@captify-io/core/components/ui/tabs'
import { MyWorkPanel } from './my-work-panel'
import { TimeSummaryWidget } from './time-summary-widget'

export function HomeDashboard() {
  const { user } = useSession()

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">My Work</h1>
        <TimeSummaryWidget userId={user.id} />
      </div>

      <MyWorkPanel userId={user.id} />
    </div>
  )
}
```

**Agent Tasks**:
1. Create file at path above
2. Import required Captify components
3. Use `useSession` hook to get current user
4. Implement responsive grid layout
5. Add loading state with Skeleton
6. Export component as default

#### Task 1.1.2: Implement Task List Service Operation
**File**: `core/services/space/task.ts`

```typescript
import { dynamodb } from '@captify-io/core/services/aws'
import { resolveTableName } from '@captify-io/core/services/aws/table-resolver'
import { QueryCommandInput, unmarshall } from '@aws-sdk/client-dynamodb'
import { AwsCredentials, Task } from '@captify-io/core/types'

export async function listMyTasks(
  params: { userId: string; status?: string; limit?: number },
  credentials: AwsCredentials
): Promise<Task[]> {
  const { userId, status, limit = 100 } = params

  const queryParams: QueryCommandInput = {
    TableName: await resolveTableName('core-task', process.env.SCHEMA!, credentials),
    IndexName: 'assignee-status-index',
    KeyConditionExpression: status && status !== 'all'
      ? 'assignee = :userId AND #status = :status'
      : 'assignee = :userId',
    ExpressionAttributeNames: status && status !== 'all' ? { '#status': 'status' } : undefined,
    ExpressionAttributeValues: {
      ':userId': { S: userId },
      ...(status && status !== 'all' ? { ':status': { S: status } } : {})
    },
    Limit: limit
  }

  const result = await dynamodb.query(queryParams, credentials)
  return result.Items?.map(item => unmarshall(item) as Task) || []
}
```

**Agent Tasks**:
1. Create service file if not exists
2. Import DynamoDB client and utilities
3. Implement `listMyTasks` function with TypeScript types
4. Use `resolveTableName` to get full table name from ontology
5. Query using `assignee-status-index` GSI
6. Handle optional status filtering
7. Add error handling
8. Export function

#### Task 1.1.3: Create GSI on Task Table
**Migration**: Add to DynamoDB table definition

```typescript
// Add to captify-core-task table schema
{
  GlobalSecondaryIndexes: [
    {
      IndexName: 'assignee-status-index',
      KeySchema: [
        { AttributeName: 'assignee', KeyType: 'HASH' },
        { AttributeName: 'status', KeyType: 'RANGE' }
      ],
      Projection: { ProjectionType: 'ALL' }
    }
  ]
}
```

**Agent Tasks**:
1. Check if index exists using AWS CLI
2. Create index if missing
3. Wait for index to become ACTIVE
4. Verify index is queryable

#### Task 1.1.4: Create Task Item Component (Reusable)
**File**: `core/src/components/spaces/items/task-item.tsx`

```typescript
'use client'

import { Task } from '@captify-io/core/types'
import { Card, CardContent } from '@captify-io/core/components/ui/card'
import { Badge } from '@captify-io/core/components/ui/badge'
import { Button } from '@captify-io/core/components/ui/button'
import { StatusBadge } from './status-badge'
import { PriorityBadge } from './priority-badge'

interface TaskItemProps {
  task: Task
  onStatusChange?: (taskId: string, status: string) => void
  onBlocker?: (taskId: string) => void
}

export function TaskItem({ task, onStatusChange, onBlocker }: TaskItemProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{task.title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{task.description}</p>

            <div className="flex gap-2 mt-3">
              <StatusBadge status={task.status} />
              <PriorityBadge priority={task.priority} />
              {task.dueDate && (
                <Badge variant="outline">Due: {task.dueDate}</Badge>
              )}
            </div>
          </div>

          <div className="flex gap-2 ml-4">
            {task.status === 'ready' && (
              <Button size="sm" onClick={() => onStatusChange?.(task.id, 'in-progress')}>
                Start
              </Button>
            )}
            {task.status === 'in-progress' && (
              <>
                <Button size="sm" variant="outline" onClick={() => onBlocker?.(task.id)}>
                  Block
                </Button>
                <Button size="sm" onClick={() => onStatusChange?.(task.id, 'completed')}>
                  Complete
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
```

**Agent Tasks**:
1. Create reusable component with TypeScript props
2. Use Card component from Captify UI
3. Display task title, description, status, priority
4. Add conditional quick actions based on status
5. Implement hover effects
6. Make fully keyboard accessible
7. Export component

#### Task 1.1.5: Implement Loading Skeleton
**File**: `core/src/components/spaces/panels/technical/my-work-panel.tsx`

```typescript
import { Skeleton } from '@captify-io/core/components/ui/skeleton'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@captify-io/core/lib/api'
import { TaskItem } from '../../items/task-item'

export function MyWorkPanel({ userId }: { userId: string }) {
  const { data: tasks, isLoading } = useQuery({
    queryKey: ['myTasks', userId],
    queryFn: async () => {
      const response = await apiClient.run({
        service: 'platform.space',
        operation: 'listMyTasks',
        data: { userId }
      })
      return response.tasks
    }
  })

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    )
  }

  if (!tasks || tasks.length === 0) {
    return <EmptyState message="No tasks assigned to you" />
  }

  return (
    <div className="space-y-4">
      {tasks.map(task => (
        <TaskItem key={task.id} task={task} />
      ))}
    </div>
  )
}
```

**Agent Tasks**:
1. Use React Query for data fetching
2. Implement loading state with Skeleton component
3. Handle empty state
4. Map over tasks and render TaskItem components
5. Add error boundary
6. Implement retry logic

#### Task 1.1.6: Add Empty State Component
**File**: `core/src/components/spaces/widgets/empty-state.tsx`

```typescript
export function EmptyState({ message, action }: { message: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="text-muted-foreground text-lg">{message}</div>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
```

**Agent Tasks**:
1. Create reusable empty state component
2. Accept custom message and action button
3. Center content
4. Add optional illustration
5. Export component

### Acceptance Criteria

- [ ] Dashboard displays all tasks assigned to current user
- [ ] Tasks are ordered by priority (blocked → critical → high → medium → low)
- [ ] Each task shows: title, space name, status, due date, priority
- [ ] Loading state shows skeleton loaders
- [ ] Empty state displays helpful message when no tasks
- [ ] Component is fully responsive on mobile
- [ ] Keyboard navigation works (Tab through tasks)

### Testing Requirements

```typescript
// core/src/components/spaces/panels/technical/__tests__/home-dashboard.test.tsx
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

  it('shows empty state when no tasks', async () => {
    mockApiClient.mockResolvedValueOnce({ tasks: [] })
    render(<HomeDashboard />)
    await waitFor(() => {
      expect(screen.getByText('No tasks assigned to you')).toBeInTheDocument()
    })
  })
})
```

---

## User Story 1.2: Filter Tasks by Status

**As a** technical user
**I want to** filter tasks by status
**So that** I can focus on specific work

### Implementation Tasks

#### Task 1.2.1: Add Tabs Component for Filtering
**Agent Tasks**:
1. Import Tabs components from Captify UI
2. Add tabs for All, In Progress, Blocked, Completed
3. Track active filter in state
4. Update query when filter changes

#### Task 1.2.2: Implement Filter State Management
```typescript
const [filter, setFilter] = useState<TaskStatus | 'all'>('all')

const { data: tasks } = useQuery({
  queryKey: ['myTasks', userId, filter],
  queryFn: async () => {
    const response = await apiClient.run({
      service: 'platform.space',
      operation: 'listMyTasks',
      data: { userId, status: filter }
    })
    return response.tasks
  }
})
```

**Agent Tasks**:
1. Add filter state
2. Pass filter to API query
3. Update React Query cache key
4. Implement URL parameter for shareable links

#### Task 1.2.3: Add URL Parameter for Filter
**Agent Tasks**:
1. Use Next.js router to read/write URL params
2. Initialize filter from URL on mount
3. Update URL when filter changes
4. Support browser back/forward

#### Task 1.2.4: Persist Filter to localStorage
**Agent Tasks**:
1. Save filter preference to localStorage
2. Load preference on component mount
3. Override with URL param if present

#### Task 1.2.5: Show Task Counts in Tabs
**Agent Tasks**:
1. Fetch counts for each status
2. Display in tab labels: "In Progress (2)"
3. Update counts when tasks change

### Acceptance Criteria

- [ ] Tabs show counts: "In Progress (2)", "Blocked (1)", etc.
- [ ] Clicking tab filters list instantly
- [ ] Filter persists across sessions (localStorage)
- [ ] URL updates with filter parameter (`?status=in-progress`)
- [ ] Browser back/forward works correctly

---

## User Story 1.3: Quick Task Actions

**As a** technical user
**I want to** update task status quickly
**So that** I can work efficiently

### Implementation Tasks

#### Task 1.3.1: Add Action Buttons to TaskItem
Already implemented in Task 1.1.4. Verify functionality.

#### Task 1.3.2: Implement Update Task Status Service
**File**: `core/services/space/task.ts`

```typescript
export async function updateTaskStatus(
  params: { taskId: string; status: string; blockerReason?: string },
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
  return unmarshall(result.Attributes!) as Task
}
```

**Agent Tasks**:
1. Implement update operation
2. Handle optional blocker reason
3. Return updated task
4. Add error handling

#### Task 1.3.3: Create Block Task Dialog
**File**: `core/src/components/spaces/dialogs/block-task.tsx`

```typescript
export function BlockTaskDialog({ taskId, onBlock }: BlockTaskDialogProps) {
  const [reason, setReason] = useState('')

  return (
    <Dialog>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Block Task</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <label>
            Why is this task blocked?
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full mt-2"
              rows={4}
            />
          </label>

          <Button onClick={() => onBlock(taskId, reason)}>
            Block Task
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

**Agent Tasks**:
1. Create dialog component
2. Add textarea for blocker reason
3. Validate reason is not empty
4. Call onBlock callback with reason
5. Close dialog on success

#### Task 1.3.4: Add Optimistic UI Updates
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
    await queryClient.cancelQueries(['myTasks'])
    const previous = queryClient.getQueryData(['myTasks'])

    queryClient.setQueryData(['myTasks'], old =>
      old.map(t => t.id === taskId ? { ...t, status } : t)
    )

    return { previous }
  },
  onError: (err, variables, context) => {
    queryClient.setQueryData(['myTasks'], context.previous)
  }
})
```

**Agent Tasks**:
1. Use React Query mutations
2. Implement optimistic update
3. Rollback on error
4. Show success toast notification

#### Task 1.3.5: Implement Success Animations
**Agent Tasks**:
1. Use Framer Motion for animations
2. Animate task completion (fade out and shrink)
3. Add checkmark animation
4. Show confetti for completed tasks (optional)

### Acceptance Criteria

- [ ] Hover on task shows: Start, Complete, Block buttons (based on status)
- [ ] Clicking updates task immediately (optimistic UI)
- [ ] Block shows dialog for reason entry
- [ ] Success animation plays on completion
- [ ] Error shows toast and reverts optimistically

---

## User Story 1.4: Weekly Time Summary

**As a** technical user
**I want to** see hours logged this week
**So that** I know if I'm on track

### Implementation Tasks

#### Task 1.4.1: Create Time Summary Widget Component
**File**: `core/src/components/spaces/panels/technical/time-summary-widget.tsx`

```typescript
export function TimeSummaryWidget({ userId }: { userId: string }) {
  const { data: timeEntries } = useQuery({
    queryKey: ['myTimeEntries', userId, getWeekRange()],
    queryFn: async () => {
      const { startDate, endDate } = getWeekRange()
      return apiClient.run({
        service: 'platform.space',
        operation: 'getMyTimeEntries',
        data: { userId, startDate, endDate }
      })
    }
  })

  const totalHours = timeEntries?.reduce((sum, entry) => sum + entry.hours, 0) || 0
  const status = getHoursStatus(totalHours, 40)

  return (
    <Card className={cn('p-4', status === 'green' && 'border-green-500')}>
      <div className="text-sm text-muted-foreground">This week</div>
      <div className="text-2xl font-bold">{totalHours} hours</div>
    </Card>
  )
}
```

**Agent Tasks**:
1. Create widget component
2. Query time entries for current week
3. Calculate total hours
4. Apply color based on target (40hrs)
5. Add tooltip with daily breakdown

#### Task 1.4.2: Implement Get Time Entries Query
**File**: `core/services/space/time-entry.ts`

```typescript
export async function getMyTimeEntries(
  params: { userId: string; startDate: string; endDate: string },
  credentials: AwsCredentials
): Promise<TimeEntry[]> {
  const result = await dynamodb.query({
    TableName: await resolveTableName('core-time-entry', process.env.SCHEMA!, credentials),
    IndexName: 'userId-date-index',
    KeyConditionExpression: 'userId = :userId AND #date BETWEEN :start AND :end',
    ExpressionAttributeNames: { '#date': 'date' },
    ExpressionAttributeValues: {
      ':userId': { S: params.userId },
      ':start': { S: params.startDate },
      ':end': { S: params.endDate }
    }
  }, credentials)

  return result.Items?.map(item => unmarshall(item) as TimeEntry) || []
}
```

**Agent Tasks**:
1. Implement query using `userId-date-index`
2. Use BETWEEN for date range
3. Return time entries
4. Add error handling

#### Task 1.4.3: Calculate Weekly Total
**Agent Tasks**:
1. Sum hours from all entries
2. Group by date for daily breakdown
3. Calculate target vs actual
4. Determine status (green/yellow/red)

#### Task 1.4.4: Add Tooltip with Daily Breakdown
**Agent Tasks**:
1. Use Tooltip component from Captify UI
2. Show hours per day
3. Highlight days with no time logged
4. Add "View Details" link

#### Task 1.4.5: Link to Daily Checkin Dialog
**Agent Tasks**:
1. Make widget clickable
2. Open daily checkin dialog on click
3. Pre-fill with current date
4. Allow quick time entry

### Acceptance Criteria

- [ ] Widget shows "This week: 28 hours"
- [ ] Green if ≥40hrs, yellow if 30-39hrs, red if <30hrs
- [ ] Tooltip shows daily breakdown on hover
- [ ] Clicking opens daily checkin dialog
- [ ] Updates in real-time as time is logged

---

## Dependencies

### Upstream (Must Complete First)
- None - This is a foundation feature

### Downstream (Depends on This)
- Feature 02 (AI Daily Checkin) - Uses Task entities
- Feature 03 (Task Board) - Uses Task list queries
- Feature 04 (Time Tracking) - Shares TimeEntry entities

### External Dependencies
- DynamoDB tables: `captify-core-task`, `captify-core-time-entry`
- Captify UI components: Card, Badge, Button, Tabs, Dialog, Skeleton
- React Query for data fetching
- Framer Motion for animations

---

## Implementation Checklist

### Phase 1: Foundation
- [ ] Create Task ontology node
- [ ] Create TimeEntry ontology node
- [ ] Create DynamoDB tables with indexes
- [ ] Implement service operations
- [ ] Write integration tests for services

### Phase 2: Components
- [ ] Create HomeDashboard layout
- [ ] Create MyWorkPanel
- [ ] Create TaskItem component
- [ ] Create StatusBadge component
- [ ] Create PriorityBadge component
- [ ] Create EmptyState component

### Phase 3: Features
- [ ] Implement task filtering
- [ ] Add quick actions
- [ ] Implement time summary widget
- [ ] Add optimistic updates
- [ ] Add success animations

### Phase 4: Polish
- [ ] Add keyboard navigation
- [ ] Implement accessibility (ARIA)
- [ ] Add mobile responsive layout
- [ ] Write component tests
- [ ] Add error boundaries

### Phase 5: Testing
- [ ] Unit tests for all components
- [ ] Integration tests for API operations
- [ ] E2E tests for critical flows
- [ ] Accessibility audit
- [ ] Performance testing (500+ tasks)

---

**Status**: Ready for Implementation
**Next Steps**: Agent should begin with Phase 1 - Foundation
