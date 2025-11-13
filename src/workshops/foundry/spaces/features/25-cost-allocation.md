# Feature 25: Cost Allocation Reports

**Persona:** Financial
**Priority:** Medium
**Effort:** Small
**Status:** Sprint 3

## Overview
Cost allocation reporting for distributing expenses across contracts, CLINs, workstreams, and cost centers with customizable allocation rules.

## Requirements
### Functional: Allocate costs by workstream/CLIN/contract, Define allocation rules, Track direct vs indirect costs, Generate allocation reports, Export to accounting systems, Historical allocation tracking
### Non-Functional: Support complex allocation rules, Real-time calculations, Audit trail, Integration with ERP

## Ontology
### Nodes Used: FinancialTransaction (Feature 21), Contract, CLIN, Workstream
### New Ontology Nodes
```typescript
// OntologyNode for AllocationRule
{
  id: "core-allocation-rule",
  name: "AllocationRule",
  type: "allocationRule",
  category: "entity",
  domain: "Financial",
  icon: "Split",
  color: "#f59e0b",
  active: "true",
  properties: {
    dataSource: "core-allocation-rule",
    schema: {
      type: "object",
      properties: {
        id: { type: "string" },
        name: { type: "string", required: true },
        ruleType: { type: "string", enum: ["percentage", "headcount", "effort", "fixed"], required: true },
        allocations: {
          type: "array",
          items: {
            type: "object",
            properties: {
              targetType: { type: "string", enum: ["contract", "clin", "workstream"] },
              targetId: { type: "string" },
              percentage: { type: "number" },
              amount: { type: "number" }
            }
          }
        },
        effectiveDate: { type: "string" },
        expirationDate: { type: "string" },
        active: { type: "boolean" },
        createdAt: { type: "string" }
      },
      required: ["name", "ruleType", "allocations"]
    },
    indexes: {
      "active-index": { hashKey: "active", type: "GSI" }
    }
  }
}
```

## Components
```typescript
// /opt/captify-apps/core/src/components/spaces/features/allocation/allocation-report.tsx (REUSABLE)
export function AllocationReport({ spaceId, period }: AllocationReportProps)

// /opt/captify-apps/core/src/components/spaces/features/allocation/rule-builder.tsx (REUSABLE)
export function AllocationRuleBuilder({ onSave }: { onSave: (rule: AllocationRule) => void })

// /opt/captify-apps/core/src/components/spaces/features/allocation/allocation-breakdown.tsx (REUSABLE)
export function AllocationBreakdown({ transactionId }: { transactionId: string })
```

## Actions
### 1. Apply Allocation Rule
```typescript
interface ApplyAllocationRequest {
  transactionId: string;
  ruleId: string;
}

interface AllocationResult {
  allocations: Array<{
    targetType: string;
    targetId: string;
    amount: number;
    percentage: number;
  }>;
  totalAllocated: number;
}
```

### 2. Generate Allocation Report
```typescript
interface GenerateAllocationReportRequest {
  spaceId: string;
  dateRange: { start: string; end: string };
  groupBy: 'contract' | 'clin' | 'workstream' | 'costCenter';
}
```

## User Stories
### Story 1: Analyst Defines Allocation Rule
**Tasks:** Create rule, set percentages, assign targets, activate
**Acceptance:** Rule applies to new transactions

### Story 2: Analyst Generates Allocation Report
**Tasks:** Select period, group by workstream, export to Excel
**Acceptance:** Report accurate, exports correctly

## Implementation
```typescript
function applyAllocationRule(
  transaction: FinancialTransaction,
  rule: AllocationRule
): AllocationResult {
  const allocations = rule.allocations.map(allocation => ({
    targetType: allocation.targetType,
    targetId: allocation.targetId,
    amount: transaction.amount * (allocation.percentage / 100),
    percentage: allocation.percentage
  }));

  return {
    allocations,
    totalAllocated: allocations.reduce((sum, a) => sum + a.amount, 0)
  };
}
```

## Dependencies: Feature 21 (Financial Dashboard), Feature 32 (CLIN Management)
## Status: Sprint 3, Not Started
