# Agent Module - Implementation Roadmap

## Overview

Phased implementation of comprehensive agent system with AI SDK 6 integration, unified client interface, ontology-driven tools, and visual Agent Studio.

**Total Timeline**: 12 weeks (3 months)
**Total Story Points**: 71

## Timeline

| Phase | Duration | Story Points | Dates |
|-------|----------|--------------|-------|
| Phase 1 | 2 weeks | 3 | Weeks 1-2 |
| Phase 2 | 2 weeks | 5 | Weeks 3-4 |
| Phase 3 | 1 week | 8 | Week 5 |
| Phase 4 | 2 weeks | 13 | Weeks 6-7 |
| Phase 5 | 1 week | 5 | Week 8 |
| Phase 6 | 2 weeks | 13 | Weeks 9-10 |
| Phase 7 | 2 weeks | 21 | Weeks 11-12 |

## Phases

### Phase 1: AI SDK 6 Component Integration (Weeks 1-2, 3 story points)

**Goal**: Integrate core AI SDK 6 UI components into existing chat interface

**Tasks**:
1. [ ] Create Actions component (copy, retry, feedback buttons)
2. [ ] Enhance code blocks with line numbers and better UX
3. [ ] Create context display component (token usage, cost, context items)
4. [ ] Add message feedback database table and ontology node
5. [ ] Write tests for all components
6. [ ] Update chat panel to use new components

**Deliverables**:
- `MessageActions` component
- Enhanced code block rendering
- Context display panel
- Message feedback tracking system
- Ontology node: `core-messageFeedback`
- DynamoDB table: `core-message-feedback`

**Acceptance Criteria**:
- ✅ Actions appear on all messages (copy, retry for assistant, edit/delete for user)
- ✅ Like/dislike feedback saves to database
- ✅ Code blocks have line numbers and improved copy UX
- ✅ Context panel shows token usage, cost, and selected context items
- ✅ All tests passing

**Dependencies**:
- None (builds on existing chat panel)

---

### Phase 2: Advanced AI Elements (Weeks 3-4, 5 story points)

**Goal**: Implement chain-of-thought, citations, and image support

**Tasks**:
1. [ ] Create chain-of-thought visualization component
2. [ ] Add reasoning step storage to message metadata
3. [ ] Implement inline citation component
4. [ ] Add citation sources to tool responses
5. [ ] Add image display and upload support
6. [ ] Integrate with S3 for image storage
7. [ ] Write tests for all features

**Deliverables**:
- `ChainOfThought` component
- `InlineCitation` component
- Image message part rendering
- Extended message metadata schema
- Citation linking to ontology entities

**Acceptance Criteria**:
- ✅ Chain-of-thought shows/hides reasoning steps
- ✅ Citations link to ontology entities (contracts, documents)
- ✅ Images display inline with lazy loading
- ✅ Tool responses include citation sources
- ✅ All tests passing

**Dependencies**:
- Phase 1 (extends message display)

---

### Phase 3: Unified Client Interface (Week 5, 8 story points)

**Goal**: Create `AgentClient` class with consistent API for all 3 agent types

**Tasks**:
1. [ ] Design AgentClient interface
2. [ ] Implement assistant mode adapter
3. [ ] Implement captify-agent mode adapter
4. [ ] Implement aws-agent mode adapter
5. [ ] Create settings manager for type-safe configuration
6. [ ] Add unified streaming interface
7. [ ] Add consistent error handling
8. [ ] Write comprehensive tests

**Deliverables**:
- `AgentClient` class with unified API
- Settings manager with validation
- Mode adapters for all 3 agent types
- Streaming abstraction

**Acceptance Criteria**:
- ✅ Same API works for all 3 agent types
- ✅ Easy to switch between modes
- ✅ Settings validated per agent type
- ✅ Error handling consistent
- ✅ All tests passing

**Dependencies**:
- Existing agent services (captify.ts, bedrock.ts)

---

### Phase 4: Ontology-Tool Integration (Weeks 6-7, 13 story points)

**Goal**: Auto-generate CRUD tools from ontology nodes

**Tasks**:
1. [ ] Design ontology-to-tool mapping
2. [ ] Create tool generator from ontology nodes
3. [ ] Generate CRUD tools (create, get, update, delete, query)
4. [ ] Generate relationship query tools from ontology edges
5. [ ] Integrate with tool registry
6. [ ] Add caching (5-minute TTL matching ontology cache)
7. [ ] Test with existing ontology nodes
8. [ ] Write comprehensive tests

**Deliverables**:
- `ontology-tools.ts` - Tool generator
- CRUD tool templates
- Relationship query tool templates
- Tool registry integration
- Auto-generated tools for all ontology nodes

**Acceptance Criteria**:
- ✅ Every ontology node with `dataSource` generates CRUD tools
- ✅ Ontology edges generate relationship query tools
- ✅ Tools have proper Zod schemas from JSON schemas
- ✅ Tools execute correctly via API client
- ✅ Tool registry loads ontology tools automatically
- ✅ All tests passing

**Dependencies**:
- Existing ontology service
- Tool registry

---

### Phase 5: Tool Discovery UI (Week 8, 5 story points)

**Goal**: Visual tool selector with categories, search, and filtering

**Tasks**:
1. [ ] Design tool selector component
2. [ ] Create category-based browsing (by ontology domain)
3. [ ] Add search and filter functionality
4. [ ] Show tool dependencies
5. [ ] Add tool preview on hover
6. [ ] Bulk enable/disable by category
7. [ ] Write tests

**Deliverables**:
- `ToolSelector` component
- `ToolCategory` component
- `ToolOption` component
- Tool search/filter logic

**Acceptance Criteria**:
- ✅ Tools organized by category (Ontology Tools, Custom Tools, Workflow Tools)
- ✅ Search finds tools by name/description
- ✅ Filter by category, status, domain
- ✅ Preview shows tool schema on hover
- ✅ Bulk enable/disable works
- ✅ All tests passing

**Dependencies**:
- Phase 4 (ontology tools)

---

### Phase 6: Workflow Enhancement (Weeks 9-10, 13 story points)

**Goal**: Visual workflow canvas with React Flow for multi-phase workflows

**Tasks**:
1. [ ] Install React Flow dependencies
2. [ ] Create workflow canvas component
3. [ ] Create phase node component
4. [ ] Create transition edge component
5. [ ] Implement drag-and-drop phase creation
6. [ ] Add phase configuration (system prompt, tools)
7. [ ] Implement transition tool selection
8. [ ] Create workflow progress indicator
9. [ ] Enhance phase transitions in captify.ts (`prepareStep`)
10. [ ] Save/load workflow definitions
11. [ ] Write comprehensive tests

**Deliverables**:
- `WorkflowCanvas` component
- `PhaseNode` component
- `TransitionEdge` component
- `WorkflowProgress` indicator
- Enhanced phase transition logic
- Workflow save/load functionality

**Acceptance Criteria**:
- ✅ Drag-and-drop phases onto canvas
- ✅ Connect phases with transition tools
- ✅ Configure system prompt and tools per phase
- ✅ Progress indicator shows current phase during execution
- ✅ Phase transitions work automatically
- ✅ Workflows save to DynamoDB
- ✅ All tests passing

**Dependencies**:
- Existing workflow support in agent config

---

### Phase 7: Agent Studio Application (Weeks 11-12, 21 story points)

**Goal**: Build complete Agent Studio application at `platform/src/app/agentstudio`

**Tasks**:
1. [ ] Create agentstudio app structure
2. [ ] Build agent list view (grid/list toggle)
3. [ ] Create agent form with tabs (basic, model, prompt, tools, workflow, memory, security)
4. [ ] Build model selector (provider + model picker)
5. [ ] Integrate tool selector from Phase 5
6. [ ] Integrate workflow builder from Phase 6
7. [ ] Build live testing panel (split view)
8. [ ] Add agent templates feature
9. [ ] Implement clone agent functionality
10. [ ] Add import/export agent configs
11. [ ] Create agent comparison view
12. [ ] Write comprehensive tests

**Deliverables**:
- Agent Studio application at `/agentstudio`
- Agent list, create, edit, test pages
- Agent templates library
- Import/export functionality
- Live testing interface

**Acceptance Criteria**:
- ✅ Agent creation time < 5 minutes
- ✅ Live testing works in real-time
- ✅ Tool selector shows ontology and custom tools
- ✅ Workflow builder functional
- ✅ Templates speed up agent creation
- ✅ Clone/import/export works
- ✅ All tests passing

**Dependencies**:
- All previous phases
- Platform app structure

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| React Flow learning curve | Medium | Medium | Start Phase 6 early, prototype separately |
| Ontology tool generation complexity | Medium | High | Test incrementally with small ontology subset |
| AgentClient interface changes | Low | High | Design upfront, get team review |
| AI SDK 6 version updates | Low | Medium | Pin versions, test upgrades in isolation |
| Performance with large workflows | Medium | Medium | Load testing, optimize canvas rendering |
| Tool registry cache invalidation | Low | Medium | Match ontology cache TTL, document clearly |

## Dependencies

### External Dependencies
- `reactflow@^11.11.0` - Workflow canvas
- `@reactflow/node-toolbar@^1.3.0` - Node configuration UI
- AI SDK 6 packages (already installed)

### Internal Dependencies
- Core component library (`@captify-io/core`)
- Ontology service (nodes, edges, schema)
- Agent service foundation (threads, messages, tools)
- DynamoDB tables (will create during Phase 1)

### Blocking Dependencies
None - all dependencies are either installed or created during phases

## Success Metrics

### Technical Metrics
- Test coverage ≥ 80%
- Tool registry loads < 500ms
- Agent Studio responsive (60fps)
- Message rendering < 100ms
- Workflow canvas handles 50+ nodes
- Zero regression in existing functionality

### User Metrics
- Agent creation time < 5 minutes
- Tool discovery rated intuitive (user testing)
- Live testing provides value (user feedback)
- Workflow visualization clear (user feedback)

### Business Metrics
- 3 agent types working with unified interface
- 100% ontology coverage for tools
- All AI SDK 6 components integrated
- Visual workflow builder functional

## Rollout Strategy

### Phase 1-2: Silent Launch
- Implement in existing `/agent` route
- No announcement, internal testing only
- Gather feedback from team

### Phase 3-4: Beta Launch
- Announce new features to beta users
- Monitor feedback tracking (like/dislike)
- Fix issues rapidly

### Phase 5-6: Power User Features
- Document workflow builder
- Create tutorial videos
- Invite power users to test

### Phase 7: Full Launch
- Launch Agent Studio at `/agentstudio`
- Marketing announcement
- User training sessions
- Monitor analytics

## Contingency Plans

### If Phase 4 Takes Longer (Ontology Tool Generation)
- **Fallback**: Ship with manual tool creation only
- **Timeline Impact**: Delay Phase 5 by 1 week
- **User Impact**: Lower (users can still create custom tools)

### If Phase 6 Takes Longer (Workflow Canvas)
- **Fallback**: Ship with form-based workflow configuration
- **Timeline Impact**: Delay Phase 7 by 1 week
- **User Impact**: Medium (visual builder is nice-to-have)

### If Phase 7 Takes Longer (Agent Studio)
- **Fallback**: Use existing `/agent/builder` page
- **Timeline Impact**: Ship incrementally
- **User Impact**: Low (existing interface works)

## Post-Launch

### Monitoring
- Track feedback submissions (like/dislike ratios)
- Monitor tool usage analytics
- Track agent creation metrics
- Performance monitoring (latency, errors)

### Maintenance
- Weekly review of feedback
- Monthly analytics review
- Quarterly feature planning
- Bug fix rotation

### Future Enhancements
- Agent marketplace (share templates)
- A/B testing between models
- Advanced analytics dashboard
- Agent performance optimization
