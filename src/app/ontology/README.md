# Agent Designer

> Unified environment for designing, reasoning, and executing agentic decision systems

## Overview

The Agent Designer provides **dual interaction modes**:

1. **Visual Canvas** (drag-and-drop) - Left side
2. **Conversational Interface** (chat-driven) - Right side

Both modes work with the same underlying **JSON-based decision model** that can be executed directly.

## Architecture

```
/designer
├── layout.tsx                    # Shared layout (fullscreen)
├── page.tsx                      # Main designer page (split-screen)
├── components/
│   ├── DesignerCanvas.tsx       # Visual canvas wrapper
│   ├── DesignerChat.tsx         # Conversational interface
│   ├── DesignerToolbar.tsx      # Top toolbar
│   ├── NodePalette.tsx          # Node palette sidebar
│   └── NodeConfigPanel.tsx      # Node properties panel
├── context/
│   └── DesignerContext.tsx      # Shared state management
└── lib/
    ├── validation.ts            # Model validation logic
    ├── designer-agent.ts        # LLM integration for chat
    └── execution.ts             # Model execution engine
```

## Node Framework

### Discovery Nodes (🧭 Understanding the Problem)
- **PainPoint** - Identify bottleneck or issue
- **Opportunity** - Highlight improvement goal
- **Hypothesis** - Testable theory
- **Insight** - Observation or learning

### Decision Nodes (⚖️ Action Logic)
- **Input** - Trigger or dataset
- **Decision** - Logical evaluation
- **Rule** - Structured condition
- **Task** - Executable step
- **Agent** - Call sub-agent or model
- **End** - Process termination

### People/Process/Technology Nodes (🏛️ Context)
- **Person** - Role or user
- **Process** - Workflow
- **System** - Platform or API
- **Policy** - Constraint or rulebook

## Edge Types

- **flow** - Sequential control (A → B)
- **data** - Input/output dependency
- **influences** - Contextual reference
- **assigned_to** - Responsibility mapping
- **triggers** - Event-driven
- **feeds** - Feedback loop

## JSON State Model

```typescript
{
  agent: {
    name: "HiringAgent",
    system_instruction: "Assist HR in faster candidate selection",
    provider: "bedrock",
    model: "anthropic.claude-3-sonnet",
    temperature: 0.3
  },
  decisionModel: {
    scenario: "HiringWorkflow",
    nodes: [...],
    edges: [...]
  },
  ontology: {
    domain: "HumanResources",
    objects: ["Person", "Workflow", "Policy", "System"]
  }
}
```

## Implementation Plan

### Phase 1: Core Infrastructure ✅
- [x] Create designer types (`@captify-io/core/types/designer`)
- [x] Create layout and main page structure
- [x] Define node framework and validation rules

### Phase 2: Visual Canvas (Next)
- [ ] Create `DesignerCanvas.tsx` wrapper around `AgentWorkflowEditor`
- [ ] Extend node palette with 14 designer node types
- [ ] Create custom node components for each type
- [ ] Implement node config panels

### Phase 3: Conversational Interface
- [ ] Create `DesignerChat.tsx` with message history
- [ ] Integrate Designer Agent (Bedrock Claude)
- [ ] Implement command parsing
- [ ] Add confirmation feedback

### Phase 4: State Management
- [ ] Create `DesignerContext.tsx` for shared state
- [ ] Implement bidirectional sync (chat ↔ canvas)
- [ ] Add auto-save functionality
- [ ] Implement undo/redo

### Phase 5: Validation & Execution
- [ ] Implement validation engine
- [ ] Add execution readiness indicators
- [ ] Create JSON export/import
- [ ] Build scenario templates

## Usage

### Visual Mode
1. Open node palette (left sidebar)
2. Drag nodes onto canvas
3. Draw edges between nodes
4. Configure node properties (right panel)

### Conversational Mode
1. Type natural language description
2. Designer Agent interprets and builds
3. Canvas updates in real-time
4. Confirm or modify via chat

### Example Session

```
User: "I want to speed up hiring for data engineers"
→ Agent creates PainPoint and Opportunity nodes

User: "Add a decision to check budget before advertising"
→ Agent creates Decision node with "Budget Check"

User: "Include resume ranking with past successful hires"
→ Agent adds Agent node "ResumeRanker" connected to End

Result: Start → Budget Check → ResumeRanker → End
```

## Files to Implement

### Components (Priority Order)

1. **DesignerCanvas.tsx** - Wrapper around AgentWorkflowEditor
   - Reuses existing React Flow canvas
   - Extended node palette for designer nodes
   - Custom node rendering

2. **DesignerChat.tsx** - Conversational interface
   - Message history display
   - Input field with send button
   - Action confirmations
   - Real-time updates

3. **NodePalette.tsx** - Categorized node library
   - Discovery nodes section
   - Decision nodes section
   - People/Process/Tech section
   - Drag-to-canvas support

4. **NodeConfigPanel.tsx** - Node property editor
   - Dynamic fields based on node type
   - Validation feedback
   - Actor assignment
   - I/O configuration

### Context & State

5. **DesignerContext.tsx** - Shared state provider
   - DesignerModel state
   - Node/edge CRUD operations
   - Chat history
   - Dirty state tracking

### Backend Integration

6. **designer-agent.ts** - LLM integration
   - Bedrock Claude API calls
   - Command parsing
   - Model updates from chat
   - Natural language → JSON

7. **validation.ts** - Model validation
   - Check for Start/End nodes
   - Verify all nodes connected
   - Validate decision logic
   - Detect circular dependencies

8. **execution.ts** - Model execution
   - Runtime engine
   - Step-by-step execution
   - Error handling
   - Result tracking

## Database Tables

### core-DesignerModel
```typescript
{
  id: string;           // PK
  tenantId: string;     // GSI
  name: string;
  model: DesignerModel; // Complete JSON
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  version: number;
  status: 'draft' | 'published' | 'archived';
}
```

## Testing Strategy

1. **Visual Canvas**: Drag nodes, draw edges, verify JSON updates
2. **Chat Interface**: Send commands, verify node creation
3. **Bidirectional Sync**: Edit in chat, verify canvas updates (and vice versa)
4. **Validation**: Test all validation rules
5. **Execution**: Run complete workflows end-to-end

## Next Steps

1. Rebuild core library: `cd /opt/captify-apps/core && npm run build`
2. Start implementing Phase 2 components
3. Test page loads correctly at `/core/designer`
4. Add navigation button to sidebar
