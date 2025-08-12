## applyTo: "\*\*"

**PRIORITY**: Clean up after yourself - DO NOT leave commented code or unused imports. There is only 1 .env file - do not create new ones.
**DO** look at similar patterns and reuse them in the codebase.
**DO NOT** use `any` type in TypeScript - always use specific types or interfaces.
**DO NOT** use `console.log` in production code - use proper logging mechanisms.
**DO NOT** build workarounds or "vibe code" - if you don't understand something, ask for clarification.
**DO** use `useCallback` and `useMemo` hooks appropriately to optimize performance.
**DO** use Lucide icons for consistency: `import { DynamicIcon } from 'lucide-react/dynamic';`

## Critical Architecture Patterns

### Multi-Application Platform Structure

This platform hosts multiple applications with consistent patterns:

- **Application Definition**: `scripts/apps/[slug]/config.json` defines app metadata
- **Application Deployment**: `src/app/[slug]/` contains the Next.js implementation
- **Database Registration**: `npm run install-app` registers apps in `captify-applications` table
- **Menu Items**: All navigation stored in `application-menu-items` table, never hardcoded

### Three-Tier Authentication System

Every API route MUST implement this exact pattern for AWS credentials:

```typescript
// 1. Primary authentication gate
const session = await requireUserSession(request);

// 2. Extract authentication headers
const idToken = request.headers.get("X-ID-Token");
const awsSessionToken = request.headers.get("X-AWS-Session-Token");
const userEmail = request.headers.get("X-User-Email");

// 3. Three-tier AWS credential fallback
async function getDynamoDBClient(session: UserSession) {
  // Tier 1: Session token (preferred) - from NextAuth JWT callback
  if (session.awsSessionToken && session.idToken) {
    return await createSessionTokenDynamoDBClient(session);
  }
  // Tier 2: User credentials - Cognito Identity Pool
  if (session.idToken) {
    return await createUserDynamoDBClient(session);
  }
  // Tier 3: Static fallback - service account (least preferred)
  return createStaticDynamoDBClient();
}
```

### Database-Driven UI Components

**CRITICAL**: All application menu items are stored in DynamoDB and fetched dynamically:

```typescript
// ✅ Correct - Use database-driven menus with AppLayout
import { AppLayout } from "@/components/apps/AppLayout";

// Menu items automatically loaded from application-menu-items table
<AppLayout applicationId={applicationId} showMenu={true} showChat={true}>
  {children}
</AppLayout>;
```

### Centralized API Client Usage

**NEVER** use direct `fetch()` calls to internal APIs - always use centralized API clients:

```typescript
// ✅ Correct - Use application-specific API client
import { AppApiClient } from "@/app/[app]/services/api-client";
const response = await AppApiClient.getData(params);

// ❌ Wrong - Direct fetch bypasses authentication headers
const response = await fetch("/api/app/data");
```

### DynamoDB Operations

Use appropriate DynamoDB operations based on your query patterns:

```typescript
// ✅ Preferred - Query with specific keys (most efficient)
const command = new QueryCommand({ TableName, KeyConditionExpression });

// ✅ Allowed - Get specific item
const command = new GetCommand({ TableName, Key });

// ✅ Allowed - Scan for analytical queries (use FilterExpression to limit results)
const command = new ScanCommand({
  TableName,
  FilterExpression: "attribute_exists(some_field)",
  Limit: 100, // Always limit scan results
});
```

## Development Workflows

### Application Development Lifecycle

```bash
# 1. Create application configuration
# Edit scripts/apps/[slug]/config.json

# 2. Install application to database
npm run install-app

# 3. Create Next.js implementation
# Create src/app/[slug]/ with pages and components

# 4. Start development server
npm run dev
```

### Local Development

```bash
npm run dev                    # Start Next.js with Turbopack
npm run validate              # Run lint + type-check + build
npm run install-app           # Install new application from scripts/
```

### Environment Management

```bash
npm run sync-env:windows      # Sync environment variables (Windows)
npm run deploy:windows:dev    # Deploy to dev environment (Windows)
```

## Project Structure Patterns

### Application Organization

Each application follows this structure:

- `scripts/apps/[slug]/` - Application definition and configuration
- `src/app/[slug]/` - Next.js pages and components
- `src/app/[slug]/services/api-client.ts` - Application-specific API client
- Database tables automatically created per app configuration

### Component Architecture

- **AppLayout**: Database-driven layout with dynamic menus and chat integration
- **ApplicationContext**: Provides app data throughout component tree
- **Dynamic routing**: Applications use consistent `/app/[slug]` pattern
- **Agent Integration**: Every application has an AWS Bedrock agent for AI capabilities

### Authentication Flow

- NextAuth.js with Cognito provider handles User Pool authentication
- JWT callback fetches AWS Identity Pool credentials and stores in session
- API clients automatically include required headers: `X-ID-Token`, `X-AWS-Session-Token`, `X-User-Email`
- Three-tier fallback ensures graceful degradation for database access

### Documentation Context

**Frontend work**: Update `src/context/README.md` for React components, pages, hooks
**Backend work**: Update `build/context/README.md` for AWS Lambda, SAM templates, APIs

### Key Integration Points

- **Database**: DynamoDB with user-scoped credentials via Cognito Identity Pool
- **Graph Data**: Amazon Neptune with planned IAM authentication
- **AI Services**: AWS Bedrock agents - every application has a dedicated agent for AI capabilities
- **Frontend**: Next.js 15 with App Router, shadcn/ui, Tailwind CSS
