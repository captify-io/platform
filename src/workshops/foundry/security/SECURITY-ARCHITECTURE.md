# Security Architecture - Overview

**Philosophy:** AWS enforces security, application provides UI.

## Quick Reference

- [AWS-Native Approach](AWS-NATIVE-APPROACH.md) - Architecture philosophy and security layers
- [User Management](../control-panel/user-management.md) - User security attributes integrated into ontology
- [Security Management](../control-panel/security-management.md) - All security features (users, orgs, markings, activity, compliance)

## Three-Layer Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Layer 1: AWS IAM                        │
│                    (ENFORCEMENT)                            │
│                                                             │
│  Identity Pool authenticated role with ABAC policies:      │
│  - Organization isolation via custom:organizationId        │
│  - Classification enforcement via clearanceLevel           │
│  - Marking enforcement via custom:markings                 │
│  - Result: AWS automatically denies unauthorized access    │
└─────────────────────────────────────────────────────────────┘
                            ▲
                            │ Uses attributes from
                            │
┌─────────────────────────────────────────────────────────────┐
│                  Layer 2: Cognito User Pool                 │
│                     (IDENTITY)                              │
│                                                             │
│  Custom attributes (source of truth):                      │
│  - custom:organizationId                                   │
│  - custom:clearanceLevel                                   │
│  - custom:markings                                         │
│  - custom:sciCompartments                                  │
│  - custom:needToKnow                                       │
│  - custom:employeeId                                       │
└─────────────────────────────────────────────────────────────┘
                            ▲
                            │ Logged by
                            │
┌─────────────────────────────────────────────────────────────┐
│                    Layer 3: CloudTrail                      │
│                       (AUDIT)                               │
│                                                             │
│  Every AWS API call logged:                                │
│  - DynamoDB: GetItem, PutItem, UpdateItem, DeleteItem     │
│  - S3: GetObject, PutObject                                │
│  - Cognito: AdminUpdateUserAttributes                      │
│  - Includes user identity + Cognito attributes             │
│  - Result: allowed or AccessDeniedException                │
└─────────────────────────────────────────────────────────────┘
```

## What Gets Enforced Where

| Security Feature | Enforcement | Management | Audit |
|-----------------|-------------|------------|-------|
| **Organization Isolation** | IAM policy conditions | Cognito + DynamoDB | CloudTrail |
| **Classification Levels** | IAM policy + object tags | Cognito + DynamoDB | CloudTrail |
| **Data Markings** | IAM policy conditions | Cognito + DynamoDB | CloudTrail |
| **SCI Compartments** | IAM policy conditions | Cognito + DynamoDB | CloudTrail |
| **Access Control Lists** | UI filtering only | DynamoDB | CloudTrail |

**Key Insight:** Only organization, classification, and markings are enforced at AWS level. ACLs are UI-only for user convenience.

## Security Entities as Ontology Objects

All security entities are first-class ontology objects:

| Entity | Ontology Type | Table | Purpose |
|--------|--------------|-------|---------|
| **Users** | `core.user` | `captify-core-user` | User identity + security attributes |
| **Organizations** | `core.organization` | `captify-core-organization` | Multi-tenant boundaries |
| **Markings** | `core.marking` | `captify-core-marking` | Data marking definitions |

**Navigation:** All managed at `/ontology` (no separate security section)

## Data Flow: User Makes Request

```
1. User signs in
   ↓
2. NextAuth extracts Cognito custom attributes
   ↓
3. Session includes: organizationId, clearanceLevel, markings, sciCompartments
   ↓
4. User requests data (e.g., GET contract-2024-001)
   ↓
5. Platform gets AWS credentials from Identity Pool
   ↓
6. Credentials have IAM role with ABAC policies
   ↓
7. DynamoDB GetItem request with credentials
   ↓
8. AWS IAM evaluates policy conditions using Cognito attributes
   ↓
9. IF conditions pass: Return data
   IF conditions fail: AccessDeniedException
   ↓
10. CloudTrail logs entire event (user, resource, result, attributes)
```

**No application code involved in security enforcement** - AWS IAM does it all.

## Application's Role

The application provides **user-friendly interfaces** for AWS security primitives:

### User Management (`/ontology/users`)
- View users with security attributes
- Edit clearance levels, markings, compartments
- Updates both DynamoDB and Cognito
- CloudTrail logs the changes

### Organization Management (`/ontology/organizations`)
- Create/edit multi-tenant boundaries
- View users in organization
- View objects owned by organization

### Marking Management (`/ontology/markings`)
- Define marking types (PII, PHI, FIN, etc.)
- View users authorized for each marking
- View objects with each marking

### Activity Viewer (`/ontology/activity`)
- Query CloudTrail for security events
- Filter by user, resource, event type
- Export to CSV/JSON for reporting

### Compliance Tracking (`/ontology/compliance`)
- Track NIST 800-53 Rev 5 controls
- Map AWS features to NIST controls
- Evidence is code + CloudTrail logs

## Permission Checking: UI vs Enforcement

```typescript
// ✅ CORRECT: Use checkPermission() for UI visibility only
import { checkPermission, getEffectivePermissions } from '@captify-io/core/services/ontology';

const permissions = getEffectivePermissions(
  userContext,
  contract.securityMetadata,
  contract.createdBy
);

return (
  <div>
    {permissions.canView && <ContractDetails />}
    {permissions.canEdit && <EditButton />}     {/* UI-only */}
    {permissions.canDelete && <DeleteButton />} {/* UI-only */}
  </div>
);

// Even if EditButton is shown, AWS IAM will deny the PutItem if unauthorized


// ❌ INCORRECT: Don't check permissions before AWS calls
if (!checkPermission(userContext, object.securityMetadata, 'Editor')) {
  return { error: 'Access denied' }; // Wrong! Let AWS deny it
}

const response = await dynamodb.putItem({ /* ... */ });
```

## Implementation Status

### ✅ Completed

1. Cognito custom attributes added (6 attributes)
2. JWT/session callbacks extract security attributes from Cognito
3. Security service created (`core/src/services/ontology/security.ts`)
4. `SharedProperties.securityMetadata` added to all ontology objects
5. Security attributes working in production sessions
6. Documentation complete (AWS-native approach, user management, security management)

### 🔜 Next Steps

1. **Configure IAM Policies** - Add ABAC policies to Identity Pool authenticated role
2. **Create Ontology Object Types** - Define and register:
   - `core.user` - User management with security attributes
   - `core.organization` - Organization definitions
   - `core.marking` - Data marking definitions
3. **Build Management UI** - Ontology-integrated interfaces at `/ontology`
4. **CloudTrail Integration** - Query CloudTrail for activity/audit views
5. **UI Permission Checks** - Implement `checkPermission()` calls in components

## Example: IAM Policy (ABAC)

This is what actually enforces security in production:

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
          "dynamodb:LeadingKeys": ["${cognito-identity.amazonaws.com:sub}"],
          "dynamodb:Attributes": ["organizationId"]
        },
        "ForAllValues:StringEquals": {
          "s3:ExistingObjectTag/organizationId": "${aws:PrincipalTag/custom:organizationId}"
        }
      }
    }
  ]
}
```

**Result:** Users can ONLY access objects where `securityMetadata.organizationId` matches their `custom:organizationId`. AWS denies everything else before the application ever sees it.

## Benefits

1. **Security by Design** - AWS IAM is battle-tested and compliant
2. **Zero Trust** - Application can't bypass IAM policies
3. **Complete Audit Trail** - CloudTrail logs everything
4. **Scalable** - IAM handles billions of requests per day
5. **Compliant** - NIST 800-53, FedRAMP, DoD IL5 built into AWS
6. **Less Code** - No custom security enforcement to maintain
7. **Performance** - AWS evaluates policies in microseconds
8. **Cost-Effective** - CloudTrail included, no custom infrastructure

## Summary

**AWS enforces, application provides UI.**

- **Enforcement:** AWS IAM with ABAC policies (not application code)
- **Audit:** CloudTrail (not custom logging)
- **Management:** Ontology UI (not separate security module)
- **Identity:** Cognito User Pool (source of truth)

This is the Captify-inspired security model, but implemented using AWS-native primitives instead of custom code. Simpler, more secure, more maintainable.
