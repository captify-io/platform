# Feature: App Access Control

## Overview

Manage which user groups can access which applications. Configure Identity Pool assignments for apps and control access permissions at a granular level.

## Requirements

### Functional Requirements

1. **View App Access Matrix**
   - Display grid: Applications × Groups
   - Show which groups have access to each app
   - Highlight dedicated Identity Pools
   - Filter by: app, group, access type

2. **Configure App Access**
   - Assign groups to applications
   - Remove group access from apps
   - Set access type: admin, user, read-only
   - Bulk operations (assign multiple groups)

3. **Identity Pool Management**
   - Assign dedicated Identity Pool to app
   - Switch between shared/dedicated pool
   - View pool configuration (roles, policies)
   - Test pool credentials

4. **Access Rules**
   - Define conditional access rules
   - IP whitelisting per app
   - MFA requirements per app
   - Time-based access windows

5. **Access Validation**
   - Verify user has required groups
   - Check Identity Pool permissions
   - Validate IAM role policies
   - Test access before granting

### Non-Functional Requirements

1. **Performance**: Access matrix loads in <1s for 100 apps
2. **Consistency**: Changes propagate within 30s
3. **Audit**: All changes logged with admin ID
4. **Validation**: Prevent orphaned apps (no access)

## Architecture

```
Admin UI → API → DynamoDB (core-app table)
                → Cognito (user pool groups)
                → STS (Identity Pool validation)
                → IAM (role policy checks)
```

## Data Model

### DynamoDB Table: `core-app`

```typescript
interface App {
  id: string;                    // PK
  name: string;
  slug: string;                  // GSI

  // Access Control
  requiredGroups: string[];      // Groups that can access this app
  adminGroups: string[];         // Groups with admin access

  // Identity Pool
  identityPoolId?: string;       // Dedicated pool (optional)
  useSharedPool: boolean;        // Use platform pool (default: true)
  poolConfig?: {
    authenticatedRole: string;   // ARN
    unauthenticatedRole?: string; // ARN
    customPolicies?: string[];   // Policy ARNs
  };

  // Access Rules
  accessRules?: {
    ipWhitelist?: string[];      // CIDR blocks
    requireMFA?: boolean;
    allowedHours?: {             // Time-based access
      start: number;             // Hour 0-23
      end: number;
    };
  };

  // Metadata
  active: boolean;
  createdAt: string;
  updatedAt: string;
  updatedBy: string;             // Admin user ID
}
```

## API Actions

### getAppAccess(appId: string)
- **Purpose**: Get app access configuration
- **Input**: `{ appId }`
- **Output**: `{ app: App, effectiveGroups: Group[], poolInfo: IdentityPoolInfo }`

### updateAppAccess(appId: string, data: AccessUpdate)
- **Purpose**: Update app access settings
- **Input**: `{ appId, requiredGroups: string[], adminGroups: string[], accessRules?: AccessRules }`
- **Output**: `{ app: App }`
- **Side Effects**: Audit log

### assignIdentityPool(appId: string, poolId: string)
- **Purpose**: Assign dedicated Identity Pool to app
- **Input**: `{ appId, poolId, poolConfig: PoolConfig }`
- **Output**: `{ app: App }`
- **Validation**: Pool exists, roles valid
- **Side Effects**: Update app config, audit log

### removeIdentityPool(appId: string)
- **Purpose**: Switch app back to shared pool
- **Input**: `{ appId }`
- **Output**: `{ app: App }`
- **Side Effects**: Audit log

### validateAccess(userId: string, appId: string)
- **Purpose**: Test if user can access app
- **Input**: `{ userId, appId }`
- **Output**: `{ allowed: boolean, reason?: string, groups: string[], pool: string }`

### getAccessMatrix()
- **Purpose**: Get full access matrix
- **Input**: `{ filter?: { app?: string, group?: string } }`
- **Output**: `{ matrix: { [appId]: { groups: string[], pool: string } } }`

## UI/UX

### Access Matrix View
- **Layout**: Table with apps as rows, groups as columns
- **Cells**: Checkboxes for access (checked = group can access)
- **Row Actions**: Edit app, Configure pool, View details
- **Bulk Actions**: Assign group to multiple apps

### App Access Detail Modal
- **Tabs**:
  1. **Groups**: Checkboxes for required/admin groups
  2. **Identity Pool**: Select shared/dedicated, configure roles
  3. **Access Rules**: IP whitelist, MFA, time windows
- **Actions**: Save, Test Access, Cancel

### Identity Pool Configuration
- **Pool Type**: Radio buttons (Shared Platform Pool / Dedicated Pool)
- **If Dedicated**:
  - Pool ID input
  - Authenticated Role ARN
  - Custom Policies (multi-select)
  - Test Credentials button
- **If Shared**: Show platform pool info (read-only)

### Access Validation Tool
- **Inputs**: User (autocomplete), App (dropdown)
- **Output**:
  - ✅ Allowed / ❌ Denied
  - Groups: [list of user's groups]
  - Required: [list of app's required groups]
  - Pool: shared-platform-pool or app-specific-pool

## AWS Integration

### Cognito User Pool Groups
```typescript
// Get user's groups
const groups = await cognito.adminListGroupsForUser({
  UserPoolId: process.env.COGNITO_USER_POOL_ID,
  Username: userId
});

// Get group members
const members = await cognito.listUsersInGroup({
  UserPoolId: process.env.COGNITO_USER_POOL_ID,
  GroupName: groupName
});
```

### STS Identity Pool Validation
```typescript
// Get credentials for pool
const credentials = await sts.getCredentialsForIdentity({
  IdentityId: identityId,
  Logins: {
    [`cognito-idp.${region}.amazonaws.com/${userPoolId}`]: token
  }
});

// Test pool permissions
const policies = await iam.listAttachedRolePolicies({
  RoleName: authenticatedRole
});
```

### IAM Role Policy Checks
```typescript
// Get role policies
const policies = await iam.getRolePolicy({
  RoleName: roleName,
  PolicyName: policyName
});

// Simulate policy
const result = await iam.simulatePrincipalPolicy({
  PolicySourceArn: roleArn,
  ActionNames: ['dynamodb:GetItem', 's3:GetObject'],
  ResourceArns: ['arn:aws:dynamodb:*:*:table/captify-*']
});
```

## Security Considerations

- Only captify-admin can modify app access
- Prevent removing all groups from an app (orphaned app)
- Validate Identity Pool exists before assignment
- Test credentials before saving pool config
- Audit all access changes
- Prevent self-removal from admin groups

## Testing

### Test Scenarios
1. Admin assigns group to app → Verify users in group can access
2. Admin removes group from app → Verify users in group denied
3. Admin assigns dedicated pool → Verify app uses new pool
4. Admin removes dedicated pool → Verify app uses shared pool
5. Validation tool → Verify correct allowed/denied results
6. IP whitelist → Verify IP-based access control
7. MFA requirement → Verify MFA enforced

## Dependencies

- User Management (#1)
- Group Management (#2)
- Application Management (#3)
- AWS Cognito User Pool
- AWS STS (Identity Pools)
- AWS IAM (role policies)

## Implementation Notes

### Shared vs Dedicated Pool Decision Tree
```
Is app using sensitive data? (PII, PHI, financial)
  └─ YES → Dedicated Pool
     └─ Reason: Data isolation, compliance, audit

Does app need custom IAM permissions?
  └─ YES → Dedicated Pool
     └─ Reason: Fine-grained access control

Does app need cost tracking?
  └─ YES → Dedicated Pool
     └─ Reason: CloudWatch billing by pool

Default: Shared Platform Pool
```

### Access Check Flow
```
1. User requests app access
2. Get user's Cognito groups
3. Check app's requiredGroups
4. Verify intersection (user has required group)
5. Check access rules (IP, MFA, time)
6. Get credentials from assigned Identity Pool
7. Grant/Deny access
```

---

**Feature ID**: #5
**Priority**: P0
**Story Points**: 5
**Status**: Not Started
