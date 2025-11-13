# App Management System - Quick Start

## TL;DR

Every folder in `platform/src/app/*` is an application. Add a `config.json` file to register it.

## Create a New App in 3 Steps

### 1. Create Folder
```bash
mkdir platform/src/app/myapp
```

### 2. Add config.json
```json
{
  "slug": "myapp",
  "name": "My App",
  "version": "1.0.0",
  "description": "My application",
  "manifest": {
    "visibility": "public"
  }
}
```

### 3. Add page.tsx
```tsx
export default function MyAppPage() {
  return <div>My App</div>;
}
```

## Access Control

### Public App (Everyone)
```json
{
  "manifest": {
    "visibility": "public"
  }
}
```

### Private App (Requires Membership)
```json
{
  "manifest": {
    "visibility": "internal"
  }
}
```

## View All Apps

Go to: [/admin/apps](/admin/apps) (requires `captify-admin` group)

## User Access Flow

1. **Public apps** → Everyone has access
2. **Private apps** → User must be in `core-app-member` table
3. **No access** → Show "Request Access" button

## Files Created

- ✅ `platform/src/types/app-config.ts` - TypeScript types
- ✅ `platform/src/lib/app-registry.ts` - App discovery
- ✅ `platform/src/lib/app-access.ts` - Access control
- ✅ `platform/src/components/app-access-guard.tsx` - Client validation
- ✅ `platform/src/app/layout.tsx` - Updated with AppAccessGuard
- ✅ `platform/src/app/*/config.json` - Config for all apps (8 apps)
- ✅ `platform/src/app/admin/apps/page.tsx` - Admin UI
- ✅ `platform/src/app/api/app/check-access/route.ts` - Access check API
- ✅ `platform/src/app/api/app/registry/route.ts` - Registry API

## Existing Apps with Config

All apps now have `config.json`:

| App | Slug | Visibility | Description |
|-----|------|------------|-------------|
| Admin | `/admin` | private | Platform administration |
| Agent Studio | `/agent` | internal | AI agent builder |
| Core | `/core` | public | Core platform features |
| Profile | `/profile` | public | User profile and settings |
| Spaces | `/spaces` | internal | Collaborative workspaces |
| Editor | `/editor` | internal | Content editor |
| Ontology | `/ontology` | private | Data model management |
| App Catalog | `/apps` | public | Browse and request apps |

## Testing

1. Start platform: `npm run dev`
2. Visit any app: `/agent`, `/core`, etc.
3. Access guard checks membership
4. Admin view all apps: `/admin/apps`

## Next Steps

- [ ] Implement `core-app-member` table (see [status.md](./status.md))
- [ ] Build access request flow
- [ ] Add admin approval workflow
- [ ] Create IAM role provisioning

## Documentation

- [Implementation Guide](./implementation-guide.md) - Full technical details
- [Status](./status.md) - Current progress
- [README](./readme.md) - Vision and architecture
- [Features](./features/) - Feature specifications
