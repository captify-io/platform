# Feature 10: Sprint Planning

**Persona:** Manager
**Priority:** High
**Effort:** Large
**Status:** Sprint 2

## Overview

Interactive sprint planning interface for selecting backlog items, setting sprint goals, and allocating team capacity. Supports velocity tracking, capacity planning, and AI-powered sprint recommendations.

## Requirements

### Functional Requirements
1. Create and configure sprints (name, start/end dates, goals)
2. Drag backlog items into sprint with capacity validation
3. Track team velocity and capacity automatically
4. Display sprint metrics (story points, hours, team utilization)
5. AI-suggested sprint composition based on dependencies and capacity
6. Support multiple concurrent sprints (different workstreams)
7. Lock sprints once started, archive when complete

### Non-Functional Requirements
1. Support 100+ items per sprint without lag
2. Real-time capacity calculations (<100ms)
3. Auto-save sprint changes
4. Support team of 20+ members
5. Mobile-responsive sprint planning view
6. Undo/redo sprint changes
7. Export sprint plan to PDF/CSV

## Ontology

### Nodes Used

```typescript
// Existing from Feature 01
interface Task {
  id: string;
  spaceId: string;
  sprintId?: string;
  status: string;
  storyPoints?: number;
  estimatedHours?: number;
  // ...
}
```

### Edges Used

```typescript
// sprint → task (contains)
// sprint → workstream (belongs to)
// sprint → user (team member)
```

### New Ontology Nodes Required

```typescript
// OntologyNode for Sprint
{
  id: "core-sprint",
  name: "Sprint",
  type: "sprint",
  category: "entity",
  domain: "Workflow",
  description: "Time-boxed iteration for completing work",
  icon: "Calendar",
  color: "#8b5cf6",
  active: "true",
  properties: {
    dataSource: "core-sprint",
    schema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Unique identifier" },
        spaceId: { type: "string", description: "Space this sprint belongs to", required: true },
        workstreamId: { type: "string", description: "Associated workstream" },
        name: { type: "string", description: "Sprint name", required: true },
        goal: { type: "string", description: "Sprint goal/objective" },

        // Timing
        startDate: { type: "string", description: "Sprint start date (ISO 8601)", required: true },
        endDate: { type: "string", description: "Sprint end date (ISO 8601)", required: true },
        duration: { type: "number", description: "Sprint duration in days" },

        // Status
        status: {
          type: "string",
          enum: ["planning", "active", "completed", "cancelled"],
          description: "Sprint status",
          required: true
        },

        // Capacity
        plannedCapacity: { type: "number", description: "Total team capacity in hours" },
        committedPoints: { type: "number", description: "Story points committed" },
        committedHours: { type: "number", description: "Hours committed" },

        // Velocity
        completedPoints: { type: "number", description: "Story points completed" },
        completedHours: { type: "number", description: "Hours completed" },
        velocity: { type: "number", description: "Historical velocity (avg points per sprint)" },

        // Team
        teamMembers: {
          type: "array",
          items: {
            type: "object",
            properties: {
              userId: { type: "string" },
              capacity: { type: "number", description: "Individual capacity in hours" },
              allocation: { type: "number", description: "Percentage allocated to this sprint" }
            }
          },
          description: "Team member assignments"
        },

        // Metadata
        tags: { type: "array", items: { type: "string" } },
        notes: { type: "string", description: "Planning notes" },

        createdAt: { type: "string" },
        updatedAt: { type: "string" },
        createdBy: { type: "string" },
        startedAt: { type: "string", description: "When sprint was started" },
        completedAt: { type: "string", description: "When sprint was completed" }
      },
      required: ["spaceId", "name", "startDate", "endDate", "status"]
    },
    indexes: {
      "spaceId-startDate-index": {
        hashKey: "spaceId",
        rangeKey: "startDate",
        type: "GSI"
      },
      "status-startDate-index": {
        hashKey: "status",
        rangeKey: "startDate",
        type: "GSI"
      },
      "workstreamId-startDate-index": {
        hashKey: "workstreamId",
        rangeKey: "startDate",
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
import { Card } from '@captify-io/core/components/ui/card';
import { Dialog } from '@captify-io/core/components/ui/dialog';
import { Input } from '@captify-io/core/components/ui/input';
import { Select } from '@captify-io/core/components/ui/select';
import { Badge } from '@captify-io/core/components/ui/badge';
import { Tabs } from '@captify-io/core/components/ui/tabs';
import { Avatar } from '@captify-io/core/components/ui/avatar';
import { Progress } from '@captify-io/core/components/ui/progress';
import { DatePicker } from '@captify-io/core/components/ui/date-picker';
```

### New Components to Create

```typescript
// /opt/captify-apps/core/src/components/spaces/features/sprint/planning-view.tsx (REUSABLE)
export function SprintPlanningView({ spaceId }: { spaceId: string }) {
  // Main sprint planning interface
}

// /opt/captify-apps/core/src/components/spaces/features/sprint/sprint-config-dialog.tsx (REUSABLE)
export function SprintConfigDialog({ sprint }: { sprint?: Sprint }) {
  // Create/edit sprint configuration
}

// /opt/captify-apps/core/src/components/spaces/features/sprint/sprint-backlog.tsx (REUSABLE)
export function SprintBacklog({ sprintId }: { sprintId: string }) {
  // Drag-drop items from backlog to sprint
}

// /opt/captify-apps/core/src/components/spaces/features/sprint/capacity-panel.tsx (REUSABLE)
export function CapacityPanel({ sprint }: { sprint: Sprint }) {
  // Team capacity visualization and tracking
}

// /opt/captify-apps/core/src/components/spaces/features/sprint/sprint-metrics.tsx (REUSABLE)
export function SprintMetrics({ sprint }: { sprint: Sprint }) {
  // Sprint metrics dashboard (points, hours, velocity)
}

// /opt/captify-apps/core/src/components/spaces/features/sprint/ai-sprint-suggestions.tsx (REUSABLE)
export function AISprintSuggestions({ sprint, backlogItems }: AISprintSuggestionsProps) {
  // AI-powered sprint composition recommendations
}

// /opt/captify-apps/core/src/components/spaces/features/sprint/team-allocation.tsx (REUSABLE)
export function TeamAllocation({ sprint }: { sprint: Sprint }) {
  // Configure team member capacity and allocation
}
```

## Actions

### 1. Create Sprint

```typescript
interface CreateSprintRequest {
  service: 'platform.dynamodb';
  operation: 'put';
  table: 'core-sprint';
  data: {
    Item: {
      id: string;
      spaceId: string;
      name: string;
      startDate: string;
      endDate: string;
      status: 'planning';
      createdAt: string;
      createdBy: string;
    };
  };
}
```

### 2. Add Items to Sprint

```typescript
interface AddItemsToSprintRequest {
  sprintId: string;
  itemIds: string[];
  updateCapacity: boolean;
}

interface AddItemsToSprintResponse {
  sprint: Sprint;
  updatedItems: Task[];
  capacityWarning?: {
    exceeds: boolean;
    currentPoints: number;
    plannedCapacity: number;
  };
}
```

**Implementation:**
- Update task records with sprintId
- Recalculate sprint metrics (committedPoints, committedHours)
- Validate against team capacity
- Return warning if overcommitted

### 3. Calculate Sprint Capacity

```typescript
interface CalculateCapacityRequest {
  sprintId: string;
  teamMembers: Array<{
    userId: string;
    availableHours: number; // Per day
    daysAvailable: number;
    allocation: number; // Percentage
  }>;
}

interface CapacityResult {
  totalCapacityHours: number;
  estimatedPoints: number; // Based on historical velocity
  utilizationPercentage: number;
  memberCapacities: Array<{
    userId: string;
    capacity: number;
    assigned: number;
    remaining: number;
  }>;
}
```

**Implementation:**
- Sum individual capacities: hours * days * allocation
- Calculate estimated points from velocity
- Track utilization per member
- Warn if overcommitted

### 4. AI Sprint Composition

```typescript
interface AISprintCompositionRequest {
  service: 'platform.bedrock';
  operation: 'invoke';
  data: {
    modelId: 'anthropic.claude-3-sonnet-20240229-v1:0';
    messages: [{
      role: 'user';
      content: string; // Sprint context + backlog
    }];
  };
}

interface AISprintCompositionResult {
  recommendedItems: Array<{
    itemId: string;
    reason: string;
    priority: number;
  }>;
  estimatedCompletion: number; // Percentage
  risks: string[];
  suggestions: string[];
  confidence: number;
}
```

## User Stories & Tasks

### Story 1: Manager Creates New Sprint
**As a** manager,
**I want to** create a sprint with dates and goals,
**So that** the team knows what period they're working in.

**Tasks:**
1. Create SprintConfigDialog
2. Add date range picker
3. Set sprint goals
4. Configure team capacity
5. Generate sprint name automatically
6. Validate date overlaps

**Acceptance Criteria:**
- Can set 1-4 week sprints
- No overlapping sprints
- Goals are clear

### Story 2: Manager Adds Items to Sprint
**As a** manager,
**I want to** drag backlog items into the sprint,
**So that** the team knows what to work on.

**Tasks:**
1. Create drag-drop from backlog to sprint
2. Show capacity warnings
3. Display running totals
4. Support bulk add
5. Allow item removal
6. Persist changes immediately

**Acceptance Criteria:**
- Drag-drop is smooth
- Capacity calculated in real-time
- Can't overcommit without warning

### Story 3: Manager Views Team Capacity
**As a** manager,
**I want to** see team capacity and utilization,
**So that** I don't overcommit the team.

**Tasks:**
1. Create CapacityPanel
2. Show total vs used capacity
3. Break down by team member
4. Display warnings if overcommitted
5. Allow capacity adjustments
6. Show historical velocity

**Acceptance Criteria:**
- Clear capacity visualization
- Per-member breakdown
- Warnings are prominent

### Story 4: Manager Uses AI Sprint Suggestions
**As a** manager,
**I want to** get AI recommendations for sprint composition,
**So that** I can make optimal decisions.

**Tasks:**
1. Create AI recommendation service
2. Analyze dependencies and priority
3. Suggest optimal item combination
4. Display reasoning
5. Allow accept/reject suggestions
6. Track suggestion accuracy

**Acceptance Criteria:**
- Suggestions appear in <3s
- Reasoning is clear
- Can apply suggestions

### Story 5: Manager Starts Sprint
**As a** manager,
**I want to** lock and start the sprint,
**So that** the team can begin work.

**Tasks:**
1. Add "Start Sprint" action
2. Lock sprint from further changes
3. Notify team members
4. Initialize sprint board
5. Set status to 'active'
6. Generate sprint snapshot

**Acceptance Criteria:**
- Sprint locks correctly
- Team is notified
- No further edits allowed

## Implementation Notes

```typescript
// Capacity calculation
function calculateSprintCapacity(
  teamMembers: TeamMember[],
  sprintDays: number
): number {
  return teamMembers.reduce((total, member) => {
    return total + (member.hoursPerDay * sprintDays * member.allocation);
  }, 0);
}

// Velocity-based estimation
function estimateSprintPoints(
  capacity: number,
  historicalVelocity: number
): number {
  const avgHoursPerPoint = capacity / historicalVelocity;
  return Math.floor(capacity / avgHoursPerPoint);
}
```

## Testing

```typescript
describe('SprintPlanningView', () => {
  it('creates new sprint', async () => {
    const { getByText, getByLabelText } = render(<SprintPlanningView spaceId="space-1" />);

    fireEvent.click(getByText('New Sprint'));
    fireEvent.change(getByLabelText('Sprint Name'), { target: { value: 'Sprint 1' } });
    fireEvent.click(getByText('Create'));

    await waitFor(() => {
      expect(getByText('Sprint 1')).toBeInTheDocument();
    });
  });

  it('warns when capacity exceeded', async () => {
    const { getByText } = render(<SprintPlanningView spaceId="space-1" />);

    await dragTaskToSprint('high-effort-task');

    await waitFor(() => {
      expect(getByText(/capacity exceeded/i)).toBeInTheDocument();
    });
  });
});
```

## Dependencies

**Upstream:**
- Feature 01 (Task Management)
- Feature 09 (Backlog Management)

**Downstream:**
- Feature 11 (Team Board)
- Feature 12 (Capacity Planning)

## Status

- **Current Sprint:** Sprint 2
- **Status:** Not Started
