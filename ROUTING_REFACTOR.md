# Routing Refactor: Hash to Next.js App Router

## Current State (Hash-based)
- Uses `HashRouter` component with `contentMap`
- URLs look like: `/captify#strategy-objectives`
- Hash changes don't cause page refresh
- Sidebar stays mounted

## Target State (Next.js App Router)
- Use Next.js built-in routing
- URLs look like: `/captify/strategy/objectives`
- Client-side navigation (no page refresh)
- Sidebar persists in layout

## Implementation Steps

### 1. Create `/captify/layout.tsx`
This layout wraps all captify pages and keeps the sidebar persistent:

```typescript
"use client";

import { CaptifyProvider, CaptifyLayout } from "@captify-io/core/components";
import { config } from "../../config";
import { useSession } from "next-auth/react";

export default function CaptifyLayoutWrapper({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();

  return (
    <CaptifyProvider session={session}>
      <CaptifyLayout config={config} session={session}>
        {children}
      </CaptifyLayout>
    </CaptifyProvider>
  );
}
```

### 2. Update Menu Navigation
In `CaptifyLayout` or navigation component, change from hash to router:

**Before (Hash):**
```typescript
onClick={() => window.location.hash = 'strategy-objectives'}
```

**After (Next.js Router):**
```typescript
import { useRouter } from 'next/navigation';

const router = useRouter();
onClick={() => router.push('/captify/strategy/objectives')}
```

### 3. File Structure
```
src/app/
├── layout.tsx                    # Root layout (auth check)
└── captify/
    ├── layout.tsx                # Captify layout (sidebar)
    ├── page.tsx                  # Dashboard/home
    ├── insights.tsx              # → Move to insights/page.tsx
    ├── strategy/
    │   ├── page.tsx              # Strategy home/list
    │   ├── objectives.tsx        # → Move to objectives/page.tsx
    │   ├── outcomes.tsx          # → Move to outcomes/page.tsx
    │   ├── usecases.tsx          # → Move to use-cases/page.tsx
    │   ├── capabilities.tsx      # → Move to capabilities/page.tsx
    │   └── [id]/
    │       └── page.tsx          # Detail view for any entity
    └── ontology/
        ├── page.tsx              # Ontology home
        ├── data-products/
        │   └── page.tsx
        └── ...
```

### 4. Benefits

#### Client-Side Navigation (No Refresh)
Next.js automatically does client-side navigation:
- Only the content area re-renders
- Sidebar stays mounted (because it's in layout)
- Fast transitions with prefetching

#### Code Example
```typescript
// In your menu/sidebar component
import { useRouter, usePathname } from 'next/navigation';

export function MenuItem({ item }: { item: MenuItem }) {
  const router = useRouter();
  const pathname = usePathname();

  const isActive = pathname === item.href;

  return (
    <button
      onClick={() => router.push(item.href)}
      className={isActive ? 'active' : ''}
    >
      {item.label}
    </button>
  );
}
```

### 5. Migration Strategy

#### Phase 1: Dual Support (Transition Period)
Keep hash routing working while adding proper routes:
- `/captify#strategy` still works
- `/captify/strategy` also works
- Gradually update links to use router.push()

#### Phase 2: Full Migration
- Remove `HashRouter` component
- Remove `contentMap` from layout
- Update all navigation to use Next.js router

### 6. Loading States

Next.js provides loading.tsx for each route:

```typescript
// src/app/captify/strategy/loading.tsx
export default function Loading() {
  return <div>Loading strategy...</div>;
}
```

### 7. Error Boundaries

```typescript
// src/app/captify/strategy/error.tsx
'use client';

export default function Error({ error, reset }: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

## Performance Notes

- ✅ Next.js prefetches links on hover (even faster navigation)
- ✅ Automatic code splitting per route
- ✅ Shared components stay in memory (sidebar)
- ✅ Only changed content re-renders

## Backward Compatibility

To support old hash URLs during migration:

```typescript
// In root layout, add redirect logic
useEffect(() => {
  const hash = window.location.hash;
  if (hash) {
    const path = hash.replace('#', '/captify/').replace('-', '/');
    router.push(path);
  }
}, []);
```

Example:
- `#strategy-objectives` → `/captify/strategy/objectives`
- `#insights` → `/captify/insights`
