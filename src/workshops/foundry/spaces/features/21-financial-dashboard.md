# Feature 21: Financial Dashboard

**Persona:** Financial
**Priority:** Critical
**Effort:** Large
**Status:** Sprint 1

## Overview
Financial management dashboard providing real-time visibility into contract burn rates, CLIN depletion, budget utilization, and financial health across all spaces and workstreams.

## Requirements
### Functional
1. Display contract-level financial summary, Show CLIN burn rates and depletion forecasts, Track budget vs actual across all spaces, Identify over/under-spending, Drill-down from contract to CLIN to workstream to task, Real-time financial metrics, Export financial reports

### Non-Functional
1. Support 100+ active contracts, Load in <2s, Real-time calculations, Mobile-responsive, Integration with accounting systems, Audit trail

## Ontology
### Nodes Used
```typescript
interface Contract { totalValue: number; burnedAmount: number; } // From Feature 33
interface CLIN { fundedAmount: number; spentAmount: number; } // From Feature 32
interface Workstream { budgetAllocated: number; budgetSpent: number; } // From Feature 04
```

### New Ontology Nodes
```typescript
// OntologyNode for FinancialTransaction
{
  id: "core-financial-transaction",
  name: "FinancialTransaction",
  type: "financialTransaction",
  category: "entity",
  domain: "Financial",
  description: "Financial transaction record for tracking spend",
  icon: "DollarSign",
  color: "#10b981",
  active: "true",
  properties: {
    dataSource: "core-financial-transaction",
    schema: {
      type: "object",
      properties: {
        id: { type: "string" },
        spaceId: { type: "string", required: true },
        contractId: { type: "string" },
        clinId: { type: "string" },
        workstreamId: { type: "string" },
        taskId: { type: "string" },
        transactionType: { type: "string", enum: ["expense", "allocation", "adjustment"], required: true },
        amount: { type: "number", required: true },
        date: { type: "string", required: true },
        description: { type: "string" },
        category: { type: "string", enum: ["labor", "materials", "travel", "other"] },
        approvedBy: { type: "string" },
        approvalDate: { type: "string" },
        invoiceNumber: { type: "string" },
        createdAt: { type: "string" },
        createdBy: { type: "string" }
      },
      required: ["spaceId", "transactionType", "amount", "date"]
    },
    indexes: {
      "spaceId-date-index": { hashKey: "spaceId", rangeKey: "date", type: "GSI" },
      "contractId-date-index": { hashKey: "contractId", rangeKey: "date", type: "GSI" },
      "clinId-date-index": { hashKey: "clinId", rangeKey: "date", type: "GSI" },
      "workstreamId-date-index": { hashKey: "workstreamId", rangeKey: "date", type: "GSI" }
    }
  }
}
```

## Components
```typescript
// /opt/captify-apps/core/src/components/spaces/features/financial/financial-dashboard.tsx (REUSABLE)
export function FinancialDashboard({ spaceId }: { spaceId: string })

// /opt/captify-apps/core/src/components/spaces/features/financial/contract-summary-card.tsx (REUSABLE)
export function ContractSummaryCard({ contractId }: { contractId: string })

// /opt/captify-apps/core/src/components/spaces/features/financial/burn-rate-chart.tsx (REUSABLE)
export function BurnRateChart({ contractId }: { contractId: string })

// /opt/captify-apps/core/src/components/spaces/features/financial/budget-utilization.tsx (REUSABLE)
export function BudgetUtilization({ spaceId }: { spaceId: string })

// /opt/captify-apps/core/src/components/spaces/features/financial/financial-alerts.tsx (REUSABLE)
export function FinancialAlerts({ thresholds }: { thresholds: AlertThresholds })
```

## Actions
### 1. Get Financial Summary
```typescript
interface GetFinancialSummaryRequest {
  spaceId: string;
  dateRange?: { start: string; end: string };
}

interface FinancialSummaryResponse {
  contracts: Array<{
    id: string;
    name: string;
    totalValue: number;
    burnedAmount: number;
    remainingAmount: number;
    burnRate: number; // $/month
    depletionDate: string;
    health: 'green' | 'yellow' | 'red';
  }>;
  summary: {
    totalContractValue: number;
    totalBurned: number;
    totalRemaining: number;
    averageBurnRate: number;
    averageUtilization: number;
  };
}
```

### 2. Calculate Burn Rate
```typescript
interface CalculateBurnRateRequest {
  contractId: string;
  period: 'daily' | 'weekly' | 'monthly';
}

interface BurnRateResult {
  burnRate: number;
  trend: 'increasing' | 'stable' | 'decreasing';
  forecast: Array<{
    date: string;
    projectedSpend: number;
    confidence: number;
  }>;
}
```

### 3. Record Transaction
```typescript
interface RecordTransactionRequest {
  service: 'platform.dynamodb';
  operation: 'put';
  table: 'core-financial-transaction';
  data: { Item: FinancialTransaction };
}
```

## User Stories
### Story 1: Financial Analyst Views Contract Health
**Tasks:** Display all contracts with burn rates, show depletion forecasts, highlight at-risk contracts, drill into CLINs
**Acceptance:** All contracts visible, forecasts accurate within 10%

### Story 2: Financial Analyst Tracks Daily Burn
**Tasks:** Show daily burn rate chart, compare to historical average, identify anomalies, export data
**Acceptance:** Chart updates daily, anomalies flagged

### Story 3: Financial Analyst Reviews Budget Utilization
**Tasks:** Compare planned vs actual by workstream, show variance, identify overspending, generate report
**Acceptance:** Variances calculated correctly, report includes all data

## Implementation
```typescript
// Calculate contract burn rate
function calculateBurnRate(
  transactions: FinancialTransaction[],
  period: 'daily' | 'weekly' | 'monthly'
): number {
  const sortedTxns = transactions.sort((a, b) =>
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const periodDays = period === 'daily' ? 1 : period === 'weekly' ? 7 : 30;
  const recentTxns = sortedTxns.filter(txn =>
    daysSince(txn.date) <= periodDays
  );

  const totalSpend = recentTxns.reduce((sum, txn) => sum + txn.amount, 0);
  return totalSpend / periodDays;
}

// Forecast depletion date
function forecastDepletionDate(
  remainingAmount: number,
  burnRate: number
): string {
  if (burnRate <= 0) return 'N/A';
  const daysUntilDepletion = remainingAmount / burnRate;
  return addDays(new Date(), daysUntilDepletion).toISOString();
}

// Financial health indicator
function getFinancialHealth(
  utilization: number,
  daysRemaining: number
): 'green' | 'yellow' | 'red' {
  if (utilization > 90 && daysRemaining < 30) return 'red';
  if (utilization > 80 || daysRemaining < 60) return 'yellow';
  return 'green';
}
```

## Testing
```typescript
describe('FinancialDashboard', () => {
  it('calculates burn rate correctly', () => {
    const burnRate = calculateBurnRate(mockTransactions, 'monthly');
    expect(burnRate).toBeCloseTo(50000, 0); // $50k/month
  });

  it('forecasts depletion date', () => {
    const depletionDate = forecastDepletionDate(500000, 50000);
    expect(new Date(depletionDate)).toBeInNext(10, 'months');
  });

  it('flags at-risk contracts', async () => {
    const { getByText } = render(<FinancialDashboard spaceId="space-1" />);
    await waitFor(() => {
      expect(getByText('At Risk')).toBeInTheDocument();
    });
  });
});
```

## Dependencies
- Feature 32 (CLIN Management), Feature 33 (Contract Management), Feature 04 (Workstream Management)

## Status: Sprint 1, Not Started
