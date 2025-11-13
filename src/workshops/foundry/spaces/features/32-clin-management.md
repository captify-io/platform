# Feature 32: CLIN Management

**Persona:** Cross-Persona (Manager, Financial, Executive)
**Priority:** High
**Effort:** Medium
**Status:** Sprint 2

## Overview
Contract Line Item Number (CLIN) management for government contracting with funding tracking, burn rates, and deliverable linkage.

## Requirements
### Functional
1. Create/edit CLINs with funding amounts, Track CLIN burn rate and depletion, Link CLINs to workstreams and tasks, Manage CLIN modifications (funding changes), Deliverable mapping, Status tracking (active/depleted/closed), Export CLIN reports

### Non-Functional
1. Support 100+ CLINs per contract, Real-time burn calculations, Integration with accounting, Audit trail for modifications

## Ontology
### New Ontology Nodes
```typescript
// OntologyNode for CLIN
{
  id: "core-clin",
  name: "CLIN",
  type: "clin",
  category: "entity",
  domain: "Financial",
  description: "Contract Line Item Number with funding and deliverables",
  icon: "FileBarChart",
  color: "#3b82f6",
  active: "true",
  properties: {
    dataSource: "core-clin",
    schema: {
      type: "object",
      properties: {
        id: { type: "string" },
        contractId: { type: "string", required: true },
        clinNumber: { type: "string", required: true },
        title: { type: "string", required: true },
        description: { type: "string" },
        type: { type: "string", enum: ["FFP", "CPFF", "T&M", "Labor-Hour"], description: "Contract type" },
        fundedAmount: { type: "number", required: true },
        spentAmount: { type: "number", default: 0 },
        remainingAmount: { type: "number" },
        burnRate: { type: "number", description: "$/month" },
        startDate: { type: "string" },
        endDate: { type: "string" },
        status: { type: "string", enum: ["active", "depleted", "closed"], required: true },
        workstreamIds: { type: "array", items: { type: "string" } },
        deliverableIds: { type: "array", items: { type: "string" } },
        modifications: {
          type: "array",
          items: {
            type: "object",
            properties: {
              modNumber: { type: "string" },
              date: { type: "string" },
              amountChange: { type: "number" },
              reason: { type: "string" }
            }
          }
        },
        createdAt: { type: "string" },
        updatedAt: { type: "string" }
      },
      required: ["contractId", "clinNumber", "title", "fundedAmount", "status"]
    },
    indexes: {
      "contractId-clinNumber-index": { hashKey: "contractId", rangeKey: "clinNumber", type: "GSI" },
      "status-index": { hashKey: "status", type: "GSI" }
    }
  }
}
```

## Components
```typescript
// /opt/captify-apps/core/src/components/spaces/features/clin/clin-list.tsx (REUSABLE)
export function CLINList({ contractId }: { contractId: string })

// /opt/captify-apps/core/src/components/spaces/features/clin/clin-card.tsx (REUSABLE)
export function CLINCard({ clin }: { clin: CLIN })

// /opt/captify-apps/core/src/components/spaces/features/clin/clin-detail.tsx (REUSABLE)
export function CLINDetail({ clinId }: { clinId: string })

// /opt/captify-apps/core/src/components/spaces/features/clin/clin-modifications.tsx (REUSABLE)
export function CLINModifications({ clin }: { clin: CLIN })
```

## Actions
### 1. Create CLIN
```typescript
interface CreateCLINRequest {
  service: 'platform.dynamodb';
  operation: 'put';
  table: 'core-clin';
  data: { Item: CLIN };
}
```

### 2. Update CLIN Spend
```typescript
interface UpdateCLINSpendRequest {
  clinId: string;
  transactionAmount: number;
}
```

### 3. Add CLIN Modification
```typescript
interface AddCLINModificationRequest {
  clinId: string;
  modification: {
    modNumber: string;
    date: string;
    amountChange: number;
    reason: string;
  };
}
```

## User Stories
### Story 1: Manager Creates CLIN
**Tasks:** Enter CLIN number, set funded amount, link to workstreams, save
**Acceptance:** CLIN created and visible in contract

### Story 2: Financial Analyst Tracks CLIN Burn
**Tasks:** View CLIN card, see burn rate, check depletion forecast, review transactions
**Acceptance:** Burn rate accurate, forecast within 10%

### Story 3: Manager Adds CLIN Modification
**Tasks:** Add mod number, enter funding change, note reason, update CLIN
**Acceptance:** Modification recorded, funded amount updated

## Implementation
```typescript
async function updateCLINSpend(
  clinId: string,
  transactionAmount: number,
  credentials: AwsCredentials
): Promise<CLIN> {
  const clin = await dynamodb.get({ table: 'core-clin', key: { id: clinId } }, credentials);

  const newSpent = (clin.spentAmount || 0) + transactionAmount;
  const newRemaining = clin.fundedAmount - newSpent;
  const newStatus = newRemaining <= 0 ? 'depleted' : clin.status;

  await dynamodb.update({
    table: 'core-clin',
    key: { id: clinId },
    updates: {
      spentAmount: newSpent,
      remainingAmount: newRemaining,
      status: newStatus,
      updatedAt: new Date().toISOString()
    }
  }, credentials);

  return { ...clin, spentAmount: newSpent, remainingAmount: newRemaining, status: newStatus };
}

function calculateCLINBurnRate(clin: CLIN, transactions: FinancialTransaction[]): number {
  const last30Days = transactions.filter(t => daysSince(t.date) <= 30);
  const totalSpent = last30Days.reduce((sum, t) => sum + t.amount, 0);
  return totalSpent / 30; // Daily burn rate
}
```

## Testing
```typescript
describe('CLINManagement', () => {
  it('creates CLIN correctly', async () => {
    const clin = await createCLIN({
      contractId: 'contract-1',
      clinNumber: '0001',
      title: 'Base Period Labor',
      fundedAmount: 500000,
      status: 'active'
    });

    expect(clin.id).toBeDefined();
    expect(clin.remainingAmount).toBe(500000);
  });

  it('updates spend and checks depletion', async () => {
    const updatedCLIN = await updateCLINSpend('clin-1', 500000);
    expect(updatedCLIN.status).toBe('depleted');
  });
});
```

## Dependencies: Feature 33 (Contract Management), Feature 21 (Financial Dashboard)
## Status: Sprint 2, Not Started
