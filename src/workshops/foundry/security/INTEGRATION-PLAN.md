# Security Integration Plan

## Overview

This document outlines how security features integrate with the **ontology service** (`core/src/services/ontology`) and the **Control Panel** (`platform/src/workshops/foundry/control-panel`) management interface.

**Key Principle**: Security is **part of the ontology**, not a separate system. Every ontology object inherently has security metadata.

---

## Architecture Integration

```
┌─────────────────────────────────────────────────────────────────┐
│                     CONTROL PANEL (UI)                           │
│  /control-panel/* - Manage all foundry items including security │
│                                                                  │
│  Security Management:                                            │
│  - Organizations                                                 │
│  - Markings & Categories                                         │
│  - User Clearances & Compartments                               │
│  - ACL Management                                                │
│  - Security Audit Logs                                           │
│  - Compliance Dashboard                                          │
└─────────────────────────────────────────────────────────────────┘
                            ↓ API Calls
┌─────────────────────────────────────────────────────────────────┐
│              ONTOLOGY SERVICE (core/src/services/ontology)       │
│                                                                  │
│  Object Types:                                                   │
│  - core.organization                                             │
│  - core.marking-category                                         │
│  - core.marking                                                  │
│  - core.security-policy                                          │
│                                                                  │
│  Security on ALL Objects:                                        │
│  - securityMetadata (part of SharedProperties)                  │
│  - Permission checks in operations.ts                           │
│  - Audit logging in all CRUD operations                         │
└─────────────────────────────────────────────────────────────────┘
                            ↓ Storage
┌─────────────────────────────────────────────────────────────────┐
│                      DYNAMODB TABLES                             │
│                                                                  │
│  - captify-core-organization                                     │
│  - captify-core-marking-category                                 │
│  - captify-core-marking                                          │
│  - captify-core-security-policy                                  │
│  - captify-core-audit-log                                        │
│                                                                  │
│  Security metadata on ALL tables (part of every item)           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Ontology Service Extensions

### 1.1 Add Security to SharedProperties

**File**: `core/src/services/ontology/types.ts`

**Change**: Extend `SharedProperties` interface to include security metadata:

```typescript
/**
 * Shared Properties
 *
 * These properties exist on EVERY object instance automatically.
 */
export interface SharedProperties {
  // Existing fields
  id: string;
  slug: string;
  name: string;
  description?: string;
  createdBy?: string;
  createdAt: string;
  updatedBy?: string;
  updatedAt: string;
  version: number;
  status: 'active' | 'draft' | 'archived';
  tags?: string[];
  metadata?: Record<string, any>;

  // NEW: Security metadata (automatically on every object)
  securityMetadata?: {
    // Organization & Ownership
    organizationId: string;           // Which org owns this
    ownerId?: string;                 // User who created (redundant with createdBy)

    // Classification
    classification: 'UNCLASSIFIED' | 'CUI' | 'SECRET' | 'TOP_SECRET';
    markings: string[];               // ['PII', 'PHI', 'FIN', etc.]
    sciCompartments?: string[];       // SCI compartment codes

    // Access Control List (ACL)
    acl: {
      editors: string[];              // User IDs with edit access
      viewers: string[];              // User IDs with view access
      public: boolean;                // Publicly accessible?
    };

    // Clearance Requirements
    requiredClearance?: 'SECRET' | 'TOP_SECRET';
    requiredCompartments?: string[]; // Required SCI compartments
    needToKnow?: boolean;            // Need-to-know required

    // Audit
    lastAccessedAt?: string;
    lastAccessedBy?: string;
    accessCount: number;

    // Data Lineage Security
    inheritedMarkings?: {
      marking: string;
      source: string;                 // Object ID marking came from
      path: string[];                 // Lineage path
    }[];

    // Encryption
    encrypted: boolean;
    kmsKeyId?: string;                // KMS key for encryption
  };
}
```

**Why**: Every object automatically gets security metadata. No need to add it manually to each object type.

---

### 1.2 Create Security Object Types

**File**: `core/src/services/ontology/object-types/security.ts` (new file)

**Object Types to Create**:

#### 1.2.1 Organization

```typescript
export const organizationObjectType: ObjectType = {
  slug: 'organization',
  app: 'core',
  name: 'Organization',
  description: 'Security boundary representing a tenant or organizational unit',

  properties: {
    // Basic Info
    fullName: {
      type: 'string',
      required: true,
      description: 'Full organization name'
    },
    shortName: {
      type: 'string',
      required: true,
      description: 'Abbreviation or acronym'
    },
    domain: {
      type: 'string',
      description: 'Email domain (e.g., acme.com)'
    },

    // Settings
    allowCrossOrgSharing: {
      type: 'boolean',
      description: 'Allow sharing resources with other orgs',
      default: false
    },
    defaultClassification: {
      type: 'string',
      enum: ['UNCLASSIFIED', 'CUI', 'SECRET', 'TOP_SECRET'],
      default: 'UNCLASSIFIED'
    },

    // Membership
    memberCount: {
      type: 'number',
      description: 'Number of users in this org'
    },
    adminUserIds: {
      type: 'array',
      items: { type: 'string' },
      description: 'Organization administrators'
    }
  },

  examples: {
    slug: 'org-acme',
    name: 'ACME Corporation',
    fullName: 'ACME Corporation Defense Systems',
    shortName: 'ACME',
    domain: 'acme.com',
    defaultClassification: 'CUI',
    memberCount: 150
  },

  status: 'active',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  version: 1
};
```

#### 1.2.2 Marking Category

```typescript
export const markingCategoryObjectType: ObjectType = {
  slug: 'marking-category',
  app: 'core',
  name: 'Marking Category',
  description: 'Top-level category for data markings (e.g., Sensitive Information)',

  properties: {
    color: {
      type: 'string',
      description: 'Display color (hex code)',
      example: '#ff0000'
    },
    icon: {
      type: 'string',
      description: 'Icon name for UI'
    },
    sortOrder: {
      type: 'number',
      description: 'Display order'
    }
  },

  examples: {
    slug: 'sensitive-information',
    name: 'Sensitive Information',
    color: '#ff6b6b',
    icon: 'ShieldAlert'
  },

  status: 'active',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  version: 1
};
```

#### 1.2.3 Marking

```typescript
export const markingObjectType: ObjectType = {
  slug: 'marking',
  app: 'core',
  name: 'Marking',
  description: 'Specific data marking within a category (e.g., PII, PHI)',

  properties: {
    categoryId: {
      type: 'string',
      required: true,
      description: 'Parent marking category ID'
    },
    abbreviation: {
      type: 'string',
      required: true,
      description: 'Short code (e.g., PII, PHI)'
    },
    color: {
      type: 'string',
      description: 'Override category color'
    },
    icon: {
      type: 'string',
      description: 'Override category icon'
    },

    // Membership
    managerUserIds: {
      type: 'array',
      items: { type: 'string' },
      description: 'Users who can grant this marking'
    },
    memberUserIds: {
      type: 'array',
      items: { type: 'string' },
      description: 'Users who possess this marking'
    },

    // Rules
    propagatesThroughLineage: {
      type: 'boolean',
      description: 'Automatically propagates to derived data',
      default: true
    },
    requiresJustification: {
      type: 'boolean',
      description: 'Require justification when applied',
      default: false
    }
  },

  examples: {
    slug: 'pii',
    name: 'Personally Identifiable Information',
    abbreviation: 'PII',
    categoryId: 'marking-category-sensitive',
    color: '#ff6b6b',
    propagatesThroughLineage: true
  },

  status: 'active',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  version: 1
};
```

#### 1.2.4 Security Policy

```typescript
export const securityPolicyObjectType: ObjectType = {
  slug: 'security-policy',
  app: 'core',
  name: 'Security Policy',
  description: 'ABAC policy for dynamic permission evaluation',

  properties: {
    policyType: {
      type: 'string',
      enum: ['ATTRIBUTE', 'CONTEXTUAL', 'TIME_BASED', 'LOCATION_BASED'],
      required: true
    },
    conditions: {
      type: 'object',
      description: 'Policy conditions (JSON)',
      required: true
    },
    effect: {
      type: 'string',
      enum: ['ALLOW', 'DENY'],
      required: true
    },
    priority: {
      type: 'number',
      description: 'Evaluation priority (higher = first)',
      default: 0
    },
    enabled: {
      type: 'boolean',
      default: true
    }
  },

  examples: {
    slug: 'business-hours-only',
    name: 'Business Hours Access Only',
    policyType: 'TIME_BASED',
    conditions: {
      time: {
        start: '08:00',
        end: '18:00',
        timezone: 'America/New_York',
        daysOfWeek: ['MON', 'TUE', 'WED', 'THU', 'FRI']
      }
    },
    effect: 'DENY',
    priority: 100
  },

  status: 'active',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  version: 1
};
```

---

### 1.3 Add Permission Checks to Operations

**File**: `core/src/services/ontology/operations.ts`

**Changes**: Add permission checking before all CRUD operations:

```typescript
import { checkPermission } from './security';

/**
 * Create Object Instance
 */
export async function createObject(
  objectType: string,
  data: Record<string, any>,
  session: any,
  credentials: any
): Promise<any> {
  // NEW: Check if user has permission to create in this org
  const canCreate = await checkPermission(
    session,
    objectType,
    'create',
    credentials
  );

  if (!canCreate.allowed) {
    throw new Error(`Permission denied: ${canCreate.reason}`);
  }

  // NEW: Auto-populate security metadata
  data.securityMetadata = {
    organizationId: session.user.organizationId,
    ownerId: session.user.id,
    classification: data.securityMetadata?.classification || 'UNCLASSIFIED',
    markings: data.securityMetadata?.markings || [],
    acl: {
      editors: data.securityMetadata?.acl?.editors || [],
      viewers: data.securityMetadata?.acl?.viewers || [],
      public: data.securityMetadata?.acl?.public || false
    },
    accessCount: 0,
    encrypted: false
  };

  // Execute create
  const result = await apiClient.run({
    service: 'platform.dynamodb',
    operation: 'put',
    table: `core-${objectType}`,
    data: { Item: data }
  });

  // NEW: Audit log
  await logAuditEvent({
    action: `ontology.${objectType}.create`,
    entityId: data.id,
    entityType: objectType,
    success: true
  }, session);

  return result;
}

/**
 * Get Object Instance
 */
export async function getObject(
  objectType: string,
  id: string,
  session: any,
  credentials: any
): Promise<any> {
  // Get object
  const result = await apiClient.run({
    service: 'platform.dynamodb',
    operation: 'get',
    table: `core-${objectType}`,
    data: { Key: { id } }
  });

  if (!result.item) {
    throw new Error('Object not found');
  }

  // NEW: Check permission to read
  const canRead = await checkPermission(
    session,
    result.item,
    'read',
    credentials
  );

  if (!canRead.allowed) {
    // Log failed attempt
    await logAuditEvent({
      action: `ontology.${objectType}.get`,
      entityId: id,
      entityType: objectType,
      success: false,
      reason: canRead.reason
    }, session);

    throw new Error(`Permission denied: ${canRead.reason}`);
  }

  // NEW: Update last accessed
  await apiClient.run({
    service: 'platform.dynamodb',
    operation: 'update',
    table: `core-${objectType}`,
    data: {
      Key: { id },
      UpdateExpression: 'SET securityMetadata.lastAccessedAt = :now, securityMetadata.lastAccessedBy = :userId, securityMetadata.accessCount = securityMetadata.accessCount + :inc',
      ExpressionAttributeValues: {
        ':now': new Date().toISOString(),
        ':userId': session.user.id,
        ':inc': 1
      }
    }
  });

  // NEW: Audit log
  await logAuditEvent({
    action: `ontology.${objectType}.get`,
    entityId: id,
    entityType: objectType,
    success: true
  }, session);

  return result.item;
}

// Similar changes for updateObject, deleteObject, queryObjects, etc.
```

---

### 1.4 Create Security Service

**File**: `core/src/services/ontology/security.ts` (new file)

```typescript
import { apiClient } from '@captify-io/core/lib/api';

/**
 * Check if user has permission to perform operation on object
 */
export async function checkPermission(
  session: any,
  objectOrType: any,
  operation: 'create' | 'read' | 'update' | 'delete',
  credentials: any
): Promise<{ allowed: boolean; reason?: string }> {

  // For create operations, object is just the type string
  if (operation === 'create') {
    // Check if user can create in their org
    return { allowed: true }; // Basic check - can extend later
  }

  // For other operations, object is the full object with securityMetadata
  const security = objectOrType.securityMetadata;

  if (!security) {
    // No security metadata - legacy object, allow for now
    return { allowed: true };
  }

  // 1. Organization Check
  if (session.user.organizationId !== security.organizationId) {
    return {
      allowed: false,
      reason: 'Access denied: different organization'
    };
  }

  // 2. Clearance Check
  const userClearance = session.user.clearanceLevel || 'UNCLASSIFIED';
  const requiredClearance = security.classification;

  const clearanceOrder = {
    'UNCLASSIFIED': 0,
    'CUI': 1,
    'SECRET': 2,
    'TOP_SECRET': 3
  };

  if (clearanceOrder[userClearance] < clearanceOrder[requiredClearance]) {
    return {
      allowed: false,
      reason: `Access denied: ${requiredClearance} clearance required`
    };
  }

  // 3. Marking Check (must have ALL markings)
  const userMarkings = session.user.markings || [];
  for (const marking of security.markings || []) {
    if (!userMarkings.includes(marking)) {
      return {
        allowed: false,
        reason: `Access denied: ${marking} marking required`
      };
    }
  }

  // 4. ACL Check
  const isOwner = security.ownerId === session.user.id;
  const isEditor = security.acl.editors?.includes(session.user.id);
  const isViewer = security.acl.viewers?.includes(session.user.id);
  const isPublic = security.acl.public;
  const isAdmin = session.isAdmin || session.groups?.includes('captify-admins');

  if (operation === 'delete') {
    if (!isOwner && !isAdmin) {
      return { allowed: false, reason: 'Only owner can delete' };
    }
  } else if (operation === 'update') {
    if (!isOwner && !isEditor && !isAdmin) {
      return { allowed: false, reason: 'Edit permission required' };
    }
  } else if (operation === 'read') {
    if (!isOwner && !isEditor && !isViewer && !isPublic && !isAdmin) {
      return { allowed: false, reason: 'View permission required' };
    }
  }

  // All checks passed
  return { allowed: true };
}

/**
 * Propagate markings through ontology edges
 */
export async function propagateMarkings(
  sourceObjectId: string,
  credentials: any
): Promise<void> {
  // Get source object
  const source = await apiClient.run({
    service: 'platform.dynamodb',
    operation: 'get',
    table: 'core-object',
    data: { Key: { id: sourceObjectId } }
  });

  if (!source.item?.securityMetadata?.markings) {
    return; // No markings to propagate
  }

  // Find all derived objects (via ontology edges)
  const edges = await apiClient.run({
    service: 'platform.dynamodb',
    operation: 'query',
    table: 'core-ontology-edge',
    data: {
      IndexName: 'source-index',
      KeyConditionExpression: 'source = :sourceId',
      ExpressionAttributeValues: {
        ':sourceId': sourceObjectId
      }
    }
  });

  // Propagate to each derived object
  for (const edge of edges.items || []) {
    const targetId = edge.target;

    // Get target object
    const target = await apiClient.run({
      service: 'platform.dynamodb',
      operation: 'get',
      table: 'core-object',
      data: { Key: { id: targetId } }
    });

    if (!target.item) continue;

    // Add inherited markings
    const inheritedMarkings = source.item.securityMetadata.markings.map((marking: string) => ({
      marking,
      source: sourceObjectId,
      path: [sourceObjectId, targetId]
    }));

    // Update target with inherited markings
    await apiClient.run({
      service: 'platform.dynamodb',
      operation: 'update',
      table: 'core-object',
      data: {
        Key: { id: targetId },
        UpdateExpression: 'SET securityMetadata.inheritedMarkings = list_append(if_not_exists(securityMetadata.inheritedMarkings, :empty), :newMarkings)',
        ExpressionAttributeValues: {
          ':empty': [],
          ':newMarkings': inheritedMarkings
        }
      }
    });

    // Recursively propagate
    await propagateMarkings(targetId, credentials);
  }
}
```

---

## Phase 2: Control Panel UI

### 2.1 Control Panel Workshop Structure

**Create**: `platform/src/workshops/foundry/control-panel/`

```
control-panel/
├── readme.md                      # Control panel vision
├── status.md                      # Implementation progress
├── plan/
│   └── implementation-roadmap.md
├── features/
│   ├── 01-organizations.md        # Org CRUD + user assignment
│   ├── 02-markings.md             # Marking categories + markings
│   ├── 03-clearances.md           # User clearance management
│   ├── 04-acl-editor.md           # Visual ACL editor
│   ├── 05-security-dashboard.md   # Security overview
│   ├── 06-audit-logs.md           # Audit log viewer
│   └── 07-compliance.md           # NIST compliance dashboard
└── user-stories/
    ├── 01-organizations.yaml
    ├── 02-markings.yaml
    └── ...
```

---

### 2.2 Control Panel Features

#### Feature #1: Organization Management

**UI Location**: `/control-panel/security/organizations`

**Components**:
- Organization list (DataTable)
- Create organization dialog
- Organization details panel
- Member management (add/remove users)
- Settings (default classification, cross-org sharing)

**API Calls**:
```typescript
// List organizations
core.organization.query({ status: 'active' })

// Create organization
core.organization.create({
  name: 'ACME Corporation',
  slug: 'org-acme',
  fullName: 'ACME Corporation Defense Systems',
  shortName: 'ACME',
  domain: 'acme.com'
})

// Update organization
core.organization.update({
  id: 'org-123',
  settings: { defaultClassification: 'CUI' }
})

// Assign user to organization (via Cognito)
cognito.updateUserAttributes({
  userId: 'user-456',
  attributes: { organizationId: 'org-123' }
})
```

---

#### Feature #2: Marking Management

**UI Location**: `/control-panel/security/markings`

**Components**:
- Marking category list
- Marking list (grouped by category)
- Create marking category dialog
- Create marking dialog
- Marking details panel (members, managers, rules)

**API Calls**:
```typescript
// List marking categories
core.marking-category.query({ status: 'active' })

// Create marking
core.marking.create({
  name: 'Personally Identifiable Information',
  slug: 'pii',
  abbreviation: 'PII',
  categoryId: 'marking-cat-sensitive',
  propagatesThroughLineage: true
})

// Add user to marking
core.marking.update({
  id: 'marking-pii',
  memberUserIds: [...existing, 'user-789']
})
```

---

#### Feature #3: Clearance Management

**UI Location**: `/control-panel/security/clearances`

**Components**:
- User list with clearance levels
- Assign clearance dialog
- Compartment assignment
- Clearance expiration tracking

**API Calls**:
```typescript
// Update user clearance (via Cognito)
cognito.updateUserAttributes({
  userId: 'user-123',
  attributes: {
    clearanceLevel: 'SECRET',
    sciCompartments: 'SCI-TK,SI',
    clearanceExpiration: '2026-12-31'
  }
})
```

---

#### Feature #4: ACL Editor

**UI Location**: Component used in any object detail panel

**Components**:
- Visual ACL editor (drag-drop users to roles)
- Owner display (cannot change)
- Editor list (add/remove users)
- Viewer list (add/remove users)
- Public toggle

**API Calls**:
```typescript
// Update ACL on any object
core.{objectType}.update({
  id: 'object-123',
  securityMetadata: {
    acl: {
      editors: ['user-456', 'user-789'],
      viewers: ['user-101', 'user-202'],
      public: false
    }
  }
})
```

---

#### Feature #5: Security Dashboard

**UI Location**: `/control-panel/security/dashboard`

**Widgets**:
- Total organizations
- Total users by clearance level
- Active markings
- Recent security events
- Failed access attempts (last 24h)
- Top accessed objects
- Security policy status

---

#### Feature #6: Audit Log Viewer

**UI Location**: `/control-panel/security/audit-logs`

**Components**:
- Audit log table (paginated, filterable)
- Filters: user, action, entity, success/failure, date range
- Export to CSV
- Event details dialog

**API Calls**:
```typescript
// Query audit logs
core.audit-log.query({
  IndexName: 'userId-timestamp-index',
  userId: 'user-123',
  dateRange: ['2025-01-01', '2025-01-31']
})
```

---

#### Feature #7: Compliance Dashboard

**UI Location**: `/control-panel/security/compliance`

**Components**:
- NIST 800-53 control status
- Security Hub score (from AWS)
- Evidence collection status
- POA&M list
- Compliance reports

---

## File Structure Summary

```
core/src/services/ontology/
├── types.ts                       # UPDATED: Add securityMetadata to SharedProperties
├── operations.ts                  # UPDATED: Add permission checks to all operations
├── security.ts                    # NEW: checkPermission, propagateMarkings
└── object-types/
    └── security.ts                # NEW: organization, marking, marking-category, security-policy

platform/src/workshops/foundry/
├── security/                      # ALREADY CREATED
│   ├── readme.md
│   ├── status.md
│   ├── AWS-IMPLEMENTATION-GUIDE.md
│   ├── EXECUTIVE-SUMMARY.md
│   └── INTEGRATION-PLAN.md       # THIS FILE
└── control-panel/                 # TO CREATE
    ├── readme.md                  # Control panel vision
    ├── status.md
    ├── features/
    │   ├── 01-organizations.md
    │   ├── 02-markings.md
    │   ├── 03-clearances.md
    │   ├── 04-acl-editor.md
    │   ├── 05-security-dashboard.md
    │   ├── 06-audit-logs.md
    │   └── 07-compliance.md
    └── user-stories/
        └── ...

platform/src/app/control-panel/    # TO CREATE (Next.js app)
├── layout.tsx
├── page.tsx                       # Control panel home
└── security/
    ├── organizations/
    │   └── page.tsx
    ├── markings/
    │   └── page.tsx
    ├── clearances/
    │   └── page.tsx
    ├── audit-logs/
    │   └── page.tsx
    └── compliance/
        └── page.tsx
```

---

## Implementation Order

### Week 1: Ontology Extensions
1. ✅ Update `SharedProperties` with `securityMetadata`
2. ✅ Create security object types (organization, marking, etc.)
3. ✅ Add permission checks to `operations.ts`
4. ✅ Create `security.ts` service
5. ✅ Test with API calls

### Week 2: Control Panel Workshop
1. ✅ Create control panel workshop structure
2. ✅ Write feature specifications
3. ✅ Create user stories
4. ✅ Plan implementation roadmap

### Week 3-4: Control Panel UI
1. ✅ Build organization management UI
2. ✅ Build marking management UI
3. ✅ Build clearance management UI
4. ✅ Build ACL editor component
5. ✅ Test end-to-end workflows

### Week 5-6: Advanced Features
1. ✅ Security dashboard
2. ✅ Audit log viewer
3. ✅ Compliance dashboard
4. ✅ Integration with AWS Security Hub

---

## Key Integration Points

1. **Every Object Has Security**: Via `SharedProperties.securityMetadata`
2. **Permission Checks in Ontology Service**: `operations.ts` checks before CRUD
3. **Control Panel Manages Security**: UI for orgs, markings, clearances, ACLs
4. **Audit Logs Everywhere**: Every operation logged automatically
5. **AWS Cognito Integration**: User attributes store clearances and markings

---

## Next Steps

1. **Review this plan** with team
2. **Start Week 1**: Update ontology service
3. **Test with API calls**: Verify permission checks work
4. **Start Week 2**: Create control panel workshop docs
5. **Build UI**: Follow workshop feature specifications

---

**Created**: 2025-11-09
**Status**: Integration Plan
**Next Review**: After Week 1 implementation
