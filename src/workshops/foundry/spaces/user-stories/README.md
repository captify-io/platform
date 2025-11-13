# Captify Spaces - User Stories for Implementation

## Overview

This directory contains detailed user stories derived from the 43 feature specifications in [`../features/`](../features/). Each user story is designed to be implemented by an AI agent and includes:

1. **User Story Format**: Clear "As a [persona], I want [goal], so that [benefit]"
2. **Implementation Tasks**: Step-by-step breakdown of technical work required
3. **Ontology References**: Links to required entities, relationships, and tables
4. **Acceptance Criteria**: Testable conditions for completion
5. **Dependencies**: Prerequisites and integration points
6. **API Actions**: Required service operations and data flows

## Document Structure

User stories are organized by feature category and priority:

### Priority 0 (P0) - Critical Foundation
Must be implemented first as they provide core functionality:

1. [01-home-dashboard.md](./01-home-dashboard.md) - Technical user's task view
2. [02-ai-daily-checkin.md](./02-ai-daily-checkin.md) - AI-powered daily standup
3. [03-task-board.md](./03-task-board.md) - Kanban board for task management
4. [04-time-tracking.md](./04-time-tracking.md) - Time entry and timer
5. [05-quick-task-entry.md](./05-quick-task-entry.md) - Command palette task creation

### Priority 1 (P1) - Core Features
Essential features for MVP:

6. [06-activity-stream.md](./06-activity-stream.md) - Team activity feed
7. [07-team-dashboard.md](./07-team-dashboard.md) - Manager team view
8. [08-request-inbox.md](./08-request-inbox.md) - Work request triage
9. [09-backlog-management.md](./09-backlog-management.md) - Backlog prioritization
10. [10-sprint-planning.md](./10-sprint-planning.md) - Sprint setup and planning
11. [11-team-board.md](./11-team-board.md) - Team sprint board
12. [12-capacity-planning.md](./12-capacity-planning.md) - Resource allocation

### Priority 2 (P2) - Management Features
Features for managers and executives:

13. [13-time-approval.md](./13-time-approval.md) - Timesheet approval workflow
14. [14-portfolio-dashboard.md](./14-portfolio-dashboard.md) - Executive portfolio view
15. [15-capability-roadmap.md](./15-capability-roadmap.md) - Strategic roadmap
16. [16-objective-tracking.md](./16-objective-tracking.md) - OKR management
17. [17-investment-allocation.md](./17-investment-allocation.md) - Budget allocation
18. [18-cross-workstream-dependencies.md](./18-cross-workstream-dependencies.md) - Dependency mapping
19. [19-risk-issues-management.md](./19-risk-issues-management.md) - Risk tracking

### Priority 3 (P3) - Reporting & Financial
Reporting and financial tracking:

20. [20-strategic-reports.md](./20-strategic-reports.md) - Automated reporting
21. [21-financial-dashboard.md](./21-financial-dashboard.md) - Financial overview
22. [22-clin-burn-rate.md](./22-clin-burn-rate.md) - Contract burn tracking
23. [23-depletion-forecast.md](./23-depletion-forecast.md) - Funding forecasts
24. [24-deliverable-tracking.md](./24-deliverable-tracking.md) - Deliverable status
25. [25-cost-allocation.md](./25-cost-allocation.md) - Cost distribution
26. [26-budget-actual-analysis.md](./26-budget-actual-analysis.md) - Budget variance
27. [27-financial-exports.md](./27-financial-exports.md) - Financial data export

### Priority 4 (P4) - Configuration & Admin
Configuration and administrative features:

28. [28-spaces-management.md](./28-spaces-management.md) - Space CRUD operations
29. [29-space-detail.md](./29-space-detail.md) - Space detail view
30. [30-feature-detail.md](./30-feature-detail.md) - Feature detail view
31. [31-workstream-view.md](./31-workstream-view.md) - Workstream management
32. [32-clin-management.md](./32-clin-management.md) - CLIN administration
33. [33-contract-management.md](./33-contract-management.md) - Contract admin

### Priority 5 (P5) - Platform Features
Platform-wide features:

34. [34-notifications-system.md](./34-notifications-system.md) - Notification center
35. [35-documents-integration.md](./35-documents-integration.md) - Document management
36. [36-ai-request-intake.md](./36-ai-request-intake.md) - AI request routing
37. [37-search.md](./37-search.md) - Global search
38. [38-chat-assistant.md](./38-chat-assistant.md) - AI chat assistant
39. [39-settings-preferences.md](./39-settings-preferences.md) - User preferences
40. [40-help-system.md](./40-help-system.md) - Help and documentation
41. [41-mobile-app.md](./41-mobile-app.md) - Mobile application
42. [42-admin-panel.md](./42-admin-panel.md) - System administration

## Ontology-Driven Implementation

All user stories reference the comprehensive ontology defined in [`../features/ontology.md`](../features/ontology.md). This ontology-driven approach ensures:

### Data Model Consistency
- **21 Core Entities**: Task, Space, User, Team, Sprint, Feature, Workstream, etc.
- **50+ Relationships**: Complete edge definitions with cardinality rules
- **46 Global Secondary Indexes**: Optimized query patterns for all access patterns

### Table Naming Conventions
User stories use consistent naming:
- **Node IDs**: `{app}-{typeCamelCase}` (e.g., `core-task`, `core-changeRequest`)
- **API Requests**: Short format `{app}-{type}` (e.g., `core-task`, `core-user`)
- **Full Table Names**: `{schema}-{app}-{type-kebab-case}` (e.g., `captify-core-task`)

### Service Operations
All API calls follow the pattern:
```typescript
const response = await apiClient.run({
  service: 'platform.dynamodb',
  operation: 'query',
  table: 'core-task',  // Short format, resolved via ontology
  data: { /* operation params */ }
})
```

## Implementation Workflow for AI Agents

Each user story is designed for autonomous implementation by AI agents. The workflow:

### 1. Read User Story
- Understand persona, goal, and benefit
- Review acceptance criteria
- Identify dependencies

### 2. Review Ontology Requirements
- Check required entities exist in ontology
- Verify indexes are created
- Understand relationships

### 3. Implement Components
- Reuse existing Captify UI components
- Create new components following naming conventions
- Use kebab-case for file names
- Export in PascalCase

### 4. Implement Service Operations
- Define API actions with TypeScript interfaces
- Implement DynamoDB operations
- Add error handling and validation
- Write integration tests

### 5. Build UI Integration
- Connect components to API hooks
- Implement optimistic updates
- Add loading and error states
- Ensure accessibility (WCAG 2.1 AA)

### 6. Test Implementation
- Write unit tests for components
- Write integration tests for API operations
- Test keyboard navigation
- Verify mobile responsiveness

### 7. Document Completion
- Update README if needed
- Add JSDoc comments
- Document any deviations from spec

## Naming Conventions for Components

Following [`CLAUDE.md`](../../../../CLAUDE.md) guidelines:

### File Names (kebab-case)
```
✅ components/agent/panels/chat/message-item.tsx
✅ components/agent/layouts/agent.tsx
❌ components/agent/panels/chat/ChatMessageItem.tsx
❌ components/AgentLayout.tsx
```

### Component Exports (PascalCase)
```typescript
// File: message-item.tsx
export function MessageItem() { ... }

// File: agent.tsx
export function Agent() { ... }
```

### Folder Structure
```
components/spaces/
├── panels/
│   ├── technical/       # Technical user panels
│   ├── manager/         # Manager panels
│   └── executive/       # Executive panels
├── items/               # Reusable item components
├── dialogs/             # Modal dialogs
├── widgets/             # Widget components
└── layouts/             # Layout components
```

## Dependency Graph

### Foundation Layer (Must Implement First)
```
Task Entity → Time Entry → User → Space
     ↓
Task Board → Quick Entry → Daily Checkin
```

### Team Management Layer
```
Sprint → Team Board → Capacity Planning
  ↓
Backlog → Sprint Planning → Time Approval
```

### Executive Layer
```
Objective → Portfolio Dashboard → Strategic Reports
  ↓
Roadmap → Investment Allocation → Risk Management
```

### Financial Layer
```
Contract → CLIN → Deliverable
   ↓
Burn Rate → Depletion Forecast → Budget Analysis
```

## Common Patterns

### Optimistic Updates
All mutations use optimistic updates:
```typescript
const mutation = useMutation({
  mutationFn: async (data) => apiClient.run({ ... }),
  onMutate: async (variables) => {
    // Cancel outgoing queries
    await queryClient.cancelQueries(['tasks'])

    // Snapshot current state
    const previous = queryClient.getQueryData(['tasks'])

    // Optimistically update
    queryClient.setQueryData(['tasks'], (old) => updateOptimistically(old, variables))

    return { previous }
  },
  onError: (err, variables, context) => {
    // Rollback on error
    queryClient.setQueryData(['tasks'], context.previous)
  }
})
```

### Keyboard Navigation
All interactive components support keyboard:
```typescript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown') navigate('down')
    if (e.key === 'ArrowUp') navigate('up')
    if (e.key === 'Enter') select()
    if (e.key === 'Escape') cancel()
  }
  window.addEventListener('keydown', handleKeyDown)
  return () => window.removeEventListener('keydown', handleKeyDown)
}, [])
```

### Loading States
All data fetching shows skeleton loaders:
```typescript
const { data, isLoading } = useQuery(['tasks'], fetchTasks)

if (isLoading) return <Skeleton count={5} />
if (!data) return <EmptyState />

return <TaskList tasks={data} />
```

## Testing Requirements

### Unit Tests
- Component rendering
- User interactions
- State management
- Utility functions

### Integration Tests
- API operations
- DynamoDB queries
- Optimistic updates
- Error handling

### Accessibility Tests
- Keyboard navigation
- Screen reader support
- ARIA labels
- Focus management

## Getting Started

1. **Review Ontology**: Start with [`../features/ontology.md`](../features/ontology.md)
2. **Pick Priority 0 Story**: Implement foundation features first
3. **Check Dependencies**: Ensure prerequisites are complete
4. **Read User Story**: Understand requirements thoroughly
5. **Implement Incrementally**: Complete one task at a time
6. **Test Continuously**: Write tests as you implement
7. **Document Changes**: Update docs for deviations

## Questions or Issues?

- **Ontology Questions**: See [`../features/ontology.md`](../features/ontology.md)
- **Architecture Questions**: See [`CLAUDE.md`](../../../../CLAUDE.md)
- **API Patterns**: See [`core/lib/api.ts`](../../../../lib/api.ts)
- **Component Patterns**: See [`core/components/ui/`](../../../../components/ui/)

---

**Last Updated**: 2025-11-01
**Total Features**: 43
**Total User Stories**: ~150+ (distributed across features)
**Implementation Status**: Ready for Development
