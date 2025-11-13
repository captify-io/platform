# Feature: App Catalog & Discovery

## Overview

Allow users to browse, search, and discover applications available in the platform.

## Current Status

🟡 **Partially Implemented**
- Config.json files exist for all apps
- Admin can view app registry at `/admin/apps`
- User-facing catalog at `/apps` needs implementation

## User-Facing Features

### 1. Browse Apps Catalog

**Location:** `/apps`

**Functionality:**
- Display grid of all available apps
- Show app icon, name, description
- Show app category badge
- Click to launch app

**Current Status:** ⏳ Needs Implementation

**Design:**
```
┌─────────────────────────────────────┐
│  App Catalog                     🔍  │
├─────────────────────────────────────┤
│  ┌─────┐  ┌─────┐  ┌─────┐          │
│  │ 🤖  │  │ 🏠  │  │ 👤  │          │
│  │Agent│  │Core │  │Profile│        │
│  └─────┘  └─────┘  └─────┘          │
│                                      │
│  ┌─────┐  ┌─────┐  ┌─────┐          │
│  │ 📊  │  │ 🔍  │  │ 🔔  │          │
│  │Spaces│  │Search│ │Notif│         │
│  └─────┘  └─────┘  └─────┘          │
└─────────────────────────────────────┘
```

---

### 2. Search & Filter

**Functionality:**
- Search by app name or description
- Filter by category
- Filter by tags
- Sort alphabetically or by popularity

**Current Status:** ⏳ Needs Implementation

---

### 3. App Details Page

**Location:** `/apps/[slug]`

**Functionality:**
- Show full app information
- List features
- Show menu structure
- Launch app button
- (Future) Show membership status

**Current Status:** ⏳ Needs Implementation

---

## Admin Features

### 4. App Registry Management

**Location:** `/admin/apps`

**Functionality:**
- ✅ View all registered apps
- ✅ See validation status
- ✅ Filter by category, visibility
- ✅ Search apps
- ✅ Show stats (total, valid, invalid, public)
- ✅ Refresh registry cache

**Current Status:** ✅ **Implemented**

---

### 5. App Configuration Editor

**Location:** `/admin/apps/[slug]/edit`

**Functionality:**
- View current config.json
- Edit app properties
- Update visibility setting
- Change menu structure
- Add/remove features
- Save changes

**Current Status:** ⏳ Needs Implementation

**Note:** Currently admins must edit config.json files directly

---

## Technical Details

### App Registry Service

**File:** `platform/src/lib/app-registry.ts`

**Functions:**
- `discoverApps()` - Scans `src/app/*` for config.json files
- `getAppRegistry()` - Returns cached list of apps
- `getAppBySlug(slug)` - Get specific app config
- `getValidApps()` - Get apps with valid config
- `getAppsByCategory(category)` - Filter by category
- `getAppsByVisibility(visibility)` - Filter by visibility
- `refreshAppRegistry()` - Clear cache and reload

**Caching:**
- Development: 10 seconds
- Production: 5 minutes

---

### App Config Schema

**File:** `platform/src/types/app-config.ts`

**Key Fields:**
```typescript
interface AppConfig {
  // Required
  slug: string;
  name: string;
  version: string;
  description: string;

  // Optional
  menu?: MenuItem[];
  manifest?: {
    name: string;
    icon?: string;
    color?: string;
    category?: string;
    tags?: string[];
    visibility: 'public' | 'internal' | 'private';
  };
  features?: AppFeature[];
  access?: {
    requiresApproval?: boolean;
    defaultRole?: string;
    allowedRoles?: string[];
  };
}
```

---

## API Endpoints

### For Admin Use

Currently uses server-side functions directly. Could expose as API:

**GET /api/admin/apps**
- List all registered apps
- Requires admin auth

**GET /api/admin/apps/[slug]**
- Get specific app details
- Requires admin auth

**PUT /api/admin/apps/[slug]**
- Update app configuration
- Requires admin auth

**POST /api/admin/apps/refresh**
- Force refresh app registry cache
- Requires admin auth

**Current Status:** ⏳ Not Implemented (not needed yet)

---

## UI Components Needed

### User Catalog Page

**Components:**
- `AppCard` - Display app in grid
- `AppSearch` - Search input
- `CategoryFilter` - Category dropdown
- `AppCatalog` - Main page component

**Priority:** 🟡 Medium

---

### Admin Registry Page

**Status:** ✅ Already implemented at `/admin/apps`

**Components:**
- App list with cards
- Search and filters
- Stats dashboard
- Refresh button

---

## Implementation Tasks

### Phase 1: User Catalog (Current Priority)

- [ ] Create `AppCard` component
- [ ] Create `/apps/page.tsx` catalog page
- [ ] Implement search functionality
- [ ] Implement category filter
- [ ] Add app launch buttons
- [ ] Style with existing design system

**Estimated:** 4-6 hours

---

### Phase 2: App Details

- [ ] Create `/apps/[slug]/page.tsx` detail page
- [ ] Show full app information
- [ ] List features and menu
- [ ] Add breadcrumb navigation

**Estimated:** 2-3 hours

---

### Phase 3: Admin Config Editor

- [ ] Create `/admin/apps/[slug]/edit/page.tsx`
- [ ] Build config editor form
- [ ] Validate config changes
- [ ] Save to file system
- [ ] Refresh registry on save

**Estimated:** 6-8 hours

---

## Data Sources

### Current Apps

All apps have config.json in their folders:

| App | Category | Icon | Tags |
|-----|----------|------|------|
| Admin | system | Shield | administration, management |
| Agent Studio | ai | Bot | ai, agents, automation |
| Core | system | Home | dashboard, favorites |
| Profile | user | User | profile, settings |
| Spaces | collaboration | LayoutGrid | workspaces, teams |
| Editor | productivity | FileText | editor, documents |
| Ontology | system | Network | data model, schema |
| App Catalog | system | AppWindow | apps, directory |
| Search | productivity | Search | search, find |
| Notifications | communication | Bell | notifications, alerts |
| What's New | information | Sparkles | updates, releases |
| Marketplace | system | Store | apps, plugins |

---

## Future Enhancements

### App Analytics
- Track app usage
- Show popular apps
- Show recently accessed apps

### App Reviews
- Users can rate apps
- Users can leave comments
- Show average rating

### App Collections
- Group related apps
- Featured apps
- Recommended apps

### App Permissions
- Show what data app can access
- Show required permissions
- Privacy information

---

## Success Criteria

✅ Phase 1:
- Users can browse all apps
- Users can search for apps
- Users can filter by category
- Users can launch any app

✅ Phase 2:
- Users can view detailed app info
- Navigation is intuitive
- Design matches platform style

✅ Phase 3:
- Admins can edit app config via UI
- Changes are validated
- Registry updates automatically
