# Feature 22: CLIN Burn Rate Tracking

**Persona:** Financial
**Priority:** Critical
**Effort:** Medium
**Status:** Sprint 1

## Overview
Detailed CLIN-level burn rate tracking with historical trends, variance analysis, and automated alerts for spending thresholds.

## Requirements
### Functional: Track burn rate per CLIN, Historical trend charts, Compare to plan, Alert on thresholds, Variance analysis, Export reports
### Non-Functional: Real-time updates, Support 1000+ CLINs, Load <1s, Mobile-responsive

## Ontology
### Nodes Used: CLIN (Feature 32), FinancialTransaction (Feature 21)
### New Nodes: None

## Components
```typescript
// /opt/captify-apps/core/src/components/spaces/features/clin/clin-burn-tracker.tsx (REUSABLE)
export function CLINBurnTracker({ clinId }: { clinId: string })

// /opt/captify-apps/core/src/components/spaces/features/clin/burn-trend-chart.tsx (REUSABLE)
export function BurnTrendChart({ clinId, period }: BurnTrendChartProps)

// /opt/captify-apps/core/src/components/spaces/features/clin/variance-analysis.tsx (REUSABLE)
export function VarianceAnalysis({ clinId }: { clinId: string })
```

## Actions
### 1. Get CLIN Burn History
```typescript
interface GetCLINBurnHistoryRequest {
  service: 'platform.dynamodb';
  operation: 'query';
  table: 'core-financial-transaction';
  data: {
    IndexName: 'clinId-date-index';
    KeyConditionExpression: 'clinId = :clinId';
    ExpressionAttributeValues: { ':clinId': string };
  };
}
```

### 2. Calculate Variance
```typescript
interface CalculateVarianceRequest {
  clinId: string;
  periodStart: string;
  periodEnd: string;
}

interface VarianceResult {
  plannedSpend: number;
  actualSpend: number;
  variance: number;
  variancePercent: number;
  reason: string;
}
```

## User Stories
### Story 1: Analyst Views CLIN Burn Trend
**Tasks:** Display historical burn, show trend line, highlight anomalies
**Acceptance:** Chart accurate, anomalies visible

### Story 2: Analyst Sets Burn Rate Alert
**Tasks:** Configure threshold (80% utilization), set recipients, activate alert
**Acceptance:** Alert fires at threshold

## Implementation
```typescript
function calculateCLINVariance(clin: CLIN, transactions: FinancialTransaction[]): VarianceResult {
  const actualSpend = transactions.reduce((sum, t) => sum + t.amount, 0);
  const plannedSpend = clin.plannedBurnRate * daysSince(clin.startDate);
  const variance = actualSpend - plannedSpend;
  return {
    plannedSpend,
    actualSpend,
    variance,
    variancePercent: (variance / plannedSpend) * 100,
    reason: variance > 0 ? 'Overspending' : 'Underspending'
  };
}
```

## Dependencies: Feature 21 (Financial Dashboard), Feature 32 (CLIN Management)
## Status: Sprint 1, Not Started
