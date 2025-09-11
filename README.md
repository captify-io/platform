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