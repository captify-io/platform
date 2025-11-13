# Goal Node Specification

## Overview
**Category:** Alignment
**Icon:** Target
**DynamoDB Table:** `captify-core-Goal`
**API Reference:** `core-Goal`

## Purpose
The Goal node represents strategic organizational goals that drive decision-making, resource allocation, and execution. Goals are the top-level alignment mechanism that connects contracts, funding, objectives, and outcomes to organizational strategy.

## Why We Created It
Goals serve as the "North Star" for organizational planning:
- Connect strategic intent to tactical execution
- Enable traceability from contract funding to delivered outcomes
- Provide a mechanism to measure organizational success through KPIs
- Link financial resources (contracts) to measurable outcomes (objectives)

## Core Fields
| Field | Type | Purpose |
|-------|------|---------|
| `id` | string | Unique identifier (e.g., `goal-readiness-improvement`) |
| `name` | string | Human-readable goal name |
| `description` | string | Detailed explanation of the goal |
| `owner` | string | Person/team responsible for achieving the goal |
| `status` | `draft \| active \| archived` | Current state of the goal |
| `objectives` | string[] | Array of Objective node IDs |
| `kpis` | string[] | Array of KPI node IDs for measurement |
| `contracts` | string[] | Array of Contract node IDs funding this goal |
| `due` | string | Target completion date (ISO 8601) |
| `tags` | string[] | Categorization tags |
| `metadata` | object | Extensible metadata |

## Relationships

### Outbound Edges (What Goals Connect To)
| Verb | Target Node Type | Description |
|------|------------------|-------------|
| `measures` | KPI | Goal is tracked by specific KPIs |
| `funds` | Contract | Goal is funded by contract(s) |
| `enables` | Objective | Goal is achieved through objectives |
| `supports` | UseCase | Goal is supported by use cases |

### Inbound Edges (What Connects To Goals)
| Verb | Source Node Type | Description |
|------|------------------|-------------|
| `supports` | Application | Applications that enable goal achievement |
| `implements` | UseCase | Use cases that implement the goal |
| `funds` | Contract | Contracts that fund the goal |

## Use Cases

### 1. Contract-to-Outcome Traceability
```
Contract → funds → Goal → enables → Objective → measures → KPI
```
**Example:** AFWERX contract funds "Improve Supply Chain Readiness" goal, which breaks down into objectives like "Reduce MICAP by 15%", measured by specific KPIs.

### 2. Strategic Planning
- Define organizational goals for fiscal year
- Allocate contract funds to goals
- Break goals into measurable objectives
- Track progress via KPIs

### 3. Portfolio Management
- Group multiple objectives under strategic goals
- Track resource allocation across goals
- Identify under-funded or over-funded goals
- Report on goal achievement to stakeholders

## Example Data

```json
{
  "id": "goal-supply-chain-readiness",
  "type": "Goal",
  "name": "Improve Air Force Supply Chain Readiness",
  "description": "Reduce aircraft downtime by improving part availability and supply chain visibility across the enterprise",
  "owner": "448th SCMW",
  "status": "active",
  "due": "2025-09-30",
  "objectives": [
    "obj-reduce-micap",
    "obj-improve-forecast-accuracy",
    "obj-digital-twin-implementation"
  ],
  "kpis": [
    "kpi-micap-reduction",
    "kpi-forecast-accuracy",
    "kpi-nmcs-rate"
  ],
  "contracts": [
    "contract-afwerx-2024",
    "contract-448-scmw-operations"
  ],
  "tags": ["supply-chain", "readiness", "fy2025"],
  "createdAt": "2024-10-01T00:00:00Z",
  "updatedAt": "2025-01-15T10:30:00Z"
}
```

## Relationships with Other Nodes

### Core Dependencies
- **Contract** - Provides funding and scope
- **Objective** - Breaks goal into measurable components
- **KPI** - Provides quantitative measurement
- **UseCase** - Implements capabilities to achieve goal

### Extended Relationships
- **Application** - Tools/systems that enable goal
- **Dataset** - Data required to track/achieve goal
- **Persona** - People responsible for goal achievement
- **Risk** - Risks that may prevent goal achievement

## Business Rules

1. **Every Goal must have at least one Objective**
   - Goals without objectives are not measurable

2. **Every Goal should have at least one KPI**
   - KPIs provide quantitative tracking

3. **Active Goals should have a due date**
   - Enables timeline tracking and reporting

4. **Goals should link to funding source**
   - Connects strategy to budget reality

5. **Goal ownership is required**
   - Ensures accountability

## Common Queries

### Get all goals for a contract
```typescript
// Query: core-Goal where contracts[] contains contract-id
```

### Get goal progress (via KPIs)
```typescript
// Query: core-Goal -> get kpis[] -> query core-KPI for current values
```

### Get all objectives for a goal
```typescript
// Query: core-Goal -> get objectives[] -> query core-Objective
```

## Integration Points

### API Usage
```typescript
import { dynamodb } from '@captify-io/core/services';

// Create a goal
await dynamodb.put({
  table: 'core-Goal',
  data: goalData
});

// Query goals by owner
await dynamodb.query({
  table: 'core-Goal',
  index: 'owner-index',
  key: 'owner',
  value: '448th SCMW'
});
```

### DynamoDB Table
**Table Name:** `captify-core-Goal`
**Partition Key:** `id` (String)
**GSI:** `owner-createdAt-index` for querying by owner
**GSI:** `status-due-index` for querying active goals by due date

## Related Documentation
- [Objective.spec.md](./Objective.spec.md) - Measurable components of goals
- [KPI.spec.md](./KPI.spec.md) - Metrics that track goals
- [Contract.spec.md](./Contract.spec.md) - Funding sources for goals
- [UseCase.spec.md](./UseCase.spec.md) - Implementation of goals
