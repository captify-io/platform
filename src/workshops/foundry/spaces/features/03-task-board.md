# Feature 03: Task Board (Technical)

**Persona**: Technical (Doers)
**Priority**: P1 - High
**Effort**: 5 story points

---

## Requirements

### Functional Requirements
- FR1: Display tasks in Kanban board columns (Ready, In Progress, Blocked, Completed)
- FR2: Drag and drop tasks between columns to update status
- FR3: Filter tasks by space, priority, assignee
- FR4: Quick add new task from board
- FR5: Visual indicators for priority, due date, blockers
- FR6: Swimlanes by space or assignee
- FR7: Collapsed/expanded view toggle

### Non-Functional Requirements
- NFR1: Smooth drag animations (<16ms frames)
- NFR2: Support 200+ tasks without lag
- NFR3: Mobile-friendly (vertical scrolling)
- NFR4: Keyboard accessible (arrow keys + Enter)
- NFR5: Auto-save on drag (optimistic updates)

---

## Ontology

### Nodes Used
```typescript
Task {
  id: string
  spaceId: string
  assignee: string
  title: string
  status: 'ready' | 'in-progress' | 'blocked' | 'completed'
  priority: 'critical' | 'high' | 'medium' | 'low'
  dueDate?: string
  estimatedHours?: number
}

Space {
  id: string
  name: string
  type: 'product' | 'service' | 'support'
  color: string
}

User {
  id: string
  name: string
  email: string
  avatar?: string
}
```

### Edges Used
```typescript
// Space → Task
{
  source: 'space',
  target: 'task',
  relation: 'contains',
  type: 'one-to-many'
}

// User → Task
{
  source: 'user',
  target: 'task',
  relation: 'assignedTo',
  type: 'one-to-many'
}
```

### New Ontology Nodes Required
None - uses existing Task, Space, User nodes

---

## Components

### Reuse Existing Captify Components
```typescript
// From @captify-io/core/components/ui
import { Card, CardHeader, CardContent } from '@captify-io/core/components/ui/card'
import { Badge } from '@captify-io/core/components/ui/badge'
import { Button } from '@captify-io/core/components/ui/button'
import { Select, SelectTrigger, SelectContent, SelectItem } from '@captify-io/core/components/ui/select'
import { Dialog, DialogContent, DialogTrigger } from '@captify-io/core/components/ui/dialog'
import { Skeleton } from '@captify-io/core/components/ui/skeleton'

// From @captify-io/core/lib
import { apiClient } from '@captify-io/core/lib/api'
import { cn } from '@captify-io/core/lib/utils'

// From @captify-io/core/hooks
import { useSession } from '@captify-io/core/hooks'

// External libraries
import { DndContext, DragOverlay, useDraggable, useDroppable } from '@dnd-kit/core'
```

### New Components to Create
```
/components/spaces/panels/technical/
  task-board-panel.tsx          # Main Kanban board

/components/spaces/items/
  kanban-column.tsx             # Column component (REUSABLE)
  draggable-task-card.tsx       # Task card with drag handle (REUSABLE)
  board-filters.tsx             # Filter controls (REUSABLE)
  quick-add-task.tsx            # Inline task creation (REUSABLE)

/components/spaces/widgets/
  swimlane-selector.tsx         # Swimlane grouping control
```

---

## Actions

### List Tasks for Board
```typescript
// Service: platform.space
// Operation: listTasksForBoard

interface ListTasksForBoardRequest {
  service: 'platform.space'
  operation: 'listTasksForBoard'
  data: {
    userId?: string         // Filter by assignee
    spaceId?: string        // Filter by space
    includeCompleted?: boolean
    limit?: number
  }
}

interface ListTasksForBoardResponse {
  tasks: Task[]
  spaces: Space[]  // For swimlanes
}

// Implementation
export async function listTasksForBoard(
  params: { userId?: string, spaceId?: string, includeCompleted?: boolean },
  credentials: AwsCredentials
): Promise<{ tasks: Task[], spaces: Space[] }> {
  let queryParams: QueryCommandInput

  if (params.userId) {
    // Query by user
    queryParams = {
      TableName: await resolveTableName('core-task', process.env.SCHEMA!, credentials),
      IndexName: 'assignee-status-index',
      KeyConditionExpression: 'assignee = :userId',
      ExpressionAttributeValues: {
        ':userId': { S: params.userId }
      }
    }
  } else if (params.spaceId) {
    // Query by space
    queryParams = {
      TableName: await resolveTableName('core-task', process.env.SCHEMA!, credentials),
      IndexName: 'spaceId-status-index',
      KeyConditionExpression: 'spaceId = :spaceId',
      ExpressionAttributeValues: {
        ':spaceId': { S: params.spaceId }
      }
    }
  } else {
    // Scan all (use with caution)
    queryParams = {
      TableName: await resolveTableName('core-task', process.env.SCHEMA!, credentials)
    }
  }

  // Filter out completed if needed
  if (!params.includeCompleted) {
    queryParams.FilterExpression = '#status <> :completed'
    queryParams.ExpressionAttributeNames = { '#status': 'status' }
    queryParams.ExpressionAttributeValues = {
      ...queryParams.ExpressionAttributeValues,
      ':completed': { S: 'completed' }
    }
  }

  const result = await dynamodb.query(queryParams, credentials)
  const tasks = result.Items?.map(item => unmarshall(item) as Task) || []

  // Get unique space IDs
  const spaceIds = [...new Set(tasks.map(t => t.spaceId))]

  // Fetch space details
  const spaces = await Promise.all(
    spaceIds.map(async (spaceId) => {
      const spaceResult = await dynamodb.get({
        TableName: await resolveTableName('core-space', process.env.SCHEMA!, credentials),
        Key: { id: { S: spaceId } }
      }, credentials)
      return unmarshall(spaceResult.Item!) as Space
    })
  )

  return { tasks, spaces }
}
```

### Update Task Status (Drag & Drop)
```typescript
// Service: platform.space
// Operation: updateTaskStatus

// Already defined in Feature 01, reuse implementation
// Just add optimistic update handling on client side
```

### Quick Create Task
```typescript
// Service: platform.space
// Operation: createTask

interface CreateTaskRequest {
  service: 'platform.space'
  operation: 'createTask'
  data: {
    spaceId: string
    assignee: string
    title: string
    status?: 'ready' | 'in-progress'
    priority?: 'critical' | 'high' | 'medium' | 'low'
  }
}

export async function createTask(
  params: {
    spaceId: string
    assignee: string
    title: string
    status?: string
    priority?: string
  },
  credentials: AwsCredentials
): Promise<Task> {
  const task: Task = {
    id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    spaceId: params.spaceId,
    assignee: params.assignee,
    title: params.title,
    status: (params.status as any) || 'ready',
    priority: (params.priority as any) || 'medium',
    description: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }

  await dynamodb.put({
    TableName: await resolveTableName('core-task', process.env.SCHEMA!, credentials),
    Item: marshall(task)
  }, credentials)

  return task
}
```

---

## User Stories & Tasks

### Story 1: Kanban Board View
**As a** technical user
**I want to** see tasks in Kanban columns
**So that** I can visualize work status

**Tasks**:
- [ ] Task 1.1: Create task-board-panel.tsx layout
- [ ] Task 1.2: Implement kanban-column.tsx component
- [ ] Task 1.3: Create draggable-task-card.tsx with drag handle
- [ ] Task 1.4: Add @dnd-kit/core for drag and drop
- [ ] Task 1.5: Implement listTasksForBoard API operation
- [ ] Task 1.6: Add column headers with task counts
- [ ] Task 1.7: Implement empty state for empty columns

**Acceptance Criteria**:
- [ ] Board shows 4 columns: Ready, In Progress, Blocked, Completed
- [ ] Each column displays task count
- [ ] Tasks grouped in correct columns
- [ ] Empty columns show helpful message

---

### Story 2: Drag and Drop Status Update
**As a** technical user
**I want to** drag tasks between columns
**So that** I can quickly update status

**Tasks**:
- [ ] Task 2.1: Set up DndContext with sensors
- [ ] Task 2.2: Make task cards draggable
- [ ] Task 2.3: Make columns droppable
- [ ] Task 2.4: Implement onDragEnd handler
- [ ] Task 2.5: Call updateTaskStatus on drop
- [ ] Task 2.6: Add optimistic UI update
- [ ] Task 2.7: Add drag overlay with card preview
- [ ] Task 2.8: Implement rollback on error

**Acceptance Criteria**:
- [ ] Can drag task to any column
- [ ] Status updates immediately (optimistic)
- [ ] Drag overlay shows task preview
- [ ] Reverts on error with toast notification

---

### Story 3: Board Filtering
**As a** technical user
**I want to** filter tasks on board
**So that** I can focus on specific work

**Tasks**:
- [ ] Task 3.1: Create board-filters.tsx component
- [ ] Task 3.2: Add space dropdown filter
- [ ] Task 3.3: Add priority filter
- [ ] Task 3.4: Add assignee filter
- [ ] Task 3.5: Implement filter state management
- [ ] Task 3.6: Update board query with filters
- [ ] Task 3.7: Persist filters to localStorage
- [ ] Task 3.8: Add "Clear filters" button

**Acceptance Criteria**:
- [ ] Can filter by space, priority, assignee
- [ ] Multiple filters work together (AND logic)
- [ ] Filters persist across sessions
- [ ] Clear button resets all filters

---

### Story 4: Quick Task Creation
**As a** technical user
**I want to** add tasks directly from board
**So that** I don't need to leave context

**Tasks**:
- [ ] Task 4.1: Create quick-add-task.tsx inline form
- [ ] Task 4.2: Add "+ New Task" button to each column
- [ ] Task 4.3: Implement createTask API operation
- [ ] Task 4.4: Show inline form on button click
- [ ] Task 4.5: Auto-set status based on column
- [ ] Task 4.6: Add keyboard shortcuts (Cmd+N)
- [ ] Task 4.7: Optimistically add to board
- [ ] Task 4.8: Focus title input on form show

**Acceptance Criteria**:
- [ ] "+ New Task" in each column header
- [ ] Inline form with title input
- [ ] Creates task in correct status
- [ ] Keyboard shortcut Cmd+N opens form
- [ ] Appears immediately on board

---

### Story 5: Swimlanes
**As a** technical user
**I want to** group tasks by space or assignee
**So that** I can see workload distribution

**Tasks**:
- [ ] Task 5.1: Create swimlane-selector.tsx component
- [ ] Task 5.2: Add swimlane grouping options (None, Space, Assignee)
- [ ] Task 5.3: Restructure board layout for swimlanes
- [ ] Task 5.4: Render columns within each swimlane
- [ ] Task 5.5: Add swimlane headers with totals
- [ ] Task 5.6: Support drag between swimlanes
- [ ] Task 5.7: Collapse/expand swimlanes
- [ ] Task 5.8: Persist swimlane preference

**Acceptance Criteria**:
- [ ] Can group by None, Space, or Assignee
- [ ] Each swimlane shows all 4 status columns
- [ ] Can drag tasks within and between swimlanes
- [ ] Swimlanes collapsible
- [ ] Preference persists

---

## Implementation Notes

### Drag and Drop Setup

```typescript
import { DndContext, DragEndEvent, DragOverlay } from '@dnd-kit/core'

function TaskBoard() {
  const [activeTask, setActiveTask] = useState<Task | null>(null)

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find(t => t.id === event.active.id)
    setActiveTask(task || null)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return

    const taskId = active.id as string
    const newStatus = over.id as TaskStatus

    // Optimistic update
    updateTaskMutation.mutate({ taskId, status: newStatus })
    setActiveTask(null)
  }

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-4">
        {columns.map(column => (
          <KanbanColumn key={column.status} status={column.status} tasks={tasksForColumn(column.status)} />
        ))}
      </div>

      <DragOverlay>
        {activeTask && <DraggableTaskCard task={activeTask} isDragOverlay />}
      </DragOverlay>
    </DndContext>
  )
}
```

### Optimistic Updates with React Query

```typescript
const updateTaskMutation = useMutation({
  mutationFn: async ({ taskId, status }: { taskId: string, status: string }) => {
    return apiClient.run({
      service: 'platform.space',
      operation: 'updateTaskStatus',
      data: { taskId, status }
    })
  },
  onMutate: async ({ taskId, status }) => {
    await queryClient.cancelQueries(['boardTasks'])

    const previous = queryClient.getQueryData(['boardTasks'])

    queryClient.setQueryData(['boardTasks'], (old: any) => ({
      ...old,
      tasks: old.tasks.map((t: Task) =>
        t.id === taskId ? { ...t, status } : t
      )
    }))

    return { previous }
  },
  onError: (err, variables, context) => {
    queryClient.setQueryData(['boardTasks'], context?.previous)
    toast.error('Failed to update task status')
  },
  onSettled: () => {
    queryClient.invalidateQueries(['boardTasks'])
  }
})
```

### Swimlane Layout

```typescript
function SwimlaneBoard({ groupBy }: { groupBy: 'space' | 'assignee' | 'none' }) {
  const { tasks, spaces } = useBoardTasks()

  if (groupBy === 'none') {
    return <StandardBoard tasks={tasks} />
  }

  const swimlanes = groupBy === 'space'
    ? spaces.map(space => ({
        id: space.id,
        name: space.name,
        tasks: tasks.filter(t => t.spaceId === space.id)
      }))
    : groupByAssignee(tasks)

  return (
    <div className="space-y-6">
      {swimlanes.map(lane => (
        <Swimlane key={lane.id} {...lane}>
          <div className="flex gap-4">
            {statuses.map(status => (
              <KanbanColumn
                key={status}
                status={status}
                tasks={lane.tasks.filter(t => t.status === status)}
              />
            ))}
          </div>
        </Swimlane>
      ))}
    </div>
  )
}
```

### Mobile Responsive Layout

```typescript
// On mobile: vertical scrolling list instead of horizontal columns
function ResponsiveBoard() {
  const isMobile = useMediaQuery('(max-width: 768px)')

  if (isMobile) {
    return (
      <div className="space-y-4">
        {statuses.map(status => (
          <div key={status}>
            <h3 className="font-semibold mb-2">{status}</h3>
            <div className="space-y-2">
              {tasksForStatus(status).map(task => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return <KanbanBoard />
}
```

### Keyboard Navigation

```typescript
// Arrow keys to navigate between tasks
// Enter to open task detail
// Space to drag task
// Escape to cancel drag

useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight') {
      focusNextColumn()
    } else if (e.key === 'ArrowLeft') {
      focusPrevColumn()
    } else if (e.key === 'ArrowDown') {
      focusNextTask()
    } else if (e.key === 'ArrowUp') {
      focusPrevTask()
    } else if (e.key === 'Enter') {
      openFocusedTask()
    }
  }

  window.addEventListener('keydown', handleKeyDown)
  return () => window.removeEventListener('keydown', handleKeyDown)
}, [])
```

---

## Testing

### Unit Tests
```typescript
describe('TaskBoard', () => {
  it('renders columns with correct tasks', () => {
    const tasks = [
      { id: '1', status: 'ready', title: 'Task 1' },
      { id: '2', status: 'in-progress', title: 'Task 2' }
    ]

    render(<TaskBoard tasks={tasks} />)

    const readyColumn = screen.getByTestId('column-ready')
    const inProgressColumn = screen.getByTestId('column-in-progress')

    expect(within(readyColumn).getByText('Task 1')).toBeInTheDocument()
    expect(within(inProgressColumn).getByText('Task 2')).toBeInTheDocument()
  })

  it('updates task status on drag', async () => {
    const { user } = setup(<TaskBoard />)
    const task = screen.getByText('Task 1')
    const column = screen.getByTestId('column-in-progress')

    await user.drag(task, column)

    await waitFor(() => {
      expect(mockApiClient.run).toHaveBeenCalledWith({
        service: 'platform.space',
        operation: 'updateTaskStatus',
        data: { taskId: '1', status: 'in-progress' }
      })
    })
  })
})

describe('QuickAddTask', () => {
  it('creates task in correct column', async () => {
    const { user } = setup(<TaskBoard />)

    const addButton = screen.getByTestId('add-task-ready')
    await user.click(addButton)

    const input = screen.getByPlaceholderText('Task title')
    await user.type(input, 'New task')
    await user.keyboard('{Enter}')

    expect(mockApiClient.run).toHaveBeenCalledWith({
      service: 'platform.space',
      operation: 'createTask',
      data: expect.objectContaining({
        title: 'New task',
        status: 'ready'
      })
    })
  })
})
```

### Integration Tests
```typescript
describe('Board Filtering', () => {
  it('filters tasks by space', async () => {
    const { user } = setup(<TaskBoard />)

    const spaceFilter = screen.getByLabelText('Filter by space')
    await user.selectOptions(spaceFilter, 'space-1')

    await waitFor(() => {
      expect(mockApiClient.run).toHaveBeenCalledWith({
        service: 'platform.space',
        operation: 'listTasksForBoard',
        data: { spaceId: 'space-1' }
      })
    })
  })
})
```

---

## Dependencies
- @dnd-kit/core (drag and drop)
- React Query (data fetching)
- Task ontology node (from Feature 01)
- Space ontology node (existing)
- User ontology node (existing)

---

**Status**: Ready for Implementation
**Sprint**: Phase 2, Week 3
