# Feature 33: Contract Management

**Persona:** Cross-Persona (Manager, Financial, Executive)
**Priority:** High
**Effort:** Medium
**Status:** Sprint 2

## Overview
Government contract management with CLINs, periods of performance, modifications, and compliance tracking.

## Requirements
### Functional: Create/edit contracts, Manage contract metadata, Track periods of performance, Link CLINs, Record modifications, Status tracking, Compliance milestones, Export contract data
### Non-Functional: Support 100+ contracts, Audit trail, Document storage integration, Real-time updates

## Ontology
### New Ontology Nodes
```typescript
// OntologyNode for Contract
{
  id: "core-contract",
  name: "Contract",
  type: "contract",
  category: "entity",
  domain: "Financial",
  description: "Government contract with CLINs and deliverables",
  icon: "FileText",
  color: "#6366f1",
  active: "true",
  properties: {
    dataSource: "core-contract",
    schema: {
      type: "object",
      properties: {
        id: { type: "string" },
        spaceId: { type: "string", required: true },
        contractNumber: { type: "string", required: true },
        title: { type: "string", required: true },
        description: { type: "string" },
        customerId: { type: "string", description: "Government agency" },
        contractType: { type: "string", enum: ["FFP", "CPFF", "T&M", "IDIQ"], required: true },
        totalValue: { type: "number", required: true },
        burnedAmount: { type: "number", default: 0 },
        startDate: { type: "string", required: true },
        endDate: { type: "string", required: true },
        status: { type: "string", enum: ["awarded", "active", "completed", "closed"], required: true },
        cageCode: { type: "string" },
        contractingOfficer: { type: "string" },
        primeContractor: { type: "string" },
        subcontractor: { type: "boolean" },
        clinIds: { type: "array", items: { type: "string" } },
        modifications: {
          type: "array",
          items: {
            type: "object",
            properties: {
              modNumber: { type: "string" },
              date: { type: "string" },
              valueChange: { type: "number" },
              scopeChange: { type: "string" }
            }
          }
        },
        complianceRequirements: { type: "array", items: { type: "string" } },
        createdAt: { type: "string" },
        updatedAt: { type: "string" }
      },
      required: ["spaceId", "contractNumber", "title", "contractType", "totalValue", "startDate", "endDate", "status"]
    },
    indexes: {
      "spaceId-startDate-index": { hashKey: "spaceId", rangeKey: "startDate", type: "GSI" },
      "contractNumber-index": { hashKey: "contractNumber", type: "GSI" },
      "status-index": { hashKey: "status", type: "GSI" }
    }
  }
}
```

## Components
```typescript
// /opt/captify-apps/core/src/components/spaces/features/contract/contract-list.tsx (REUSABLE)
export function ContractList({ spaceId }: { spaceId: string })

// /opt/captify-apps/core/src/components/spaces/features/contract/contract-detail.tsx (REUSABLE)
export function ContractDetail({ contractId }: { contractId: string })

// /opt/captify-apps/core/src/components/spaces/features/contract/contract-modifications.tsx (REUSABLE)
export function ContractModifications({ contract }: { contract: Contract })
```

## Actions
### 1. Create Contract
```typescript
interface CreateContractRequest {
  service: 'platform.dynamodb';
  operation: 'put';
  table: 'core-contract';
  data: { Item: Contract };
}
```

### 2. Add Contract Modification
```typescript
interface AddContractModificationRequest {
  contractId: string;
  modification: {
    modNumber: string;
    date: string;
    valueChange: number;
    scopeChange: string;
  };
}
```

## User Stories
### Story 1: Manager Creates Contract
**Tasks:** Enter contract details, set value and dates, save
**Acceptance:** Contract created

### Story 2: Manager Adds Modification
**Tasks:** Add mod number, update value, note scope change
**Acceptance:** Modification recorded

## Dependencies: Feature 32 (CLIN Management), Feature 21 (Financial Dashboard)
## Status: Sprint 2, Not Started
