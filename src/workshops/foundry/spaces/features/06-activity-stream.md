# Feature 06: Activity Stream (Technical)

**Persona**: Technical (Doers)
**Priority**: P2 - Medium
**Effort**: 3 story points

---

## Requirements

### Functional Requirements
- FR1: Real-time feed of team activity (task updates, comments, completions)
- FR2: Filter by activity type (tasks, time, comments, blockers)
- FR3: Filter by team member
- FR4: Show avatar, action description, timestamp
- FR5: Click activity to navigate to related item
- FR6: Pagination or infinite scroll
- FR7: Unread indicator for new activities

### Non-Functional Requirements
- NFR1: Real-time updates via WebSocket or polling
- NFR2: Load initial feed in <500ms
- NFR3: Support 1000+ activity items
- NFR4: Accessible (screen reader friendly)

---

## Ontology

### Nodes Used
```typescript
Activity {
  id: string
  userId: string
  type: 'task_created' | 'task_updated' | 'task_completed' | 'time_logged' | 'blocker_created' | 'comment_added'
  entityType: 'task' | 'time-entry' | 'blocker' | 'comment'
  entityId: string
  metadata: {
    taskTitle?: string
    oldStatus?: string
    newStatus?: string
    hours?: number
    commentText?: string
  }
  spaceId?: string
  createdAt: string
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
// User → Activity
{
  source: 'user',
  target: 'activity',
  relation: 'performed',
  type: 'one-to-many'
}
```

### New Ontology Nodes Required

```typescript
// Add to core/services/ontology/definitions/activity.ts
export const activityNode: OntologyNode = {
  id: 'core-activity',
  name: 'Activity',
  type: 'activity',
  category: 'entity',
  domain: 'Work Management',
  description: 'User activity event',
  icon: 'Activity',
  color: '#6366f1',
  active: 'true',
  properties: {
    dataSource: 'core-activity',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        userId: { type: 'string', required: true },
        type: {
          type: 'string',
          enum: ['task_created', 'task_updated', 'task_completed', 'time_logged', 'blocker_created', 'comment_added'],
          required: true
        },
        entityType: {
          type: 'string',
          enum: ['task', 'time-entry', 'blocker', 'comment'],
          required: true
        },
        entityId: { type: 'string', required: true },
        metadata: { type: 'object' },
        spaceId: { type: 'string' }
      }
    },
    indexes: {
      'userId-createdAt-index': {
        hashKey: 'userId',
        rangeKey: 'createdAt',
        type: 'GSI'
      },
      'spaceId-createdAt-index': {
        hashKey: 'spaceId',
        rangeKey: 'createdAt',
        type: 'GSI'
      },
      'type-createdAt-index': {
        hashKey: 'type',
        rangeKey: 'createdAt',
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
import { ScrollArea } from '@captify-io/core/components/ui/scroll-area'
import { Avatar, AvatarImage, AvatarFallback } from '@captify-io/core/components/ui/avatar'
import { Badge } from '@captify-io/core/components/ui/badge'
import { Select, SelectTrigger, SelectContent, SelectItem } from '@captify-io/core/components/ui/select'
import { Skeleton } from '@captify-io/core/components/ui/skeleton'

// From @captify-io/core/lib
import { apiClient } from '@captify-io/core/lib/api'

// From @captify-io/core/hooks
import { useSession } from '@captify-io/core/hooks'
```

### New Components to Create
```
/components/spaces/panels/technical/
  activity-stream-panel.tsx     # Main activity feed

/components/spaces/items/
  activity-item.tsx             # Activity entry (REUSABLE)
  activity-filters.tsx          # Filter controls (REUSABLE)
```

---

## Actions

### Create Activity
```typescript
// Service: platform.space
// Operation: createActivity

interface CreateActivityRequest {
  service: 'platform.space'
  operation: 'createActivity'
  data: {
    userId: string
    type: string
    entityType: string
    entityId: string
    metadata?: any
    spaceId?: string
  }
}

export async function createActivity(
  params: {
    userId: string
    type: string
    entityType: string
    entityId: string
    metadata?: any
    spaceId?: string
  },
  credentials: AwsCredentials
): Promise<Activity> {
  const activity: Activity = {
    id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId: params.userId,
    type: params.type as any,
    entityType: params.entityType as any,
    entityId: params.entityId,
    metadata: params.metadata || {},
    spaceId: params.spaceId,
    createdAt: new Date().toISOString()
  }

  await dynamodb.put({
    TableName: await resolveTableName('core-activity', process.env.SCHEMA!, credentials),
    Item: marshall(activity)
  }, credentials)

  return activity
}
```

### List Activities
```typescript
// Service: platform.space
// Operation: listActivities

interface ListActivitiesRequest {
  service: 'platform.space'
  operation: 'listActivities'
  data: {
    spaceId?: string
    userId?: string
    type?: string
    limit?: number
    nextToken?: string
  }
}

export async function listActivities(
  params: {
    spaceId?: string
    userId?: string
    type?: string
    limit?: number
    nextToken?: string
  },
  credentials: AwsCredentials
): Promise<{ activities: Activity[], nextToken?: string }> {
  let queryParams: QueryCommandInput

  if (params.spaceId) {
    queryParams = {
      TableName: await resolveTableName('core-activity', process.env.SCHEMA!, credentials),
      IndexName: 'spaceId-createdAt-index',
      KeyConditionExpression: 'spaceId = :spaceId',
      ExpressionAttributeValues: {
        ':spaceId': { S: params.spaceId }
      },
      Limit: params.limit || 50,
      ScanIndexForward: false,
      ExclusiveStartKey: params.nextToken ? JSON.parse(params.nextToken) : undefined
    }
  } else if (params.userId) {
    queryParams = {
      TableName: await resolveTableName('core-activity', process.env.SCHEMA!, credentials),
      IndexName: 'userId-createdAt-index',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': { S: params.userId }
      },
      Limit: params.limit || 50,
      ScanIndexForward: false,
      ExclusiveStartKey: params.nextToken ? JSON.parse(params.nextToken) : undefined
    }
  } else if (params.type) {
    queryParams = {
      TableName: await resolveTableName('core-activity', process.env.SCHEMA!, credentials),
      IndexName: 'type-createdAt-index',
      KeyConditionExpression: '#type = :type',
      ExpressionAttributeNames: { '#type': 'type' },
      ExpressionAttributeValues: {
        ':type': { S: params.type }
      },
      Limit: params.limit || 50,
      ScanIndexForward: false,
      ExclusiveStartKey: params.nextToken ? JSON.parse(params.nextToken) : undefined
    }
  } else {
    // Scan all (fallback)
    queryParams = {
      TableName: await resolveTableName('core-activity', process.env.SCHEMA!, credentials),
      Limit: params.limit || 50,
      ExclusiveStartKey: params.nextToken ? JSON.parse(params.nextToken) : undefined
    }
  }

  const result = await dynamodb.query(queryParams, credentials)
  const activities = result.Items?.map(item => unmarshall(item) as Activity) || []

  return {
    activities,
    nextToken: result.LastEvaluatedKey ? JSON.stringify(result.LastEvaluatedKey) : undefined
  }
}
```

---

## User Stories & Tasks

### Story 1: Activity Feed Display
**As a** technical user
**I want to** see a feed of recent team activity
**So that** I stay informed about work progress

**Tasks**:
- [ ] Task 1.1: Create activity-stream-panel.tsx component
- [ ] Task 1.2: Create activity-item.tsx component
- [ ] Task 1.3: Implement listActivities API operation
- [ ] Task 1.4: Add infinite scroll (react-intersection-observer)
- [ ] Task 1.5: Display user avatar and name
- [ ] Task 1.6: Format activity description
- [ ] Task 1.7: Show relative timestamps ("2 hours ago")
- [ ] Task 1.8: Add loading skeleton

**Acceptance Criteria**:
- [ ] Shows most recent 50 activities
- [ ] Loads more on scroll to bottom
- [ ] Each activity shows: avatar, name, action, timestamp
- [ ] Skeleton shown while loading

---

### Story 2: Activity Filtering
**As a** technical user
**I want to** filter activities by type or person
**So that** I can focus on relevant updates

**Tasks**:
- [ ] Task 2.1: Create activity-filters.tsx component
- [ ] Task 2.2: Add type filter dropdown
- [ ] Task 2.3: Add user filter dropdown
- [ ] Task 2.4: Update query params on filter change
- [ ] Task 2.5: Persist filters to URL params
- [ ] Task 2.6: Add "Clear filters" button
- [ ] Task 2.7: Show active filter badges

**Acceptance Criteria**:
- [ ] Can filter by type (tasks, time, blockers)
- [ ] Can filter by team member
- [ ] Filters update feed immediately
- [ ] Filters persist in URL

---

### Story 3: Activity Click Navigation
**As a** technical user
**I want to** click an activity to see the related item
**So that** I can quickly access context

**Tasks**:
- [ ] Task 3.1: Add click handler to activity items
- [ ] Task 3.2: Navigate to task detail for task activities
- [ ] Task 3.3: Navigate to timesheet for time activities
- [ ] Task 3.4: Show blocker dialog for blocker activities
- [ ] Task 3.5: Add hover state to indicate clickable
- [ ] Task 3.6: Add cursor pointer on hover

**Acceptance Criteria**:
- [ ] Clicking task activity opens task detail
- [ ] Clicking time activity opens timesheet
- [ ] Clicking blocker activity shows blocker
- [ ] Hover shows clickable cursor

---

### Story 4: Real-time Updates
**As a** technical user
**I want to** see new activities appear automatically
**So that** I don't need to refresh

**Tasks**:
- [ ] Task 4.1: Set up React Query with refetchInterval
- [ ] Task 4.2: Add new activity animation (slide in)
- [ ] Task 4.3: Show "New activities" banner when off-screen
- [ ] Task 4.4: Scroll to top on banner click
- [ ] Task 4.5: Add unread indicator badge
- [ ] Task 4.6: Mark as read on view
- [ ] Task 4.7: Optional: WebSocket integration for instant updates

**Acceptance Criteria**:
- [ ] New activities appear automatically (30s polling)
- [ ] Animation when new activity arrives
- [ ] Banner shown if scrolled away
- [ ] Unread count shown in header

---

## Implementation Notes

### Activity Description Formatting

```typescript
function formatActivityDescription(activity: Activity): string {
  switch (activity.type) {
    case 'task_created':
      return `created task "${activity.metadata.taskTitle}"`

    case 'task_updated':
      if (activity.metadata.oldStatus !== activity.metadata.newStatus) {
        return `moved "${activity.metadata.taskTitle}" from ${activity.metadata.oldStatus} to ${activity.metadata.newStatus}`
      }
      return `updated task "${activity.metadata.taskTitle}"`

    case 'task_completed':
      return `completed task "${activity.metadata.taskTitle}"`

    case 'time_logged':
      return `logged ${activity.metadata.hours}h on "${activity.metadata.taskTitle}"`

    case 'blocker_created':
      return `reported blocker on "${activity.metadata.taskTitle}"`

    case 'comment_added':
      return `commented on "${activity.metadata.taskTitle}": "${activity.metadata.commentText}"`

    default:
      return 'performed an action'
  }
}
```

### Infinite Scroll with React Query

```typescript
import { useInfiniteQuery } from '@tanstack/react-query'
import { useInView } from 'react-intersection-observer'

function ActivityStream() {
  const { ref, inView } = useInView()

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteQuery({
    queryKey: ['activities', filters],
    queryFn: async ({ pageParam }) => {
      return apiClient.run({
        service: 'platform.space',
        operation: 'listActivities',
        data: {
          ...filters,
          nextToken: pageParam
        }
      })
    },
    getNextPageParam: (lastPage) => lastPage.nextToken,
    initialPageParam: undefined
  })

  // Load more when bottom is visible
  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage()
    }
  }, [inView, hasNextPage, fetchNextPage])

  return (
    <ScrollArea>
      {data?.pages.map(page =>
        page.activities.map(activity => (
          <ActivityItem key={activity.id} activity={activity} />
        ))
      )}
      {hasNextPage && <div ref={ref}><Skeleton /></div>}
    </ScrollArea>
  )
}
```

### Real-time Polling

```typescript
// Refetch every 30 seconds for new activities
const { data: activities } = useQuery({
  queryKey: ['activities'],
  queryFn: async () => {
    return apiClient.run({
      service: 'platform.space',
      operation: 'listActivities',
      data: { limit: 50 }
    })
  },
  refetchInterval: 30000,  // 30 seconds
  refetchIntervalInBackground: true
})
```

### Auto-create Activities on Actions

Modify existing operations to automatically create activity records:

```typescript
// In updateTaskStatus
export async function updateTaskStatus(params, credentials) {
  // ... existing update logic ...

  // Create activity
  await createActivity({
    userId: params.userId,
    type: 'task_updated',
    entityType: 'task',
    entityId: params.taskId,
    metadata: {
      taskTitle: task.title,
      oldStatus: oldTask.status,
      newStatus: params.status
    },
    spaceId: task.spaceId
  }, credentials)

  return task
}
```

---

## Testing

### Unit Tests
```typescript
describe('ActivityStream', () => {
  it('renders activity feed', () => {
    const activities = [
      {
        id: '1',
        userId: 'user-1',
        type: 'task_created',
        metadata: { taskTitle: 'Fix bug' },
        createdAt: '2025-10-31T10:00:00Z'
      }
    ]

    render(<ActivityStream activities={activities} />)

    expect(screen.getByText(/created task "Fix bug"/)).toBeInTheDocument()
  })

  it('loads more activities on scroll', async () => {
    const { container } = render(<ActivityStream />)

    const sentinel = container.querySelector('[data-sentinel]')
    fireEvent.scroll(sentinel!)

    await waitFor(() => {
      expect(mockFetchNextPage).toHaveBeenCalled()
    })
  })
})

describe('Activity Formatting', () => {
  it('formats task_created activity', () => {
    const activity = {
      type: 'task_created',
      metadata: { taskTitle: 'New feature' }
    }

    const description = formatActivityDescription(activity)
    expect(description).toBe('created task "New feature"')
  })

  it('formats task status change', () => {
    const activity = {
      type: 'task_updated',
      metadata: {
        taskTitle: 'Bug fix',
        oldStatus: 'ready',
        newStatus: 'in-progress'
      }
    }

    const description = formatActivityDescription(activity)
    expect(description).toContain('from ready to in-progress')
  })
})
```

---

## Dependencies
- react-intersection-observer (infinite scroll)
- React Query (data fetching)
- Activity ontology node (new)
- User ontology node (existing)
- Auto-activity creation in existing operations

---

**Status**: Ready for Implementation
**Sprint**: Phase 3, Week 1
