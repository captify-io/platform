# Feature 04: Time Tracking (Technical)

**Persona**: Technical (Doers)
**Priority**: P0 - Critical
**Effort**: 5 story points

---

## Requirements

### Functional Requirements
- FR1: Start/stop timer for active task
- FR2: Manual time entry with date, hours, task
- FR3: Weekly timesheet view with daily breakdown
- FR4: Edit/delete existing time entries
- FR5: Visual indicator when timer is running
- FR6: Auto-pause timer after 8 hours
- FR7: Export timesheet to CSV/PDF
- FR8: Warning when total time exceeds 24 hours/day

### Non-Functional Requirements
- NFR1: Timer persists across browser sessions
- NFR2: Sync timer state across tabs
- NFR3: Mobile-friendly timer controls
- NFR4: Accessible keyboard shortcuts
- NFR5: Offline support with sync queue

---

## Ontology

### Nodes Used
```typescript
TimeEntry {
  id: string
  userId: string
  taskId: string
  date: string        // ISO date (YYYY-MM-DD)
  hours: number
  description: string
  createdAt: string
  updatedAt: string
}

Task {
  id: string
  spaceId: string
  title: string
  assignee: string
}

TimerSession {
  id: string
  userId: string
  taskId: string
  startTime: string   // ISO timestamp
  endTime?: string
  status: 'running' | 'paused' | 'stopped'
  elapsedSeconds: number
}
```

### Edges Used
```typescript
// User → TimeEntry
{
  source: 'user',
  target: 'time-entry',
  relation: 'logged',
  type: 'one-to-many'
}

// Task → TimeEntry
{
  source: 'task',
  target: 'time-entry',
  relation: 'hasTimeEntries',
  type: 'one-to-many'
}

// User → TimerSession
{
  source: 'user',
  target: 'timer-session',
  relation: 'hasTimerSessions',
  type: 'one-to-many'
}
```

### New Ontology Nodes Required

```typescript
// Add to core/services/ontology/definitions/time-entry.ts
export const timeEntryNode: OntologyNode = {
  id: 'core-time-entry',
  name: 'Time Entry',
  type: 'timeEntry',
  category: 'entity',
  domain: 'Work Management',
  description: 'Logged work hours for a task',
  icon: 'Clock',
  color: '#10b981',
  active: 'true',
  properties: {
    dataSource: 'core-time-entry',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        userId: { type: 'string', required: true },
        taskId: { type: 'string', required: true },
        date: { type: 'string', required: true },
        hours: { type: 'number', required: true },
        description: { type: 'string' }
      }
    },
    indexes: {
      'userId-date-index': {
        hashKey: 'userId',
        rangeKey: 'date',
        type: 'GSI'
      },
      'taskId-date-index': {
        hashKey: 'taskId',
        rangeKey: 'date',
        type: 'GSI'
      }
    }
  }
}

// Add to core/services/ontology/definitions/timer-session.ts
export const timerSessionNode: OntologyNode = {
  id: 'core-timer-session',
  name: 'Timer Session',
  type: 'timerSession',
  category: 'entity',
  domain: 'Work Management',
  description: 'Active or historical timer session',
  icon: 'Timer',
  color: '#f59e0b',
  active: 'true',
  properties: {
    dataSource: 'core-timer-session',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        userId: { type: 'string', required: true },
        taskId: { type: 'string', required: true },
        startTime: { type: 'string', required: true },
        endTime: { type: 'string' },
        status: {
          type: 'string',
          enum: ['running', 'paused', 'stopped'],
          required: true
        },
        elapsedSeconds: { type: 'number', required: true }
      }
    },
    indexes: {
      'userId-status-index': {
        hashKey: 'userId',
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
import { Button } from '@captify-io/core/components/ui/button'
import { Input } from '@captify-io/core/components/ui/input'
import { Dialog, DialogContent, DialogTrigger } from '@captify-io/core/components/ui/dialog'
import { Table, TableHeader, TableBody, TableRow, TableCell } from '@captify-io/core/components/ui/table'
import { Badge } from '@captify-io/core/components/ui/badge'
import { Select, SelectTrigger, SelectContent, SelectItem } from '@captify-io/core/components/ui/select'
import { Calendar } from '@captify-io/core/components/ui/calendar'

// From @captify-io/core/lib
import { apiClient } from '@captify-io/core/lib/api'

// From @captify-io/core/hooks
import { useSession } from '@captify-io/core/hooks'
```

### New Components to Create
```
/components/spaces/panels/technical/
  time-tracking-panel.tsx       # Main time tracking interface
  timesheet-view.tsx            # Weekly timesheet table

/components/spaces/widgets/
  active-timer.tsx              # Running timer widget (REUSABLE)
  timer-controls.tsx            # Start/stop/pause buttons (REUSABLE)
  time-entry-form.tsx           # Manual entry form (REUSABLE)
  time-summary-card.tsx         # Daily/weekly summary (REUSABLE)

/components/spaces/dialogs/
  edit-time-entry.tsx           # Edit existing entry
  export-timesheet.tsx          # Export dialog
```

---

## Actions

### Start Timer
```typescript
// Service: platform.space
// Operation: startTimer

interface StartTimerRequest {
  service: 'platform.space'
  operation: 'startTimer'
  data: {
    userId: string
    taskId: string
  }
}

interface StartTimerResponse {
  session: TimerSession
}

// Implementation
export async function startTimer(
  params: { userId: string, taskId: string },
  credentials: AwsCredentials
): Promise<TimerSession> {
  // Check for existing running timer
  const existing = await dynamodb.query({
    TableName: await resolveTableName('core-timer-session', process.env.SCHEMA!, credentials),
    IndexName: 'userId-status-index',
    KeyConditionExpression: 'userId = :userId AND #status = :status',
    ExpressionAttributeNames: { '#status': 'status' },
    ExpressionAttributeValues: {
      ':userId': { S: params.userId },
      ':status': { S: 'running' }
    }
  }, credentials)

  // Stop existing timer if found
  if (existing.Items && existing.Items.length > 0) {
    const existingSession = unmarshall(existing.Items[0]) as TimerSession
    await stopTimer({ sessionId: existingSession.id, userId: params.userId }, credentials)
  }

  // Create new timer session
  const session: TimerSession = {
    id: `timer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId: params.userId,
    taskId: params.taskId,
    startTime: new Date().toISOString(),
    status: 'running',
    elapsedSeconds: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }

  await dynamodb.put({
    TableName: await resolveTableName('core-timer-session', process.env.SCHEMA!, credentials),
    Item: marshall(session)
  }, credentials)

  return session
}
```

### Stop Timer & Create Time Entry
```typescript
// Service: platform.space
// Operation: stopTimer

interface StopTimerRequest {
  service: 'platform.space'
  operation: 'stopTimer'
  data: {
    sessionId: string
    userId: string
    description?: string
  }
}

interface StopTimerResponse {
  session: TimerSession
  timeEntry: TimeEntry
}

export async function stopTimer(
  params: { sessionId: string, userId: string, description?: string },
  credentials: AwsCredentials
): Promise<{ session: TimerSession, timeEntry: TimeEntry }> {
  // Get session
  const sessionResult = await dynamodb.get({
    TableName: await resolveTableName('core-timer-session', process.env.SCHEMA!, credentials),
    Key: { id: { S: params.sessionId } }
  }, credentials)

  if (!sessionResult.Item) {
    throw new Error('Timer session not found')
  }

  const session = unmarshall(sessionResult.Item) as TimerSession
  const endTime = new Date()
  const startTime = new Date(session.startTime)
  const totalSeconds = session.elapsedSeconds + Math.floor((endTime.getTime() - startTime.getTime()) / 1000)
  const hours = Math.round((totalSeconds / 3600) * 100) / 100

  // Update session to stopped
  const updatedSession = {
    ...session,
    endTime: endTime.toISOString(),
    status: 'stopped' as const,
    elapsedSeconds: totalSeconds,
    updatedAt: endTime.toISOString()
  }

  await dynamodb.put({
    TableName: await resolveTableName('core-timer-session', process.env.SCHEMA!, credentials),
    Item: marshall(updatedSession)
  }, credentials)

  // Create time entry
  const timeEntry: TimeEntry = {
    id: `time_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId: params.userId,
    taskId: session.taskId,
    date: new Date().toISOString().split('T')[0],
    hours,
    description: params.description || `Timer session ${totalSeconds}s`,
    createdAt: endTime.toISOString(),
    updatedAt: endTime.toISOString()
  }

  await dynamodb.put({
    TableName: await resolveTableName('core-time-entry', process.env.SCHEMA!, credentials),
    Item: marshall(timeEntry)
  }, credentials)

  return { session: updatedSession, timeEntry }
}
```

### Get Active Timer
```typescript
// Service: platform.space
// Operation: getActiveTimer

interface GetActiveTimerRequest {
  service: 'platform.space'
  operation: 'getActiveTimer'
  data: {
    userId: string
  }
}

export async function getActiveTimer(
  params: { userId: string },
  credentials: AwsCredentials
): Promise<TimerSession | null> {
  const result = await dynamodb.query({
    TableName: await resolveTableName('core-timer-session', process.env.SCHEMA!, credentials),
    IndexName: 'userId-status-index',
    KeyConditionExpression: 'userId = :userId AND #status = :status',
    ExpressionAttributeNames: { '#status': 'status' },
    ExpressionAttributeValues: {
      ':userId': { S: params.userId },
      ':status': { S: 'running' }
    },
    Limit: 1
  }, credentials)

  if (!result.Items || result.Items.length === 0) {
    return null
  }

  return unmarshall(result.Items[0]) as TimerSession
}
```

### List Time Entries
```typescript
// Service: platform.space
// Operation: listTimeEntries

interface ListTimeEntriesRequest {
  service: 'platform.space'
  operation: 'listTimeEntries'
  data: {
    userId: string
    startDate: string  // YYYY-MM-DD
    endDate: string    // YYYY-MM-DD
  }
}

export async function listTimeEntries(
  params: { userId: string, startDate: string, endDate: string },
  credentials: AwsCredentials
): Promise<TimeEntry[]> {
  const result = await dynamodb.query({
    TableName: await resolveTableName('core-time-entry', process.env.SCHEMA!, credentials),
    IndexName: 'userId-date-index',
    KeyConditionExpression: 'userId = :userId AND #date BETWEEN :startDate AND :endDate',
    ExpressionAttributeNames: { '#date': 'date' },
    ExpressionAttributeValues: {
      ':userId': { S: params.userId },
      ':startDate': { S: params.startDate },
      ':endDate': { S: params.endDate }
    }
  }, credentials)

  return result.Items?.map(item => unmarshall(item) as TimeEntry) || []
}
```

### Update Time Entry
```typescript
// Service: platform.space
// Operation: updateTimeEntry

interface UpdateTimeEntryRequest {
  service: 'platform.space'
  operation: 'updateTimeEntry'
  data: {
    id: string
    hours?: number
    description?: string
    date?: string
  }
}

export async function updateTimeEntry(
  params: { id: string, hours?: number, description?: string, date?: string },
  credentials: AwsCredentials
): Promise<TimeEntry> {
  const updateExpressions: string[] = ['updatedAt = :updatedAt']
  const attributeValues: any = {
    ':updatedAt': { S: new Date().toISOString() }
  }

  if (params.hours !== undefined) {
    updateExpressions.push('hours = :hours')
    attributeValues[':hours'] = { N: params.hours.toString() }
  }

  if (params.description !== undefined) {
    updateExpressions.push('description = :description')
    attributeValues[':description'] = { S: params.description }
  }

  if (params.date !== undefined) {
    updateExpressions.push('#date = :date')
    attributeValues[':date'] = { S: params.date }
  }

  const result = await dynamodb.update({
    TableName: await resolveTableName('core-time-entry', process.env.SCHEMA!, credentials),
    Key: { id: { S: params.id } },
    UpdateExpression: 'SET ' + updateExpressions.join(', '),
    ExpressionAttributeNames: params.date ? { '#date': 'date' } : undefined,
    ExpressionAttributeValues: attributeValues,
    ReturnValues: 'ALL_NEW'
  }, credentials)

  return unmarshall(result.Attributes!) as TimeEntry
}
```

### Delete Time Entry
```typescript
// Service: platform.space
// Operation: deleteTimeEntry

interface DeleteTimeEntryRequest {
  service: 'platform.space'
  operation: 'deleteTimeEntry'
  data: {
    id: string
  }
}

export async function deleteTimeEntry(
  params: { id: string },
  credentials: AwsCredentials
): Promise<void> {
  await dynamodb.delete({
    TableName: await resolveTableName('core-time-entry', process.env.SCHEMA!, credentials),
    Key: { id: { S: params.id } }
  }, credentials)
}
```

---

## User Stories & Tasks

### Story 1: Start/Stop Timer
**As a** technical user
**I want to** start and stop a timer for my task
**So that** time is automatically tracked

**Tasks**:
- [ ] Task 1.1: Create active-timer.tsx widget
- [ ] Task 1.2: Create timer-controls.tsx component
- [ ] Task 1.3: Implement startTimer API operation
- [ ] Task 1.4: Implement stopTimer API operation
- [ ] Task 1.5: Implement getActiveTimer API operation
- [ ] Task 1.6: Add timer persistence to localStorage
- [ ] Task 1.7: Add cross-tab synchronization (BroadcastChannel)
- [ ] Task 1.8: Add auto-pause at 8 hours
- [ ] Task 1.9: Create time entry on timer stop

**Acceptance Criteria**:
- [ ] Timer shows elapsed time (HH:MM:SS)
- [ ] Timer persists across page refreshes
- [ ] Timer syncs across browser tabs
- [ ] Auto-pauses at 8 hours with notification
- [ ] Creates time entry when stopped

---

### Story 2: Manual Time Entry
**As a** technical user
**I want to** manually enter time for past work
**So that** I can log time retroactively

**Tasks**:
- [ ] Task 2.1: Create time-entry-form.tsx component
- [ ] Task 2.2: Add date picker (Calendar component)
- [ ] Task 2.3: Add task selector (autocomplete)
- [ ] Task 2.4: Add hours input with validation
- [ ] Task 2.5: Implement createTimeEntry API operation
- [ ] Task 2.6: Add 24-hour daily limit validation
- [ ] Task 2.7: Show conflict warning if overlapping entries
- [ ] Task 2.8: Add description field (optional)

**Acceptance Criteria**:
- [ ] Can select any past date
- [ ] Can select from user's tasks
- [ ] Validates hours (0-24)
- [ ] Warns if daily total > 24 hours
- [ ] Shows conflict warnings

---

### Story 3: Weekly Timesheet
**As a** technical user
**I want to** see my time entries in a weekly table
**So that** I can review and correct my time

**Tasks**:
- [ ] Task 3.1: Create timesheet-view.tsx component
- [ ] Task 3.2: Implement listTimeEntries API operation
- [ ] Task 3.3: Add week navigation (prev/next buttons)
- [ ] Task 3.4: Display time entries in table (day × task)
- [ ] Task 3.5: Add daily totals row
- [ ] Task 3.6: Add weekly total column
- [ ] Task 3.7: Highlight today's column
- [ ] Task 3.8: Add inline editing

**Acceptance Criteria**:
- [ ] Shows current week by default
- [ ] Can navigate to previous/next weeks
- [ ] Displays all time entries grouped by day
- [ ] Shows daily and weekly totals
- [ ] Today's column is highlighted

---

### Story 4: Edit/Delete Time Entries
**As a** technical user
**I want to** edit or delete existing time entries
**So that** I can correct mistakes

**Tasks**:
- [ ] Task 4.1: Create edit-time-entry.tsx dialog
- [ ] Task 4.2: Implement updateTimeEntry API operation
- [ ] Task 4.3: Implement deleteTimeEntry API operation
- [ ] Task 4.4: Add edit button to time entry rows
- [ ] Task 4.5: Add delete button with confirmation
- [ ] Task 4.6: Add optimistic updates
- [ ] Task 4.7: Add undo toast after delete
- [ ] Task 4.8: Add audit log for changes

**Acceptance Criteria**:
- [ ] Can edit hours, description, date
- [ ] Delete requires confirmation
- [ ] Changes appear immediately (optimistic)
- [ ] Undo available for 5 seconds after delete

---

### Story 5: Export Timesheet
**As a** technical user
**I want to** export my timesheet to CSV/PDF
**So that** I can share with managers or payroll

**Tasks**:
- [ ] Task 5.1: Create export-timesheet.tsx dialog
- [ ] Task 5.2: Implement CSV export
- [ ] Task 5.3: Implement PDF export (using jsPDF)
- [ ] Task 5.4: Add date range selector for export
- [ ] Task 5.5: Add export format options
- [ ] Task 5.6: Include summary statistics in export
- [ ] Task 5.7: Add download progress indicator
- [ ] Task 5.8: Add email export option

**Acceptance Criteria**:
- [ ] Can export current week or custom range
- [ ] CSV format: date, task, hours, description
- [ ] PDF format: formatted table with totals
- [ ] Includes summary stats

---

## Implementation Notes

### Timer State Management

```typescript
// Use React Query for server state + localStorage for persistence
const { data: activeTimer } = useQuery({
  queryKey: ['activeTimer', userId],
  queryFn: async () => {
    return apiClient.run({
      service: 'platform.space',
      operation: 'getActiveTimer',
      data: { userId }
    })
  },
  refetchInterval: 30000  // Check every 30s
})

// Local timer ticks (client-side only for display)
const [elapsedSeconds, setElapsedSeconds] = useState(0)

useEffect(() => {
  if (!activeTimer) return

  const interval = setInterval(() => {
    const start = new Date(activeTimer.startTime)
    const now = new Date()
    const seconds = Math.floor((now.getTime() - start.getTime()) / 1000)
    setElapsedSeconds(activeTimer.elapsedSeconds + seconds)
  }, 1000)

  return () => clearInterval(interval)
}, [activeTimer])
```

### Cross-Tab Synchronization

```typescript
// Use BroadcastChannel to sync timer across tabs
const channel = new BroadcastChannel('timer-sync')

channel.onmessage = (event) => {
  if (event.data.type === 'timer-started') {
    queryClient.invalidateQueries(['activeTimer'])
  } else if (event.data.type === 'timer-stopped') {
    queryClient.invalidateQueries(['activeTimer'])
    queryClient.invalidateQueries(['timeEntries'])
  }
}

// Broadcast when timer changes
const startTimerMutation = useMutation({
  mutationFn: startTimer,
  onSuccess: () => {
    channel.postMessage({ type: 'timer-started' })
  }
})
```

### Daily Total Validation

```typescript
// Validate that daily total doesn't exceed 24 hours
async function validateDailyTotal(
  userId: string,
  date: string,
  newHours: number,
  excludeEntryId?: string
): Promise<{ valid: boolean, total: number }> {
  const entries = await listTimeEntries({
    userId,
    startDate: date,
    endDate: date
  }, credentials)

  const total = entries
    .filter(e => e.id !== excludeEntryId)
    .reduce((sum, e) => sum + e.hours, 0) + newHours

  return {
    valid: total <= 24,
    total
  }
}
```

### Auto-Pause Timer

```typescript
// Check timer duration and auto-pause at 8 hours
useEffect(() => {
  if (!activeTimer || elapsedSeconds < 8 * 3600) return

  // Auto-pause
  stopTimerMutation.mutate({
    sessionId: activeTimer.id,
    userId,
    description: 'Auto-paused at 8 hours'
  })

  // Show notification
  toast.warning('Timer auto-paused after 8 hours')
}, [elapsedSeconds, activeTimer])
```

---

## Testing

### Unit Tests
```typescript
describe('Timer Controls', () => {
  it('starts timer and shows elapsed time', async () => {
    const { user } = setup(<TimerControls taskId="task-1" />)

    const startButton = screen.getByText('Start Timer')
    await user.click(startButton)

    await waitFor(() => {
      expect(screen.getByText(/00:00:0[1-9]/)).toBeInTheDocument()
    })
  })

  it('stops timer and creates time entry', async () => {
    const { user } = setup(<TimerControls taskId="task-1" />)

    // Start timer
    await user.click(screen.getByText('Start Timer'))

    // Wait 2 seconds
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Stop timer
    await user.click(screen.getByText('Stop Timer'))

    await waitFor(() => {
      expect(mockApiClient.run).toHaveBeenCalledWith({
        service: 'platform.space',
        operation: 'stopTimer',
        data: expect.objectContaining({
          sessionId: expect.any(String)
        })
      })
    })
  })
})

describe('Timesheet View', () => {
  it('displays weekly time entries', () => {
    const entries = [
      { id: '1', date: '2025-10-27', hours: 8, taskId: 'task-1' },
      { id: '2', date: '2025-10-28', hours: 6, taskId: 'task-2' }
    ]

    render(<TimesheetView entries={entries} />)

    expect(screen.getByText('8')).toBeInTheDocument()
    expect(screen.getByText('6')).toBeInTheDocument()
    expect(screen.getByText('14')).toBeInTheDocument()  // Total
  })
})
```

### Integration Tests
```typescript
describe('Time Entry Validation', () => {
  it('warns when daily total exceeds 24 hours', async () => {
    // Create 23 hours of existing entries
    await createTimeEntry({ userId: 'user-1', date: '2025-10-31', hours: 23 }, credentials)

    // Try to add 2 more hours
    const { user } = setup(<TimeEntryForm />)

    await user.type(screen.getByLabelText('Hours'), '2')
    await user.click(screen.getByText('Save'))

    expect(screen.getByText(/exceeds 24 hours/i)).toBeInTheDocument()
  })
})
```

---

## Dependencies
- React Query (state management)
- jsPDF (PDF export)
- date-fns (date manipulation)
- BroadcastChannel API (cross-tab sync)
- TimeEntry ontology node (new)
- TimerSession ontology node (new)
- Task ontology node (from Feature 01)

---

**Status**: Ready for Implementation
**Sprint**: Phase 2, Week 4
