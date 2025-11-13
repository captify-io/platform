# Agent Module - AI SDK 6 Integration

## Vision

Build a comprehensive, ontology-driven agent system that provides a unified interface for three agent types (assistant, captify-agent, aws-agent) with full AI SDK 6 component integration, automatic tool generation from ontology, and a visual Agent Studio for configuration and testing.

## Core Principles

1. **AI SDK 6 Only** - Use only AI SDK 6 (`ai` and `@ai-sdk/*` packages) for all AI functionality
2. **Unified Interface** - Same API surface across all three agent types
3. **Ontology-Driven** - Tools automatically generated from ontology nodes
4. **Component-Based** - Implement AI SDK 6 elements (actions, chain-of-thought, citations, etc.)
5. **Type-Safe** - Strict TypeScript with no `any` types
6. **Test-Driven** - All features implemented with TDD workflow

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Agent Studio (UI)                        │
│  Visual builder for creating and testing agents            │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│               AgentClient (Unified Interface)               │
│  Single API for all agent types with consistent behavior   │
└─────┬──────────────┬──────────────────┬─────────────────────┘
      │              │                  │
┌─────▼─────┐  ┌────▼──────┐  ┌────────▼────────┐
│ Assistant │  │  Captify  │  │  AWS Bedrock    │
│  (LLM)    │  │  Agent    │  │     Agent       │
│           │  │ +Tools    │  │   (Native)      │
│           │  │ +Memory   │  │                 │
└───────────┘  └─────┬─────┘  └─────────────────┘
                     │
            ┌────────▼────────┐
            │ Tool Registry   │
            │                 │
            │ • Custom Tools  │
            │ • Ontology CRUD │
            │ • Workflow      │
            └─────────────────┘
                     │
            ┌────────▼────────┐
            │   Ontology      │
            │                 │
            │ Auto-generates  │
            │ tools from      │
            │ entity schemas  │
            └─────────────────┘
```

## Three Agent Types

### 1. Assistant Mode
- **Purpose**: Direct LLM chat without tools or memory
- **Use Cases**: Simple Q&A, content generation, brainstorming
- **Providers**: OpenAI, Anthropic, Bedrock foundation models
- **Features**: Fast, stateless, streaming responses

### 2. Captify Agent Mode
- **Purpose**: LLM + tools + memory + ontology integration
- **Use Cases**: Task automation, data queries, workflow execution
- **Features**:
  - Tools from ontology (auto-generated CRUD)
  - Custom tools (API, DynamoDB, functions)
  - Semantic memory with context optimization
  - Multi-phase workflows

### 3. AWS Bedrock Agent Mode
- **Purpose**: Native AWS Bedrock Agents
- **Use Cases**: Production-grade agents with AWS service integration
- **Features**:
  - AWS-managed infrastructure
  - Built-in security and monitoring
  - Native AWS service access

## Key Features

### AI SDK 6 Components
1. **Actions** - Copy, retry, like/dislike, edit, delete buttons
2. **Chain of Thought** - Visualize reasoning steps
3. **Code Blocks** - Syntax highlighting with line numbers
4. **Context Display** - Token usage, cost, selected context items
5. **Inline Citations** - Link to ontology entities
6. **Images** - Display and generate images
7. **Workflow Progress** - Visual phase indicator for multi-step workflows

### Ontology Integration
1. **Auto-Generate Tools** - CRUD tools from ontology nodes
2. **Relationship Queries** - Query tools from ontology edges
3. **Type Safety** - Zod schemas from JSON schemas
4. **Tool Discovery** - Category-based browsing by ontology domain
5. **Widget Tools** - Widgets (capture/display) available as tools for UI rendering

### Agent Studio
1. **Visual Builder** - Create and configure agents
2. **Tool Selector** - Browse ontology and custom tools
3. **Workflow Canvas** - Design multi-phase workflows with React Flow
4. **Live Testing** - Test agents in real-time during configuration
5. **Templates** - Pre-built agent patterns

## Technology Stack

### Core Dependencies
- **AI SDK 6** (`ai`, `@ai-sdk/react`, `@ai-sdk/openai`, `@ai-sdk/anthropic`, `@ai-sdk/amazon-bedrock`)
- **React 19** with Server Components
- **Next.js 15** for Agent Studio app
- **React Flow** for workflow canvas
- **Zod** for schema validation
- **Tailwind CSS v4** for styling

### Backend Services
- **DynamoDB** - Agent configs, threads, messages, tools, feedback
- **S3** - File storage for context (documents, images)
- **Bedrock** - LLM inference and AWS agents
- **Cognito** - Authentication

## Success Criteria

### Technical
- ✅ All 3 agent types work with unified `AgentClient`
- ✅ 100% ontology coverage for tool generation
- ✅ AI SDK 6 components fully integrated
- ✅ Visual workflow builder functional
- ✅ Zero regression in existing agent functionality
- ✅ Test coverage ≥ 80%

### User Experience
- ✅ Agent creation time < 5 minutes
- ✅ Tool discovery intuitive with search/filter
- ✅ Live testing shows real-time results
- ✅ Token usage and cost visible per message
- ✅ Workflow visualization clear

### Performance
- ✅ Tool registry loads < 500ms
- ✅ Agent Studio responsive (60fps)
- ✅ Message rendering < 100ms
- ✅ Workflow canvas handles 50+ nodes

## Related Documentation

- [Implementation Status](./status.md) - Current progress tracking
- [Implementation Roadmap](./plan/implementation-roadmap.md) - Phased plan
- [Feature Specifications](./features/) - Detailed feature specs
- [User Stories](./user-stories/) - YAML user stories with tests
