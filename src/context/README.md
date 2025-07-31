# Captify Platform - Context & Requirements

This directory contains comprehensive documentation for the Captify platform development. Each file represents a specific component or feature area and references the overall architecture defined in this README.

**Note**: This context focuses on frontend/React development and platform features. For backend/AWS infrastructure documentation, see `build/context/README.md`.

## 🏗️ **Architecture Update (Latest)**

**Simplified Lambda Architecture**: The platform has been refactored to use Next.js API routes for AWS service integration instead of API Gateway + Lambda proxies:

- **Search**: `src/app/api/search/route.ts` - Neptune search with Cognito Identity Pool authentication using SigV4
- **Chat**: `src/app/api/chat/route.ts` - Direct Amazon Bedrock integration
- **Authentication**: NextAuth.js + AWS Cognito Identity Pools
- **Remaining Lambdas**: Only `graph-operations` (Neptune) and `document-processing` (S3 events)

This reduces complexity, improves performance, and simplifies the authentication flow.

## 📋 **Document Structure**

### **Core Documents**

- `README.md` - This file - Overall architecture and approach
- `architecture.md` - Detailed system architecture and data flow
- `aws-services.md` - AWS services integration and configuration

### **API & Search Architecture**

- `aws-service-catalog-api.md` - Service Catalog search implementation with Cognito Identity Pools
- `sam-identity-pools.md` - SAM template for creating Identity Pools and IAM roles
- `unified-search-api.ipynb` - Legacy unified search API documentation (deprecated)
- `console-architecture.md` - AWS Console-style interface design and navigation
- `application-management.md` - Application CRUD, Bedrock agent configuration
- `chat-interface.md` - Real-time chat with AI agents and session management
- `database-integration.md` - Neptune graph database design and operations
- `context-management.md` - Document upload, processing, and context injection

### **LLM Integration Architecture**

The platform now supports multiple LLM providers through a unified interface:

**Primary Integration**: AWS Bedrock Agent (Agent ID: H7MXL2MY4U, Alias: RFQULMWMAO)

- **Configuration Service**: `src/lib/services/llm-config.ts` - Manages provider configurations
- **Types**: `src/lib/types/llm.ts` - TypeScript interfaces for LLM providers
- **API Route**: `src/app/api/chat/route.ts` - Unified chat endpoint with provider switching
- **Chat Component**: `src/components/chat/ChatInterface.tsx` - React component with session management

**Environment Configuration**:

```env
AWS_BEDROCK_AGENT_ID=H7MXL2MY4U
AWS_BEDROCK_AGENT_ALIAS_ID=RFQULMWMAO
AWS_BEDROCK_REGION=us-east-1
```

**Features**:

- Session persistence for continuous conversations
- Automatic fallback to demo responses when not configured
- Multi-provider architecture (ready for OpenAI, Anthropic, Grok)
- Aviation-specific context and responses
- Real-time streaming with AI SDK integration
- `user-management.md` - User profiles, organizations, permissions
- `decision-tracking.md` - Decision sessions, audit trails, outcomes

### **Technical Documentation**

- `api-endpoints.md` - REST API specifications
- `deployment.md` - SAM template and infrastructure as code
- `security.md` - Authentication, authorization, data protection

## 🏗️ **Overall Architecture**

### **Core Concept**

Captify is an AWS Console-style platform where each "application" represents a specific decision-making use case powered by its own Bedrock AI agent. Users launch applications to start context-aware conversations that help them make better decisions.

### **Key Principles**

1. **Context-First**: Every decision requires understanding the context
2. **Agent-Per-Application**: Each use case has a specialized Bedrock agent
3. **Graph-Based Knowledge**: Neptune stores all relationships and context
4. **Audit-Ready**: Every decision conversation is tracked and traceable
5. **AWS-Native**: Leverage AWS services for scalability and enterprise features

### **Technology Stack**

**Frontend:**

- Next.js 15 with App Router
- TypeScript for type safety
- Tailwind CSS + shadcn/ui for AWS Console-style UI
- NextAuth.js for authentication

**Backend & APIs:**

- Next.js API routes
- AWS SDK for service integration
- Graph database operations via Neptune

**AWS Services:**

- **Amazon Neptune** - Graph database for all data storage
- **Amazon Bedrock** - AI agents for each application
- **Amazon Cognito** - User authentication and management
- **Amazon S3** - Document and file storage
- **AWS Glue** - Data transformation and ETL
- **Amazon Textract** - Document text extraction
- **Amazon Comprehend** - Natural language processing
- **AWS Lambda** - Serverless compute for background tasks
- **Amazon API Gateway** - API management and scaling

**Data Flow:**

```
User Upload → S3 → Glue/Textract/Comprehend → Neptune (Context Graph) → Bedrock Agent → Chat Interface
```

### **Graph Database Design (Neptune)**

Instead of traditional relational tables, we store everything as graph entities and relationships:

**Entities:**

- `Organization` - Top-level tenant
- `User` - Individual users with roles
- `Application` - Each decision-making use case
- `Agent` - Bedrock agent configuration
- `Session` - Decision conversation sessions
- `Message` - Individual chat messages
- `Document` - Uploaded context files
- `Context` - Extracted knowledge from documents
- `Decision` - Final outcomes and recommendations

**Relationships:**

- `BELONGS_TO` - User → Organization
- `OWNS` - Organization → Application
- `POWERED_BY` - Application → Agent
- `PARTICIPATES_IN` - User → Session
- `CONTAINS` - Session → Message
- `REFERENCES` - Message → Context
- `INFLUENCES` - Context → Decision
- `DERIVES_FROM` - Context → Document

### **Benefits of Graph Database:**

1. **Natural Relationships**: Context connections are explicit
2. **Flexible Schema**: Easy to add new entity types and relationships
3. **Complex Queries**: Find related context across multiple dimensions
4. **Scalability**: Neptune handles large-scale graph traversals
5. **AI-Friendly**: Graph structure perfect for RAG and context injection

### ### **Authentication Architecture**

**Cognito Identity Pool Integration:**

The platform uses a sophisticated authentication flow that leverages AWS Cognito Identity Pools for secure access to AWS services:

1. **NextAuth.js with Cognito Provider**: Users authenticate through Cognito User Pool
2. **ID Token Extraction**: NextAuth captures the Cognito ID token from the authentication flow
3. **Identity Pool Authentication**: API routes use the ID token to authenticate with Cognito Identity Pools
4. **Temporary AWS Credentials**: Identity Pools provide temporary, scoped AWS credentials
5. **Service-Specific Access**: Each AWS service (Service Catalog, Bedrock, etc.) has dedicated Identity Pool roles

**Implementation Pattern:**

```typescript
// In API routes (e.g., /api/search/route.ts)
const credentials = fromCognitoIdentityPool({
  identityPoolId: process.env.COGNITO_SERVICE_CATALOG_POOL_ID,
  logins: {
    [`cognito-idp.${region}.amazonaws.com/${userPoolId}`]: idToken,
  },
});

const client = new ServiceCatalogClient({
  region: AWS_REGION,
  credentials,
});
```

**Environment Variables Required:**

- `AWS_REGION` - AWS region (e.g., us-east-1)
- `COGNITO_SERVICE_CATALOG_POOL_ID` - Identity Pool for AWS service access
- `COGNITO_USER_POOL_ID` - User Pool for authentication
- `COGNITO_CLIENT_ID` - OAuth client ID
- `COGNITO_CLIENT_SECRET` - OAuth client secret
- `COGNITO_DOMAIN` - Cognito domain for OAuth flows

**Benefits:**

- **Secure**: No long-term AWS keys stored in application
- **Scoped**: Each service gets minimal required permissions
- **Auditable**: All AWS API calls are tied to authenticated users
- **Scalable**: Cognito Identity Pools handle authentication at scale

**Development Approach**

**Phase 1: Foundation** ✅

- Authentication with Cognito
- AWS Console-style dashboard
- Basic application launcher
- Bedrock agent integration setup

**Phase 2: Core Platform** (Current)

- Neptune database setup
- Application management CRUD
- Individual chat interfaces
- Session persistence in graph

**Phase 3: Context Engine**

- Document upload to S3
- Content processing pipeline
- Graph-based context storage
- Context injection into agents

**Phase 4: Decision Intelligence**

- Decision outcome tracking
- Pattern recognition across sessions
- Recommendation improvements
- Advanced analytics

**Phase 5: Enterprise Features**

- Multi-tenant architecture
- Advanced security controls
- Audit and compliance features
- API for external integrations

## 🖥️ **Console Dashboard**

### **Overview**

The Console Dashboard (`/console`) serves as the central hub for application management and discovery. Inspired by AWS Console design, it provides a comprehensive view of all available AI-powered applications.

### **Key Features**

**Application Discovery:**

- Grid and list view modes for application browsing
- Advanced search across application names, descriptions, categories, and tags
- Category-based filtering with visual indicators
- Real-time search with debounced input

**Personal Organization:**

- Favorites system for frequently used applications
- Recent applications tracking with access timestamps
- Usage analytics showing access counts and patterns
- Personalized application recommendations

**Enterprise Dashboard:**

- Quick stats showing total applications, favorites, categories, and active sessions
- Category overview with application counts per category
- Visual category cards with color-coded icons and descriptions
- Tab-based navigation between overview, favorites, recent, and all applications

### **Application Cards**

Each application is displayed as a rich card containing:

- **Visual Identity**: Category-specific colored icon and application branding
- **Metadata**: Name, description, category badge, and status indicator
- **Usage Stats**: Access count, last accessed timestamp, and user ratings
- **Actions**: Favorite toggle, direct launch, and quick access menu
- **Status Badges**: Active, beta, coming-soon, or maintenance status

### **Navigation & Integration**

- **Seamless Launch**: Click any application card to navigate to `/apps/{alias}`
- **Context Preservation**: Maintains user state across navigation
- **Responsive Design**: Optimized for desktop, tablet, and mobile viewing
- **Loading States**: Progressive loading with skeleton screens and status indicators
- **Error Handling**: Graceful fallbacks for network issues or missing data

### **Implementation Details**

**Data Source:**

- Applications loaded from `demo-applications.json` via `applications-loader.ts`
- Type-safe application definitions with comprehensive metadata
- Real-time data updates through React state management

**Component Structure:**

```typescript
ConsoleLayout
├── Dashboard Header (search, stats)
├── Quick Stats Cards (totals, favorites, categories)
├── Tabbed Interface
│   ├── Overview Tab (recent + favorites + categories)
│   ├── Favorites Tab (starred applications)
│   ├── Recent Tab (recently accessed)
│   └── All Applications Tab (full grid with search/filter)
└── ApplicationCard Components (interactive cards)
```

**User Experience:**

- Fast search and filtering with instant results
- Intuitive categorization with visual cues
- Persistent favorites across sessions
- Progressive disclosure of application details
- Smooth transitions and hover effects

### **File Structure**

```
captify/
├── src/
│   ├── app/                    # Next.js pages and API routes
│   ├── components/             # Reusable UI components
│   ├── lib/
│   │   ├── services/           # AWS service integrations
│   │   ├── graph/              # Neptune operations
│   │   ├── types/              # TypeScript definitions
│   │   └── utils/              # Helper functions
│   └── context/                # This documentation directory
├── template.yaml               # SAM template for AWS deployment
├── samconfig.toml             # SAM configuration
└── package.json
```

### **Getting Started**

1. Review all context documents for your area of interest
2. Check the SAM template for required AWS resources
3. Reference architecture.md for detailed system design
4. Use the API endpoints documentation for integration

### **References**

- [AWS Bedrock Documentation](https://docs.aws.amazon.com/bedrock/)
- [Amazon Neptune Developer Guide](https://docs.aws.amazon.com/neptune/)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [AWS SAM Documentation](https://docs.aws.amazon.com/serverless-application-model/)
