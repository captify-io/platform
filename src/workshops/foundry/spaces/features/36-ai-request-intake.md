# Feature 36: AI Request Intake

**Persona:** System
**Priority:** Critical
**Effort:** X-Large
**Status:** Sprint 1

## Overview
Advanced AI-powered request intake system that intelligently processes incoming requests from multiple channels (email, forms, chat, API), classifies them, extracts key information, and routes to appropriate teams.

## Requirements
### Functional
1. Accept requests from multiple sources (email, web form, chat, API)
2. AI classification (type, priority, complexity, domain)
3. Extract structured data (title, description, requirements, constraints)
4. Identify stakeholders and suggest assignees
5. Detect duplicates and related requests
6. Auto-create tasks/features from requests
7. Learning from corrections and feedback

### Non-Functional
1. Process requests in <3s, Support 10K+ requests/day, 85% classification accuracy, Multi-language support, Secure API endpoints, Scalable architecture

## Ontology
### Nodes Used: Request (Feature 08), Task (Feature 01), Feature (Feature 02)

## Components
```typescript
// /opt/captify-apps/core/src/components/spaces/features/ai-intake/intake-form.tsx (REUSABLE)
export function AIIntakeForm({ spaceId }: { spaceId: string })

// /opt/captify-apps/core/src/components/spaces/features/ai-intake/classification-result.tsx (REUSABLE)
export function ClassificationResult({ request }: { request: Request })

// /opt/captify-apps/core/src/components/spaces/features/ai-intake/duplicate-detector.tsx (REUSABLE)
export function DuplicateDetector({ request }: { request: Request })
```

## Actions
### 1. Process Incoming Request
```typescript
interface ProcessRequestRequest {
  source: 'email' | 'form' | 'chat' | 'api';
  rawContent: string;
  metadata?: {
    senderEmail?: string;
    subject?: string;
    conversationId?: string;
  };
}

interface ProcessRequestResponse {
  request: Request;
  classification: {
    category: 'feature' | 'bug' | 'task' | 'question' | 'support';
    priority: 'low' | 'medium' | 'high' | 'critical';
    complexity: 'simple' | 'moderate' | 'complex';
    confidence: number;
  };
  extractedInfo: {
    title: string;
    description: string;
    acceptanceCriteria?: string[];
    requiredBy?: string;
    constraints?: string[];
  };
  suggestedActions: {
    createTask?: boolean;
    createFeature?: boolean;
    routeToWorkstream?: string;
    assignTo?: string;
  };
  duplicates?: Array<{
    requestId: string;
    similarity: number;
  }>;
}
```

**Implementation:**
```typescript
async function processIncomingRequest(
  request: ProcessRequestRequest,
  credentials: AwsCredentials
): Promise<ProcessRequestResponse> {
  // Step 1: AI Classification
  const classificationPrompt = `Analyze this incoming request and classify it:

Content: ${request.rawContent}

Provide:
1. Category (feature, bug, task, question, support)
2. Priority (low, medium, high, critical)
3. Complexity (simple, moderate, complex)
4. Confidence score (0-1)
5. Extracted structured information (title, description, acceptance criteria)
6. Suggested assignment (if determinable)

Respond in JSON format.`;

  const aiResponse = await bedrock.invoke({
    modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
    messages: [{ role: 'user', content: classificationPrompt }],
    temperature: 0.3
  }, credentials);

  const classification = JSON.parse(aiResponse.content);

  // Step 2: Duplicate Detection
  const duplicates = await detectDuplicates(classification.extractedInfo.title, credentials);

  // Step 3: Create Request Record
  const newRequest: Request = {
    id: uuidv4(),
    spaceId: request.metadata?.spaceId || 'default',
    title: classification.extractedInfo.title,
    description: classification.extractedInfo.description,
    source: request.source,
    status: 'new',
    requestorEmail: request.metadata?.senderEmail,
    aiSummary: classification.extractedInfo.description,
    aiCategory: classification.category,
    aiPriority: classification.priority,
    aiRecommendedAssignee: classification.suggestedAssignment,
    aiConfidence: classification.confidence,
    createdAt: new Date().toISOString()
  };

  await dynamodb.put({
    table: 'core-request',
    item: newRequest
  }, credentials);

  return {
    request: newRequest,
    classification,
    extractedInfo: classification.extractedInfo,
    suggestedActions: classification.suggestedActions,
    duplicates
  };
}
```

### 2. Detect Duplicate Requests
```typescript
interface DetectDuplicatesRequest {
  title: string;
  description?: string;
  spaceId: string;
}

interface DuplicateResult {
  requestId: string;
  title: string;
  similarity: number;
  status: string;
}
```

**Implementation using embeddings:**
```typescript
async function detectDuplicates(
  title: string,
  credentials: AwsCredentials
): Promise<DuplicateResult[]> {
  // Generate embedding for new request
  const embedding = await bedrock.invoke({
    modelId: 'amazon.titan-embed-text-v1',
    inputText: title
  }, credentials);

  // Search similar requests using vector search (Kendra or OpenSearch)
  const similarRequests = await kendra.query({
    indexId: 'request-index',
    queryText: title,
    attributeFilter: {
      EqualsTo: {
        Key: 'status',
        Value: { StringValue: 'new' }
      }
    }
  }, credentials);

  return similarRequests.map(req => ({
    requestId: req.id,
    title: req.title,
    similarity: req.relevanceScore,
    status: req.status
  })).filter(req => req.similarity > 0.8);
}
```

### 3. Email-to-Request Ingestion
```typescript
interface EmailIntakeConfig {
  inboxAddress: string; // requests@captify.io
  parsingRules: {
    subjectToTitle: boolean;
    bodyToDescription: boolean;
    extractAttachments: boolean;
  };
}

async function processIncomingEmail(
  email: {
    from: string;
    subject: string;
    body: string;
    attachments?: File[];
  }
): Promise<Request> {
  // Parse email and extract structured data
  const processed = await processIncomingRequest({
    source: 'email',
    rawContent: `Subject: ${email.subject}\n\n${email.body}`,
    metadata: {
      senderEmail: email.from,
      subject: email.subject
    }
  });

  // Upload attachments if any
  if (email.attachments) {
    for (const attachment of email.attachments) {
      await uploadDocument({
        spaceId: processed.request.spaceId,
        file: attachment,
        linkedEntities: [{ entityType: 'request', entityId: processed.request.id }]
      });
    }
  }

  return processed.request;
}
```

## User Stories
### Story 1: System Processes Email Request
**Tasks:** Receive email, extract info, classify with AI, create request record, notify manager
**Acceptance:** Request created with 85% accurate classification

### Story 2: System Detects Duplicate Requests
**Tasks:** Check for similar requests, calculate similarity, flag potential duplicates, suggest linking
**Acceptance:** Duplicates detected with >80% similarity

### Story 3: System Auto-Converts High-Confidence Requests
**Tasks:** Check AI confidence, if >90% create task/feature automatically, notify creator, add to backlog
**Acceptance:** High-confidence requests converted without human intervention

### Story 4: System Learns from Corrections
**Tasks:** Track manager overrides, log corrections, retrain model periodically, improve accuracy
**Acceptance:** Classification accuracy improves over time

## Implementation Notes

### AI Classification System Prompt (Detailed)
```typescript
const AI_INTAKE_SYSTEM_PROMPT = `You are an intelligent request intake assistant for a project management system. Your job is to analyze incoming requests and extract structured information.

Given a request, provide:

1. **Classification:**
   - category: "feature" | "bug" | "task" | "question" | "support"
   - priority: "low" | "medium" | "high" | "critical"
   - complexity: "simple" | "moderate" | "complex"
   - confidence: 0.0 - 1.0 (how confident you are)

2. **Extracted Information:**
   - title: concise title (5-10 words)
   - description: detailed description
   - acceptanceCriteria: array of clear acceptance criteria
   - requiredBy: deadline if mentioned
   - constraints: any constraints or limitations
   - affectedSystems: systems/components affected

3. **Routing:**
   - suggestedWorkstream: best workstream for this request
   - suggestedAssignee: recommended assignee (if skills match)
   - reasoning: why this routing

4. **Actions:**
   - shouldCreateTask: boolean
   - shouldCreateFeature: boolean
   - shouldEscalate: boolean (if urgent/critical)

Respond ONLY with valid JSON. Be concise but thorough.`;
```

### Learning Pipeline
```typescript
class AIIntakeLearningPipeline {
  async logCorrection(
    requestId: string,
    aiClassification: any,
    humanCorrection: any
  ): Promise<void> {
    // Log correction for training
    await dynamodb.put({
      table: 'core-ai-training-data',
      item: {
        id: uuidv4(),
        requestId,
        aiPrediction: aiClassification,
        humanCorrection,
        timestamp: new Date().toISOString()
      }
    });
  }

  async retrainModel(): Promise<void> {
    // Periodic retraining (weekly)
    const corrections = await dynamodb.scan({
      table: 'core-ai-training-data',
      filter: {
        timestamp: { $gte: weekAgo() }
      }
    });

    // Fine-tune model with corrections
    // (Implementation depends on AI service used)
  }
}
```

## Testing
```typescript
describe('AIRequestIntake', () => {
  it('classifies feature request correctly', async () => {
    const result = await processIncomingRequest({
      source: 'form',
      rawContent: 'We need a dashboard to track project metrics in real-time'
    });

    expect(result.classification.category).toBe('feature');
    expect(result.classification.confidence).toBeGreaterThan(0.8);
    expect(result.extractedInfo.title).toContain('dashboard');
  });

  it('detects duplicate requests', async () => {
    const duplicates = await detectDuplicates('Dashboard for project metrics');

    expect(duplicates.length).toBeGreaterThan(0);
    expect(duplicates[0].similarity).toBeGreaterThan(0.8);
  });

  it('processes email to request', async () => {
    const request = await processIncomingEmail({
      from: 'user@example.com',
      subject: 'Feature Request: User Authentication',
      body: 'We need OAuth2 login for our application'
    });

    expect(request.source).toBe('email');
    expect(request.requestorEmail).toBe('user@example.com');
  });
});
```

## Dependencies
- AWS Bedrock (Claude for classification)
- AWS Kendra (duplicate detection)
- Feature 08 (Request Inbox)

## Status: Sprint 1, Not Started
