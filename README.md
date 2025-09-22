# @captify-io/platform

Core components, utilities, and services for the Captify platform.

## Installation

```bash
npm install @captify-io/platform
```

## Peer Dependencies

This package requires the following peer dependencies to be installed in your project:

```bash
npm install clsx tailwind-merge lucide-react
```

## Usage

### Components

```tsx
import { DynamicIcon } from "@captify-io/platform/components/ui";
import { Button } from "@captify-io/platform/components/ui";

// Use DynamicIcon with any lucide icon name
<DynamicIcon name="home" className="w-4 h-4" />
```

### Utilities

```tsx
import { cn } from "@captify-io/platform/lib/utils";
```

### Hooks

```tsx
import { useAuth } from "@captify-io/platform/hooks";
```

### Services

```tsx
import { api } from "@captify-io/platform/services";
```

## Available Exports

- `/components` - All React components
- `/components/ui` - UI components (includes DynamicIcon)
- `/components/theme` - Theme components
- `/lib` - Utility functions
- `/lib/auth` - Authentication utilities
- `/lib/api` - API utilities
- `/lib/utils` - General utilities
- `/hooks` - React hooks
- `/services` - Service modules
- `/types` - TypeScript type definitions

## Recent Changes

### v1.0.59
- **Authentication & Authorization Improvements**
  - Fixed TypeScript compilation errors in auth.ts with explicit parameter types
  - Implemented organization-level GitHub NODE_AUTH_TOKEN for cross-repository package access
  - Simplified user registration workflow to use DynamoDB as single source of truth
  - Added approval workflow that updates user status directly in DynamoDB
  - Enhanced authorization logic to check both Cognito groups and DynamoDB status

- **Dynamic Package Loading**
  - Removed static app registry dependency in PackagePageRouter
  - Implemented dynamic package loading with explicit imports for better reliability
  - Added proper error handling for missing packages and pages

- **GitHub Integration**
  - Configured organization-level secrets for seamless package installation across repositories
  - Removed repository-level NODE_AUTH_TOKEN secrets in favor of organization-level token
  - Verified package access and installation works correctly with new token configuration

### v1.0.55
- Fixed lucide-react/dynamic module resolution for external apps
- Added lucide-react as peer dependency
- Updated tsup configuration to properly externalize lucide-react subpath imports

## Development

```bash
# Install dependencies
npm install

# Build the package
npm run build:package

# Run development server
npm run dev
```

## License

MIT