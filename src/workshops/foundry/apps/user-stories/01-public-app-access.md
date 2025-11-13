# User Stories: Public App Access

## Current Implementation (Phase 1)

All apps are currently public - any authenticated user can access them.

### US-001: User Access Public Apps

**As a** authenticated user
**I want to** access any application in the platform
**So that** I can use all available tools and features

**Acceptance Criteria:**
- ✅ User can navigate to any `/app-slug` URL
- ✅ System checks `config.json` for visibility setting
- ✅ If `visibility === 'public'`, user sees the app immediately
- ✅ No additional permissions or approval needed
- ✅ Works for all 12 registered apps

**Current Status:** ✅ **Implemented**

---

### US-002: App Discovery

**As a** user
**I want to** see which apps are available to me
**So that** I know what tools I can use

**Acceptance Criteria:**
- ✅ Apps are registered with `config.json` files
- ✅ Each app has name, description, icon, and category
- ✅ System can list all available apps
- ⏳ UI to browse app catalog (partially implemented at `/apps`)

**Current Status:** 🟡 **Partially Implemented**

---

### US-003: System Route Access

**As a** user
**I want to** access system routes like `/api`, `/auth`, `/admin`, `/profile`
**So that** I can manage my account and access core features

**Acceptance Criteria:**
- ✅ System routes bypass app access checks
- ✅ Routes: `/api/*`, `/auth/*`, `/admin`, `/profile`
- ✅ No config.json required for these routes
- ✅ Access controlled by other means (admin groups, authentication)

**Current Status:** ✅ **Implemented**

---

### US-004: Error Handling

**As a** user
**I want to** see clear error messages when something goes wrong
**So that** I understand what happened and what to do next

**Acceptance Criteria:**
- ✅ "App Not Found" - when `/app-slug` doesn't have config.json
- ✅ "Access Required" - when app requires membership (future)
- ✅ "Access Denied" - generic error fallback
- ✅ "Go Home" button to return to safety

**Current Status:** ✅ **Implemented**

---

## Future Implementation (Phase 2)

These stories are planned but not yet implemented.

### US-005: Private App Access Request

**As a** user
**I want to** request access to private apps
**So that** I can use apps that require approval

**Acceptance Criteria:**
- ⏳ User navigates to private app
- ⏳ System shows "Access Required" message
- ⏳ User clicks "Request Access" button
- ⏳ User fills out request form with justification
- ⏳ Request submitted to admin queue
- ⏳ User receives confirmation

**Current Status:** ⏳ **Not Started**

---

### US-006: Admin App Approval

**As an** admin
**I want to** approve or deny user access requests
**So that** I can control who has access to sensitive apps

**Acceptance Criteria:**
- ⏳ Admin sees list of pending requests
- ⏳ Admin can view request details (user, app, justification)
- ⏳ Admin can approve with role assignment
- ⏳ Admin can deny with reason
- ⏳ User is notified of decision
- ⏳ Approved users gain immediate access

**Current Status:** ⏳ **Not Started**

---

### US-007: View My Apps

**As a** user
**I want to** see which apps I have access to
**So that** I can quickly navigate to my frequently used apps

**Acceptance Criteria:**
- ⏳ User navigates to "My Apps" page
- ⏳ System shows all apps user has access to
- ⏳ Public apps are automatically included
- ⏳ Private apps show membership status and role
- ⏳ User can click to launch any app

**Current Status:** ⏳ **Not Started**

---

### US-008: Admin Manage App Members

**As an** admin
**I want to** see who has access to each app
**So that** I can audit and manage permissions

**Acceptance Criteria:**
- ⏳ Admin navigates to app management
- ⏳ Admin selects an app
- ⏳ System shows all members with their roles
- ⏳ Admin can add new members directly
- ⏳ Admin can change member roles
- ⏳ Admin can revoke access
- ⏳ All changes are logged

**Current Status:** ⏳ **Not Started**

---

## Summary

**Phase 1 (Current):** Public app access is fully functional
- 4 stories implemented ✅
- All authenticated users can access all apps
- Simple, no-complexity approach

**Phase 2 (Future):** Private apps with membership
- 4 stories planned ⏳
- Requires `core-app-member` DynamoDB table
- Request/approval workflow
- Admin management UI
