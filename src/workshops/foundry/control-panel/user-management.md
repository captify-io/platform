# User Management - Ontology Control Panel

**Location:** `/ontology/users` (integrated into ontology management, not standalone)

## Overview

User management is integrated into the ontology system as a core entity type. Users are ontology objects with security attributes that control their access to other ontology objects via AWS IAM policies.

## Architecture: AWS-Native Security

### Security Enforcement Layers

1. **AWS IAM Policies** (Enforcement) - Identity Pool roles with attribute-based conditions
2. **Cognito User Attributes** (Identity) - User clearances, markings, organization
3. **CloudTrail** (Audit) - Comprehensive logging of all AWS API calls
4. **Application UI** (UX) - Show/hide features based on user context (not enforcement)

**Key Principle:** Security is enforced at the AWS layer, not in application code. Application only provides user-friendly interfaces for AWS security primitives.

## User Security Attributes (Cognito Custom Attributes)

Every user has these attributes in Cognito User Pool:

| Attribute | Type | Purpose | Example |
|-----------|------|---------|---------|
| `custom:organizationId` | String | Multi-tenant boundary | `org-captify`, `org-contractor-acme` |
| `custom:clearanceLevel` | String | Classification access level | `UNCLASSIFIED`, `CUI`, `SECRET`, `TOP_SECRET` |
| `custom:markings` | String | Authorized data markings (comma-separated) | `PII,PHI,FIN` |
| `custom:sciCompartments` | String | SCI compartment codes (comma-separated) | `SCI-A,SCI-PROJECT-X` |
| `custom:needToKnow` | String | Require explicit ACL entries | `true`, `false` |
| `custom:employeeId` | String | Employee/contractor ID | `EMP-001` |

## User as Ontology Object Type

Users are defined in the ontology as object type `core.user`:

```typescript
{
  app: "core",
  slug: "user",
  name: "User",
  category: "identity",

  // User instances stored in DynamoDB
  dataSource: "captify-core-user",

  // Properties from Cognito + custom fields
  properties: {
    // From Cognito
    cognitoUsername: { type: "string", readOnly: true },
    email: { type: "string", required: true },
    name: { type: "string", required: true },

    // Security attributes (synced from Cognito)
    organizationId: { type: "string", required: true },
    clearanceLevel: { type: "string", enum: ["UNCLASSIFIED", "CUI", "SECRET", "TOP_SECRET"] },
    markings: { type: "array", items: { type: "string" } },
    sciCompartments: { type: "array", items: { type: "string" } },
    needToKnow: { type: "boolean" },
    employeeId: { type: "string" },

    // Application metadata
    status: { type: "string", enum: ["active", "suspended", "inactive"] },
    lastLogin: { type: "string", format: "date-time" },
    preferences: { type: "object" }
  }
}
```

## User Management UI

### Route: `/ontology/users`

Standard ontology object management interface with security-specific features.

### User List Table

Uses standard ontology table component with custom columns:

| Column | Display | Sortable | Filterable |
|--------|---------|----------|------------|
| Name | User name + avatar | ✓ | ✓ (search) |
| Email | Email address | ✓ | ✓ (search) |
| Organization | Org name (from `organizationId`) | ✓ | ✓ (dropdown) |
| Clearance | Badge with color | ✓ | ✓ (multi-select) |
| Markings | Comma-separated badges | - | ✓ (multi-select) |
| Status | Active/Suspended/Inactive | ✓ | ✓ (dropdown) |
| Last Login | Relative time | ✓ | ✓ (date range) |
| Actions | Edit, Suspend, View Activity | - | - |

**Clearance Level Colors:**
- UNCLASSIFIED: Green badge
- CUI: Yellow badge
- SECRET: Orange badge
- TOP_SECRET: Red badge

### User Detail/Edit Form

Standard ontology form with security sections:

#### Identity Section (Read-Only)
- Cognito Username
- Email (from Cognito)
- Name (from Cognito)
- Sub (Cognito user ID)

#### Security Attributes Section
- **Organization** - Dropdown (loads from `core.organization` objects)
- **Clearance Level** - Radio buttons with descriptions
- **Markings** - Multi-select checkboxes with descriptions
- **SCI Compartments** - Tag input (autocomplete from existing)
- **Need-to-Know** - Checkbox with explanation
- **Employee ID** - Text input

**Save Action:**
1. Updates DynamoDB `captify-core-user` table
2. Updates Cognito user attributes via `admin-update-user-attributes`
3. Creates audit trail entry
4. Shows success message: "Security attributes updated. User must sign out and sign in again for changes to take effect."

#### Access Section
Shows what the user can access based on their attributes:

- **Organizations Accessible**: List of orgs (based on `organizationId`)
- **Classification Levels**: Visual indicator showing they can access this level and below
- **Data Types**: What markings they're cleared for
- **SCI Programs**: What compartmented programs they can access

### Bulk Operations

Select multiple users → Actions dropdown:

- **Update Organization** - Reassign to different org
- **Update Clearance** - Change clearance level
- **Add Markings** - Grant additional markings
- **Remove Markings** - Revoke markings
- **Suspend Users** - Suspend access
- **Export to CSV** - Export user list

Each bulk operation:
1. Shows confirmation dialog with preview
2. Updates both DynamoDB and Cognito
3. Creates audit trail entries

### Sync from Cognito

**Button:** "Sync from Cognito" (top right)

**Purpose:** One-way sync from Cognito → DynamoDB to ensure consistency

**Process:**
1. Fetches all users from Cognito User Pool
2. For each user, reads custom attributes
3. Updates or creates record in `captify-core-user` table
4. Shows sync report: "Synced 47 users, created 2 new, updated 5"

**Scheduled:** Runs automatically every hour via Lambda cron

## IAM Policy Integration

### How Security Attributes Control AWS Access

User security attributes map to **IAM policy conditions** on Identity Pool roles:

#### Organization Isolation (Multi-Tenancy)

IAM policy on DynamoDB access:

```json
{
  "Effect": "Allow",
  "Action": [
    "dynamodb:GetItem",
    "dynamodb:Query",
    "dynamodb:Scan"
  ],
  "Resource": "arn:aws:dynamodb:*:*:table/captify-*",
  "Condition": {
    "ForAllValues:StringEquals": {
      "dynamodb:LeadingKeys": ["${cognito-identity.amazonaws.com:sub}"],
      "dynamodb:Attributes": ["organizationId"]
    },
    "StringEquals": {
      "dynamodb:Select": "SPECIFIC_ATTRIBUTES"
    }
  }
}
```

**Better approach:** Use attribute-based access control (ABAC):

```json
{
  "Effect": "Allow",
  "Action": [
    "dynamodb:GetItem",
    "dynamodb:Query",
    "dynamodb:Scan",
    "dynamodb:PutItem",
    "dynamodb:UpdateItem"
  ],
  "Resource": "arn:aws:dynamodb:*:*:table/captify-*",
  "Condition": {
    "StringEquals": {
      "dynamodb:Attributes": ["organizationId"],
      "s3:ExistingObjectTag/organizationId": "${aws:PrincipalTag/custom:organizationId}"
    }
  }
}
```

This ensures users can ONLY access objects where `securityMetadata.organizationId` matches their `custom:organizationId`.

### Clearance-Based Access

For classification levels, use IAM conditions on object tags:

```json
{
  "Effect": "Allow",
  "Action": ["dynamodb:GetItem", "dynamodb:Query"],
  "Resource": "arn:aws:dynamodb:*:*:table/captify-*",
  "Condition": {
    "StringLike": {
      "aws:RequestTag/classification": [
        "UNCLASSIFIED",
        "CUI"  // Only if user clearance >= CUI
      ]
    }
  }
}
```

**Result:** AWS automatically denies access to objects above user's clearance, no application code needed.

## User Activity / Audit Trail

### Route: `/ontology/users/{userId}/activity`

**Data Source:** AWS CloudTrail (not custom logging)

**Query:** CloudTrail events filtered by `userIdentity.principalId`

### Activity Timeline

Shows user's AWS API activity:

| Timestamp | Event | Resource | Result | Details |
|-----------|-------|----------|--------|---------|
| 2025-11-09 14:23 | GetItem | contract-2024-001 | ✅ Allowed | Retrieved contract details |
| 2025-11-09 14:22 | PutItem | agent-builder-v2 | ✅ Allowed | Created new agent |
| 2025-11-09 14:20 | GetItem | top-secret-project | ❌ Denied | AccessDeniedException: Insufficient clearance |

**Filters:**
- Date range
- Event type (GetItem, PutItem, UpdateItem, DeleteItem, Query, Scan)
- Result (All, Allowed, Denied)
- Resource type (Contract, Agent, Tool, etc.)

**Implementation:**
```typescript
// Query CloudTrail via AWS SDK
const events = await cloudtrail.lookupEvents({
  LookupAttributes: [
    {
      AttributeKey: 'Username',
      AttributeValue: userId
    }
  ],
  StartTime: startDate,
  EndTime: endDate,
  MaxResults: 50
});
```

No custom audit logging needed - CloudTrail provides everything.

## Permissions UI

### Route: `/ontology/users/{userId}/permissions`

**Purpose:** Show what this user CAN access (UI-only, not enforcement)

### Effective Permissions Display

#### Organizations
- ✅ org-captify (Member)
- ❌ org-contractor-acme (No Access)

#### Classification Levels
- ✅ UNCLASSIFIED
- ✅ CUI
- ✅ SECRET
- ✅ TOP_SECRET ← User clearance level

#### Markings Authorized
- ✅ PII - Personally Identifiable Information
- ✅ PHI - Protected Health Information
- ✅ FIN - Financial Information
- ✅ LEO - Law Enforcement Only
- ✅ FOUO - For Official Use Only
- ✅ NOFORN - No Foreign Nationals

#### SCI Compartments
- ✅ SCI-A - Project Alpha
- ✅ SCI-B - Project Beta

#### Objects User Can Access

**Query:** Scan ontology objects where:
- `securityMetadata.organizationId` matches user's org
- `securityMetadata.classification` <= user's clearance
- All `securityMetadata.markings` are in user's authorized markings
- All `securityMetadata.sciCompartments` are in user's compartments

**Display:** List of accessible objects grouped by type:
- Contracts (23 accessible)
- Agents (15 accessible)
- Tools (142 accessible)
- Workflows (8 accessible)

**This is for UI/UX only** - actual access is enforced by IAM policies at AWS level.

## User Onboarding Workflow

### New User Registration

When a new user signs in for the first time (via CAC or Microsoft):

1. **Cognito creates user** - Email, name from identity provider
2. **Platform detects new user** - No record in `captify-core-user`
3. **Shows registration page** - `/auth/register`
4. **User fills out:**
   - Organization (dropdown)
   - Desired clearance level (pending approval)
   - Reason for access
5. **Creates pending user record** - Status: `pending`
6. **Notifies admins** - Email to security officers

### Admin Approval Flow

Admin goes to `/ontology/users?status=pending`:

1. **Reviews pending user**
2. **Assigns security attributes:**
   - Organization
   - Clearance level
   - Markings
   - SCI compartments
3. **Updates Cognito** - Calls `admin-update-user-attributes`
4. **Updates DynamoDB** - Status: `active`
5. **Notifies user** - "Your access has been approved"

User must sign out and sign in again to get new attributes.

## Integration with Other Ontology Features

### User as Foreign Key

Other ontology objects reference users via `createdBy`, `updatedBy`, `ownerId`, etc.

**Example - Contract object:**
```typescript
{
  id: "contract-2024-001",
  name: "FY24 Contract",
  createdBy: "b7f4c827-e6ec-4f0f-a5bd-997f011ba3a0", // User ID (Cognito sub)
  securityMetadata: {
    organizationId: "org-captify",
    classification: "SECRET",
    acl: [
      {
        userId: "b7f4c827-e6ec-4f0f-a5bd-997f011ba3a0",
        role: "Owner"
      }
    ]
  }
}
```

**UI Enhancement:** Show user name/email instead of ID via ontology relationship:

```typescript
// Ontology edge definition
{
  source: "core.user",
  target: "pmbook.contract",
  relation: "created",
  properties: {
    displayField: "name",
    inverseRelation: "createdBy"
  }
}
```

Now when displaying contracts, ontology automatically resolves `createdBy` → user name.

## API Endpoints

All user management via standard ontology operations:

```typescript
// List users (respects IAM permissions)
GET /api/captify
{
  service: "platform.ontology",
  operation: "listItems",
  objectType: "core.user",
  data: {
    filters: { status: "active" },
    sort: { field: "name", order: "asc" }
  }
}

// Get user
GET /api/captify
{
  service: "platform.ontology",
  operation: "getItem",
  objectType: "core.user",
  data: { id: "user-id" }
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
3. Creates CloudTrail audit entry (automatic)

## Summary

**User management is fully integrated into ontology:**
- ✅ Users are ontology objects (`core.user`)
- ✅ Security attributes stored in Cognito (source of truth)
- ✅ Synced to DynamoDB for queries/relationships
- ✅ IAM policies enforce access based on attributes
- ✅ CloudTrail provides audit logging
- ✅ UI provides user-friendly management interface
- ✅ No custom application-level security enforcement
- ✅ Leverages AWS native security primitives

**Control panel UI just provides:**
- User-friendly forms for Cognito attribute management
- Visualization of effective permissions
- CloudTrail event queries for activity
- Ontology relationship browsing

All actual security enforcement happens at AWS IAM layer.
