# Feature 23: Depletion Forecast

**Persona:** Financial
**Priority:** High
**Effort:** Medium
**Status:** Sprint 2

## Overview
AI-powered forecasting of contract and CLIN depletion dates with multiple scenarios, confidence intervals, and what-if analysis.

## Requirements
### Functional: Predict depletion dates, Multiple scenarios (best/worst/likely), Confidence intervals, What-if analysis, Historical accuracy tracking, Alert before depletion, Export forecasts
### Non-Functional: Forecast updates daily, AI accuracy >85%, Support 500+ forecasts, Load <2s

## Ontology
### Nodes Used: Contract, CLIN, FinancialTransaction
### New Ontology Nodes
```typescript
// OntologyNode for DepletionForecast
{
  id: "core-depletion-forecast",
  name: "DepletionForecast",
  type: "depletionForecast",
  category: "entity",
  domain: "Financial",
  icon: "TrendingDown",
  color: "#f59e0b",
  active: "true",
  properties: {
    dataSource: "core-depletion-forecast",
    schema: {
      type: "object",
      properties: {
        id: { type: "string" },
        contractId: { type: "string" },
        clinId: { type: "string" },
        forecastDate: { type: "string", required: true },
        scenarios: {
          type: "object",
          properties: {
            best: { type: "object", properties: { depletionDate: { type: "string" }, confidence: { type: "number" } } },
            likely: { type: "object", properties: { depletionDate: { type: "string" }, confidence: { type: "number" } } },
            worst: { type: "object", properties: { depletionDate: { type: "string" }, confidence: { type: "number" } } }
          }
        },
        assumptions: { type: "array", items: { type: "string" } },
        createdAt: { type: "string" }
      },
      required: ["forecastDate", "scenarios"]
    },
    indexes: {
      "contractId-forecastDate-index": { hashKey: "contractId", rangeKey: "forecastDate", type: "GSI" },
      "clinId-forecastDate-index": { hashKey: "clinId", rangeKey: "forecastDate", type: "GSI" }
    }
  }
}
```

## Components
```typescript
// /opt/captify-apps/core/src/components/spaces/features/forecast/depletion-forecast.tsx (REUSABLE)
export function DepletionForecast({ contractId }: { contractId: string })

// /opt/captify-apps/core/src/components/spaces/features/forecast/scenario-view.tsx (REUSABLE)
export function ScenarioView({ scenarios }: { scenarios: Scenarios })

// /opt/captify-apps/core/src/components/spaces/features/forecast/what-if-tool.tsx (REUSABLE)
export function WhatIfTool({ contractId }: { contractId: string })
```

## Actions
### 1. Generate Forecast
```typescript
interface GenerateForecastRequest {
  service: 'platform.bedrock';
  operation: 'invoke';
  data: {
    modelId: 'anthropic.claude-3-sonnet-20240229-v1:0';
    messages: [{ role: 'user'; content: string }];
  };
}

interface ForecastResponse {
  scenarios: {
    best: { depletionDate: string; confidence: number };
    likely: { depletionDate: string; confidence: number };
    worst: { depletionDate: string; confidence: number };
  };
  assumptions: string[];
  reasoning: string;
}
```

### 2. What-If Analysis
```typescript
interface WhatIfAnalysisRequest {
  contractId: string;
  adjustments: {
    burnRateChange?: number; // percentage
    additionalFunding?: number;
    scopeReduction?: number; // percentage
  };
}

interface WhatIfResult {
  originalDepletionDate: string;
  adjustedDepletionDate: string;
  daysDifference: number;
  impact: string;
}
```

## User Stories
### Story 1: Analyst Views Depletion Forecast
**Tasks:** Display three scenarios, show confidence, plot timeline, list assumptions
**Acceptance:** All scenarios displayed, confidence >80%

### Story 2: Analyst Runs What-If Scenario
**Tasks:** Adjust burn rate, add funding, recalculate, compare to baseline
**Acceptance:** What-if results accurate, comparison clear

## Implementation
```typescript
async function generateDepletionForecast(
  contractId: string,
  historicalData: FinancialTransaction[]
): Promise<DepletionForecast> {
  // Use AI to analyze historical burn patterns
  const prompt = `Analyze this contract's burn rate history and forecast depletion:

Historical data: ${JSON.stringify(historicalData)}
Remaining funds: ${contract.totalValue - contract.burnedAmount}

Provide three scenarios (best, likely, worst) with depletion dates and confidence scores.`;

  const aiResponse = await bedrock.invoke({ modelId: 'claude-3-sonnet', prompt });

  return {
    forecastDate: new Date().toISOString(),
    scenarios: aiResponse.scenarios,
    assumptions: aiResponse.assumptions
  };
}
```

## Dependencies: Feature 21 (Financial Dashboard), Feature 22 (CLIN Burn Rate)
## Status: Sprint 2, Not Started
