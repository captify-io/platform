# Feature 17: Investment Allocation View

**Persona:** Executive
**Priority:** High
**Effort:** Medium
**Status:** Sprint 2

## Overview
Investment portfolio view showing budget allocation across workstreams, strategic themes, and capabilities with scenario planning and rebalancing tools.

## Requirements

### Functional Requirements
1. Visualize budget allocation by workstream/theme
2. Compare planned vs actual spending
3. Support "what-if" scenario planning
4. Rebalance allocations with drag-drop
5. Track ROI and value delivery per investment
6. Historical trend analysis
7. Export allocation reports

### Non-Functional Requirements
1. Support 100+ investment categories
2. Real-time calculations
3. Scenario comparison views
4. Mobile-responsive charts
5. Export to Excel/PDF
6. Load in <1s

## Ontology

### Nodes Used
```typescript
interface Workstream { budgetAllocated: number; budgetSpent: number; }
interface Space { totalBudget: number; }
```

### New Ontology Nodes
```typescript
// OntologyNode for InvestmentAllocation
{
  id: "core-investment-allocation",
  name: "InvestmentAllocation",
  type: "investmentAllocation",
  category: "entity",
  domain: "Financial",
  description: "Budget allocation to workstream or strategic theme",
  icon: "PieChart",
  color: "#8b5cf6",
  active: "true",
  properties: {
    dataSource: "core-investment-allocation",
    schema: {
      type: "object",
      properties: {
        id: { type: "string" },
        spaceId: { type: "string", required: true },
        fiscalYear: { type: "string", required: true },
        workstreamId: { type: "string" },
        theme: { type: "string" },
        allocatedAmount: { type: "number", required: true },
        spentAmount: { type: "number" },
        forecastAmount: { type: "number" },
        roi: { type: "number", description: "Return on investment %" },
        valueDelivered: { type: "string", description: "Qualitative value assessment" },
        status: { type: "string", enum: ["planned", "active", "complete"] },
        createdAt: { type: "string" },
        updatedAt: { type: "string" }
      },
      required: ["spaceId", "fiscalYear", "allocatedAmount"]
    },
    indexes: {
      "spaceId-fiscalYear-index": { hashKey: "spaceId", rangeKey: "fiscalYear", type: "GSI" },
      "theme-index": { hashKey: "theme", type: "GSI" }
    }
  }
}
```

## Components

### Reuse Existing
```typescript
import { Card, Badge, Button, Select, Dialog } from '@captify-io/core/components/ui';
```

### New Components
```typescript
// /opt/captify-apps/core/src/components/spaces/features/investment/allocation-view.tsx (REUSABLE)
export function InvestmentAllocationView({ spaceId }: { spaceId: string })

// /opt/captify-apps/core/src/components/spaces/features/investment/allocation-chart.tsx (REUSABLE)
export function AllocationChart({ allocations }: { allocations: InvestmentAllocation[] })

// /opt/captify-apps/core/src/components/spaces/features/investment/scenario-planner.tsx (REUSABLE)
export function ScenarioPlanner({ baseAllocations }: { baseAllocations: InvestmentAllocation[] })

// /opt/captify-apps/core/src/components/spaces/features/investment/roi-tracker.tsx (REUSABLE)
export function ROITracker({ allocations }: { allocations: InvestmentAllocation[] })
```

## Actions

### 1. Get Allocations
```typescript
interface GetAllocationsRequest {
  service: 'platform.dynamodb';
  operation: 'query';
  table: 'core-investment-allocation';
  data: {
    IndexName: 'spaceId-fiscalYear-index';
    KeyConditionExpression: 'spaceId = :spaceId AND fiscalYear = :year';
    ExpressionAttributeValues: { ':spaceId': string; ':year': string };
  };
}
```

### 2. Rebalance Allocations
```typescript
interface RebalanceAllocationsRequest {
  spaceId: string;
  newAllocations: Array<{ id: string; amount: number }>;
  totalBudget: number;
}
```

### 3. Calculate ROI
```typescript
interface CalculateROIRequest {
  allocationId: string;
}

interface ROIResult {
  roi: number;
  valueDelivered: { features: number; revenue: number; savings: number };
}
```

## User Stories

### Story 1: Executive Views Investment Distribution
**Tasks:** Display pie chart, show by theme, compare to plan
**Acceptance Criteria:** All allocations visible, chart accurate

### Story 2: Executive Creates Scenario
**Tasks:** Clone current, adjust allocations, compare outcomes, save scenario
**Acceptance Criteria:** Scenarios saved and comparable

### Story 3: Executive Tracks ROI
**Tasks:** Calculate ROI per allocation, trend over time, export report
**Acceptance Criteria:** ROI calculated correctly

## Implementation Notes
```typescript
function calculateAllocationROI(allocation: InvestmentAllocation): number {
  // Simplified ROI = (Value - Cost) / Cost * 100
  const value = allocation.valueDelivered || 0;
  const cost = allocation.spentAmount || allocation.allocatedAmount;
  return ((value - cost) / cost) * 100;
}
```

## Testing
```typescript
describe('InvestmentAllocationView', () => {
  it('displays allocation chart', async () => {
    const { getByTestId } = render(<InvestmentAllocationView spaceId="space-1" />);
    await waitFor(() => expect(getByTestId('allocation-chart')).toBeInTheDocument());
  });
});
```

## Dependencies
- Feature 14 (Portfolio Dashboard)
- Feature 21 (Financial Dashboard)

## Status
- **Sprint:** Sprint 2
- **Status:** Not Started
