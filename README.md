# @captify-io/platform

Core components, utilities, and services for the Captify platform.

## Installation

```bash
npm install @captify-io/platform
```

## Usage

### Authentication

```typescript
import { auth, signIn, signOut } from '@captify-io/platform/auth'

// Get current session
const session = await auth()

// Sign in
await signIn('cognito')

// Sign out  
await signOut()
```

### API Client

```typescript
import { apiClient, createApiClient } from '@captify-io/platform/api'

// Use default client
const response = await apiClient.run({
  service: 'dynamo',
  operation: 'query',
  table: 'Users',
  data: { ... }
})

// Create custom client
const client = createApiClient()
```

### Utilities

```typescript
import { cn } from '@captify-io/platform/utils'

// Combine class names
const className = cn('base-class', conditionalClass && 'conditional-class')
```

### UI Components

```typescript
import { Button, Card, Input } from '@captify-io/platform/ui'

function MyComponent() {
  return (
    <Card>
      <Input placeholder="Enter text" />
      <Button>Submit</Button>
    </Card>
  )
}
```

### Theme Components

```typescript
import { ThemeToggle } from '@captify-io/platform/theme'

function App() {
  return (
    <div>
      <ThemeToggle />
    </div>
  )
}
```

## Available Exports

### Core Libraries
- `@captify-io/platform/auth` - Authentication utilities
- `@captify-io/platform/api` - API client and utilities
- `@captify-io/platform/utils` - Common utilities and helpers

### Components
- `@captify-io/platform/ui` - UI component library
- `@captify-io/platform/theme` - Theme-related components

## Peer Dependencies

This package requires the following peer dependencies:

- React 18+ or 19+
- Next.js 14+ or 15+
- NextAuth 5+
- Tailwind CSS (for styling)

## Development

This package is part of the Captify platform monorepo. The source code serves dual purposes:

1. **Application**: The main Captify platform application
2. **Package**: Distributable components for external applications

### Building

```bash
# Build both app and package
npm run build

# Build only the app
npm run build:app

# Build only the package
npm run build:package

# Watch mode for package development
npm run build:dev
```

## License

Proprietary - All rights reserved