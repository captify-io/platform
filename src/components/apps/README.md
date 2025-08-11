# Captify Application Architecture

## Current Implementation Status: ✅ PHASE 1 COMPLETE

### What's Been Built

The Captify application now features a modern, modular architecture with hash-based navigation, a clean separation of concerns, and a comprehensive chat interface system.

## Architecture Overview

### **Core Components**

**AppLayout.tsx** - Main layout component

- 3-area layout: `[menu][content][chat]`
- Handles menu/chat visibility state via React Context
- Supports both API-driven menus and custom content
- Hash-based navigation for single-page app experience
- Integrated sliding chat interface with resizable panels

**AppMenu.tsx** - API-driven menu component

- Fetches menu items from `/api/menu` endpoint
- Hash-based navigation (#dashboard, #analytics, #settings)
- Dynamic icons using Lucide React
- Loading states and error handling
- Active state highlighting

**ConsoleContent.tsx** - Content router for console application

- Renders different views based on hash fragment
- Dashboard, Analytics, and Settings views
- No page refreshes - pure client-side navigation

**LayoutContext.tsx** - React Context for state management

- Manages menu/chat visibility across components
- MenuToggle positioned in breadcrumb area
- Reliable state management without global variables

### **Chat Interface System**

The chat interface has been modularized into logical, reusable components:

**ChatInterface.tsx** - Main orchestrator component

- Integrates all chat sub-components
- Manages state and API communication
- Handles sliding panel behavior
- Supports both Bedrock agents and LLM providers

**ChatHeader.tsx** - Header with controls

- Application name and provider badge
- Action buttons (new session, settings, history, minimize)
- Slide toggle button with rotation animation
- Clean, consistent UI

**ChatContent.tsx** - Message display area

- Scrollable message history
- User/assistant message rendering
- Markdown support with syntax highlighting
- Trace and reasoning display
- Loading and error states

**ChatFooter.tsx** - Input and submission

- Message input field
- Send/stop buttons
- Token count display
- Keyboard shortcuts support

**ChatSettings.tsx** - Provider configuration

- AI provider selection (Bedrock agents vs LLMs)
- Visual provider categorization
- Dynamic icon rendering
- Agent mode indicators

**ChatHistory.tsx** - Conversation management

- Side panel for conversation history
- Resume previous conversations
- Clean conversation listing

### **Navigation System**

**Hash-Based Routing**

- URLs like `/console#dashboard`, `/console#analytics`
- No page refreshes when switching sections
- Browser back/forward button support
- Clean, bookmarkable URLs

**Application Configuration**

Applications are now configured using local JSON files for better performance:

```typescript
// /app/console/config.json
{
  "id": "console-app-001",
  "name": "Console",
  "agentId": "F5W4F6L7O0",
  "agentAliasId": "9EOAGEYMBM",
  "menu": [
    { "id": "dashboard", "label": "Dashboard", "icon": "LayoutDashboard" },
    { "id": "analytics", "label": "Analytics", "icon": "BarChart3" },
    { "id": "settings", "label": "Settings", "icon": "Settings" }
  ]
}
```

**Component Flow**

1. AppMenu loads `/app/{applicationId}/config.json` on mount
2. User clicks menu item → Updates URL hash → Triggers navigation callback
3. AppLayout receives navigation event → Updates activeSection state
4. ConsoleContent renders appropriate view based on activeSection
5. Chat toggle: When chat is closed, floating action button appears for reopening

### **File Structure**

```
src/
├── components/apps/
│   ├── AppLayout.tsx           # Main layout with hash navigation
│   ├── AppMenu.tsx             # API-driven menu with hash links
│   ├── ConsoleContent.tsx      # Content router for console app
│   └── MenuToggle.tsx          # Menu toggle button for breadcrumbs
├── context/
│   └── LayoutContext.tsx       # React Context for layout state
├── app/
│   ├── layout.tsx              # Global layout with LayoutProvider
│   ├── console/
│   │   ├── page.tsx           # Console application entry point
│   │   ├── dashboard/page.tsx  # Legacy route (still works)
│   │   ├── analytics/page.tsx  # Legacy route (still works)
│   │   └── settings/page.tsx   # Legacy route (still works)
│   └── api/menu/
│       └── route.ts           # Menu API endpoint
```

### **Key Features**

**✅ Responsive Design**

- Menu toggles from breadcrumb area
- Inline menu (pushes content, doesn't overlay)
- Consistent spacing and padding

**✅ State Management**

- React Context for reliable state sharing
- Menu/chat visibility persistence
- No global variables or circular dependencies

**✅ API Integration**

- RESTful menu endpoint
- Loading states and error handling
- Dynamic menu generation based on applicationId

**✅ Developer Experience**

- TypeScript strict mode
- Clean component interfaces
- Modular, testable architecture
- No unused imports or commented code

## Usage Examples

### Basic Console Application

```tsx
<AppLayout
  applicationId="console"
  applicationName="Captify Console"
  showChat={true}
  showMenu={true}
>
  {/* Content automatically handled by ConsoleContent */}
</AppLayout>
```

### Custom Application

```tsx
<AppLayout showMenu={false} showChat={true}>
  <YourCustomContent />
</AppLayout>
```

## Navigation Flow

1. **Page Load**: `/console` → Redirects to `/console#dashboard`
2. **Menu Click**: User clicks "Analytics" → URL becomes `/console#analytics`
3. **Content Update**: ConsoleContent renders analytics view
4. **Active State**: Menu highlights "Analytics" as active
5. **No Refresh**: Entire process happens client-side

## Development Guidelines

**✅ FOLLOW THESE PATTERNS:**

- Use TypeScript strict mode - no `any` types
- Implement proper loading states
- Handle errors gracefully
- Use React Context for state management
- Keep components focused and modular

**❌ AVOID:**

- Page refreshes for navigation
- Global variables for state
- Circular dependencies
- Commented code or console.log statements
- Mixed concerns in single components

## Next Steps

The foundation is complete and working. Future development can focus on:

- Adding more applications (agents, apps, etc.)
- Enhancing the chat interface integration
- Adding more sophisticated content views
- Implementing user authentication flows
- Adding real database integration for menu items

The architecture is designed to scale and can easily accommodate new applications following the same patterns.
