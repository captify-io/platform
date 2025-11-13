# Feature 14: Portfolio Dashboard

**Persona:** Executive
**Priority:** Critical
**Effort:** Large
**Status:** Sprint 1

## Overview

Executive-level portfolio dashboard providing high-level visibility into all spaces, workstreams, progress, health, and strategic alignment across the organization.

## Requirements

### Functional Requirements
1. Display all spaces with key metrics (progress, health, budget)
2. Visualize workstream health and status across portfolio
3. Show OKR progress and strategic alignment
4. Highlight risks, blockers, and critical items
5. Drill-down from portfolio to space to workstream
6. Real-time updates on portfolio changes
7. Export portfolio reports (PDF, PowerPoint)

### Non-Functional Requirements
1. Dashboard loads in <2s for 100+ spaces
2. Support 1000+ workstreams across portfolio
3. Real-time metrics refresh every 30s
4. Responsive design for mobile/tablet
5. Customizable widget layout
6. Role-based data filtering
7. Accessible visualizations

## Ontology

### Nodes Used
```typescript
// From Feature 03
interface Space {
  id: string;
  name: string;
  status: string;
  progress: number;
  health: 'green' | 'yellow' | 'red';
  // ...
}

// From Feature 04
interface Workstream {
  id: string;
  name: string;
  status: string;
  progress: number;
  // ...
}

// From Feature 16
interface Objective {
  id: string;
  progress: number;
  // ...
}
```

### New Ontology Nodes Required
```typescript
// OntologyNode for PortfolioDashboardConfig
{
  id: "core-portfolio-dashboard-config",
  name: "PortfolioDashboardConfig",
  type: "portfolioDashboardConfig",
  category: "entity",
  domain: "Executive",
  description: "User-specific portfolio dashboard configuration",
  icon: "LayoutDashboard",
  color: "#8b5cf6",
  active: "true",
  properties: {
    dataSource: "core-portfolio-dashboard-config",
    schema: {
      type: "object",
      properties: {
        id: { type: "string" },
        userId: { type: "string", required: true },
        widgets: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              type: { type: "string", enum: ["spaces", "okrs", "risks", "budget", "velocity"] },
              position: { type: "object", properties: { x: { type: "number" }, y: { type: "number" } } },
              size: { type: "object", properties: { width: { type: "number" }, height: { type: "number" } } },
              config: { type: "object" }
            }
          }
        },
        filters: {
          type: "object",
          properties: {
            spaceIds: { type: "array", items: { type: "string" } },
            healthStatus: { type: "array", items: { type: "string" } },
            dateRange: { type: "object" }
          }
        },
        createdAt: { type: "string" },
        updatedAt: { type: "string" }
      },
      required: ["userId"]
    },
    indexes: {
      "userId-index": {
        hashKey: "userId",
        type: "GSI"
      }
    }
  }
}
```

## Components

### Reuse Existing Captify Components
```typescript
import { Card } from '@captify-io/core/components/ui/card';
import { Badge } from '@captify-io/core/components/ui/badge';
import { Progress } from '@captify-io/core/components/ui/progress';
import { Select } from '@captify-io/core/components/ui/select';
import { Tabs } from '@captify-io/core/components/ui/tabs';
import { Button } from '@captify-io/core/components/ui/button';
```

### New Components to Create
```typescript
// /opt/captify-apps/core/src/components/spaces/features/executive/portfolio-dashboard.tsx (REUSABLE)
export function PortfolioDashboard({ userId }: { userId: string })

// /opt/captify-apps/core/src/components/spaces/features/executive/space-grid.tsx (REUSABLE)
export function SpaceGrid({ spaces }: { spaces: Space[] })

// /opt/captify-apps/core/src/components/spaces/features/executive/health-matrix.tsx (REUSABLE)
export function HealthMatrix({ workstreams }: { workstreams: Workstream[] })

// /opt/captify-apps/core/src/components/spaces/features/executive/okr-progress-widget.tsx (REUSABLE)
export function OKRProgressWidget({ objectives }: { objectives: Objective[] })

// /opt/captify-apps/core/src/components/spaces/features/executive/critical-items-widget.tsx (REUSABLE)
export function CriticalItemsWidget({ items }: { items: any[] })

// /opt/captify-apps/core/src/components/spaces/features/executive/dashboard-widget.tsx (REUSABLE)
export function DashboardWidget({ widget }: { widget: Widget })

// /opt/captify-apps/core/src/components/spaces/features/executive/portfolio-filters.tsx (REUSABLE)
export function PortfolioFilters({ filters, onFilterChange }: PortfolioFiltersProps)
```

## Actions

### 1. Get Portfolio Overview
```typescript
interface GetPortfolioOverviewRequest {
  userId: string;
  filters?: {
    spaceIds?: string[];
    healthStatus?: string[];
    dateRange?: { start: string; end: string };
  };
}

interface PortfolioOverviewResponse {
  spaces: Array<{
    id: string;
    name: string;
    progress: number;
    health: 'green' | 'yellow' | 'red';
    budget: { used: number; total: number };
    activeWorkstreams: number;
  }>;
  summary: {
    totalSpaces: number;
    totalWorkstreams: number;
    averageProgress: number;
    healthDistribution: { green: number; yellow: number; red: number };
    budgetUtilization: number;
  };
  criticalItems: Array<{
    type: 'risk' | 'blocker' | 'issue';
    severity: 'high' | 'critical';
    spaceId: string;
    description: string;
  }>;
}
```

**Implementation:**
- Query all spaces user has access to
- Aggregate metrics across portfolio
- Identify critical items (risks, blockers)
- Calculate health trends

### 2. Get Workstream Health Matrix
```typescript
interface GetHealthMatrixRequest {
  spaceIds: string[];
}

interface HealthMatrixResponse {
  matrix: Array<{
    spaceId: string;
    spaceName: string;
    workstreams: Array<{
      id: string;
      name: string;
      health: 'green' | 'yellow' | 'red';
      progress: number;
      trend: 'improving' | 'stable' | 'declining';
    }>;
  }>;
}
```

### 3. Get OKR Portfolio Progress
```typescript
interface GetOKRPortfolioProgressRequest {
  spaceIds: string[];
  quarter?: string;
}

interface OKRPortfolioProgressResponse {
  objectives: Array<{
    id: string;
    title: string;
    progress: number;
    keyResults: Array<{
      id: string;
      description: string;
      progress: number;
      target: number;
    }>;
    owner: string;
    spaceId: string;
  }>;
  summary: {
    onTrack: number;
    atRisk: number;
    offTrack: number;
    averageProgress: number;
  };
}
```

### 4. Export Portfolio Report
```typescript
interface ExportPortfolioReportRequest {
  format: 'pdf' | 'pptx' | 'xlsx';
  includeCharts: boolean;
  dateRange: { start: string; end: string };
  sections: string[]; // ['spaces', 'okrs', 'risks', 'budget']
}

interface ExportReportResponse {
  url: string; // S3 presigned URL
  expiresAt: string;
}
```

## User Stories & Tasks

### Story 1: Executive Views Portfolio Overview
**As an** executive,
**I want to** see high-level metrics across all spaces,
**So that** I understand portfolio health at a glance.

**Tasks:**
1. Create PortfolioDashboard component
2. Fetch all spaces with metrics
3. Display space grid with cards
4. Show summary statistics
5. Highlight critical items
6. Add refresh button

**Acceptance Criteria:**
- Dashboard loads in <2s
- All metrics visible
- Drill-down works

### Story 2: Executive Filters Portfolio View
**As an** executive,
**I want to** filter spaces by health, status, or tags,
**So that** I can focus on specific areas.

**Tasks:**
1. Create PortfolioFilters component
2. Add health filter (green/yellow/red)
3. Add status filter
4. Add tag multi-select
5. Persist filters in URL
6. Update dashboard on filter change

**Acceptance Criteria:**
- Filters work instantly
- URL sharing preserves filters
- Can clear all filters

### Story 3: Executive Views Workstream Health Matrix
**As an** executive,
**I want to** see a matrix of all workstreams by health,
**So that** I can identify problem areas.

**Tasks:**
1. Create HealthMatrix component
2. Group workstreams by space
3. Color-code by health
4. Show progress bars
5. Add trend indicators
6. Enable drill-down to workstream

**Acceptance Criteria:**
- Matrix displays all workstreams
- Color coding is clear
- Trends are accurate

### Story 4: Executive Tracks OKR Progress
**As an** executive,
**I want to** see OKR progress across the portfolio,
**So that** I know if we're meeting strategic goals.

**Tasks:**
1. Create OKRProgressWidget
2. Fetch all objectives
3. Display progress by objective
4. Show on-track vs at-risk
5. Highlight blocked OKRs
6. Link to objective details

**Acceptance Criteria:**
- All OKRs visible
- Progress accurate
- Can drill into details

### Story 5: Executive Exports Portfolio Report
**As an** executive,
**I want to** export a portfolio report,
**So that** I can share with stakeholders.

**Tasks:**
1. Create export dialog
2. Select format (PDF/PPTX/XLSX)
3. Choose date range
4. Select sections to include
5. Generate report with charts
6. Download from S3

**Acceptance Criteria:**
- Export completes in <10s
- Report includes all data
- Charts are readable

## Implementation Notes

```typescript
// Aggregate portfolio metrics
async function getPortfolioMetrics(
  userId: string,
  credentials: AwsCredentials
): Promise<PortfolioMetrics> {
  // Get all spaces user has access to
  const spaces = await getUserSpaces(userId, credentials);

  // Aggregate metrics
  const metrics = {
    totalSpaces: spaces.length,
    totalWorkstreams: 0,
    averageProgress: 0,
    healthDistribution: { green: 0, yellow: 0, red: 0 },
    budgetUtilization: 0
  };

  for (const space of spaces) {
    metrics.totalWorkstreams += space.workstreams?.length || 0;
    metrics.averageProgress += space.progress || 0;
    metrics.healthDistribution[space.health] += 1;
    metrics.budgetUtilization += (space.budget?.used || 0) / (space.budget?.total || 1);
  }

  metrics.averageProgress /= spaces.length;
  metrics.budgetUtilization /= spaces.length;

  return metrics;
}
```

## Testing

```typescript
describe('PortfolioDashboard', () => {
  it('displays all spaces', async () => {
    const { getAllByTestId } = render(<PortfolioDashboard userId="exec-1" />);
    await waitFor(() => {
      expect(getAllByTestId('space-card')).toHaveLength(10);
    });
  });

  it('filters by health status', async () => {
    const { getByLabelText, queryByText } = render(<PortfolioDashboard userId="exec-1" />);

    fireEvent.change(getByLabelText('Health'), { target: { value: 'red' } });

    await waitFor(() => {
      expect(queryByText('Green Space')).not.toBeInTheDocument();
      expect(queryByText('Red Space')).toBeInTheDocument();
    });
  });
});
```

## Dependencies

**Upstream:**
- Feature 03 (Space Management)
- Feature 04 (Workstream Management)
- Feature 16 (Objective Tracking)

**Downstream:**
- Feature 20 (Strategic Reports)

## Status
- **Sprint:** Sprint 1
- **Status:** Not Started
