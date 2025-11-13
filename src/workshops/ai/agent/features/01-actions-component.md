# Feature: Message Actions Component

## Overview

Implement a comprehensive message actions component following AI SDK 6 patterns that provides intuitive interaction buttons for all messages in the chat interface. This includes copy, retry, feedback (like/dislike), edit, delete, and flag functionality.

## Requirements

### Functional Requirements

1. **Copy Action**
   - One-click copy message content to clipboard
   - Visual feedback (checkmark) for 2 seconds after copy
   - Toast notification on success/failure
   - Works for all message types (user and assistant)

2. **Feedback Actions** (Assistant messages only)
   - Like button (thumbs up)
   - Dislike button (thumbs down)
   - Toggle behavior (click again to remove feedback)
   - Save feedback to database with metadata (model, tools used, token count)
   - Visual indication of current feedback state

3. **Edit Action** (User messages only)
   - Enter edit mode inline
   - Save edited message
   - Regenerate assistant response after edit
   - Keyboard shortcuts (Esc to cancel, Cmd/Ctrl+Enter to save)

4. **Delete Action** (User messages only)
   - Delete message from thread
   - Delete subsequent assistant responses
   - Confirmation before delete
   - Toast notification on success

5. **Retry Action** (Assistant messages only)
   - Regenerate response with same context
   - Show loading indicator
   - Replace existing message with new response

6. **More Actions Menu**
   - Flag for review
   - Mark as helpful/not helpful
   - Additional context-specific actions

### Non-Functional Requirements

1. **Performance**
   - Actions render in < 50ms
   - Feedback save completes in < 200ms
   - No jank or layout shift when actions appear

2. **Accessibility**
   - Keyboard navigation support
   - ARIA labels for screen readers
   - Focus management

3. **Responsive Design**
   - Works on mobile (touch-friendly button sizes)
   - Graceful degradation on small screens

4. **Error Handling**
   - Network errors show user-friendly messages
   - Retry mechanism for failed operations
   - Rollback UI state on error

## Architecture

### Component Structure

```
<MessageActions>
  ├── <Action icon={Copy} />           # Always visible
  ├── <Action icon={ThumbsUp} />       # Assistant only
  ├── <Action icon={ThumbsDown} />     # Assistant only
  ├── <Action icon={Edit2} />          # User only
  ├── <Action icon={Trash2} />         # User only
  ├── <Action icon={RefreshCw} />      # Assistant only (optional)
  └── <DropdownMenu>                   # More actions
       ├── Mark as Helpful
       ├── Mark as Not Helpful
       └── Flag for Review
</MessageActions>
```

### Data Model

#### MessageFeedback Entity
Stored in: `captify-core-message-feedback`

```typescript
interface MessageFeedback {
  id: string;                 // PK: feedback-{timestamp}-{random}
  messageId: string;          // GSI: messageId-index
  userId: string;             // GSI: userId-createdAt-index
  threadId: string;           // For context
  type: FeedbackType;         // GSI: type-createdAt-index
  comment?: string;
  metadata?: {
    model?: string;
    toolsUsed?: string[];
    tokenCount?: number;
  };
  createdAt: string;          // ISO 8601
  updatedAt: string;
}

type FeedbackType = 'like' | 'dislike' | 'flag' | 'helpful' | 'not-helpful';
```

#### Ontology Node
Domain: Agent
Category: entity
Icon: ThumbsUp
Color: #8b5cf6

###Indexes

1. **messageId-index** (GSI)
   - Hash: messageId
   - Use: Get all feedback for a message

2. **userId-createdAt-index** (GSI)
   - Hash: userId
   - Range: createdAt
   - Use: Get user's feedback history

3. **type-createdAt-index** (GSI)
   - Hash: type
   - Range: createdAt
   - Use: Analytics on feedback types

## API Actions

### saveFeedback(messageId, type, metadata?)

**Purpose**: Save user feedback to database

**Input**:
```typescript
{
  messageId: string;
  type: FeedbackType;
  metadata?: {
    model?: string;
    toolsUsed?: string[];
    tokenCount?: number;
  };
}
```

**Output**:
```typescript
{
  success: boolean;
  feedbackId?: string;
  error?: string;
}
```

**Implementation**:
```typescript
await apiClient.run({
  service: 'platform.dynamodb',
  operation: 'put',
  table: 'core-message-feedback',
  data: {
    Item: {
      id: `feedback-${Date.now()}-${randomId()}`,
      messageId,
      userId: session.user.id,
      threadId: currentThread.id,
      type,
      metadata,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  }
});
```

### getFeedback(messageId)

**Purpose**: Get existing feedback for a message

**Input**:
```typescript
{
  messageId: string;
}
```

**Output**:
```typescript
{
  feedback: MessageFeedback | null;
}
```

**Implementation**:
```typescript
await apiClient.run({
  service: 'platform.dynamodb',
  operation: 'query',
  table: 'core-message-feedback',
  data: {
    IndexName: 'messageId-index',
    KeyConditionExpression: 'messageId = :messageId',
    ExpressionAttributeValues: {
      ':messageId': messageId
    },
    Limit: 1
  }
});
```

## UI/UX

### Visual Design

**Button Appearance**:
- Height: 28px (h-7)
- Width: 28px (w-7)
- Icon size: 14px (h-3.5 w-3.5)
- Variant: ghost (transparent background)
- Hover: subtle background color
- Active state: primary color with light background

**Layout**:
- Horizontal row below message content
- 4px gap between buttons (gap-1)
- Appears only when not editing
- Smooth fade-in animation

**Feedback States**:
- Like active: text-primary bg-primary/10
- Dislike active: text-primary bg-primary/10
- Copied: Check icon replaces Copy icon for 2s

### Interaction Patterns

1. **Copy**:
   - Click → Copy to clipboard → Show check → Toast → Revert to copy icon

2. **Like/Dislike**:
   - Click → Optimistic UI update → Save to DB → Toast on error

3. **Edit** (User messages):
   - Click → Show textarea with current content → Focus cursor at end
   - Esc → Cancel edit, revert to display mode
   - Cmd/Ctrl+Enter → Save edit, regenerate response

4. **Delete** (User messages):
   - Click → Confirm dialog → Delete from thread → Toast success

5. **Retry** (Assistant messages):
   - Click → Show loading → Regenerate → Replace message

## User Stories

### US-1: Copy Message Content
**As a** user
**I want** to copy message content with one click
**So that** I can use it in other applications

**Acceptance Criteria**:
- ✅ Copy button visible on all messages
- ✅ Click copies full message content to clipboard
- ✅ Visual feedback (check icon) appears for 2 seconds
- ✅ Toast notification confirms successful copy
- ✅ Error handling if clipboard API fails

### US-2: Provide Feedback on Assistant Messages
**As a** user
**I want** to like or dislike assistant messages
**So that** the system learns from my feedback

**Acceptance Criteria**:
- ✅ Like/dislike buttons visible on assistant messages only
- ✅ Click like/dislike saves feedback to database
- ✅ Active state shows which feedback is selected
- ✅ Click again removes feedback (toggle behavior)
- ✅ Feedback includes metadata (model, tools, tokens)
- ✅ Error handling with toast notification

### US-3: Edit User Messages
**As a** user
**I want** to edit my messages after sending
**So that** I can correct mistakes or clarify my request

**Acceptance Criteria**:
- ✅ Edit button visible on user messages only
- ✅ Click enters edit mode with textarea
- ✅ Esc cancels edit
- ✅ Cmd/Ctrl+Enter saves edit
- ✅ Save button also available
- ✅ After edit, assistant response regenerates
- ✅ Original message preserved in history

### US-4: Delete User Messages
**As a** user
**I want** to delete messages I've sent
**So that** I can remove mistakes or unwanted content

**Acceptance Criteria**:
- ✅ Delete button visible on user messages only
- ✅ Click triggers confirmation dialog
- ✅ Confirm deletes message and subsequent assistant responses
- ✅ Toast notification confirms deletion
- ✅ Message removed from thread immediately

### US-5: Retry Assistant Response
**As a** user
**I want** to retry generating an assistant response
**So that** I can get a better or different answer

**Acceptance Criteria**:
- ✅ Retry button visible on assistant messages
- ✅ Click regenerates response with same context
- ✅ Loading indicator shows during generation
- ✅ New response replaces existing message
- ✅ Original message preserved in history

## Implementation Notes

### Integration Points

1. **Chat Panel** (`core/src/components/agent/panels/chat.tsx`)
   - Replace existing action buttons (lines 916-954)
   - Import `MessageActions` component
   - Pass message data and callbacks

2. **Provider Context** (`core/src/components/agent/provider.tsx`)
   - Already has regenerate, edit, delete functions
   - No changes needed

3. **Types** (`core/src/types/feedback.ts`)
   - New file with feedback types
   - Export from `core/src/types/index.ts`

4. **Ontology** (DynamoDB: `captify-core-ontology-node`)
   - Add `core-messageFeedback` node
   - Schema with indexes defined

### Technical Considerations

1. **Optimistic Updates**
   - Update UI immediately on feedback click
   - Rollback on error
   - Show loading state for slow operations

2. **Clipboard API**
   - Use `navigator.clipboard.writeText()`
   - Fallback for browsers without clipboard API
   - Handle permissions gracefully

3. **Toast Notifications**
   - Use `sonner` (already installed)
   - Success: green, 2-second auto-dismiss
   - Error: red, 5-second auto-dismiss with retry option

4. **State Management**
   - Local state for UI (copied, isSubmitting)
   - Props for callbacks (onCopy, onEdit, onDelete, onRetry)
   - Optional onFeedback callback (defaults to saveFeedback)

## Testing

### Unit Tests

```typescript
describe('MessageActions', () => {
  it('should render copy button for all messages', () => {
    render(<MessageActions messageId="msg-1" content="test" />);
    expect(screen.getByTitle('Copy')).toBeInTheDocument();
  });

  it('should render like/dislike for assistant messages', () => {
    render(<MessageActions messageId="msg-1" content="test" isUserMessage={false} />);
    expect(screen.getByTitle('Like')).toBeInTheDocument();
    expect(screen.getByTitle('Dislike')).toBeInTheDocument();
  });

  it('should not render like/dislike for user messages', () => {
    render(<MessageActions messageId="msg-1" content="test" isUserMessage={true} />);
    expect(screen.queryByTitle('Like')).not.toBeInTheDocument();
  });

  it('should copy content to clipboard', async () => {
    const mockWriteText = jest.fn();
    Object.assign(navigator, {
      clipboard: { writeText: mockWriteText }
    });

    render(<MessageActions messageId="msg-1" content="Hello World" />);
    const copyButton = screen.getByTitle('Copy');

    await userEvent.click(copyButton);

    expect(mockWriteText).toHaveBeenCalledWith('Hello World');
    expect(screen.getByTitle('Copy')).toHaveClass('text-primary');
  });

  it('should save feedback to database', async () => {
    const mockApiClient = jest.spyOn(apiClient, 'run').mockResolvedValue({});

    render(<MessageActions messageId="msg-1" content="test" isUserMessage={false} />);
    const likeButton = screen.getByTitle('Like');

    await userEvent.click(likeButton);

    expect(mockApiClient).toHaveBeenCalledWith({
      service: 'platform.dynamodb',
      operation: 'put',
      table: 'core-message-feedback',
      data: expect.objectContaining({
        Item: expect.objectContaining({
          messageId: 'msg-1',
          type: 'like'
        })
      })
    });
  });

  it('should toggle feedback on second click', async () => {
    const mockApiClient = jest.spyOn(apiClient, 'run').mockResolvedValue({});

    render(<MessageActions messageId="msg-1" content="test" isUserMessage={false} />);
    const likeButton = screen.getByTitle('Like');

    // First click - add feedback
    await userEvent.click(likeButton);
    expect(likeButton).toHaveClass('text-primary');

    // Second click - remove feedback
    await userEvent.click(likeButton);
    expect(likeButton).not.toHaveClass('text-primary');
  });
});
```

### Integration Tests

```typescript
describe('MessageActions Integration', () => {
  it('should edit message and regenerate response', async () => {
    const { container } = render(<ChatPanel />);

    // Find user message
    const editButton = screen.getAllByTitle('Edit')[0];
    await userEvent.click(editButton);

    // Edit message
    const textarea = screen.getByRole('textbox');
    await userEvent.clear(textarea);
    await userEvent.type(textarea, 'Updated message');
    await userEvent.keyboard('{Control>}{Enter}');

    // Verify message updated
    expect(screen.getByText('Updated message')).toBeInTheDocument();

    // Verify regenerate was called
    await waitFor(() => {
      expect(screen.getByText(/Thinking/)).toBeInTheDocument();
    });
  });

  it('should delete message and subsequent responses', async () => {
    const { container } = render(<ChatPanel />);

    const deleteButton = screen.getAllByTitle('Delete')[0];
    await userEvent.click(deleteButton);

    // Confirm deletion
    const confirmButton = screen.getByText('Delete');
    await userEvent.click(confirmButton);

    // Verify message removed
    await waitFor(() => {
      expect(screen.queryByText('Test message')).not.toBeInTheDocument();
    });
  });
});
```

## Dependencies

- ✅ `@ai-sdk/react` - useChat hook
- ✅ `sonner` - Toast notifications
- ✅ `lucide-react` - Icons
- ✅ Radix UI components - Dropdown menu
- ✅ `apiClient` - Database operations

## Success Metrics

### User Engagement
- 30%+ of messages receive feedback (like/dislike) within first month
- 50%+ of users use copy functionality
- 20%+ of users edit messages

### Technical Metrics
- < 50ms render time for actions
- < 200ms feedback save time
- 99.9% success rate for clipboard operations
- Zero layout shift on action appearance

### Quality Metrics
- Feedback data enables model evaluation
- User satisfaction with interaction patterns
- Reduced support tickets about "how to copy/edit messages"
