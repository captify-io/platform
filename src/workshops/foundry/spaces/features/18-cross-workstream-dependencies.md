# Feature 18: Cross-Workstream Dependencies

**Persona:** Executive
**Priority:** High
**Effort:** Medium
**Status:** Sprint 3

## Overview
Dependency mapping and visualization across workstreams to identify blockers, critical path, and cascading impacts.

## Requirements
### Functional
1. Visualize dependencies between workstreams
2. Identify critical path and blockers
3. Track dependency status (ready/waiting/blocked)
4. Alert on circular dependencies
5. Show cascading impact of delays
6. Dependency timeline view
7. Export dependency matrix

### Non-Functional
1. Support 500+ dependencies, Real-time updates, Graph loads <2s, Mobile-responsive, Interactive graph navigation

## Ontology
### Nodes Used: Workstream (from Feature 04), Feature (from Feature 02)
### New Nodes: None - uses relationships between existing entities

## Components
```typescript
// /opt/captify-apps/core/src/components/spaces/features/dependencies/dependency-graph.tsx (REUSABLE)
export function DependencyGraph({ spaceId }: { spaceId: string })

// /opt/captify-apps/core/src/components/spaces/features/dependencies/critical-path.tsx (REUSABLE)
export function CriticalPath({ dependencies }: { dependencies: Dependency[] })

// /opt/captify-apps/core/src/components/spaces/features/dependencies/dependency-matrix.tsx (REUSABLE)
export function DependencyMatrix({ workstreams }: { workstreams: Workstream[] })
```

## Actions
### 1. Get Dependencies
Query workstreams with `dependencies` field, build graph
### 2. Detect Critical Path
Use topological sort and longest path algorithm
### 3. Check Circular Dependencies
Run DFS cycle detection

## User Stories
### Story 1: Executive Views Dependency Graph
**Tasks:** Render graph, show workstreams as nodes, dependencies as edges, highlight blockers
**Acceptance:** Graph displays all dependencies clearly

### Story 2: Executive Identifies Critical Path
**Tasks:** Calculate critical path, highlight in red, show duration, list bottlenecks
**Acceptance:** Critical path accurate, delays visible

### Story 3: Alert on Circular Dependencies
**Tasks:** Detect cycles, show affected workstreams, suggest resolution
**Acceptance:** Circular dependencies caught before save

## Implementation
```typescript
function detectCriticalPath(workstreams: Workstream[]): string[] {
  // Topological sort + longest path
  const graph = buildDependencyGraph(workstreams);
  const distances = new Map<string, number>();
  const topologicalOrder = topologicalSort(graph);

  for (const node of topologicalOrder) {
    const maxDistance = Math.max(
      ...graph[node].dependencies.map(dep => distances.get(dep) || 0)
    );
    distances.set(node, maxDistance + workstreams.find(w => w.id === node)!.duration);
  }

  return findLongestPath(distances);
}
```

## Dependencies
- Feature 04 (Workstream Management), Feature 15 (Capability Roadmap)

## Status: Sprint 3, Not Started
