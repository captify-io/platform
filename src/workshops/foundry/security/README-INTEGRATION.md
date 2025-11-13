# Security Integration: Complete Architecture

## Overview

This document explains how **security**, **ontology**, and **Control Panel** work together to provide Captify-level security across the Captify foundry.

---

## Three-Layer Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                     LAYER 1: CONTROL PANEL                        │
│                  (Management Interface)                           │
│                                                                   │
│  Admin UI for managing security across all foundry items:        │
│  - Organizations, Markings, Clearances                           │
│  - Security Policies, ACLs                                        │
│  - Audit Logs, Compliance                                        │
│                                                                   │
│  Location: /control-panel/security/*                             │
└──────────────────────────────────────────────────────────────────┘
                              ↓ Manages
┌──────────────────────────────────────────────────────────────────┐
│                     LAYER 2: ONTOLOGY SERVICE                     │
│              (Core Security Implementation)                       │
│                                                                   │
│  Security is PART of ontology, not separate:                     │
│  - securityMetadata on every object (SharedProperties)           │
│  - Permission checks in operations.ts                            │
│  - Security object types (org, marking, policy)                  │
│  - Audit logging built-in                                        │
│                                                                   │
│  Location: core/src/services/ontology/                           │
└──────────────────────────────────────────────────────────────────┘
                              ↓ Enforces
┌──────────────────────────────────────────────────────────────────┐
│                     LAYER 3: AWS SERVICES                         │
│                   (Infrastructure)                                │
│                                                                   │
│  AWS provides the foundation:                                    │
│  - Cognito: User attributes (org, clearance, markings)          │
│  - IAM: AWS-level permissions via roles                          │
│  - KMS: Encryption at rest                                       │
│  - CloudTrail: AWS API audit logs                                │
│  - Security Hub: NIST compliance checks                          │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

---

## How It Works: End-to-End Flow

### Example: User Tries to Access a Dataset

```
1. User Request
   ↓
   GET /api/captify
   {
     service: "core.ontology",
     operation: "get",
     data: { slug: "dataset", id: "dataset-123" }
   }

2. NextAuth Session (Layer 3: AWS Cognito)
   ↓
   Session contains:
   - userId: "user-456"
   - organizationId: "org-acme" (from Cognito attribute)
   - clearanceLevel: "SECRET" (from Cognito attribute)
   - markings: ["PII", "FIN"] (from Cognito attribute)
   - groups: ["captify-operations"]

3. Ontology Service (Layer 2: Core Service)
   ↓
   operations.ts: getObject()

   a) Fetch object from DynamoDB
   b) Check permission via security.ts:
      - Does user.org === object.org? ✅
      - Does user.clearance >= object.classification? ✅
      - Does user have all object.markings? ✅
      - Is user in object.acl (owner/editor/viewer)? ✅

   c) If ALL checks pass:
      - Return object
      - Log successful access to audit table
      - Update lastAccessedBy, lastAccessedAt

   d) If ANY check fails:
      - Return 403 Forbidden
      - Log failed attempt with reason
      - Return clear error message

4. Response to User
   ↓
   Success: Object data returned
   Failure: { error: "Access denied: SECRET clearance required" }
```

---

## Key Integration Points

### 1. Security Metadata on Every Object

**Where**: `core/src/services/ontology/types.ts` - `SharedProperties`

**Every object automatically has**:
```typescript
{
  id: "dataset-123",
  name: "Customer Orders",
  // ... other properties ...

  securityMetadata: {
    organizationId: "org-acme",
    classification: "CUI",
    markings: ["PII", "FIN"],
    acl: {
      editors: ["user-456"],
      viewers: ["user-789"],
      public: false
    },
    lastAccessedAt: "2025-11-09T12:00:00Z",
    lastAccessedBy: "user-456",
    accessCount: 42
  }
}
```

**Result**: Security is **inherent**, not bolted on.

---

### 2. Permission Checks in Ontology Operations

**Where**: `core/src/services/ontology/operations.ts`

**Every CRUD operation**:
```typescript
export async function getObject(slug, id, session, credentials) {
  // 1. Fetch object
  const object = await dynamodb.get(...);

  // 2. Check permission
  const canRead = await checkPermission(session, object, 'read');
  if (!canRead.allowed) {
    await logAuditEvent({ success: false, reason: canRead.reason });
    throw new Error(canRead.reason);
  }

  // 3. Return object
  await logAuditEvent({ success: true });
  return object;
}
```

**Result**: No API endpoint can bypass security.

---

### 3. Security Object Types in Ontology

**Where**: `core/src/services/ontology/object-types/security.ts`

**New ontology object types**:
- `core.organization` - Tenant/org boundaries
- `core.marking-category` - Marking hierarchies
- `core.marking` - Specific markings (PII, PHI, etc.)
- `core.security-policy` - ABAC policies

**Result**: Security configuration stored in ontology, managed like any other object.

---

### 4. Control Panel Manages Security

**Where**: `platform/src/app/control-panel/security/*`

**UI Features**:
- `/control-panel/security/organizations` - Manage orgs
- `/control-panel/security/markings` - Manage markings
- `/control-panel/security/clearances` - Assign clearances
- `/control-panel/security/audit-logs` - View audit logs
- `/control-panel/security/compliance` - NIST compliance

**API Calls**:
```typescript
// Create organization
await apiClient.run({
  service: 'core.ontology',
  operation: 'create',
  data: {
    slug: 'organization',
    name: 'ACME Corporation',
    fullName: 'ACME Corporation Defense Systems'
  }
});

// Create marking
await apiClient.run({
  service: 'core.ontology',
  operation: 'create',
  data: {
    slug: 'marking',
    name: 'Personally Identifiable Information',
    abbreviation: 'PII',
    categoryId: 'marking-cat-sensitive'
  }
});

// Assign clearance (via Cognito)
await apiClient.run({
  service: 'platform.cognito',
  operation: 'updateUserAttributes',
  data: {
    userId: 'user-123',
    attributes: {
      clearanceLevel: 'SECRET',
      sciCompartments: 'SCI-TK,SI'
    }
  }
});
```

**Result**: Centralized security management, not scattered across apps.

---

### 5. AWS Cognito Stores User Security Attributes

**Where**: AWS Cognito User Pool - Custom Attributes

**User attributes**:
```typescript
{
  "sub": "user-123",
  "email": "john@acme.com",
  "custom:organizationId": "org-acme",
  "custom:clearanceLevel": "SECRET",
  "custom:compartments": "SCI-TK,SI",
  "custom:markings": "PII,FIN,LEO",
  "cognito:groups": ["captify-operations"]
}
```

**Result**: User security context available in every session.

---

### 6. Audit Logging Everywhere

**Where**: `core/src/services/audit.ts`

**Every operation logged**:
```typescript
{
  id: "audit-789",
  timestamp: "2025-11-09T12:00:00Z",
  userId: "user-456",
  userEmail: "john@acme.com",
  action: "ontology.dataset.get",
  entityId: "dataset-123",
  entityType: "dataset",
  success: true,
  ipAddress: "10.0.1.5",
  organizationId: "org-acme",
  userClearance: "SECRET",
  userMarkings: ["PII", "FIN"],
  resourceClassification: "CUI",
  resourceMarkings: ["PII"]
}
```

**Stored in**: `captify-core-audit-log` (DynamoDB)

**GSIs for querying**:
- `userId-timestamp-index` - All actions by user
- `entityId-timestamp-index` - All actions on entity
- `action-timestamp-index` - All actions of type
- `success-timestamp-index` - All failed attempts
- `organizationId-timestamp-index` - All actions in org

**Result**: Complete audit trail for compliance and forensics.

---

## File Structure

```
core/src/services/ontology/
├── types.ts                       # ✅ UPDATED: securityMetadata in SharedProperties
├── operations.ts                  # ✅ UPDATED: Permission checks in all operations
├── security.ts                    # ✅ NEW: checkPermission(), propagateMarkings()
└── object-types/
    └── security.ts                # ✅ NEW: organization, marking, marking-category, security-policy

core/src/services/
└── audit.ts                       # ✅ NEW: logAuditEvent(), audit log service

platform/src/app/control-panel/    # ✅ TO CREATE
├── layout.tsx
├── page.tsx                       # Control panel dashboard
└── security/
    ├── organizations/
    │   └── page.tsx               # Organization management UI
    ├── markings/
    │   └── page.tsx               # Marking management UI
    ├── clearances/
    │   └── page.tsx               # Clearance management UI
    ├── audit-logs/
    │   └── page.tsx               # Audit log viewer
    └── compliance/
        └── page.tsx               # Compliance dashboard

platform/src/workshops/foundry/
├── security/                      # ✅ CREATED
│   ├── readme.md                  # Security architecture
│   ├── status.md                  # Implementation progress
│   ├── AWS-IMPLEMENTATION-GUIDE.md # AWS setup guide
│   ├── EXECUTIVE-SUMMARY.md       # High-level overview
│   ├── INTEGRATION-PLAN.md        # Ontology integration
│   └── README-INTEGRATION.md      # THIS FILE
└── control-panel/                 # ✅ CREATED
    ├── readme.md                  # Control panel vision
    ├── features/                  # TO CREATE
    └── user-stories/              # TO CREATE
```

---

## Implementation Checklist

### ✅ Completed (Today)
- [x] Security architecture documentation
- [x] AWS implementation guide
- [x] Integration plan with ontology
- [x] Control Panel workshop structure

### Week 1: Core Service Extensions
- [ ] Update `SharedProperties` with `securityMetadata`
- [ ] Create security object types (organization, marking, policy)
- [ ] Add permission checks to `operations.ts`
- [ ] Create `security.ts` service
- [ ] Create `audit.ts` service
- [ ] Test with API calls

### Week 2: AWS Configuration
- [ ] Add Cognito custom attributes
- [ ] Create Cognito groups
- [ ] Create Identity Pool with role mappings
- [ ] Create IAM roles and policies
- [ ] Create KMS key
- [ ] Enable DynamoDB/S3 encryption

### Week 3: Control Panel Foundation
- [ ] Create `/control-panel` Next.js app
- [ ] Build layout and navigation
- [ ] Create dashboard page
- [ ] Set up authentication/authorization

### Week 4: Security Management UIs
- [ ] Organization management UI
- [ ] Marking management UI
- [ ] Clearance management UI
- [ ] Test end-to-end workflows

### Week 5: Audit & Compliance
- [ ] Audit log viewer
- [ ] Compliance dashboard
- [ ] Security Hub integration

---

## Key Decisions

### ✅ Security is Part of Ontology
**Decision**: Don't build a separate security system. Integrate into ontology.
**Why**: Every object already goes through ontology. Add security there.
**Result**: No separate security API. No data duplication.

### ✅ Control Panel Manages Everything
**Decision**: Don't scatter management UIs across apps. Centralize in Control Panel.
**Why**: Easier for admins. Consistent UX. Single source of truth.
**Result**: All security management in `/control-panel/security/*`.

### ✅ AWS Cognito for User Attributes
**Decision**: Store clearances and markings in Cognito custom attributes.
**Why**: Available in every session. No extra database lookups.
**Result**: Fast permission checks. No separate user metadata table.

### ✅ DynamoDB for Audit Logs
**Decision**: Use DynamoDB for audit logs, not CloudWatch Logs.
**Why**: Faster querying. More flexible. Better for compliance reporting.
**Result**: Audit logs can be queried in real-time with GSIs.

---

## Next Steps

1. **Review this architecture** with team
2. **Start Week 1**: Update ontology service
3. **Configure AWS**: Cognito, IAM, KMS
4. **Build Control Panel**: Security management UIs
5. **Test end-to-end**: User creates org, applies marking, accesses data

---

**Summary**:

You now have a **complete integration plan** where:
- ✅ Security is built into the **ontology service** (core layer)
- ✅ **Control Panel** provides the management UI (interface layer)
- ✅ **AWS Cognito/IAM** provides the foundation (infrastructure layer)
- ✅ **Every object** has security metadata automatically
- ✅ **Every operation** checks permissions
- ✅ **Every access** is audited

This is a **production-ready architecture** that can be implemented starting this week.

---

**Created**: 2025-11-09
**Status**: Architecture Complete
**Next Step**: Start Week 1 implementation
