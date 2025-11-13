# Feature: Context Display Component

## Overview

Build a context display component that shows token usage, cost estimation, and selected context items (files, datasources, ontology) for each message and the overall conversation.

## Requirements

### Functional Requirements

1. **Token Usage Display**
   - Show input/output/total tokens per message
   - Visual progress bar for context window utilization
   - Color-coded (green < 50%, yellow 50-80%, red > 80%)
   - Aggregate view for entire thread

2. **Cost Estimation**
   - Calculate cost based on provider pricing
   - Show per-message and cumulative cost
   - Support multiple providers (OpenAI, Anthropic, Bedrock)
   - Currency formatting (USD)

3. **Context Items**
   - List files, datasources, ontology items used
   - Icons and names for each item
   - Click to view/remove item
   - Count indicator (e.g., "3 files, 2 datasources")

4. **Collapsible Panel**
   - Expand/collapse in chat header
   - Default: collapsed (show summary only)
   - Expanded: show detailed breakdown
   - Persistent state (localStorage)

### Non-Functional Requirements

1. **Performance**: < 50ms render time
2. **Accuracy**: Token counts within 5% of actual
3. **Real-time**: Updates immediately after message

## User Stories

### US-1: Monitor Token Usage
**As a** user
**I want** to see how many tokens each message uses
**So that** I can manage my context window

**Acceptance Criteria**:
- ✅ Token count visible per message
- ✅ Progress bar shows context utilization
- ✅ Color changes based on usage level
- ✅ Total tokens shown in thread

### US-2: Estimate Costs
**As a** user
**I want** to see the cost of my conversations
**So that** I can budget my API usage

**Acceptance Criteria**:
- ✅ Cost shown per message
- ✅ Cumulative cost for thread
- ✅ Accurate pricing per provider
- ✅ USD currency formatting

### US-3: View Context Items
**As a** user
**I want** to see what context is being used
**So that** I understand what the agent knows

**Acceptance Criteria**:
- ✅ List of files/datasources/ontology items
- ✅ Icons and names displayed
- ✅ Count summary in header
- ✅ Click to view details

## Dependencies

- Token counting library (tiktoken or @anthropic-ai/tokenizer)
- Provider pricing data
- Context items from AgentProvider

## Success Metrics

- 70%+ of users check token usage
- 40%+ of users monitor costs
- Reduced "why is this slow" support tickets
