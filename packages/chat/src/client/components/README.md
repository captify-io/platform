# Chat Components

React components for building comprehensive chat and messaging interfaces within the Captify platform.

## Overview

This directory contains all React components needed to build chat applications, from basic message interfaces to advanced AI-powered conversation systems with tool execution and reasoning displays.

## Core Components

### `ChatInterface.tsx`

The main chat component that provides a complete chat experience with AI integration.

**Features:**

- Complete chat interface with message history
- AI model integration and tool calling
- Real-time typing indicators
- File upload and attachment support
- Voice input capabilities
- Markdown rendering and code highlighting

**Usage:**

```typescript
import { ChatInterface } from "@captify/chat/components";

function App() {
  return (
    <ChatInterface
      applicationId="my-app"
      userId={session.userId}
      threadId={currentThread}
      placeholder="Ask me anything..."
      enableMarkdown={true}
      enableCodeHighlighting={true}
      enableFileUpload={true}
      enableVoiceInput={false}
      maxMessageLength={4000}
      aiModel="claude-3-5-sonnet"
      availableTools={["web-search", "calculator", "file-reader"]}
      onMessageSend={(message) => handleMessageSend(message)}
      onThreadChange={(threadId) => setCurrentThread(threadId)}
      onToolExecute={(tool, params) => handleToolExecution(tool, params)}
    />
  );
}
```

### `ChatLayout.tsx`

Layout wrapper that provides the structure for chat applications.

**Features:**

- Responsive layout with customizable panels
- Header and footer integration
- Sidebar and context panel support
- Theme and styling integration

**Usage:**

```typescript
import { ChatLayout } from "@captify/chat/components";

function ChatApp() {
  return (
    <ChatLayout
      title="AI Assistant"
      subtitle="Powered by Captify"
      showHeader={true}
      showFooter={true}
      showSidebar={true}
      sidebarWidth={280}
      className="custom-chat-layout"
    >
      <ChatInterface {...props} />
    </ChatLayout>
  );
}
```

### `ChatContent.tsx`

Core message display and input area for chat conversations.

**Features:**

- Message list with virtual scrolling
- Message input with rich text support
- Typing indicators and message status
- Message reactions and interactions
- Context menu for message actions

**Usage:**

```typescript
import { ChatContent } from "@captify/chat/components";

function MessageArea() {
  return (
    <ChatContent
      threadId={currentThread}
      messages={messages}
      isLoading={false}
      placeholder="Type your message..."
      showTimestamps={true}
      showUserAvatars={true}
      enableMessageReactions={true}
      enableMessageEditing={true}
      enableMessageMenu={true}
      onMessageSend={(content) => sendMessage(content)}
      onMessageEdit={(messageId, newContent) =>
        editMessage(messageId, newContent)
      }
      onMessageReact={(messageId, reaction) => addReaction(messageId, reaction)}
      onMessageDelete={(messageId) => deleteMessage(messageId)}
    />
  );
}
```

### `ChatHeader.tsx`

Header component for chat interfaces with title, actions, and status.

**Features:**

- Chat title and subtitle display
- Action buttons and menu
- Online status and participant count
- Thread information and metadata

**Usage:**

```typescript
import { ChatHeader } from "@captify/chat/components";

function ChatTopBar() {
  return (
    <ChatHeader
      title={thread?.title || "New Chat"}
      subtitle={`${participants.length} participants`}
      showParticipants={true}
      showSettings={true}
      showArchive={true}
      actions={[
        {
          icon: "share",
          label: "Share",
          onClick: () => shareConversation(),
        },
        {
          icon: "download",
          label: "Export",
          onClick: () => exportConversation(),
        },
      ]}
      onTitleEdit={(newTitle) => updateThreadTitle(newTitle)}
      onSettingsClick={() => openSettings()}
    />
  );
}
```

### `ChatFooter.tsx`

Footer component with input controls and actions.

**Features:**

- Message input with rich text formatting
- File upload and attachment controls
- Voice input and recording
- Send button with keyboard shortcuts
- Typing indicator display

**Usage:**

```typescript
import { ChatFooter } from "@captify/chat/components";

function ChatInputArea() {
  return (
    <ChatFooter
      value={currentMessage}
      placeholder="Type a message..."
      maxLength={4000}
      enableFileUpload={true}
      enableVoiceInput={true}
      enableFormatting={true}
      showCharacterCount={true}
      onSend={(message) => handleSend(message)}
      onChange={(value) => setCurrentMessage(value)}
      onFileUpload={(files) => handleFileUpload(files)}
      onVoiceRecord={(audioBlob) => handleVoiceMessage(audioBlob)}
    />
  );
}
```

## Specialized Components

### `ThreadList.tsx`

Thread/conversation management sidebar component.

**Features:**

- List of user conversations
- Search and filtering
- Thread creation and management
- Archive and delete actions
- Real-time updates

**Usage:**

```typescript
import { ThreadList } from "@captify/chat/components";

function ConversationSidebar() {
  return (
    <ThreadList
      userId={session.userId}
      threads={userThreads}
      activeThreadId={currentThread}
      searchQuery={searchTerm}
      showSearch={true}
      showCreateButton={true}
      showArchived={false}
      groupByDate={true}
      maxThreads={100}
      onThreadSelect={(thread) => setCurrentThread(thread.id)}
      onThreadCreate={() => createNewThread()}
      onThreadArchive={(threadId) => archiveThread(threadId)}
      onThreadDelete={(threadId) => deleteThread(threadId)}
      onSearchChange={(query) => setSearchTerm(query)}
    />
  );
}
```

### `ContextPanel.tsx`

Context and information panel for AI conversations.

**Features:**

- Document and file context display
- User profile and preferences
- Conversation memory and history
- System information and status

**Usage:**

```typescript
import { ContextPanel } from "@captify/chat/components";

function ConversationContext() {
  return (
    <ContextPanel
      threadId={currentThread}
      userId={session.userId}
      showDocuments={true}
      showMemory={true}
      showUserProfile={true}
      showSystemInfo={false}
      maxDocuments={10}
      onDocumentAdd={(doc) => addContextDocument(doc)}
      onDocumentRemove={(docId) => removeContextDocument(docId)}
      onMemoryUpdate={(memory) => updateConversationMemory(memory)}
    />
  );
}
```

### `ToolsPanel.tsx`

AI tools and capabilities panel.

**Features:**

- Available tools display
- Tool execution status
- Tool results and output
- Tool configuration and settings

**Usage:**

```typescript
import { ToolsPanel } from "@captify/chat/components";

function AIToolsPanel() {
  return (
    <ToolsPanel
      threadId={currentThread}
      availableTools={[
        "web-search",
        "calculator",
        "file-reader",
        "code-executor",
      ]}
      executingTools={currentlyExecutingTools}
      toolResults={recentToolResults}
      showToolStatus={true}
      showToolHistory={true}
      onToolExecute={(tool, params) => executeAITool(tool, params)}
      onToolCancel={(executionId) => cancelToolExecution(executionId)}
      onToolConfigure={(tool, config) => configureAITool(tool, config)}
    />
  );
}
```

### `ReasoningPanel.tsx`

AI reasoning and thought process display panel.

**Features:**

- AI reasoning steps display
- Confidence scores and metrics
- Decision tree visualization
- Model performance information

**Usage:**

```typescript
import { ReasoningPanel } from "@captify/chat/components";

function AIReasoningDisplay() {
  return (
    <ReasoningPanel
      threadId={currentThread}
      showThoughtProcess={true}
      showConfidenceScores={true}
      showDecisionTree={true}
      showPerformanceMetrics={false}
      onReasoningExpand={(step) => expandReasoningStep(step)}
      onMetricsView={() => showDetailedMetrics()}
    />
  );
}
```

### `ChatHistory.tsx`

Conversation history and search component.

**Features:**

- Historical conversation browsing
- Advanced search and filtering
- Date range selection
- Export and backup options

**Usage:**

```typescript
import { ChatHistory } from "@captify/chat/components";

function ConversationHistory() {
  return (
    <ChatHistory
      userId={session.userId}
      searchQuery={historySearchTerm}
      dateRange={{ start: lastMonth, end: today }}
      includeArchived={showArchived}
      maxResults={50}
      groupBy="date"
      onConversationSelect={(conversation) => loadConversation(conversation.id)}
      onExport={(format, conversations) =>
        exportConversations(format, conversations)
      }
      onDelete={(conversationIds) => deleteConversations(conversationIds)}
      onSearchChange={(query) => setHistorySearchTerm(query)}
    />
  );
}
```

### `ChatSettings.tsx`

Chat configuration and preferences component.

**Features:**

- AI model selection
- Chat preferences and settings
- Theme and appearance options
- Privacy and security settings

**Usage:**

```typescript
import { ChatSettings } from "@captify/chat/components";

function ChatConfiguration() {
  return (
    <ChatSettings
      userId={session.userId}
      currentSettings={chatSettings}
      availableModels={["claude-3-5-sonnet", "gpt-4", "llama-2"]}
      availableThemes={["light", "dark", "auto"]}
      onSettingsChange={(newSettings) => updateChatSettings(newSettings)}
      onModelChange={(model) => switchAIModel(model)}
      onThemeChange={(theme) => updateChatTheme(theme)}
      onReset={() => resetToDefaults()}
    />
  );
}
```

## Layout Components

### `ResizeableChatPanel.tsx`

**Moved to `@captify/client`** - Resizable panel component for flexible chat layouts.

**Features:**

- Horizontal and vertical resizing
- Minimum and maximum size constraints
- Persistent panel sizes
- Smooth resize animations

**Usage:**

```typescript
import { ResizableChatPanel } from "@captify/client";

function FlexibleChatLayout() {
  return (
    <div className="flex h-screen">
      <ResizableChatPanel
        minWidth={280}
        maxWidth={600}
        defaultWidth={320}
        applicationName="My App"
        agentId="agent-123"
        agentAliasId="alias-456"
      />
    </div>
  );
}
```

### `ChatPanel.tsx`

Generic panel component for chat-related content.

**Features:**

- Collapsible panel with header
- Custom content area
- Action buttons and controls
- Responsive design

## Data Integration

All components work with real data from the platform:

### Message Data Structure

```typescript
interface ChatMessage {
  id: string;
  threadId: string;
  userId: string;
  content: string;
  type: "user" | "assistant" | "system" | "tool";
  timestamp: string;
  metadata?: {
    model?: string;
    tokens?: number;
    tools?: ToolExecution[];
    reasoning?: ReasoningStep[];
    attachments?: FileAttachment[];
  };
}
```

### Thread Data Structure

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
  participants: string[];
  applicationId?: string;
}
```

## Performance Optimization

Components are optimized for performance:

- **Virtual Scrolling**: For large message lists
- **Lazy Loading**: Messages load on demand
- **Memoization**: Expensive renders are memoized
- **Debounced Input**: Search and typing are debounced
- **Efficient Updates**: Only changed messages re-render

## Accessibility

All components follow accessibility best practices:

- **Keyboard Navigation**: Full keyboard support
- **Screen Reader Support**: Proper ARIA labels
- **Focus Management**: Logical focus flow
- **Color Contrast**: WCAG 2.1 AA compliance
- **Voice Support**: Voice input and output

## TODO List

- [ ] Add comprehensive unit tests for all components
- [ ] Implement keyboard shortcuts for common actions
- [ ] Add animation and transition improvements
- [ ] Create mobile-optimized versions of components
- [ ] Implement advanced message formatting options
- [ ] Add support for message templates and quick replies
- [ ] Create emoji and reaction picker components
- [ ] Implement message search highlighting
- [ ] Add support for message drafts and auto-save
- [ ] Create collaborative editing for shared messages
