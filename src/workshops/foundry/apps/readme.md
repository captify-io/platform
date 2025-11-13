# Application Management System

## Vision

Create a comprehensive application management system within the Captify platform that enables:

1. **Dynamic App Discovery**: All applications exist as folders in `platform/src/app/*`
2. **Centralized Access Control**: Platform layout enforces app-level permissions before rendering
3. **IAM-Backed Security**: Each app has dedicated IAM roles (technical, manager, executive, admin)
4. **Self-Service Onboarding**: Users can discover apps, request access, and get provisioned automatically
5. **Admin Control Center**: Admins manage apps, configure properties, authorize users, and control data access
6. **Multi-Tenant Ready**: Support for multiple organizations with isolated data and permissions

## Core Principles

### 1. Folder-Based App Architecture

- If a folder exists in `platform/src/app/`, it's an application
- Special folders excluded: `api/`, `auth/`, system folders
- Each app folder contains its own routes, components, and logic
- Apps are isolated from each other but share core infrastructure

### 2. Security-First Design

- **Platform Layout (`layout.tsx`)** validates user access before rendering any app
- **IAM Role Enforcement** at AWS level (DynamoDB conditions, S3 policies)
- **Least Privilege** - users only get minimum required permissions
- **Audit Trail** - all access requests, approvals, and changes logged

### 3. App Lifecycle Management

```
Discovery → Request → Approval → Provisioning → Active → Suspended → Revoked
```

- Users discover apps in catalog
- Request access with justification
- Admin approves and assigns role
- System provisions IAM credentials
- User gains active access
- Can be suspended or revoked at any time

## Current State

### Existing Apps in Platform

Based on the scan of `captify-core-app` table:

1. **MI (Materiel Insights)**
   - ID: `27ebd574-9198-4cd9-a5ae-0f61377c08ea`
   - Slug: `mi`
   - Status: `active`
   - Features: Assemblies, BOM, Compliance, Dashboard, Engineering Requests, etc.

2. **PMBook (ProgramBook)**
   - ID: `9263a481-e413-4c1c-9358-c45554ff70bd`
   - Slug: `pmbook`
   - Status: `active`
   - Features: Command Center, Roadmaps, Work Streams
   - Has dedicated Agent, Knowledge Base, S3 bucket

3. **AI Hub**
   - ID: `aihub-app-001`
   - Slug: `aihub`
   - Status: `active`
   - Features: AI ontology, strategy, outcomes, capabilities

### App Schema (from DynamoDB)

Current apps have the following structure:

```typescript
interface App {
  id: string                    // UUID or app-specific ID
  app: string                   // App identifier (slug)
  name: string                  // Display name
  slug: string                  // URL-safe identifier
  description: string           // App description
  icon: string                  // Icon name
  status: 'active' | 'inactive' | 'maintenance'
  visibility: 'internal' | 'external' | 'private'
  category: string              // App category
  version: string               // Semantic version
  order: string                 // Display order

  // Menu configuration
  menu: MenuItem[]              // Hierarchical menu structure

  // Ownership
  ownerId: string               // User or system owner
  createdBy: string
  updatedBy: string
  createdAt: string             // ISO 8601
  updatedAt: string             // ISO 8601

  // AWS Resources (optional)
  agentId?: string              // Bedrock agent ID
  agentAliasId?: string         // Bedrock agent alias
  agentArn?: string             // Bedrock agent ARN
  knowledgeBaseId?: string      // Bedrock knowledge base ID
  knowledgeBaseArn?: string     // Bedrock knowledge base ARN
  s3BucketName?: string         // S3 bucket name
  s3BucketArn?: string          // S3 bucket ARN
  identityPoolId?: string       // Cognito identity pool
  identityPoolArn?: string      // Cognito identity pool ARN

  // Custom fields
  fields: Record<string, any>   // App-specific metadata
  href?: string                 // Direct link (if external)
}
```

## Architecture

### Access Control Flow

```
User navigates to /myapp
       ↓
Platform layout.tsx intercepts
       ↓
Extract app slug from pathname
       ↓
Query core-app-member table
  - userId = current user
  - appId = app slug
       ↓
Found?  → Check status = 'active'
Not Found? → Redirect to access request page
       ↓
Load app with user's IAM role
       ↓
All AWS calls use role credentials
       ↓
AWS enforces table/S3 policies
```

### Key Components

1. **Platform Layout** (`platform/src/app/layout.tsx`)
   - Intercepts all requests
   - Validates app access
   - Loads user's app role
   - Injects credentials into session

2. **App Registry** (`core-app` table)
   - Lists all available apps
   - Configuration and metadata
   - AWS resource mappings

3. **App Membership** (`core-app-member` table)
   - User-to-app assignments
   - IAM role associations
   - Status tracking

4. **App Roles** (`core-app-role` table)
   - Role definitions per app
   - IAM policy documents
   - Permission descriptions

5. **Access Requests** (`core-app-access-request` table)
   - Pending requests queue
   - Approval workflow
   - Audit trail

### Admin Interface

**Platform Admin Panel** (`platform/src/app/admin/apps/page.tsx`)

Features:
- **App Directory**: View all apps, status, usage metrics
- **App Configuration**: Edit properties, AWS resources, menu structure
- **User Management**: See who has access, assign/revoke roles
- **Access Requests**: Approve/deny pending requests
- **IAM Setup**: Configure roles and policies
- **Data Access Control**: Define what data each app can access

## Design Decisions

### Why Folder-Based Apps?

✅ **Pros:**
- Simple to understand: if folder exists, it's an app
- No separate deployment needed
- Shared authentication and infrastructure
- Easy to add new apps
- Monorepo benefits (shared types, components)

❌ **Considerations:**
- All apps in one repo
- Need careful access control
- Build size increases with each app
- Need folder-based routing

### Why Platform Layout Access Control?

Instead of per-app authentication, the platform layout validates access:

✅ **Benefits:**
- Single point of enforcement
- User sees unified navigation
- Can switch between apps seamlessly
- Consistent UX across all apps
- Centralized session management

❌ **Tradeoffs:**
- Requires app-aware routing
- Layout logic becomes complex
- Need to handle special routes (api/, auth/)

### Implementation Strategy

**Option 1: Route Segment-Based** (Recommended)

```typescript
// In platform/src/app/layout.tsx
const pathname = usePathname()
const segments = pathname.split('/').filter(Boolean)
const appSlug = segments[0] // First segment is app

// Special routes that skip app check
const systemRoutes = ['api', 'auth', 'profile', 'admin']
if (systemRoutes.includes(appSlug)) {
  return <>{children}</>
}

// Validate app access
const appMember = await validateAppAccess(session.user.id, appSlug)
if (!appMember) {
  redirect(`/access-request?app=${appSlug}`)
}
```

**Option 2: Server Component Middleware**

```typescript
// Create a wrapper component
async function AppGuard({ children, appSlug }) {
  const session = await auth()
  const hasAccess = await checkAppAccess(session.user.id, appSlug)

  if (!hasAccess) {
    redirect(`/access-request?app=${appSlug}`)
  }

  return <>{children}</>
}

// Use in app layouts
export default function MyAppLayout({ children }) {
  return (
    <AppGuard appSlug="myapp">
      {children}
    </AppGuard>
  )
}
```

**Recommendation**: Use Option 1 for centralized control, but provide Option 2 as a helper component for app developers.

## Next Steps

See detailed plans in:
- [Features](./features/) - Feature breakdown by area
- [User Stories](./user-stories/) - User-facing scenarios
- [Plan](./plan/) - Implementation roadmap
- [Status](./status.md) - Current progress tracking

## Related Documentation

- [core/src/components/app/todo.md](../../../core/src/components/app/todo.md) - Original IAM access control design
- [platform/src/app/layout.tsx](../../../platform/src/app/layout.tsx) - Current layout implementation
- [CLAUDE.md](../../../CLAUDE.md) - Overall platform architecture

## Success Criteria

1. ✅ Admins can add new apps via UI
2. ✅ Apps appear in catalog automatically
3. ✅ Users can request access
4. ✅ Admins can approve/deny requests
5. ✅ IAM roles provisioned on approval
6. ✅ Platform layout enforces access
7. ✅ Users can only see apps they have access to
8. ✅ AWS enforces data access via IAM
9. ✅ Audit trail for all access changes
10. ✅ Zero manual infrastructure setup for new apps
