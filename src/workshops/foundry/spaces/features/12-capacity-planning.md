# Feature 12: Capacity Planning

**Persona:** Manager
**Priority:** Medium
**Effort:** Medium
**Status:** Sprint 3

## Overview

Team capacity planning and resource allocation tool for forecasting availability, managing PTO, and optimizing workload distribution across sprints.

## Requirements

### Functional Requirements
1. View team capacity calendar (daily/weekly/monthly)
2. Track PTO, holidays, and availability
3. Forecast capacity for future sprints
4. Visualize workload distribution per team member
5. Identify under/over-utilized resources
6. Support capacity reservations for planned work
7. Historical capacity utilization reports

### Non-Functional Requirements
1. Calendar loads in <500ms
2. Support 100+ team members
3. Forecast 6 months ahead
4. Real-time capacity updates
5. Export capacity reports
6. Mobile-responsive views
7. Integration with HR systems

## Ontology

### Nodes Used
```typescript
interface User {
  id: string;
  hoursPerDay: number;
  // From core-user
}

interface Sprint {
  id: string;
  plannedCapacity: number;
  // From Feature 10
}
```

### New Ontology Nodes Required
```typescript
// OntologyNode for CapacityEvent
{
  id: "core-capacity-event",
  name: "CapacityEvent",
  type: "capacityEvent",
  category: "entity",
  domain: "Planning",
  description: "Team member availability event (PTO, holiday, etc.)",
  icon: "CalendarDays",
  color: "#06b6d4",
  active: "true",
  properties: {
    dataSource: "core-capacity-event",
    schema: {
      type: "object",
      properties: {
        id: { type: "string" },
        userId: { type: "string", required: true },
        spaceId: { type: "string", required: true },
        eventType: {
          type: "string",
          enum: ["pto", "holiday", "training", "meeting", "reduced-capacity"],
          required: true
        },
        startDate: { type: "string", required: true },
        endDate: { type: "string", required: true },
        impactHours: { type: "number", description: "Hours unavailable" },
        impactPercentage: { type: "number", description: "Percentage reduction" },
        status: {
          type: "string",
          enum: ["pending", "approved", "rejected"],
          required: true
        },
        notes: { type: "string" },
        createdAt: { type: "string" },
        approvedBy: { type: "string" }
      },
      required: ["userId", "spaceId", "eventType", "startDate", "endDate", "status"]
    },
    indexes: {
      "userId-startDate-index": {
        hashKey: "userId",
        rangeKey: "startDate",
        type: "GSI"
      },
      "spaceId-startDate-index": {
        hashKey: "spaceId",
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
import { Calendar } from '@captify-io/core/components/ui/calendar';
import { Card } from '@captify-io/core/components/ui/card';
import { Progress } from '@captify-io/core/components/ui/progress';
import { Select } from '@captify-io/core/components/ui/select';
import { Badge } from '@captify-io/core/components/ui/badge';
```

### New Components to Create
```typescript
// /opt/captify-apps/core/src/components/spaces/features/capacity/capacity-calendar.tsx (REUSABLE)
export function CapacityCalendar({ spaceId, view }: CapacityCalendarProps)

// /opt/captify-apps/core/src/components/spaces/features/capacity/team-utilization.tsx (REUSABLE)
export function TeamUtilization({ spaceId }: { spaceId: string })

// /opt/captify-apps/core/src/components/spaces/features/capacity/capacity-forecast.tsx (REUSABLE)
export function CapacityForecast({ spaceId, months }: CapacityForecastProps)

// /opt/captify-apps/core/src/components/spaces/features/capacity/event-dialog.tsx (REUSABLE)
export function CapacityEventDialog({ userId }: { userId: string })
```

## Actions

### 1. Get Team Capacity
```typescript
interface GetTeamCapacityRequest {
  spaceId: string;
  startDate: string;
  endDate: string;
}

interface TeamCapacityResponse {
  totalCapacity: number;
  availableCapacity: number;
  allocatedCapacity: number;
  memberCapacities: Array<{
    userId: string;
    capacity: number;
    allocated: number;
    utilization: number;
  }>;
}
```

### 2. Create Capacity Event
```typescript
interface CreateCapacityEventRequest {
  service: 'platform.dynamodb';
  operation: 'put';
  table: 'core-capacity-event';
  data: {
    Item: CapacityEvent;
  };
}
```

### 3. Forecast Sprint Capacity
```typescript
interface ForecastCapacityRequest {
  spaceId: string;
  futureSprintCount: number;
}

interface ForecastResult {
  sprints: Array<{
    sprintNumber: number;
    estimatedCapacity: number;
    scheduledEvents: number;
    confidence: number;
  }>;
}
```

## User Stories & Tasks

### Story 1: Manager Views Team Capacity Calendar
**Tasks:**
1. Create calendar view with team availability
2. Show PTO and holidays
3. Highlight under/over-utilized periods
4. Allow drill-down by team member

**Acceptance Criteria:**
- Calendar displays all events
- Color-coded by capacity level

### Story 2: Team Member Requests PTO
**Tasks:**
1. Create PTO request dialog
2. Validate against sprint commitments
3. Send approval notification
4. Update capacity calculations

**Acceptance Criteria:**
- PTO requests update capacity
- Managers can approve/reject

### Story 3: Manager Forecasts Future Capacity
**Tasks:**
1. Calculate historical utilization
2. Project future capacity
3. Account for known events
4. Display confidence intervals

**Acceptance Criteria:**
- Forecast accurate within 10%
- Updates with new data

## Implementation Notes
```typescript
function calculateAvailableCapacity(
  user: User,
  events: CapacityEvent[],
  period: DateRange
): number {
  const baseCapacity = user.hoursPerDay * period.days;
  const reducedHours = events.reduce((sum, event) =>
    sum + event.impactHours, 0
  );
  return baseCapacity - reducedHours;
}
```

## Testing
```typescript
describe('CapacityPlanning', () => {
  it('calculates capacity correctly', () => {
    const capacity = calculateAvailableCapacity(user, events, period);
    expect(capacity).toBe(expectedValue);
  });
});
```

## Dependencies
- Feature 10 (Sprint Planning)
- Feature 13 (Time Approval)

## Status
- **Sprint:** Sprint 3
- **Status:** Not Started
