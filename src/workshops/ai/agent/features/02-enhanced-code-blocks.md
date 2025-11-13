# Feature: Enhanced Code Blocks

## Overview

Enhance code block rendering in chat messages with line numbers, improved syntax highlighting, better copy UX, language badges, and expandable functionality for long code snippets.

## Requirements

### Functional Requirements

1. **Line Numbers**
   - Toggle on/off via button
   - Persistent preference (localStorage)
   - Aligned with code content
   - Non-selectable (don't copy with code)

2. **Improved Copy Button**
   - Positioned in top-right corner of code block
   - Shows language badge next to copy button
   - Copies code without line numbers
   - Visual feedback (checkmark) for 2s
   - Toast notification on success

3. **Language Detection**
   - Auto-detect from markdown fence (```typescript)
   - Display language badge/label
   - Fallback to "text" for unknown languages
   - Support common languages (JS, TS, Python, Go, SQL, JSON, YAML, etc.)

4. **Syntax Highlighting**
   - Use `react-syntax-highlighter` (already installed)
   - Theme consistent with app theme (light/dark mode)
   - Support for 50+ languages
   - Fallback gracefully for unsupported languages

5. **Expandable Blocks** (for long code)
   - Collapse blocks > 20 lines by default
   - "Show more/less" toggle button
   - Smooth expand/collapse animation
   - Remember expansion state per message

### Non-Functional Requirements

1. **Performance**
   - Render in < 100ms for blocks < 500 lines
   - Virtual scrolling for blocks > 1000 lines
   - Lazy load syntax highlighting for off-screen blocks

2. **Accessibility**
   - Keyboard navigation for toggle buttons
   - Screen reader announces language and line count
   - High contrast mode support

3. **Responsive Design**
   - Horizontal scroll for wide code
   - Mobile-friendly button sizes
   - Touch-friendly expand/collapse

## Architecture

### Component Structure

```typescript
<CodeBlock>
  <CodeBlockHeader>
    <LanguageBadge>{language}</LanguageBadge>
    <LineNumberToggle checked={showLineNumbers} onChange={...} />
    <CopyButton code={code} />
  </CodeBlockHeader>
  <SyntaxHighlighter
    language={language}
    style={theme}
    showLineNumbers={showLineNumbers}
    wrapLongLines={false}
  >
    {code}
  </SyntaxHighlighter>
  {isLong && <ExpandButton expanded={expanded} onClick={...} />}
</CodeBlock>
```

### Data Model

**Preferences** (localStorage):
```typescript
interface CodeBlockPreferences {
  showLineNumbers: boolean;
  theme: 'light' | 'dark' | 'auto';
}
```

## API Actions

No server-side actions needed - all client-side

## UI/UX

### Visual Design

**Code Block Container**:
- Border radius: 8px
- Border: 1px solid border color
- Background: subtle contrast from message background
- Padding: 16px
- Max height (collapsed): 400px (20 lines × 20px)

**Header**:
- Height: 32px
- Background: slightly darker than code block
- Flex layout: language badge (left), line toggle (center), copy (right)
- Border radius top: 8px

**Language Badge**:
- Small pill shape
- Monospace font
- Text size: 12px
- Padding: 2px 8px

**Copy Button**:
- Icon button (24px × 24px)
- Copy icon → Check icon on success
- Tooltip: "Copy code"

**Line Numbers**:
- Color: muted (lower contrast)
- Width: auto (based on line count)
- Right-aligned
- Monospace font
- Not selectable (user-select: none)

**Expand Button** (bottom of collapsed blocks):
- Centered below code block
- Text: "Show {n} more lines" / "Show less"
- Icon: ChevronDown / ChevronUp
- Subtle background with border

### Interaction Patterns

1. **Copy Code**:
   - Click → Copy without line numbers → Show check → Toast → Revert

2. **Toggle Line Numbers**:
   - Click → Update showLineNumbers → Save to localStorage → Re-render

3. **Expand/Collapse**:
   - Click → Animate height → Toggle button text
   - Remember state per message (React state, not persisted)

4. **Language Badge**:
   - Static display
   - Click could show supported languages (future enhancement)

## User Stories

### US-1: View Code with Line Numbers
**As a** developer
**I want** to see line numbers in code blocks
**So that** I can reference specific lines

**Acceptance Criteria**:
- ✅ Line numbers visible by default
- ✅ Toggle button in code block header
- ✅ Preference persisted across sessions
- ✅ Line numbers don't copy with code

### US-2: Copy Code Easily
**As a** user
**I want** a clear copy button for code blocks
**So that** I can quickly paste code into my editor

**Acceptance Criteria**:
- ✅ Copy button visible in top-right of code block
- ✅ Copies code without line numbers
- ✅ Visual feedback (check icon)
- ✅ Toast notification confirms copy
- ✅ Keyboard shortcut (future: Cmd/Ctrl+Shift+C)

### US-3: Identify Programming Language
**As a** developer
**I want** to see what language the code is written in
**So that** I know how to use it

**Acceptance Criteria**:
- ✅ Language badge visible in code block header
- ✅ Auto-detected from markdown fence
- ✅ Shows "text" for unknown languages
- ✅ Badge styled consistently with UI

### US-4: Expand Long Code Blocks
**As a** user
**I want** long code blocks to be collapsed by default
**So that** my chat doesn't get cluttered

**Acceptance Criteria**:
- ✅ Blocks > 20 lines collapsed by default
- ✅ "Show N more lines" button at bottom
- ✅ Smooth expand animation
- ✅ Button changes to "Show less" when expanded
- ✅ Expansion state persists while viewing message

## Implementation Notes

### Integration Points

1. **Chat Panel** (`core/src/components/agent/panels/chat.tsx`)
   - Replace current code block rendering in ReactMarkdown
   - Use custom `code` component in `components` prop

2. **Syntax Highlighter** (already imported)
   - `PrismAsyncLight` from `react-syntax-highlighter`
   - Theme: `tomorrow` (current) or `oneDark` (better for dark mode)

3. **Theme Integration**
   - Detect theme from app context
   - Load appropriate syntax theme (tomorrow for light, oneDark for dark)

### Technical Considerations

1. **Line Number Implementation**
   - Use `showLineNumbers` prop of SyntaxHighlighter
   - Custom line number component for styling control

2. **Copy Without Line Numbers**
   - Extract plain code text from children
   - Use `String(children).replace(/\n$/, '')` to clean

3. **Language Detection**
   - Parse `className` from code element (`language-{lang}`)
   - Fallback to "text" if no className

4. **Collapse Logic**
   - Count lines: `code.split('\n').length`
   - Use max-height and overflow-hidden for collapsed state
   - Animate height transition (300ms ease)

5. **Performance**
   - Async load syntax highlighter
   - Code splitting for language-specific plugins
   - Debounce expand/collapse animations

## Testing

### Unit Tests

```typescript
describe('CodeBlock', () => {
  it('should render with syntax highlighting', () => {
    render(<CodeBlock language="typescript" code="const x = 1;" />);
    expect(screen.getByText('const')).toHaveClass('token');
  });

  it('should show language badge', () => {
    render(<CodeBlock language="typescript" code="const x = 1;" />);
    expect(screen.getByText('typescript')).toBeInTheDocument();
  });

  it('should toggle line numbers', async () => {
    render(<CodeBlock language="typescript" code="const x = 1;\nconst y = 2;" />);

    const toggle = screen.getByRole('checkbox');
    expect(toggle).toBeChecked(); // Default: on

    await userEvent.click(toggle);
    expect(toggle).not.toBeChecked();
    expect(localStorage.getItem('codeBlockPrefs')).toContain('"showLineNumbers":false');
  });

  it('should copy code without line numbers', async () => {
    const mockWriteText = jest.fn();
    Object.assign(navigator, {
      clipboard: { writeText: mockWriteText }
    });

    render(<CodeBlock language="typescript" code="const x = 1;\nconst y = 2;" showLineNumbers={true} />);

    const copyButton = screen.getByTitle('Copy code');
    await userEvent.click(copyButton);

    expect(mockWriteText).toHaveBeenCalledWith('const x = 1;\nconst y = 2;');
  });

  it('should collapse long code blocks', () => {
    const longCode = Array(30).fill('const x = 1;').join('\n');
    render(<CodeBlock language="typescript" code={longCode} />);

    expect(screen.getByText(/Show 10 more lines/)).toBeInTheDocument();
    expect(screen.getByRole('region')).toHaveStyle({ maxHeight: '400px' });
  });

  it('should expand on button click', async () => {
    const longCode = Array(30).fill('const x = 1;').join('\n');
    render(<CodeBlock language="typescript" code={longCode} />);

    const expandButton = screen.getByText(/Show 10 more lines/);
    await userEvent.click(expandButton);

    expect(screen.getByText(/Show less/)).toBeInTheDocument();
    expect(screen.getByRole('region')).not.toHaveStyle({ maxHeight: '400px' });
  });
});
```

## Dependencies

- ✅ `react-syntax-highlighter` - Syntax highlighting
- ✅ `react-syntax-highlighter/dist/esm/styles/prism` - Themes
- ✅ `lucide-react` - Icons (Copy, Check, ChevronDown, ChevronUp)
- ✅ `sonner` - Toast notifications

## Success Metrics

### User Engagement
- 60%+ of developers toggle line numbers
- 80%+ of code blocks get copied
- 40%+ of users expand collapsed code blocks

### Technical Metrics
- < 100ms render time for typical code blocks (< 100 lines)
- < 500ms for large blocks (< 500 lines)
- Zero layout shift during expand/collapse

### Quality Metrics
- User feedback: "Code blocks are easy to read and copy"
- Reduced confusion about what language code is in
- Improved chat readability with collapsed long blocks
