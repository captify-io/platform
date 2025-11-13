# AWS-Native Security Approach

**Date:** 2025-11-09
**Philosophy:** Let AWS do the heavy lifting, application provides UI

## Summary

We **don't** duplicate AWS security in application code. Instead:

✅ **AWS IAM enforces** access control via Cognito attribute-based policies
✅ **CloudTrail logs** all access (no custom audit logging needed)
✅ **Ontology integrates** security as first-class object types
✅ **Application UI** provides user-friendly management of AWS primitives

## Security Enforcement Layers

### Layer 1: AWS IAM Policies (Enforcement)

**Where:** Identity Pool authenticated role policies
**What:** Attribute-Based Access Control (ABAC) using Cognito custom attributes
**Result:** AWS automatically denies unauthorized access

#### Example: Organization Isolation

IAM policy on DynamoDB/S3 access:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:Query",
        "dynamodb:Scan",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem"
      ],
      "Resource": "arn:aws:dynamodb:*:*:table/captify-*",
      "Condition": {
        "StringEquals": {
          "dynamodb:LeadingKeys": ["${cognito-identity.amazonaws.com:sub}"]
        },
        "ForAllValues:StringEquals": {
          "dynamodb:Attributes": ["organizationId", "createdBy"]
        }
      }
    }
  ]
}
```

**Result:** Users can ONLY access DynamoDB items where they match the partition key OR the item's `organizationId` matches their `custom:organizationId`.

### Layer 2: Cognito User Attributes (Identity)

**Where:** Cognito User Pool custom attributes
**What:** User security context (clearance, markings, organization)
**Result:** IAM policies use these attributes for decisions

#### Attributes

| Attribute | Purpose | Used By |
|-----------|---------|---------|
| `custom:organizationId` | Multi-tenant isolation | IAM policies, DynamoDB conditions |
| `custom:clearanceLevel` | Classification access | IAM policies (future), UI visibility |
| `custom:markings` | Data marking access | UI visibility, query filters |
| `custom:sciCompartments` | Compartmented access | UI visibility, query filters |
| `custom:needToKnow` | Explicit ACL required | UI visibility |
| `custom:employeeId` | Audit trail correlation | CloudTrail queries |

### Layer 3: CloudTrail (Audit)

**Where:** AWS CloudTrail service
**What:** Every AWS API call is logged
**Result:** Complete audit trail, no custom logging needed

#### CloudTrail Event Example

```json
{
  "eventTime": "2025-11-09T14:23:15Z",
  "eventName": "GetItem",
  "eventSource": "dynamodb.amazonaws.com",
  "userIdentity": {
    "type": "AssumedRole",
    "principalId": "AROAI...:CognitoIdentityCredentials",
    "userName": "mike.johnson@anautics.com",
    "identityPoolId": "us-east-1:xxxxx",
    "userAttributes": {
      "custom:organizationId": "org-captify",
      "custom:clearanceLevel": "TOP_SECRET"
    }
  },
  "requestParameters": {
    "tableName": "captify-pmbook-contract",
    "key": {"id": "contract-2024-001"}
  },
  "responseElements": null,
  "errorCode": "AccessDeniedException",
  "errorMessage": "User: arn:aws:sts::...:assumed-role/... is not authorized to perform: dynamodb:GetItem"
}
```

**No custom audit logging code needed** - CloudTrail captures everything.

### Layer 4: Application UI (User Experience)

**Where:** React components, ontology UI
**What:** Show/hide features based on user context
**Result:** User-friendly experience, not enforcement

#### UI-Level Permission Checks

`checkPermission()` is used ONLY for UI decisions:

```typescript
import { checkPermission, getEffectivePermissions } from '@captify-io/core/services/ontology';

// Get user context from session
const userContext = {
  userId: session.user.id,
  organizationId: session.organizationId,
  clearanceLevel: session.clearanceLevel,
  markings: session.markings,
  sciCompartments: session.sciCompartments,
  needToKnow: session.needToKnow,
  isAdmin: session.isAdmin
};

// Check what user CAN do (for UI only, not enforcement)
const permissions = getEffectivePermissions(
  userContext,
  contract.securityMetadata,
  contract.createdBy
);

// Show/hide buttons based on permissions
return (
  <div>
    {permissions.canView && <ContractDetails />}
    {permissions.canEdit && <EditButton />}
    {permissions.canDelete && <DeleteButton />}
    {permissions.canChangePermissions && <ShareButton />}
  </div>
);
```

**Important:** This is UI convenience, not security enforcement. Even if we show the Edit button, AWS IAM will deny the PutItem if user doesn't have permission.

## Integration with Ontology

### Security Entities as Ontology Objects

All security entities are ontology object types:

#### `core.user`

```typescript
{
  app: "core",
  slug: "user",
  name: "User",
  dataSource: "captify-core-user",
  properties: {
    cognitoUsername: { type: "string" },
    email: { type: "string" },
    organizationId: { type: "string" },
    clearanceLevel: { type: "string", enum: ["UNCLASSIFIED", "CUI", "SECRET", "TOP_SECRET"] },
    markings: { type: "array", items: { type: "string" } },
    // ... other attributes
  }
}
```

#### `core.organization`

```typescript
{
  app: "core",
  slug: "organization",
  name: "Organization",
  dataSource: "captify-core-organization",
  properties: {
    name: { type: "string", required: true },
    type: { type: "string", enum: ["Government", "Contractor", "Partner"] },
    parentOrgId: { type: "string" },
    securityOfficerEmail: { type: "string" },
    defaultClassification: { type: "string" }
  }
}
```

#### `core.marking`

```typescript
{
  app: "core",
  slug: "marking",
  name: "Data Marking",
  dataSource: "captify-core-marking",
  properties: {
    code: { type: "string", required: true },  // "PII", "PHI", etc.
    name: { type: "string", required: true },
    category: { type: "string", enum: ["data-protection", "law-enforcement", "national-security"] },
    description: { type: "string" },
    requiresTraining: { type: "boolean" }
  }
}
```

### SharedProperties.securityMetadata

Every ontology object instance can have security metadata:

```typescript
interface SharedProperties {
  id: string;
  name: string;
  // ... other shared properties
  securityMetadata?: {
    organizationId: string;              // Required for multi-tenancy
    classification: ClassificationLevel;  // UNCLASSIFIED, CUI, SECRET, TOP_SECRET
    markings: string[];                  // ["PII", "PHI", "FIN"]
    sciCompartments?: string[];          // ["SCI-A", "SCI-PROJECT-X"]
    acl: Array<{                         // Optional ACL for fine-grained control
      userId: string;
      role: 'Owner' | 'Editor' | 'Viewer' | 'Discoverer';
      grantedBy: string;
      grantedAt: string;
      expiresAt?: string;
    }>;
  };
}
```

### How Security Works End-to-End

#### 1. User Signs In

```
1. User authenticates (CAC or Microsoft)
   ↓
2. Cognito validates identity
   ↓
3. NextAuth extracts Cognito custom attributes
   ↓
4. Session includes: organizationId, clearanceLevel, markings, sciCompartments
```

#### 2. User Makes Request

```
1. Browser: fetch('/api/captify', { ... })
   ↓
2. Platform: Checks session, gets AWS credentials from Identity Pool
   ↓
3. Identity Pool: Returns temporary credentials with IAM role
   ↓
4. Platform: Calls AWS service (DynamoDB, S3) with credentials
   ↓
5. AWS IAM: Evaluates policy conditions using Cognito attributes
   ↓
6. AWS Service: Executes request OR returns AccessDeniedException
   ↓
7. Platform: Returns result to browser
   ↓
8. CloudTrail: Logs the entire event
```

#### 3. Example: Query Contracts

**User Context:**
- organizationId: `org-captify`
- clearanceLevel: `SECRET`
- markings: `["PII", "FIN"]`

**Request:**
```typescript
fetch('/api/captify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    service: 'platform.dynamodb',
    operation: 'query',
    table: 'pmbook-contract',
    data: {
      IndexName: 'organizationId-index',
      KeyConditionExpression: 'organizationId = :orgId',
      ExpressionAttributeValues: {
        ':orgId': 'org-captify'  // User's organization
      }
    }
  })
});
```

**What Happens:**
1. Platform gets Identity Pool credentials for user
2. Credentials have IAM policy with condition: `"StringEquals": {"dynamodb:LeadingKeys": ["org-captify"]}`
3. DynamoDB query executes with ABAC policy
4. AWS automatically filters results to only items where `organizationId = 'org-captify'`
5. CloudTrail logs the query
6. UI receives filtered results
7. UI further filters based on clearanceLevel/markings for display

**No application code enforced the security** - AWS IAM did it all.

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

## Benefits of AWS-Native Approach

1. **Security by Design** - AWS IAM is battle-tested, compliant, audited
2. **Zero Trust** - Application code can't bypass IAM policies
3. **Audit Trail** - CloudTrail provides complete, tamper-proof logs
4. **Scalability** - IAM evaluates billions of requests per day
5. **Compliance** - NIST 800-53, FedRAMP, DoD IL5 built into AWS
6. **Less Code** - No custom security enforcement to maintain
7. **Performance** - AWS evaluates policies in microseconds
8. **Cost** - CloudTrail included, no custom logging infrastructure

## Implementation Checklist

### ✅ Completed

1. Cognito custom attributes added
2. JWT/session callbacks extract security attributes
3. Security service created (for UI checks only)
4. SecurityMetadata added to SharedProperties
5. Ontology integration designed

### 🔜 Next Steps

1. **Configure IAM Policies** - Add ABAC policies to Identity Pool roles
2. **Create Ontology Object Types** - Define `core.user`, `core.organization`, `core.marking`
3. **Build Management UI** - Ontology-integrated user/org/marking management
4. **CloudTrail Integration** - Query CloudTrail for activity/audit views
5. **UI Permission Checks** - Use `checkPermission()` for button visibility

## Summary

**Philosophy:** AWS is the security layer, application is the UI layer.

- **Enforcement:** AWS IAM (not application code)
- **Audit:** CloudTrail (not custom logging)
- **Management:** Ontology UI (not separate security module)
- **Identity:** Cognito User Pool (source of truth)

This approach is simpler, more secure, more compliant, and easier to maintain than building custom security enforcement in the application.
