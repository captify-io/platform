# Feature 39: Settings & Preferences

**Persona:** System
**Priority:** Medium
**Effort:** Small
**Status:** Sprint 2

## Overview
User settings and preferences for personalization, notifications, display options, and integrations.

## Requirements
### Functional: Profile settings, Notification preferences, Theme customization, Language selection, Timezone settings, Default views, Keyboard shortcuts, Integration connections
### Non-Functional: Settings persist across sessions, Real-time preview, Mobile settings UI

## Ontology
### New Ontology Nodes
```typescript
// OntologyNode for UserPreferences
{
  id: "core-user-preferences",
  name: "UserPreferences",
  type: "userPreferences",
  category: "entity",
  domain: "System",
  icon: "Settings",
  color: "#6b7280",
  active: "true",
  properties: {
    dataSource: "core-user-preferences",
    schema: {
      type: "object",
      properties: {
        userId: { type: "string", required: true },
        theme: { type: "string", enum: ["light", "dark", "auto"], default: "light" },
        language: { type: "string", default: "en" },
        timezone: { type: "string", default: "America/New_York" },
        notifications: {
          type: "object",
          properties: {
            email: { type: "boolean", default: true },
            inApp: { type: "boolean", default: true },
            push: { type: "boolean", default: false },
            digest: { type: "string", enum: ["none", "daily", "weekly"], default: "none" }
          }
        },
        defaults: {
          type: "object",
          properties: {
            spaceView: { type: "string", enum: ["grid", "list"], default: "grid" },
            taskView: { type: "string", enum: ["board", "list"], default: "board" }
          }
        },
        updatedAt: { type: "string" }
      },
      required: ["userId"]
    },
    indexes: {
      "userId-index": { hashKey: "userId", type: "GSI" }
    }
  }
}
```

## Components
```typescript
// /opt/captify-apps/core/src/components/spaces/features/settings/settings-page.tsx (REUSABLE)
export function SettingsPage()

// /opt/captify-apps/core/src/components/spaces/features/settings/profile-settings.tsx (REUSABLE)
export function ProfileSettings({ user }: { user: User })

// /opt/captify-apps/core/src/components/spaces/features/settings/notification-settings.tsx (REUSABLE)
export function NotificationSettings({ preferences }: { preferences: UserPreferences })

// /opt/captify-apps/core/src/components/spaces/features/settings/theme-selector.tsx (REUSABLE)
export function ThemeSelector({ current, onChange }: ThemeSelectorProps)
```

## Actions
### 1. Get User Preferences
```typescript
interface GetUserPreferencesRequest {
  service: 'platform.dynamodb';
  operation: 'get';
  table: 'core-user-preferences';
  data: { Key: { userId: string } };
}
```

### 2. Update Preferences
```typescript
interface UpdatePreferencesRequest {
  userId: string;
  updates: Partial<UserPreferences>;
}
```

## User Stories
### Story 1: User Changes Theme
**Tasks:** Open settings, select dark theme, see preview, save
**Acceptance:** Theme applies immediately

### Story 2: User Configures Notifications
**Tasks:** Disable email notifications, enable digest, save preferences
**Acceptance:** Notification behavior updates

## Dependencies: User authentication
## Status: Sprint 2, Not Started
