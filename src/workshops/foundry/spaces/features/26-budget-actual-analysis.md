# Feature 26: Budget vs Actual Analysis

**Persona:** Financial
**Priority:** High
**Effort:** Small
**Status:** Sprint 2

## Overview
Comparative analysis of budgeted vs actual spending with variance reports, trend analysis, and automated alerts for significant deviations.

## Requirements
### Functional: Compare budget to actual by period, Variance analysis (absolute and %), Trend charts, Root cause tracking, Forecast to completion, Alert on variance thresholds, Export variance reports
### Non-Functional: Real-time calculations, Support rolling forecasts, Historical comparisons, Mobile-responsive

## Ontology
### Nodes Used: Workstream (budgetAllocated, budgetSpent), FinancialTransaction, Contract, CLIN

## Components
```typescript
// /opt/captify-apps/core/src/components/spaces/features/budget/budget-actual-view.tsx (REUSABLE)
export function BudgetActualView({ spaceId }: { spaceId: string })

// /opt/captify-apps/core/src/components/spaces/features/budget/variance-chart.tsx (REUSABLE)
export function VarianceChart({ data }: { data: VarianceData[] })

// /opt/captify-apps/core/src/components/spaces/features/budget/forecast-to-complete.tsx (REUSABLE)
export function ForecastToComplete({ workstreamId }: { workstreamId: string })
```

## Actions
### 1. Calculate Variance
```typescript
interface CalculateVarianceRequest {
  spaceId: string;
  period: { start: string; end: string };
  groupBy: 'workstream' | 'contract' | 'clin';
}

interface VarianceAnalysis {
  items: Array<{
    id: string;
    name: string;
    budgeted: number;
    actual: number;
    variance: number;
    variancePercent: number;
    status: 'on-budget' | 'over-budget' | 'under-budget';
  }>;
  summary: {
    totalBudgeted: number;
    totalActual: number;
    totalVariance: number;
  };
}
```

### 2. Forecast to Complete
```typescript
interface ForecastToCompleteRequest {
  workstreamId: string;
}

interface ForecastResult {
  originalBudget: number;
  spentToDate: number;
  estimateToComplete: number;
  estimateAtCompletion: number;
  varianceAtCompletion: number;
}
```

## User Stories
### Story 1: Analyst Reviews Monthly Variance
**Tasks:** Display budget vs actual table, show variance %, highlight >10% variance, drill into details
**Acceptance:** Variance calculated correctly, alerts visible

### Story 2: Analyst Forecasts Completion Cost
**Tasks:** Calculate estimate to complete, show estimate at completion, compare to budget
**Acceptance:** Forecast within 5% of actual when complete

## Implementation
```typescript
function calculateVariance(
  budgeted: number,
  actual: number
): { variance: number; variancePercent: number; status: string } {
  const variance = actual - budgeted;
  const variancePercent = (variance / budgeted) * 100;

  let status = 'on-budget';
  if (Math.abs(variancePercent) > 10) {
    status = variance > 0 ? 'over-budget' : 'under-budget';
  }

  return { variance, variancePercent, status };
}

function forecastToComplete(
  workstream: Workstream,
  historicalData: FinancialTransaction[]
): ForecastResult {
  const spentToDate = workstream.budgetSpent || 0;
  const progress = workstream.progress || 0;

  // Estimate to Complete = (Budget - SpentToDate) / (Progress / 100)
  const remainingWork = 100 - progress;
  const burnRate = spentToDate / progress;
  const estimateToComplete = burnRate * remainingWork;

  return {
    originalBudget: workstream.budgetAllocated,
    spentToDate,
    estimateToComplete,
    estimateAtCompletion: spentToDate + estimateToComplete,
    varianceAtCompletion: (spentToDate + estimateToComplete) - workstream.budgetAllocated
  };
}
```

## Testing
```typescript
describe('BudgetActualAnalysis', () => {
  it('calculates variance correctly', () => {
    const result = calculateVariance(100000, 110000);
    expect(result.variance).toBe(10000);
    expect(result.variancePercent).toBe(10);
    expect(result.status).toBe('over-budget');
  });

  it('forecasts completion cost', () => {
    const forecast = forecastToComplete(mockWorkstream, mockTransactions);
    expect(forecast.estimateAtCompletion).toBeGreaterThan(mockWorkstream.budgetAllocated);
  });
});
```

## Dependencies: Feature 21 (Financial Dashboard), Feature 04 (Workstream Management)
## Status: Sprint 2, Not Started
