# Feature 07: Team Dashboard (Manager)

**Persona**: Manager (Organizers)
**Priority**: P0 - Critical
**Effort**: 13 story points

---

## Requirements

### Functional Requirements
- FR1: Display team capacity utilization (hours available vs. committed)
- FR2: Show team velocity trend (last 6 sprints)
- FR3: Display current sprint progress (burndown chart)
- FR4: List active team members with workload
- FR5: Highlight blockers and at-risk items
- FR6: Show upcoming deadlines and milestones
- FR7: Filter by space or workstream

### Non-Functional Requirements
- NFR1: Dashboard loads in <1s
- NFR2: Real-time updates (30s polling)
- NFR3: Export reports to PDF
- NFR4: Mobile responsive

---

## Ontology

### Nodes Used
```typescript
Team { id, name, memberIds, spaceIds }
User { id, name, email, avatar, workHoursPerWeek }
Task { id, assignee, status, estimatedHours, actualHours, spaceId }
Sprint { id, teamId, startDate, endDate, plannedPoints, completedPoints }
TimeEntry { userId, date, hours, taskId }
Blocker { taskId, severity, status }
```

### Edges Used
```typescript
Team → User (hasMembers)
Team → Space (manages)
User → Task (assignedTo)
Sprint → Task (contains)
Task → Blocker (hasBlockers)
```

### New Ontology Nodes Required
```typescript
export const teamNode: OntologyNode = {
  id: 'core-team',
  name: 'Team',
  type: 'team',
  category: 'entity',
  domain: 'Work Management',
  description: 'Group of users working together',
  icon: 'Users',
  color: '#3b82f6',
  active: 'true',
  properties: {
    dataSource: 'core-team',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string', required: true },
        memberIds: { type: 'array', items: { type: 'string' } },
        managerId: { type: 'string' },
        spaceIds: { type: 'array', items: { type: 'string' } }
      }
    },
    indexes: {
      'managerId-index': { hashKey: 'managerId', type: 'GSI' }
    }
  }
}

export const sprintNode: OntologyNode = {
  id: 'core-sprint',
  name: 'Sprint',
  type: 'sprint',
  category: 'entity',
  domain: 'Work Management',
  description: 'Time-boxed iteration for work',
  icon: 'Calendar',
  color: '#8b5cf6',
  active: 'true',
  properties: {
    dataSource: 'core-sprint',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        teamId: { type: 'string', required: true },
        name: { type: 'string', required: true },
        startDate: { type: 'string', required: true },
        endDate: { type: 'string', required: true },
        status: { type: 'string', enum: ['planning', 'active', 'completed'] },
        plannedPoints: { type: 'number' },
        completedPoints: { type: 'number' }
      }
    },
    indexes: {
      'teamId-startDate-index': { hashKey: 'teamId', rangeKey: 'startDate', type: 'GSI' },
      'status-index': { hashKey: 'status', type: 'GSI' }
    }
  }
}
```

---

## Components

### Reuse Existing Captify Components
```typescript
import { Card, CardHeader, CardContent } from '@captify-io/core/components/ui/card'
import { Progress } from '@captify-io/core/components/ui/progress'
import { Badge } from '@captify-io/core/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@captify-io/core/components/ui/avatar'
import { Select } from '@captify-io/core/components/ui/select'
import { apiClient } from '@captify-io/core/lib/api'
```

### New Components to Create
```
/components/spaces/panels/manager/
  team-dashboard-panel.tsx

/components/spaces/widgets/
  capacity-widget.tsx (REUSABLE)
  velocity-chart.tsx (REUSABLE)
  burndown-chart.tsx (REUSABLE)
  team-member-card.tsx (REUSABLE)
  blockers-list.tsx (REUSABLE)
```

---

## Actions

### Get Team Metrics
```typescript
interface GetTeamMetricsRequest {
  service: 'platform.space'
  operation: 'getTeamMetrics'
  data: { teamId: string }
}

interface TeamMetrics {
  capacity: { available: number, committed: number, utilization: number }
  velocity: Array<{ sprint: string, points: number }>
  currentSprint: { planned: number, completed: number, remaining: number }
  members: Array<{ user: User, workload: number, tasksCount: number }>
  blockers: Blocker[]
}

export async function getTeamMetrics(params: { teamId: string }, credentials: AwsCredentials): Promise<TeamMetrics> {
  // Get team
  const team = await getTeam(params.teamId, credentials)

  // Calculate capacity
  const members = await Promise.all(team.memberIds.map(id => getUser(id, credentials)))
  const totalCapacity = members.reduce((sum, m) => sum + (m.workHoursPerWeek || 40), 0)

  // Get current sprint
  const currentSprint = await getCurrentSprint(params.teamId, credentials)

  // Get committed hours
  const tasks = await getSprintTasks(currentSprint.id, credentials)
  const committedHours = tasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0)

  // Get velocity (last 6 sprints)
  const velocity = await getVelocityHistory(params.teamId, 6, credentials)

  // Get member workloads
  const memberWorkloads = await Promise.all(
    members.map(async (user) => ({
      user,
      workload: await getUserWorkload(user.id, credentials),
      tasksCount: tasks.filter(t => t.assignee === user.id).length
    }))
  )

  // Get blockers
  const blockers = await getTeamBlockers(params.teamId, credentials)

  return {
    capacity: {
      available: totalCapacity,
      committed: committedHours,
      utilization: committedHours / totalCapacity
    },
    velocity,
    currentSprint: {
      planned: currentSprint.plannedPoints,
      completed: currentSprint.completedPoints,
      remaining: currentSprint.plannedPoints - currentSprint.completedPoints
    },
    members: memberWorkloads,
    blockers
  }
}
```

---

## User Stories & Tasks

### Story 1: Capacity Overview
**As a** manager, **I want to** see team capacity utilization **So that** I can balance workload

**Tasks**:
- [ ] Create capacity-widget.tsx with progress bar
- [ ] Implement getTeamMetrics API
- [ ] Show available vs committed hours
- [ ] Color code utilization (green <80%, yellow 80-100%, red >100%)
- [ ] Add team member breakdown

**Acceptance Criteria**:
- Shows team capacity as percentage
- Lists each member with their workload
- Highlights over-allocated members

### Story 2: Velocity Tracking
**As a** manager, **I want to** see velocity trends **So that** I can predict capacity

**Tasks**:
- [ ] Create velocity-chart.tsx using Chart.js
- [ ] Query last 6 sprints data
- [ ] Display bar chart with trend line
- [ ] Show average velocity
- [ ] Add sprint labels on hover

**Acceptance Criteria**:
- Chart shows last 6 sprints
- Trend line indicates direction
- Average velocity displayed

### Story 3: Sprint Progress
**As a** manager, **I want to** see burndown chart **So that** I can track sprint health

**Tasks**:
- [ ] Create burndown-chart.tsx
- [ ] Calculate ideal burndown line
- [ ] Plot actual progress
- [ ] Highlight current day
- [ ] Show projected completion date

**Acceptance Criteria**:
- Ideal and actual lines visible
- Current day marker shown
- Projection indicates on-track status

### Story 4: Blocker Management
**As a** manager, **I want to** see all team blockers **So that** I can resolve them

**Tasks**:
- [ ] Create blockers-list.tsx
- [ ] Query blockers for team tasks
- [ ] Sort by severity
- [ ] Add quick-resolve actions
- [ ] Show blocker age

**Acceptance Criteria**:
- All blockers listed by severity
- Can mark blocker as resolved
- Shows how long blocked

---

## Implementation Notes

```typescript
// Capacity calculation
function calculateUtilization(available: number, committed: number): {
  percentage: number
  status: 'healthy' | 'warning' | 'over'
} {
  const percentage = (committed / available) * 100

  return {
    percentage,
    status: percentage < 80 ? 'healthy' : percentage <= 100 ? 'warning' : 'over'
  }
}

// Velocity chart with Recharts
import { BarChart, Bar, XAxis, YAxis, Tooltip, Line } from 'recharts'

function VelocityChart({ data }: { data: Array<{ sprint: string, points: number }> }) {
  const average = data.reduce((sum, d) => sum + d.points, 0) / data.length

  return (
    <BarChart data={data}>
      <XAxis dataKey="sprint" />
      <YAxis />
      <Tooltip />
      <Bar dataKey="points" fill="#3b82f6" />
      <Line type="monotone" dataKey={() => average} stroke="#10b981" />
    </BarChart>
  )
}
```

---

## Testing

```typescript
describe('Team Dashboard', () => {
  it('displays team capacity', async () => {
    render(<TeamDashboard teamId="team-1" />)

    await waitFor(() => {
      expect(screen.getByText(/75% utilized/i)).toBeInTheDocument()
    })
  })

  it('shows over-allocation warning', () => {
    const metrics = { capacity: { utilization: 1.2 } }
    render(<CapacityWidget metrics={metrics} />)

    expect(screen.getByText(/over-allocated/i)).toBeInTheDocument()
  })
})
```

---

**Status**: Ready for Implementation
**Sprint**: Phase 4, Week 1
