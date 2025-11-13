# Public Applications

These apps are accessible to all authenticated users without requiring membership approval.

## Public Apps (visibility: "public")

| App | Slug | Description | Category |
|-----|------|-------------|----------|
| **Agent Studio** | `/agent` | AI agent builder and management platform | AI |
| **Core** | `/core` | Core platform features and services | System |
| **Profile** | `/profile` | User profile and settings | User |
| **App Catalog** | `/apps` | Browse and request access to platform applications | System |
| **Search** | `/search` | Global search across all platform content | Productivity |
| **Notifications** | `/notifications` | View and manage notifications and activity | Communication |
| **What's New** | `/whats-new` | Platform updates, features, and release notes | Information |
| **Marketplace** | `/marketplace` | Discover and install apps, plugins, integrations | System |

## Internal Apps (visibility: "internal")

Require membership in `core-app-member` table:

| App | Slug | Description | Category |
|-----|------|-------------|----------|
| **Spaces** | `/spaces` | Collaborative workspaces and project management | Collaboration |
| **Editor** | `/editor` | Content editor and document management | Productivity |

## Private Apps (visibility: "private")

Require membership + admin approval:

| App | Slug | Description | Category |
|-----|------|-------------|----------|
| **Admin** | `/admin` | Platform administration and management | System |
| **Ontology** | `/ontology` | Data model and ontology management | System |

## Access Summary

- **8 Public Apps** - Everyone has access
- **2 Internal Apps** - Requires membership
- **2 Private Apps** - Requires approval + membership
- **Total: 12 Apps**

## New Apps Created

The following apps were added with public visibility:

1. **Search** (`/search`)
   - Global search across platform
   - Recent searches
   - Saved searches
   - Advanced filters

2. **Notifications** (`/notifications`)
   - All notifications
   - Unread notifications
   - Real-time updates
   - Notification preferences

3. **What's New** (`/whats-new`)
   - Latest updates
   - Release notes
   - Product roadmap
   - Coming soon features

4. **Marketplace** (`/marketplace`)
   - Browse apps and plugins
   - Categories and featured apps
   - Install/manage apps
   - Reviews and ratings

## App Features

### Search
- **Global Search**: Search across all applications and content
- **Advanced Filters**: Filter by type, date, application
- **Saved Searches**: Save and reuse common searches
- **Kendra Integration**: AWS Kendra knowledge base

### Notifications
- **Notifications List**: View all notifications
- **Real-time Updates**: Instant notification delivery
- **Preferences**: Customize notification settings
- **Activity Feed**: Track platform activity

### What's New
- **Changelog**: Platform updates and changes
- **Release Notes**: Detailed release documentation
- **Roadmap**: Upcoming features and improvements
- **Version History**: Track platform versions

### Marketplace
- **App Catalog**: Browse available apps and integrations
- **One-click Install**: Easy app installation
- **Reviews & Ratings**: User feedback and ratings
- **Manage Apps**: Update and remove installed apps

## Testing Public Access

All public apps should be accessible to any authenticated user:

```bash
# Test access (should work for all users)
curl -X POST http://localhost:3000/api/app/check-access \
  -H "Content-Type: application/json" \
  -d '{"slug": "agent"}'

curl -X POST http://localhost:3000/api/app/check-access \
  -H "Content-Type: application/json" \
  -d '{"slug": "search"}'

curl -X POST http://localhost:3000/api/app/check-access \
  -H "Content-Type: application/json" \
  -d '{"slug": "notifications"}'
```

Expected response for all:
```json
{
  "hasAccess": true,
  "appConfig": { ... }
}
```

## Next Steps

To implement these apps, create corresponding `page.tsx` files:

```bash
# Create placeholder pages
mkdir -p platform/src/app/search
echo 'export default function SearchPage() { return <div>Search</div>; }' > platform/src/app/search/page.tsx

mkdir -p platform/src/app/notifications
echo 'export default function NotificationsPage() { return <div>Notifications</div>; }' > platform/src/app/notifications/page.tsx

mkdir -p platform/src/app/whats-new
echo 'export default function WhatsNewPage() { return <div>What'\''s New</div>; }' > platform/src/app/whats-new/page.tsx

mkdir -p platform/src/app/marketplace
echo 'export default function MarketplacePage() { return <div>Marketplace</div>; }' > platform/src/app/marketplace/page.tsx
```

## Verification

Visit `/admin/apps` and click "Refresh Registry" to see all 12 apps with their correct visibility settings.
