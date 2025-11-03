# 1. Database Indexes - Ontology Search Foundation

**Priority:** CRITICAL
**Estimated Time:** 1-2 hours
**Dependencies:** None
**Status:** Not Started

## Overview

The ontology tables need additional Global Secondary Indexes (GSIs) to support efficient searching, filtering, and querying. Currently, we can only query by primary key (id), which forces expensive scan operations for common queries.

## Current State

### core-ontology-node
- ✅ Primary Key: `id` (HASH)
- ✅ GSI: `category-type-index` (category HASH, type RANGE)

### core-ontology-edge
- ✅ Primary Key: `id` (HASH)
- ✅ GSI: `type-index` (type HASH)

## Required Indexes

### core-ontology-node (4 new indexes needed)

#### 1. name-index
**Purpose:** Fast lookup by node name
**Query Pattern:** Find node by exact name
**Example:** "Get the Contract node" → Query `name-index` WHERE name = 'Contract'

```
KeySchema:
  - name (HASH)
Projection: ALL
```

#### 2. app-type-index
**Purpose:** Filter nodes by application and type
**Query Pattern:** "Show all pmbook nodes" or "Show all pmbook Contract types"
**Example:** Query WHERE app = 'pmbook' AND type BEGINS_WITH 'contract'

```
KeySchema:
  - app (HASH)
  - type (RANGE)
Projection: ALL
```

#### 3. domain-category-index
**Purpose:** Filter by domain and category (already exists but verify)
**Query Pattern:** "Show all Contract domain entities"
**Example:** Query WHERE domain = 'Contract' AND category = 'entity'

```
KeySchema:
  - domain (HASH)
  - category (RANGE)
Projection: ALL
```

#### 4. tenantId-createdAt-index
**Purpose:** Multi-tenant isolation and time-based queries
**Query Pattern:** "Show all nodes for tenant 'default' created in last 7 days"
**Example:** Query WHERE tenantId = 'default' AND createdAt > '2025-01-01'

```
KeySchema:
  - tenantId (HASH)
  - createdAt (RANGE)
Projection: ALL
```

### core-ontology-edge (2 new indexes needed)

#### 1. source-target-index
**Purpose:** Find all edges from a source node
**Query Pattern:** "What does Contract connect to?"
**Example:** Query WHERE source = 'pmbook-contract'

```
KeySchema:
  - source (HASH)
  - target (RANGE)
Projection: ALL
```

#### 2. sourceType-targetType-index
**Purpose:** Find all relationships between node types
**Query Pattern:** "What types of nodes connect Contract to User?"
**Example:** Query WHERE sourceType = 'contract' AND targetType = 'user'

```
KeySchema:
  - sourceType (HASH)
  - targetType (RANGE)
Projection: ALL
```

## Implementation Checklist

### Phase 1: Verify Existing Indexes
- [ ] Check current indexes on `captify-core-ontology-node`
  ```bash
  aws dynamodb describe-table --table-name captify-core-ontology-node \
    --query 'Table.GlobalSecondaryIndexes[*].{Name:IndexName,Keys:KeySchema}' \
    --output json
  ```
- [ ] Check current indexes on `captify-core-ontology-edge`
  ```bash
  aws dynamodb describe-table --table-name captify-core-ontology-edge \
    --query 'Table.GlobalSecondaryIndexes[*].{Name:IndexName,Keys:KeySchema}' \
    --output json
  ```
- [ ] Document what already exists vs what's missing

### Phase 2: Create Node Indexes

- [ ] **Create name-index**
  ```bash
  aws dynamodb update-table \
    --table-name captify-core-ontology-node \
    --attribute-definitions AttributeName=name,AttributeType=S \
    --global-secondary-index-updates '[{
      "Create": {
        "IndexName": "name-index",
        "KeySchema": [{"AttributeName": "name", "KeyType": "HASH"}],
        "Projection": {"ProjectionType": "ALL"},
        "ProvisionedThroughput": {"ReadCapacityUnits": 5, "WriteCapacityUnits": 5}
      }
    }]'
  ```
  - [ ] Wait for index to become ACTIVE (~5 minutes)
  - [ ] Test query: `aws dynamodb query --table-name captify-core-ontology-node --index-name name-index --key-condition-expression "name = :n" --expression-attribute-values '{":n":{"S":"Contract"}}'`

- [ ] **Create app-type-index**
  ```bash
  aws dynamodb update-table \
    --table-name captify-core-ontology-node \
    --attribute-definitions \
      AttributeName=app,AttributeType=S \
      AttributeName=type,AttributeType=S \
    --global-secondary-index-updates '[{
      "Create": {
        "IndexName": "app-type-index",
        "KeySchema": [
          {"AttributeName": "app", "KeyType": "HASH"},
          {"AttributeName": "type", "KeyType": "RANGE"}
        ],
        "Projection": {"ProjectionType": "ALL"},
        "ProvisionedThroughput": {"ReadCapacityUnits": 5, "WriteCapacityUnits": 5}
      }
    }]'
  ```
  - [ ] Wait for index to become ACTIVE
  - [ ] Test query: `aws dynamodb query --table-name captify-core-ontology-node --index-name app-type-index --key-condition-expression "app = :a" --expression-attribute-values '{":a":{"S":"pmbook"}}'`

- [ ] **Verify domain-category-index exists**
  - [ ] If missing, create it
  - [ ] Test query with domain filter

- [ ] **Create tenantId-createdAt-index**
  ```bash
  aws dynamodb update-table \
    --table-name captify-core-ontology-node \
    --attribute-definitions \
      AttributeName=tenantId,AttributeType=S \
      AttributeName=createdAt,AttributeType=S \
    --global-secondary-index-updates '[{
      "Create": {
        "IndexName": "tenantId-createdAt-index",
        "KeySchema": [
          {"AttributeName": "tenantId", "KeyType": "HASH"},
          {"AttributeName": "createdAt", "KeyType": "RANGE"}
        ],
        "Projection": {"ProjectionType": "ALL"},
        "ProvisionedThroughput": {"ReadCapacityUnits": 5, "WriteCapacityUnits": 5}
      }
    }]'
  ```
  - [ ] Wait for index to become ACTIVE
  - [ ] Test query: `aws dynamodb query --table-name captify-core-ontology-node --index-name tenantId-createdAt-index --key-condition-expression "tenantId = :t" --expression-attribute-values '{":t":{"S":"default"}}'`

### Phase 3: Create Edge Indexes

- [ ] **Create source-target-index**
  ```bash
  aws dynamodb update-table \
    --table-name captify-core-ontology-edge \
    --attribute-definitions \
      AttributeName=source,AttributeType=S \
      AttributeName=target,AttributeType=S \
    --global-secondary-index-updates '[{
      "Create": {
        "IndexName": "source-target-index",
        "KeySchema": [
          {"AttributeName": "source", "KeyType": "HASH"},
          {"AttributeName": "target", "KeyType": "RANGE"}
        ],
        "Projection": {"ProjectionType": "ALL"},
        "ProvisionedThroughput": {"ReadCapacityUnits": 5, "WriteCapacityUnits": 5}
      }
    }]'
  ```
  - [ ] Wait for index to become ACTIVE
  - [ ] Test query: Find all edges from a specific node

- [ ] **Add sourceType and targetType attributes to edge records**
  - [ ] Update edge creation logic to include these fields
  - [ ] Backfill existing edges with sourceType/targetType
  - [ ] Create migration script: `scripts/backfill-edge-types.ts`

- [ ] **Create sourceType-targetType-index**
  ```bash
  aws dynamodb update-table \
    --table-name captify-core-ontology-edge \
    --attribute-definitions \
      AttributeName=sourceType,AttributeType=S \
      AttributeName=targetType,AttributeType=S \
    --global-secondary-index-updates '[{
      "Create": {
        "IndexName": "sourceType-targetType-index",
        "KeySchema": [
          {"AttributeName": "sourceType", "KeyType": "HASH"},
          {"AttributeName": "targetType", "KeyType": "RANGE"}
        ],
        "Projection": {"ProjectionType": "ALL"},
        "ProvisionedThroughput": {"ReadCapacityUnits": 5, "WriteCapacityUnits": 5}
      }
    }]'
  ```
  - [ ] Wait for index to become ACTIVE
  - [ ] Test query: Find all contract→user relationships

### Phase 4: Update Code to Use Indexes

- [ ] Update `platform/src/app/core/designer/ontology/builder/page.tsx`
  - [ ] Replace scan with query using `tenantId-createdAt-index`
  - [ ] Add filter dropdown for app, domain, category

- [ ] Update `platform/src/app/core/designer/ontology/builder/components/OntologyCanvas.tsx`
  - [ ] Replace scan with query for node search
  - [ ] Use `name-index` for exact name lookups
  - [ ] Use `app-type-index` for filtered results

- [ ] Create search hook: `hooks/use-ontology-search.ts`
  ```typescript
  export function useOntologySearch(filters: OntologyFilters) {
    // Use appropriate index based on filters
    if (filters.name) return queryByName(filters.name);
    if (filters.app) return queryByApp(filters.app, filters.type);
    if (filters.domain) return queryByDomain(filters.domain, filters.category);
    // Default to scan with filters
    return scanWithFilters(filters);
  }
  ```

### Phase 5: Test & Validate

- [ ] Test name search performance (should be <100ms)
- [ ] Test app filter performance
- [ ] Test domain filter performance
- [ ] Test relationship queries from node
- [ ] Verify all indexes are ACTIVE
- [ ] Check CloudWatch metrics for index usage
- [ ] Document query patterns in code comments

## Performance Expectations

### Before Indexes (Scan Operations)
- Search by name: ~500-1000ms (scans entire table)
- Filter by app: ~800-1500ms (scans entire table)
- Find relationships: ~300-800ms per edge lookup

### After Indexes (Query Operations)
- Search by name: <50ms (direct hash key lookup)
- Filter by app: <100ms (query on hash key)
- Find relationships: <50ms (query on source hash key)

## Cost Impact

**Read Capacity Units:**
- Each GSI: 5 RCU = $0.00065/hour = ~$0.47/month
- 6 new indexes = ~$2.82/month additional cost

**Write Capacity Units:**
- Each GSI: 5 WCU = $0.00065/hour = ~$0.47/month
- 6 new indexes = ~$2.82/month additional cost

**Total Additional Cost:** ~$5.64/month for significantly better performance

## Notes for Future Agents

### Why These Specific Indexes?

1. **name-index**: Users will frequently search for nodes by name in the UI. Without this, we scan the entire table for every search.

2. **app-type-index**: Each application (core, pmbook, aihub, mi) has its own nodes. Filtering by app is essential for showing relevant nodes to users.

3. **domain-category-index**: Ontology is organized by domains (Contract, User, Workflow, etc.). This allows efficient "show me all Contract entities" queries.

4. **tenantId-createdAt-index**: Multi-tenant support + time-based filtering. Essential for tenant isolation and "recently created" features.

5. **source-target-index**: When viewing a node, we need to quickly find all its outbound relationships. Without this, we scan all edges.

6. **sourceType-targetType-index**: Allows queries like "show all contract→user relationships" for understanding ontology patterns.

### Common Pitfalls

⚠️ **DynamoDB only allows one GSI creation at a time.** Wait for each index to become ACTIVE before creating the next.

⚠️ **Attributes must be defined in AttributeDefinitions** before referencing in KeySchema.

⚠️ **Projection Type ALL** means the entire item is copied to the index. Use KEYS_ONLY or INCLUDE for large items to save storage.

⚠️ **sourceType/targetType don't exist yet** on edge records. Must backfill before creating that index.

### Testing Queries

```typescript
// Query by name (exact match)
const result = await apiClient.run({
  service: 'platform.dynamodb',
  operation: 'query',
  table: 'core-ontology-node',
  data: {
    IndexName: 'name-index',
    KeyConditionExpression: '#name = :name',
    ExpressionAttributeNames: { '#name': 'name' },
    ExpressionAttributeValues: { ':name': 'Contract' }
  }
});

// Query by app (with optional type filter)
const result = await apiClient.run({
  service: 'platform.dynamodb',
  operation: 'query',
  table: 'core-ontology-node',
  data: {
    IndexName: 'app-type-index',
    KeyConditionExpression: 'app = :app AND begins_with(#type, :type)',
    ExpressionAttributeNames: { '#type': 'type' },
    ExpressionAttributeValues: { ':app': 'pmbook', ':type': 'contract' }
  }
});

// Find all edges from a node
const result = await apiClient.run({
  service: 'platform.dynamodb',
  operation: 'query',
  table: 'core-ontology-edge',
  data: {
    IndexName: 'source-target-index',
    KeyConditionExpression: 'source = :source',
    ExpressionAttributeValues: { ':source': 'pmbook-contract' }
  }
});
```

## Success Criteria

- [ ] All 6 indexes created and ACTIVE
- [ ] Search by name returns results in <100ms
- [ ] App filter works without scanning entire table
- [ ] Relationship lookups are fast (<50ms)
- [ ] Code updated to use indexes instead of scans
- [ ] Tests pass for all query patterns
- [ ] Documentation updated with query examples

## Next Steps

After completing indexes, proceed to:
- **2-flow-migration.md** - Migrate to core Flow component
- **3-search-filter.md** - Build advanced search UI using these indexes
