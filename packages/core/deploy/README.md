# Core Deploy Package - CRUD Services & Management Interface

## Overview

Complete CRUD operations and management interfaces for all core database tables, built on top of the CaptifyClient API. This deploy package provides a data-driven administration interface for platform management.

## Services Created

### OrganizationService

- **Table**: `core-Organization`
- **Operations**: Create, Read, Update, Delete, List
- **Special Methods**:
  - `getOrganizationByDomain(domain)` - Find organization by domain
  - `listOrganizations(params)` - List with filtering options

### UserService

- **Table**: `core-User`
- **Operations**: Create, Read, Update, Delete, List
- **Special Methods**:
  - `getUserByEmail(email)` - Find user by email
  - `updateUserStatus(userId, status)` - Change user status
  - `updateUserRole(userId, role)` - Change user role
  - `getUsersByOrganization(orgId)` - Get users by organization
  - `listUsers(params)` - Filter by orgId, status, role

### UserRoleService

- **Table**: `core-UserRole`
- **Operations**: Create, Read, Update, Delete, List
- **Special Methods**:
  - `getRoleByName(name)` - Find role by name
  - `addPermissionToRole(roleId, permission)` - Add permission to role
  - `removePermissionFromRole(roleId, permission)` - Remove permission
  - `setRolePermissions(roleId, permissions)` - Set all permissions

### UserStateService

- **Table**: `core-UserState`
- **Operations**: Create, Read, Update, Delete
- **Special Methods**:
  - `getUserStateByUserId(userId)` - Get state by user ID
  - `addFavoriteApp(userStateId, appId)` - Manage favorite apps
  - `addPinnedApp(userStateId, appId)` - Manage pinned apps
  - `updateAppDisplayOrder(userStateId, appId, order)` - App ordering
  - `updateUserPreferences(userStateId, preferences)` - Theme, language, timezone
  - `recordAppAccess(userStateId, appId)` - Track app usage
  - `getUserStatesByOrganization(orgId)` - Organization-scoped states

## Management Pages Created

### Dashboard (`/`)

- **Real-time Statistics**: Organization count, user counts by status, role counts
- **Activity Feed**: Based on actual data from services
- **Health Monitoring**: System status overview
- **Data Source**: Uses all services to aggregate real platform statistics

### Organizations Page (`/organizations`)

- **Full CRUD Interface**: List, create, edit, delete organizations
- **Search & Filter**: By name, domain, status
- **Real-time Data**: Uses OrganizationService for all operations
- **Status Management**: Active, inactive, trial, etc.

### Users Page (`/users`)

- **Complete User Management**: List, create, edit, delete users
- **Advanced Filtering**: By status (active/pending/suspended), role (admin/member/viewer)
- **Search Functionality**: By email and name
- **Status Updates**: Quick status and role changes
- **Organization Scoping**: Filter users by organization

### Roles & Permissions Page (`/roles`)

- **Role Management**: Create, edit, delete roles
- **Permission System**: Add/remove individual permissions
- **Search**: Find roles by name
- **Permission Categories**: Organized by platform, organization, user management
- **Visual Interface**: Shows permission counts and samples

## Architecture Features

### CoreServices Registry

- **Centralized Access**: Single point for all services
- **Session Management**: Automatic session handling across services
- **Lazy Loading**: Services instantiated on first use
- **Type Safety**: Full TypeScript support

### CaptifyClient Integration

- **Unified API**: All services use the same client interface
- **Authentication**: Automatic session handling via NextAuth
- **Error Handling**: Consistent error responses across all operations
- **Type-safe Requests**: Strong typing for all database operations

### Database Operations

- **Table Naming**: Consistent `core-{TableName}` pattern
- **Primary Keys**: UUID-based with crypto.randomUUID()
- **Audit Fields**: Automatic createdAt/updatedAt management
- **Filtering**: Advanced query support with DynamoDB expressions

## Usage Examples

```typescript
import { CoreServices } from "@captify/core/deploy";

// Initialize with session
const coreServices = new CoreServices(session);

// Organization management
const org = await coreServices.organizations.createOrganization({
  name: "Acme Corp",
  displayName: "Acme Corporation",
  domain: "acme.com",
  status: "active",
  subscriptionTier: "enterprise",
  settings: {
    maxUsers: 100,
    maxApplications: 10,
    allowCustomApps: true,
    requireApproval: false,
  },
});

// User management
const user = await coreServices.users.createUser({
  email: "john@acme.com",
  name: "John Doe",
  orgId: org.orgId,
  status: "active",
  role: "admin",
});

// Role management
const role = await coreServices.roles.createRole({
  name: "Organization Admin",
  description: "Full access to organization management",
  permissions: [
    "organizations.read",
    "organizations.write",
    "users.read",
    "users.write",
  ],
});
```

## Next Steps for Installation

The deploy package is now ready for installation. When you install the core package, it will:

1. Create 4 production DynamoDB tables:

   - `core-Organization`
   - `core-User`
   - `core-UserRole`
   - `core-UserState`

2. Register the application with slug "core" (corrected from "admin")

3. Provide access to the admin interface at `/core` route

4. Enable complete platform administration with real data integration

All services are built on the CaptifyClient interface and will automatically work with your AWS DynamoDB setup through the unified API endpoint.
