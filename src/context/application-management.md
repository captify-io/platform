# Application Management Requirements

_References: [README.md](./README.md) for overall architecture_

## 🎯 **Overview**

Application Management is the core feature that allows users to create, configure, and manage AI-powered decision-making applications. Each application represents a specific use case (e.g., "Strategic Planning Assistant", "Market Research Analyzer") and is powered by its own Bedrock agent.

## 📊 **Graph Data Model**

### **Entities in Neptune**

```gremlin
// Application entity
g.addV('Application')
  .property('id', uuid())
  .property('name', 'Strategic Planning Assistant')
  .property('description', 'AI-powered strategic planning and analysis')
  .property('category', 'Strategy')
  .property('icon', '🎯')
  .property('isActive', true)
  .property('isAwsNative', false)
  .property('createdAt', datetime())
  .property('updatedAt', datetime())

// Bedrock Agent entity
g.addV('Agent')
  .property('id', uuid())
  .property('bedrockAgentId', 'AGENT123')
  .property('bedrockAliasId', 'PROD')
  .property('bedrockRegion', 'us-east-1')
  .property('instructions', 'You are a strategic planning assistant...')
  .property('model', 'anthropic.claude-3-sonnet')
  .property('isValidated', true)

// User entity
g.addV('User')
  .property('id', uuid())
  .property('cognitoUserId', 'user-123')
  .property('email', 'user@company.com')
  .property('name', 'John Doe')
  .property('role', 'admin')
```

### **Relationships**

```gremlin
// Application relationships
g.V().hasLabel('Application').has('id', appId)
  .addE('BELONGS_TO').to(g.V().hasLabel('Organization').has('id', orgId))
  .addE('POWERED_BY').to(g.V().hasLabel('Agent').has('id', agentId))
  .addE('CREATED_BY').to(g.V().hasLabel('User').has('id', userId))

// User interactions
g.V().hasLabel('User').has('id', userId)
  .addE('FAVORITED').to(g.V().hasLabel('Application').has('id', appId))
    .property('favoritedAt', datetime())
  .addE('ACCESSED').to(g.V().hasLabel('Application').has('id', appId))
    .property('lastAccessed', datetime())
    .property('accessCount', 1)
```

## 🔧 **Features & Requirements**

### **1. Application CRUD Operations**

**Create Application:**

- Form with name, description, category, icon selection
- Bedrock agent configuration (ID, alias, region)
- Agent validation before saving
- Automatic graph entity creation

**Read Applications:**

- List all applications for organization
- Filter by category, status, user favorites
- Search by name/description
- Sort by creation date, last accessed, usage count

**Update Application:**

- Edit metadata (name, description, icon, category)
- Update agent configuration
- Re-validate agent connectivity
- Version control for agent changes

**Delete Application:**

- Soft delete with confirmation
- Archive existing sessions (don't delete)
- Remove from user favorites
- Update graph relationships

### **2. Bedrock Agent Integration**

**Agent Configuration:**

```typescript
interface AgentConfig {
  bedrockAgentId: string; // AWS Bedrock Agent ID
  bedrockAliasId: string; // Agent alias (PROD, DEV, etc.)
  bedrockRegion: string; // AWS region
  instructions?: string; // Custom instructions overlay
  model: string; // Foundation model
  maxTokens?: number; // Response limit
  temperature?: number; // Creativity setting
}
```

**Agent Validation:**

- Test connectivity to Bedrock agent
- Validate permissions and access
- Check agent status and availability
- Store validation results in graph

**Agent Versioning:**

- Track agent configuration changes
- Support rollback to previous versions
- Maintain compatibility with existing sessions

### **3. User Interaction Tracking**

**Favorites Management:**

- Add/remove applications from favorites
- Quick access to favorited apps
- Favorite order management

**Usage Analytics:**

- Track application access frequency
- Record last accessed timestamps
- Monitor user engagement patterns
- Generate usage reports

### **4. Category Management**

**Predefined Categories:**

- Strategy & Planning
- Analytics & Insights
- Research & Intelligence
- Operations & Process
- Customer & Market
- Financial Analysis
- Risk Management
- Custom Categories

**Category Features:**

- Icon associations for each category
- Color coding and visual themes
- Category-based filtering and organization
- Usage statistics per category

## 🔌 **API Endpoints**

### **Applications API (`/api/applications`)**

```typescript
// GET /api/applications
// List applications with filters
{
  organization_id?: string;
  category?: string;
  is_favorite?: boolean;
  search?: string;
  sort_by?: 'name' | 'created_at' | 'last_accessed' | 'usage_count';
  sort_order?: 'asc' | 'desc';
}

// POST /api/applications
// Create new application
{
  name: string;
  description?: string;
  category: string;
  icon?: string;
  agent_config: AgentConfig;
}

// PUT /api/applications/{id}
// Update application
{
  name?: string;
  description?: string;
  category?: string;
  icon?: string;
  agent_config?: AgentConfig;
  is_active?: boolean;
}

// DELETE /api/applications/{id}
// Soft delete application
```

### **Agent Management API (`/api/agents`)**

```typescript
// POST /api/agents/validate
// Validate agent configuration
{
  bedrock_agent_id: string;
  bedrock_alias_id: string;
  bedrock_region: string;
}

// GET /api/agents/{agent_id}/status
// Get agent status and capabilities

// POST /api/agents/{agent_id}/test
// Test agent with sample input
{
  test_input: string;
}
```

## 🎨 **UI Components**

### **1. Application Grid/List View**

- AWS Console-style card layout
- Grid and list view toggle
- Search and filter controls
- Category tabs
- Favorites star toggle
- Usage indicators

### **2. Application Creation Modal**

- Multi-step form (Basic Info → Agent Config → Review)
- Real-time agent validation
- Icon picker component
- Category selector
- Preview before creation

### **3. Application Detail View**

- Application metadata
- Agent configuration details
- Usage statistics
- Recent sessions
- Edit/delete controls

### **4. Agent Configuration Panel**

- Bedrock agent ID input with validation
- Alias dropdown (populated from AWS)
- Region selector
- Advanced settings (model, tokens, temperature)
- Test agent functionality

## 🔄 **Graph Queries**

### **Common Queries**

```gremlin
// Get all applications for user's organization
g.V().hasLabel('User').has('cognitoUserId', userId)
  .out('BELONGS_TO')
  .in('BELONGS_TO')
  .hasLabel('Application')
  .has('isActive', true)

// Get user's favorite applications
g.V().hasLabel('User').has('cognitoUserId', userId)
  .outE('FAVORITED')
  .inV()
  .hasLabel('Application')

// Get applications by category with usage stats
g.V().hasLabel('Application')
  .has('category', category)
  .as('app')
  .in('ACCESSED')
  .count()
  .as('accessCount')
  .select('app', 'accessCount')

// Find applications using specific agent
g.V().hasLabel('Agent')
  .has('bedrockAgentId', agentId)
  .in('POWERED_BY')
  .hasLabel('Application')
```

## 🚀 **Implementation Priority**

### **Phase 1 (Week 1)**

1. Neptune graph setup and entity models
2. Basic CRUD API endpoints
3. Application list/grid view
4. Create application modal

### **Phase 2 (Week 2)**

1. Bedrock agent validation
2. User favorites functionality
3. Search and filtering
4. Category management

### **Phase 3 (Week 3)**

1. Advanced agent configuration
2. Usage analytics and tracking
3. Application versioning
4. Bulk operations

## 🧪 **Testing Strategy**

**Unit Tests:**

- Graph entity creation/updates
- API endpoint responses
- Agent validation logic
- Search and filter functions

**Integration Tests:**

- End-to-end application creation flow
- Bedrock agent connectivity
- User permission checks
- Graph query performance

**User Acceptance Tests:**

- Create application workflow
- Search and discovery
- Favorites management
- Agent configuration

## 📋 **Success Metrics**

- Applications created per organization
- Agent validation success rate
- User engagement with applications
- Search/filter usage patterns
- Time to create new application
- Application launch success rate
