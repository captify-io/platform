# Feature 15: Capability Roadmap

**Persona:** Executive
**Priority:** High
**Effort:** Large
**Status:** Sprint 3

## Overview

Strategic capability roadmap visualization showing planned features, workstreams, and deliverables across quarters/years. Enables long-term planning, dependency management, and alignment with business strategy.

## Requirements

### Functional Requirements
1. Display roadmap in timeline view (quarters, months, weeks)
2. Show features and workstreams with start/end dates
3. Visualize dependencies between capabilities
4. Support drag-to-reschedule with dependency validation
5. Group by workstream, theme, or strategic objective
6. Show resource allocation and capacity constraints
7. Export roadmap to PowerPoint, PDF, or image

### Non-Functional Requirements
1. Support 500+ roadmap items
2. Smooth timeline navigation and zoom
3. Auto-layout for dependency visualization
4. Real-time collaboration (multi-user editing)
5. Mobile-responsive roadmap view
6. Version history and snapshot comparison
7. Load in <2s

## Ontology

### Nodes Used
```typescript
// From Feature 02
interface Feature {
  id: string;
  plannedStartDate: string;
  plannedEndDate: string;
  dependencies: string[];
  // ...
}

// From Feature 04
interface Workstream {
  id: string;
  startDate: string;
  endDate: string;
  // ...
}
```

### New Ontology Nodes Required
```typescript
// OntologyNode for RoadmapItem
{
  id: "core-roadmap-item",
  name: "RoadmapItem",
  type: "roadmapItem",
  category: "entity",
  domain: "Planning",
  description: "Strategic roadmap item (capability, initiative, milestone)",
  icon: "Map",
  color: "#f59e0b",
  active: "true",
  properties: {
    dataSource: "core-roadmap-item",
    schema: {
      type: "object",
      properties: {
        id: { type: "string" },
        spaceId: { type: "string", required: true },
        type: {
          type: "string",
          enum: ["capability", "feature", "initiative", "milestone"],
          required: true
        },
        title: { type: "string", required: true },
        description: { type: "string" },
        startDate: { type: "string", required: true },
        endDate: { type: "string", required: true },
        status: {
          type: "string",
          enum: ["planned", "in-progress", "delivered", "cancelled"]
        },
        theme: { type: "string", description: "Strategic theme" },
        workstreamId: { type: "string" },
        featureId: { type: "string" },
        dependencies: { type: "array", items: { type: "string" } },
        blockedBy: { type: "array", items: { type: "string" } },
        confidenceLevel: {
          type: "string",
          enum: ["low", "medium", "high"],
          description: "Confidence in delivery timeline"
        },
        resourcesRequired: { type: "number" },
        color: { type: "string" },
        createdAt: { type: "string" },
        updatedAt: { type: "string" }
      },
      required: ["spaceId", "type", "title", "startDate", "endDate"]
    },
    indexes: {
      "spaceId-startDate-index": {
        hashKey: "spaceId",
        rangeKey: "startDate",
        type: "GSI"
      },
      "theme-startDate-index": {
        hashKey: "theme",
        rangeKey: "startDate",
        type: "GSI"
      }
    }
  }
}
```

## Components

### Reuse Existing Captify Components
```typescript
import { Card } from '@captify-io/core/components/ui/card';
import { Button } from '@captify-io/core/components/ui/button';
import { Select } from '@captify-io/core/components/ui/select';
import { Badge } from '@captify-io/core/components/ui/badge';
import { Dialog } from '@captify-io/core/components/ui/dialog';
```

### New Components to Create
```typescript
// /opt/captify-apps/core/src/components/spaces/features/roadmap/roadmap-view.tsx (REUSABLE)
export function RoadmapView({ spaceId }: { spaceId: string })

// /opt/captify-apps/core/src/components/spaces/features/roadmap/timeline.tsx (REUSABLE)
export function RoadmapTimeline({ items, zoom }: RoadmapTimelineProps)

// /opt/captify-apps/core/src/components/spaces/features/roadmap/item-card.tsx (REUSABLE)
export function RoadmapItemCard({ item }: { item: RoadmapItem })

// /opt/captify-apps/core/src/components/spaces/features/roadmap/dependency-graph.tsx (REUSABLE)
export function DependencyGraph({ items }: { items: RoadmapItem[] })

// /opt/captify-apps/core/src/components/spaces/features/roadmap/theme-lanes.tsx (REUSABLE)
export function ThemeLanes({ items, groupBy }: ThemeLanesProps)
```

## Actions

### 1. Get Roadmap Items
```typescript
interface GetRoadmapItemsRequest {
  service: 'platform.dynamodb';
  operation: 'query';
  table: 'core-roadmap-item';
  data: {
    IndexName: 'spaceId-startDate-index';
    KeyConditionExpression: 'spaceId = :spaceId';
    FilterExpression: 'startDate >= :start AND endDate <= :end';
    ExpressionAttributeValues: {
      ':spaceId': string;
      ':start': string;
      ':end': string;
    };
  };
}
```

### 2. Update Roadmap Item Dates
```typescript
interface UpdateRoadmapDatesRequest {
  itemId: string;
  newStartDate: string;
  newEndDate: string;
  validateDependencies: boolean;
}

interface UpdateRoadmapDatesResponse {
  success: boolean;
  updatedItem: RoadmapItem;
  dependencyConflicts?: Array<{
    itemId: string;
    conflictType: 'blocked-by' | 'blocks';
    message: string;
  }>;
}
```

### 3. Export Roadmap
```typescript
interface ExportRoadmapRequest {
  spaceId: string;
  format: 'pptx' | 'pdf' | 'png';
  dateRange: { start: string; end: string };
  groupBy: 'theme' | 'workstream' | 'none';
}
```

## User Stories & Tasks

### Story 1: Executive Views Strategic Roadmap
**Tasks:**
1. Create timeline visualization
2. Display items by quarter
3. Show dependencies
4. Enable zoom (quarter/month/week)

**Acceptance Criteria:**
- Roadmap displays all items
- Timeline navigation smooth

### Story 2: Executive Reschedules Capability
**Tasks:**
1. Implement drag-to-reschedule
2. Validate dependencies
3. Warn about conflicts
4. Update dependent items

**Acceptance Criteria:**
- Drag-drop works
- Dependency validation prevents conflicts

### Story 3: Executive Exports Roadmap
**Tasks:**
1. Generate PowerPoint slides
2. Include timeline visualization
3. Add dependency diagrams
4. Download file

**Acceptance Criteria:**
- Export completes in <10s
- PowerPoint is editable

## Implementation Notes
```typescript
// Dependency validation
function validateRoadmapDates(
  item: RoadmapItem,
  newStart: Date,
  newEnd: Date,
  allItems: RoadmapItem[]
): ValidationResult {
  const conflicts = [];

  // Check dependencies
  for (const depId of item.dependencies || []) {
    const dep = allItems.find(i => i.id === depId);
    if (dep && new Date(dep.endDate) > newStart) {
      conflicts.push({
        itemId: depId,
        conflictType: 'blocked-by',
        message: `Dependency ${dep.title} ends after new start date`
      });
    }
  }

  return { valid: conflicts.length === 0, conflicts };
}
```

## Testing
```typescript
describe('RoadmapView', () => {
  it('displays roadmap items', async () => {
    const { getAllByTestId } = render(<RoadmapView spaceId="space-1" />);
    await waitFor(() => {
      expect(getAllByTestId('roadmap-item')).toHaveLength(5);
    });
  });
});
```

## Dependencies
- Feature 02 (Feature Planning)
- Feature 04 (Workstream Management)
- Feature 16 (Objective Tracking)

## Status
- **Sprint:** Sprint 3
- **Status:** Not Started
