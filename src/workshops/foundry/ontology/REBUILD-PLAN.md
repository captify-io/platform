# Ontology System Rebuild Plan

**Status**: Ready to Start
**Goal**: Build a Captify-inspired ontology system with Objects, Links, and Actions
**Approach**: Iterative, test-driven, component-by-component
**Timeline**: 5 weeks (24 days)

---

## Overview

We're rebuilding the ontology system from scratch following Captify's proven architecture. Each component will be built, tested, and deployed independently before moving to the next.

### Build Order

1. **Backend: Object Types** → Test → Deploy
2. **Backend: Link Types** → Test → Deploy
3. **Frontend: Object Type Manager** → Test → Deploy
4. **Frontend: Link Type Manager** → Test → Deploy
5. **Backend: Object Instances** → Test → Deploy
6. **Frontend: Object Manager** → Test → Deploy

---

## Phase 1: Backend - Object Types (3 days)

### 1.1 Create Type Definitions

**File**: `core/src/services/ontology/types.ts`

```typescript
/**
 * Object Type Definition (Captify-inspired)
 *
 * An ObjectType defines the schema for a real-world entity or concept.
 * Examples: Employee, Contract, Customer, Project
 */
export interface ObjectType {
  // Identity
  apiName: string;              // Unique identifier (camelCase): "employee", "contract"
  displayName: string;          // Human-readable: "Employee", "Contract"
  description?: string;         // Optional description

  // Schema
  primaryKey: string[];         // Properties that uniquely identify an object: ["employeeId"]
  properties: {
    [propertyName: string]: PropertyDefinition;
  }

  // Status
  status: 'active' | 'deprecated';

  // Audit
  createdAt: string;            // ISO 8601 timestamp
  updatedAt: string;            // ISO 8601 timestamp
}

/**
 * Property Definition
 *
 * Defines a single property on an object type.
 */
export interface PropertyDefinition {
  type: PropertyType;
  description?: string;
  required?: boolean;
  defaultValue?: any;
}

/**
 * Property Types (Captify base types)
 */
export type PropertyType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'date'
  | 'timestamp'
  | 'geopoint'
  | 'attachment';

/**
 * Link Type Definition
 *
 * A LinkType defines the relationship between two object types.
 * Examples: Company employs Employee, Contract hasMany CLINs
 */
export interface LinkType {
  // Identity
  apiName: string;                     // Unique identifier: "companyEmploysEmployee"
  displayName: string;                 // Human-readable: "Company Employs Employee"

  // Relationship
  sourceObjectType: string;            // Source object type apiName: "company"
  targetObjectType: string;            // Target object type apiName: "employee"
  cardinality: Cardinality;            // Relationship cardinality

  // Foreign Key (optional)
  foreignKey?: string;                 // Property in source that references target: "companyId"

  // Inverse (optional)
  inverseLinkType?: string;            // Inverse link apiName: "employeeWorksForCompany"

  // Status
  status: 'active' | 'deprecated';

  // Audit
  createdAt: string;
  updatedAt: string;
}

/**
 * Link Cardinality
 */
export type Cardinality = 'ONE_TO_ONE' | 'ONE_TO_MANY' | 'MANY_TO_MANY';

/**
 * Object Instance
 *
 * A single instance of an object type with actual data.
 */
export interface ObjectInstance {
  __objectType: string;           // Object type apiName
  __primaryKey: string;           // Computed primary key (concatenated from primaryKey properties)
  [propertyName: string]: any;    // Dynamic properties based on object type
  __createdAt?: string;
  __updatedAt?: string;
}

/**
 * AWS Credentials (from existing system)
 */
export interface AwsCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string;
}
```

### 1.2 Create Object Type Service

**File**: `core/src/services/ontology/object-type.ts`

```typescript
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, ScanCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import type { ObjectType, AwsCredentials } from './types';

const TABLE_NAME = (schema: string) => `${schema}-ontology-object-type`;

/**
 * Create a new object type
 */
export async function createObjectType(
  objectType: ObjectType,
  credentials: AwsCredentials,
  schema: string = 'captify'
): Promise<ObjectType> {
  // Validation
  if (!objectType.apiName) {
    throw new Error('apiName is required');
  }
  if (!objectType.displayName) {
    throw new Error('displayName is required');
  }
  if (!objectType.primaryKey || objectType.primaryKey.length === 0) {
    throw new Error('primaryKey is required');
  }

  // Ensure primary key properties exist in properties
  for (const key of objectType.primaryKey) {
    if (!objectType.properties[key]) {
      throw new Error(`Primary key property "${key}" not found in properties`);
    }
  }

  // Set timestamps
  const now = new Date().toISOString();
  const newObjectType: ObjectType = {
    ...objectType,
    status: objectType.status || 'active',
    createdAt: now,
    updatedAt: now,
  };

  // Save to DynamoDB
  const client = createDynamoClient(credentials);
  await client.send(new PutCommand({
    TableName: TABLE_NAME(schema),
    Item: newObjectType,
    ConditionExpression: 'attribute_not_exists(apiName)',
  }));

  return newObjectType;
}

/**
 * Get an object type by apiName
 */
export async function getObjectType(
  apiName: string,
  credentials: AwsCredentials,
  schema: string = 'captify'
): Promise<ObjectType | null> {
  const client = createDynamoClient(credentials);
  const result = await client.send(new GetCommand({
    TableName: TABLE_NAME(schema),
    Key: { apiName },
  }));

  return result.Item as ObjectType | null;
}

/**
 * List all object types
 */
export async function listObjectTypes(
  credentials: AwsCredentials,
  schema: string = 'captify',
  status?: 'active' | 'deprecated'
): Promise<ObjectType[]> {
  const client = createDynamoClient(credentials);

  const params: any = {
    TableName: TABLE_NAME(schema),
  };

  if (status) {
    params.FilterExpression = '#status = :status';
    params.ExpressionAttributeNames = { '#status': 'status' };
    params.ExpressionAttributeValues = { ':status': status };
  }

  const result = await client.send(new ScanCommand(params));
  return (result.Items || []) as ObjectType[];
}

/**
 * Update an object type
 */
export async function updateObjectType(
  apiName: string,
  updates: Partial<Omit<ObjectType, 'apiName' | 'createdAt'>>,
  credentials: AwsCredentials,
  schema: string = 'captify'
): Promise<ObjectType> {
  // Build update expression
  const updateExpressions: string[] = [];
  const expressionAttributeNames: Record<string, string> = {};
  const expressionAttributeValues: Record<string, any> = {};

  // Always update timestamp
  updates.updatedAt = new Date().toISOString();

  Object.entries(updates).forEach(([key, value], index) => {
    const attrName = `#attr${index}`;
    const attrValue = `:val${index}`;
    updateExpressions.push(`${attrName} = ${attrValue}`);
    expressionAttributeNames[attrName] = key;
    expressionAttributeValues[attrValue] = value;
  });

  const client = createDynamoClient(credentials);
  const result = await client.send(new UpdateCommand({
    TableName: TABLE_NAME(schema),
    Key: { apiName },
    UpdateExpression: `SET ${updateExpressions.join(', ')}`,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
    ReturnValues: 'ALL_NEW',
  }));

  return result.Attributes as ObjectType;
}

/**
 * Delete an object type
 */
export async function deleteObjectType(
  apiName: string,
  credentials: AwsCredentials,
  schema: string = 'captify'
): Promise<void> {
  const client = createDynamoClient(credentials);
  await client.send(new DeleteCommand({
    TableName: TABLE_NAME(schema),
    Key: { apiName },
  }));
}

/**
 * Helper: Create DynamoDB client
 */
function createDynamoClient(credentials: AwsCredentials): DynamoDBDocumentClient {
  const client = new DynamoDBClient({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
      sessionToken: credentials.sessionToken,
    },
  });
  return DynamoDBDocumentClient.from(client);
}
```

### 1.3 Create DynamoDB Table

**File**: `platform/scripts/create-ontology-tables.ts`

```typescript
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { CreateTableCommand } from '@aws-sdk/client-dynamodb';

const REGION = process.env.AWS_REGION || 'us-east-1';
const SCHEMA = process.env.SCHEMA || 'captify';

async function createTables() {
  const client = new DynamoDBClient({
    region: REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });

  // Object Type Table
  try {
    await client.send(new CreateTableCommand({
      TableName: `${SCHEMA}-ontology-object-type`,
      KeySchema: [
        { AttributeName: 'apiName', KeyType: 'HASH' },
      ],
      AttributeDefinitions: [
        { AttributeName: 'apiName', AttributeType: 'S' },
        { AttributeName: 'status', AttributeType: 'S' },
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: 'status-index',
          KeySchema: [
            { AttributeName: 'status', KeyType: 'HASH' },
          ],
          Projection: { ProjectionType: 'ALL' },
          ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5,
          },
        },
      ],
      BillingMode: 'PROVISIONED',
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5,
      },
    }));
    console.log('✅ Created ontology-object-type table');
  } catch (error: any) {
    if (error.name === 'ResourceInUseException') {
      console.log('ℹ️  ontology-object-type table already exists');
    } else {
      throw error;
    }
  }
}

createTables().catch(console.error);
```

### 1.4 Write Tests

**File**: `core/src/services/ontology/__tests__/object-type.test.ts`

```typescript
import { createObjectType, getObjectType, listObjectTypes, updateObjectType, deleteObjectType } from '../object-type';
import type { ObjectType, AwsCredentials } from '../types';

// Mock credentials (use test environment)
const credentials: AwsCredentials = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
};

describe('ObjectType Service', () => {
  const testObjectType: ObjectType = {
    apiName: 'testEmployee',
    displayName: 'Test Employee',
    description: 'Test employee object type',
    primaryKey: ['employeeId'],
    properties: {
      employeeId: { type: 'string', required: true },
      name: { type: 'string', required: true },
      email: { type: 'string' },
      hireDate: { type: 'date' },
    },
    status: 'active',
    createdAt: '',
    updatedAt: '',
  };

  test('createObjectType should create a new object type', async () => {
    const result = await createObjectType(testObjectType, credentials, 'captify-test');
    expect(result.apiName).toBe('testEmployee');
    expect(result.createdAt).toBeTruthy();
    expect(result.updatedAt).toBeTruthy();
  });

  test('getObjectType should retrieve an object type', async () => {
    const result = await getObjectType('testEmployee', credentials, 'captify-test');
    expect(result).not.toBeNull();
    expect(result?.apiName).toBe('testEmployee');
  });

  test('listObjectTypes should list all object types', async () => {
    const result = await listObjectTypes(credentials, 'captify-test');
    expect(result.length).toBeGreaterThan(0);
    expect(result.some(ot => ot.apiName === 'testEmployee')).toBe(true);
  });

  test('updateObjectType should update an object type', async () => {
    const result = await updateObjectType(
      'testEmployee',
      { description: 'Updated description' },
      credentials,
      'captify-test'
    );
    expect(result.description).toBe('Updated description');
  });

  test('deleteObjectType should delete an object type', async () => {
    await deleteObjectType('testEmployee', credentials, 'captify-test');
    const result = await getObjectType('testEmployee', credentials, 'captify-test');
    expect(result).toBeNull();
  });
});
```

### 1.5 Test & Deploy

```bash
# Run tests
cd /opt/captify-apps/core
npm test object-type.test.ts

# Build
npm run build

# Create table
cd /opt/captify-apps/platform
npx tsx scripts/create-ontology-tables.ts

# Verify table exists
aws dynamodb describe-table --table-name captify-ontology-object-type
```

---

## Phase 2: Backend - Link Types (3 days)

### 2.1 Create Link Type Service

**File**: `core/src/services/ontology/link-type.ts`

```typescript
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, ScanCommand, QueryCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import type { LinkType, AwsCredentials } from './types';

const TABLE_NAME = (schema: string) => `${schema}-ontology-link-type`;

/**
 * Create a new link type
 */
export async function createLinkType(
  linkType: LinkType,
  credentials: AwsCredentials,
  schema: string = 'captify'
): Promise<LinkType> {
  // Validation
  if (!linkType.apiName) {
    throw new Error('apiName is required');
  }
  if (!linkType.sourceObjectType) {
    throw new Error('sourceObjectType is required');
  }
  if (!linkType.targetObjectType) {
    throw new Error('targetObjectType is required');
  }
  if (!linkType.cardinality) {
    throw new Error('cardinality is required');
  }

  // Set timestamps
  const now = new Date().toISOString();
  const newLinkType: LinkType = {
    ...linkType,
    status: linkType.status || 'active',
    createdAt: now,
    updatedAt: now,
  };

  // Save to DynamoDB
  const client = createDynamoClient(credentials);
  await client.send(new PutCommand({
    TableName: TABLE_NAME(schema),
    Item: newLinkType,
    ConditionExpression: 'attribute_not_exists(apiName)',
  }));

  return newLinkType;
}

/**
 * Get a link type by apiName
 */
export async function getLinkType(
  apiName: string,
  credentials: AwsCredentials,
  schema: string = 'captify'
): Promise<LinkType | null> {
  const client = createDynamoClient(credentials);
  const result = await client.send(new GetCommand({
    TableName: TABLE_NAME(schema),
    Key: { apiName },
  }));

  return result.Item as LinkType | null;
}

/**
 * List all link types
 */
export async function listLinkTypes(
  credentials: AwsCredentials,
  schema: string = 'captify',
  objectTypeApiName?: string
): Promise<LinkType[]> {
  const client = createDynamoClient(credentials);

  if (objectTypeApiName) {
    // Query by source or target
    const [outgoing, incoming] = await Promise.all([
      getOutgoingLinkTypes(objectTypeApiName, credentials, schema),
      getIncomingLinkTypes(objectTypeApiName, credentials, schema),
    ]);
    return [...outgoing, ...incoming];
  }

  const result = await client.send(new ScanCommand({
    TableName: TABLE_NAME(schema),
  }));

  return (result.Items || []) as LinkType[];
}

/**
 * Get outgoing link types for an object type
 */
export async function getOutgoingLinkTypes(
  objectTypeApiName: string,
  credentials: AwsCredentials,
  schema: string = 'captify'
): Promise<LinkType[]> {
  const client = createDynamoClient(credentials);
  const result = await client.send(new QueryCommand({
    TableName: TABLE_NAME(schema),
    IndexName: 'sourceObjectType-index',
    KeyConditionExpression: 'sourceObjectType = :sourceObjectType',
    ExpressionAttributeValues: {
      ':sourceObjectType': objectTypeApiName,
    },
  }));

  return (result.Items || []) as LinkType[];
}

/**
 * Get incoming link types for an object type
 */
export async function getIncomingLinkTypes(
  objectTypeApiName: string,
  credentials: AwsCredentials,
  schema: string = 'captify'
): Promise<LinkType[]> {
  const client = createDynamoClient(credentials);
  const result = await client.send(new QueryCommand({
    TableName: TABLE_NAME(schema),
    IndexName: 'targetObjectType-index',
    KeyConditionExpression: 'targetObjectType = :targetObjectType',
    ExpressionAttributeValues: {
      ':targetObjectType': objectTypeApiName,
    },
  }));

  return (result.Items || []) as LinkType[];
}

/**
 * Update a link type
 */
export async function updateLinkType(
  apiName: string,
  updates: Partial<Omit<LinkType, 'apiName' | 'createdAt'>>,
  credentials: AwsCredentials,
  schema: string = 'captify'
): Promise<LinkType> {
  const updateExpressions: string[] = [];
  const expressionAttributeNames: Record<string, string> = {};
  const expressionAttributeValues: Record<string, any> = {};

  updates.updatedAt = new Date().toISOString();

  Object.entries(updates).forEach(([key, value], index) => {
    const attrName = `#attr${index}`;
    const attrValue = `:val${index}`;
    updateExpressions.push(`${attrName} = ${attrValue}`);
    expressionAttributeNames[attrName] = key;
    expressionAttributeValues[attrValue] = value;
  });

  const client = createDynamoClient(credentials);
  const result = await client.send(new UpdateCommand({
    TableName: TABLE_NAME(schema),
    Key: { apiName },
    UpdateExpression: `SET ${updateExpressions.join(', ')}`,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
    ReturnValues: 'ALL_NEW',
  }));

  return result.Attributes as LinkType;
}

/**
 * Delete a link type
 */
export async function deleteLinkType(
  apiName: string,
  credentials: AwsCredentials,
  schema: string = 'captify'
): Promise<void> {
  const client = createDynamoClient(credentials);
  await client.send(new DeleteCommand({
    TableName: TABLE_NAME(schema),
    Key: { apiName },
  }));
}

function createDynamoClient(credentials: AwsCredentials): DynamoDBDocumentClient {
  const client = new DynamoDBClient({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
      sessionToken: credentials.sessionToken,
    },
  });
  return DynamoDBDocumentClient.from(client);
}
```

### 2.2 Update Table Creation Script

Add link type table creation to `platform/scripts/create-ontology-tables.ts`:

```typescript
// Link Type Table
try {
  await client.send(new CreateTableCommand({
    TableName: `${SCHEMA}-ontology-link-type`,
    KeySchema: [
      { AttributeName: 'apiName', KeyType: 'HASH' },
    ],
    AttributeDefinitions: [
      { AttributeName: 'apiName', AttributeType: 'S' },
      { AttributeName: 'sourceObjectType', AttributeType: 'S' },
      { AttributeName: 'targetObjectType', AttributeType: 'S' },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'sourceObjectType-index',
        KeySchema: [
          { AttributeName: 'sourceObjectType', KeyType: 'HASH' },
        ],
        Projection: { ProjectionType: 'ALL' },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5,
        },
      },
      {
        IndexName: 'targetObjectType-index',
        KeySchema: [
          { AttributeName: 'targetObjectType', KeyType: 'HASH' },
        ],
        Projection: { ProjectionType: 'ALL' },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5,
        },
      },
    ],
    BillingMode: 'PROVISIONED',
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5,
    },
  }));
  console.log('✅ Created ontology-link-type table');
} catch (error: any) {
  if (error.name === 'ResourceInUseException') {
    console.log('ℹ️  ontology-link-type table already exists');
  } else {
    throw error;
  }
}
```

### 2.3 Write Tests

**File**: `core/src/services/ontology/__tests__/link-type.test.ts`

Similar structure to object-type.test.ts

### 2.4 Test & Deploy

```bash
# Run tests
npm test link-type.test.ts

# Build
npm run build

# Create table
npx tsx scripts/create-ontology-tables.ts
```

---

## Phase 3: Frontend - Object Type Manager (3 days)

### 3.1 Create Object Type Manager Component

**File**: `core/src/components/ontology/object-type-manager.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@captify-io/core/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@captify-io/core/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@captify-io/core/components/ui/table';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import type { ObjectType } from '@captify-io/core/services/ontology/types';
import { apiClient } from '@captify-io/core/lib/api';

export function ObjectTypeManager() {
  const [objectTypes, setObjectTypes] = useState<ObjectType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<ObjectType | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Load object types
  useEffect(() => {
    loadObjectTypes();
  }, []);

  async function loadObjectTypes() {
    try {
      const response = await apiClient.run({
        service: 'platform.ontology',
        operation: 'listObjectTypes',
      });
      setObjectTypes(response.data || []);
    } catch (error) {
      console.error('Failed to load object types:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleCreate() {
    setSelectedType(null);
    setIsDialogOpen(true);
  }

  function handleEdit(objectType: ObjectType) {
    setSelectedType(objectType);
    setIsDialogOpen(true);
  }

  async function handleDelete(apiName: string) {
    if (!confirm('Are you sure you want to delete this object type?')) return;

    try {
      await apiClient.run({
        service: 'platform.ontology',
        operation: 'deleteObjectType',
        data: { apiName },
      });
      loadObjectTypes();
    } catch (error) {
      console.error('Failed to delete object type:', error);
    }
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Object Types</h2>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Create Object Type
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>API Name</TableHead>
            <TableHead>Display Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Primary Key</TableHead>
            <TableHead>Properties</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {objectTypes.map((type) => (
            <TableRow key={type.apiName}>
              <TableCell className="font-mono">{type.apiName}</TableCell>
              <TableCell>{type.displayName}</TableCell>
              <TableCell>{type.description || '-'}</TableCell>
              <TableCell className="font-mono text-sm">
                {type.primaryKey.join(', ')}
              </TableCell>
              <TableCell>{Object.keys(type.properties).length}</TableCell>
              <TableCell>
                <span className={`px-2 py-1 rounded text-xs ${
                  type.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {type.status}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(type)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(type.apiName)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Dialog for create/edit */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {selectedType ? 'Edit Object Type' : 'Create Object Type'}
            </DialogTitle>
          </DialogHeader>
          {/* Form component to be created */}
          <ObjectTypeForm
            objectType={selectedType}
            onSave={() => {
              setIsDialogOpen(false);
              loadObjectTypes();
            }}
            onCancel={() => setIsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ObjectTypeForm component to be implemented next
function ObjectTypeForm({ objectType, onSave, onCancel }: any) {
  // TODO: Implement form
  return <div>Form coming next...</div>;
}
```

### 3.2 Continue with remaining components...

(Link Type Manager, Object Manager, etc.)

---

## Implementation Checklist

### Week 1: Backend Foundation
- [ ] Create types.ts with interfaces
- [ ] Create object-type.ts service
- [ ] Create link-type.ts service
- [ ] Create DynamoDB table creation script
- [ ] Write unit tests for object-type
- [ ] Write unit tests for link-type
- [ ] Deploy tables to AWS
- [ ] Test backend services

### Week 2: Frontend Object Types
- [ ] Create ObjectTypeManager component
- [ ] Create ObjectTypeForm component
- [ ] Create PropertyEditor component
- [ ] Add API endpoints in platform
- [ ] Test create object type flow
- [ ] Test edit object type flow
- [ ] Test delete object type flow
- [ ] Integration testing

### Week 3: Frontend Link Types
- [ ] Create LinkTypeManager component
- [ ] Create LinkTypeForm component
- [ ] Create LinkGraphView component
- [ ] Add API endpoints in platform
- [ ] Test create link type flow
- [ ] Test edit link type flow
- [ ] Test delete link type flow
- [ ] Integration testing

### Week 4: Object Instances Backend
- [ ] Create object.ts service
- [ ] Create object instance tables
- [ ] Implement CRUD operations
- [ ] Implement link operations
- [ ] Write unit tests
- [ ] Deploy and test

### Week 5: Object Instances Frontend
- [ ] Create ObjectManager component
- [ ] Create dynamic ObjectForm
- [ ] Create LinkManager component
- [ ] Test full workflow
- [ ] Documentation
- [ ] Final deployment

---

## Success Metrics

After completion, we should be able to:

1. ✅ Create object types (e.g., Employee, Contract) through UI
2. ✅ Define properties with types (string, number, date, etc.)
3. ✅ Set primary key properties
4. ✅ Create link types between object types
5. ✅ Visualize relationships in a graph
6. ✅ Create object instances with dynamic forms
7. ✅ Link objects together
8. ✅ Query and display linked objects

---

## Next Steps

Ready to start Phase 1? Let me know and I'll begin building the backend services.
