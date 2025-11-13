# Feature 19: Risk & Issues Management

**Persona:** Executive
**Priority:** High
**Effort:** Medium
**Status:** Sprint 2

## Overview
Centralized risk and issue tracking with severity assessment, mitigation planning, and escalation workflows.

## Requirements
### Functional
1. Log risks and issues with severity/impact, Track mitigation actions, Escalation workflows, Risk matrix visualization, Link to affected workstreams, Status tracking, Generate risk reports

### Non-Functional
1. Support 1000+ risks/issues, Mobile reporting, Real-time alerts, Audit trail, Export to PDF/Excel

## Ontology
### New Ontology Nodes

```typescript
// OntologyNode for Risk
{
  id: "core-risk",
  name: "Risk",
  type: "risk",
  category: "entity",
  domain: "Governance",
  description: "Identified risk with mitigation plan",
  icon: "AlertTriangle",
  color: "#ef4444",
  active: "true",
  properties: {
    dataSource: "core-risk",
    schema: {
      type: "object",
      properties: {
        id: { type: "string" },
        spaceId: { type: "string", required: true },
        workstreamId: { type: "string" },
        title: { type: "string", required: true },
        description: { type: "string" },
        type: { type: "string", enum: ["risk", "issue"], required: true },
        category: { type: "string", enum: ["technical", "resource", "schedule", "budget", "external"] },
        severity: { type: "string", enum: ["low", "medium", "high", "critical"], required: true },
        probability: { type: "string", enum: ["low", "medium", "high"], description: "For risks only" },
        impact: { type: "string", enum: ["low", "medium", "high", "critical"], required: true },
        status: { type: "string", enum: ["open", "mitigating", "resolved", "accepted"], required: true },
        ownerId: { type: "string", required: true },
        mitigationPlan: { type: "string" },
        mitigationActions: { type: "array", items: { type: "string" } },
        identifiedDate: { type: "string", required: true },
        targetResolutionDate: { type: "string" },
        resolvedDate: { type: "string" },
        escalated: { type: "boolean" },
        escalatedTo: { type: "string" },
        createdAt: { type: "string" },
        updatedAt: { type: "string" }
      },
      required: ["spaceId", "title", "type", "severity", "impact", "status", "ownerId", "identifiedDate"]
    },
    indexes: {
      "spaceId-severity-index": { hashKey: "spaceId", rangeKey: "severity", type: "GSI" },
      "ownerId-status-index": { hashKey: "ownerId", rangeKey: "status", type: "GSI" },
      "workstreamId-status-index": { hashKey: "workstreamId", rangeKey: "status", type: "GSI" }
    }
  }
}
```

## Components
```typescript
// /opt/captify-apps/core/src/components/spaces/features/risk/risk-register.tsx (REUSABLE)
export function RiskRegister({ spaceId }: { spaceId: string })

// /opt/captify-apps/core/src/components/spaces/features/risk/risk-matrix.tsx (REUSABLE)
export function RiskMatrix({ risks }: { risks: Risk[] })

// /opt/captify-apps/core/src/components/spaces/features/risk/risk-detail.tsx (REUSABLE)
export function RiskDetail({ riskId }: { riskId: string })

// /opt/captify-apps/core/src/components/spaces/features/risk/mitigation-tracker.tsx (REUSABLE)
export function MitigationTracker({ risk }: { risk: Risk })
```

## Actions
### 1. Create Risk
```typescript
interface CreateRiskRequest {
  service: 'platform.dynamodb';
  operation: 'put';
  table: 'core-risk';
  data: { Item: Risk };
}
```

### 2. Escalate Risk
```typescript
interface EscalateRiskRequest {
  riskId: string;
  escalateTo: string;
  reason: string;
}
```

### 3. Get Risk Matrix
```typescript
interface GetRiskMatrixRequest {
  spaceId: string;
}

interface RiskMatrixResponse {
  matrix: {
    high_critical: Risk[];
    high_high: Risk[];
    // ... 9 cells total
  };
}
```

## User Stories
### Story 1: Manager Logs New Risk
**Tasks:** Create risk form, set severity/probability/impact, assign owner, add mitigation plan
**Acceptance:** Risk saved and visible in register

### Story 2: Executive Views Risk Matrix
**Tasks:** Plot risks on 3x3 matrix (probability x impact), color-code by severity, filter by workstream
**Acceptance:** Matrix displays all risks accurately

### Story 3: Owner Updates Mitigation Status
**Tasks:** Update status, log actions taken, mark resolved, close risk
**Acceptance:** Status changes reflected immediately

## Implementation
```typescript
function calculateRiskScore(risk: Risk): number {
  const probabilityScore = { low: 1, medium: 2, high: 3 }[risk.probability || 'medium'];
  const impactScore = { low: 1, medium: 2, high: 3, critical: 4 }[risk.impact];
  return probabilityScore * impactScore;
}

function shouldEscalate(risk: Risk): boolean {
  return calculateRiskScore(risk) >= 8 || risk.status === 'open' && daysSince(risk.identifiedDate) > 30;
}
```

## Dependencies
- Feature 04 (Workstream Management), Feature 14 (Portfolio Dashboard)

## Status: Sprint 2, Not Started
