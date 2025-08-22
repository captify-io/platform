# @captify/chat

Comprehensive chat and messaging package for the Captify platform, providing AI-powered conversation interfaces, thread management, and real-time communication capabilities.

## Package Overview

This package provides:

- **AI-Powered Chat Interface**: Components for conversational AI interactions
- **Thread Management**: Multi-conversation thread handling and organization
- **Real-time Messaging**: WebSocket-based real-time communication
- **Context-Aware Panels**: Tool execution, reasoning, and context display
- **Chat History**: Persistent conversation storage and retrieval
- **Customizable Layouts**: Flexible chat interface layouts

## Installation

```bash
npm install @captify/chat
```

## Usage

### Basic Chat Interface

**Ground Rule #1**: All applications MUST use `@captify/core/api/client` for API access.

```typescript
import { ChatInterface } from "@captify/chat";
import { CaptifyClient } from "@captify/core/api/client";

function MyApp() {
  const client = new CaptifyClient({ session });

  return (
    <ChatInterface
      applicationId="my-app"
      userId={session.userId}
      onMessageSend={(message) => {
        // Handle message sending
        console.log("Sending message:", message);
      }}
      onThreadChange={(threadId) => {
        // Handle thread switching
        console.log("Switched to thread:", threadId);
      }}
    />
  );
}
```

### Console Layout

```typescript
import { ConsoleLayout } from "@captify/chat";

function ChatConsole() {
  return (
    <ConsoleLayout
      applicationId="console"
      showThreadList={true}
      showContextPanel={true}
      showToolsPanel={true}
      showReasoningPanel={true}
      initialPanelSizes={{
        threadList: 280,
        contextPanel: 300,
        toolsPanel: 250,
      }}
    >
      <div>Additional content or overlays</div>
    </ConsoleLayout>
  );
}
```

### Chat Layout with Custom Configuration

```typescript
import { ChatLayout } from "@captify/chat";

function CustomChatApp() {
  return (
    <ChatLayout
      applicationId="custom-chat"
      title="AI Assistant"
      subtitle="Powered by Captify"
      showHeader={true}
      showFooter={true}
      enableFileUpload={true}
      enableVoiceInput={true}
      maxMessageLength={4000}
      theme="modern"
    />
  );
}
```

### Thread Management

```typescript
import { ThreadList, ChatContent } from "@captify/chat";

function ThreadedChat() {
  const [activeThread, setActiveThread] = useState(null);

  return (
    <div className="flex h-screen">
      <ThreadList
        userId={session.userId}
        onThreadSelect={setActiveThread}
        onThreadCreate={(thread) => {
          setActiveThread(thread);
        }}
        showSearch={true}
        showArchived={false}
        maxThreads={50}
      />

      <ChatContent
        threadId={activeThread?.id}
        onMessageSend={(message) => {
          // Send message to current thread
        }}
      />
    </div>
  );
}
```

### Context and Tools Panels

```typescript
import { ContextPanel, ToolsPanel, ReasoningPanel } from "@captify/chat";

function EnhancedChat() {
  return (
    <div className="grid grid-cols-4 h-screen">
      <div className="col-span-2">
        <ChatContent threadId={currentThread} />
      </div>

      <ContextPanel
        threadId={currentThread}
        showDocuments={true}
        showMemory={true}
        showUserProfile={true}
      />

      <div className="space-y-4">
        <ToolsPanel
          availableTools={["web-search", "calculator", "file-reader"]}
          onToolExecute={(tool, params) => {
            // Handle tool execution
          }}
        />

        <ReasoningPanel
          threadId={currentThread}
          showThoughtProcess={true}
          showConfidenceScores={true}
        />
      </div>
    </div>
  );
}
```

## Directory Structure

- `/components` - React components for chat interfaces
- `/context` - React context providers for chat state
- `/hooks` - Custom hooks for chat functionality
- `/services` - Service classes for chat operations
- `types.ts` - TypeScript definitions for the package

## Key Components

### ChatInterface

Main chat component that provides a complete chat experience:

```typescript
<ChatInterface
  applicationId="my-app"
  userId={session.userId}
  threadId="optional-thread-id"
  placeholder="Type your message..."
  enableMarkdown={true}
  enableCodeHighlighting={true}
  enableFileUpload={true}
  enableVoiceInput={false}
  maxMessageLength={4000}
  autoSave={true}
  showTypingIndicator={true}
  onMessageSend={(message) => handleSend(message)}
  onThreadChange={(threadId) => handleThreadChange(threadId)}
  onTyping={(isTyping) => handleTyping(isTyping)}
/>
```

### ChatContent

Core chat content area with message display and input:

```typescript
<ChatContent
  threadId={currentThread}
  messages={messages}
  isLoading={false}
  showTimestamps={true}
  showUserAvatars={true}
  enableMessageReactions={true}
  enableMessageEditing={true}
  onMessageSend={(message) => sendMessage(message)}
  onMessageEdit={(messageId, newContent) => editMessage(messageId, newContent)}
  onMessageReact={(messageId, reaction) => addReaction(messageId, reaction)}
/>
```

### ThreadList

Thread management sidebar:

```typescript
<ThreadList
  userId={session.userId}
  threads={userThreads}
  activeThreadId={currentThread}
  showSearch={true}
  showCreateButton={true}
  showArchived={false}
  groupByDate={true}
  onThreadSelect={(thread) => setCurrentThread(thread.id)}
  onThreadCreate={() => createNewThread()}
  onThreadArchive={(threadId) => archiveThread(threadId)}
  onThreadDelete={(threadId) => deleteThread(threadId)}
/>
```

### ChatHistory

Conversation history and search:

```typescript
<ChatHistory
  userId={session.userId}
  searchQuery={searchTerm}
  dateRange={{ start: lastMonth, end: today }}
  includeArchived={false}
  onConversationSelect={(conversation) => {
    // Load conversation
    loadConversation(conversation.id);
  }}
  onExport={(format) => {
    // Export conversation history
    exportHistory(format);
  }}
/>
```

## Chat Features

### AI Integration

Built-in support for AI models and reasoning:

```typescript
// Automatic AI response handling
const chatService = new ChatApiClientImpl(client);

// Send message and get AI response
const response = await chatService.sendMessage({
  threadId: currentThread,
  content: userMessage,
  model: "claude-3-5-sonnet",
  tools: ["web-search", "calculator"],
  reasoning: true,
});
```

### Tool Execution

Support for AI tool calling and execution:

```typescript
// Tools are automatically executed during AI responses
const toolResponse = await chatService.executeTool({
  toolName: "web-search",
  parameters: { query: "latest news" },
  threadId: currentThread,
});
```

### Real-time Features

WebSocket integration for real-time updates:

```typescript
// Real-time message updates
const { messages, sendMessage, typing } = useChatRealtime(threadId);

// Typing indicators
const { setTyping } = useTypingIndicator(threadId, userId);
```

## Data Management

### Message Storage

Messages are stored in DynamoDB with proper indexing:

```typescript
interface ChatMessage {
  id: string;
  threadId: string;
  userId: string;
  content: string;
  type: "user" | "assistant" | "system";
  timestamp: string;
  metadata?: {
    model?: string;
    tokens?: number;
    tools?: string[];
    reasoning?: any;
  };
}
```

### Thread Management

Threads support hierarchical organization:

```typescript
interface ChatThread {
  id: string;
  userId: string;
  title: string;
  summary?: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  isArchived: boolean;
  tags: string[];
  applicationId?: string;
}
```

### Context Storage

Conversation context is maintained across sessions:

```typescript
interface ChatContext {
  threadId: string;
  documents: DocumentReference[];
  userProfile: UserProfile;
  memory: ConversationMemory;
  tools: AvailableTool[];
  settings: ChatSettings;
}
```

## Hooks

### useChatMessages

Hook for managing chat messages:

```typescript
import { useChatMessages } from "@captify/chat";

function ChatComponent() {
  const {
    messages,
    loading,
    error,
    sendMessage,
    editMessage,
    deleteMessage,
    loadMore,
    hasMore,
  } = useChatMessages(threadId);

  return (
    <div>
      {messages.map((message) => (
        <MessageComponent key={message.id} message={message} />
      ))}
      {hasMore && <button onClick={loadMore}>Load more messages</button>}
    </div>
  );
}
```

### useChatThread

Hook for thread management:

```typescript
import { useChatThread } from "@captify/chat";

function ThreadManager() {
  const {
    thread,
    threads,
    createThread,
    updateThread,
    deleteThread,
    archiveThread,
  } = useChatThread(userId);

  return (
    <div>
      <button onClick={() => createThread({ title: "New Chat" })}>
        New Thread
      </button>
      {threads.map((thread) => (
        <ThreadItem key={thread.id} thread={thread} />
      ))}
    </div>
  );
}
```

### useChatSettings

Hook for chat configuration:

```typescript
import { useChatSettings } from "@captify/chat";

function ChatSettings() {
  const { settings, updateSettings, resetSettings } = useChatSettings(userId);

  return (
    <div>
      <label>
        AI Model:
        <select
          value={settings.model}
          onChange={(e) => updateSettings({ model: e.target.value })}
        >
          <option value="claude-3-5-sonnet">Claude 3.5 Sonnet</option>
          <option value="gpt-4">GPT-4</option>
        </select>
      </label>
    </div>
  );
}
```

## TypeScript Configuration

**Ground Rule #2**: All code uses TypeScript strict mode with comprehensive type definitions:

```typescript
import type {
  ChatMessage,
  ChatThread,
  ChatSettings,
  ToolExecution,
  ConversationSummary,
  ChatContextValue,
  MessageReaction,
} from "@captify/chat";
```

## Integration with Core Package

The chat package integrates seamlessly with @captify/core:

```typescript
// Use core components and utilities
import { Button, Card, Input, Avatar } from "@captify/core/components/ui";
import { CaptifyClient } from "@captify/core/api/client";
import { useDebounce, useLocalStorage } from "@captify/core/hooks";
import { cn, generateUUID } from "@captify/core/lib";

// Combined usage
function EnhancedChat() {
  const client = new CaptifyClient({ session });
  const [preferences] = useLocalStorage("chat-preferences", {});
  const debouncedSearch = useDebounce(searchMessages, 300);

  return (
    <Card className={cn("chat-interface", preferences.theme)}>
      <ChatInterface client={client} />
    </Card>
  );
}
```

## Performance Optimization

1. **Message Virtualization**: Large message lists use virtual scrolling
2. **Lazy Loading**: Messages and threads load on demand
3. **Debounced Input**: Search and typing indicators are debounced
4. **Memoized Components**: Heavy components are memoized
5. **Connection Pooling**: WebSocket connections are efficiently managed

## Security Features

1. **Message Encryption**: All messages encrypted in transit and at rest
2. **User Isolation**: Users can only access their own conversations
3. **Content Filtering**: Automatic content moderation and filtering
4. **Rate Limiting**: Protection against spam and abuse
5. **Audit Logging**: All chat actions are logged for security

## TODO List

**Ground Rule #3**: All TODOs are tracked here in the README:

- [ ] Implement end-to-end encryption for sensitive conversations
- [ ] Add voice message recording and playback
- [ ] Create collaborative chat rooms and team messaging
- [ ] Implement message scheduling and delayed sending
- [ ] Add support for rich media messages (images, videos, documents)
- [ ] Create chat analytics and conversation insights
- [ ] Implement message translation and multi-language support
- [ ] Add support for chat bots and automated responses
- [ ] Create conversation templates and quick replies
- [ ] Implement message search with advanced filtering
- [ ] Add support for message threading and replies
- [ ] Create chat export and backup functionality
- [ ] Implement conversation sharing and collaboration
- [ ] Add support for custom chat themes and branding

## Related Packages

- `@captify/core` - Core utilities and components (required dependency)
- `@captify/api` - Server-side API utilities for chat backend
- `@captify/core` - Application management integration
