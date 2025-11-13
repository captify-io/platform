# Application Management - Implementation Roadmap

## Overview

This roadmap outlines the step-by-step implementation plan for the Application Management System in the Captify platform.

**Goal**: Enable dynamic app discovery, IAM-backed access control, and self-service app provisioning within the platform.

**Timeline**: 6-8 weeks for full implementation

## Phase 1: Ontology & Data Model (Week 1)

### 1.1 Create Ontology Nodes

**Tasks**:
1. Create `core-app-member` ontology node
2. Create `core-app-role` ontology node
3. Update `core-app-access-request` ontology node (if needed)
4. Create ontology edges between entities

**Deliverables**:
- 3 ontology nodes in `captify-core-ontology-node` table
- Relationship edges in `captify-core-ontology-edge` table

**Acceptance Criteria**:
- ✅ Nodes visible in ontology viewer
- ✅ Schemas match specifications in todo.md
- ✅ All required indexes defined

### 1.2 Create DynamoDB Tables

**Tasks**:
1. Create `captify-core-app-member` table
2. Create `captify-core-app-role` table
3. Verify `captify-core-app-access-request` table exists
4. Create all required GSIs

**Table Schemas**:

**captify-core-app-member**:
```typescript
{
  id: string              // PK: member-{userId}-{appId}
  userId: string          // SK: userId (GSI: userId-index)
  appId: string           // SK: appId (GSI: appId-status-index)
  role: string            // technical | manager | executive | admin
  iamRoleArn: string      // AWS IAM role ARN
  status: string          // pending | active | suspended | revoked
  requestedAt: string     // ISO 8601
  approvedAt?: string     // ISO 8601
  approvedBy?: string     // Admin user ID
  managedSpaces?: string[] // Space IDs (manager role only)
  customPermissions?: object[]
  createdAt: string
  updatedAt: string
}
```

**GSIs**:
- `userId-index` (hashKey: userId)
- `appId-status-index` (hashKey: appId, rangeKey: status)
- `userId-appId-index` (hashKey: userId, rangeKey: appId)

**captify-core-app-role**:
```typescript
{
  id: string              // PK: role-{appId}-{role}
  appId: string           // SK: appId (GSI: appId-role-index)
  role: string            // SK: role
  iamRoleArn: string      // AWS IAM role ARN
  iamPolicyDocument: object // IAM policy JSON
  description?: string
  permissions?: string[]  // High-level permission list
  createdAt: string
  updatedAt: string
}
```

**GSIs**:
- `appId-role-index` (hashKey: appId, rangeKey: role)

**Acceptance Criteria**:
- ✅ Tables created with correct schemas
- ✅ GSIs created and active
- ✅ Test items can be written and queried
- ✅ Table names follow kebab-case convention

### 1.3 Create Ontology Edges

**Edges to Create**:
1. `user` --hasMany--> `appMember`
2. `app` --hasMany--> `appRole`
3. `app` --hasMany--> `appAccessRequest`
4. `appMember` --belongsTo--> `user`
5. `appMember` --belongsTo--> `app`

**Acceptance Criteria**:
- ✅ All edges created in `captify-core-ontology-edge` table
- ✅ Inverse relationships defined
- ✅ Cardinality specified

## Phase 2: IAM Setup (Week 2)

### 2.1 Define IAM Roles for First App (pmbook)

**Roles to Create**:
1. `spaces-technical-role`
2. `spaces-manager-role`
3. `spaces-executive-role`
4. `spaces-admin-role`

**IAM Policy Strategy**:
- **Technical**: Read own tasks, write own time entries
- **Manager**: Technical + read/write team tasks, approve time
- **Executive**: Manager + read all data, create objectives
- **Admin**: Full access to all tables

**Example Policy** (Technical Role):
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["dynamodb:GetItem", "dynamodb:Query"],
      "Resource": "arn:aws:dynamodb:*:*:table/captify-core-task",
      "Condition": {
        "ForAllValues:StringEquals": {
          "dynamodb:LeadingKeys": ["${cognito:sub}"]
        }
      }
    },
    {
      "Effect": "Allow",
      "Action": ["dynamodb:PutItem", "dynamodb:UpdateItem"],
      "Resource": "arn:aws:dynamodb:*:*:table/captify-core-time-entry",
      "Condition": {
        "StringEquals": {
          "dynamodb:Attributes/userId": "${cognito:sub}"
        }
      }
    }
  ]
}
```

**Tasks**:
1. Create IAM roles in AWS console or via Terraform
2. Define IAM policies for each role
3. Document policy structure
4. Test IAM role assumption

**Acceptance Criteria**:
- ✅ 4 IAM roles created in AWS
- ✅ Policies attached to roles
- ✅ Policies tested with sample Cognito user
- ✅ Role ARNs documented

### 2.2 Configure Cognito Identity Pool

**Tasks**:
1. Update Cognito identity pool role mappings
2. Configure enhanced auth flow
3. Test role assumption with different users

**Acceptance Criteria**:
- ✅ Cognito can assume IAM roles based on app membership
- ✅ Credentials returned include correct role
- ✅ Token TTL configured appropriately

### 2.3 Populate AppRole Table

**Tasks**:
1. Create app-role records for pmbook
2. Link IAM role ARNs
3. Add permission descriptions

**Example Records**:
```json
[
  {
    "id": "role-pmbook-technical",
    "appId": "pmbook",
    "role": "technical",
    "iamRoleArn": "arn:aws:iam::ACCOUNT:role/spaces-technical-role",
    "description": "Individual contributors who execute work",
    "permissions": ["read:own-tasks", "write:own-time-entries"]
  },
  {
    "id": "role-pmbook-manager",
    "appId": "pmbook",
    "role": "manager",
    "iamRoleArn": "arn:aws:iam::ACCOUNT:role/spaces-manager-role",
    "description": "Team leads who coordinate work",
    "permissions": ["read:team-tasks", "write:team-tasks", "approve:time-entries"]
  }
]
```

**Acceptance Criteria**:
- ✅ 4 app-role records created for pmbook
- ✅ All role ARNs correct
- ✅ Permissions documented

## Phase 3: Backend Services (Week 3)

### 3.1 Create Service Layer

**Services to Create** (`core/src/services/app/`):
1. `app.ts` - App CRUD operations
2. `app-member.ts` - Membership management
3. `app-role.ts` - Role management
4. `app-access-request.ts` - Request workflow

**Service Functions**:

**app.ts**:
- `getAllApps(credentials)` - List all apps
- `getApp(appId, credentials)` - Get app details
- `createApp(appData, credentials)` - Create new app
- `updateApp(appId, updates, credentials)` - Update app
- `deleteApp(appId, credentials)` - Delete app

**app-member.ts**:
- `getUserAppMemberships(userId, credentials)` - Get user's apps
- `getAppMembers(appId, credentials)` - Get app's members
- `createAppMembership(userId, appId, role, credentials)` - Grant access
- `updateAppMembership(membershipId, updates, credentials)` - Update membership
- `revokeAppMembership(membershipId, credentials)` - Revoke access

**app-access-request.ts**:
- `requestAppAccess(userId, appId, role, justification, credentials)` - Create request
- `getPendingRequests(credentials)` - Get all pending
- `getRequestsByApp(appId, credentials)` - Get app's requests
- `approveRequest(requestId, assignedRole, adminId, credentials)` - Approve
- `denyRequest(requestId, reason, adminId, credentials)` - Deny

**Acceptance Criteria**:
- ✅ All service functions implemented
- ✅ Type-safe with TypeScript interfaces
- ✅ Error handling for all edge cases
- ✅ Unit tests for all functions (80%+ coverage)

### 3.2 Create API Endpoints

**Endpoints to Create** (`platform/src/app/api/captify/app/`):

1. `POST /api/captify/app/request-access`
   - Body: `{ appId, role, justification }`
   - Returns: Request object

2. `POST /api/captify/app/approve-request`
   - Body: `{ requestId, assignedRole }`
   - Returns: Updated request + new membership

3. `POST /api/captify/app/deny-request`
   - Body: `{ requestId, reason }`
   - Returns: Updated request

4. `POST /api/captify/app/revoke-access`
   - Body: `{ membershipId }`
   - Returns: Updated membership

5. `GET /api/captify/app/my-apps`
   - Returns: User's app memberships

6. `GET /api/captify/app/members?appId={id}`
   - Returns: App members with roles

7. `POST /api/captify/app/create`
   - Body: App configuration
   - Returns: Created app

8. `PUT /api/captify/app/update`
   - Body: App updates
   - Returns: Updated app

**Acceptance Criteria**:
- ✅ All endpoints implemented
- ✅ Session validation on all endpoints
- ✅ Role-based authorization (admin only for some)
- ✅ API tests for all endpoints

## Phase 4: Platform Layout Integration (Week 4)

### 4.1 Update Platform Layout

**File**: `platform/src/app/layout.tsx`

**Changes Required**:
1. Extract app slug from pathname
2. Define system routes whitelist
3. Query app membership
4. Handle access denied
5. Inject app role into session

**Implementation**:

```typescript
// In LayoutContent component
function LayoutContent({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  // Extract app slug from pathname
  const segments = pathname.split('/').filter(Boolean);
  const appSlug = segments[0];

  // System routes that skip app check
  const systemRoutes = ['api', 'auth', 'profile', 'admin', '_next'];
  const isSystemRoute = systemRoutes.includes(appSlug) || !appSlug;

  // Check if we're on an auth page
  const isAuthPage = typeof window !== "undefined" &&
    (window.location.pathname.startsWith("/auth/") ||
     window.location.pathname.startsWith("/api/auth/"));

  // Handle session loading/errors
  useEffect(() => {
    if (isAuthPage || isSystemRoute) return;

    if (
      status === "unauthenticated" ||
      (!session?.user && status !== "loading") ||
      (session as any)?.error === "RefreshAccessTokenError"
    ) {
      window.localStorage.clear();
      window.sessionStorage.clear();
      window.location.href = "/api/auth/signin";
    }
  }, [status, session, isAuthPage, isSystemRoute]);

  // Validate app access (if not system route)
  const [appMembership, setAppMembership] = useState<AppMembership | null>(null);
  const [checkingAccess, setCheckingAccess] = useState(false);

  useEffect(() => {
    if (isSystemRoute || isAuthPage || !session?.user) return;

    async function checkAppAccess() {
      setCheckingAccess(true);
      try {
        const response = await fetch(`/api/captify/app/check-access?appId=${appSlug}`);
        if (response.ok) {
          const membership = await response.json();
          setAppMembership(membership);
        } else {
          // No access - redirect to request page
          window.location.href = `/access-request?app=${appSlug}`;
        }
      } catch (error) {
        console.error('Failed to check app access:', error);
      } finally {
        setCheckingAccess(false);
      }
    }

    checkAppAccess();
  }, [appSlug, session, isSystemRoute, isAuthPage]);

  // Show loading while checking access
  if (checkingAccess) {
    return <LoadingScreen />;
  }

  // Skip app check for system routes and auth pages
  if (isSystemRoute || isAuthPage) {
    return <>{children}</>;
  }

  // If no session, show nothing while redirecting
  if (status === "unauthenticated" || !session?.user) {
    return null;
  }

  // Render with CaptifyLayout (app access validated)
  return (
    <CaptifyProvider session={session} appMembership={appMembership}>
      <CaptifyLayout config={config} session={session}>
        <PageReadyManager>{children}</PageReadyManager>
      </CaptifyLayout>
    </CaptifyProvider>
  );
}
```

**Acceptance Criteria**:
- ✅ Layout extracts app slug correctly
- ✅ System routes bypass app check
- ✅ App access validated before rendering
- ✅ Access denied redirects to request page
- ✅ App membership injected into context
- ✅ Loading states shown appropriately

### 4.2 Create Access Request Page

**File**: `platform/src/app/access-request/page.tsx`

**Features**:
- Show app details (name, description, icon)
- Display available roles
- Justification text area
- Submit request
- Show pending request status (if already requested)

**Acceptance Criteria**:
- ✅ Page displays app information
- ✅ User can select role
- ✅ User can provide justification
- ✅ Request submitted successfully
- ✅ Pending status shown if already requested

## Phase 5: Admin Interface (Week 5)

### 5.1 Create App Admin Dashboard

**File**: `platform/src/app/admin/apps/page.tsx`

**Features**:
- List all apps with filters
- Search apps by name/slug
- View app status and usage metrics
- Quick actions (edit, view members, delete)

**Components**:
- `AppList` - Table of all apps
- `AppFilters` - Filter and search controls
- `AppCard` - App summary card
- `AppStats` - Usage metrics

**Acceptance Criteria**:
- ✅ Admins can view all apps
- ✅ Filter by status, category
- ✅ Search by name/slug
- ✅ Quick actions work correctly

### 5.2 Create App Configuration Interface

**File**: `platform/src/app/admin/apps/[id]/page.tsx`

**Features**:
- Edit app properties (name, description, icon)
- Configure menu structure
- Set AWS resources (agent, knowledge base, S3)
- View app statistics
- Delete app (with confirmation)

**Components**:
- `AppForm` - Edit app properties
- `MenuEditor` - Visual menu configuration
- `ResourceConfig` - AWS resource settings
- `AppStats` - Detailed metrics

**Acceptance Criteria**:
- ✅ Admins can edit all app properties
- ✅ Menu editor works correctly
- ✅ AWS resources can be configured
- ✅ Changes saved successfully

### 5.3 Create Member Management Interface

**File**: `platform/src/app/admin/apps/[id]/members/page.tsx`

**Features**:
- List all app members
- Filter by role, status
- Search members by name/email
- View member details
- Assign/change roles
- Suspend/revoke access
- Add members manually

**Components**:
- `MemberList` - Table of members
- `MemberFilters` - Filter controls
- `MemberForm` - Add/edit member
- `RoleSelector` - Role dropdown

**Acceptance Criteria**:
- ✅ Admins can view all members
- ✅ Filter and search work
- ✅ Roles can be changed
- ✅ Access can be revoked

### 5.4 Create Access Request Management

**File**: `platform/src/app/admin/apps/requests/page.tsx`

**Features**:
- List all pending access requests
- Filter by app, role, date
- View request details and justification
- Approve with role assignment
- Deny with reason
- Bulk actions

**Components**:
- `RequestList` - Table of requests
- `RequestFilters` - Filter controls
- `RequestDetail` - Request modal
- `ApprovalForm` - Approve/deny form

**Acceptance Criteria**:
- ✅ Admins can view all requests
- ✅ Requests can be approved
- ✅ Requests can be denied
- ✅ Email notifications sent

## Phase 6: User Interface (Week 6)

### 6.1 Create App Catalog

**File**: `platform/src/app/apps/page.tsx`

**Features**:
- Browse available apps
- Filter by category
- Search apps
- View app details
- Request access button
- Show access status (if already has access)

**Components**:
- `AppCatalog` - Grid of app cards
- `AppFilters` - Category filters
- `AppCard` - App summary with actions
- `RequestAccessDialog` - Request form

**Acceptance Criteria**:
- ✅ Users can browse all apps
- ✅ Filter and search work
- ✅ Request access works
- ✅ Access status shown correctly

### 6.2 Create My Apps Page

**File**: `platform/src/app/profile/my-apps/page.tsx`

**Features**:
- List user's app memberships
- Show role in each app
- Show access status
- Link to app
- Request role change
- Leave app (revoke own access)

**Components**:
- `MyAppsList` - List of memberships
- `AppMembershipCard` - Membership summary
- `RoleChangeRequest` - Request role change

**Acceptance Criteria**:
- ✅ Users can see all their apps
- ✅ Role displayed correctly
- ✅ Can navigate to apps
- ✅ Can request role changes

## Phase 7: Testing & Polish (Week 7-8)

### 7.1 Integration Testing

**Test Scenarios**:
1. New user requests access to app
2. Admin approves request
3. User gains access and sees app
4. Admin changes user role
5. User sees updated permissions
6. Admin revokes access
7. User loses access to app

**Acceptance Criteria**:
- ✅ All scenarios pass
- ✅ No broken states
- ✅ Data consistency maintained

### 7.2 Security Audit

**Checks**:
- IAM policies are least privilege
- No privilege escalation paths
- Session tokens secure
- API endpoints properly authorized
- SQL/NoSQL injection prevented
- XSS protection in place

**Acceptance Criteria**:
- ✅ Security review passed
- ✅ No critical vulnerabilities
- ✅ IAM policies reviewed

### 7.3 Performance Optimization

**Optimizations**:
- Cache app memberships (5-minute TTL)
- Lazy load app catalog
- Optimize DynamoDB queries
- Add pagination to member lists
- Implement request debouncing

**Acceptance Criteria**:
- ✅ Page load < 2 seconds
- ✅ No unnecessary API calls
- ✅ DynamoDB read/write units optimized

### 7.4 Documentation

**Documents to Create**:
1. **Admin Guide**: How to manage apps, approve requests, assign roles
2. **User Guide**: How to request access, use apps
3. **Developer Guide**: How to create new apps, integrate with platform
4. **API Documentation**: All endpoints with examples
5. **Security Documentation**: IAM setup, best practices

**Acceptance Criteria**:
- ✅ All guides written
- ✅ Screenshots included
- ✅ Examples provided
- ✅ Published to docs site

## Success Metrics

### Technical Metrics
- ✅ All ontology nodes created
- ✅ All DynamoDB tables created with GSIs
- ✅ All service functions implemented and tested
- ✅ All API endpoints implemented and tested
- ✅ Platform layout updated and tested
- ✅ Admin interface complete
- ✅ User interface complete

### User Metrics
- ✅ Admins can create/manage apps via UI
- ✅ Users can discover and request access to apps
- ✅ Access requests approved/denied successfully
- ✅ IAM roles provisioned automatically
- ✅ Users can only see apps they have access to
- ✅ Platform layout enforces app-level access

### Security Metrics
- ✅ IAM policies follow least privilege
- ✅ No privilege escalation possible
- ✅ All API endpoints properly authorized
- ✅ Audit trail for all access changes

## Rollout Strategy

### Phase 1: Internal Testing (Week 8)
- Deploy to staging environment
- Test with internal team
- Fix critical bugs
- Collect feedback

### Phase 2: Beta Testing (Week 9)
- Deploy to production
- Enable for one app (pmbook)
- Monitor usage and errors
- Iterate based on feedback

### Phase 3: Full Rollout (Week 10+)
- Enable for all apps
- Migrate existing users
- Full documentation
- Training sessions

## Maintenance

### Ongoing Tasks
- Monitor DynamoDB costs
- Review IAM policies quarterly
- Update documentation as needed
- Handle support requests
- Optimize performance

### Future Enhancements
- Role inheritance (admin inherits manager, etc.)
- Custom roles per app
- Temporary access grants
- Access expiration
- App usage analytics
- Audit log UI
