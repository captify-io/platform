# Chat Interface Requirements

_References: [README.md](./README.md) for overall architecture_

## 🎯 **Overview**

The Chat Interface provides real-time conversations with Bedrock AI agents within the context of specific applications. Each chat session represents a decision-making process where users provide context, ask questions, and work toward outcomes with AI assistance.

## 📊 **Graph Data Model**

### **Entities in Neptune**

```gremlin
// Session entity
g.addV('Session')
  .property('id', uuid())
  .property('title', 'Strategic Planning for Q2 2025')
  .property('description', 'Analyzing market conditions and setting strategic priorities')
  .property('status', 'active')  // active, completed, archived
  .property('sessionType', 'decision') // decision, exploration, analysis
  .property('bedrockSessionId', 'bedrock-session-123')
  .property('createdAt', datetime())
  .property('updatedAt', datetime())
  .property('completedAt', null)

// Message entity
g.addV('Message')
  .property('id', uuid())
  .property('role', 'user')  // user, assistant, system
  .property('content', 'What are the key market trends we should consider?')
  .property('tokens', 250)
  .property('bedrockTraceId', 'trace-456')
  .property('createdAt', datetime())

// Context entity (attached to messages)
g.addV('Context')
  .property('id', uuid())
  .property('type', 'document') // document, data, external
  .property('source', 'Market Research Report Q1 2025.pdf')
  .property('relevanceScore', 0.85)
  .property('extractedAt', datetime())

// Decision entity (outcome of session)
g.addV('Decision')
  .property('id', uuid())
  .property('title', 'Q2 Strategic Priorities')
  .property('description', 'Focus on AI integration and market expansion')
  .property('confidence', 0.9)
  .property('reasoning', 'Based on market analysis and competitive landscape...')
  .property('status', 'approved') // draft, proposed, approved, rejected
  .property('decidedAt', datetime())
```

### **Relationships**

```gremlin
// Session relationships
g.V().hasLabel('Session')
  .addE('BELONGS_TO').to(g.V().hasLabel('Application'))
  .addE('PARTICIPATED_BY').to(g.V().hasLabel('User'))
  .addE('USES_AGENT').to(g.V().hasLabel('Agent'))

// Message relationships
g.V().hasLabel('Message')
  .addE('IN_SESSION').to(g.V().hasLabel('Session'))
  .addE('REFERENCES').to(g.V().hasLabel('Context'))
  .addE('LEADS_TO').to(g.V().hasLabel('Decision'))

// Context relationships
g.V().hasLabel('Context')
  .addE('DERIVED_FROM').to(g.V().hasLabel('Document'))
  .addE('INFLUENCES').to(g.V().hasLabel('Message'))
```

## 🔧 **Features & Requirements**

### **1. Real-Time Chat Interface**

**Chat UI Components:**

- Message bubbles (user vs assistant styling)
- Typing indicators during agent processing
- Message timestamps and metadata
- Token usage tracking
- Context indicators (showing what context influenced response)

**Message Types:**

- **User Messages**: Text input, file attachments, context references
- **Assistant Messages**: AI responses, citations, suggested actions
- **System Messages**: Session start/end, context updates, errors

**Real-Time Features:**

- Streaming responses from Bedrock agents
- Live typing indicators
- Message delivery status
- Auto-scroll to latest messages

### **2. Session Management**

**Session Lifecycle:**

```typescript
interface SessionState {
  status: "active" | "completed" | "archived";
  startedAt: Date;
  lastActivity: Date;
  completedAt?: Date;
  messageCount: number;
  tokenUsage: number;
  contextItems: number;
}
```

**Session Operations:**

- Create new session with application
- Resume existing sessions
- Archive completed sessions
- Share sessions with team members
- Export session history

**Session Metadata:**

- Title generation based on conversation
- Automatic tagging based on content
- Duration tracking
- Outcome classification

### **3. Context Integration**

**Context Sources:**

- Uploaded documents (PDFs, Word, text files)
- Structured data (CSV, JSON)
- External APIs and databases
- Previous session outcomes
- Organizational knowledge base

**Context Injection:**

- Automatic context relevance scoring
- User-selected context for specific messages
- Dynamic context based on conversation flow
- Context provenance tracking

**Context Display:**

- Context panel showing relevant documents
- Inline context citations in responses
- Context influence indicators
- Source document links

### **4. Agent Interaction**

**Bedrock Integration:**

```typescript
interface ChatRequest {
  sessionId: string;
  message: string;
  contextIds?: string[];
  agentConfig: {
    agentId: string;
    aliasId: string;
    temperature?: number;
    maxTokens?: number;
  };
  sessionState?: {
    attributes: Record<string, string>;
    promptAttributes: Record<string, string>;
  };
}
```

**Agent Capabilities:**

- Multi-turn conversations with memory
- Context-aware responses
- Citation generation
- Suggested follow-up questions
- Action recommendations

**Error Handling:**

- Agent unavailability fallbacks
- Token limit warnings
- Context processing errors
- Network interruption recovery

## 🔌 **API Endpoints**

### **Session Management API (`/api/sessions`)**

```typescript
// GET /api/sessions
// List user's sessions
{
  application_id?: string;
  status?: 'active' | 'completed' | 'archived';
  limit?: number;
  offset?: number;
}

// POST /api/sessions
// Create new session
{
  application_id: string;
  title?: string;
  description?: string;
  initial_context?: string[];
}

// GET /api/sessions/{id}
// Get session details with messages

// PUT /api/sessions/{id}
// Update session metadata
{
  title?: string;
  description?: string;
  status?: string;
}

// DELETE /api/sessions/{id}
// Archive session
```

### **Chat API (`/api/chat`)**

```typescript
// POST /api/chat
// Send message to agent
{
  session_id: string;
  message: string;
  context_ids?: string[];
  stream?: boolean;
}

// GET /api/chat/{session_id}/messages
// Get conversation history
{
  limit?: number;
  before?: string; // message ID for pagination
}

// POST /api/chat/{session_id}/context
// Add context to session
{
  context_type: 'document' | 'data' | 'external';
  context_data: any;
}
```

### **Streaming API (`/api/chat/stream`)**

- Server-Sent Events for real-time responses
- Chunked response processing
- Token-by-token streaming display
- Error handling in stream

## 🎨 **UI Components**

### **1. Chat Layout**

```
┌─────────────────────────────────────────────────────────┐
│ Session Header (Title, Status, Actions)                │
├─────────────────┬───────────────────────────────────────┤
│ Context Panel   │ Chat Messages                         │
│ - Documents     │ ┌─────────────────────────────────────┐ │
│ - Data Sources  │ │ User: What should our strategy be?  │ │
│ - Previous      │ └─────────────────────────────────────┘ │
│   Sessions      │ ┌─────────────────────────────────────┐ │
│                 │ │ AI: Based on the context...         │ │
│                 │ │ [Citations: Doc1, Doc2]             │ │
│                 │ └─────────────────────────────────────┘ │
├─────────────────┼───────────────────────────────────────┤
│ Context Upload  │ Message Input                         │
│ Quick Actions   │ [Send] [Attach] [Voice]              │
└─────────────────┴───────────────────────────────────────┘
```

### **2. Message Components**

- **UserMessage**: Text content, timestamp, edit capability
- **AssistantMessage**: AI response, citations, actions, feedback
- **SystemMessage**: Status updates, context changes
- **MessageActions**: Copy, share, bookmark, follow-up

### **3. Context Panel**

- Document list with relevance scores
- Quick upload area
- Context search and filtering
- Context history and versions

### **4. Session Controls**

- New session button
- Session title editing
- Status management (active/complete)
- Export and sharing options
- Session settings

## 🔄 **Graph Queries**

### **Session Queries**

```gremlin
// Get user's active sessions
g.V().hasLabel('User').has('cognitoUserId', userId)
  .in('PARTICIPATED_BY')
  .hasLabel('Session')
  .has('status', 'active')
  .order().by('updatedAt', desc)

// Get session with messages and context
g.V().hasLabel('Session').has('id', sessionId)
  .as('session')
  .in('IN_SESSION')
  .hasLabel('Message')
  .order().by('createdAt', asc)
  .as('messages')
  .select('session', 'messages')

// Find related sessions by context
g.V().hasLabel('Session').has('id', sessionId)
  .in('IN_SESSION')
  .out('REFERENCES')
  .in('REFERENCES')
  .out('IN_SESSION')
  .hasLabel('Session')
  .dedup()
```

### **Context Queries**

```gremlin
// Get relevant context for message
g.V().hasLabel('Message').has('id', messageId)
  .out('REFERENCES')
  .hasLabel('Context')
  .order().by('relevanceScore', desc)

// Find context patterns across sessions
g.V().hasLabel('Context')
  .in('REFERENCES')
  .out('IN_SESSION')
  .groupCount().by('status')
```

## 🚀 **Implementation Priority**

### **Phase 1 (Week 1)**

1. Basic chat UI layout
2. Session creation and management
3. Simple message exchange with Bedrock
4. Message persistence in Neptune

### **Phase 2 (Week 2)**

1. Real-time streaming responses
2. Context panel and document upload
3. Context injection into conversations
4. Session history and navigation

### **Phase 3 (Week 3)**

1. Advanced context management
2. Citation and provenance tracking
3. Session sharing and collaboration
4. Mobile responsive design

## 🧪 **Testing Strategy**

**Unit Tests:**

- Message creation and persistence
- Context scoring algorithms
- Session state management
- API request/response handling

**Integration Tests:**

- End-to-end chat flow
- Bedrock agent integration
- Context injection accuracy
- Real-time streaming

**Performance Tests:**

- Message loading speed
- Large context handling
- Concurrent session support
- Database query optimization

## 📊 **Analytics & Metrics**

**User Engagement:**

- Messages per session
- Session duration
- Context usage patterns
- Agent response quality ratings

**System Performance:**

- Response time latency
- Token usage efficiency
- Context processing speed
- Error rates and recovery

**Business Metrics:**

- Decision completion rate
- User satisfaction scores
- Session outcome quality
- Knowledge base growth
