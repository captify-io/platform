# Feature 38: Chat Assistant (Cappy)

**Persona:** System
**Priority:** Medium
**Effort:** X-Large
**Status:** Sprint 3

## Overview
AI-powered chat assistant "Cappy" for natural language navigation, help, data queries, and task automation using conversational interface.

## Requirements
### Functional: Answer questions about system, Navigate to entities by description, Query data ("show my tasks"), Create entities via chat, Explain features, Context-aware suggestions, Multi-turn conversations
### Non-Functional: Response <2s, Support 1000+ concurrent chats, Context retention, Secure data access, Mobile chat UI

## Components
```typescript
// /opt/captify-apps/core/src/components/spaces/features/chat/chat-assistant.tsx (REUSABLE)
export function ChatAssistant()

// /opt/captify-apps/core/src/components/spaces/features/chat/chat-message.tsx (REUSABLE)
export function ChatMessage({ message }: { message: ChatMessage })

// /opt/captify-apps/core/src/components/spaces/features/chat/chat-suggestions.tsx (REUSABLE)
export function ChatSuggestions({ suggestions }: { suggestions: string[] })
```

## Actions
### 1. Send Chat Message
```typescript
interface SendChatMessageRequest {
  message: string;
  conversationId?: string;
  context?: {
    currentSpace?: string;
    currentWorkstream?: string;
    recentActions?: string[];
  };
}

interface ChatResponse {
  response: string;
  actions?: Array<{
    type: 'navigate' | 'create' | 'update' | 'query';
    payload: any;
  }>;
  suggestions?: string[];
}
```

**Implementation:**
```typescript
async function processChatMessage(
  message: string,
  context: ChatContext,
  credentials: AwsCredentials
): Promise<ChatResponse> {
  const systemPrompt = `You are Cappy, a helpful AI assistant for the Captify project management platform. You can:
1. Answer questions about features and how to use the system
2. Navigate users to the right place ("show me my tasks", "go to project X")
3. Query data ("how many tasks are in progress?")
4. Create entities ("create a task for user authentication")

Current context:
- User: ${context.userId}
- Space: ${context.currentSpace}
- Recent actions: ${context.recentActions}

Respond helpfully and concisely. If you need to perform an action, include it in your response.`;

  const aiResponse = await bedrock.invoke({
    modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: message }
    ]
  }, credentials);

  return {
    response: aiResponse.content,
    actions: parseActions(aiResponse.content),
    suggestions: generateSuggestions(context)
  };
}
```

## User Stories
### Story 1: User Asks Cappy for Help
**Tasks:** Open chat, ask "how do I create a task?", receive answer with steps
**Acceptance:** Cappy provides clear answer

### Story 2: User Navigates via Chat
**Tasks:** Type "show me high priority tasks", Cappy lists tasks or navigates
**Acceptance:** Navigation works correctly

## Dependencies: AWS Bedrock, All entity features
## Status: Sprint 3, Not Started
