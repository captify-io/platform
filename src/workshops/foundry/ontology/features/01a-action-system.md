# Feature 1a: Action System with Agents & Tools

**Status**: ❌ Not Started
**Priority**: P0 (Critical)
**Story Points**: 13
**Depends On**: Feature 1 (Ontology Viewer)

## Overview

Build an action system that integrates with agents and tools, allowing users to define business logic, validation rules, and side effects on ontology objects. Actions are registered as tools that agents can discover and execute, enabling AI-powered workflows.

## Requirements

### Functional Requirements

1. **Action Definition**
   - Define actions on object types (e.g., "approveContract" on Contract)
   - Input parameters with type validation
   - Validation rules (e.g., "status must be 'pending'")
   - Side effects (create, update, delete, notify)
   - External function references (S3/DynamoDB storage)

2. **Agent Integration**
   - Actions auto-register as tools in agent system
   - Agent can discover available actions for object type
   - Agent can execute actions with parameters
   - Action results returned to agent for next steps

3. **Tool Generation**
   - Automatically generate tool schema from action definition
   - Generate TypeScript types for action parameters
   - Generate Zod validation schemas
   - Generate OpenAI function calling format

4. **Visual Action Builder**
   - UI for creating/editing actions
   - Parameter editor with type selection
   - Validation rule builder
   - Side effect configurator
   - Function code editor (optional)

### Non-Functional Requirements

1. **Security**: Functions sandboxed, code hash verified
2. **Performance**: Action execution <500ms
3. **Reliability**: Transactional side effects, rollback on error

## Architecture

### Action Data Model

```typescript
interface ActionType {
  id: string;                      // UUID
  type: 'action';
  name: string;                    // e.g., 'approveContract'
  objectType: string;              // e.g., 'contract' - which type this acts on
  category: string;                // 'workflow', 'validation', 'transform'

  // Input
  parameters: Record<string, ParameterDefinition>;

  // Validation
  validation?: {
    rules: ValidationRule[];
  };

  // Side effects
  sideEffects?: SideEffect[];

  // External function (optional)
  function?: {
    functionId: string;
    runtime: 'node:20' | 'python:3.12';
    storage: string;               // 's3://bucket/key' or 'dynamodb://table/id'
    hash?: string;                 // SHA256 for integrity
  };

  // Tool registration
  toolSchema?: {
    name: string;
    description: string;
    parameters: Record<string, any>;  // JSON Schema
  };

  // Metadata
  app: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

interface ParameterDefinition {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  required: boolean;
  default?: any;
  enum?: string[];
  validation?: ValidationRule[];
}

interface ValidationRule {
  field: string;
  condition: 'equals' | 'notEquals' | 'greaterThan' | 'lessThan' | 'contains' | 'matches';
  value: any;
  errorMessage: string;
}

interface SideEffect {
  type: 'create' | 'update' | 'delete' | 'notify';
  target: 'self' | string;         // 'self' or object ID
  targetType?: string;             // Type to create
  properties?: Record<string, any>; // Supports {{template}} variables
}
```

### Integration with Agent System

```typescript
// core/src/services/agent/tools.ts
import { ontology } from '@captify-io/core';

// Auto-discover actions for object type
export async function getToolsForObject(objectType: string, credentials: AwsCredentials) {
  const actions = await ontology.action.getByObjectType(objectType, credentials);

  return actions.map(action => ({
    type: 'function',
    function: {
      name: action.name,
      description: action.description,
      parameters: generateParameterSchema(action.parameters)
    }
  }));
}

// Execute action as tool
export async function executeActionTool(
  actionId: string,
  params: Record<string, any>,
  context: ExecutionContext
) {
  return await ontology.action.execute(actionId, params, context);
}
```

### Action Execution Flow

```
1. Agent calls action as tool
   ↓
2. Load action definition from ontology
   ↓
3. Validate parameters against schema
   ↓
4. Load object being acted upon
   ↓
5. Run validation rules
   ↓
6. Execute function (if defined)
   ↓
7. Execute side effects
   ↓
8. Return result to agent
```

## Data Model

**Tables**:
- `captify-core-ontology-node` - Actions stored as nodes with `type: 'action'`
- `captify-core-function` (NEW) - External function code storage
  ```
  id (PK), functionId, version, code, runtime, hash, createdAt, updatedAt
  ```
- `captify-core-action-execution` (NEW) - Audit trail
  ```
  id (PK), actionId, objectId, userId, params, result, error, timestamp
  ```

## API Actions

### Create Action

```typescript
const action = await ontology.action.create({
  name: 'approveContract',
  objectType: 'contract',
  parameters: {
    contractId: { type: 'string', required: true },
    approverComments: { type: 'string', required: false }
  },
  validation: {
    rules: [
      {
        field: 'status',
        condition: 'equals',
        value: 'pending',
        errorMessage: 'Can only approve pending contracts'
      }
    ]
  },
  sideEffects: [
    {
      type: 'update',
      target: 'self',
      properties: {
        status: 'approved',
        approvedAt: '{{timestamp}}',
        approvedBy: '{{userId}}'
      }
    },
    {
      type: 'create',
      targetType: 'notification',
      properties: {
        userId: '{{contract.ownerId}}',
        message: 'Contract {{contract.contractNumber}} approved'
      }
    }
  ]
}, credentials);
```

### Execute Action

```typescript
const result = await ontology.action.execute(
  'approveContract',
  {
    contractId: 'contract-123',
    approverComments: 'Looks good'
  },
  {
    credentials,
    session: { userId: 'user-456' }
  }
);

// Result:
{
  success: true,
  data: {
    updated: { status: 'approved', approvedAt: '2025-11-02T...' },
    sideEffects: [
      { type: 'notification', id: 'notif-789' }
    ]
  }
}
```

### Register Action as Tool

```typescript
// Automatically done when action is created
const toolSchema = await ontology.action.generateToolSchema(actionId, credentials);

// Register with agent
await agent.registerTool({
  name: action.name,
  description: action.description,
  schema: toolSchema,
  execute: (params) => ontology.action.execute(actionId, params, context)
});
```

### Get Actions for Object Type

```typescript
// Get all actions available for a contract
const actions = await ontology.action.getByObjectType('contract', credentials);

// Returns: [approveContract, amendContract, cancelContract, ...]
```

## UI/UX

### Action Builder in Ontology Viewer

When viewing a node (e.g., Contract), show "Actions" tab:

```
┌──────────────────────────────────────────────────────────┐
│ Contract Details                                  [Edit] │
├──────────────────────────────────────────────────────────┤
│ [Properties] [Schema] [Relationships] [Actions]         │
│                                                          │
│ Actions (3)                           [+ Create Action] │
│                                                          │
│ ┌────────────────────────────────────────────────────┐ │
│ │ ⚡ approveContract                          [Edit] │ │
│ │ Parameters: contractId, approverComments          │ │
│ │ Validation: status = 'pending'                    │ │
│ │ Side Effects: Update status, Create notification  │ │
│ └────────────────────────────────────────────────────┘ │
│                                                          │
│ ┌────────────────────────────────────────────────────┐ │
│ │ ⚡ amendContract                            [Edit] │ │
│ │ Parameters: contractId, modificationNumber        │ │
│ │ Validation: status = 'active'                     │ │
│ │ Side Effects: Create modification record          │ │
│ └────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

### Action Builder Dialog

```
┌──────────────────────────────────────────────────────────┐
│ Create Action: approveContract                 [✕ Close] │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ ┌─ Basic Info ─────────────────────────────────────┐    │
│ │ Name*          [approveContract____________]     │    │
│ │ Object Type*   [Contract ▼]                      │    │
│ │ Category       [Workflow ▼]                      │    │
│ │ Description    [Approve pending contract____]    │    │
│ └──────────────────────────────────────────────────────┘│
│                                                          │
│ ┌─ Parameters ─────────────────────────────────────┐    │
│ │ [+ Add Parameter]                                │    │
│ │                                                  │    │
│ │ ✓ contractId                            [✕]     │    │
│ │   Type: string   Required: ✓                    │    │
│ │                                                  │    │
│ │ □ approverComments                      [✕]     │    │
│ │   Type: string   Required: □                    │    │
│ └──────────────────────────────────────────────────────┘│
│                                                          │
│ ┌─ Validation Rules ───────────────────────────────┐    │
│ │ [+ Add Rule]                                     │    │
│ │                                                  │    │
│ │ IF status EQUALS pending                 [✕]    │    │
│ │    Error: "Can only approve pending contracts"  │    │
│ └──────────────────────────────────────────────────────┘│
│                                                          │
│ ┌─ Side Effects ───────────────────────────────────┐    │
│ │ [+ Add Side Effect]                              │    │
│ │                                                  │    │
│ │ UPDATE self                              [✕]    │    │
│ │   status = "approved"                           │    │
│ │   approvedAt = {{timestamp}}                    │    │
│ │   approvedBy = {{userId}}                       │    │
│ │                                                  │    │
│ │ CREATE notification                      [✕]    │    │
│ │   userId = {{contract.ownerId}}                 │    │
│ │   message = "Contract approved"                 │    │
│ └──────────────────────────────────────────────────────┘│
│                                                          │
│                                  [Cancel] [Create Action]│
└──────────────────────────────────────────────────────────┘
```

## User Stories

### US-1: Create Action

**As a** business analyst
**I want to** define an action on an object type
**So that** I can codify business logic without writing code

**Acceptance Criteria**:
- ✅ Can create action from ontology viewer
- ✅ Can define parameters with types
- ✅ Can add validation rules
- ✅ Can configure side effects
- ✅ Action saved to ontology
- ✅ Action automatically registered as tool

### US-2: Execute Action via Agent

**As an** agent
**I want to** discover and execute actions on objects
**So that** I can perform business operations

**Acceptance Criteria**:
- ✅ Agent can list actions for object type
- ✅ Agent receives tool schema with parameters
- ✅ Agent can call action with parameters
- ✅ Validation rules enforced
- ✅ Side effects executed
- ✅ Result returned to agent

### US-3: Audit Action Execution

**As a** compliance officer
**I want to** see history of action executions
**So that** I can audit system operations

**Acceptance Criteria**:
- ✅ All executions logged to audit table
- ✅ Can see: who, when, what action, what params, what result
- ✅ Can filter by object, action, user, date
- ✅ Can export audit trail

## Implementation Notes

### Week 1: Core Action System

```typescript
// core/src/services/ontology/action/executor.ts
export async function execute(
  actionId: string,
  params: Record<string, any>,
  context: ExecutionContext
): Promise<ActionResult> {
  // 1. Load action definition
  const action = await ontology.node.getById(actionId, context.credentials);

  // 2. Validate parameters
  const validation = validateParameters(params, action.parameters);
  if (!validation.valid) throw new Error(validation.errors.join(', '));

  // 3. Load object
  const object = await loadObject(params[`${action.objectType}Id`], context);

  // 4. Run validation rules
  const rulesValid = await validateRules(action.validation?.rules, object);
  if (!rulesValid.valid) throw new Error(rulesValid.errors.join(', '));

  // 5. Execute function (if defined)
  let functionResult;
  if (action.function) {
    functionResult = await executeFunction(action.function, { params, object }, context);
  }

  // 6. Execute side effects
  const sideEffects = await executeSideEffects(action.sideEffects, { params, object, functionResult }, context);

  // 7. Log execution
  await logExecution(actionId, params, { success: true, sideEffects }, context);

  return { success: true, data: { object, sideEffects } };
}
```

### Week 2: Agent Integration

```typescript
// core/src/services/agent/index.ts
export async function createAgentWithObjectActions(
  objectType: string,
  credentials: AwsCredentials
) {
  // Get all actions for object type
  const actions = await ontology.action.getByObjectType(objectType, credentials);

  // Convert to tools
  const tools = actions.map(action => ({
    type: 'function',
    function: {
      name: action.name,
      description: action.description || `Execute ${action.name} on ${objectType}`,
      parameters: generateToolSchema(action.parameters)
    }
  }));

  // Create agent with tools
  return await createAgent({
    name: `${objectType} Agent`,
    instructions: `You can perform actions on ${objectType} objects.`,
    tools
  });
}
```

### Week 3: UI Builder

```typescript
// platform/src/app/ontology/components/action-builder.tsx
export function ActionBuilder({ objectType, onSave }) {
  const [parameters, setParameters] = useState([]);
  const [validationRules, setValidationRules] = useState([]);
  const [sideEffects, setSideEffects] = useState([]);

  async function handleSave() {
    const action = {
      name: form.name,
      objectType,
      parameters: parametersToSchema(parameters),
      validation: { rules: validationRules },
      sideEffects
    };

    await ontology.action.create(action, credentials);
    onSave();
  }

  return (
    <Dialog>
      <ParameterEditor parameters={parameters} onChange={setParameters} />
      <ValidationRuleEditor rules={validationRules} onChange={setValidationRules} />
      <SideEffectEditor effects={sideEffects} onChange={setSideEffects} />
      <Button onClick={handleSave}>Create Action</Button>
    </Dialog>
  );
}
```

## Testing

```typescript
describe('Action System', () => {
  it('executes action with side effects', async () => {
    const action = await ontology.action.create({
      name: 'approveContract',
      objectType: 'contract',
      parameters: { contractId: { type: 'string', required: true } },
      sideEffects: [
        { type: 'update', target: 'self', properties: { status: 'approved' } }
      ]
    }, credentials);

    const result = await ontology.action.execute(
      action.id,
      { contractId: 'contract-123' },
      context
    );

    expect(result.success).toBe(true);
    expect(result.data.object.status).toBe('approved');
  });

  it('registers action as agent tool', async () => {
    const tools = await getToolsForObject('contract', credentials);
    expect(tools).toContainEqual(
      expect.objectContaining({ function: { name: 'approveContract' } })
    );
  });
});
```

## Dependencies

- Feature 1: Ontology Viewer (for UI integration)
- `core/src/services/agent` - Agent tool registration
- `core/src/services/ontology/node.ts` - For loading objects
- S3 bucket: `captify-functions` (for external function storage)
- DynamoDB: `captify-core-function`, `captify-core-action-execution`

## Success Metrics

- ✅ 10+ actions defined across object types
- ✅ 80%+ business logic codified as actions (not code)
- ✅ Agents successfully execute actions
- ✅ Zero security incidents with function execution
- ✅ Action execution <500ms average

## Related Features

- Feature 1: Ontology Viewer (provides UI for action management)
- Feature 2: DataOps (actions can trigger data pipelines)
- Feature 3: Advanced Queries (actions can use queries)
