# Captify Package Template

## Standard Package Structure

```
packages/[package-name]/
├── package.json
├── tsconfig.json
├── tsup.config.ts
├── captify.manifest.ts      # Package metadata & installation instructions
└── src/
    ├── index.ts             # Main export file
    ├── types.ts             # Type definitions
    ├── app/                 # Application components for AppLayout
    │   ├── index.tsx        # Main app component
    │   └── layout.tsx       # Optional layout wrapper
    ├── components/          # UI components used by app
    │   ├── index.ts         # Component exports
    │   └── [ComponentName].tsx
    ├── lib/                 # Shared utilities
    │   ├── index.ts         # Utility exports
    │   └── [utility].ts
    └── services/            # API/backend logic
        ├── index.ts         # Service exports
        └── [service].manifest.ts
```

## Configuration Files

### package.json Template

```json
{
  "name": "@captify/[package-name]",
  "version": "1.0.0",
  "description": "[Package Description]",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    },
    "./app": {
      "import": "./dist/app/index.js",
      "require": "./dist/app/index.cjs",
      "types": "./dist/app/index.d.ts"
    },
    "./services": {
      "import": "./dist/services/index.js",
      "require": "./dist/services/index.cjs",
      "types": "./dist/services/index.d.ts"
    }
  },
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "type-check": "tsc --noEmit",
    "postinstall": "node scripts/postinstall.js"
  }
}
```

### tsconfig.json Template

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/app/*": ["./src/app/*"],
      "@/components/*": ["./src/components/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/services/*": ["./src/services/*"],
      "@/types": ["./src/types.ts"]
    },
    "declaration": true,
    "outDir": "./dist"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### tsup.config.ts Template

```typescript
import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "app/index": "src/app/index.tsx",
    "services/index": "src/services/index.ts",
    "components/index": "src/components/index.ts",
    "lib/index": "src/lib/index.ts",
  },
  format: ["cjs", "esm"],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ["react", "react-dom", "next"],
  esbuildOptions(options) {
    options.jsx = "automatic";
  },
});
```

## Package Structure Examples

### src/index.ts (Main Export)

```typescript
// Export everything for easy access
export * from "./types";
export * from "./app";
export * from "./components";
export * from "./lib";
export * from "./services";

// Default export for the main app component
export { default } from "./app";

// Manifest for dynamic loading
export const manifest = {
  name: "[package-name]",
  version: "1.0.0",
  app: () => import("./app"),
  services: () => import("./services"),
  installer: () => import("./captify.manifest"),
};
```

### src/app/index.tsx (Main App Component)

```typescript
import { ComponentType } from 'react';

// Main app component that will be loaded by AppLayout
export default function [PackageName]App() {
  return (
    <div>
      {/* Your app content */}
    </div>
  );
}

// Export layout if needed
export { default as Layout } from './layout';

// Type for app props if needed
export interface [PackageName]AppProps {
  // Define props here
}
```

### src/services/index.ts (Service Exports)

```typescript
// Export all service manifests
export * from "./[service].manifest";

// Service registry for API router
export const services = {
  [serviceName]: () => import("./[service].manifest"),
};
```

### captify.manifest.ts (Installation Metadata)

```typescript
export interface CaptifyManifest {
  name: string;
  version: string;
  description: string;
  tables?: DynamoTableDefinition[];
  routes?: RouteDefinition[];
  dependencies?: string[];
}

export const manifest: CaptifyManifest = {
  name: "[package-name]",
  version: "1.0.0",
  description: "[Package Description]",
  tables: [
    // DynamoDB table definitions based on types.ts
  ],
  routes: [
    // API route definitions
  ],
  dependencies: [
    // Required packages
  ],
};
```
