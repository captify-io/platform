# Implementation Approach - Non-Breaking Changes

## Critical Constraint

**⚠️ DO NOT BREAK EXISTING FUNCTIONALITY**

Currently, the assistant mode (straight LLM chat) works. We must maintain this while adding new features incrementally.

## Phased Enhancement Strategy

### Current State (Working ✅)
- **Assistant Mode**: Direct LLM chat with OpenAI, Anthropic, Bedrock models
- **Chat UI**: Basic message display with markdown and code blocks
- **Streaming**: AI SDK 6 `useChat` with streaming responses
- **Thread Management**: Save/load conversations from DynamoDB

### Phase-by-Phase Approach

#### Phase 1: UI Enhancements (ADDITIVE ONLY)
**Status**: Assistant mode continues to work unchanged

1. **Actions Component** ✅
   - Added new `MessageActions` component
   - Replaced old buttons (same functionality, better UX)
   - No breaking changes to existing chat

2. **Enhanced Code Blocks** (Next)
   - Enhance existing code rendering in ReactMarkdown
   - Add features (line numbers, better copy) without changing core behavior
   - Falls back gracefully if features fail

3. **Context Display** (Next)
   - New component added to chat header
   - Does not interfere with message display
   - Optional - can be hidden

**Impact**: Zero breaking changes. Assistant mode works the same, with better UI.

---

#### Phase 2: Advanced Elements (ADDITIVE)
**Status**: Assistant mode still works, new features are optional

1. **Chain of Thought**
   - New component renders reasoning if present in message metadata
   - If no reasoning data → component doesn't render
   - Assistant mode unaffected (doesn't produce reasoning by default)

2. **Inline Citations**
   - Parses citation markers if present
   - If no citations → renders as normal text
   - Assistant mode unaffected

3. **Image Support**
   - Handles image message parts if present
   - Falls back to text-only display
   - Assistant mode works unchanged

**Impact**: Zero breaking changes. Features activate only when data is present.

---

#### Phase 3: Unified Client (REFACTOR)
**Status**: Careful refactoring with backward compatibility

**Approach**:
1. Create new `AgentClient` class alongside existing code
2. Keep existing service functions (`captify.ts`, `bedrock.ts`) unchanged
3. `AgentClient` *wraps* existing functions, doesn't replace them
4. Gradual migration: new features use `AgentClient`, old code continues to work

**Example**:
```typescript
// Old way (still works)
import { streamText } from './captify';
const result = await streamText(settings, messages);

// New way (for new features)
const client = new AgentClient(settings);
const result = await client.streamMessage(messages);

// Internally, AgentClient calls streamText()
```

**Impact**: Zero breaking changes. Both approaches work.

---

#### Phase 4: Ontology Tools (CAPTIFY-AGENT ONLY)
**Status**: New functionality for captify-agent mode only

**Approach**:
1. Auto-generate tools from ontology
2. Tools only loaded when `mode === 'captify-agent'`
3. Assistant mode never loads tools → works unchanged
4. Widgets registered as tools for captify-agent mode

**Code**:
```typescript
// In captify.ts
if (settings.mode === 'captify-agent') {
  // Load ontology tools + widgets
  const tools = await loadOntologyTools(credentials);
  const widgetTools = await loadWidgetTools();
  allTools = { ...tools, ...widgetTools, ...settings.tools };
}

// Assistant mode: no tools loaded
const result = await streamText({
  model,
  messages,
  tools: settings.mode === 'captify-agent' ? allTools : undefined,
});
```

**Impact**: Zero breaking changes. Assistant mode unchanged, captify-agent gets new features.

---

#### Phase 5-6: Tool Discovery & Workflows (CAPTIFY-AGENT ENHANCEMENT)
**Status**: Enhances captify-agent, doesn't touch assistant

**Approach**:
1. Tool selector only shows when configuring captify-agent
2. Workflow canvas only for captify-agent
3. Assistant mode configuration remains simple (model, system prompt only)

**Impact**: Zero breaking changes. Assistant mode UI unchanged.

---

#### Phase 7: Agent Studio (NEW APP)
**Status**: Completely new application

**Approach**:
1. New route: `/agentstudio` (doesn't touch existing `/agent`)
2. Existing `/agent` continues to work as-is
3. Agent Studio uses new unified `AgentClient`
4. Users can choose which interface to use

**Impact**: Zero breaking changes. New app doesn't affect old one.

---

#### AWS Bedrock Agent Support (FINAL STEP)
**Status**: Third mode added, others unchanged

**Approach**:
1. Add new mode: `aws-agent`
2. Create new service: `bedrock-agent.ts`
3. AgentClient routes to appropriate handler based on mode
4. Assistant and captify-agent modes unchanged

**Code**:
```typescript
class AgentClient {
  async streamMessage(messages) {
    switch (this.mode) {
      case 'assistant':
        return this.streamAssistant(messages);  // Existing
      case 'captify-agent':
        return this.streamCaptifyAgent(messages); // Existing
      case 'aws-agent':
        return this.streamBedrockAgent(messages); // NEW
    }
  }
}
```

**Impact**: Zero breaking changes. Two existing modes work unchanged.

---

## Testing Strategy

### Regression Testing (Critical)
Before merging any phase:

1. **Assistant Mode Smoke Test**
   - Start new thread
   - Send message
   - Verify streaming works
   - Verify message saves
   - Verify thread loads

2. **UI Regression Test**
   - All existing buttons/features work
   - No visual regressions
   - Mobile responsive

3. **API Regression Test**
   - `/api/captify` endpoint unchanged
   - Existing agent API routes work
   - No breaking changes to request/response format

### Feature Flags (Optional Safety)
For risky changes, add feature flags:

```typescript
const ENABLE_NEW_ACTIONS = process.env.NEXT_PUBLIC_ENABLE_NEW_ACTIONS === 'true';

{ENABLE_NEW_ACTIONS ? (
  <MessageActions {...props} />
) : (
  <LegacyActions {...props} />
)}
```

Can gradually roll out to users.

---

## Rollback Plan

If any phase breaks existing functionality:

1. **Immediate**: Revert the PR/commit
2. **Fix**: Address the breaking change in isolation
3. **Test**: Verify fix with regression tests
4. **Redeploy**: Only deploy after tests pass

**Git Strategy**:
- Each phase = separate branch
- Merge to main only after thorough testing
- Tag releases: `v1.0.0-phase1`, `v1.0.0-phase2`, etc.
- Can rollback to previous tag if needed

---

## Development Workflow

### For Each Feature

1. **Read feature spec** - Understand requirements
2. **Write tests first** - TDD Red phase
3. **Implement feature** - TDD Green phase
4. **Run regression tests** - Ensure nothing broke
5. **Manual test assistant mode** - Smoke test
6. **Code review** - Check for breaking changes
7. **Merge** - Only if all tests pass

### Before Committing

✅ Checklist:
- [ ] Assistant mode still works (manual test)
- [ ] All new tests pass
- [ ] All existing tests pass
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] Feature is backward compatible
- [ ] Documentation updated

---

## Key Principles

1. **Additive, Not Destructive**
   - Add new features alongside old code
   - Don't delete or modify working code unless absolutely necessary

2. **Graceful Degradation**
   - New features fail silently if data missing
   - Old features always work

3. **Mode Isolation**
   - Assistant mode = simple, unchanged
   - Captify-agent mode = gets new features
   - AWS-agent mode = added last, isolated

4. **Backward Compatibility**
   - Old API contracts maintained
   - Old UI components work alongside new ones
   - Old data formats supported

5. **Test Everything**
   - Unit tests for new features
   - Integration tests for mode interactions
   - Regression tests for existing features

---

## Summary

**We will NOT break the assistant mode.**

Every phase is designed to:
- Add new features without touching existing ones
- Isolate changes to specific modes
- Maintain backward compatibility
- Test thoroughly before merging

The assistant mode will work throughout the entire implementation, from Phase 1 to Phase 7.
