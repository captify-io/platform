# Security Management - AWS-Native, Ontology-Integrated

**Philosophy:** AWS enforces security, application provides UI.

## Overview

Security management is **fully integrated into the ontology system** at `/ontology`. All security entities (users, organizations, markings) are ontology object types. Security is enforced at the **AWS IAM layer** using Cognito attributes and ABAC policies, not in application code.

**Key Principle:** We don't duplicate AWS security in application code. We leverage AWS native security primitives and provide user-friendly management interfaces.

## Architecture: Three Security Layers

### Layer 1: AWS IAM (Enforcement)

**Identity Pool authenticated role policies** with attribute-based access control (ABAC):

- **Organization Isolation**: `"StringEquals": {"dynamodb:LeadingKeys": ["${cognito-identity.amazonaws.com:sub}"]}`
- **Classification Enforcement**: IAM conditions on object tags filter by user's clearance level
- **Marking Enforcement**: IAM conditions ensure user has required markings
- **Result**: AWS automatically denies unauthorized access before data is returned

**Example IAM Policy:**
```json
{
  "Effect": "Allow",
  "Action": ["dynamodb:GetItem", "dynamodb:Query", "dynamodb:Scan"],
  "Resource": "arn:aws:dynamodb:*:*:table/captify-*",
  "Condition": {
    "StringEquals": {
      "dynamodb:Attributes": ["organizationId"],
      "s3:ExistingObjectTag/organizationId": "${aws:PrincipalTag/custom:organizationId}"
    }
  }
}
```

### Layer 2: Cognito User Pool (Identity)

**Source of truth for user security attributes:**

| Attribute | Purpose | Used By |
|-----------|---------|---------|
| `custom:organizationId` | Multi-tenant isolation | IAM policies, DynamoDB conditions |
| `custom:clearanceLevel` | Classification access | IAM policies, UI visibility |
| `custom:markings` | Data marking access | UI visibility, query filters |
| `custom:sciCompartments` | Compartmented access | UI visibility, query filters |
| `custom:needToKnow` | Explicit ACL required | UI visibility |
| `custom:employeeId` | Audit trail correlation | CloudTrail queries |

**Management:** Update via `aws cognito-idp admin-update-user-attributes`

### Layer 3: CloudTrail (Audit)

**Comprehensive, tamper-proof audit logging:**

- Every AWS API call is logged (GetItem, PutItem, UpdateItem, DeleteItem, Query, Scan)
- Includes user identity, Cognito attributes, resource accessed, result (allowed/denied)
- Queryable via CloudTrail Lookup Events API
- No custom audit logging needed in application code

**Example CloudTrail Event:**
```json
{
  "eventName": "GetItem",
  "userIdentity": {
    "userName": "mike.johnson@anautics.com",
    "userAttributes": {
      "custom:organizationId": "org-captify",
      "custom:clearanceLevel": "TOP_SECRET"
    }
  },
  "requestParameters": {
    "tableName": "captify-pmbook-contract",
    "key": {"id": "contract-2024-001"}
  },
  "errorCode": "AccessDeniedException"
}
```

## Navigation Structure

Security is managed through the **ontology interface** at `/ontology`:

```
/ontology
├── Users (core.user)           - User management with security attributes
├── Organizations (core.organization) - Multi-tenant boundaries
├── Markings (core.marking)     - Data marking definitions
├── Activity                    - CloudTrail event viewer (audit log)
└── Compliance                  - NIST 800-53 Rev 5 control tracking
```

**No separate security module** - security entities are first-class ontology objects.

## What We Manage in the UI

The ontology control panel provides user-friendly interfaces for managing AWS security primitives:

### 1. User Security Attributes (Cognito)

**Route:** `/ontology/users`

**Purpose:** Manage Cognito user pool custom attributes through ontology interface

**Key Features:**
- User list with security attributes (clearance, markings, organization)
- Edit form for security attributes
- Bulk updates (assign clearances, add markings)
- Sync from Cognito (one-way sync to DynamoDB)
- View effective permissions (UI-only preview)

**Backend Actions:**
1. Update DynamoDB `captify-core-user` table
2. Update Cognito via `admin-update-user-attributes`
3. CloudTrail automatically logs the Cognito API call

**See:** [user-management.md](user-management.md) for complete specification

### 2. Organization Management

**Route:** `/ontology/organizations`

**Purpose:** Manage multi-tenant organizational boundaries as ontology objects

**Ontology Object Type:** `core.organization`

**Key Features:**
- Organization list (name, type, user count, object count)
- Create/edit organization
- View users in organization
- View objects owned by organization
- Bulk transfer objects between organizations
- Bulk reassign users between organizations

**Properties:**
```typescript
{
  app: "core",
  slug: "organization",
  dataSource: "core-organization",
  properties: {
    name: { type: "string", required: true },
    type: { type: "string", enum: ["Government", "Contractor", "Partner"] },
    parentOrgId: { type: "string" },
    securityOfficerEmail: { type: "string" },
    defaultClassification: { type: "string", enum: ["UNCLASSIFIED", "CUI", "SECRET", "TOP_SECRET"] }
  }
}
```

**IAM Integration:**
- User's `custom:organizationId` must match object's `securityMetadata.organizationId`
- IAM policy enforces this automatically via ABAC conditions

### 3. Data Marking Definitions

**Route:** `/ontology/markings`

**Purpose:** Define data marking types as ontology objects

**Ontology Object Type:** `core.marking`

**Key Features:**
- Marking list (code, name, category, user/object counts)
- Create/edit marking definitions
- View users authorized for marking
- View objects with marking
- Define training requirements

**Properties:**
```typescript
{
  app: "core",
  slug: "marking",
  dataSource: "core-marking",
  properties: {
    code: { type: "string", required: true },  // "PII", "PHI", "FIN", etc.
    name: { type: "string", required: true },
    category: { type: "string", enum: ["data-protection", "law-enforcement", "national-security"] },
    description: { type: "string" },
    requiresTraining: { type: "boolean" },
    trainingUrl: { type: "string" }
  }
}
```

**Standard Markings:**
- **Data Protection**: PII, PHI, FIN
- **Law Enforcement**: LEO, FOUO
- **National Security**: NOFORN, SCI

**IAM Integration:**
- User's `custom:markings` must include all markings on object
- UI filters objects based on user's authorized markings

### 4. Activity Viewer (CloudTrail)

**Route:** `/ontology/activity`

**Purpose:** Query CloudTrail for security events (no custom audit logging)

**Data Source:** AWS CloudTrail Lookup Events API

**Key Features:**
- Filter by date range, user, resource type, event type
- View allowed and denied access attempts
- Export to CSV/JSON
- Real-time streaming (WebSocket to CloudTrail)

**CloudTrail Events Include:**
- DynamoDB: GetItem, PutItem, UpdateItem, DeleteItem, Query, Scan
- S3: GetObject, PutObject, DeleteObject
- Cognito: AdminUpdateUserAttributes
- All events include user identity with security attributes

**Example Query:**
```typescript
// Query CloudTrail via AWS SDK
const events = await cloudtrail.lookupEvents({
  LookupAttributes: [
    {
      AttributeKey: 'ResourceType',
      AttributeValue: 'AWS::DynamoDB::Table'
    }
  ],
  StartTime: startDate,
  EndTime: endDate
});
```

**Benefits:**
- Complete audit trail with no custom logging code
- Tamper-proof (CloudTrail is immutable)
- Includes Cognito attribute context
- Queryable for compliance reports

### 5. Compliance Tracking (NIST 800-53 Rev 5)

**Route:** `/ontology/compliance`

**Purpose:** Track IL5 NIST 800-53 Rev 5 compliance status

**Key Features:**
- Control family overview (AC, AU, SC, etc.)
- Control implementation status
- Evidence links (code, documentation, CloudTrail queries)
- Compliance reports (PDF export)

**Implementation Status:**
- ✅ **Implemented** - Control fully implemented
- ⚠️ **Partial** - Control partially implemented
- ❌ **Not Implemented** - Control not yet implemented
- ➖ **Not Applicable** - Control doesn't apply

**Example Controls:**
- **AC-3 (Access Enforcement)**: Implemented via IAM ABAC policies
- **AU-2 (Audit Events)**: Implemented via CloudTrail
- **SC-7 (Boundary Protection)**: Implemented via organizationId enforcement

**Benefits:**
- Maps AWS-native security to NIST controls
- Evidence is code + CloudTrail logs (not documents)
- Compliance verification via actual system behavior

## What We DON'T Do

❌ **Don't** check permissions in application code before AWS calls
❌ **Don't** write custom audit logging (CloudTrail does it)
❌ **Don't** filter data in application code (IAM policies do it)
❌ **Don't** create separate security management UI (use ontology)
❌ **Don't** duplicate AWS security primitives

## What We DO

✅ **Do** use `checkPermission()` for UI visibility (show/hide buttons)
✅ **Do** provide user-friendly forms for Cognito attribute management
✅ **Do** visualize effective permissions in UI
✅ **Do** query CloudTrail for activity/audit views
✅ **Do** integrate security as ontology object types
✅ **Do** leverage AWS native security

## Implementation Checklist

### ✅ Completed

1. Cognito custom attributes added (6 attributes)
2. JWT/session callbacks extract security attributes
3. Security service created (for UI checks only)
4. SecurityMetadata added to SharedProperties
5. Ontology integration designed
6. Security attributes working in production sessions

### 🔜 Next Steps

1. **Configure IAM Policies** - Add ABAC policies to Identity Pool authenticated role
2. **Create Ontology Object Types** - Define `core.user`, `core.organization`, `core.marking`
3. **Build Management UI** - Ontology-integrated user/org/marking management at `/ontology`
4. **CloudTrail Integration** - Query CloudTrail for activity/audit views
5. **UI Permission Checks** - Use `checkPermission()` for button visibility (not enforcement)

## API Routes (All via Ontology)

All security management uses standard ontology operations:

```typescript
// List users (respects IAM permissions)
GET /api/captify
{
  service: "platform.ontology",
  operation: "listItems",
  objectType: "core.user",
  data: { filters: { status: "active" } }
}

// Update user security attributes
POST /api/captify
{
  service: "platform.ontology",
  operation: "updateItem",
  objectType: "core.user",
  data: {
    id: "user-id",
    updates: {
      clearanceLevel: "TOP_SECRET",
      markings: ["PII", "PHI", "FIN"]
    }
  }
}
```

Backend automatically:
1. Updates DynamoDB
2. Updates Cognito user attributes
3. CloudTrail logs the event (automatic)

## Benefits of AWS-Native Approach

1. **Security by Design** - AWS IAM is battle-tested, compliant, audited
2. **Zero Trust** - Application code can't bypass IAM policies
3. **Audit Trail** - CloudTrail provides complete, tamper-proof logs
4. **Scalability** - IAM evaluates billions of requests per day
5. **Compliance** - NIST 800-53, FedRAMP, DoD IL5 built into AWS
6. **Less Code** - No custom security enforcement to maintain
7. **Performance** - AWS evaluates policies in microseconds
8. **Cost** - CloudTrail included, no custom logging infrastructure

## Summary

**Philosophy:** AWS is the security layer, application is the UI layer.

- **Enforcement:** AWS IAM (not application code)
- **Audit:** CloudTrail (not custom logging)
- **Management:** Ontology UI (not separate security module)
- **Identity:** Cognito User Pool (source of truth)

This approach is simpler, more secure, more compliant, and easier to maintain than building custom security enforcement in the application.
