# Chat Package Migration Log

## Overview

Migration of chat/messaging functionality and types from src/ to @captify/chat package.

## Migration Status

### ✅ Completed

- [x] Basic package structure created
- [x] ChatComponent basic functionality
- [x] ChatLayout component
- [x] useThreads hook

### 🔄 In Progress

#### **Phase 1: Type Migration (Current)**

**Objective**: Migrate all chat-related types with proper camelCase naming

**Source Types to Migrate:**

- `src/types/chat.ts` (225 lines) - Complete chat/messaging types

**Target Structure:**

```
packages/chat/src/types/
├── chat.ts           # Core chat interfaces
├── threads.ts        # Thread management types
├── messages.ts       # Message and content types
├── streaming.ts      # Real-time streaming types
└── index.ts          # Export all types
```

**Type Mappings & Consolidation:**

1. **Core Chat Types** (from src/types/chat.ts)

   - **Action**: Move all types to packages/chat/src/types/
   - **Changes**: Verify camelCase consistency
   - **Key Types**:
     - `ChatAgentRef` ✓
     - `ChatMessage` ✓
     - `ChatThread` ✓
     - `ToolRun` ✓
     - `Citation` ✓
     - `DatasourceRef` ✓
     - `ToolDescriptor` ✓

2. **Streaming & Real-time Types**

   - **Types**:
     - `StreamingEvent` ✓
     - `StreamingEventType` ✓
     - `TokenState` ✓
     - `TokenWindow` ✓
     - `TokensUpdate` ✓

3. **API Request/Response Types**

   - **Types**:
     - `ChatHistoryResponse` ✓
     - `CreateThreadRequest` ✓
     - `UpdateThreadTitleRequest` ✓
     - `SendMessageRequest` ✓
     - `RunToolRequest` ✓
     - And all other API types

4. **Component Props Types**
   - **Types**:
     - `ChatInterfaceProps` ✓
     - `ChatHeaderProps` ✓
     - `ComposerProps` ✓
     - `ThreadListProps` ✓
     - `RightPaneProps` ✓

### 🎯 Next Steps

#### **Phase 2: Component Migration**

- [ ] Move additional chat components from src/components/apps/
- [ ] Migrate console chat components to package
- [ ] Update ChatInterface to use package types

#### **Phase 3: Service Migration**

- [ ] Move chat API client logic to packages/chat/src/services/
- [ ] Migrate thread management services
- [ ] Update chat breadcrumb logic

#### **Phase 4: Import Updates**

- [ ] Update all imports from `@/types/chat` to `@captify/chat`
- [ ] Update console components to use package imports
- [ ] Update API routes to use package types

## Files Requiring Updates

### High Priority (Direct chat type usage)

1. `src/components/apps/console/*.tsx` - Console chat components
2. `src/components/apps/ChatInterface.tsx` - Main chat interface
3. `src/app/api/chat/**/*.ts` - Chat API routes
4. `src/components/apps/ChatContent.tsx` - Chat content component

### Medium Priority (Chat integration)

1. `src/components/apps/ChatHistory.tsx` - Chat history component
2. `src/components/apps/ChatSettings.tsx` - Chat settings
3. Console layout components using chat

### Low Priority (Indirect usage)

1. Components that reference chat types
2. Layout components with chat integration

## Dependencies & Integration

### With Other Packages

- **@captify/api**: Will import agent types for chat-agent integration
- **@captify/applications**: May import application context for chat
- **@captify/core**: Will import auth, hooks, utilities

### Integration Points

- Agent integration for AI chat responses
- Application context for chat customization
- Authentication for chat sessions
- Real-time streaming for message delivery

## Type Consistency Notes

### Property Naming Verification

All chat types appear to already use camelCase consistently:

- ✅ `createdAt`, `updatedAt` (not created_at, updated_at)
- ✅ `messageCount` (not message_count)
- ✅ `toolRuns` (not tool_runs)
- ✅ `agentId` (not agent_id)
- ✅ `threadId` (not thread_id)

### Streaming Integration

- Ensure streaming types work with existing WebSocket/SSE implementation
- Maintain compatibility with current chat streaming patterns
- Verify token tracking integration

## Testing Strategy

1. **Chat Functionality**: Test message sending, receiving, threading
2. **Streaming**: Verify real-time message updates work
3. **Agent Integration**: Test AI chat responses
4. **Type Safety**: Ensure no TypeScript errors after migration
5. **UI Components**: Verify chat interface displays correctly

## Notes

- Chat types are well-structured and already use camelCase ✅
- Streaming functionality is sophisticated - handle with care
- Agent integration is critical for AI chat features
- Consider performance impact of component migrations
