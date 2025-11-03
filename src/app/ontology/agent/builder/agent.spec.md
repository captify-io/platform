# Agent Builder AI SDK Integration Specification

## Overview

Refactor the agent chat system to leverage AI SDK's tool calling and message management, fixing the context loss issue in multi-turn conversations. Replace plumbing while keeping the existing UI unchanged.

## Core Requirements

### ✅ Unified Service Route
1. **`platform.agent`** - Unified service for all agent types (streaming with AI SDK)
   - Loads providers and models from DynamoDB (`core-Provider`, `core-ProviderModel`)
   - Supports OpenAI, Anthropic, Bedrock models dynamically
   - No hardcoded provider or model references
   - Also supports AWS Bedrock Agents with agentId/agentAliasId from database
   - Stream when AWS API supports it

### ✅ No Hardcoded Providers/Models
- **Remove**: Hardcoded `openai('gpt-4o')`, `anthropic('claude-3-5-sonnet')` references
- **Add**: Dynamic provider/model resolution from `core-Provider` and `core-ProviderModel` tables
- **Keep**: Hardcoded table names like `'core-Provider'`, `'core-Tool'` are fine

### ✅ Clean Up Unused Code
- Delete duplicate chat components
- Remove unused operations
- Consolidate message handling
- No "v2", "enhanced", or "new" suffixes

### ✅ Stream Everything
- All responses stream by default
- Use AI SDK's `streamText()` for assistants
- Stream AWS Bedrock Agent responses when API supports it

## Problem Statement

**Context Loss Issue**:
```typescript
// Current (BROKEN):
streamText() completes → only save text
Next message → AI has no memory of tool calls/results

// Fixed (THIS SPEC):
streamText() completes → save response.messages (includes tool history)
Next message → AI has full context of previous tool interactions
```

## Database Tables (Existing)

### Core Tables
- `core-Provider` - AI providers (OpenAI, Anthropic, Bedrock, etc.)
- `core-ProviderModel` - Available models per provider
- `core-Agent` - Agent configurations (both assistant and bedrock agent types)
- `core-Thread` - Conversation threads with messages
- `core-Tool` - Tool definitions

### Provider Schema
```typescript
interface Provider {
  id: string;              // 'provider_...'
  name: string;           // 'OpenAI', 'Anthropic', 'AWS Bedrock'
  slug: string;           // 'openai', 'anthropic', 'bedrock'
  vendor: string;         // 'openai', 'anthropic', 'amazon'
  type: string;           // 'llm'
  status: 'active' | 'inactive';
  config: {
    apiKeyEnvVar?: string;   // e.g., 'OPENAI_API_KEY'
    requiresAwsAuth?: boolean;
    region?: string;
  };
  features: string[];     // ['chat', 'tools', 'streaming', 'vision']
}
```

### ProviderModel Schema
```typescript
interface ProviderModel {
  id: string;              // 'model_...'
  providerId: string;      // References Provider.id
  modelId: string;         // 'gpt-4o', 'claude-3-5-sonnet-20241022-v2:0'
  name: string;           // 'GPT-4o', 'Claude 3.5 Sonnet'
  status: 'available' | 'deprecated';
  capabilities: {
    contextWindow: number;
    maxOutputTokens: number;
    supportsTools: boolean;
    supportsVision: boolean;
    supportsStreaming: boolean;
  };
  defaults: {
    temperature: number;
    maxTokens: number;
    topP?: number;
  };
  pricing: {
    inputTokenPrice: number;
    outputTokenPrice: number;
  };
}
```

## Implementation Plan

### Phase 1: Unified `platform.agent` Service

**File**: `core/src/services/agent/index.ts` (CONSOLIDATED)

**Purpose**: Handle streaming chat for provider/model combinations and Bedrock agents with tool support

#### Operations:
1. `streamMessage` - Stream response with tools (AI SDK format)
2. `getThread` - Load thread with message history
3. `createThread` - Create new conversation
4. `updateThread` - Save messages

#### Dynamic Provider/Model Resolution:

```typescript
// Load provider from database
async function getProviderConfig(providerId: string, credentials: AwsCredentials) {
  const client = await createDynamoClient(credentials);
  const schema = process.env.SCHEMA || 'captify';

  const { GetCommand } = await import('@aws-sdk/lib-dynamodb');
  const command = new GetCommand({
    TableName: `${schema}-core-Provider`,
    Key: { id: providerId }
  });

  const result = await client.send(command);
  if (!result.Item) {
    throw new Error(`Provider ${providerId} not found`);
  }

  return result.Item as Provider;
}

// Load model from database
async function getModelConfig(modelId: string, credentials: AwsCredentials) {
  const client = await createDynamoClient(credentials);
  const schema = process.env.SCHEMA || 'captify';

  const { GetCommand } = await import('@aws-sdk/lib-dynamodb');
  const command = new GetCommand({
    TableName: `${schema}-core-ProviderModel`,
    Key: { id: modelId }
  });

  const result = await client.send(command);
  if (!result.Item) {
    throw new Error(`Model ${modelId} not found`);
  }

  return result.Item as ProviderModel;
}

// Create AI SDK model instance dynamically
function createAIModel(
  provider: Provider,
  model: ProviderModel,
  credentials?: AwsCredentials
) {
  const { openai } = await import('@ai-sdk/openai');
  const { anthropic } = await import('@ai-sdk/anthropic');
  const { createAmazonBedrock } = await import('@ai-sdk/amazon-bedrock');

  switch (provider.vendor) {
    case 'openai':
      // Use API key from environment
      const apiKey = process.env[provider.config.apiKeyEnvVar || 'OPENAI_API_KEY'];
      return openai(model.modelId, { apiKey });

    case 'anthropic':
      const anthropicKey = process.env[provider.config.apiKeyEnvVar || 'ANTHROPIC_API_KEY'];
      return anthropic(model.modelId, { apiKey: anthropicKey });

    case 'amazon':
      if (!credentials) {
        throw new Error('AWS credentials required for Bedrock');
      }
      const bedrockProvider = createAmazonBedrock({
        region: credentials.region,
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
        sessionToken: credentials.sessionToken,
      });
      return bedrockProvider(model.modelId);

    default:
      throw new Error(`Unsupported provider vendor: ${provider.vendor}`);
  }
}
```

#### streamMessage Operation:

```typescript
case 'streamMessage': {
  const {
    threadId,
    message,
    settings,
    enableTools = false,
    toolServices = []
  } = data;

  // 1. Load provider and model from database
  const provider = await getProviderConfig(settings.providerId, credentials);
  const model = await getModelConfig(settings.modelId, credentials);

  // 2. Create AI SDK model dynamically
  const aiModel = createAIModel(provider, model, credentials);

  // 3. Load thread messages
  const thread = await loadThread(threadId, credentials);
  const aiMessages = convertToAIMessages(thread.messages);

  // 4. Add system prompt if configured
  if (settings.systemPrompt) {
    aiMessages.unshift({
      role: 'system',
      content: settings.systemPrompt
    });
  }

  // 5. Load tools if enabled
  let tools = undefined;
  if (enableTools && toolServices.length > 0) {
    const { generateAllTools } = await import('../lib/tool-generator');
    const allTools = await generateAllTools(credentials);

    tools = {};
    for (const serviceName of toolServices) {
      if (allTools[serviceName]) {
        Object.assign(tools, allTools[serviceName]);
      }
    }
  }

  // 6. Stream with AI SDK
  const streamResult = await streamText({
    model: aiModel,
    messages: aiMessages,
    temperature: settings.temperature || model.defaults.temperature,
    maxTokens: settings.maxTokens || model.defaults.maxTokens,
    ...(tools && { tools, maxToolRoundtrips: 5 }),

    onFinish: async ({ response, usage }) => {
      // CRITICAL: Save complete message history including tools
      await saveThreadMessages(
        threadId,
        response.messages, // Full AI SDK message array
        usage,
        credentials
      );
    }
  });

  // 7. Return AI SDK stream
  const customStream = createDataStream(streamResult);
  return {
    success: true,
    data: {
      stream: new Response(customStream, {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      })
    }
  };
}
```

#### Message Persistence (THE FIX):

```typescript
async function saveThreadMessages(
  threadId: string,
  aiMessages: CoreMessage[], // From AI SDK response.messages
  usage: any,
  credentials: AwsCredentials
) {
  const client = await createDynamoClient(credentials);
  const schema = process.env.SCHEMA || 'captify';

  // Convert AI SDK messages to storage format
  const storageMessages = aiMessages.map(msg => ({
    id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    threadId,
    role: msg.role,
    content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
    timestamp: Date.now(),

    // Preserve tool data
    ...(msg.role === 'assistant' && msg.toolCalls && {
      toolInvocations: msg.toolCalls.map(tc => ({
        state: 'result',
        toolCallId: tc.toolCallId,
        toolName: tc.toolName,
        args: tc.args,
        result: tc.result
      }))
    })
  }));

  // Update thread in DynamoDB
  const { UpdateCommand } = await import('@aws-sdk/lib-dynamodb');
  await client.send(new UpdateCommand({
    TableName: `${schema}-core-Thread`,
    Key: { id: threadId },
    UpdateExpression: 'SET messages = :messages, updatedAt = :updatedAt, metadata.tokenUsage = :usage',
    ExpressionAttributeValues: {
      ':messages': storageMessages,
      ':updatedAt': Date.now(),
      ':usage': {
        total: usage.totalTokens,
        input: usage.promptTokens,
        output: usage.completionTokens
      }
    }
  }));
}
```

### Phase 2: Enhance `platform.agent` Service

**File**: `core/src/services/agent.ts` (MODIFY EXISTING)

#### Changes:
1. **Remove hardcoded model references** (lines 104-126)
2. **Keep streaming for Bedrock Agent** (already works)
3. **Consolidate with assistant logic where possible**

#### Delete This Function:
```typescript
// ❌ DELETE - Lines 104-126
const getAIModel = (provider: string, model: string, credentials?: AwsCredentials) => {
  switch (provider) {
    case 'openai':
      return openai(model); // ❌ Hardcoded
    case 'anthropic':
      return anthropic(model); // ❌ Hardcoded
    case 'bedrock':
      return bedrock(model); // ❌ Hardcoded
    default:
      return openai('gpt-4o'); // ❌ Hardcoded fallback
  }
};
```

#### Keep and Enhance:
- `sendMessage` for Bedrock Agent (non-streaming AWS API)
- `streamMessage` for Bedrock Agent when API supports streaming
- Thread management operations
- Dynamic agent config loading from database (lines 156-196) ✅

### Phase 3: Update Frontend (Minimal Changes)

**File**: `core/src/components/agent/chat.tsx`

#### Keep Everything Except:
All calls use the unified `platform.agent` service:

```typescript
// Around line 155
const handleSendMessage = async () => {
  if (!input.trim() || isStreaming) return;

  const messageContent = input.trim();
  setInput("");

  // Use unified platform.agent service for all modes
  await streamMessage(messageContent, knowledgeScope, selectedSpace, enableTools, selectedToolServices);
};
```

**File**: `core/src/components/agent/index.tsx`

#### Update streamMessage function (lines 341-531):

```typescript
const streamMessage = useCallback(
  async (content: string, knowledgeScope: string = 'none', ...) => {
    try {
      setIsStreaming(true);

      // Create thread if needed
      let threadToUse = currentThread;
      if (!threadToUse) {
        threadToUse = await createNewThread();
      }

      // Add user message to UI
      const userMessage: AgentMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        threadId: threadToUse.id,
        role: "user",
        content,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMessage]);

      // Use unified platform.agent service for all modes
      const response = await fetch("/api/captify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-app": "core",
        },
        body: JSON.stringify({
          service: 'platform.agent', // Unified service
          operation: "streamMessage",
          data: {
            threadId: threadToUse.id,
            message: content,
            settings: {
              // For assistant mode
              providerId: settings.providerId,
              modelId: settings.modelId,
              // For agent mode
              agentId: settings.agentId,
              agentAliasId: settings.agentAliasId,
              // Common
              temperature: settings.temperature,
              systemPrompt: settings.systemPrompt,
              mode: settings.mode,
            },
            knowledgeScope,
            selectedSpace,
            enableTools,
            toolServices,
          },
        }),
      });

      // Handle stream (existing code works)
      if (response.ok && response.body) {
        // ... existing streaming logic ...
      }
    } catch (error) {
      console.error("Failed to stream message:", error);
    } finally {
      setIsStreaming(false);
    }
  },
  [currentThread, settings, executeAgent]
);
```

### Phase 4: Update Agent Builder UI

**File**: `platform/src/app/core/designer/agent/builder/page.tsx`

#### Changes:
1. **Replace model dropdown** with provider + model selection
2. **Load providers from database**
3. **Load models for selected provider**
4. **Pass providerId and modelId instead of provider/model strings**

```typescript
// Around lines 262-327 (Assistant Mode Fields)
{mode === 'assistant' && (
  <>
    <div className="space-y-2">
      <Label htmlFor="provider">Provider</Label>
      <Select
        value={formData.providerId || ''}
        onValueChange={(value) => {
          setFormData({ ...formData, providerId: value, modelId: undefined });
          loadModelsForProvider(value);
        }}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select a provider" />
        </SelectTrigger>
        <SelectContent>
          {providers.map((provider) => (
            <SelectItem key={provider.id} value={provider.id}>
              {provider.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>

    <div className="space-y-2">
      <Label htmlFor="model">Model</Label>
      <Select
        value={formData.modelId || ''}
        onValueChange={(value) => setFormData({ ...formData, modelId: value })}
        disabled={!formData.providerId || loadingModels}
      >
        <SelectTrigger>
          <SelectValue placeholder={loadingModels ? 'Loading...' : 'Select a model'} />
        </SelectTrigger>
        <SelectContent>
          {availableModels.map((model) => (
            <SelectItem key={model.id} value={model.id}>
              {model.name}
              <span className="text-xs text-muted-foreground ml-2">
                ({model.capabilities.contextWindow / 1000}k context)
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  </>
)}
```

### Phase 5: Code Cleanup (Delete Unused)

#### Files to Delete:
- None currently - we're modifying existing files

#### Code to Delete:

**In `core/src/services/agent.ts`**:
- [ ] Lines 104-126: `getAIModel()` function
- [ ] Any hardcoded provider/model references
- [ ] Unused import statements for hardcoded providers

**In `core/src/components/agent/`**:
- [ ] Remove any duplicate message handling
- [ ] Consolidate tool rendering logic
- [ ] Remove unused state variables

## Testing Plan

### ✅ Test 1: Dynamic Provider/Model Loading
**Setup**: Create providers and models in DynamoDB
```sql
-- core-Provider
{
  "id": "provider_openai",
  "name": "OpenAI",
  "slug": "openai",
  "vendor": "openai",
  "status": "active",
  "config": {
    "apiKeyEnvVar": "OPENAI_API_KEY"
  }
}

-- core-ProviderModel
{
  "id": "model_gpt4o",
  "providerId": "provider_openai",
  "modelId": "gpt-4o",
  "name": "GPT-4o",
  "status": "available",
  "capabilities": {
    "contextWindow": 128000,
    "maxOutputTokens": 4096,
    "supportsTools": true,
    "supportsStreaming": true
  }
}
```

**Test Steps**:
- [ ] Select OpenAI provider in agent builder
- [ ] Models dropdown populates with GPT-4o
- [ ] Select GPT-4o
- [ ] Send test message
- [ ] Verify chat works with dynamically loaded model
- [ ] Check logs confirm no hardcoded references

### ✅ Test 2: Confirmation Flow (Context Preservation)
**Test Steps**:
- [ ] User: "Create a change request for server upgrade with high priority"
- [ ] AI calls `create_request` tool → returns confirmation
- [ ] AI: "I've prepared the request. Confirm to create?"
- [ ] **Verify in DB**: Thread messages include tool call with pending state
- [ ] User: "Yes, create it"
- [ ] **Critical**: Load thread, verify previous tool call is in messages
- [ ] AI calls `create_request` again with `confirmed: true`
- [ ] Tool executes successfully
- [ ] AI: "Created change request CR-12345"
- [ ] **Verify in DB**: Thread messages include both tool calls and final result

**Expected Logs**:
```
[ASSISTANT] Loading provider provider_openai from database
[ASSISTANT] Loading model model_gpt4o from database
[ASSISTANT] Creating AI SDK model for openai:gpt-4o
[TOOL] create_request called: {title, description, priority}
[TOOL] Returning confirmation request
[THREAD] Saving complete messages: [user, assistant(tool call), assistant(text)]
--- User responds "Yes" ---
[THREAD] Loading thread, message count: 3
[THREAD] Previous tool call found in messages
[TOOL] create_request called: {title, description, priority, confirmed: true}
[TOOL] Creating item in core-ChangeRequest
[TOOL] Success: {id: "cr-12345"}
[THREAD] Saving complete messages: [user, tool, assistant(tool call), assistant(text)]
```

### ✅ Test 3: Both Modes
**Assistant Mode**:
- [ ] Select Anthropic provider
- [ ] Select Claude 3.5 Sonnet model
- [ ] Enable tools
- [ ] Test multi-turn conversation
- [ ] Verify context preserved

**Agent Mode**:
- [ ] Select AWS Bedrock Agent
- [ ] Pick agent from dropdown (loaded from database)
- [ ] Test conversation
- [ ] Verify existing functionality still works

### ✅ Test 4: Multiple Providers
- [ ] Add OpenAI provider to database
- [ ] Add Anthropic provider to database
- [ ] Add Bedrock provider to database
- [ ] Switch between providers in same conversation
- [ ] Verify all work without code changes

### ✅ Test 5: Streaming Performance
- [ ] Test long response streaming
- [ ] Test tool execution during stream
- [ ] Verify no degradation in performance
- [ ] Check memory usage with long conversations

## Implementation Checklist

### Backend
- [ ] **Create `assistant.ts` service**
  - [ ] `streamMessage` operation
  - [ ] Dynamic provider loading from database
  - [ ] Dynamic model loading from database
  - [ ] `createAIModel()` function
  - [ ] Complete message persistence (with tools)
  - [ ] Tool loading integration
  - [ ] Service manifest

- [ ] **Modify `agent.ts` service**
  - [ ] Delete `getAIModel()` function (lines 104-126)
  - [ ] Remove hardcoded provider imports if unused
  - [ ] Keep Bedrock Agent operations
  - [ ] Enhance streaming where possible

- [ ] **Register `assistant` service**
  - [ ] Add to `core/src/services/index.ts`
  - [ ] Export in services registry

- [ ] **Update message types**
  - [ ] Add `toolInvocations` field to AgentMessage
  - [ ] Support AI SDK message format
  - [ ] Backwards compatible with existing messages

### Frontend
- [ ] **Update `ChatPanel`**
  - [ ] Dynamic service selection (assistant vs agent)
  - [ ] Pass providerId and modelId
  - [ ] Handle tool invocations in UI
  - [ ] No visual changes

- [ ] **Update `AgentProvider`**
  - [ ] Update `streamMessage` to use dynamic service
  - [ ] Handle both assistant and agent modes
  - [ ] Load complete message history

- [ ] **Update Agent Builder**
  - [ ] Add provider selection dropdown
  - [ ] Add dynamic model loading
  - [ ] Pass IDs instead of strings
  - [ ] Load providers from database
  - [ ] Load models per provider

### Database
- [ ] **Seed `core-Provider` table**
  - [ ] OpenAI provider
  - [ ] Anthropic provider
  - [ ] AWS Bedrock provider

- [ ] **Seed `core-ProviderModel` table**
  - [ ] GPT-4o, GPT-4o-mini models
  - [ ] Claude 3.5 Sonnet, Opus, Haiku models
  - [ ] Bedrock model variants

### Testing
- [ ] All tests from Testing Plan above
- [ ] Manual QA on each test case
- [ ] Performance benchmarks
- [ ] Error handling verification

## Success Criteria

### Functional
✅ No hardcoded providers or models in code
✅ Providers and models load from database
✅ Context preserved across multi-turn tool conversations
✅ Confirmation flows work correctly
✅ Both assistant and agent modes functional
✅ All responses stream by default

### Non-Functional
✅ UI remains unchanged
✅ Performance identical or better
✅ Code cleaner with deletions
✅ No "v2" or duplicate components
✅ Backwards compatible with existing threads

## Migration Plan

**Week 1**:
- Create unified `platform.agent` service
- Seed provider/model database tables
- Unit test dynamic loading

**Week 2**:
- Update frontend to use unified agent service
- Update agent builder UI
- Integration testing

**Week 3**:
- Delete unused code
- Final testing and bug fixes
- Performance validation

**Week 4**:
- Deploy to staging
- Production rollout
- Monitor and optimize
