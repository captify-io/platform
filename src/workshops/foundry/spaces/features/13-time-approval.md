# Feature 13: Time Approval Workflow

**Persona:** Manager
**Priority:** Medium
**Effort:** Small
**Status:** Sprint 3

## Overview

Timesheet submission and approval workflow for tracking actual hours worked, validating against contracts, and generating billing reports.

## Requirements

### Functional Requirements
1. Team members submit timesheets (daily/weekly)
2. Managers review and approve timesheets
3. Validate hours against task estimates and capacity
4. Flag discrepancies (overages, missing time)
5. Lock approved timesheets
6. Generate time reports by project/contract
7. Export for billing and payroll

### Non-Functional Requirements
1. Submission process <1 minute
2. Approval workflow <30 seconds per timesheet
3. Support 1000+ timesheets per week
4. Audit trail for all changes
5. Mobile timesheet entry
6. Offline submission with sync
7. Integration with billing systems

## Ontology

### Nodes Used
```typescript
interface Task {
  id: string;
  estimatedHours: number;
  actualHours: number;
  // From Feature 01
}
```

### New Ontology Nodes Required
```typescript
// OntologyNode for Timesheet
{
  id: "core-timesheet",
  name: "Timesheet",
  type: "timesheet",
  category: "entity",
  domain: "Workflow",
  description: "Time entry submission for work performed",
  icon: "Clock",
  color: "#10b981",
  active: "true",
  properties: {
    dataSource: "core-timesheet",
    schema: {
      type: "object",
      properties: {
        id: { type: "string" },
        userId: { type: "string", required: true },
        spaceId: { type: "string", required: true },
        weekEnding: { type: "string", description: "Week ending date", required: true },
        status: {
          type: "string",
          enum: ["draft", "submitted", "approved", "rejected", "locked"],
          required: true
        },
        entries: {
          type: "array",
          items: {
            type: "object",
            properties: {
              date: { type: "string" },
              taskId: { type: "string" },
              hours: { type: "number" },
              notes: { type: "string" }
            }
          },
          description: "Daily time entries"
        },
        totalHours: { type: "number" },
        approvedBy: { type: "string" },
        approvedAt: { type: "string" },
        rejectionReason: { type: "string" },
        submittedAt: { type: "string" },
        createdAt: { type: "string" },
        updatedAt: { type: "string" }
      },
      required: ["userId", "spaceId", "weekEnding", "status"]
    },
    indexes: {
      "userId-weekEnding-index": {
        hashKey: "userId",
        rangeKey: "weekEnding",
        type: "GSI"
      },
      "spaceId-status-index": {
        hashKey: "spaceId",
        rangeKey: "status",
        type: "GSI"
      }
    }
  }
}
```

## Components

### Reuse Existing Captify Components
```typescript
import { Table } from '@captify-io/core/components/ui/table';
import { Input } from '@captify-io/core/components/ui/input';
import { Button } from '@captify-io/core/components/ui/button';
import { Badge } from '@captify-io/core/components/ui/badge';
import { Dialog } from '@captify-io/core/components/ui/dialog';
```

### New Components to Create
```typescript
// /opt/captify-apps/core/src/components/spaces/features/time/timesheet-entry.tsx (REUSABLE)
export function TimesheetEntry({ userId, weekEnding }: TimesheetEntryProps)

// /opt/captify-apps/core/src/components/spaces/features/time/approval-queue.tsx (REUSABLE)
export function TimesheetApprovalQueue({ managerId }: { managerId: string })

// /opt/captify-apps/core/src/components/spaces/features/time/time-report.tsx (REUSABLE)
export function TimeReport({ filters }: TimeReportProps)
```

## Actions

### 1. Submit Timesheet
```typescript
interface SubmitTimesheetRequest {
  service: 'platform.dynamodb';
  operation: 'put';
  table: 'core-timesheet';
  data: {
    Item: Timesheet;
  };
}
```

### 2. Approve Timesheet
```typescript
interface ApproveTimesheetRequest {
  timesheetId: string;
  approverId: string;
  status: 'approved' | 'rejected';
  reason?: string;
}
```

### 3. Get Approval Queue
```typescript
interface GetApprovalQueueRequest {
  service: 'platform.dynamodb';
  operation: 'query';
  table: 'core-timesheet';
  data: {
    IndexName: 'spaceId-status-index';
    KeyConditionExpression: 'spaceId = :spaceId AND #status = :status';
    ExpressionAttributeValues: {
      ':spaceId': string;
      ':status': 'submitted';
    };
  };
}
```

## User Stories & Tasks

### Story 1: Team Member Submits Timesheet
**Tasks:**
1. Create weekly timesheet grid
2. Auto-populate from task time tracking
3. Validate total hours
4. Submit for approval

**Acceptance Criteria:**
- Entry takes <1 minute
- Validation prevents errors

### Story 2: Manager Approves Timesheets
**Tasks:**
1. Display pending timesheets
2. Show summary and details
3. Approve/reject with reason
4. Bulk approval support

**Acceptance Criteria:**
- Queue displays all pending
- Can approve quickly

### Story 3: Generate Time Reports
**Tasks:**
1. Aggregate time by project/user
2. Filter by date range
3. Export to CSV/PDF
4. Display charts

**Acceptance Criteria:**
- Reports accurate
- Export works

## Implementation Notes
```typescript
function validateTimesheet(timesheet: Timesheet): ValidationResult {
  const errors = [];
  if (timesheet.totalHours > 80) {
    errors.push('Total hours exceeds maximum for week');
  }
  return { valid: errors.length === 0, errors };
}
```

## Testing
```typescript
describe('TimesheetEntry', () => {
  it('submits timesheet', async () => {
    const { getByText } = render(<TimesheetEntry userId="user-1" weekEnding="2025-11-01" />);
    fireEvent.click(getByText('Submit'));
    await waitFor(() => {
      expect(getByText('Submitted')).toBeInTheDocument();
    });
  });
});
```

## Dependencies
- Feature 01 (Task Management)
- Feature 12 (Capacity Planning)

## Status
- **Sprint:** Sprint 3
- **Status:** Not Started
