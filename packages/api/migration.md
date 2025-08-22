# API Package Migration Log

## Overview

Migration of AWS service integrations, DynamoDB types, and API client functionality from src/ to @captify/api package.

## Migration Status

### ✅ Completed

- [x] Basic package structure created
- [x] CaptifyApiClient basic functionality
- [x] AWS SDK dependencies configured

### 🔄 In Progress

#### **Phase 1: Type Migration (Current)**

**Objective**: Migrate all AWS and database-related types with proper naming conventions

**Source Types to Migrate:**

- `src/types/agents.ts` (394 lines) - AWS Bedrock agent types
- `src/types/database.ts` (partial - database operation types)

**Target Structure:**

```
packages/api/src/types/
├── agents.ts         # AWS Bedrock agent interfaces
├── dynamodb.ts       # DynamoDB operation types
├── aws.ts           # General AWS service types
└── index.ts         # Export all types
```

**Type Mappings & Consolidation:**

1. **BedrockAgent & Related Types** (from src/types/agents.ts)

   - **Action**: Move entire agents.ts to packages/api/src/types/agents.ts
   - **Changes**: Ensure camelCase consistency
   - **Key Types**:
     - `BedrockAgent` ✓
     - `UserAgent` ✓
     - `AgentAlias` ✓
     - `CreateAgentRequest` ✓
     - `UpdateAgentRequest` ✓
     - `AgentTestRequest` ✓
     - `AgentTestResponse` ✓
     - `FoundationModel` ✓
     - All citation and trace types ✓

2. **Database Operation Types** (from src/types/database.ts)

   - **Action**: Extract database operation types to packages/api/src/types/dynamodb.ts
   - **Types to extract**:
     - `DynamicTool`
     - `OrganizationSettings`
     - `ListApplicationsQuery`
     - `CreateApplicationRequest`
     - `UpdateApplicationRequest`
     - `ApplicationListResponse`
     - `UserApplicationResponse`
     - `DatabaseError`
     - All menu item types
     - All workspace content types

3. **AWS Client Types** (existing in package)
   - **Current**: Basic AWS client configuration types
   - **Action**: Expand with additional AWS service types as needed

### 🎯 Next Steps

#### **Phase 2: Agent Service Migration**

- [ ] Move `src/lib/agents.ts` to `packages/api/src/services/agent-service.ts`
- [ ] Move agent-related API routes logic to package services
- [ ] Update imports to use package exports

#### **Phase 3: Database Service Migration**

- [ ] Move DynamoDB utilities from src/lib to packages/api/src/services/
- [ ] Consolidate database client creation logic
- [ ] Update three-tier authentication pattern in package

#### **Phase 4: Import Updates**

- [ ] Update all imports from `@/types/agents` to `@captify/api`
- [ ] Update all imports from `@/lib/agents` to `@captify/api`

## Files Requiring Updates

### High Priority (Direct agent type usage)

1. `src/app/api/agents/**/*.ts` - Multiple agent API routes
2. `src/components/agents/*.tsx` - Agent management components
3. `src/app/admin/agents/**/*.tsx` - Admin agent pages
4. `src/lib/services/agent-service.ts` - Agent service logic

### Medium Priority (Database types)

1. `src/app/api/apps/**/*.ts` - Application API routes
2. `src/lib/services/database.ts` - Database service utilities
3. `src/components/admin/application-editor/*.tsx` - Database entity usage

### Low Priority (Indirect usage)

1. Various components importing agent types
2. Chat components using agent references

## Dependencies & Integration

### With Other Packages

- **@captify/core**: May need auth utilities, base types
- **@captify/applications**: May import agent types for application-agent relationships

### AWS SDK Integration

- Ensure all AWS SDK types are properly exported
- Maintain compatibility with existing AWS client patterns
- Keep three-tier authentication system intact

## Testing Strategy

1. **Agent Operations**: Test agent creation, updates, queries
2. **Database Operations**: Verify DynamoDB queries work correctly
3. **API Client**: Test authentication and request patterns
4. **Type Safety**: Ensure no TypeScript errors after migration

## Notes

- Agent types are comprehensive and well-structured ✅
- Database types split between multiple packages (applications, api)
- Three-tier auth pattern is critical - must maintain in migration
- Consider splitting large types files if they become unwieldy
