# Feature 09: Backlog Management

**Persona:** Manager
**Priority:** High
**Effort:** Medium
**Status:** Sprint 2

## Overview

Drag-and-drop backlog management interface for prioritizing and organizing work items before sprint planning. Supports multiple views (list, kanban), bulk operations, and AI-powered prioritization suggestions.

## Requirements

### Functional Requirements
1. Display all backlog items (tasks and features) with drag-drop reordering
2. Support multiple view modes: priority list, swimlanes by workstream, matrix view
3. Filter and group by priority, workstream, assignee, tags
4. Bulk edit priority, assignee, tags, estimates
5. AI-suggested prioritization based on dependencies, value, and effort
6. Quick add tasks directly to backlog
7. Archive completed or rejected items

### Non-Functional Requirements
1. Smooth drag-drop with <50ms latency
2. Support 500+ backlog items without performance degradation
3. Auto-save priority changes immediately
4. Optimistic UI updates with rollback on failure
5. Keyboard shortcuts for rapid prioritization
6. Mobile-friendly touch gestures
7. Undo/redo for prioritization changes

## Ontology

### Nodes Used

```typescript
// Existing from Feature 01
interface Task {
  id: string;
  spaceId: string;
  status: 'backlog' | 'todo' | 'in-progress' | 'review' | 'done' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'critical';
  backlogRank?: number; // For ordering in backlog
  storyPoints?: number;
  // ... rest from Feature 01
}

// Existing from Feature 02
interface Feature {
  id: string;
  spaceId: string;
  status: 'draft' | 'planned' | 'in-progress' | 'completed' | 'on-hold';
  priority: 'low' | 'medium' | 'high' | 'critical';
  backlogRank?: number;
  // ... rest from Feature 02
}
```

### Edges Used

```typescript
// task → feature (belongs to)
// task → task (blocks/blocked by)
// feature → workstream (belongs to)
```

### New Ontology Nodes Required

No new ontology nodes required. Uses existing Task and Feature entities with new backlogRank field.

**Schema Update for Task and Feature:**
```typescript
// Add to existing Task and Feature schemas
{
  backlogRank: {
    type: "number",
    description: "Position in backlog (lower = higher priority)"
  },
  backlogRankUpdatedAt: {
    type: "string",
    description: "When backlog rank was last changed"
  },
  backlogRankUpdatedBy: {
    type: "string",
    description: "Who last changed backlog rank"
  }
}
```

## Components

### Reuse Existing Captify Components

```typescript
import { Button } from '@captify-io/core/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@captify-io/core/components/ui/card';
import { Badge } from '@captify-io/core/components/ui/badge';
import { Select } from '@captify-io/core/components/ui/select';
import { Input } from '@captify-io/core/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@captify-io/core/components/ui/tabs';
import { DropdownMenu } from '@captify-io/core/components/ui/dropdown-menu';
import { Checkbox } from '@captify-io/core/components/ui/checkbox';
import { Dialog } from '@captify-io/core/components/ui/dialog';
import { Separator } from '@captify-io/core/components/ui/separator';
```

### New Components to Create

```typescript
// /opt/captify-apps/core/src/components/spaces/features/backlog/backlog-view.tsx (REUSABLE)
export function BacklogView({ spaceId }: { spaceId: string }) {
  // Main backlog view with multiple layout modes
}

// /opt/captify-apps/core/src/components/spaces/features/backlog/backlog-list.tsx (REUSABLE)
export function BacklogList({ items, onReorder }: BacklogListProps) {
  // Draggable list of backlog items
}

// /opt/captify-apps/core/src/components/spaces/features/backlog/backlog-item.tsx (REUSABLE)
export function BacklogItem({ item, isDragging }: BacklogItemProps) {
  // Individual backlog item card with quick actions
}

// /opt/captify-apps/core/src/components/spaces/features/backlog/backlog-swimlanes.tsx (REUSABLE)
export function BacklogSwimlanes({ items, groupBy }: BacklogSwimlanesProps) {
  // Kanban-style swimlane view grouped by workstream/priority
}

// /opt/captify-apps/core/src/components/spaces/features/backlog/priority-matrix.tsx (REUSABLE)
export function PriorityMatrix({ items }: PriorityMatrixProps) {
  // 2x2 matrix: urgency vs importance
}

// /opt/captify-apps/core/src/components/spaces/features/backlog/ai-suggestions.tsx (REUSABLE)
export function BacklogAISuggestions({ items }: { items: BacklogItem[] }) {
  // AI-powered prioritization recommendations
}

// /opt/captify-apps/core/src/components/spaces/features/backlog/bulk-edit-dialog.tsx (REUSABLE)
export function BulkEditDialog({ selectedIds }: { selectedIds: string[] }) {
  // Bulk edit multiple backlog items
}

// /opt/captify-apps/core/src/components/spaces/features/backlog/quick-add.tsx (REUSABLE)
export function BacklogQuickAdd({ spaceId }: { spaceId: string }) {
  // Quick add task to backlog
}
```

## Actions

### 1. Get Backlog Items

```typescript
interface GetBacklogRequest {
  service: 'platform.dynamodb';
  operation: 'query';
  table: 'core-task';
  data: {
    IndexName: 'spaceId-status-index';
    KeyConditionExpression: 'spaceId = :spaceId AND #status = :status';
    ExpressionAttributeNames: {
      '#status': 'status';
    };
    ExpressionAttributeValues: {
      ':spaceId': string;
      ':status': 'backlog';
    };
  };
}
```

**Implementation:**
- Query tasks and features with status='backlog'
- Sort by backlogRank (ascending)
- Include related metadata (assignee, workstream)
- Return enriched items with dependency info

### 2. Reorder Backlog Items

```typescript
interface ReorderBacklogRequest {
  itemId: string;
  newRank: number;
  affectedItems: Array<{
    id: string;
    newRank: number;
  }>;
}

interface ReorderBacklogResponse {
  success: boolean;
  updatedItems: BacklogItem[];
}
```

**Implementation:**
- Calculate new ranks using fractional indexing (avoid mass updates)
- Update dragged item and affected items
- Use transactional writes for consistency
- Return updated items for UI sync

```typescript
// Fractional indexing example
function calculateNewRank(
  prevRank: number | null,
  nextRank: number | null
): number {
  if (!prevRank && !nextRank) return 1000;
  if (!prevRank) return nextRank - 1000;
  if (!nextRank) return prevRank + 1000;
  return (prevRank + nextRank) / 2;
}
```

### 3. AI Prioritization Suggestions

```typescript
interface AIBacklogSuggestionRequest {
  service: 'platform.bedrock';
  operation: 'invoke';
  data: {
    modelId: 'anthropic.claude-3-sonnet-20240229-v1:0';
    messages: [{
      role: 'user';
      content: string; // Backlog items context
    }];
    systemPrompt: string;
  };
}

interface AIPrioritizationResult {
  suggestedOrder: Array<{
    itemId: string;
    rank: number;
    reasoning: string;
  }>;
  insights: {
    quickWins: string[]; // High value, low effort
    blockers: string[]; // Items blocking others
    dependencies: string[]; // Should do before
  };
  confidence: number;
}
```

**Implementation:**
- Send backlog items with metadata to AI
- AI analyzes value, effort, dependencies, business priority
- Return suggested reordering with explanations
- Allow manager to accept/reject suggestions

### 4. Bulk Update Backlog Items

```typescript
interface BulkUpdateBacklogRequest {
  itemIds: string[];
  updates: {
    priority?: string;
    assigneeId?: string;
    workstreamId?: string;
    tags?: string[];
    storyPoints?: number;
  };
}

interface BulkUpdateBacklogResponse {
  successful: string[];
  failed: Array<{ itemId: string; error: string }>;
}
```

**Implementation:**
- Update multiple items in batch
- Use DynamoDB BatchWriteItem (25 items per batch)
- Handle partial failures gracefully
- Return detailed results

## User Stories & Tasks

### Story 1: Manager Views and Prioritizes Backlog
**As a** manager,
**I want to** see all backlog items and drag them to reorder priority,
**So that** the team knows what to work on next.

**Tasks:**
1. Create BacklogView component with list mode
   - Display items sorted by backlogRank
   - Show priority, assignee, estimate
   - Include filter controls
2. Implement drag-and-drop reordering
   - Use @dnd-kit/core for smooth DnD
   - Calculate fractional ranks
   - Optimistic UI updates
3. Add visual feedback during drag
   - Highlight drop zones
   - Show item preview
   - Animate position changes
4. Implement auto-save on drop
   - Persist rank changes immediately
   - Show save status indicator
   - Rollback on failure
5. Add keyboard shortcuts
   - j/k to navigate
   - Ctrl+Up/Down to reorder
   - x to select, d to defer
6. Create mobile touch gestures

**Acceptance Criteria:**
- Drag-drop feels smooth (<50ms latency)
- Changes persist immediately
- Can reorder 500+ items
- Keyboard navigation works

### Story 2: Manager Uses AI Prioritization Suggestions
**As a** manager,
**I want to** get AI recommendations on backlog prioritization,
**So that** I can make data-driven decisions.

**Tasks:**
1. Create BacklogAISuggestions component
   - Show AI-suggested order
   - Display reasoning for each suggestion
   - Highlight quick wins and blockers
2. Implement AI analysis service
   - Send backlog context to Bedrock
   - Parse structured suggestions
   - Cache results for 1 hour
3. Add "Apply Suggestions" action
   - Preview changes before applying
   - Allow partial acceptance
   - Undo if needed
4. Track suggestion acceptance rate
   - Log when suggestions are accepted/rejected
   - Use for model improvement
5. Display confidence scores
6. Add manual override explanations

**Acceptance Criteria:**
- AI suggestions appear in <3s
- Reasoning is clear and actionable
- Can apply all or selected suggestions
- Undo works correctly

### Story 3: Manager Groups Backlog by Workstream
**As a** manager,
**I want to** view backlog items grouped by workstream,
**So that** I can balance work across teams.

**Tasks:**
1. Create BacklogSwimlanes component
   - One swimlane per workstream
   - Drag items between swimlanes
   - Show item count per lane
2. Implement grouping logic
   - Group by workstream, priority, or assignee
   - Support custom groupings
   - Persist group preference
3. Add lane-level metrics
   - Total story points
   - Average priority
   - Completion velocity
4. Support drag between lanes
   - Update workstream on drop
   - Recalculate ranks per lane
5. Add lane collapse/expand
6. Create responsive mobile version

**Acceptance Criteria:**
- Swimlanes display all items
- Drag between lanes works
- Lane metrics are accurate
- Mobile version is usable

### Story 4: Manager Bulk Edits Backlog Items
**As a** manager,
**I want to** select multiple items and update them at once,
**So that** I can efficiently organize the backlog.

**Tasks:**
1. Add multi-select to backlog list
   - Checkboxes on each item
   - Select all / none
   - Shift-click range select
2. Create BulkEditDialog
   - Update priority, assignee, tags
   - Add story points
   - Move to workstream
3. Implement batch update API
   - Use DynamoDB BatchWriteItem
   - Handle errors per item
   - Show progress indicator
4. Add bulk actions toolbar
   - Appears when items selected
   - Quick actions (assign, tag, defer)
   - Keyboard shortcuts
5. Display operation results
   - Success/failure count
   - Error details
6. Add undo for bulk operations

**Acceptance Criteria:**
- Can select 50+ items
- Bulk update completes in <5s
- Errors don't block successful updates
- Undo restores previous state

### Story 5: Manager Filters and Searches Backlog
**As a** manager,
**I want to** filter and search backlog items,
**So that** I can focus on specific types of work.

**Tasks:**
1. Add filter controls
   - Priority dropdown
   - Workstream selector
   - Assignee filter
   - Tags multi-select
2. Implement search box
   - Search title and description
   - Real-time results
   - Highlight matching terms
3. Add saved filter presets
   - "High Priority Unassigned"
   - "My Team's Work"
   - "Quick Wins" (high value, low effort)
4. Support filter combinations
   - AND/OR logic
   - Advanced filter builder
5. Persist filter state in URL
6. Add "Clear all filters" button

**Acceptance Criteria:**
- Filters update view instantly
- Search returns results as you type
- Can save and reuse filters
- URL sharing works

## Implementation Notes

### Fractional Indexing for Backlog Rank

```typescript
// Efficient reordering without mass updates
class BacklogRankManager {
  private readonly BASE = 1000;
  private readonly SCALE = 1000000;

  calculateRank(prevRank: number | null, nextRank: number | null): number {
    if (prevRank === null && nextRank === null) {
      return this.BASE;
    }
    if (prevRank === null) {
      return nextRank! - this.BASE;
    }
    if (nextRank === null) {
      return prevRank! + this.BASE;
    }

    // Fractional indexing
    const newRank = (prevRank + nextRank) / 2;

    // Rebalance if too close
    if (nextRank - prevRank < 0.001) {
      this.rebalanceRanks();
    }

    return newRank;
  }

  async rebalanceRanks(spaceId: string) {
    // Called when ranks get too close together
    const items = await this.getBacklogItems(spaceId);
    items.sort((a, b) => a.backlogRank - b.backlogRank);

    const updates = items.map((item, index) => ({
      id: item.id,
      backlogRank: (index + 1) * this.BASE
    }));

    await this.batchUpdateRanks(updates);
  }
}
```

### AI Prioritization System Prompt

```typescript
const AI_PRIORITIZATION_PROMPT = `You are a backlog prioritization assistant. Analyze the following backlog items and suggest an optimal order based on:

1. Business value (ROI, user impact, strategic alignment)
2. Effort and complexity (story points, technical debt)
3. Dependencies (what blocks what)
4. Risk (what could derail the project)
5. Quick wins (high value, low effort)

Backlog Items:
{backlogItemsJson}

Provide:
1. Suggested order with ranks
2. Reasoning for each prioritization decision
3. Identification of quick wins, blockers, and dependencies
4. Overall confidence score (0-1)

Respond in JSON format.`;
```

## Testing

```typescript
describe('BacklogView', () => {
  it('displays backlog items in rank order', async () => {
    const { getAllByTestId } = render(<BacklogView spaceId="space-1" />);

    await waitFor(() => {
      const items = getAllByTestId('backlog-item');
      expect(items[0]).toHaveTextContent('Highest Priority');
      expect(items[items.length - 1]).toHaveTextContent('Lowest Priority');
    });
  });

  it('reorders items on drag-drop', async () => {
    const { getByText } = render(<BacklogView spaceId="space-1" />);

    const item = getByText('Item 3');
    await dragAndDrop(item, { position: 0 });

    await waitFor(() => {
      expect(mockUpdateRank).toHaveBeenCalledWith(
        expect.objectContaining({ newRank: expect.any(Number) })
      );
    });
  });
});

describe('BacklogRankManager', () => {
  it('calculates fractional ranks correctly', () => {
    const manager = new BacklogRankManager();

    expect(manager.calculateRank(null, null)).toBe(1000);
    expect(manager.calculateRank(1000, 2000)).toBe(1500);
    expect(manager.calculateRank(null, 1000)).toBe(0);
  });

  it('triggers rebalance when ranks too close', async () => {
    const manager = new BacklogRankManager();
    const rebalanceSpy = jest.spyOn(manager, 'rebalanceRanks');

    manager.calculateRank(1000.0001, 1000.0002);

    expect(rebalanceSpy).toHaveBeenCalled();
  });
});

describe('AI Prioritization', () => {
  it('suggests prioritization with reasoning', async () => {
    const result = await getAIPrioritization(mockBacklogItems);

    expect(result.suggestedOrder).toHaveLength(mockBacklogItems.length);
    expect(result.suggestedOrder[0].reasoning).toBeTruthy();
    expect(result.insights.quickWins).toBeInstanceOf(Array);
  });
});
```

## Dependencies

**Upstream:**
- Feature 01 (Task Management) - tasks in backlog
- Feature 02 (Feature Planning) - features in backlog
- Feature 08 (Request Inbox) - requests convert to backlog items

**Downstream:**
- Feature 10 (Sprint Planning) - pulls from backlog
- Feature 11 (Team Board) - items move from backlog to sprint

## Status

- **Current Sprint:** Sprint 2
- **Status:** Not Started
- **Blocked By:** None
- **Next Steps:** Implement fractional indexing and drag-drop
