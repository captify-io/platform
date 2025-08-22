# @captify/core

The core package provides essential utilities, components, hooks, and authentication for all Captify applications. This is the foundation package that all other Captify packages depend on.

## Package Overview

This package contains:

- **API Client**: Centralized client for accessing all Captify APIs and AWS services
- **Authentication**: NextAuth.js integration with AWS Cognito
- **Components**: Reusable UI components built with shadcn/ui
- **Hooks**: Custom React hooks for common functionality
- **Types**: TypeScript definitions for the entire platform
- **Utils**: Utility functions and validation helpers

## Installation

```bash
npm install @captify/core
```

## Usage

### API Client (Required for all AWS service access)

**Ground Rule #1**: All applications MUST use `@captify/core/api/client` for accessing APIs and AWS services.

```typescript
import { CaptifyClient } from "@captify/core/api/client";

// Initialize client with session
const client = new CaptifyClient({
  appId: "your-app-id",
  session: session, // from NextAuth
});

// Make API calls
const response = await client.get({
  service: "dynamodb",
  operation: "query",
  params: {
    TableName: "your-table",
    KeyConditionExpression: "id = :id",
  },
});
```

### TypeScript Configuration

**Ground Rule #2**: All code must use TypeScript strict mode. The package exports comprehensive types:

```typescript
import type {
  CaptifyConfig,
  UserSession,
  ApplicationData,
  MenuItemData,
} from "@captify/core";
```

### Authentication

```typescript
import { requireUserSession, getUserSession } from "@captify/core/auth";

// In API routes
const session = await requireUserSession(request);

// In components
const { data: session } = useSession();
```

### Components

```typescript
import { Button, Card, DataTable } from "@captify/core/components/ui";
import { AppLayout } from "@captify/core/components/applications";
import { ThemeProvider } from "@captify/core/components/theme";
```

### Hooks

```typescript
import {
  useDebounce,
  useLocalStorage,
  useMobile,
  useUnifiedSearch,
} from "@captify/core/hooks";
```

## Directory Structure

- `/api` - API client and types for communicating with Captify services
- `/auth` - Authentication utilities and session management
- `/components` - Reusable UI components organized by category
- `/hooks` - Custom React hooks for common functionality
- `/lib` - Utility functions and helpers
- `/context` - React context providers
- `config.ts` - Configuration types and defaults
- `types.ts` - Core TypeScript definitions
- `utils.ts` - Utility functions
- `validation.ts` - Input validation schemas

## Key Features

### Data-Driven Applications

**Ground Rule #4**: No mock or demo data - all applications are data-driven with real data sources.

### Centralized Configuration

All configuration is managed through the `CaptifyConfig` interface with environment-specific overrides.

### Three-Tier Authentication

- Tier 1: AWS Session Token (preferred)
- Tier 2: User Credentials via Cognito Identity Pool
- Tier 3: Static fallback for service accounts

### Database-Driven UI

Components automatically load configuration and menu items from DynamoDB tables.

## Development

```bash
# Build the package
npm run build

# Watch for changes during development
npm run dev

# Type checking
npm run type-check

# Linting
npm run lint
```

## TODO List

**Ground Rule #3**: All TODOs are tracked here in the README:

- [ ] Add comprehensive JSDoc documentation for all exported functions
- [ ] Implement error boundary components for better error handling
- [ ] Add unit tests for all utility functions and hooks
- [ ] Create Storybook documentation for UI components
- [ ] Implement theme customization system
- [ ] Add performance monitoring hooks
- [ ] Create migration utilities for database schema changes
- [ ] Implement client-side caching for API responses
- [ ] Add accessibility testing utilities
- [ ] Create form validation hooks with better error messaging

## Dependencies

- React 19+
- Next.js 15+
- NextAuth.js 5.0 beta
- Tailwind CSS
- shadcn/ui components

## Related Packages

- `@captify/api` - Server-side API utilities
- `@captify/core` - Application management
- `@captify/chat` - Chat and messaging functionality
