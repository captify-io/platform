# User Stories: AI Daily Checkin (Feature 02)

**Feature**: AI Daily Checkin (Technical)
**Persona**: Technical (Doers)
**Priority**: P0 - Critical
**Sprint**: Phase 2, Week 4
**Estimated Effort**: 13 story points

## Feature Overview

AI-powered conversational daily standup assistant that guides technical users through their daily checkin, automatically identifying tasks from descriptions, extracting blockers, creating time entries, and generating structured summaries for managers.

## Ontology Dependencies

### Required Entities
- ✅ **Task** (`core-task`) - For task identification
- ✅ **TimeEntry** (`core-time-entry`) - For automatic time logging
- ✅ **Blocker** (`core-blocker`) - NEW - For blocker tracking
- ✅ **AgentThread** (`core-agent-thread`) - NEW - For conversation threads
- ✅ **AgentMessage** (`core-agent-message`) - NEW - For conversation messages

### Required Indexes
- ✅ `assignee-status-index` (GSI) on Task table
- ✅ `taskId-status-index` (GSI) on Blocker table
- ✅ `userId-createdAt-index` (GSI) on AgentThread table
- ✅ `threadId-timestamp-index` (GSI) on AgentMessage table

### Required Relationships
```typescript
// User → AgentThread (hasThreads)
edge-core-user-hasThreads-core-agent-thread

// AgentThread → AgentMessage (hasMessages)
edge-core-agent-thread-hasMessages-core-agent-message

// Task → Blocker (hasBlockers)
edge-core-task-hasBlockers-core-blocker

// User → TimeEntry (logged)
edge-core-user-logged-core-time-entry
```

---

## User Story 2.1: Daily Checkin Conversation

**As a** technical user
**I want to** chat with an AI agent for my daily standup
**So that** I can quickly log work and identify issues conversationally

### Implementation Tasks

#### Task 2.1.1: Create Blocker Ontology Node
**File**: `core/services/ontology/definitions/blocker.ts`

```typescript
import { OntologyNode } from '@captify-io/core/types'

export const blockerNode: OntologyNode = {
  id: 'core-blocker',
  name: 'Blocker',
  type: 'blocker',
  category: 'entity',
  domain: 'Work Management',
  description: 'Issue blocking task progress with severity tracking',
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
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
}
```

**Agent Tasks**:
1. Create ontology node definition file
2. Define complete schema with all properties
3. Define required GSI indexes
4. Register node in ontology system
5. Create DynamoDB table
6. Create indexes on table

#### Task 2.1.2: Create AgentThread Ontology Node
**File**: `core/services/ontology/definitions/agent-thread.ts`

```typescript
export const agentThreadNode: OntologyNode = {
  id: 'core-agent-thread',
  name: 'Agent Thread',
  type: 'agentThread',
  category: 'entity',
  domain: 'AI',
  description: 'Conversation thread with AI agent for daily checkins, request intake, or general assistance',
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
        metadata: {
          type: 'object',
          properties: {
            date: { type: 'string' },
            summary: { type: 'string' },
            tasksDiscussed: { type: 'array', items: { type: 'string' } },
            timeEntered: { type: 'number' },
            blockersIdentified: { type: 'number' }
          }
        },
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
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
}
```

**Agent Tasks**:
1. Create ontology node definition
2. Define metadata structure
3. Create DynamoDB table
4. Create indexes

#### Task 2.1.3: Create AgentMessage Ontology Node
**File**: `core/services/ontology/definitions/agent-message.ts`

```typescript
export const agentMessageNode: OntologyNode = {
  id: 'core-agent-message',
  name: 'Agent Message',
  type: 'agentMessage',
  category: 'entity',
  domain: 'AI',
  description: 'Message in agent conversation thread (user or AI assistant messages)',
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
        metadata: { type: 'object' },
        timestamp: { type: 'string', required: true }
      }
    },
    indexes: {
      'threadId-timestamp-index': {
        hashKey: 'threadId',
        rangeKey: 'timestamp',
        type: 'GSI'
      }
    }
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
}
```

**Agent Tasks**:
1. Create ontology node definition
2. Define tool call structure
3. Create DynamoDB table
4. Create index

#### Task 2.1.4: Create Daily Checkin Panel Component
**File**: `core/src/components/spaces/panels/technical/daily-checkin-panel.tsx`

```typescript
'use client'

import { useState } from 'react'
import { useSession } from '@captify-io/core/hooks'
import { useMutation, useQuery } from '@tanstack/react-query'
import { apiClient } from '@captify-io/core/lib/api'
import { Card, CardContent } from '@captify-io/core/components/ui/card'
import { ScrollArea } from '@captify-io/core/components/ui/scroll-area'
import { Input } from '@captify-io/core/components/ui/input'
import { Button } from '@captify-io/core/components/ui/button'
import { ChatMessage } from '../../items/chat-message'
import { TypingIndicator } from '../../items/typing-indicator'

export function DailyCheckinPanel() {
  const { user } = useSession()
  const [input, setInput] = useState('')
  const [threadId, setThreadId] = useState<string | null>(null)

  // Create thread on mount
  useEffect(() => {
    async function createThread() {
      const response = await apiClient.run({
        service: 'platform.agent',
        operation: 'createThread',
        data: {
          userId: user.id,
          agentId: 'agent-daily-checkin',
          type: 'daily-checkin',
          metadata: { date: new Date().toISOString().split('T')[0] }
        }
      })
      setThreadId(response.thread.id)
    }
    createThread()
  }, [user.id])

  // Load messages
  const { data: messages = [] } = useQuery({
    queryKey: ['agentMessages', threadId],
    queryFn: async () => {
      if (!threadId) return []
      return apiClient.run({
        service: 'platform.agent',
        operation: 'getMessages',
        data: { threadId }
      })
    },
    enabled: !!threadId
  })

  // Send message mutation
  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      return apiClient.run({
        service: 'platform.agent',
        operation: 'sendMessage',
        data: { threadId, content, userId: user.id }
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['agentMessages', threadId])
      setInput('')
    }
  })

  const handleSend = () => {
    if (input.trim()) {
      sendMutation.mutate(input)
    }
  }

  return (
    <Card className="flex flex-col h-[600px]">
      <CardContent className="flex-1 p-4">
        <ScrollArea className="h-full">
          <div className="space-y-4">
            {messages.map(message => (
              <ChatMessage key={message.id} message={message} />
            ))}
            {sendMutation.isPending && <TypingIndicator />}
          </div>
        </ScrollArea>

        <div className="flex gap-2 mt-4">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Tell me about your day..."
          />
          <Button onClick={handleSend} disabled={sendMutation.isPending}>
            Send
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
```

**Agent Tasks**:
1. Create chat interface component
2. Implement thread creation on mount
3. Load conversation history
4. Handle message sending with optimistic updates
5. Show typing indicator while waiting
6. Auto-scroll to latest message
7. Handle Enter key to send

#### Task 2.1.5: Create ChatMessage Component
**File**: `core/src/components/spaces/items/chat-message.tsx`

```typescript
interface ChatMessageProps {
  message: AgentMessage
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user'

  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div className={cn(
        'max-w-[80%] rounded-lg p-3',
        isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
      )}>
        {message.content}

        {message.toolCalls?.map(toolCall => (
          <ToolCallCard key={toolCall.id} toolCall={toolCall} />
        ))}
      </div>
    </div>
  )
}
```

**Agent Tasks**:
1. Create message bubble component
2. Style based on role (user vs assistant)
3. Display tool calls as cards
4. Add timestamp on hover
5. Support markdown in content

#### Task 2.1.6: Create TypingIndicator Component
**File**: `core/src/components/spaces/items/typing-indicator.tsx`

```typescript
export function TypingIndicator() {
  return (
    <div className="flex gap-1">
      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  )
}
```

**Agent Tasks**:
1. Create animated typing indicator
2. Use CSS animations for bounce effect
3. Make visually appealing

#### Task 2.1.7: Implement Create Thread API
**File**: `core/services/agent/thread.ts`

```typescript
import { dynamodb } from '@captify-io/core/services/aws'
import { AgentThread, AwsCredentials } from '@captify-io/core/types'

export async function createThread(
  params: { userId: string; agentId: string; type: string; metadata?: any },
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

**Agent Tasks**:
1. Implement create thread operation
2. Generate unique thread ID
3. Store in DynamoDB
4. Return created thread

#### Task 2.1.8: Implement Message Persistence
**File**: `core/services/agent/message.ts`

```typescript
export async function saveMessage(
  message: AgentMessage,
  credentials: AwsCredentials
): Promise<void> {
  await dynamodb.put({
    TableName: await resolveTableName('core-agent-message', process.env.SCHEMA!, credentials),
    Item: marshall(message)
  }, credentials)
}

export async function getMessages(
  threadId: string,
  credentials: AwsCredentials
): Promise<AgentMessage[]> {
  const result = await dynamodb.query({
    TableName: await resolveTableName('core-agent-message', process.env.SCHEMA!, credentials),
    IndexName: 'threadId-timestamp-index',
    KeyConditionExpression: 'threadId = :threadId',
    ExpressionAttributeValues: {
      ':threadId': { S: threadId }
    },
    ScanIndexForward: true  // Chronological order
  }, credentials)

  return result.Items?.map(item => unmarshall(item) as AgentMessage) || []
}
```

**Agent Tasks**:
1. Implement save message operation
2. Implement get messages query
3. Order by timestamp
4. Add pagination support

### Acceptance Criteria

- [ ] User can start new daily checkin
- [ ] Messages appear with correct role styling (user vs assistant)
- [ ] Typing indicator shows while agent responds
- [ ] Conversation history persists and loads correctly
- [ ] Thread metadata tracks date
- [ ] Component is fully responsive

### Testing Requirements

```typescript
describe('DailyCheckinPanel', () => {
  it('creates thread on mount', async () => {
    render(<DailyCheckinPanel />)

    await waitFor(() => {
      expect(mockApiClient.run).toHaveBeenCalledWith({
        service: 'platform.agent',
        operation: 'createThread',
        data: expect.objectContaining({ type: 'daily-checkin' })
      })
    })
  })

  it('sends message on Enter key', async () => {
    const { user } = setup(<DailyCheckinPanel />)
    const input = screen.getByPlaceholderText('Tell me about your day...')

    await user.type(input, 'I worked on OAuth{Enter}')

    expect(mockApiClient.run).toHaveBeenCalledWith({
      service: 'platform.agent',
      operation: 'sendMessage',
      data: expect.objectContaining({ content: 'I worked on OAuth' })
    })
  })
})
```

---

## User Story 2.2: Automatic Task Identification

**As a** technical user
**I want to** describe my work naturally
**So that** the agent finds matching tasks automatically

### Implementation Tasks

#### Task 2.2.1: Implement Semantic Task Search
**File**: `core/services/agent/semantic-search.ts`

```typescript
import OpenAI from 'openai'
import { Task, AwsCredentials } from '@captify-io/core/types'

export async function semanticTaskSearch(
  query: string,
  userId: string,
  credentials: AwsCredentials,
  limit: number = 5
): Promise<Array<{ task: Task; similarity: number }>> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  // Generate embedding for query
  const queryEmbedding = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: query
  })
  const queryVector = queryEmbedding.data[0].embedding

  // Get user's active tasks
  const tasks = await getActiveTasks(userId, credentials)

  // Compute similarity for each task
  const tasksWithSimilarity = await Promise.all(
    tasks.map(async (task) => {
      const taskText = `${task.title} ${task.description || ''}`
      const taskEmbedding = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: taskText
      })
      const taskVector = taskEmbedding.data[0].embedding

      const similarity = cosineSimilarity(queryVector, taskVector)

      return { task, similarity }
    })
  )

  return tasksWithSimilarity
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit)
    .filter(item => item.similarity > 0.7)  // Threshold
}

function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0)
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0))
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0))
  return dotProduct / (magnitudeA * magnitudeB)
}
```

**Agent Tasks**:
1. Install OpenAI SDK
2. Implement semantic search using embeddings
3. Calculate cosine similarity
4. Filter by similarity threshold
5. Add caching for task embeddings

#### Task 2.2.2: Add SearchTasks Tool to Agent
**File**: `core/services/agent/tools.ts`

```typescript
import { z } from 'zod'

export const searchTasksTool = {
  description: 'Search for tasks assigned to user by semantic similarity',
  parameters: z.object({
    query: z.string().describe('Natural language description of work'),
    userId: z.string()
  }),
  execute: async ({ query, userId }, credentials) => {
    return await semanticTaskSearch(query, userId, credentials)
  }
}
```

**Agent Tasks**:
1. Define tool schema with Zod
2. Integrate with semantic search
3. Return top 3 results
4. Include confidence scores

#### Task 2.2.3: Implement AI Agent with Tools
**File**: `core/services/agent/daily-checkin.ts`

```typescript
import { generateText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'

const DAILY_CHECKIN_PROMPT = `You are a helpful daily standup assistant for technical team members.

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
3. Today's plans`

export async function sendMessage(
  params: { threadId: string; content: string; userId: string },
  credentials: AwsCredentials
): Promise<{ message: AgentMessage; response: string; toolCalls?: any[] }> {
  const { threadId, content, userId } = params

  // Save user message
  const userMessage: AgentMessage = {
    id: `msg_${Date.now()}_user`,
    threadId,
    role: 'user',
    content,
    timestamp: new Date().toISOString()
  }
  await saveMessage(userMessage, credentials)

  // Get conversation history
  const history = await getMessages(threadId, credentials)

  // Generate response with tools
  const result = await generateText({
    model: anthropic('claude-3-5-sonnet-20241022'),
    system: DAILY_CHECKIN_PROMPT,
    messages: history.map(m => ({
      role: m.role,
      content: m.content
    })),
    tools: {
      searchTasks: searchTasksTool,
      createTimeEntry: createTimeEntryTool,
      createBlocker: createBlockerTool,
      updateTaskStatus: updateTaskStatusTool
    },
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
  await saveMessage(assistantMessage, credentials)

  return {
    message: assistantMessage,
    response: result.text,
    toolCalls: result.toolCalls
  }
}
```

**Agent Tasks**:
1. Install Vercel AI SDK (`ai` package)
2. Install Anthropic provider (`@ai-sdk/anthropic`)
3. Define system prompt
4. Implement sendMessage with tool support
5. Save messages before and after AI call
6. Handle tool execution results

#### Task 2.2.4: Create Task Preview Cards
**File**: `core/src/components/spaces/items/task-preview-card.tsx`

```typescript
export function TaskPreviewCard({ task, similarity }: { task: Task; similarity: number }) {
  return (
    <Card className="p-3 border-l-4 border-l-blue-500">
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-semibold">{task.title}</h4>
          <p className="text-sm text-muted-foreground">{task.description}</p>
        </div>
        <Badge variant="secondary">
          {Math.round(similarity * 100)}% match
        </Badge>
      </div>
    </Card>
  )
}
```

**Agent Tasks**:
1. Create preview card component
2. Display similarity score
3. Add visual indicator for confidence
4. Make clickable to view full task

### Acceptance Criteria

- [ ] Agent finds tasks from natural descriptions
- [ ] Returns top 3 most similar tasks
- [ ] Shows confidence scores (similarity %)
- [ ] Allows user to confirm or reject matches
- [ ] Handles "task not found" gracefully
- [ ] Suggests creating new task if no match

---

## User Story 2.3: Automatic Time Entry

**As a** technical user
**I want to** have time entries created from conversation
**So that** I don't need separate time tracking

### Implementation Tasks

#### Task 2.3.1: Implement Create Time Entry Service
**File**: `core/services/space/time-entry.ts`

```typescript
export async function createTimeEntry(
  params: { userId: string; taskId: string; hours: number; description: string; date: string },
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

**Agent Tasks**:
1. Implement create operation
2. Validate hours (max 24 per day)
3. Check for duplicates
4. Return created entry

#### Task 2.3.2: Add CreateTimeEntry Tool
**File**: `core/services/agent/tools.ts`

```typescript
export const createTimeEntryTool = {
  description: 'Create time entry for work done',
  parameters: z.object({
    taskId: z.string(),
    hours: z.number().min(0.25).max(24),
    description: z.string(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
  }),
  execute: async (params, credentials, context) => {
    return await createTimeEntry({
      ...params,
      userId: context.userId
    }, credentials)
  }
}
```

**Agent Tasks**:
1. Define tool schema with validation
2. Integrate with createTimeEntry service
3. Return created entry to AI

#### Task 2.3.3: Create Time Entry Preview Card
**File**: `core/src/components/spaces/items/time-entry-card.tsx`

```typescript
export function TimeEntryCard({ entry }: { entry: TimeEntry }) {
  return (
    <Card className="p-3 bg-green-50 border-green-200">
      <div className="flex items-center gap-2">
        <ClockIcon className="w-4 h-4 text-green-600" />
        <span className="font-semibold">{entry.hours}h logged</span>
        <span className="text-sm text-muted-foreground">{entry.description}</span>
      </div>
    </Card>
  )
}
```

**Agent Tasks**:
1. Create preview card
2. Show in chat as tool call result
3. Add visual confirmation
4. Link to task

#### Task 2.3.4: Implement Duplicate Detection
**Agent Tasks**:
1. Check for existing time entries on same date + task
2. Warn user before creating duplicate
3. Allow override if intentional
4. Sum daily hours and warn if >24

#### Task 2.3.5: Add Time Entry Validation
**Agent Tasks**:
1. Validate hours between 0.25 and 24
2. Validate date is not in future
3. Validate task exists and user is assigned
4. Return clear error messages

### Acceptance Criteria

- [ ] Time entries created from confirmed tasks
- [ ] Shows preview before saving
- [ ] Validates time is reasonable (0.25-24 hours)
- [ ] Warns about duplicates
- [ ] Prevents future dates
- [ ] Updates daily total in real-time

---

## User Story 2.4: Blocker Identification

**As a** technical user
**I want to** have blockers automatically recorded
**So that** my manager knows issues immediately

### Implementation Tasks

#### Task 2.4.1: Implement Create Blocker Service
**File**: `core/services/space/blocker.ts`

```typescript
export async function createBlocker(
  params: { taskId: string; userId: string; description: string; severity: string },
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

  // Create blocker
  await dynamodb.put({
    TableName: await resolveTableName('core-blocker', process.env.SCHEMA!, credentials),
    Item: marshall(blocker)
  }, credentials)

  // Update task status to blocked
  await updateTaskStatus(
    { taskId: params.taskId, status: 'blocked', blockerReason: params.description },
    credentials
  )

  return blocker
}
```

**Agent Tasks**:
1. Implement create blocker operation
2. Automatically update task status to 'blocked'
3. Store blocker reason in task
4. Return created blocker

#### Task 2.4.2: Add CreateBlocker Tool
**File**: `core/services/agent/tools.ts`

```typescript
export const createBlockerTool = {
  description: 'Record a blocker preventing task progress',
  parameters: z.object({
    taskId: z.string(),
    description: z.string(),
    severity: z.enum(['low', 'medium', 'high', 'critical'])
  }),
  execute: async (params, credentials, context) => {
    return await createBlocker({
      ...params,
      userId: context.userId
    }, credentials)
  }
}
```

**Agent Tasks**:
1. Define tool schema
2. Classify severity from description
3. Integrate with create blocker service

#### Task 2.4.3: Implement Severity Classification
**Agent Tasks**:
1. Add logic to AI prompt to classify severity
2. High: Prevents all progress
3. Medium: Slows progress significantly
4. Low: Minor inconvenience
5. Critical: Blocks multiple tasks/people

#### Task 2.4.4: Create Blocker Preview Card
**File**: `core/src/components/spaces/items/blocker-card.tsx`

```typescript
export function BlockerCard({ blocker }: { blocker: Blocker }) {
  const severityColors = {
    low: 'bg-yellow-50 border-yellow-200',
    medium: 'bg-orange-50 border-orange-200',
    high: 'bg-red-50 border-red-200',
    critical: 'bg-red-100 border-red-400'
  }

  return (
    <Card className={cn('p-3', severityColors[blocker.severity])}>
      <div className="flex items-start gap-2">
        <AlertTriangleIcon className="w-5 h-5 text-red-600 mt-0.5" />
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold">Blocker Created</span>
            <Badge variant="destructive">{blocker.severity}</Badge>
          </div>
          <p className="text-sm mt-1">{blocker.description}</p>
        </div>
      </div>
    </Card>
  )
}
```

**Agent Tasks**:
1. Create blocker card component
2. Color code by severity
3. Show alert icon
4. Display description

#### Task 2.4.5: Send Manager Notification
**Agent Tasks**:
1. Create notification when blocker created
2. Target task assignee's manager
3. Include task details and blocker severity
4. Link to task in notification

### Acceptance Criteria

- [ ] Agent detects blocker mentions in conversation
- [ ] Classifies severity appropriately
- [ ] Creates blocker record in database
- [ ] Updates task status to 'blocked'
- [ ] Stores blocker reason in task
- [ ] Notifies manager immediately
- [ ] Shows preview card in chat

---

## Dependencies

### Upstream (Must Complete First)
- Feature 01 (Home Dashboard) - Task entity

### Downstream (Uses This)
- Feature 06 (Activity Stream) - Shows checkin activity
- Feature 07 (Team Dashboard) - Shows team blockers

### External Dependencies
- Vercel AI SDK (`ai`)
- Anthropic provider (`@ai-sdk/anthropic`)
- OpenAI SDK (for embeddings)
- DynamoDB tables: `core-agent-thread`, `core-agent-message`, `core-blocker`

---

## Implementation Checklist

### Phase 1: Foundation
- [ ] Create Blocker ontology node and table
- [ ] Create AgentThread ontology node and table
- [ ] Create AgentMessage ontology node and table
- [ ] Create all required indexes
- [ ] Test table queries

### Phase 2: AI Integration
- [ ] Install Vercel AI SDK and Anthropic provider
- [ ] Implement semantic task search
- [ ] Define agent tools (search, create time, create blocker)
- [ ] Implement sendMessage with tool execution
- [ ] Test AI responses and tool calls

### Phase 3: Components
- [ ] Create DailyCheckinPanel
- [ ] Create ChatMessage component
- [ ] Create TypingIndicator
- [ ] Create TaskPreviewCard
- [ ] Create TimeEntryCard
- [ ] Create BlockerCard

### Phase 4: Services
- [ ] Implement createThread service
- [ ] Implement saveMessage service
- [ ] Implement getMessages service
- [ ] Implement createTimeEntry service
- [ ] Implement createBlocker service

### Phase 5: Testing
- [ ] Unit tests for semantic search
- [ ] Integration tests for AI tools
- [ ] E2E test for full checkin flow
- [ ] Test blocker creation and notifications
- [ ] Test time entry validation

---

**Status**: Ready for Implementation
**Next Steps**: Begin with Phase 1 - Create ontology nodes and tables
