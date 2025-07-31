# Database Integration - Amazon Neptune

_References: [README.md](./README.md) for overall architecture_

## 🎯 **Overview**

Amazon Neptune serves as the primary database for TITAN, storing all entities and relationships as a graph. This approach enables natural representation of complex relationships between users, applications, sessions, context, and decisions.

## 🗂️ **Graph Schema Design**

### **Core Entities (Vertices)**

```gremlin
// Organization - Top-level tenant
g.addV('Organization')
  .property('id', uuid())
  .property('name', 'Acme Corporation')
  .property('awsAccountId', '123456789012')
  .property('domain', 'acme.com')
  .property('tier', 'enterprise') // free, professional, enterprise
  .property('settings', '{"timezone": "UTC", "language": "en"}')
  .property('createdAt', datetime())
  .property('updatedAt', datetime())

// User - Individual platform users
g.addV('User')
  .property('id', uuid())
  .property('cognitoUserId', 'us-east-1:user-123')
  .property('email', 'john.doe@acme.com')
  .property('name', 'John Doe')
  .property('role', 'admin') // admin, user, viewer
  .property('preferences', '{"theme": "dark", "notifications": true}')
  .property('lastLogin', datetime())
  .property('isActive', true)
  .property('createdAt', datetime())
  .property('updatedAt', datetime())

// Application - Decision-making use cases
g.addV('Application')
  .property('id', uuid())
  .property('name', 'Strategic Planning Assistant')
  .property('description', 'AI-powered strategic planning and analysis')
  .property('category', 'Strategy')
  .property('icon', '🎯')
  .property('version', '1.0.0')
  .property('isActive', true)
  .property('isAwsNative', false)
  .property('awsServiceName', null)
  .property('tags', '["strategy", "planning", "analysis"]')
  .property('createdAt', datetime())
  .property('updatedAt', datetime())

// Agent - Bedrock agent configuration
g.addV('Agent')
  .property('id', uuid())
  .property('bedrockAgentId', 'AGENT123')
  .property('bedrockAliasId', 'PROD')
  .property('bedrockRegion', 'us-east-1')
  .property('model', 'anthropic.claude-3-sonnet')
  .property('instructions', 'You are a strategic planning assistant...')
  .property('maxTokens', 4000)
  .property('temperature', 0.7)
  .property('isValidated', true)
  .property('lastValidated', datetime())
  .property('createdAt', datetime())
  .property('updatedAt', datetime())

// Session - Decision conversation sessions
g.addV('Session')
  .property('id', uuid())
  .property('title', 'Q2 2025 Strategic Planning')
  .property('description', 'Analyzing market conditions and setting priorities')
  .property('status', 'active') // active, completed, archived
  .property('sessionType', 'decision') // decision, exploration, analysis
  .property('bedrockSessionId', 'bedrock-session-456')
  .property('messageCount', 0)
  .property('tokenUsage', 0)
  .property('duration', 0) // seconds
  .property('outcome', null) // JSON with decision details
  .property('createdAt', datetime())
  .property('updatedAt', datetime())
  .property('completedAt', null)

// Message - Individual chat messages
g.addV('Message')
  .property('id', uuid())
  .property('role', 'user') // user, assistant, system
  .property('content', 'What are the key market trends for Q2?')
  .property('tokens', 250)
  .property('bedrockTraceId', 'trace-789')
  .property('bedrockMetadata', '{"model": "claude-3", "latency": 1200}')
  .property('editCount', 0)
  .property('isEdited', false)
  .property('createdAt', datetime())
  .property('updatedAt', datetime())

// Document - Uploaded files and external sources
g.addV('Document')
  .property('id', uuid())
  .property('name', 'Market Research Report Q1 2025.pdf')
  .property('type', 'pdf') // pdf, docx, txt, csv, json
  .property('size', 2048576) // bytes
  .property('s3Bucket', 'titan-documents')
  .property('s3Key', 'org123/docs/market-research-q1-2025.pdf')
  .property('checksum', 'sha256:abc123...')
  .property('status', 'processed') // uploaded, processing, processed, failed
  .property('metadata', '{"pages": 45, "language": "en"}')
  .property('uploadedAt', datetime())
  .property('processedAt', datetime())

// Context - Extracted knowledge and insights
g.addV('Context')
  .property('id', uuid())
  .property('type', 'text_chunk') // text_chunk, entity, relationship, summary
  .property('content', 'Market growth is expected to reach 15% in Q2...')
  .property('embedding', '[0.1, 0.2, 0.3, ...]') // Vector embedding
  .property('relevanceScore', 0.85)
  .property('confidence', 0.92)
  .property('startIndex', 1024) // Character position in source
  .property('endIndex', 1248)
  .property('metadata', '{"topic": "market_growth", "sentiment": "positive"}')
  .property('extractedAt', datetime())

// Decision - Final outcomes and recommendations
g.addV('Decision')
  .property('id', uuid())
  .property('title', 'Focus on AI Integration for Q2')
  .property('description', 'Prioritize AI integration initiatives based on market analysis')
  .property('reasoning', 'Market research shows 40% demand increase for AI solutions...')
  .property('confidence', 0.9)
  .property('impact', 'high') // low, medium, high
  .property('status', 'approved') // draft, proposed, approved, rejected, implemented
  .property('actionItems', '["Hire AI team", "Budget allocation", "Timeline"]')
  .property('decidedBy', 'john.doe@acme.com')
  .property('decidedAt', datetime())
  .property('implementedAt', null)
```

### **Relationships (Edges)**

```gremlin
// Organizational structure
g.V().hasLabel('User').has('id', userId)
  .addE('BELONGS_TO').to(g.V().hasLabel('Organization').has('id', orgId))
  .property('joinedAt', datetime())
  .property('role', 'admin')

g.V().hasLabel('Application').has('id', appId)
  .addE('OWNED_BY').to(g.V().hasLabel('Organization').has('id', orgId))
  .property('createdAt', datetime())

// Application relationships
g.V().hasLabel('Application').has('id', appId)
  .addE('POWERED_BY').to(g.V().hasLabel('Agent').has('id', agentId))
  .property('configuredAt', datetime())
  .property('version', '1.0')

g.V().hasLabel('Application').has('id', appId)
  .addE('CREATED_BY').to(g.V().hasLabel('User').has('id', userId))
  .property('createdAt', datetime())

// User interactions
g.V().hasLabel('User').has('id', userId)
  .addE('FAVORITED').to(g.V().hasLabel('Application').has('id', appId))
  .property('favoritedAt', datetime())

g.V().hasLabel('User').has('id', userId)
  .addE('ACCESSED').to(g.V().hasLabel('Application').has('id', appId))
  .property('lastAccessed', datetime())
  .property('accessCount', 5)
  .property('totalDuration', 3600) // seconds

// Session relationships
g.V().hasLabel('Session').has('id', sessionId)
  .addE('IN_APPLICATION').to(g.V().hasLabel('Application').has('id', appId))
  .addE('PARTICIPATED_BY').to(g.V().hasLabel('User').has('id', userId))
  .addE('USES_AGENT').to(g.V().hasLabel('Agent').has('id', agentId))

// Message flow
g.V().hasLabel('Message').has('id', messageId)
  .addE('IN_SESSION').to(g.V().hasLabel('Session').has('id', sessionId))
  .property('sequenceNumber', 1)
  .property('timestamp', datetime())

g.V().hasLabel('Message').has('id', userMessageId)
  .addE('RESPONDED_BY').to(g.V().hasLabel('Message').has('id', assistantMessageId))
  .property('responseTime', 1200) // milliseconds

// Context relationships
g.V().hasLabel('Context').has('id', contextId)
  .addE('DERIVED_FROM').to(g.V().hasLabel('Document').has('id', docId))
  .property('extractionMethod', 'textract')
  .property('extractedAt', datetime())

g.V().hasLabel('Message').has('id', messageId)
  .addE('REFERENCES').to(g.V().hasLabel('Context').has('id', contextId))
  .property('relevanceScore', 0.85)
  .property('usageType', 'automatic') // automatic, manual, suggested

// Decision flow
g.V().hasLabel('Decision').has('id', decisionId)
  .addE('RESULTS_FROM').to(g.V().hasLabel('Session').has('id', sessionId))
  .property('derivedAt', datetime())

g.V().hasLabel('Decision').has('id', decisionId)
  .addE('INFLUENCED_BY').to(g.V().hasLabel('Context').has('id', contextId))
  .property('influenceWeight', 0.7)

g.V().hasLabel('Decision').has('id', decisionId)
  .addE('APPROVED_BY').to(g.V().hasLabel('User').has('id', userId))
  .property('approvedAt', datetime())
  .property('comments', 'Looks good, proceed with implementation')
```

## 🔧 **Neptune Operations**

### **Connection Management**

```typescript
// Neptune connection configuration
import { driver, auth } from "gremlin";

const neptuneEndpoint = process.env.NEPTUNE_ENDPOINT;
const neptunePort = process.env.NEPTUNE_PORT || 8182;

export class NeptuneClient {
  private driver: any;
  private g: any;

  constructor() {
    this.driver = new driver.DriverRemoteConnection(
      `wss://${neptuneEndpoint}:${neptunePort}/gremlin`,
      {
        authenticator: new auth.PlainTextSaslAuthenticator(
          `/aws4_request`,
          process.env.AWS_ACCESS_KEY_ID!,
          process.env.AWS_SECRET_ACCESS_KEY!
        ),
      }
    );
    this.g = traversal().withRemote(this.driver);
  }

  async close() {
    await this.driver.close();
  }

  getTraversal() {
    return this.g;
  }
}
```

### **CRUD Operations**

```typescript
export class GraphRepository {
  private g: any;

  constructor(client: NeptuneClient) {
    this.g = client.getTraversal();
  }

  // Create operations
  async createOrganization(data: OrganizationData) {
    return await this.g
      .addV("Organization")
      .property("id", data.id)
      .property("name", data.name)
      .property("awsAccountId", data.awsAccountId)
      .property("createdAt", new Date())
      .next();
  }

  async createUser(data: UserData) {
    return await this.g
      .addV("User")
      .property("id", data.id)
      .property("cognitoUserId", data.cognitoUserId)
      .property("email", data.email)
      .property("name", data.name)
      .property("role", data.role)
      .property("createdAt", new Date())
      .next();
  }

  // Read operations
  async getUserById(userId: string) {
    return await this.g
      .V()
      .hasLabel("User")
      .has("id", userId)
      .valueMap(true)
      .next();
  }

  async getUserApplications(userId: string) {
    return await this.g
      .V()
      .hasLabel("User")
      .has("cognitoUserId", userId)
      .out("BELONGS_TO")
      .in("OWNED_BY")
      .hasLabel("Application")
      .has("isActive", true)
      .valueMap(true)
      .toList();
  }

  async getUserFavorites(userId: string) {
    return await this.g
      .V()
      .hasLabel("User")
      .has("cognitoUserId", userId)
      .outE("FAVORITED")
      .order()
      .by("favoritedAt", "desc")
      .inV()
      .valueMap(true)
      .toList();
  }

  // Update operations
  async updateApplication(appId: string, updates: Partial<ApplicationData>) {
    let query = this.g.V().hasLabel("Application").has("id", appId);

    Object.entries(updates).forEach(([key, value]) => {
      query = query.property(key, value);
    });

    return await query.property("updatedAt", new Date()).next();
  }

  // Relationship operations
  async addUserFavorite(userId: string, appId: string) {
    return await this.g
      .V()
      .hasLabel("User")
      .has("cognitoUserId", userId)
      .addE("FAVORITED")
      .to(this.g.V().hasLabel("Application").has("id", appId))
      .property("favoritedAt", new Date())
      .next();
  }

  async removeUserFavorite(userId: string, appId: string) {
    return await this.g
      .V()
      .hasLabel("User")
      .has("cognitoUserId", userId)
      .outE("FAVORITED")
      .where(inV().has("id", appId))
      .drop()
      .next();
  }

  // Complex queries
  async getSessionWithContext(sessionId: string) {
    return await this.g
      .V()
      .hasLabel("Session")
      .has("id", sessionId)
      .project("session", "messages", "context")
      .by(valueMap(true))
      .by(
        this.g
          .in_("IN_SESSION")
          .hasLabel("Message")
          .order()
          .by("createdAt")
          .valueMap(true)
          .fold()
      )
      .by(
        this.g
          .in_("IN_SESSION")
          .out("REFERENCES")
          .hasLabel("Context")
          .order()
          .by("relevanceScore", "desc")
          .valueMap(true)
          .fold()
      )
      .next();
  }

  async findRelatedSessions(sessionId: string) {
    return await this.g
      .V()
      .hasLabel("Session")
      .has("id", sessionId)
      .in_("IN_SESSION")
      .out("REFERENCES")
      .in_("REFERENCES")
      .out("IN_SESSION")
      .hasLabel("Session")
      .where(neq(sessionId))
      .dedup()
      .order()
      .by("updatedAt", "desc")
      .limit(5)
      .valueMap(true)
      .toList();
  }
}
```

## 🗄️ **Data Migration & Seeding**

### **Initial Data Setup**

```typescript
export class DataSeeder {
  private repo: GraphRepository;

  constructor(repo: GraphRepository) {
    this.repo = repo;
  }

  async seedInitialData() {
    // Create default organization
    const org = await this.repo.createOrganization({
      id: "default-org",
      name: "Default Organization",
      awsAccountId: process.env.AWS_ACCOUNT_ID,
    });

    // Create default applications
    const apps = [
      {
        id: "strategic-planning",
        name: "Strategic Planning Assistant",
        description: "AI-powered strategic planning and analysis",
        category: "Strategy",
        icon: "🎯",
        bedrockAgentId: "STRATEGIC_AGENT",
        bedrockAliasId: "PROD",
      },
      {
        id: "market-research",
        name: "Market Research Analyzer",
        description: "Comprehensive market analysis and insights",
        category: "Research",
        icon: "📊",
        bedrockAgentId: "RESEARCH_AGENT",
        bedrockAliasId: "PROD",
      },
    ];

    for (const app of apps) {
      await this.repo.createApplication(app);
    }
  }
}
```

## 🔍 **Query Patterns**

### **Common Query Examples**

```gremlin
-- Find users who haven't logged in recently
g.V().hasLabel('User')
  .has('lastLogin', lt(datetime().minus(30, 'days')))
  .values('email')

-- Get most popular applications by usage
g.V().hasLabel('Application')
  .project('app', 'usage')
  .by(values('name'))
  .by(in('ACCESSED').count())
  .order().by(select('usage'), desc)

-- Find context that led to successful decisions
g.V().hasLabel('Decision')
  .has('status', 'approved')
  .in('INFLUENCED_BY')
  .hasLabel('Context')
  .groupCount().by('type')

-- Analyze session patterns by time of day
g.V().hasLabel('Session')
  .has('createdAt', within(datetime().minus(7, 'days'), datetime()))
  .project('hour', 'count')
  .by(values('createdAt').map(date_hour()))
  .by(count())
  .order().by(select('hour'))

-- Find knowledge gaps (context with low relevance scores)
g.V().hasLabel('Context')
  .has('relevanceScore', lt(0.5))
  .out('DERIVED_FROM')
  .hasLabel('Document')
  .groupCount().by('type')
```

## 🚀 **Performance Optimization**

### **Indexing Strategy**

```gremlin
-- Create composite indexes for common queries
CREATE INDEX user_cognito_lookup ON User (cognitoUserId);
CREATE INDEX app_organization_lookup ON Application (organizationId, isActive);
CREATE INDEX session_user_lookup ON Session (userId, status, updatedAt);
CREATE INDEX message_session_lookup ON Message (sessionId, createdAt);
CREATE INDEX context_relevance_lookup ON Context (relevanceScore, type);
```

### **Query Optimization**

- Use `limit()` for pagination
- Index frequently queried properties
- Batch operations for bulk updates
- Use `project()` to minimize data transfer
- Implement caching for read-heavy operations

## 📊 **Monitoring & Analytics**

### **Neptune CloudWatch Metrics**

- Query execution time
- Database connections
- Storage utilization
- Gremlin request rate
- Error rates and types

### **Custom Application Metrics**

- User activity patterns
- Application usage trends
- Context relevance accuracy
- Decision success rates
- Session completion rates

## 🔒 **Security & Access Control**

### **IAM Policies**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "neptune-db:ReadDataViaQuery",
        "neptune-db:WriteDataViaQuery",
        "neptune-db:DeleteDataViaQuery"
      ],
      "Resource": "arn:aws:neptune-db:region:account:cluster/titan-cluster/*"
    }
  ]
}
```

### **Row-Level Security**

- Organization-based data isolation
- User role-based access control
- Session ownership validation
- Context access permissions
