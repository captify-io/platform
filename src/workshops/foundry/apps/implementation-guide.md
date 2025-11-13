# App Management System - Implementation Guide

## Overview

The App Management System enables dynamic application discovery and access control within the Captify platform. Every folder in `platform/src/app/*` can be an application with its own configuration, menu, and access controls.

## Key Components

### 1. App Configuration (`config.json`)

Each app folder must contain a `config.json` file with the following structure:

```json
{
  "slug": "myapp",
  "name": "My Application",
  "version": "1.0.0",
  "description": "Application description",
  "menu": [
    {
      "label": "Dashboard",
      "href": "/myapp",
      "icon": "LayoutDashboard",
      "description": "Main dashboard"
    }
  ],
  "manifest": {
    "name": "My Application",
    "icon": "AppWindow",
    "color": "#3b82f6",
    "category": "productivity",
    "tags": ["app", "tool"],
    "visibility": "internal"
  },
  "features": [
    {
      "id": "feature-1",
      "name": "Feature Name",
      "description": "Feature description",
      "enabled": true,
      "icon": "Star",
      "href": "/myapp/feature-1"
    }
  ],
  "access": {
    "requiresApproval": false,
    "defaultRole": "user",
    "allowedRoles": ["user", "admin"]
  }
}
```

### 2. App Registry (`platform/src/lib/app-registry.ts`)

Automatically discovers and validates apps by:
- Scanning `/platform/src/app/*` for folders
- Loading and validating `config.json` files
- Caching results for 5 minutes
- Excluding system folders (api, auth, etc.)

**Usage:**
```typescript
import { getAppRegistry, getAppBySlug } from '@/lib/app-registry';

// Get all apps
const apps = getAppRegistry();

// Get specific app
const app = getAppBySlug('agent');

// Force refresh cache
const apps = getAppRegistry(true);
```

### 3. App Access Control (`platform/src/lib/app-access.ts`)

Validates user access to applications:

**Access Flow:**
1. Extract app slug from pathname (e.g., `/agent/builder` → `agent`)
2. Skip validation for system routes (`api`, `auth`, `admin`, `profile`)
3. Load app config from registry
4. Check app visibility:
   - **Public**: Everyone has access
   - **Internal/Private**: Check `core-app-member` table for membership
5. Return access result

**Usage:**
```typescript
import { checkAppAccess } from '@/lib/app-access';

const result = await checkAppAccess('agent', session);

if (result.hasAccess) {
  // Grant access
} else {
  // Deny access, redirect to /apps/request-access
}
```

### 4. App Access Guard (`platform/src/components/app-access-guard.tsx`)

Client-side component that wraps app routes and validates access:
- Checks access on pathname change
- Shows loading state while checking
- Displays error page if access denied
- Redirects to access request page if needed

**Integrated in layout.tsx:**
```typescript
<CaptifyLayout config={config} session={session}>
  <AppAccessGuard>
    <PageReadyManager>{children}</PageReadyManager>
  </AppAccessGuard>
</CaptifyLayout>
```

### 5. Admin Interface (`platform/src/app/admin/apps/page.tsx`)

Admin dashboard for managing applications:
- View all registered apps
- See validation status and errors
- Filter by category, visibility
- Search apps
- View app details (menu, features, config)
- Quick links to configure, view members

**Access:** Only users in `captify-admin` group

## File Structure

```
platform/
├── src/
│   ├── app/
│   │   ├── admin/
│   │   │   ├── config.json          # Admin app config
│   │   │   ├── apps/
│   │   │   │   └── page.tsx         # App management UI
│   │   ├── agent/
│   │   │   ├── config.json          # Agent app config
│   │   │   └── page.tsx
│   │   ├── core/
│   │   │   ├── config.json          # Core app config
│   │   │   └── home/page.tsx
│   │   ├── profile/
│   │   │   ├── config.json          # Profile app config
│   │   │   └── page.tsx
│   │   ├── spaces/
│   │   │   ├── config.json          # Spaces app config
│   │   ├── editor/
│   │   │   ├── config.json          # Editor app config
│   │   ├── ontology/
│   │   │   ├── config.json          # Ontology app config
│   │   ├── apps/
│   │   │   ├── config.json          # App catalog config
│   │   ├── api/
│   │   │   └── app/
│   │   │       ├── check-access/
│   │   │       │   └── route.ts     # Check app access API
│   │   │       └── registry/
│   │   │           └── route.ts     # Get app registry API
│   │   └── layout.tsx               # Platform layout with AppAccessGuard
│   ├── components/
│   │   └── app-access-guard.tsx     # Client-side access validation
│   ├── lib/
│   │   ├── app-registry.ts          # App discovery and caching
│   │   └── app-access.ts            # Access control logic
│   └── types/
│       └── app-config.ts            # TypeScript types and validation
```

## Creating a New App

### Step 1: Create App Folder

```bash
mkdir -p platform/src/app/myapp
```

### Step 2: Create config.json

Create `platform/src/app/myapp/config.json`:

```json
{
  "slug": "myapp",
  "name": "My App",
  "version": "1.0.0",
  "description": "My awesome application",
  "menu": [
    {
      "label": "Home",
      "href": "/myapp",
      "icon": "Home"
    }
  ],
  "manifest": {
    "name": "My App",
    "icon": "AppWindow",
    "color": "#3b82f6",
    "category": "productivity",
    "visibility": "internal"
  },
  "access": {
    "requiresApproval": false,
    "defaultRole": "user",
    "allowedRoles": ["user"]
  }
}
```

### Step 3: Create page.tsx

Create `platform/src/app/myapp/page.tsx`:

```typescript
"use client";

import React from "react";

export default function MyAppPage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold">My App</h1>
      <p>Welcome to my application!</p>
    </div>
  );
}
```

### Step 4: Verify Registration

1. Visit `/admin/apps` (requires `captify-admin` group)
2. Click "Refresh Registry" to discover new app
3. Verify app appears in the list with valid status
4. Navigate to `/myapp` to test access

## App Visibility Settings

### Public Apps
```json
{
  "manifest": {
    "visibility": "public"
  }
}
```
- **Who can access:** Everyone (all authenticated users)
- **Use cases:** Core features, home, profile, app catalog
- **No membership check required**

### Internal Apps (Default)
```json
{
  "manifest": {
    "visibility": "internal"
  },
  "access": {
    "requiresApproval": false
  }
}
```
- **Who can access:** Users with membership in `core-app-member` table
- **Use cases:** Team collaboration tools, project management
- **Membership check:** Required

### Private Apps
```json
{
  "manifest": {
    "visibility": "private"
  },
  "access": {
    "requiresApproval": true,
    "allowedRoles": ["admin", "developer"]
  }
}
```
- **Who can access:** Users with specific roles and approved membership
- **Use cases:** Admin tools, system management, sensitive data
- **Approval required:** Admin must approve access requests

## Access Control Flow

### User Navigates to App

```
User → /${appSlug}
  ↓
Platform layout.tsx
  ↓
AppAccessGuard component
  ↓
Extract app slug from pathname
  ↓
Call /api/app/check-access
  ↓
Server checks:
  1. Is system route? → Allow
  2. App exists in registry? → Check config
  3. App valid? → Continue
  4. Visibility = public? → Allow
  5. Visibility = internal/private? → Check core-app-member
  6. Membership exists & active? → Allow
  7. No membership? → Deny, show access request
```

### Access Denied Scenarios

1. **App Not Found**
   - App folder doesn't exist or no config.json
   - Shows "App Not Found" error page

2. **Invalid Config**
   - config.json is malformed or missing required fields
   - Shows validation errors to admin
   - Blocks access to all users

3. **No Membership**
   - User is authenticated
   - App requires membership
   - User not in `core-app-member` table
   - Shows "Access Required" with "Request Access" button

## Admin Tasks

### View All Apps

1. Navigate to `/admin/apps`
2. See all discovered apps with:
   - Valid/Invalid status
   - Visibility level
   - Category
   - Menu items
   - Configuration errors (if any)

### Filter Apps

Use filters to find specific apps:
- **Search**: By name, slug, or description
- **Category**: Filter by app category
- **Visibility**: Public, Internal, Private

### Refresh Registry

Click "Refresh Registry" to:
- Clear cache
- Re-scan app folders
- Load updated configs
- Re-validate all apps

### View App Details

Each app card shows:
- Name, version, slug
- Description
- Visibility and category badges
- Menu structure
- Validation errors (if invalid)
- Quick actions (View, Configure, Members)

## Development Mode

In development (`NODE_ENV=development`), access checks are relaxed:
- All apps grant access automatically
- Membership checks are bypassed
- Allows testing without setting up memberships

**Production:** Full access control enforced

## Future Enhancements

### Phase 1 (Current)
- ✅ App discovery via config.json
- ✅ Access validation (public vs. membership)
- ✅ Admin UI for app management
- ✅ Config validation and error display

### Phase 2 (Next)
- ⏳ core-app-member table implementation
- ⏳ User access request flow
- ⏳ Admin approval workflow
- ⏳ IAM role provisioning

### Phase 3 (Future)
- ⏳ App marketplace
- ⏳ App analytics and usage metrics
- ⏳ Dynamic menu generation from registry
- ⏳ App-level permissions and feature flags

## Troubleshooting

### App Not Appearing in Registry

**Possible causes:**
1. No `config.json` file in app folder
2. Folder is in system exclusion list
3. Cache hasn't refreshed yet

**Solutions:**
- Verify `config.json` exists
- Check folder name isn't in `SYSTEM_FOLDERS`
- Click "Refresh Registry" in admin UI

### Config Validation Errors

**Common errors:**
- `slug` doesn't match folder name
- Missing required fields (name, version, description)
- Invalid version format (must be semver: 1.0.0)

**Fix:**
- Update `config.json` to match requirements
- Ensure `slug` matches folder name exactly
- Use semantic versioning

### Access Denied for Public App

**Check:**
1. Is `manifest.visibility` set to `"public"`?
2. Is user authenticated (has valid session)?
3. Check browser console for errors

### Development Access Not Working

**Verify:**
- `NODE_ENV=development` is set
- Server restarted after env change
- Session is valid

## API Reference

### GET /api/app/registry
Get all registered apps (admin only)

**Query params:**
- `refresh`: "true" to force cache refresh

**Response:**
```json
{
  "apps": [...],
  "count": 8,
  "valid": 7,
  "invalid": 1
}
```

### POST /api/app/check-access
Check if user has access to an app

**Request:**
```json
{
  "slug": "agent"
}
```

**Response:**
```json
{
  "hasAccess": true,
  "appConfig": { ... }
}
```

or

```json
{
  "hasAccess": false,
  "reason": "no_membership",
  "requiresApproval": true,
  "appConfig": { ... }
}
```

## Best Practices

1. **Always include config.json** - Apps without config won't be discovered
2. **Match slug to folder name** - Prevents validation errors
3. **Use semantic versioning** - Update version when config changes
4. **Set appropriate visibility** - Public for general features, private for admin
5. **Provide clear descriptions** - Help users understand app purpose
6. **Include menu items** - Make navigation intuitive
7. **Test in development** - Verify config before production
8. **Document features** - Use features array to list capabilities

## Summary

The App Management System provides:
- ✅ Dynamic app discovery from folder structure
- ✅ Centralized configuration via config.json
- ✅ Flexible access control (public/internal/private)
- ✅ Admin interface for app management
- ✅ Validation and error reporting
- ✅ Extensible for future features (IAM, approvals, analytics)

All folders in `platform/src/app/*` with a valid `config.json` are automatically registered as applications with full access control integration.
