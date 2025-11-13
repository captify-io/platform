# Feature 02: AI Daily Checkin (Technical)

**Persona**: Technical (Doers)
**Priority**: P0 - Critical
**Effort**: 13 story points

---

## Requirements

### Functional Requirements
- FR1: Conversational AI agent guides daily standup
- FR2: Automatically identifies completed tasks from description
- FR3: Extracts blockers and creates blocker records
- FR4: Creates time entries for work mentioned
- FR5: Links work to existing tasks via semantic search
- FR6: Generates structured summary for manager
- FR7: Stores conversation in thread for history
- FR8: Suggests missing time entries based on task status

### Non-Functional Requirements
- NFR1: Response time <2s per message
- NFR2: 95% accuracy on task identification
- NFR3: Works offline with queue sync
- NFR4: Accessible via chat interface
- NFR5: WCAG 2.1 AA compliant

---

## Ontology

### Nodes Used
```typescript
// Primary entities
Task {
  id: string
  assignee: string
  title: string
  status: 'ready' | 'in-progress' | 'blocked' | 'completed'
  estimatedHours?: number
}

TimeEntry {
  id: string
  userId: string
  taskId: string
  date: string
  hours: number
  description: string
}

Blocker {
  id: string
  taskId: string
  userId: string
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'open' | 'in-progress' | 'resolved'
  createdAt: string
}

AgentThread {
  id: string
  userId: string
  agentId: string
  type: 'daily-checkin'
  metadata: {
    date: string
    summary?: string
    tasksDiscussed: string[]
    timeEntered: number
    blockersIdentified: number
  }
}

AgentMessage {
  id: string
  threadId: string
  role: 'user' | 'assistant'
  content: string
  toolCalls?: ToolCall[]
  timestamp: string
}
```

### Edges Used
```typescript
// User → TimeEntry
{
  source: 'user',
  target: 'time-entry',
  relation: 'logged',
  type: 'one-to-many'
}

// Task → TimeEntry
{
  source: 'task',
  target: 'time-entry',
  relation: 'hasTimeEntries',
  type: 'one-to-many'
}

// Task → Blocker
{
  source: 'task',
  target: 'blocker',
  relation: 'hasBlockers',
  type: 'one-to-many'
}

// User → AgentThread
{
  source: 'user',
  target: 'agent-thread',
  relation: 'hasThreads',
  type: 'one-to-many'
}

// AgentThread → AgentMessage
{
  source: 'agent-thread',
  target: 'agent-message',
  relation: 'hasMessages',
  type: 'one-to-many'
}
```

### New Ontology Nodes Required

```typescript
// Add to core/services/ontology/definitions/blocker.ts
export const blockerNode: OntologyNode = {
  id: 'core-blocker',
  name: 'Blocker',
  type: 'blocker',
  category: 'entity',
  domain: 'Work Management',
  description: 'Issue blocking task progress',
  icon: 'AlertTriangle',
  color: '#ef4444',
  active: 'true',
  properties: {
    dataSource: 'core-blocker',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        taskId: { type: 'string', required: true },
        userId: { type: 'string', required: true },
        description: { type: 'string', required: true },
        severity: {
          type: 'string',
          enum: ['low', 'medium', 'high', 'critical'],
          required: true
        },
        status: {
          type: 'string',
          enum: ['open', 'in-progress', 'resolved'],
          required: true
        },
        resolvedAt: { type: 'string' },
        resolvedBy: { type: 'string' }
      }
    },
    indexes: {
      'taskId-status-index': {
        hashKey: 'taskId',
        rangeKey: 'status',
        type: 'GSI'
      },
      'userId-createdAt-index': {
        hashKey: 'userId',
        rangeKey: 'createdAt',
        type: 'GSI'
      }
    }
  }
}

// Add to core/services/ontology/definitions/agent-thread.ts
export const agentThreadNode: OntologyNode = {
  id: 'core-agent-thread',
  name: 'Agent Thread',
  type: 'agentThread',
  category: 'entity',
  domain: 'AI',
  description: 'Conversation thread with AI agent',
  icon: 'MessageSquare',
  color: '#8b5cf6',
  active: 'true',
  properties: {
    dataSource: 'core-agent-thread',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        userId: { type: 'string', required: true },
        agentId: { type: 'string', required: true },
        type: {
          type: 'string',
          enum: ['daily-checkin', 'request-intake', 'general'],
          required: true
        },
        metadata: { type: 'object' },
        status: {
          type: 'string',
          enum: ['active', 'completed', 'abandoned']
        }
      }
    },
    indexes: {
      'userId-createdAt-index': {
        hashKey: 'userId',
        rangeKey: 'createdAt',
        type: 'GSI'
      },
      'type-index': {
        hashKey: 'type',
        type: 'GSI'
      }
    }
  }
}

// Add to core/services/ontology/definitions/agent-message.ts
export const agentMessageNode: OntologyNode = {
  id: 'core-agent-message',
  name: 'Agent Message',
  type: 'agentMessage',
  category: 'entity',
  domain: 'AI',
  description: 'Message in agent conversation',
  icon: 'MessageCircle',
  color: '#8b5cf6',
  active: 'true',
  properties: {
    dataSource: 'core-agent-message',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        threadId: { type: 'string', required: true },
        role: {
          type: 'string',
          enum: ['user', 'assistant', 'system'],
          required: true
        },
        content: { type: 'string', required: true },
        toolCalls: { type: 'array' },
        metadata: { type: 'object' }
      }
    },
    indexes: {
      'threadId-timestamp-index': {
        hashKey: 'threadId',
        rangeKey: 'timestamp',
        type: 'GSI'
      }
    }
  }
}
```

---

## Components

### Reuse Existing Captify Components
```typescript
// From @captify-io/core/components/ui
import { Card, CardHeader, CardContent } from '@captify-io/core/components/ui/card'
import { Button } from '@captify-io/core/components/ui/button'
import { ScrollArea } from '@captify-io/core/components/ui/scroll-area'
import { Input } from '@captify-io/core/components/ui/input'
import { Badge } from '@captify-io/core/components/ui/badge'
import { Skeleton } from '@captify-io/core/components/ui/skeleton'

// From @captify-io/core/services
import { agentService } from '@captify-io/core/services/agent'
import { apiClient } from '@captify-io/core/lib/api'

// From @captify-io/core/hooks
import { useSession } from '@captify-io/core/hooks'
```

### New Components to Create
```
/components/spaces/panels/technical/
  daily-checkin-panel.tsx       # Main chat interface

/components/spaces/items/
  chat-message.tsx              # Message bubble (REUSABLE)
  typing-indicator.tsx          # Agent typing animation (REUSABLE)
  time-entry-card.tsx           # Time entry preview (REUSABLE)
  blocker-card.tsx              # Blocker preview (REUSABLE)

/components/spaces/widgets/
  checkin-summary.tsx           # Daily summary widget
```

---

## Actions

### Create Daily Checkin Thread
```typescript
// Service: platform.agent
// Operation: createThread

interface CreateThreadRequest {
  service: 'platform.agent'
  operation: 'createThread'
  data: {
    userId: string
    agentId: string
    type: 'daily-checkin'
    metadata: {
      date: string
    }
  }
}

interface CreateThreadResponse {
  thread: AgentThread
}

// Implementation in /services/agent.ts
export async function createThread(
  params: { userId: string, agentId: string, type: string, metadata?: any },
  credentials: AwsCredentials
): Promise<AgentThread> {
  const threadId = `thread_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  const thread: AgentThread = {
    id: threadId,
    userId: params.userId,
    agentId: params.agentId,
    type: params.type,
    metadata: params.metadata || {},
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }

  await dynamodb.put({
    TableName: await resolveTableName('core-agent-thread', process.env.SCHEMA!, credentials),
    Item: marshall(thread)
  }, credentials)

  return thread
}
```

### Send Message with Tools
```typescript
// Service: platform.agent
// Operation: sendMessage

interface SendMessageRequest {
  service: 'platform.agent'
  operation: 'sendMessage'
  data: {
    threadId: string
    content: string
    userId: string
  }
}

interface SendMessageResponse {
  message: AgentMessage
  response: string
  toolCalls?: Array<{
    toolName: string
    parameters: any
    result: any
  }>
}

// Implementation using Vercel AI SDK
import { generateText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'

export async function sendMessage(
  params: { threadId: string, content: string, userId: string },
  credentials: AwsCredentials
): Promise<SendMessageResponse> {
  const { threadId, content, userId } = params

  // Save user message
  const userMessage: AgentMessage = {
    id: `msg_${Date.now()}_user`,
    threadId,
    role: 'user',
    content,
    timestamp: new Date().toISOString()
  }

  await dynamodb.put({
    TableName: await resolveTableName('core-agent-message', process.env.SCHEMA!, credentials),
    Item: marshall(userMessage)
  }, credentials)

  // Get conversation history
  const history = await getThreadMessages(threadId, credentials)

  // Define agent tools
  const tools = {
    searchTasks: {
      description: 'Search for tasks assigned to user by semantic similarity',
      parameters: z.object({
        query: z.string().describe('Natural language description of work'),
        userId: z.string()
      }),
      execute: async ({ query, userId }) => {
        return await semanticTaskSearch(query, userId, credentials)
      }
    },
    createTimeEntry: {
      description: 'Create time entry for work done',
      parameters: z.object({
        taskId: z.string(),
        hours: z.number(),
        description: z.string(),
        date: z.string()
      }),
      execute: async (params) => {
        return await createTimeEntry(params, credentials)
      }
    },
    createBlocker: {
      description: 'Record a blocker preventing task progress',
      parameters: z.object({
        taskId: z.string(),
        description: z.string(),
        severity: z.enum(['low', 'medium', 'high', 'critical'])
      }),
      execute: async (params) => {
        return await createBlocker({ ...params, userId }, credentials)
      }
    },
    updateTaskStatus: {
      description: 'Update task status',
      parameters: z.object({
        taskId: z.string(),
        status: z.enum(['ready', 'in-progress', 'blocked', 'completed'])
      }),
      execute: async (params) => {
        return await updateTaskStatus(params, credentials)
      }
    }
  }

  // Generate response with tools
  const result = await generateText({
    model: anthropic('claude-3-5-sonnet-20241022'),
    system: dailyCheckinSystemPrompt,
    messages: history.map(m => ({
      role: m.role,
      content: m.content
    })),
    tools,
    maxToolRoundtrips: 5
  })

  // Save assistant response
  const assistantMessage: AgentMessage = {
    id: `msg_${Date.now()}_assistant`,
    threadId,
    role: 'assistant',
    content: result.text,
    toolCalls: result.toolCalls?.map(tc => ({
      toolName: tc.toolName,
      parameters: tc.args
    })),
    timestamp: new Date().toISOString()
  }

  await dynamodb.put({
    TableName: await resolveTableName('core-agent-message', process.env.SCHEMA!, credentials),
    Item: marshall(assistantMessage)
  }, credentials)

  return {
    message: assistantMessage,
    response: result.text,
    toolCalls: result.toolCalls
  }
}

// System prompt for daily checkin agent
const dailyCheckinSystemPrompt = `You are a helpful daily standup assistant for technical team members.

Your role:
1. Ask about work completed yesterday
2. Identify tasks from descriptions using searchTasks tool
3. Create time entries for work mentioned using createTimeEntry
4. Ask about blockers and create blocker records if mentioned
5. Ask about plans for today
6. Be conversational, friendly, and efficient

When the user describes work:
- Use searchTasks to find matching tasks
- If found, confirm and create time entry
- If not found, ask for clarification or suggest creating new task

When blockers are mentioned:
- Use createBlocker with appropriate severity
- Update task status to 'blocked' if needed

Keep responses concise. Guide the conversation efficiently through:
1. Yesterday's work
2. Any blockers
3. Today's plans
`
```

### Semantic Task Search
```typescript
// Service: platform.space
// Operation: semanticTaskSearch

interface SemanticTaskSearchRequest {
  service: 'platform.space'
  operation: 'semanticTaskSearch'
  data: {
    query: string
    userId: string
    limit?: number
  }
}

interface SemanticTaskSearchResponse {
  tasks: Array<{
    task: Task
    similarity: number
  }>
}

// Implementation using OpenAI embeddings
import { OpenAI } from 'openai'

export async function semanticTaskSearch(
  query: string,
  userId: string,
  credentials: AwsCredentials,
  limit: number = 5
): Promise<Array<{ task: Task, similarity: number }>> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  // Generate embedding for query
  const queryEmbedding = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: query
  })
  const queryVector = queryEmbedding.data[0].embedding

  // Get user's active tasks
  const tasksResult = await dynamodb.query({
    TableName: await resolveTableName('core-task', process.env.SCHEMA!, credentials),
    IndexName: 'assignee-status-index',
    KeyConditionExpression: 'assignee = :userId',
    FilterExpression: '#status IN (:ready, :inProgress, :blocked)',
    ExpressionAttributeNames: { '#status': 'status' },
    ExpressionAttributeValues: {
      ':userId': { S: userId },
      ':ready': { S: 'ready' },
      ':inProgress': { S: 'in-progress' },
      ':blocked': { S: 'blocked' }
    }
  }, credentials)

  const tasks = tasksResult.Items?.map(item => unmarshall(item) as Task) || []

  // Compute similarity for each task
  const tasksWithSimilarity = await Promise.all(
    tasks.map(async (task) => {
      // Generate embedding for task (title + description)
      const taskText = `${task.title} ${task.description || ''}`
      const taskEmbedding = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: taskText
      })
      const taskVector = taskEmbedding.data[0].embedding

      // Compute cosine similarity
      const similarity = cosineSimilarity(queryVector, taskVector)

      return { task, similarity }
    })
  )

  // Sort by similarity and return top N
  return tasksWithSimilarity
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit)
}

function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0)
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0))
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0))
  return dotProduct / (magnitudeA * magnitudeB)
}
```

### Create Time Entry
```typescript
// Service: platform.space
// Operation: createTimeEntry

interface CreateTimeEntryRequest {
  service: 'platform.space'
  operation: 'createTimeEntry'
  data: {
    userId: string
    taskId: string
    hours: number
    description: string
    date: string
  }
}

export async function createTimeEntry(
  params: { userId: string, taskId: string, hours: number, description: string, date: string },
  credentials: AwsCredentials
): Promise<TimeEntry> {
  const timeEntry: TimeEntry = {
    id: `time_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId: params.userId,
    taskId: params.taskId,
    hours: params.hours,
    description: params.description,
    date: params.date,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }

  await dynamodb.put({
    TableName: await resolveTableName('core-time-entry', process.env.SCHEMA!, credentials),
    Item: marshall(timeEntry)
  }, credentials)

  return timeEntry
}
```

### Create Blocker
```typescript
// Service: platform.space
// Operation: createBlocker

interface CreateBlockerRequest {
  service: 'platform.space'
  operation: 'createBlocker'
  data: {
    taskId: string
    userId: string
    description: string
    severity: 'low' | 'medium' | 'high' | 'critical'
  }
}

export async function createBlocker(
  params: { taskId: string, userId: string, description: string, severity: string },
  credentials: AwsCredentials
): Promise<Blocker> {
  const blocker: Blocker = {
    id: `blocker_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    taskId: params.taskId,
    userId: params.userId,
    description: params.description,
    severity: params.severity as any,
    status: 'open',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }

  await dynamodb.put({
    TableName: await resolveTableName('core-blocker', process.env.SCHEMA!, credentials),
    Item: marshall(blocker)
  }, credentials)

  return blocker
}
```

---

## User Stories & Tasks

### Story 1: Daily Checkin Conversation
**As a** technical user
**I want to** chat with AI agent for daily standup
**So that** I can quickly log work and identify issues

**Tasks**:
- [ ] Task 1.1: Create daily-checkin-panel.tsx component
- [ ] Task 1.2: Implement chat-message.tsx with role-based styling
- [ ] Task 1.3: Add typing-indicator.tsx animation
- [ ] Task 1.4: Implement createThread API operation
- [ ] Task 1.5: Implement sendMessage with Vercel AI SDK
- [ ] Task 1.6: Create agent-thread and agent-message ontology nodes
- [ ] Task 1.7: Add message persistence to DynamoDB
- [ ] Task 1.8: Implement conversation history loading

**Acceptance Criteria**:
- [ ] User can start new daily checkin
- [ ] Messages appear with correct role styling
- [ ] Typing indicator shows while agent responds
- [ ] Conversation history persists

---

### Story 2: Automatic Task Identification
**As a** technical user
**I want to** describe my work naturally
**So that** the agent finds matching tasks

**Tasks**:
- [ ] Task 2.1: Implement semanticTaskSearch using OpenAI embeddings
- [ ] Task 2.2: Add searchTasks tool to agent
- [ ] Task 2.3: Create task embedding generation
- [ ] Task 2.4: Implement cosine similarity calculation
- [ ] Task 2.5: Add task preview cards in chat
- [ ] Task 2.6: Handle "task not found" scenarios

**Acceptance Criteria**:
- [ ] Agent finds tasks from natural descriptions
- [ ] Returns top 3 most similar tasks
- [ ] Shows confidence scores
- [ ] Allows user to confirm or reject

---

### Story 3: Automatic Time Entry
**As a** technical user
**I want to** time entries created from conversation
**So that** I don't need separate time tracking

**Tasks**:
- [ ] Task 3.1: Implement createTimeEntry API operation
- [ ] Task 3.2: Add createTimeEntry tool to agent
- [ ] Task 3.3: Create time-entry-card.tsx preview
- [ ] Task 3.4: Add confirmation before creating entry
- [ ] Task 3.5: Handle duplicate time entry detection
- [ ] Task 3.6: Add time entry validation (max 24hrs/day)

**Acceptance Criteria**:
- [ ] Time entries created from confirmed tasks
- [ ] Shows preview before saving
- [ ] Validates time is reasonable
- [ ] Warns about duplicates

---

### Story 4: Blocker Identification
**As a** technical user
**I want to** blockers automatically recorded
**So that** my manager knows issues immediately

**Tasks**:
- [ ] Task 4.1: Create blocker ontology node
- [ ] Task 4.2: Implement createBlocker API operation
- [ ] Task 4.3: Add createBlocker tool to agent
- [ ] Task 4.4: Create blocker-card.tsx preview
- [ ] Task 4.5: Add severity classification logic
- [ ] Task 4.6: Update task status to 'blocked' when blocker created
- [ ] Task 4.7: Send notification to manager

**Acceptance Criteria**:
- [ ] Agent detects blocker mentions
- [ ] Classifies severity appropriately
- [ ] Creates blocker record
- [ ] Updates task status
- [ ] Notifies manager

---

## Implementation Notes

### Agent Configuration

Use Vercel AI SDK with Claude 3.5 Sonnet:
```typescript
import { generateText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'

const result = await generateText({
  model: anthropic('claude-3-5-sonnet-20241022'),
  system: dailyCheckinSystemPrompt,
  messages: conversationHistory,
  tools: {
    searchTasks,
    createTimeEntry,
    createBlocker,
    updateTaskStatus
  },
  maxToolRoundtrips: 5
})
```

### Embedding Cache Strategy

Cache task embeddings to avoid regenerating:
```typescript
interface TaskEmbedding {
  taskId: string
  embedding: number[]
  text: string  // For cache invalidation
  createdAt: string
}

// Store in core-task-embedding table
// Invalidate when task title/description changes
```

### Chat UI State Management

```typescript
const [messages, setMessages] = useState<AgentMessage[]>([])
const [isTyping, setIsTyping] = useState(false)

const sendMessage = async (content: string) => {
  // Add user message optimistically
  setMessages(prev => [...prev, { role: 'user', content }])
  setIsTyping(true)

  try {
    const response = await apiClient.run({
      service: 'platform.agent',
      operation: 'sendMessage',
      data: { threadId, content, userId }
    })

    setMessages(prev => [...prev, response.message])
  } finally {
    setIsTyping(false)
  }
}
```

### Tool Call Visualization

Show tool calls in chat as structured cards:
```typescript
{toolCalls?.map(tc => (
  <ToolCallCard key={tc.id}>
    <Icon name={getToolIcon(tc.toolName)} />
    <div>
      <h4>{getToolTitle(tc.toolName)}</h4>
      <pre>{JSON.stringify(tc.parameters, null, 2)}</pre>
      {tc.result && <ResultPreview result={tc.result} />}
    </div>
  </ToolCallCard>
))}
```

### Accessibility

- Chat messages use proper ARIA roles and labels
- Keyboard navigation: Tab through messages, Enter to send
- Screen reader announcements for new messages
- Focus management when messages arrive

---

## Testing

### Unit Tests
```typescript
describe('SemanticTaskSearch', () => {
  it('finds tasks by semantic similarity', async () => {
    const results = await semanticTaskSearch(
      'worked on login feature',
      'user-123',
      mockCredentials
    )

    expect(results).toHaveLength(3)
    expect(results[0].task.title).toContain('OAuth')
    expect(results[0].similarity).toBeGreaterThan(0.8)
  })

  it('returns empty array when no similar tasks', async () => {
    const results = await semanticTaskSearch(
      'completely unrelated work',
      'user-123',
      mockCredentials
    )

    expect(results).toHaveLength(0)
  })
})

describe('DailyCheckinAgent', () => {
  it('creates time entry from work description', async () => {
    const response = await sendMessage({
      threadId: 'thread-1',
      content: 'I spent 3 hours on the OAuth integration',
      userId: 'user-123'
    }, mockCredentials)

    expect(response.toolCalls).toContainEqual(
      expect.objectContaining({
        toolName: 'createTimeEntry',
        parameters: expect.objectContaining({
          hours: 3,
          taskId: expect.any(String)
        })
      })
    )
  })

  it('identifies and creates blockers', async () => {
    const response = await sendMessage({
      threadId: 'thread-1',
      content: 'I am blocked because the API credentials are missing',
      userId: 'user-123'
    }, mockCredentials)

    expect(response.toolCalls).toContainEqual(
      expect.objectContaining({
        toolName: 'createBlocker',
        parameters: expect.objectContaining({
          severity: 'high',
          description: expect.stringContaining('API credentials')
        })
      })
    )
  })
})
```

### Integration Tests
```typescript
describe('Daily Checkin Flow', () => {
  it('completes full daily standup conversation', async () => {
    // Create thread
    const thread = await createThread({
      userId: 'user-123',
      agentId: 'agent-daily-checkin',
      type: 'daily-checkin',
      metadata: { date: '2025-10-31' }
    }, credentials)

    // User describes work
    const msg1 = await sendMessage({
      threadId: thread.id,
      content: 'Yesterday I completed the login page',
      userId: 'user-123'
    }, credentials)

    expect(msg1.toolCalls).toBeDefined()

    // Agent asks about time
    const msg2 = await sendMessage({
      threadId: thread.id,
      content: 'About 4 hours',
      userId: 'user-123'
    }, credentials)

    // Verify time entry created
    const timeEntries = await getTimeEntries('user-123', '2025-10-30', credentials)
    expect(timeEntries).toHaveLength(1)
    expect(timeEntries[0].hours).toBe(4)
  })
})
```

---

## Dependencies
- Vercel AI SDK (ai package)
- @ai-sdk/anthropic
- OpenAI SDK (embeddings)
- DynamoDB tables: core-agent-thread, core-agent-message, core-blocker
- TimeEntry ontology node (from Feature 01)
- Task ontology node (from Feature 01)

---

**Status**: Ready for Implementation
**Sprint**: Phase 2, Week 4
