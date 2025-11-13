# Feature 29: Space Detail View

**Persona:** Cross-Persona (All Users)
**Priority:** Critical
**Effort:** Large
**Status:** Sprint 1

## Overview
Comprehensive space detail page with tabs for different views (dashboard, workstreams, team, financials, settings).

## Requirements
### Functional
1. Display space overview (name, description, metrics, health)
2. Tabbed navigation (Dashboard, Workstreams, Team, Financials, Documents, Settings)
3. Real-time activity feed
4. Quick actions (add workstream, invite member, create task)
5. Space-level notifications
6. Breadcrumb navigation
7. Responsive layout for mobile

### Non-Functional
1. Load initial view in <1s, Support deep linking to tabs, Real-time updates via WebSocket, Optimistic UI updates, Role-based tab visibility

## Ontology
### Nodes Used: Space (Feature 03), Workstream (Feature 04), User
### Edges: space → workstream, space → user (members)

## Components
```typescript
// /opt/captify-apps/core/src/components/spaces/features/space/space-detail.tsx (REUSABLE)
export function SpaceDetail({ spaceId }: { spaceId: string })

// /opt/captify-apps/core/src/components/spaces/features/space/space-header.tsx (REUSABLE)
export function SpaceHeader({ space }: { space: Space })

// /opt/captify-apps/core/src/components/spaces/features/space/space-tabs.tsx (REUSABLE)
export function SpaceTabs({ spaceId, activeTab }: SpaceTabsProps)

// /opt/captify-apps/core/src/components/spaces/features/space/activity-feed.tsx (REUSABLE)
export function ActivityFeed({ spaceId }: { spaceId: string })

// /opt/captify-apps/core/src/components/spaces/features/space/quick-actions.tsx (REUSABLE)
export function SpaceQuickActions({ spaceId }: { spaceId: string })
```

## Actions
### 1. Get Space Detail
```typescript
interface GetSpaceDetailRequest {
  service: 'platform.dynamodb';
  operation: 'get';
  table: 'core-space';
  data: { Key: { id: string } };
}

interface SpaceDetailResponse extends Space {
  workstreams: Workstream[];
  members: User[];
  recentActivity: Activity[];
  metrics: {
    totalTasks: number;
    completedTasks: number;
    totalBudget: number;
    burnRate: number;
  };
}
```

### 2. Update Space
```typescript
interface UpdateSpaceRequest {
  service: 'platform.dynamodb';
  operation: 'update';
  table: 'core-space';
  data: {
    Key: { id: string };
    UpdateExpression: string;
    ExpressionAttributeValues: Record<string, any>;
  };
}
```

## User Stories
### Story 1: User Views Space Detail
**Tasks:** Load space data, display header with metrics, show tabbed content, render activity feed
**Acceptance:** Page loads in <1s, all tabs accessible

### Story 2: User Switches Between Tabs
**Tasks:** Tab navigation, lazy load tab content, persist tab in URL, update breadcrumb
**Acceptance:** Tab switching instant, deep links work

### Story 3: User Performs Quick Action
**Tasks:** Open quick action menu, create workstream/task, update space in place
**Acceptance:** Actions complete without page reload

## Implementation
```typescript
// Main space detail page
export function SpaceDetail({ spaceId }: { spaceId: string }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { data: space, isLoading } = useQuery(['space', spaceId], () =>
    getSpaceDetail(spaceId)
  );

  if (isLoading) return <SpaceDetailSkeleton />;

  return (
    <div className="space-detail">
      <SpaceHeader space={space} />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="workstreams">Workstreams</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="financials">Financials</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <SpaceDashboard spaceId={spaceId} />
        </TabsContent>

        <TabsContent value="workstreams">
          <WorkstreamList spaceId={spaceId} />
        </TabsContent>

        {/* ... more tabs */}
      </Tabs>

      <ActivityFeed spaceId={spaceId} />
      <SpaceQuickActions spaceId={spaceId} />
    </div>
  );
}
```

## Testing
```typescript
describe('SpaceDetail', () => {
  it('renders space detail page', async () => {
    const { getByText } = render(<SpaceDetail spaceId="space-1" />);
    await waitFor(() => {
      expect(getByText('Space Name')).toBeInTheDocument();
    });
  });

  it('switches between tabs', async () => {
    const { getByText, getByRole } = render(<SpaceDetail spaceId="space-1" />);

    fireEvent.click(getByRole('tab', { name: 'Workstreams' }));

    await waitFor(() => {
      expect(getByText('Workstream List')).toBeInTheDocument();
    });
  });
});
```

## Dependencies
- Feature 03 (Space Management), Feature 04 (Workstream Management), Feature 06 (Activity Feed)

## Status: Sprint 1, Not Started
