# AWS-Native Security Implementation Guide

## Overview

This guide provides a **practical, day-1 implementation** of Captify-inspired security using AWS Cognito, IAM, and native AWS services. We focus on protecting data immediately without complex advanced features.

**Philosophy**: Use AWS-native services wherever possible. Don't build what AWS already provides.

---

## Core AWS Services Mapping

| Security Need | AWS Service | Implementation | Day 1? |
|---------------|-------------|----------------|--------|
| **User Authentication** | Cognito User Pools | Username/password, MFA, federated identity | ✅ Yes |
| **User Attributes** | Cognito Custom Attributes | Store clearance, org, groups | ✅ Yes |
| **Authorization** | Cognito Groups + IAM Roles | Role-based access control | ✅ Yes |
| **Temporary Credentials** | Cognito Identity Pools | Scoped AWS credentials | ✅ Yes |
| **Data Encryption at Rest** | KMS + DynamoDB/S3 encryption | Automatic encryption | ✅ Yes |
| **Data Encryption in Transit** | TLS 1.3 + ALB/CloudFront | HTTPS everywhere | ✅ Yes |
| **Audit Logging** | CloudTrail | AWS API call logging | ✅ Yes |
| **Application Audit** | DynamoDB audit table | Custom event logging | ✅ Yes |
| **Compliance Monitoring** | Security Hub + Config | NIST 800-53 checks | ⏸️ Phase 2 |
| **Secrets Management** | Secrets Manager | Database credentials, API keys | ✅ Yes |

---

## Day 1 Implementation: Cognito-Based Security

### 1. Cognito User Pool Configuration

**Purpose**: Authenticate users, store attributes, manage groups.

**Setup**:
```bash
# User Pool already exists: captify-user-pool
# User Pool ID: us-east-1_XXXXXXX
# Region: us-east-1 (or us-gov-west-1 for GovCloud)
```

**Custom Attributes to Add**:
```typescript
// In Cognito User Pool settings
{
  "custom:organizationId": "string",      // Which org user belongs to
  "custom:clearanceLevel": "string",      // UNCLASSIFIED, SECRET, TOP_SECRET
  "custom:compartments": "string",        // Comma-separated SCI compartments
  "custom:needToKnow": "boolean",         // Need-to-know indicator
  "custom:employeeId": "string",          // For audit trail
  "custom:jobTitle": "string"             // For ABAC policies
}
```

**Why**: Cognito natively stores user attributes, eliminating the need for a separate user metadata database.

---

### 2. Cognito Groups for RBAC

**Purpose**: Implement role-based access control without custom code.

**Default Groups to Create**:
```typescript
// Groups in Cognito User Pool
{
  name: "captify-admins",
  description: "Platform administrators - full access",
  precedence: 1
}

{
  name: "captify-operations",
  description: "Operations team - read/write on operational data",
  precedence: 2
}

{
  name: "captify-analysts",
  description: "Data analysts - read-only on most data",
  precedence: 3
}

{
  name: "captify-users",
  description: "Standard users - limited access",
  precedence: 4
}
```

**Per-Organization Groups** (Optional):
```typescript
// Format: {orgId}-{role}
"org-acme-owners"
"org-acme-editors"
"org-acme-viewers"
"org-acme-discoverers"
```

**Why**: Cognito groups map directly to IAM roles, eliminating custom permission logic for basic RBAC.

---

### 3. Cognito Identity Pool for AWS Access

**Purpose**: Grant temporary, scoped AWS credentials to authenticated users.

**Setup**:
```typescript
// Identity Pool Configuration
{
  identityPoolId: "us-east-1:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  allowUnauthenticatedIdentities: false,  // Require authentication

  // Map Cognito groups to IAM roles
  roleMappings: {
    "cognito-idp.us-east-1.amazonaws.com/us-east-1_XXXXXXX": {
      type: "Token",
      ambiguousRoleResolution: "AuthenticatedRole",

      // Role mapping by group
      rolesMapping: {
        "captify-admins": "arn:aws:iam::ACCOUNT:role/CaptifyAdminRole",
        "captify-operations": "arn:aws:iam::ACCOUNT:role/CaptifyOperationsRole",
        "captify-analysts": "arn:aws:iam::ACCOUNT:role/CaptifyAnalystRole",
        "captify-users": "arn:aws:iam::ACCOUNT:role/CaptifyUserRole"
      }
    }
  }
}
```

**Why**: Users get temporary AWS credentials scoped to their group's IAM role. No long-lived credentials stored anywhere.

---

### 4. IAM Roles for Fine-Grained Permissions

**Purpose**: Define exactly what each group can do in AWS.

**Example: Analyst Role (Read-Only)**:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:Query",
        "dynamodb:Scan"
      ],
      "Resource": [
        "arn:aws:dynamodb:*:ACCOUNT:table/captify-*",
        "arn:aws:dynamodb:*:ACCOUNT:table/captify-*/index/*"
      ],
      "Condition": {
        "StringEquals": {
          "dynamodb:LeadingKeys": ["${cognito-identity.amazonaws.com:sub}"]
        }
      }
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject"
      ],
      "Resource": [
        "arn:aws:s3:::captify-data-*/*"
      ]
    }
  ]
}
```

**Example: Operations Role (Read-Write)**:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:Query",
        "dynamodb:Scan"
      ],
      "Resource": [
        "arn:aws:dynamodb:*:ACCOUNT:table/captify-*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject"
      ],
      "Resource": [
        "arn:aws:s3:::captify-data-*/*"
      ]
    }
  ]
}
```

**Example: Admin Role (Full Access)**:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:*",
        "s3:*",
        "cognito-idp:*",
        "kms:*"
      ],
      "Resource": "*"
    }
  ]
}
```

**Why**: IAM policies enforce permissions at the AWS API level. Even if application code is compromised, AWS denies unauthorized operations.

---

### 5. Application-Level Security Metadata

**Purpose**: Store security metadata on every entity for application-level checks.

**Schema** (DynamoDB/Ontology):
```typescript
interface SecurityMetadata {
  // Organization (Captify concept)
  organizationId: string;           // "org-acme", "org-fedgov"

  // Data Classification
  classification: "UNCLASSIFIED" | "CUI" | "SECRET" | "TOP_SECRET";

  // Markings (Captify concept)
  markings: string[];               // ["PII", "PHI", "FIN"]

  // Access Control List (Captify roles)
  acl: {
    ownerId: string;                // User who created this
    editors: string[];              // User IDs with edit access
    viewers: string[];              // User IDs with view access
    public: boolean;                // Publicly accessible?
  };

  // Audit
  createdAt: string;
  createdBy: string;
  lastAccessedBy?: string;
  lastAccessedAt?: string;
}
```

**Storage**:
- Stored as top-level attributes on every DynamoDB item
- Indexed for efficient queries: `organizationId-classification-index`

**Why**: Application-level metadata provides fine-grained control beyond AWS IAM. Enables features like "show only my org's data" and "filter out SECRET items for UNCLASSIFIED users."

---

### 6. Permission Evaluation (Application Middleware)

**Purpose**: Check permissions on every API request before executing.

**Implementation** (`platform/src/middleware/security.ts`):
```typescript
import { apiClient } from '@captify-io/core/lib/api';

export async function checkPermission(
  session: any,           // From NextAuth
  entityId: string,       // Resource being accessed
  operation: string       // "read", "write", "delete"
): Promise<{ allowed: boolean; reason?: string }> {

  // 1. Get entity security metadata
  const entity = await apiClient.run({
    service: 'platform.dynamodb',
    operation: 'get',
    table: 'core-ontology-node',  // or whatever table
    data: { Key: { id: entityId } }
  });

  if (!entity.item) {
    return { allowed: false, reason: 'Entity not found' };
  }

  const security = entity.item.securityMetadata;

  // 2. Organization Check (Mandatory)
  if (session.user.organizationId !== security.organizationId) {
    return { allowed: false, reason: 'Access denied: different organization' };
  }

  // 3. Clearance Check (Mandatory if classification requires it)
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

  // 4. Marking Check (Mandatory - must have ALL markings)
  const userMarkings = session.user.markings || [];
  for (const marking of security.markings || []) {
    if (!userMarkings.includes(marking)) {
      return {
        allowed: false,
        reason: `Access denied: ${marking} marking required`
      };
    }
  }

  // 5. ACL Check (Discretionary)
  const isOwner = security.acl.ownerId === session.user.id;
  const isEditor = security.acl.editors?.includes(session.user.id);
  const isViewer = security.acl.viewers?.includes(session.user.id);
  const isPublic = security.acl.public;

  // Operation-specific checks
  if (operation === 'delete') {
    if (!isOwner) {
      return { allowed: false, reason: 'Only owner can delete' };
    }
  } else if (operation === 'write') {
    if (!isOwner && !isEditor) {
      return { allowed: false, reason: 'Edit permission required' };
    }
  } else if (operation === 'read') {
    if (!isOwner && !isEditor && !isViewer && !isPublic) {
      return { allowed: false, reason: 'View permission required' };
    }
  }

  // All checks passed!
  return { allowed: true };
}
```

**Usage in API Routes**:
```typescript
// platform/src/app/api/captify/route.ts

export async function POST(request: Request) {
  const session = await auth();  // NextAuth session

  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { service, operation, table, data } = body;

  // For operations on specific entities, check permissions
  if (data?.Key?.id) {
    const permissionCheck = await checkPermission(
      session,
      data.Key.id,
      operationToPermission(operation)  // "get" → "read", "update" → "write"
    );

    if (!permissionCheck.allowed) {
      // Log failed access attempt
      await logAuditEvent({
        userId: session.user.id,
        action: `${service}.${operation}`,
        entityId: data.Key.id,
        success: false,
        reason: permissionCheck.reason
      });

      return Response.json({
        error: 'Access denied',
        reason: permissionCheck.reason
      }, { status: 403 });
    }
  }

  // Permission check passed - execute operation
  const result = await executeService(body, session);

  // Log successful access
  await logAuditEvent({
    userId: session.user.id,
    action: `${service}.${operation}`,
    entityId: data?.Key?.id,
    success: true
  });

  return Response.json(result);
}
```

**Why**: Centralized permission checking in middleware ensures no endpoint can bypass security. All access attempts logged automatically.

---

### 7. Audit Logging (Day 1)

**Purpose**: Log all security-relevant events for compliance and forensics.

**DynamoDB Audit Table**:
```typescript
// Table: captify-core-audit-log

interface AuditEvent {
  id: string;                    // uuid
  timestamp: string;             // ISO 8601
  userId: string;                // Who performed action
  userEmail: string;             // For human readability
  action: string;                // "dynamodb.get", "s3.upload"
  entityId?: string;             // Resource accessed
  entityType?: string;           // "ontology-node", "dataset"
  success: boolean;              // Did it succeed?
  reason?: string;               // If failed, why?
  ipAddress: string;             // Source IP
  userAgent: string;             // Browser/client
  sessionId: string;             // Session tracking
  organizationId: string;        // User's org

  // Security context
  userClearance?: string;
  userMarkings?: string[];
  resourceClassification?: string;
  resourceMarkings?: string[];

  // Additional metadata
  metadata?: Record<string, any>;
}

// GSIs for efficient querying
// 1. userId-timestamp-index: All actions by a user
// 2. entityId-timestamp-index: All actions on an entity
// 3. action-timestamp-index: All actions of a type
// 4. success-timestamp-index: All failed attempts
// 5. organizationId-timestamp-index: All actions in an org
```

**Logging Function**:
```typescript
// core/src/services/audit.ts

export async function logAuditEvent(event: Partial<AuditEvent>, session: any) {
  const auditEvent: AuditEvent = {
    id: generateUUID(),
    timestamp: new Date().toISOString(),
    userId: session.user.id,
    userEmail: session.user.email,
    action: event.action!,
    entityId: event.entityId,
    entityType: event.entityType,
    success: event.success ?? true,
    reason: event.reason,
    ipAddress: getClientIP(),
    userAgent: getUserAgent(),
    sessionId: session.sessionId,
    organizationId: session.user.organizationId,
    userClearance: session.user.clearanceLevel,
    userMarkings: session.user.markings,
    resourceClassification: event.resourceClassification,
    resourceMarkings: event.resourceMarkings,
    metadata: event.metadata
  };

  // Write to DynamoDB (async, non-blocking)
  await apiClient.run({
    service: 'platform.dynamodb',
    operation: 'put',
    table: 'core-audit-log',
    data: { Item: auditEvent }
  });

  // Also send to CloudWatch for alerting (optional)
  if (!event.success) {
    console.error('Security violation:', auditEvent);
  }
}
```

**Why**: Every access attempt logged. Failed attempts immediately visible. Compliance requires complete audit trail.

---

### 8. Encryption (Day 1)

**Purpose**: Encrypt all data at rest and in transit.

**At Rest**:
```typescript
// DynamoDB tables - enable encryption
{
  TableName: "captify-*",
  SSESpecification: {
    Enabled: true,
    SSEType: "KMS",  // Use KMS for customer-managed keys
    KMSMasterKeyId: "alias/captify-data-key"
  }
}

// S3 buckets - enable encryption
{
  Bucket: "captify-data-*",
  ServerSideEncryptionConfiguration: {
    Rules: [{
      ApplyServerSideEncryptionByDefault: {
        SSEAlgorithm: "aws:kms",
        KMSMasterKeyID: "alias/captify-data-key"
      }
    }]
  }
}
```

**In Transit**:
- All HTTP traffic redirected to HTTPS
- TLS 1.3 minimum (configured in ALB/CloudFront)
- Certificate from AWS Certificate Manager

**KMS Key Policy** (Restrict Access):
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "Enable IAM User Permissions",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::ACCOUNT:root"
      },
      "Action": "kms:*",
      "Resource": "*"
    },
    {
      "Sid": "Allow Cognito Identity Pool Access",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::ACCOUNT:role/CaptifyOperationsRole"
      },
      "Action": [
        "kms:Decrypt",
        "kms:DescribeKey"
      ],
      "Resource": "*"
    }
  ]
}
```

**Why**: Encryption is non-negotiable for IL5. AWS manages it automatically once configured.

---

## Day 1 Checklist

### Cognito Configuration
- [ ] Custom attributes added: `organizationId`, `clearanceLevel`, `compartments`
- [ ] Groups created: `captify-admins`, `captify-operations`, `captify-analysts`, `captify-users`
- [ ] MFA enabled for all users
- [ ] Password policy: 12+ chars, complexity requirements, rotation

### Identity Pool & IAM
- [ ] Identity pool created and linked to user pool
- [ ] IAM roles created: Admin, Operations, Analyst, User
- [ ] IAM policies scoped to principle of least privilege
- [ ] Role mappings configured by Cognito group

### Application Security
- [ ] `securityMetadata` added to all entity schemas
- [ ] Permission middleware implemented on API routes
- [ ] Audit logging function created
- [ ] `captify-core-audit-log` table created with GSIs

### Encryption
- [ ] KMS key created: `alias/captify-data-key`
- [ ] All DynamoDB tables encrypted with KMS
- [ ] All S3 buckets encrypted with KMS
- [ ] TLS 1.3 enforced on ALB/CloudFront

### Testing
- [ ] Test user in each group can access appropriate resources
- [ ] Test cross-organization access is blocked
- [ ] Test clearance check denies SECRET to UNCLASSIFIED user
- [ ] Test audit log captures all access attempts
- [ ] Test encryption at rest and in transit

---

## What We're NOT Building (Use AWS Instead)

| Feature | Why NOT Build It | AWS Service to Use |
|---------|------------------|-------------------|
| **User management UI** | Cognito has built-in UI | Cognito hosted UI or AWS Amplify UI |
| **Password reset flow** | Cognito handles it | Cognito forgot password API |
| **MFA implementation** | Complex, error-prone | Cognito MFA (TOTP, SMS) |
| **Credential storage** | Security risk | Cognito Identity Pool temporary credentials |
| **Session management** | Already have NextAuth | NextAuth + Cognito provider |
| **Compliance scanning** | Can't match AWS tooling | Security Hub + Config |
| **Log aggregation** | AWS does it better | CloudTrail + CloudWatch Logs |

---

## Next Steps After Day 1

### Week 2: Data Lineage Security
- Propagate `markings[]` through ontology edges
- Implement "inherited markings" tracking
- Prevent de-escalation of classification

### Week 3: ABAC Policies
- Build policy engine for complex attribute checks
- Add contextual attributes (time, location)
- Policy simulation tool

### Week 4: Compliance Dashboard
- Enable Security Hub NIST 800-53 standard
- Build compliance dashboard UI
- Automate evidence collection

---

## Cost Estimate (AWS Services)

| Service | Usage | Monthly Cost |
|---------|-------|--------------|
| **Cognito User Pool** | 10,000 MAUs | $275 |
| **Cognito Identity Pool** | 10,000 users | Free (< 50k) |
| **KMS** | 1 key, 100k operations | $1 + $0.03 |
| **CloudTrail** | Management events | Free tier |
| **DynamoDB** | Audit logs, 100k writes | $25 |
| **Security Hub** | Automated checks | $0.0010/check |
| **Total** | | ~$300-350/month |

**Note**: GovCloud pricing may be ~20% higher.

---

## Summary

**What You Get on Day 1**:
1. ✅ User authentication with Cognito (MFA, password policy)
2. ✅ Role-based access control via Cognito groups
3. ✅ Temporary AWS credentials via Identity Pool
4. ✅ Organization-based isolation
5. ✅ Clearance-based access control
6. ✅ Marking-based access control (PII, PHI, etc.)
7. ✅ Audit logging for all operations
8. ✅ Encryption at rest (KMS) and in transit (TLS 1.3)
9. ✅ ACL (owner, editors, viewers) on every entity

**What You Don't Need to Build**:
- User registration/login UI (use Cognito hosted UI)
- Password reset (use Cognito API)
- MFA (use Cognito MFA)
- Session management (NextAuth handles it)
- Compliance scanning (Security Hub does it)

**Result**: Enterprise-grade, IL5-ready security using AWS-managed services. Minimal custom code, maximum security, compliance from day 1.
