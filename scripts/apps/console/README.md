# Captify Console - Development Progress

## Overview

Building a full-featured AI chat console with ChatGPT-style interface featuring thread management, tool execution, and multi-agent support.

## Architecture

- **Console Layout**: 3-pane design (threads | chat | tools/context)
- **Dock Integration**: Compact slide-over for embedding in other apps
- **Shared Engine**: Both console and dock use same ChatInterface core
- **Authentication**: Three-tier AWS credential fallback
- **Storage**: DynamoDB tables for threads, messages, and token grants

## Implementation Plan

### Phase 1: Core Console Architecture ✅ COMPLETED

- [x] Console app configuration (`config.json`)
- [x] DynamoDB table schemas (threads, messages, token-grants)
- [x] Chat data types (`src/types/chat.ts`)
- [x] ChatLayout component (3-pane shell with resizable panels)
- [x] ConsoleLayout component (placeholder implementation)
- [x] Update console page.tsx (replace AppLayout with ChatLayout)
- [x] Basic thread routing support
- [x] Database tables installed via `npm run install-app`
- [x] Console running successfully at `/app/console`

### Phase 2: Thread Management (Left Panel) ⏳ IN PROGRESS

- [x] ThreadList component (virtualized)
- [x] Thread CRUD operations API endpoints
- [x] Search, filter, pin, rename, delete UI
- [x] New thread creation
- [x] Enhanced history API with pagination
- [x] Integration with DynamoDB threads table
- [x] useThreads hook for state management
- [x] Real thread data integration in ConsoleLayout
- [ ] Test thread operations end-to-end

### Phase 3: Chat Engine Updates (Center Panel) ⏸️ PENDING

- [ ] MessageList component (reuse ChatInterface core)
- [ ] Composer with token estimation
- [ ] SSE streaming implementation
- [ ] ToolRun rendering (inline blocks)
- [ ] Citation display
- [ ] Message persistence to DynamoDB

### Phase 4: Right Panel (Tools/Context/Agent) ⏸️ PENDING

- [ ] RightPane tabbed interface
- [ ] ToolCard components
- [ ] Tool execution framework
- [ ] DatasourcePicker component
- [ ] Agent configuration panel
- [ ] New API routes (`/api/chat/tools`, `/api/chat/datasource`)

### Phase 5: Token Tracking & Polish ⏸️ PENDING

- [ ] Token estimation and tracking
- [ ] Live token updates via SSE
- [ ] Token limit enforcement
- [ ] DockChat component (compact mode)
- [ ] Keyboard shortcuts (Ctrl+Enter, Ctrl+N, etc.)
- [ ] Error handling and reconnection

## Database Tables

### captify-chat-threads

- **PK**: `app_id` (console, mi, etc.)
- **SK**: `thread_id`
- **GSI**: `user_id` + `updated_at`
- **Attributes**: title, agent_id, pinned, datasources, message_count

### captify-chat-messages

- **PK**: `thread_id`
- **SK**: `timestamp` (ISO with microseconds)
- **Attributes**: role, content, tool_runs, citations, meta

### captify-token-grants

- **PK**: `user_id`
- **SK**: `window_period` (daily/monthly)
- **Attributes**: available, reset_at, policy

## API Endpoints

### Existing (extend)

- [x] `/api/chat/bedrock-agent` - agent list + default
- [x] `/api/chat/llm` - needs SSE streaming
- [x] `/api/chat/history` - needs pagination/filtering
- [x] `/api/chat/title` - thread rename
- [x] `/api/chat/reset` - clear thread

### New (to implement)

- [ ] `/api/chat/tools` - list tool descriptors
- [ ] `/api/chat/tools/run` - execute tools
- [ ] `/api/chat/datasource` - manage datasources
- [ ] `/api/chat/tokens` - token accounting

## Component Structure

```
src/
├── types/
│   └── chat.ts                    # Data contracts
├── components/
│   ├── layout/
│   │   └── ChatLayout.tsx         # 3-pane console layout
│   └── apps/
│       ├── console/
│       │   ├── ConsoleLayout.tsx  # Console shell
│       │   ├── ThreadList.tsx     # Left panel
│       │   ├── RightPane.tsx      # Right panel tabs
│       │   ├── ToolCard.tsx       # Tool execution UI
│       │   └── DatasourcePicker.tsx
│       ├── chat/
│       │   ├── MessageList.tsx    # Message display
│       │   └── Composer.tsx       # Input + token estimation
│       └── dock/
│           └── DockChat.tsx       # Compact overlay
└── app/
    └── console/
        └── page.tsx               # Console route
```

## Current Status

**✅ COMPLETED**

- Console application configuration
- DynamoDB table schemas defined
- Development plan and tracking setup

**🚧 IN PROGRESS**

- Phase 2: Thread Management (Left Panel)
  - Thread list with real data loading
  - Create, rename, delete, pin operations
  - Search and filtering
  - Integration with DynamoDB

**⏳ NEXT STEPS**

1. Test thread operations end-to-end
2. Handle authentication errors gracefully
3. Add loading states and optimistic updates
4. Move to Phase 3: Chat Engine Updates

## Notes

- **No AppLayout**: Console uses ChatLayout instead of AppLayout
- **Shared Tables**: Reuses `captify-applications` and `application-menu-items`
- **Agent Integration**: Uses existing Bedrock agent system
- **Token Tracking**: Simple memory-based first, complex admin grants later
- **Tool Framework**: Generic execution framework, specific tools developed later
- **SSE Preferred**: Server-Sent Events for real-time updates
