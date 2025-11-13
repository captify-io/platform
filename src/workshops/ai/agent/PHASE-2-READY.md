# Phase 2 Preparation - COMPLETE ✅

**Date**: 2025-11-03
**Status**: Ready to Begin Implementation

---

## Phase 2 Features

### Feature 04: Chain of Thought Visualization
**Priority**: P1 | **Story Points**: 8 | **Estimated**: 16 hours

**User Stories Created**: 5 stories, 17 test scenarios
- US-04-01: View reasoning steps (collapsible)
- US-04-02: Display tool calls within steps
- US-04-03: Show duration for each step
- US-04-04: Collapse/expand individual steps
- US-04-05: Persist visibility preference

**Key Components to Build**:
- `ChainOfThought` - Main collapsible section
- `ReasoningStep` - Individual step with tool badges
- `DurationBadge` - Time display component

**File**: [04-chain-of-thought.yaml](file:///opt/captify-apps/workshops/agent/user-stories/04-chain-of-thought.yaml)

---

### Feature 05: Inline Citations
**Priority**: P1 | **Story Points**: 6 | **Estimated**: 12 hours

**User Stories Created**: 5 stories, 15 test scenarios
- US-05-01: Display citation markers in text
- US-05-02: Show tooltip on hover
- US-05-03: Display sources list at bottom
- US-05-04: Show source type with icons
- US-05-05: Display confidence scores

**Key Components to Build**:
- `MessageWithCitations` - Parse and render citations
- `CitationMarker` - Clickable [1] badge with tooltip
- `SourcesList` - Sources at bottom of message
- `ConfidenceIndicator` - Visual confidence display

**File**: [05-inline-citations.yaml](file:///opt/captify-apps/workshops/agent/user-stories/05-inline-citations.yaml)

---

### Feature 06: Image Support
**Priority**: P2 | **Story Points**: 8 | **Estimated**: 16 hours

**User Stories Created**: 5 stories, 15 test scenarios
- US-06-01: Display images in messages
- US-06-02: Upload images to conversation
- US-06-03: Generate images using AI (Bedrock)
- US-06-04: View in full-screen modal
- US-06-05: Optimize loading performance

**Key Components to Build**:
- `ImageMessage` - Display inline with lazy loading
- `ImageUpload` - Upload to S3 with preview
- `ImageGenerationStatus` - Progress indicator
- `ImageModal` - Full-screen viewer with zoom
- `ImageOptimizer` - Lazy load + srcset

**File**: [06-image-support.yaml](file:///opt/captify-apps/workshops/agent/user-stories/06-image-support.yaml)

---

## Test Generation

**Ready to generate tests**:
```bash
cd /opt/captify-apps/workshops/agent
npm run generate:tests
```

**Expected Output**:
- `tests/04-chain-of-thought.test.ts` (~350 lines)
- `tests/05-inline-citations.test.ts` (~300 lines)
- `tests/06-image-support.test.ts` (~300 lines)

**Total**: ~950 lines of test code from 47 test scenarios

---

## Implementation Order

### Week 1: Chain of Thought (Feature 04)
1. Generate tests from YAML
2. Create `ChainOfThought` component (collapsible)
3. Create `ReasoningStep` sub-component
4. Add tool badges and duration display
5. Implement localStorage persistence
6. Integrate into chat.tsx
7. Build and verify

### Week 2: Inline Citations (Feature 05)
1. Generate tests from YAML
2. Create citation parsing utility
3. Create `CitationMarker` with tooltip
4. Create `SourcesList` component
5. Add confidence indicators
6. Integrate into markdown rendering
7. Build and verify

### Week 3: Image Support (Feature 06)
1. Generate tests from YAML
2. Create `ImageMessage` with lazy loading
3. Create `ImageUpload` with S3 integration
4. Integrate Bedrock image generation
5. Create `ImageModal` for full-screen view
6. Add performance optimizations
7. Build and verify

---

## Dependencies Required

### Already Installed ✅
- `@ai-sdk/*` packages
- `react-syntax-highlighter`
- `sonner`

### Need to Verify
- `@aws-sdk/client-s3` for image upload
- `@aws-sdk/client-bedrock-runtime` for image generation

### May Need to Install
- Image optimization library (sharp or next/image)
- Zoom/pan library for image modal

---

## Integration Points

### Message Metadata Extensions

Need to update `MessageMetadata` type in `types/feedback.ts`:

```typescript
export interface MessageMetadata {
  // Existing
  tokenUsage?: TokenUsage;
  cost?: CostInfo;

  // NEW for Phase 2
  reasoning?: ReasoningStep[];      // Feature 04
  sources?: CitationSource[];       // Feature 05
  images?: ImagePart[];             // Feature 06
}
```

### Chat Panel Integration

Will modify `chat.tsx` to handle new message part types:
- Reasoning steps (before text content)
- Citations (within text content)
- Images (as separate message parts)

---

## Testing Strategy

### TDD Workflow
1. **Red**: Generate tests, run them, expect failures
2. **Green**: Implement components until tests pass
3. **Refactor**: Clean up code, optimize

### Manual Testing Checklist
- [ ] Reasoning steps collapse/expand smoothly
- [ ] Citation tooltips show on hover
- [ ] Citation markers are clickable
- [ ] Images lazy load as you scroll
- [ ] Image upload to S3 works
- [ ] Image generation via Bedrock works
- [ ] Full-screen modal opens/closes
- [ ] localStorage persists preferences
- [ ] No breaking changes to existing features

---

## Non-Breaking Changes Guarantee

All Phase 2 features are:
- **Additive**: Don't modify existing code
- **Optional**: Only render if metadata exists
- **Graceful**: Hide themselves if data missing

**Example**:
```typescript
// Reasoning only shows if metadata.reasoning exists
{message.metadata?.reasoning && (
  <ChainOfThought reasoning={message.metadata.reasoning} />
)}

// Citations only parse if sources exist
{message.metadata?.sources && (
  <MessageWithCitations
    content={content}
    sources={message.metadata.sources}
  />
)}
```

---

## Success Criteria

Phase 2 will be complete when:
- ✅ All 3 YAML user stories created
- ✅ All tests generated (47 scenarios)
- ✅ All 3 features implemented
- ✅ All tests passing
- ✅ Core package builds successfully
- ✅ No TypeScript errors
- ✅ No breaking changes
- ✅ Documentation updated
- ✅ status.md reflects 60% completion (43/71 story points)

---

## Timeline Estimate

- **Week 1**: Chain of Thought (16 hours)
- **Week 2**: Inline Citations (12 hours)
- **Week 3**: Image Support (16 hours)

**Total**: 44 hours / ~3 weeks

**Target Completion**: End of November 2025

---

## Next Command

When ready to begin Phase 2 implementation:

```bash
# Generate tests from YAML
cd /opt/captify-apps/workshops/agent
npm run generate:tests

# Verify test files created
ls -lh tests/04-*.test.ts tests/05-*.test.ts tests/06-*.test.ts

# Run tests (expect failures - TDD Red phase)
cd /opt/captify-apps/core
npm test
```

---

**Status**: ✅ YAML Complete | 📋 Tests Ready to Generate | 🚀 Ready for Implementation
