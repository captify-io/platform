# Client Component Usage Guide

## Using ClientOnly for Server/Client Boundaries

When you need to import client components into server components or avoid SSR issues, use the `ClientOnly` wrapper:

```tsx
import dynamic from 'next/dynamic';

// For components that should never render on the server
const ClientOnlyComponent = dynamic(
  () => import('@captify/core/components').then(mod => ({ default: mod.ClientOnly })),
  { ssr: false }
);

// Usage in a server component
export default function ServerPage() {
  return (
    <div>
      <h1>Server-rendered content</h1>
      <ClientOnlyComponent>
        <SomeClientComponent />
      </ClientOnlyComponent>
    </div>
  );
}
```

## Direct Import (Preferred)

For most cases, you can import directly since our package properly marks externals:

```tsx
import { ClientOnly } from '@captify/core/components';

function MyPage() {
  return (
    <ClientOnly fallback={<div>Loading...</div>}>
      <InteractiveComponent />
    </ClientOnly>
  );
}
```

## Package Registry

New packages should be added to the static registry in `packages/core/src/components/PackageRegistry.tsx`:

```tsx
const PACKAGE_LOADERS: Record<string, () => Promise<any>> = {
  core: () => import("../app"),
  mi: () => import("@captify/mi/app").catch(() => null),
  // Add your new package here:
  newpackage: () => import("@captify/newpackage/app").catch(() => null),
};
```

This avoids dynamic import expressions that cause webpack warnings.
