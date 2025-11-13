# Feature 11: Team Board

**Persona:** Manager
**Priority:** High
**Effort:** Medium
**Status:** Sprint 2

## Overview

Kanban/Scrum board for visualizing and managing active sprint work. Supports drag-drop task movement, real-time updates, swimlanes, and team collaboration features.

## Requirements

### Functional Requirements
1. Display tasks in columns (Todo, In Progress, Review, Done, Blocked)
2. Drag-drop tasks between columns with status auto-update
3. Support swimlanes by assignee, workstream, or priority
4. Real-time updates when team members move tasks
5. Quick edit task details inline
6. Filter by assignee, priority, tags
7. Sprint burndown and progress tracking

### Non-Functional Requirements
1. Support 200+ tasks per board
2. Real-time sync <500ms
3. Smooth animations
4. Mobile touch gestures
5. Offline mode with sync
6. Board loads in <1s
7. Support 50+ concurrent users

## Ontology

### Nodes Used

```typescript
// From Feature 01
interface Task {
  id: string;
  sprintId: string;
  status: 'todo' | 'in-progress' | 'review' | 'done' | 'blocked';
  // ...
}

// From Feature 10
interface Sprint {
  id: string;
  status: 'active';
  // ...
}
```

### Edges Used
```typescript
// sprint → task (contains)
// user → task (assigned)
```

### New Ontology Nodes Required
None - uses existing Task and Sprint entities.

## Components

### Reuse Existing Captify Components
```typescript
import { Card } from '@captify-io/core/components/ui/card';
import { Badge } from '@captify-io/core/components/ui/badge';
import { Avatar } from '@captify-io/core/components/ui/avatar';
import { Button } from '@captify-io/core/components/ui/button';
import { Progress } from '@captify-io/core/components/ui/progress';
```

### New Components to Create
```typescript
// /opt/captify-apps/core/src/components/spaces/features/board/team-board.tsx (REUSABLE)
export function TeamBoard({ sprintId }: { sprintId: string })

// /opt/captify-apps/core/src/components/spaces/features/board/board-column.tsx (REUSABLE)
export function BoardColumn({ status, tasks }: BoardColumnProps)

// /opt/captify-apps/core/src/components/spaces/features/board/task-card.tsx (REUSABLE)
export function TaskCard({ task }: { task: Task })

// /opt/captify-apps/core/src/components/spaces/features/board/swimlane-view.tsx (REUSABLE)
export function SwimlaneView({ groupBy }: { groupBy: string })

// /opt/captify-apps/core/src/components/spaces/features/board/burndown-chart.tsx (REUSABLE)
export function BurndownChart({ sprint }: { sprint: Sprint })
```

## Actions

### 1. Get Board Tasks
```typescript
interface GetBoardTasksRequest {
  service: 'platform.dynamodb';
  operation: 'query';
  table: 'core-task';
  data: {
    IndexName: 'sprintId-status-index';
    KeyConditionExpression: 'sprintId = :sprintId';
    ExpressionAttributeValues: { ':sprintId': string };
  };
}
```

### 2. Move Task
```typescript
interface MoveTaskRequest {
  taskId: string;
  newStatus: TaskStatus;
  movedBy: string;
}
```

### 3. Real-time Updates
Use WebSocket or polling for live board updates.

## User Stories & Tasks

### Story 1: Team Views Sprint Board
**Tasks:**
1. Display kanban columns
2. Fetch and render tasks
3. Apply filters
4. Show metrics

**Acceptance Criteria:**
- Board loads in <1s
- All tasks visible

### Story 2: Team Member Moves Task
**Tasks:**
1. Implement drag-drop
2. Update status on drop
3. Optimistic UI
4. Broadcast change

**Acceptance Criteria:**
- Drag-drop is smooth
- Status updates instantly

### Story 3: Manager Views Burndown
**Tasks:**
1. Create burndown chart
2. Calculate remaining points
3. Show trend line
4. Display completion forecast

**Acceptance Criteria:**
- Chart updates daily
- Accurate calculations

## Implementation Notes
```typescript
// Real-time board sync
const useBoardRealtime = (sprintId: string) => {
  useEffect(() => {
    const ws = new WebSocket(`wss://api.captify.io/board/${sprintId}`);
    ws.onmessage = (event) => {
      const update = JSON.parse(event.data);
      updateTaskOptimistically(update);
    };
    return () => ws.close();
  }, [sprintId]);
};
```

## Testing
```typescript
describe('TeamBoard', () => {
  it('displays tasks in columns', () => {
    const { getByText } = render(<TeamBoard sprintId="sprint-1" />);
    expect(getByText('Todo')).toBeInTheDocument();
  });
});
```

## Dependencies
- Feature 01 (Task Management)
- Feature 10 (Sprint Planning)

## Status
- **Sprint:** Sprint 2
- **Status:** Not Started
