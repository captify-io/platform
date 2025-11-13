# Feature: Platform Layout Access Control

## Overview

Implement centralized access control at the platform layout level that validates user access to applications before rendering content. This enables a folder-based app architecture where any folder in `platform/src/app/` is automatically treated as an application with access control enforced by the layout.

## Requirements

### Functional Requirements

1. **App Discovery**
   - Extract app slug from URL pathname (first segment)
   - Support both path-based (`/myapp`) and subdomain-based routing
   - Identify system routes that bypass app check (`api/`, `auth/`, `admin/`, etc.)

2. **Access Validation**
   - Query `core-app-member` table for user's app membership
   - Check membership status is `active`
   - Load user's IAM role for the app
   - Cache membership data to reduce queries

3. **Access Denied Handling**
   - Redirect to access request page if no membership found
   - Show loading state while checking access
   - Preserve intended URL for post-login redirect

4. **Session Enhancement**
   - Inject app membership into session context
   - Make app role available to all components
   - Include IAM role ARN for AWS credential generation

5. **System Route Handling**
   - Bypass access check for system routes
   - Allow access to profile, admin, auth pages
   - Support Next.js internal routes (`_next/`, etc.)

### Non-Functional Requirements

1. **Performance**
   - Access check completes in <500ms
   - Membership data cached for 5 minutes
   - No unnecessary re-renders on route changes

2. **Security**
   - No client-side access control bypasses
   - Server-side validation of all memberships
   - Secure session token storage

3. **User Experience**
   - Minimal loading flicker
   - Clear error messages
   - Smooth redirects

4. **Scalability**
   - Efficient DynamoDB queries with GSIs
   - Support for 1000+ apps
   - Support for 100,000+ users

## Architecture

### Component Hierarchy

```
RootLayout (platform/src/app/layout.tsx)
  └─ SessionProvider (NextAuth)
      └─ LayoutContent
          ├─ PathRouter (extracts app slug)
          ├─ AccessValidator (checks membership)
          └─ CaptifyProvider (injects membership)
              └─ CaptifyLayout (renders UI)
                  └─ PageReadyManager
                      └─ children (app content)
```

### Access Control Flow

```
User navigates to /myapp/page
         ↓
PathRouter extracts "myapp"
         ↓
Is "myapp" a system route?
    YES → Render without check
    NO  → Continue
         ↓
AccessValidator queries DynamoDB
  - Table: captify-core-app-member
  - GSI: userId-appId-index
  - Key: userId + appId
         ↓
Membership found?
    NO  → Redirect to /access-request?app=myapp
    YES → Continue
         ↓
Membership status = 'active'?
    NO  → Show suspended/revoked message
    YES → Continue
         ↓
Load app role and IAM ARN
         ↓
Inject into CaptifyProvider
         ↓
Render app content
```

### Data Flow

```typescript
// 1. Extract app slug
const pathname = usePathname() // "/myapp/dashboard"
const appSlug = pathname.split('/')[1] // "myapp"

// 2. Check if system route
const systemRoutes = ['api', 'auth', 'admin', 'profile', '_next']
const isSystemRoute = systemRoutes.includes(appSlug)

// 3. Query membership
const membership = await fetch('/api/captify/app/check-access?appId=myapp')
// Returns:
{
  id: "member-userId-myapp",
  userId: "user-123",
  appId: "myapp",
  role: "manager",
  iamRoleArn: "arn:aws:iam::ACCOUNT:role/myapp-manager-role",
  status: "active"
}

// 4. Inject into context
<CaptifyProvider session={session} appMembership={membership}>
  {children}
</CaptifyProvider>

// 5. Access in components
const { appMembership } = useCaptify()
const canEdit = appMembership.role === 'admin' || appMembership.role === 'manager'
```

## Implementation

### Phase 1: System Route Detection

**File**: `platform/src/lib/routes.ts`

```typescript
export const SYSTEM_ROUTES = [
  'api',      // API routes
  'auth',     // Authentication pages
  'admin',    // Admin panel
  'profile',  // User profile
  '_next',    // Next.js internals
  'favicon',  // Favicon
  'robots',   // robots.txt
  'sitemap',  // sitemap.xml
] as const

export type SystemRoute = typeof SYSTEM_ROUTES[number]

export function isSystemRoute(segment: string | undefined): boolean {
  if (!segment) return true // Root is system route
  return SYSTEM_ROUTES.includes(segment as SystemRoute)
}

export function extractAppSlug(pathname: string): string | null {
  const segments = pathname.split('/').filter(Boolean)
  const firstSegment = segments[0]

  if (!firstSegment || isSystemRoute(firstSegment)) {
    return null
  }

  return firstSegment
}
```

### Phase 2: Access Check API Endpoint

**File**: `platform/src/app/api/captify/app/check-access/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getAppMembership } from '@captify-io/core/services/app'

export async function GET(request: NextRequest) {
  try {
    // Get session
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get app ID from query params
    const { searchParams } = new URL(request.url)
    const appId = searchParams.get('appId')
    if (!appId) {
      return NextResponse.json(
        { error: 'Missing appId' },
        { status: 400 }
      )
    }

    // Get AWS credentials from session
    const credentials = session.credentials

    // Query app membership
    const membership = await getAppMembership(
      session.user.id,
      appId,
      credentials
    )

    if (!membership) {
      return NextResponse.json(
        { error: 'No access to this app' },
        { status: 403 }
      )
    }

    // Check status
    if (membership.status !== 'active') {
      return NextResponse.json(
        { error: `Access ${membership.status}`, membership },
        { status: 403 }
      )
    }

    // Return membership
    return NextResponse.json(membership)
  } catch (error) {
    console.error('Error checking app access:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### Phase 3: Access Validator Component

**File**: `platform/src/components/access-validator.tsx`

```typescript
'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { extractAppSlug } from '@/lib/routes'

interface AppMembership {
  id: string
  userId: string
  appId: string
  role: string
  iamRoleArn: string
  status: string
}

export function AccessValidator({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const router = useRouter()

  const [membership, setMembership] = useState<AppMembership | null>(null)
  const [isChecking, setIsChecking] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const appSlug = extractAppSlug(pathname)

  useEffect(() => {
    // If no app slug (system route), skip check
    if (!appSlug) {
      setIsChecking(false)
      setMembership(null)
      return
    }

    // If no session, skip check (auth redirect will handle)
    if (status === 'unauthenticated' || !session?.user) {
      setIsChecking(false)
      return
    }

    // Check app access
    async function checkAccess() {
      setIsChecking(true)
      setError(null)

      try {
        const response = await fetch(
          `/api/captify/app/check-access?appId=${appSlug}`,
          { credentials: 'include' }
        )

        if (response.ok) {
          const data = await response.json()
          setMembership(data)
        } else if (response.status === 403) {
          // No access - redirect to request page
          const data = await response.json()
          if (data.membership?.status === 'pending') {
            setError('Your access request is pending approval')
          } else if (data.membership?.status === 'suspended') {
            setError('Your access has been suspended')
          } else if (data.membership?.status === 'revoked') {
            setError('Your access has been revoked')
          } else {
            // No membership at all - redirect to request page
            router.push(`/access-request?app=${appSlug}&return=${pathname}`)
          }
        } else {
          setError('Failed to check app access')
        }
      } catch (err) {
        console.error('Error checking access:', err)
        setError('Failed to check app access')
      } finally {
        setIsChecking(false)
      }
    }

    checkAccess()
  }, [appSlug, session, status, pathname, router])

  // Show loading while checking
  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Checking access...</p>
        </div>
      </div>
    )
  }

  // Show error if access denied
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-600 text-5xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/apps')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Browse Apps
          </button>
        </div>
      </div>
    )
  }

  // Pass membership to children via context
  return children
}
```

### Phase 4: Update Platform Layout

**File**: `platform/src/app/layout.tsx`

```typescript
'use client'

import React, { useEffect } from 'react'
import { SessionProvider, useSession } from 'next-auth/react'
import {
  CaptifyProvider,
  CaptifyLayout,
  useCaptify,
} from '@captify-io/core'
import { config } from '../config'
import { usePathname } from 'next/navigation'
import { AccessValidator } from '@/components/access-validator'
import { extractAppSlug, isSystemRoute } from '@/lib/routes'
import './globals.css'

function PageReadyManager({ children }: { children: React.ReactNode }) {
  const { setPageReady } = useCaptify()
  const pathname = usePathname()

  useEffect(() => {
    setPageReady()
  }, [pathname, setPageReady])

  return <>{children}</>
}

function LayoutContent({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const pathname = usePathname()

  // Check if we're on an auth page
  const isAuthPage = typeof window !== 'undefined' &&
    (window.location.pathname.startsWith('/auth/') ||
     window.location.pathname.startsWith('/api/auth/'))

  // Check if we're on a system route
  const appSlug = extractAppSlug(pathname)
  const isSystem = !appSlug

  // Handle authentication redirect
  useEffect(() => {
    if (isAuthPage || isSystem) return

    if (
      status === 'unauthenticated' ||
      (!session?.user && status !== 'loading') ||
      (session as any)?.error === 'RefreshAccessTokenError'
    ) {
      window.localStorage.clear()
      window.sessionStorage.clear()
      window.location.href = '/api/auth/signin'
    }
  }, [status, session, isAuthPage, isSystem])

  // Show nothing while loading session
  if (status === 'loading') {
    return null
  }

  // Skip app check for auth pages and system routes
  if (isAuthPage || isSystem) {
    return (
      <CaptifyProvider session={session || undefined}>
        <CaptifyLayout config={config} session={session || undefined}>
          <PageReadyManager>{children}</PageReadyManager>
        </CaptifyLayout>
      </CaptifyProvider>
    )
  }

  // Require authentication for app routes
  if (status === 'unauthenticated' || !session?.user) {
    return null
  }

  // Validate app access before rendering
  return (
    <AccessValidator>
      <CaptifyProvider session={session}>
        <CaptifyLayout config={config} session={session}>
          <PageReadyManager>{children}</PageReadyManager>
        </CaptifyLayout>
      </CaptifyProvider>
    </AccessValidator>
  )
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full">
      <body className="h-full m-0 p-0">
        <SessionProvider
          refetchInterval={0}
          refetchOnWindowFocus={false}
          refetchWhenOffline={false}
        >
          <LayoutContent>{children}</LayoutContent>
        </SessionProvider>
      </body>
    </html>
  )
}

export const dynamic = 'force-dynamic'
```

## User Stories

### US-1: User Accesses App They Have Permission For

**As a** user with access to an app
**I want** to navigate to the app seamlessly
**So that** I can start working immediately

**Acceptance Criteria**:
- ✅ User navigates to `/myapp`
- ✅ Access check completes in <500ms
- ✅ App renders with user's role injected
- ✅ No visible loading flicker
- ✅ User can access app features based on their role

### US-2: User Accesses App They Don't Have Permission For

**As a** user without access to an app
**I want** to be redirected to request access
**So that** I can request permission

**Acceptance Criteria**:
- ✅ User navigates to `/myapp`
- ✅ Access check finds no membership
- ✅ User redirected to `/access-request?app=myapp&return=/myapp`
- ✅ Access request form pre-filled with app info
- ✅ Original URL preserved for post-approval redirect

### US-3: User With Pending Request Accesses App

**As a** user with a pending access request
**I want** to see my request status
**So that** I know approval is in progress

**Acceptance Criteria**:
- ✅ User navigates to `/myapp`
- ✅ Access check finds membership with status=pending
- ✅ User sees "Your access request is pending approval" message
- ✅ User can navigate to other apps
- ✅ User cannot access app content

### US-4: User With Suspended Access Accesses App

**As a** user with suspended access
**I want** to see why I can't access the app
**So that** I can contact an administrator

**Acceptance Criteria**:
- ✅ User navigates to `/myapp`
- ✅ Access check finds membership with status=suspended
- ✅ User sees "Your access has been suspended" message
- ✅ User can browse other apps
- ✅ User shown contact information for admins

### US-5: User Accesses System Routes

**As a** user
**I want** to access profile and admin pages without app checks
**So that** I can manage my account

**Acceptance Criteria**:
- ✅ User can access `/profile` without app membership
- ✅ User can access `/admin` if admin
- ✅ User can access `/api/*` endpoints
- ✅ No unnecessary access checks performed
- ✅ System routes render immediately

## API Actions

### checkAppAccess(userId, appId)

```typescript
interface CheckAppAccessRequest {
  userId: string
  appId: string
}

interface CheckAppAccessResponse {
  membership?: AppMembership
  error?: string
}

async function checkAppAccess(
  userId: string,
  appId: string,
  credentials: AwsCredentials
): Promise<CheckAppAccessResponse> {
  // Query captify-core-app-member table
  // Use userId-appId-index for efficient lookup
  // Return membership if exists and active
  // Return error if not found or not active
}
```

### getAppMembership(userId, appId)

```typescript
async function getAppMembership(
  userId: string,
  appId: string,
  credentials: AwsCredentials
): Promise<AppMembership | null> {
  const params = {
    TableName: 'captify-core-app-member',
    IndexName: 'userId-appId-index',
    KeyConditionExpression: 'userId = :userId AND appId = :appId',
    ExpressionAttributeValues: {
      ':userId': userId,
      ':appId': appId
    }
  }

  const result = await dynamodb.query(params, credentials)
  return result.Items?.[0] || null
}
```

## Testing

### Unit Tests

```typescript
describe('Route Utilities', () => {
  test('isSystemRoute identifies system routes', () => {
    expect(isSystemRoute('api')).toBe(true)
    expect(isSystemRoute('auth')).toBe(true)
    expect(isSystemRoute('myapp')).toBe(false)
  })

  test('extractAppSlug extracts app from pathname', () => {
    expect(extractAppSlug('/myapp/dashboard')).toBe('myapp')
    expect(extractAppSlug('/api/users')).toBe(null)
    expect(extractAppSlug('/')).toBe(null)
  })
})

describe('Access Validator', () => {
  test('allows access with valid membership', async () => {
    // Mock session with user
    // Mock fetch to return active membership
    // Expect children to render
  })

  test('redirects when no membership', async () => {
    // Mock session with user
    // Mock fetch to return 403
    // Expect redirect to access-request
  })

  test('shows error for suspended membership', async () => {
    // Mock session with user
    // Mock fetch to return suspended membership
    // Expect error message shown
  })
})
```

### Integration Tests

```typescript
describe('Layout Access Control', () => {
  test('user with access sees app', async () => {
    // Create user and app membership
    // Navigate to /myapp
    // Expect app content to render
    // Expect no access check errors
  })

  test('user without access redirected', async () => {
    // Create user without membership
    // Navigate to /myapp
    // Expect redirect to /access-request?app=myapp
  })

  test('system routes accessible without membership', async () => {
    // Create user without any memberships
    // Navigate to /profile
    // Expect profile page to render
    // Navigate to /admin (if admin)
    // Expect admin page to render
  })
})
```

## Performance Considerations

### Caching Strategy

1. **Client-side cache** (React state)
   - Cache membership for current app
   - Invalidate on route change
   - 5-minute TTL

2. **Server-side cache** (Redis or in-memory)
   - Cache membership queries
   - Invalidate on membership updates
   - 5-minute TTL

3. **DynamoDB optimization**
   - Use GSI for efficient queries
   - Batch requests where possible
   - Monitor read capacity

### Monitoring

Track these metrics:
- Access check latency (p50, p95, p99)
- Cache hit rate
- Redirect rate (users without access)
- DynamoDB read units consumed

## Security Considerations

1. **Server-side validation**
   - All access checks on server
   - No client-side bypass possible
   - Session tokens validated

2. **Error handling**
   - Don't leak app existence
   - Generic error messages
   - Log detailed errors server-side

3. **Rate limiting**
   - Limit access check requests
   - Prevent abuse
   - Monitor for anomalies

## Migration Plan

1. **Phase 1**: Deploy access check API (no enforcement)
2. **Phase 2**: Deploy layout changes with feature flag
3. **Phase 3**: Enable for test users
4. **Phase 4**: Enable for one app (pmbook)
5. **Phase 5**: Enable for all apps

## Rollback Plan

If issues arise:
1. Disable feature flag (bypass access checks)
2. All users get access to all apps temporarily
3. Fix issues
4. Re-enable gradually

## Success Metrics

- ✅ Access check latency <500ms (p95)
- ✅ Cache hit rate >80%
- ✅ Zero unauthorized access incidents
- ✅ Zero false denials (users with access blocked)
- ✅ <5% redirect rate (users hitting apps they don't have access to)
