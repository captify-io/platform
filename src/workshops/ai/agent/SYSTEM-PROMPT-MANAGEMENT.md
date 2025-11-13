# System Prompt Management

**Date**: 2025-11-04
**Status**: ✅ Implemented

## Overview

The system prompt architecture separates **user-editable instructions** from **system-managed instructions** (tools, widgets, best practices). This ensures users can customize their agent's behavior without needing to manage technical details about tool usage.

## Architecture

```
Final System Prompt = User Base Instructions + System Injected Suffix
                      ↑                        ↑
                      User edits in UI         Auto-generated (tools, widgets)
```

### Agent Fields

| Field | Type | Purpose | User-Editable |
|-------|------|---------|---------------|
| `userSystemPrompt` | string | User's base instructions | ✅ Yes (shown in UI as "Base Instructions") |
| `systemPromptSuffix` | string | Auto-generated tool/widget instructions | ❌ No (managed by system) |
| `system` | string | **COMPUTED** - Final combined prompt | ❌ No (generated at runtime) |
| `systemPrompt` | string | **DEPRECATED** - Legacy field | ⚠️ Fallback only |

## How It Works

### 1. User Edits Base Instructions

**UI Location**: Agent Studio → Base Instructions textarea

**What Users See**:
```
Base Instructions
┌──────────────────────────────────────┐
│ You are a helpful AI assistant that  │
│ specializes in government contracts. │
│ You provide detailed analysis and    │
│ help users track their obligations.  │
└──────────────────────────────────────┘

ℹ️ Tool usage instructions and widget guidelines
   will be automatically added to these instructions.
```

**What Users DON'T See**: Tool usage patterns, widget instructions, best practices

### 2. System Builds Suffix

**File**: [`/opt/captify-apps/core/src/services/agent/prompt-builder.ts`](file:///opt/captify-apps/core/src/services/agent/prompt-builder.ts)

**Function**: `buildSystemPromptSuffix(agent)`

**Auto-Includes**:
- Widget usage instructions (if agent has widget tools)
- Tool best practices (if agent has any tools)
- Workflow instructions (if agent has workflows)

**Example Suffix**:
```markdown
## Data Visualization with Widgets

When you have data to show the user, use widget tools...

### Available Widget Tools

1. **tool-widget-table** - Display tabular data
   - Use for: Lists of items, data tables, records
   ...

2. **tool-widget-chart** - Display charts
   ...

### When to Use Widgets

- Multiple rows of data → Use tool-widget-table
- Numerical trends → Use tool-widget-chart (line)
...

## Tool Usage Guidelines

- Query before displaying
- Format data properly
- Provide context
...
```

### 3. Runtime Combination

**File**: [`/opt/captify-apps/core/src/services/agent/captify.ts:246`](file:///opt/captify-apps/core/src/services/agent/captify.ts#L246)

**Function**: `buildCompleteSystemPrompt(agent)`

**Result**:
```typescript
const finalPrompt = `${agent.userSystemPrompt}

---

${systemPromptSuffix}`;
```

**Sent to LLM**:
```
You are a helpful AI assistant that specializes in government contracts.
You provide detailed analysis and help users track their obligations.

---

## Data Visualization with Widgets

When you have data to show the user, use widget tools...
[full widget and tool instructions]
```

## Implementation Files

### Core Service Files

1. **[/opt/captify-apps/core/src/services/agent/types.ts](file:///opt/captify-apps/core/src/services/agent/types.ts)** - Type definitions
   - Added `userSystemPrompt` field
   - Added `systemPromptSuffix` field
   - Marked `system` as computed
   - Deprecated `systemPrompt`

2. **[/opt/captify-apps/core/src/services/agent/prompt-builder.ts](file:///opt/captify-apps/core/src/services/agent/prompt-builder.ts)** - Prompt generation logic
   - `buildSystemPromptSuffix()` - Generates tool/widget instructions
   - `buildCompleteSystemPrompt()` - Combines user + system prompts
   - `regenerateSystemPromptSuffix()` - Updates suffix when tools change

3. **[/opt/captify-apps/core/src/services/agent/captify.ts](file:///opt/captify-apps/core/src/services/agent/captify.ts)** - Agent execution
   - Calls `buildCompleteSystemPrompt()` before streaming
   - Passes combined prompt to AI SDK

### UI Files

1. **[/opt/captify-apps/platform/src/app/agent/studio/[id]/page.tsx](file:///opt/captify-apps/platform/src/app/agent/studio/[id]/page.tsx)** - Agent Studio
   - Changed label from "System Instructions" to "Base Instructions"
   - Added help text explaining auto-injection
   - Shows only user-editable content

## Usage Examples

### Example 1: Contract Analysis Agent

**User Base Instructions**:
```
You are a government contract specialist.
Analyze contracts and provide insights on compliance and risks.
```

**System Auto-Adds**:
- Widget tools (because agent has `tool-widget-table`, `tool-widget-chart`)
- Ontology query instructions
- Tool best practices

**Final Prompt** (sent to LLM):
```
You are a government contract specialist.
Analyze contracts and provide insights on compliance and risks.

---

## Data Visualization with Widgets
[full widget instructions]

## Tool Usage Guidelines
[tool best practices]
```

### Example 2: Simple Chatbot

**User Base Instructions**:
```
You are a friendly assistant that answers questions about our products.
```

**System Auto-Adds**:
- Nothing (agent has no tools)

**Final Prompt**:
```
You are a friendly assistant that answers questions about our products.
```

## Benefits

### For Users
- ✅ **Simple UI** - Only edit their custom instructions
- ✅ **No technical details** - Don't need to know about widget parameters
- ✅ **Focus on behavior** - Describe what the agent should do, not how

### For System
- ✅ **Consistent instructions** - All agents get same widget/tool guidance
- ✅ **Easy updates** - Change widget instructions in one place
- ✅ **Context-aware** - Only includes relevant instructions based on agent tools

### For Developers
- ✅ **Maintainable** - Single source of truth for tool instructions
- ✅ **Extensible** - Easy to add new auto-injected sections
- ✅ **Testable** - Can test prompt generation independently

## Customization

### Adding New Auto-Injected Sections

Edit [`prompt-builder.ts`](file:///opt/captify-apps/core/src/services/agent/prompt-builder.ts):

```typescript
export function buildSystemPromptSuffix(agent: Agent): string {
  const sections: string[] = [];

  // Existing sections
  if (hasWidgetTools) sections.push(WIDGET_INSTRUCTIONS);
  if (hasTools) sections.push(TOOL_BEST_PRACTICES);

  // NEW: Add custom section
  if (agent.customFeature) {
    sections.push(`
## Custom Feature Instructions
[your instructions here]
    `);
  }

  return sections.join('\n\n').trim();
}
```

### Updating Widget Instructions

Edit the `WIDGET_INSTRUCTIONS` constant in [`prompt-builder.ts`](file:///opt/captify-apps/core/src/services/agent/prompt-builder.ts):

```typescript
const WIDGET_INSTRUCTIONS = `
## Data Visualization with Widgets

[Update instructions here - applies to all agents]
`;
```

## Migration Notes

### Existing Agents

**Old Format** (stored in database):
```json
{
  "config": {
    "systemPrompt": "You are a helpful assistant..."
  }
}
```

**Still Works**: System uses `systemPrompt` as fallback for `userSystemPrompt`

**Migration Path**:
1. Read `config.systemPrompt`
2. Save as `userSystemPrompt`
3. System auto-generates `systemPromptSuffix`
4. Combined at runtime

### No Breaking Changes

The prompt builder gracefully handles:
- Agents with only `systemPrompt` (legacy)
- Agents with `userSystemPrompt` (new)
- Agents with no prompt (uses default)

## Testing

### Test Prompt Generation

```typescript
import { buildCompleteSystemPrompt } from '@captify-io/core/services/agent/prompt-builder';

const agent = {
  id: 'test-agent',
  userSystemPrompt: 'You are a test assistant',
  tools: ['tool-widget-table', 'tool-ontology-query'],
};

const prompt = buildCompleteSystemPrompt(agent);
console.log(prompt);
// Should include user prompt + widget instructions + tool best practices
```

### Verify in UI

1. Open Agent Studio
2. Check "Base Instructions" label
3. Check help text about auto-injection
4. Save agent
5. Test in chat - verify widget tools work

## Future Enhancements

1. **Preview System Prompt** - Show users what the full prompt looks like
2. **Custom Sections** - Allow users to add custom sections between base and suffix
3. **Per-Tool Instructions** - Inject instructions for specific tools only
4. **Conditional Instructions** - Based on agent settings or context

---

**Status**: ✅ Complete and Deployed
