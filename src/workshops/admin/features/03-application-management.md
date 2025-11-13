# Feature: Application Management

## Overview

Enable administrators to manage platform applications, their configurations, and optionally assign dedicated AWS Cognito Identity Pools for enhanced security and resource isolation.

## Requirements

### Functional Requirements

1. **List Applications**
   - Display all registered applications from app registry
   - Show: name, slug, version, category, visibility, status
   - Filter by category, visibility, active status
   - Search by name or slug
   - Show assigned Identity Pool (if any)

2. **View Application Details**
   - Display full application config
   - Show menu items and features
   - Display validation status and errors
   - Show Identity Pool assignment
   - Show member count and active users
   - Display health status (running/stopped)

3. **Update Application Config**
   - Edit application metadata (name, description, icon, color)
   - Update visibility (public, internal, private)
   - Modify menu items
   - Enable/disable application
   - Validate config before saving

4. **Identity Pool Management**
   - **Option 1**: Use shared platform Identity Pool (default)
   - **Option 2**: Create dedicated Identity Pool for app
   - View Identity Pool details (ID, ARN, authenticated/unauthenticated roles)
   - Assign/unassign Identity Pool to application
   - View Identity Pool usage metrics

5. **App Access Control**
   - View which groups can access application
   - Add/remove group access
   - Set default groups for new users
   - Configure app-specific permissions

6. **App Health Monitoring**
   - Check if app is running (PM2 status)
   - View app logs (last 50 lines)
   - Restart application
   - View resource usage (CPU, memory)

### Non-Functional Requirements

1. **Performance**: App list loads in <500ms
2. **Security**: Config validation prevents malformed configs
3. **Reliability**: Config changes don't break running apps
4. **Audit**: All config changes logged

## Architecture

```
Admin UI → App Registry Service → File System (config.json files)
        → Cognito Identity → AWS Cognito Identity Pools
        → PM2 Service → Process Manager
```

### Identity Pool Architecture

```
┌─────────────────────────────────────────────────────────┐
│              Captify Platform                           │
└─────────────────────────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
┌───────▼──────┐      ┌─────────▼────────┐
│  Shared      │      │  App-Specific    │
│  Identity    │      │  Identity Pools  │
│  Pool        │      │  (Optional)      │
│              │      │                  │
│ - Platform   │      │ - pmbook-pool    │
│ - Default    │      │ - aihub-pool     │
│   apps       │      │ - mi-pool        │
└──────────────┘      └──────────────────┘
```

**Benefits of Dedicated Identity Pools:**
- **Resource Isolation**: Separate AWS credentials per app
- **Cost Tracking**: Attribute AWS costs to specific applications
- **Security**: Limit blast radius if credentials compromised
- **Compliance**: Meet regulatory requirements for data isolation
- **Custom Policies**: Fine-grained IAM policies per app

## Data Model

### Application Config (config.json)

```typescript
interface ApplicationConfig {
  name: string;
  slug: string;
  version: string;
  description: string;
  icon?: string;
  color?: string;

  manifest: {
    category: string;            // 'productivity', 'analytics', etc.
    visibility: 'public' | 'internal' | 'private';
    features?: string[];
    requiredGroups?: string[];   // Groups needed for access
  };

  menu?: MenuItem[];

  // Identity Pool configuration (optional)
  identityPool?: {
    poolId?: string;             // If using dedicated pool
    poolName?: string;
    region?: string;
    useShared?: boolean;         // Use platform shared pool (default)
  };

  // App status
  active: boolean;
  pm2Name?: string;              // PM2 process name
  port?: number;
}
```

### Identity Pool Info

```typescript
interface IdentityPoolInfo {
  IdentityPoolId: string;
  IdentityPoolName: string;
  AllowUnauthenticatedIdentities: boolean;
  CognitoIdentityProviders: Array<{
    ProviderName: string;
    ClientId: string;
  }>;
  OpenIdConnectProviderARNs?: string[];
  SamlProviderARNs?: string[];
}
```

## API Actions

### listApplications()
- **Purpose**: List all registered applications
- **Input**: `{ category?: string, visibility?: string }`
- **Output**: `{ apps: ApplicationConfig[] }`

### getApplication(slug: string)
- **Purpose**: Get application details
- **Input**: `slug: string`
- **Output**: `{ app: ApplicationConfig, health: HealthStatus }`

### updateApplication(slug: string, updates: Partial<ApplicationConfig>)
- **Purpose**: Update application configuration
- **Input**: `slug, updates`
- **Output**: `{ app: ApplicationConfig }`

### createIdentityPool(appSlug: string, config: IdentityPoolConfig)
- **Purpose**: Create dedicated Identity Pool for application
- **Input**: `appSlug, { userPoolId, region }`
- **Output**: `{ poolId: string, poolArn: string }`

### assignIdentityPool(appSlug: string, poolId: string)
- **Purpose**: Assign Identity Pool to application
- **Input**: `appSlug, poolId`
- **Output**: `{ success: boolean }`

### getAppHealth(slug: string)
- **Purpose**: Check application health status
- **Input**: `slug: string`
- **Output**: `{ status: 'online' | 'stopped', cpu: number, memory: number }`

## UI/UX

### Applications List View
- Cards with app icon, name, status indicator
- Filter: category, visibility, active/inactive
- Search bar
- "Refresh Registry" button

### Application Detail View
- App info card (name, version, description, icon)
- Config editor (JSON with validation)
- Identity Pool section:
  - Radio: "Shared Platform Pool" or "Dedicated Pool"
  - If dedicated: Show Pool ID, create new button
  - Pool details (ID, roles, provider config)
- Access control section (groups)
- Health monitoring section (status, logs, restart button)
- Members section (user count, active users)

### Create Identity Pool Modal
- Pool name input (auto-filled: `{app-slug}-identity-pool`)
- Region selection
- User Pool selection
- Client ID input
- Confirmation of IAM roles to be created

## Implementation Notes

### Identity Pool Creation
```typescript
// Steps to create dedicated Identity Pool:
1. Create Cognito Identity Pool with app name
2. Create IAM roles for authenticated/unauthenticated access
3. Attach policies with least-privilege access
4. Configure User Pool provider
5. Update app config.json with poolId
6. Restart app to use new pool
```

### Security Considerations
- Validate all config changes before applying
- Prevent breaking changes to running apps
- Backup config before updates
- Roll back on validation failure
- Audit all Identity Pool creations

## Testing

### Manual Test Scenarios
1. List applications → Verify all apps shown
2. Create dedicated Identity Pool → Verify IAM roles created
3. Assign pool to app → Verify app can authenticate
4. Update config → Verify changes reflected
5. Health check → Verify PM2 status accurate

## Dependencies

- App Registry service (exists in `@captify-io/core`)
- AWS Cognito Identity service
- PM2 for health monitoring
- File system access for config.json updates

---

**Feature ID**: #3
**Priority**: P0
**Story Points**: 5
**Status**: Not Started
