# Feature 16: Objective Tracking (OKRs)

**Persona:** Executive
**Priority:** Critical
**Effort:** Large
**Status:** Sprint 1

## Overview
OKR (Objectives and Key Results) tracking system for strategic goal management with progress visualization, cascading objectives, and automated check-ins.

## Requirements

### Functional Requirements
1. Create/edit objectives with key results
2. Track progress automatically from linked tasks/features
3. Support cascading objectives (company → team → individual)
4. Weekly check-ins with updates and confidence scores
5. Visualize progress with charts and burndown
6. Link OKRs to workstreams and features
7. Archive completed OKRs by quarter

### Non-Functional Requirements
1. Support 100+ active OKRs
2. Progress updates in real-time
3. Mobile check-in experience
4. Export OKR reports (PDF, PPTX)
5. Integration with calendar for check-ins
6. Historical trend analysis
7. Load in <1s

## Ontology

### New Ontology Nodes Required

```typescript
// OntologyNode for Objective
{
  id: "core-objective",
  name: "Objective",
  type: "objective",
  category: "entity",
  domain: "Strategy",
  description: "Strategic objective with measurable key results (OKR)",
  icon: "Target",
  color: "#3b82f6",
  active: "true",
  properties: {
    dataSource: "core-objective",
    schema: {
      type: "object",
      properties: {
        id: { type: "string" },
        spaceId: { type: "string", required: true },
        parentObjectiveId: { type: "string", description: "Parent objective for cascading" },
        title: { type: "string", required: true },
        description: { type: "string" },
        ownerId: { type: "string", required: true },
        quarter: { type: "string", required: true }, // "2025-Q1"
        status: {
          type: "string",
          enum: ["draft", "active", "completed", "cancelled", "missed"],
          required: true
        },
        progress: { type: "number", description: "0-100" },
        confidenceLevel: {
          type: "string",
          enum: ["on-track", "at-risk", "off-track"],
          description: "Current confidence"
        },
        keyResults: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              description: { type: "string" },
              metric: { type: "string" },
              startValue: { type: "number" },
              targetValue: { type: "number" },
              currentValue: { type: "number" },
              unit: { type: "string" },
              progress: { type: "number" }
            }
          },
          required: true
        },
        linkedWorkstreams: { type: "array", items: { type: "string" } },
        linkedFeatures: { type: "array", items: { type: "string" } },
        tags: { type: "array", items: { type: "string" } },
        createdAt: { type: "string" },
        updatedAt: { type: "string" }
      },
      required: ["spaceId", "title", "ownerId", "quarter", "status", "keyResults"]
    },
    indexes: {
      "spaceId-quarter-index": {
        hashKey: "spaceId",
        rangeKey: "quarter",
        type: "GSI"
      },
      "ownerId-status-index": {
        hashKey: "ownerId",
        rangeKey: "status",
        type: "GSI"
      },
      "quarter-status-index": {
        hashKey: "quarter",
        rangeKey: "status",
        type: "GSI"
      }
    }
  }
}

// OntologyNode for OKRCheckIn
{
  id: "core-okr-checkin",
  name: "OKRCheckIn",
  type: "okrCheckIn",
  category: "entity",
  domain: "Strategy",
  description: "Weekly check-in update for objective progress",
  icon: "CheckSquare",
  color: "#10b981",
  active: "true",
  properties: {
    dataSource: "core-okr-checkin",
    schema: {
      type: "object",
      properties: {
        id: { type: "string" },
        objectiveId: { type: "string", required: true },
        userId: { type: "string", required: true },
        weekEnding: { type: "string", required: true },
        progress: { type: "number" },
        confidenceLevel: { type: "string", enum: ["on-track", "at-risk", "off-track"] },
        accomplishments: { type: "string" },
        blockers: { type: "string" },
        nextSteps: { type: "string" },
        keyResultUpdates: {
          type: "array",
          items: {
            type: "object",
            properties: {
              keyResultId: { type: "string" },
              newValue: { type: "number" },
              notes: { type: "string" }
            }
          }
        },
        createdAt: { type: "string" }
      },
      required: ["objectiveId", "userId", "weekEnding"]
    },
    indexes: {
      "objectiveId-weekEnding-index": {
        hashKey: "objectiveId",
        rangeKey: "weekEnding",
        type: "GSI"
      },
      "userId-weekEnding-index": {
        hashKey: "userId",
        rangeKey: "weekEnding",
        type: "GSI"
      }
    }
  }
}
```

## Components

### Reuse Existing
```typescript
import { Card, Badge, Progress, Dialog, Tabs, Button, Select } from '@captify-io/core/components/ui';
```

### New Components
```typescript
// /opt/captify-apps/core/src/components/spaces/features/okr/okr-list.tsx (REUSABLE)
export function OKRList({ spaceId, quarter }: OKRListProps)

// /opt/captify-apps/core/src/components/spaces/features/okr/okr-detail.tsx (REUSABLE)
export function OKRDetail({ objectiveId }: { objectiveId: string })

// /opt/captify-apps/core/src/components/spaces/features/okr/key-result-card.tsx (REUSABLE)
export function KeyResultCard({ keyResult }: { keyResult: KeyResult })

// /opt/captify-apps/core/src/components/spaces/features/okr/checkin-dialog.tsx (REUSABLE)
export function CheckInDialog({ objectiveId }: { objectiveId: string })

// /opt/captify-apps/core/src/components/spaces/features/okr/cascade-tree.tsx (REUSABLE)
export function CascadeTree({ rootObjectiveId }: { rootObjectiveId: string })
```

## Actions

### 1. Create Objective
```typescript
interface CreateObjectiveRequest {
  service: 'platform.dynamodb';
  operation: 'put';
  table: 'core-objective';
  data: { Item: Objective };
}
```

### 2. Update Key Result Progress
```typescript
interface UpdateKeyResultRequest {
  objectiveId: string;
  keyResultId: string;
  newValue: number;
}
```

### 3. Submit Check-In
```typescript
interface SubmitCheckInRequest {
  service: 'platform.dynamodb';
  operation: 'put';
  table: 'core-okr-checkin';
  data: { Item: OKRCheckIn };
}
```

## User Stories & Tasks

### Story 1: Executive Creates OKR
**Tasks:** Create objective form, add key results, link to workstreams, set quarter
**Acceptance Criteria:** OKR created with valid key results

### Story 2: Owner Submits Weekly Check-In
**Tasks:** Check-in dialog, update progress, note blockers, save
**Acceptance Criteria:** Check-in updates objective progress

### Story 3: Executive Views Cascading OKRs
**Tasks:** Visualize parent-child relationships, show alignment, drill-down
**Acceptance Criteria:** Cascade tree displays all levels

## Implementation Notes
```typescript
// Auto-calculate objective progress from key results
function calculateObjectiveProgress(keyResults: KeyResult[]): number {
  if (keyResults.length === 0) return 0;
  const totalProgress = keyResults.reduce((sum, kr) => {
    const krProgress = ((kr.currentValue - kr.startValue) / (kr.targetValue - kr.startValue)) * 100;
    return sum + Math.max(0, Math.min(100, krProgress));
  }, 0);
  return totalProgress / keyResults.length;
}
```

## Testing
```typescript
describe('OKRTracking', () => {
  it('calculates progress correctly', () => {
    const progress = calculateObjectiveProgress(mockKeyResults);
    expect(progress).toBeCloseTo(66.7, 1);
  });
});
```

## Dependencies
- Feature 04 (Workstream Management)
- Feature 14 (Portfolio Dashboard)

## Status
- **Sprint:** Sprint 1
- **Status:** Not Started
