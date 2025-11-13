# Feature 24: Deliverable Tracking

**Persona:** Financial
**Priority:** High
**Effort:** Small
**Status:** Sprint 2

## Overview
Track contract deliverables against milestones with acceptance criteria, approval workflows, and payment triggers.

## Requirements
### Functional: Link deliverables to CLINs, Track status (planned/in-progress/delivered/accepted), Acceptance workflow, Payment triggers, Milestone tracking, Export deliverable reports
### Non-Functional: Support 1000+ deliverables, Mobile approval, Real-time status, Audit trail

## Ontology
### New Ontology Nodes
```typescript
// OntologyNode for Deliverable
{
  id: "core-deliverable",
  name: "Deliverable",
  type: "deliverable",
  category: "entity",
  domain: "Financial",
  icon: "Package",
  color: "#8b5cf6",
  active: "true",
  properties: {
    dataSource: "core-deliverable",
    schema: {
      type: "object",
      properties: {
        id: { type: "string" },
        contractId: { type: "string", required: true },
        clinId: { type: "string", required: true },
        workstreamId: { type: "string" },
        title: { type: "string", required: true },
        description: { type: "string" },
        dueDate: { type: "string", required: true },
        status: { type: "string", enum: ["planned", "in-progress", "delivered", "accepted", "rejected"], required: true },
        acceptanceCriteria: { type: "array", items: { type: "string" } },
        deliveredDate: { type: "string" },
        acceptedDate: { type: "string" },
        acceptedBy: { type: "string" },
        paymentAmount: { type: "number" },
        paymentTriggered: { type: "boolean" },
        attachments: { type: "array", items: { type: "object" } },
        createdAt: { type: "string" }
      },
      required: ["contractId", "clinId", "title", "dueDate", "status"]
    },
    indexes: {
      "contractId-dueDate-index": { hashKey: "contractId", rangeKey: "dueDate", type: "GSI" },
      "clinId-status-index": { hashKey: "clinId", rangeKey: "status", type: "GSI" },
      "status-dueDate-index": { hashKey: "status", rangeKey: "dueDate", type: "GSI" }
    }
  }
}
```

## Components
```typescript
// /opt/captify-apps/core/src/components/spaces/features/deliverable/deliverable-list.tsx (REUSABLE)
export function DeliverableList({ contractId }: { contractId: string })

// /opt/captify-apps/core/src/components/spaces/features/deliverable/deliverable-card.tsx (REUSABLE)
export function DeliverableCard({ deliverable }: { deliverable: Deliverable })

// /opt/captify-apps/core/src/components/spaces/features/deliverable/acceptance-dialog.tsx (REUSABLE)
export function AcceptanceDialog({ deliverableId }: { deliverableId: string })
```

## Actions
### 1. Mark Deliverable Delivered
```typescript
interface MarkDeliveredRequest {
  deliverableId: string;
  deliveredDate: string;
  attachments: File[];
}
```

### 2. Accept/Reject Deliverable
```typescript
interface AcceptRejectRequest {
  deliverableId: string;
  action: 'accept' | 'reject';
  acceptedBy: string;
  notes?: string;
  triggerPayment: boolean;
}
```

## User Stories
### Story 1: Manager Marks Deliverable Complete
**Tasks:** Set status to delivered, attach files, notify for approval
**Acceptance:** Deliverable marked, approval workflow triggered

### Story 2: Financial Analyst Accepts Deliverable
**Tasks:** Review acceptance criteria, approve, trigger payment
**Acceptance:** Payment triggered, deliverable status updated

## Implementation
```typescript
async function acceptDeliverable(
  deliverableId: string,
  acceptedBy: string,
  triggerPayment: boolean
): Promise<void> {
  await dynamodb.update({
    table: 'core-deliverable',
    key: { id: deliverableId },
    updates: {
      status: 'accepted',
      acceptedDate: new Date().toISOString(),
      acceptedBy,
      paymentTriggered: triggerPayment
    }
  });

  if (triggerPayment) {
    await triggerPaymentProcess(deliverableId);
  }
}
```

## Dependencies: Feature 32 (CLIN Management), Feature 33 (Contract Management)
## Status: Sprint 2, Not Started
