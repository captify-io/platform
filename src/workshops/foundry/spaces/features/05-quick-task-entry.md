# Feature 05: Quick Task Entry (Technical)

**Persona**: Technical (Doers)
**Priority**: P1 - High
**Effort**: 3 story points

---

## Requirements

### Functional Requirements
- FR1: Command palette (Cmd+K) for quick task creation
- FR2: Natural language parsing ("2h fix login bug @high")
- FR3: Auto-assign to current user
- FR4: Default to current space or allow space selection
- FR5: Keyboard-only workflow (no mouse needed)
- FR6: Task template suggestions based on history
- FR7: Quick actions: start timer, add to today

### Non-Functional Requirements
- NFR1: Open palette in <100ms
- NFR2: Natural language parsing accuracy >90%
- NFR3: Keyboard accessible (Tab, Enter, Esc)
- NFR4: Mobile fallback (floating action button)

---

## Ontology

### Nodes Used
```typescript
Task {
  id: string
  spaceId: string
  assignee: string
  title: string
  status: 'ready' | 'in-progress'
  priority: 'critical' | 'high' | 'medium' | 'low'
  estimatedHours?: number
}

Space {
  id: string
  name: string
}
```

### Edges Used
```typescript
// User → Task
{
  source: 'user',
  target: 'task',
  relation: 'assignedTo',
  type: 'one-to-many'
}

// Space → Task
{
  source: 'space',
  target: 'task',
  relation: 'contains',
  type: 'one-to-many'
}
```

### New Ontology Nodes Required
None - uses existing Task and Space nodes

---

## Components

### Reuse Existing Captify Components
```typescript
// From @captify-io/core/components/ui
import { Dialog, DialogContent } from '@captify-io/core/components/ui/dialog'
import { Input } from '@captify-io/core/components/ui/input'
import { Badge } from '@captify-io/core/components/ui/badge'
import { Command, CommandInput, CommandList, CommandItem } from '@captify-io/core/components/ui/command'

// From @captify-io/core/lib
import { apiClient } from '@captify-io/core/lib/api'

// From @captify-io/core/hooks
import { useSession } from '@captify-io/core/hooks'
```

### New Components to Create
```
/components/spaces/dialogs/
  quick-task-dialog.tsx         # Command palette (REUSABLE)

/components/spaces/widgets/
  task-template-suggestion.tsx  # Template suggestions (REUSABLE)

/lib/
  nl-task-parser.ts             # Natural language parser (REUSABLE)
```

---

## Actions

### Parse Task from Natural Language
```typescript
// Service: platform.space
// Operation: parseTaskInput

interface ParseTaskInputRequest {
  service: 'platform.space'
  operation: 'parseTaskInput'
  data: {
    input: string
  }
}

interface ParseTaskInputResponse {
  title: string
  estimatedHours?: number
  priority?: 'critical' | 'high' | 'medium' | 'low'
  dueDate?: string
  tags?: string[]
}

// Client-side implementation (no API call needed)
export function parseTaskInput(input: string): ParseTaskInputResponse {
  let title = input
  let estimatedHours: number | undefined
  let priority: 'critical' | 'high' | 'medium' | 'low' | undefined
  let dueDate: string | undefined
  const tags: string[] = []

  // Extract estimated hours: "2h", "3.5h", "30m"
  const hoursMatch = input.match(/(\d+(?:\.\d+)?)\s*(h|hr|hrs|hour|hours)/i)
  if (hoursMatch) {
    estimatedHours = parseFloat(hoursMatch[1])
    title = title.replace(hoursMatch[0], '').trim()
  }

  const minutesMatch = input.match(/(\d+)\s*(m|min|mins|minute|minutes)/i)
  if (minutesMatch) {
    estimatedHours = parseInt(minutesMatch[1]) / 60
    title = title.replace(minutesMatch[0], '').trim()
  }

  // Extract priority: "@critical", "@high", "@medium", "@low"
  const priorityMatch = input.match(/@(critical|high|medium|low)/i)
  if (priorityMatch) {
    priority = priorityMatch[1].toLowerCase() as any
    title = title.replace(priorityMatch[0], '').trim()
  }

  // Extract due date: "by friday", "due tomorrow", "on 2025-11-01"
  const dueDateMatch = input.match(/(?:by|due|on)\s+(\w+|\d{4}-\d{2}-\d{2})/i)
  if (dueDateMatch) {
    dueDate = parseDateString(dueDateMatch[1])
    title = title.replace(dueDateMatch[0], '').trim()
  }

  // Extract tags: "#bugfix", "#feature"
  const tagMatches = input.matchAll(/#(\w+)/g)
  for (const match of tagMatches) {
    tags.push(match[1])
    title = title.replace(match[0], '').trim()
  }

  // Clean up extra whitespace
  title = title.replace(/\s+/g, ' ').trim()

  return { title, estimatedHours, priority, dueDate, tags }
}

function parseDateString(dateStr: string): string {
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const lowerDate = dateStr.toLowerCase()

  if (lowerDate === 'today') {
    return today.toISOString().split('T')[0]
  } else if (lowerDate === 'tomorrow') {
    return tomorrow.toISOString().split('T')[0]
  } else if (lowerDate === 'friday' || lowerDate.match(/^(mon|tue|wed|thu|fri|sat|sun)/)) {
    // Find next occurrence of day
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const targetDay = days.findIndex(d => d.startsWith(lowerDate))
    const currentDay = today.getDay()
    const daysUntil = (targetDay - currentDay + 7) % 7 || 7
    const targetDate = new Date(today)
    targetDate.setDate(targetDate.getDate() + daysUntil)
    return targetDate.toISOString().split('T')[0]
  } else if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return dateStr
  }

  return today.toISOString().split('T')[0]
}
```

### Create Task (Quick Entry)
```typescript
// Service: platform.space
// Operation: createTask

// Already defined in Feature 03, reuse implementation
```

### Get Task Templates
```typescript
// Service: platform.space
// Operation: getTaskTemplates

interface GetTaskTemplatesRequest {
  service: 'platform.space'
  operation: 'getTaskTemplates'
  data: {
    userId: string
    limit?: number
  }
}

interface GetTaskTemplatesResponse {
  templates: Array<{
    title: string
    frequency: number
    lastUsed: string
  }>
}

// Implementation: Analyze user's task history to find common patterns
export async function getTaskTemplates(
  params: { userId: string, limit?: number },
  credentials: AwsCredentials
): Promise<Array<{ title: string, frequency: number, lastUsed: string }>> {
  // Get user's recent tasks
  const result = await dynamodb.query({
    TableName: await resolveTableName('core-task', process.env.SCHEMA!, credentials),
    IndexName: 'assignee-status-index',
    KeyConditionExpression: 'assignee = :userId',
    ExpressionAttributeValues: {
      ':userId': { S: params.userId }
    },
    Limit: 100,
    ScanIndexForward: false  // Most recent first
  }, credentials)

  const tasks = result.Items?.map(item => unmarshall(item) as Task) || []

  // Group by similar titles (simple word matching)
  const titleGroups = new Map<string, { count: number, lastUsed: string }>()

  for (const task of tasks) {
    // Normalize title (lowercase, remove numbers/dates)
    const normalized = task.title
      .toLowerCase()
      .replace(/\d+/g, '')
      .replace(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/gi, '')
      .trim()

    const existing = titleGroups.get(normalized)
    if (existing) {
      existing.count++
      if (task.createdAt > existing.lastUsed) {
        existing.lastUsed = task.createdAt
      }
    } else {
      titleGroups.set(normalized, { count: 1, lastUsed: task.createdAt })
    }
  }

  // Convert to array and sort by frequency
  const templates = Array.from(titleGroups.entries())
    .filter(([_, data]) => data.count > 1)  // Only templates used more than once
    .map(([title, data]) => ({
      title,
      frequency: data.count,
      lastUsed: data.lastUsed
    }))
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, params.limit || 5)

  return templates
}
```

---

## User Stories & Tasks

### Story 1: Command Palette
**As a** technical user
**I want to** open a quick task entry with Cmd+K
**So that** I can create tasks without leaving my keyboard

**Tasks**:
- [ ] Task 1.1: Create quick-task-dialog.tsx component
- [ ] Task 1.2: Use Command component from Captify UI
- [ ] Task 1.3: Add global keyboard listener for Cmd+K
- [ ] Task 1.4: Implement dialog open/close state
- [ ] Task 1.5: Add Escape key to close
- [ ] Task 1.6: Focus input when opened
- [ ] Task 1.7: Add mobile floating action button fallback
- [ ] Task 1.8: Add portal for overlay

**Acceptance Criteria**:
- [ ] Cmd+K opens dialog instantly
- [ ] Escape closes dialog
- [ ] Input is auto-focused
- [ ] Works across all pages
- [ ] Mobile shows FAB instead

---

### Story 2: Natural Language Parsing
**As a** technical user
**I want to** type task in natural language
**So that** I don't need separate fields for each property

**Tasks**:
- [ ] Task 2.1: Create nl-task-parser.ts utility
- [ ] Task 2.2: Implement hours extraction (2h, 30m)
- [ ] Task 2.3: Implement priority extraction (@high, @critical)
- [ ] Task 2.4: Implement due date extraction (by friday, due tomorrow)
- [ ] Task 2.5: Implement tag extraction (#bugfix)
- [ ] Task 2.6: Add parseTaskInput function
- [ ] Task 2.7: Show parsed properties as badges below input
- [ ] Task 2.8: Allow editing parsed properties

**Acceptance Criteria**:
- [ ] "2h fix login @high" extracts hours=2, priority=high, title="fix login"
- [ ] "Update docs by friday" extracts dueDate=<next friday>
- [ ] Parsed properties shown as removable badges
- [ ] Can click badge to edit

---

### Story 3: Task Templates
**As a** technical user
**I want to** see suggestions based on my task history
**So that** I can quickly create recurring tasks

**Tasks**:
- [ ] Task 3.1: Implement getTaskTemplates API operation
- [ ] Task 3.2: Create task-template-suggestion.tsx component
- [ ] Task 3.3: Show templates below input as user types
- [ ] Task 3.4: Add fuzzy search filtering
- [ ] Task 3.5: Arrow keys to navigate suggestions
- [ ] Task 3.6: Enter to select template
- [ ] Task 3.7: Click to select template
- [ ] Task 3.8: Show template usage frequency

**Acceptance Criteria**:
- [ ] Shows top 5 most frequent task patterns
- [ ] Filters as user types
- [ ] Keyboard navigation with arrows
- [ ] Enter selects highlighted template
- [ ] Shows "Used 5 times" badge

---

### Story 4: Quick Actions
**As a** technical user
**I want to** start timer or add to today when creating task
**So that** I can immediately begin work

**Tasks**:
- [ ] Task 4.1: Add action buttons below input
- [ ] Task 4.2: Add "Create & Start Timer" button
- [ ] Task 4.3: Add "Create & Add to Today" button
- [ ] Task 4.4: Implement combined create+startTimer mutation
- [ ] Task 4.5: Add keyboard shortcuts (Cmd+Enter for create & start)
- [ ] Task 4.6: Show success notification
- [ ] Task 4.7: Close dialog after creation
- [ ] Task 4.8: Option to create another task

**Acceptance Criteria**:
- [ ] "Create & Start Timer" creates task and starts timer
- [ ] "Create & Add to Today" creates and sets status=in-progress
- [ ] Cmd+Enter creates and starts timer
- [ ] Shift+Enter creates task only
- [ ] Success toast appears
- [ ] Dialog closes or resets for next task

---

## Implementation Notes

### Command Palette Component

```typescript
'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent } from '@captify-io/core/components/ui/dialog'
import { Command, CommandInput, CommandList, CommandItem } from '@captify-io/core/components/ui/command'
import { Badge } from '@captify-io/core/components/ui/badge'
import { parseTaskInput } from '@/lib/nl-task-parser'

export function QuickTaskDialog() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const parsed = parseTaskInput(input)

  // Global keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen(true)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const handleCreate = async (startTimer: boolean = false) => {
    // Create task
    const task = await createTaskMutation.mutateAsync({
      title: parsed.title,
      estimatedHours: parsed.estimatedHours,
      priority: parsed.priority || 'medium',
      dueDate: parsed.dueDate
    })

    // Optionally start timer
    if (startTimer) {
      await startTimerMutation.mutateAsync({ taskId: task.id })
    }

    setOpen(false)
    setInput('')
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <Command>
          <CommandInput
            placeholder="Create task: e.g., '2h fix login bug @high by friday'"
            value={input}
            onValueChange={setInput}
          />

          {/* Parsed properties */}
          {input && (
            <div className="flex gap-2 p-2 border-t">
              <span className="text-sm text-muted-foreground">Parsed:</span>
              {parsed.estimatedHours && (
                <Badge variant="secondary">{parsed.estimatedHours}h</Badge>
              )}
              {parsed.priority && (
                <Badge variant={getPriorityColor(parsed.priority)}>
                  {parsed.priority}
                </Badge>
              )}
              {parsed.dueDate && (
                <Badge variant="outline">{parsed.dueDate}</Badge>
              )}
            </div>
          )}

          {/* Task templates */}
          <CommandList>
            {templates.map(template => (
              <CommandItem
                key={template.title}
                onSelect={() => setInput(template.title)}
              >
                {template.title}
                <Badge variant="ghost" className="ml-auto">
                  Used {template.frequency}x
                </Badge>
              </CommandItem>
            ))}
          </CommandList>

          {/* Actions */}
          <div className="flex gap-2 p-3 border-t">
            <Button onClick={() => handleCreate(false)}>
              Create Task
            </Button>
            <Button onClick={() => handleCreate(true)} variant="secondary">
              Create & Start Timer
            </Button>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  )
}
```

### Keyboard Shortcuts

```typescript
// In command palette
useEffect(() => {
  const down = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleCreate(true)  // Cmd+Enter = create & start timer
    } else if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault()
      handleCreate(false)  // Shift+Enter = create only
    }
  }

  document.addEventListener('keydown', down)
  return () => document.removeEventListener('keydown', down)
}, [input])
```

### Mobile Floating Action Button

```typescript
// On mobile: show FAB instead of Cmd+K
import { useMediaQuery } from '@captify-io/core/hooks/use-mobile'

export function QuickTaskFAB() {
  const isMobile = useMediaQuery('(max-width: 768px)')
  const [open, setOpen] = useState(false)

  if (!isMobile) return null

  return (
    <>
      <button
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg"
        onClick={() => setOpen(true)}
      >
        <PlusIcon className="w-6 h-6 mx-auto" />
      </button>

      <QuickTaskDialog open={open} onOpenChange={setOpen} />
    </>
  )
}
```

---

## Testing

### Unit Tests
```typescript
describe('NL Task Parser', () => {
  it('extracts hours from input', () => {
    const result = parseTaskInput('2h fix login bug')
    expect(result.estimatedHours).toBe(2)
    expect(result.title).toBe('fix login bug')
  })

  it('extracts priority from input', () => {
    const result = parseTaskInput('Update docs @high')
    expect(result.priority).toBe('high')
    expect(result.title).toBe('Update docs')
  })

  it('extracts due date from input', () => {
    const result = parseTaskInput('Review PR by friday')
    expect(result.dueDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(result.title).toBe('Review PR')
  })

  it('extracts all properties', () => {
    const result = parseTaskInput('2h fix login @critical by tomorrow #bugfix')
    expect(result).toEqual({
      title: 'fix login',
      estimatedHours: 2,
      priority: 'critical',
      dueDate: expect.any(String),
      tags: ['bugfix']
    })
  })
})

describe('QuickTaskDialog', () => {
  it('opens on Cmd+K', async () => {
    render(<QuickTaskDialog />)

    fireEvent.keyDown(document, { key: 'k', metaKey: true })

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/create task/i)).toBeInTheDocument()
    })
  })

  it('creates task on Enter', async () => {
    const { user } = setup(<QuickTaskDialog open={true} />)

    const input = screen.getByPlaceholderText(/create task/i)
    await user.type(input, '2h fix bug @high')
    await user.keyboard('{Shift>}{Enter}{/Shift}')

    expect(mockApiClient.run).toHaveBeenCalledWith({
      service: 'platform.space',
      operation: 'createTask',
      data: expect.objectContaining({
        title: 'fix bug',
        estimatedHours: 2,
        priority: 'high'
      })
    })
  })
})
```

---

## Dependencies
- Command component from Captify UI
- Task ontology node (from Feature 01)
- Natural language parsing library (custom)
- Fuzzy search (fuse.js)

---

**Status**: Ready for Implementation
**Sprint**: Phase 2, Week 4
