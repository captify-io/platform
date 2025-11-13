# Feature: Mission Context & Compliance

## Overview

Government and defense-specific features including classification handling, policy compliance, PII detection/masking, audit logging, and STIG compliance. Ensures data operations meet mission requirements and security standards.

**Feature ID**: 07
**Priority**: P1 - High (mission-critical for government use)
**Story Points**: 47
**Dependencies**: Phase 1-4 complete
**Implementation Phase**: Phase 7 (Weeks 29-32, Optional)

## Requirements

### Functional Requirements

#### FR-1: Classification Management
- Auto-detect classification based on keywords and patterns
- Manual classification override by authorized users
- Classification badges in all UI (U, C, S, TS)
- Filter catalog by classification level
- User clearance validation (cannot access data above clearance)
- Classification propagation through lineage
- Downgrade/upgrade workflows with approval

#### FR-2: PII Detection & Handling
- Auto-scan schemas for PII columns:
  - SSN (Social Security Number)
  - Email addresses
  - Phone numbers
  - Credit card numbers
  - Driver's license numbers
  - Passport numbers
- Flag PII fields in dataset profiles
- PII masking options:
  - Full redaction (`***-**-****`)
  - Partial masking (`XXX-XX-1234`)
  - Tokenization (replace with token, store mapping)
  - Encryption (AES-256)
- PII Masking node in pipeline builder
- Compliance reports (which datasets have unmasked PII)

#### FR-3: Policy Management
- Create/edit policies (markdown editor)
- Policy categories: security, privacy, compliance, quality
- Applicability rules (which datasets/products must comply)
- Link policies to authority documents (DoD 8570, NIST 800-53, FedRAMP)
- Policy version control
- Policy enforcement (warning or blocking)
- Policy compliance dashboard

#### FR-4: Compliance Dashboard
- Track compliance status across all datasets/products
- Policies by category
- Compliance rate (% compliant)
- Non-compliant datasets (with reasons)
- Policy violations (with severity)
- Remediation tracking
- Audit-ready reports

#### FR-5: Audit Logging
- Log all data access (read, write, delete)
- Log all configuration changes
- Log all user actions
- Store in CloudWatch Logs or DynamoDB
- Tamper-proof logging (write-only)
- Audit trail export (CSV, JSON, PDF)
- Retention: 7 years (NARA requirement)

#### FR-6: Access Control
- Role-based access (viewer, editor, admin, auditor)
- Dataset-level permissions
- Domain-level permissions
- Column-level permissions (PII columns)
- Approval workflow for sensitive data
- Access request tracking
- Emergency access with justification

#### FR-7: STIG Compliance Tracking (Optional)
- Check against STIG requirements
- Track compliance status per dataset
- Remediation tracking
- Evidence documentation
- Automated compliance reports

#### FR-8: ATO (Authority to Operate) Tracking (Optional)
- Track ATO status for data products
- Link required documentation
- Link to compliance evidence
- ATO package generation
- Renewal reminders

### Non-Functional Requirements

#### NFR-1: Security
- Encryption at rest (AES-256)
- Encryption in transit (TLS 1.3)
- Key management via AWS KMS
- Multi-factor authentication
- Least-privilege access
- No PII in logs

#### NFR-2: Audit
- Complete audit trail for all actions
- Tamper-proof logs
- 7-year retention
- Export in standard formats
- Query audit logs by user/date/action

#### NFR-3: Compliance
- FedRAMP compliance
- FISMA compliance
- NIST 800-53 controls
- STIG requirements
- DoD Cloud Computing SRG

## Architecture

### Component Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                  Mission Context Layer                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌────────────┐  ┌────────────┐  ┌────────────────────┐   │
│  │Classification│ │    PII     │  │     Policy         │   │
│  │   Manager   │  │  Detector  │  │     Engine         │   │
│  └─────┬──────┘  └─────┬──────┘  └─────────┬──────────┘   │
│        │               │                    │              │
│        └───────────────┴────────────────────┘              │
│                        │                                    │
│                ┌───────▼────────┐                           │
│                │   Compliance   │                           │
│                │     Engine     │                           │
│                └───────┬────────┘                           │
│                        │                                    │
├────────────────────────┼─────────────────────────────────────┤
│                   Storage Layer                             │
├────────────────────────┼─────────────────────────────────────┤
│         │              │              │                     │
│  ┌──────▼──────┐ ┌─────▼──────┐ ┌────▼──────────┐         │
│  │  DynamoDB   │ │ CloudWatch │ │   AWS KMS     │         │
│  │  (Policies) │ │  (Audit)   │ │  (Encryption) │         │
│  └─────────────┘ └────────────┘ └───────────────┘         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Data Model

### Policy Entity

```typescript
{
  id: string                        // "policy-{name}"
  name: string
  description: string
  category: "security" | "privacy" | "compliance" | "quality"
  content: string                   // Full policy (markdown)
  rules: Array<{
    condition: string               // When policy applies
    requirement: string             // What must be done
    enforcement: "warning" | "blocking"
  }>
  applicableTo: string[]            // Dataset/Product IDs or tags
  authority: string                 // "DoD 8570.01-M", "NIST 800-53"
  effectiveDate: string
  reviewDate: string
  status: "draft" | "active" | "deprecated"
  version: string
  owner: string
  approvers: string[]
  createdAt: string
  updatedAt: string
}

Table: dataops-policy
PK: id
GSI: category-index
GSI: status-index
```

### Classification Entity (stored in Dataset)

```typescript
{
  classification: "U" | "C" | "S" | "TS"
  classificationRationale: string   // Why this classification
  classifiedBy: string              // User who classified
  classifiedAt: string
  reviewDate: string                // Declassification review
  derivativeFrom: string[]          // Source classifications
  downgradeInstructions: string
}
```

### AuditLog Entity

```typescript
{
  id: string                        // "audit-{timestamp}-{userId}"
  timestamp: string
  userId: string
  userEmail: string
  action: string                    // "view", "create", "update", "delete", "download"
  resource: string                  // "dataset", "dataproduct", "policy"
  resourceId: string
  details: {
    ipAddress: string
    userAgent: string
    changes?: any                   // What changed
    reason?: string                 // Justification (for emergency access)
  }
  status: "success" | "failed" | "denied"
  errorMessage?: string
}

Table: dataops-audit-log
PK: timestamp (with UUID suffix for uniqueness)
SK: userId
GSI: userId-timestamp-index
GSI: resourceId-timestamp-index
TTL: 7 years (2208988800 seconds)
```

### ComplianceCheck Entity

```typescript
{
  id: string
  datasetId: string
  policyId: string
  checkType: "automated" | "manual"
  status: "compliant" | "non-compliant" | "warning" | "pending"
  findings: Array<{
    rule: string
    result: "pass" | "fail" | "warning"
    message: string
    severity: "low" | "medium" | "high" | "critical"
  }>
  remediationStatus: "not_started" | "in_progress" | "completed"
  assignedTo?: string
  dueDate?: string
  checkedAt: string
  checkedBy: string
}

Table: dataops-compliance-check
PK: id
GSI: datasetId-checkedAt-index
GSI: policyId-status-index
```

## UI/UX

### Classification Badge Display

```
┌─────────────────────────────────────────────────────────────┐
│ 📊 Contract Spend 2024                                       │
│                                                             │
│  ┌──────────┐                                               │
│  │🔓 UNCLASS│ Classified as Unclassified                    │
│  └──────────┘ Rationale: No sensitive information          │
│                Classified by: John Doe · 2024-01-15         │
│                Review date: 2025-01-15                      │
│                                                             │
│  Or:                                                        │
│                                                             │
│  ┌──────────┐                                               │
│  │🔒 SECRET │ Classified as Secret                          │
│  └──────────┘ Rationale: Contains contract pricing          │
│                Classified by: Jane Smith · 2024-01-15       │
│                Review date: 2025-01-15                      │
│                [Request Downgrade]                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### PII Detection Report

```
┌─────────────────────────────────────────────────────────────┐
│ PII Detection: Contract Spend 2024                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ⚠️ PII Detected in 3 columns                               │
│                                                             │
│  Column: vendor_email                                       │
│  └─ Type: Email Address                                     │
│     Confidence: 99%                                         │
│     Example: john.doe@example.com                           │
│     [Mask Column] [Encrypt] [Mark as Non-PII]              │
│                                                             │
│  Column: poc_phone                                          │
│  └─ Type: Phone Number                                      │
│     Confidence: 95%                                         │
│     Example: (555) 123-4567                                 │
│     [Mask Column] [Encrypt] [Mark as Non-PII]              │
│                                                             │
│  Column: vendor_tax_id                                      │
│  └─ Type: SSN/TIN                                           │
│     Confidence: 98%                                         │
│     Example: 12-3456789                                     │
│     [Mask Column] [Encrypt] [Mark as Non-PII]              │
│                                                             │
│  ✅ No PII detected in 15 other columns                     │
│                                                             │
│  [Mask All PII] [Generate Compliance Report]                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Compliance Dashboard

```
┌─────────────────────────────────────────────────────────────┐
│ Compliance Dashboard                                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ──────── Overall Compliance ────────                       │
│                                                             │
│  📊 Compliance Rate: 85%                                    │
│  ✅ Compliant: 170 datasets                                 │
│  ⚠️ Warnings: 25 datasets                                   │
│  ❌ Non-Compliant: 5 datasets                               │
│                                                             │
│  ──────── Policies (12 Active) ────────                     │
│                                                             │
│  Security Policies (4)                                      │
│  └─ Encryption at Rest: 100% compliant                     │
│  └─ Access Control: 95% compliant (10 warnings)            │
│  └─ PII Handling: 90% compliant (20 warnings)              │
│  └─ Classification: 85% compliant (5 non-compliant)        │
│                                                             │
│  Privacy Policies (3)                                       │
│  └─ PII Masking: 92% compliant (15 warnings)               │
│  └─ Data Retention: 100% compliant                         │
│  └─ User Consent: N/A (system data)                        │
│                                                             │
│  Compliance Policies (5)                                    │
│  └─ FISMA: 88% compliant                                   │
│  └─ FedRAMP: 90% compliant                                 │
│  └─ NIST 800-53: 85% compliant                             │
│  └─ STIG: 80% compliant                                    │
│  └─ DoD SRG: 82% compliant                                 │
│                                                             │
│  ──────── Non-Compliant Datasets (5) ────────              │
│                                                             │
│  🔴 Contract Spend 2024                                     │
│     Policy: Classification Policy                           │
│     Issue: Missing classification                           │
│     Severity: High                                          │
│     Assigned: John Doe · Due: 2024-01-20                    │
│     [View Details] [Remediate]                              │
│                                                             │
│  🔴 Personnel Records                                       │
│     Policy: PII Masking Policy                              │
│     Issue: Unmasked SSN column                              │
│     Severity: Critical                                      │
│     Assigned: Jane Smith · Overdue by 3 days                │
│     [View Details] [Remediate]                              │
│                                                             │
│  ... 3 more                                                 │
│                                                             │
│  [Generate Compliance Report] [Export Findings]             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Audit Log Viewer

```
┌─────────────────────────────────────────────────────────────┐
│ Audit Log                                                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Filters:                                                   │
│  User: [All ▼]  Action: [All ▼]  Date: [Last 7 days ▼]    │
│                                                             │
│  ──────────────────────────────────────────────────────    │
│                                                             │
│  2024-01-20 10:45:23 · john.doe@example.com                 │
│  Action: VIEW · Resource: Dataset (Contract Spend 2024)     │
│  IP: 192.168.1.100 · Status: Success                        │
│  [View Details]                                             │
│                                                             │
│  2024-01-20 10:42:15 · jane.smith@example.com               │
│  Action: UPDATE · Resource: DataProduct (Quarterly Report)  │
│  IP: 192.168.1.101 · Status: Success                        │
│  Changes: Pipeline configuration updated                    │
│  [View Details]                                             │
│                                                             │
│  2024-01-20 10:38:47 · mike.chen@example.com                │
│  Action: DOWNLOAD · Resource: Dataset (Personnel Records)   │
│  IP: 192.168.1.102 · Status: Denied                         │
│  Reason: Insufficient clearance (requires Secret)           │
│  [View Details]                                             │
│                                                             │
│  2024-01-20 10:35:12 · sarah.jones@example.com              │
│  Action: DELETE · Resource: Dataset (Staging Data)          │
│  IP: 192.168.1.103 · Status: Success                        │
│  Reason: Temporary staging data no longer needed            │
│  [View Details]                                             │
│                                                             │
│  [Export Audit Log] [Generate Report]                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## API Actions

### detectPII(datasetId)

**Purpose**: Scan dataset for PII

**Input**:
```typescript
{
  datasetId: string
}
```

**Output**:
```typescript
{
  success: boolean
  piiColumns: Array<{
    columnName: string
    piiType: "ssn" | "email" | "phone" | "credit_card" | "drivers_license"
    confidence: number            // 0-1
    examples: string[]            // Sample values (masked)
  }>
  recommendations: Array<{
    columnName: string
    action: "mask" | "encrypt" | "tokenize"
    reason: string
  }>
}
```

### classifyDataset(datasetId, classification, rationale)

**Purpose**: Set dataset classification

**Input**:
```typescript
{
  datasetId: string
  classification: "U" | "C" | "S" | "TS"
  rationale: string
  reviewDate: string            // When to review classification
  derivativeFrom?: string[]     // Source classifications
}
```

**Output**:
```typescript
{
  success: boolean
  classifiedBy: string
  classifiedAt: string
  requiresApproval: boolean
}
```

### checkCompliance(datasetId, policyId)

**Purpose**: Check dataset against policy

**Input**:
```typescript
{
  datasetId: string
  policyId: string
}
```

**Output**:
```typescript
{
  success: boolean
  status: "compliant" | "non-compliant" | "warning"
  findings: Array<{
    rule: string
    result: "pass" | "fail" | "warning"
    message: string
    severity: "low" | "medium" | "high" | "critical"
    remediation: string
  }>
}
```

### getAuditLog(filters)

**Purpose**: Query audit logs

**Input**:
```typescript
{
  userId?: string
  action?: string               // "view", "create", "update", "delete"
  resourceId?: string
  startDate: string
  endDate: string
  limit?: number                // Default: 100
}
```

**Output**:
```typescript
{
  success: boolean
  logs: Array<AuditLog>
  total: number
  nextToken?: string            // For pagination
}
```

## Implementation Notes

### PII Detection

Use regex patterns and AWS Comprehend:
```typescript
async function detectPII(datasetId: string) {
  const dataset = await getDataset(datasetId);
  const schema = dataset.schema;

  const piiColumns = [];

  for (const column of schema.columns) {
    // 1. Check column name for PII keywords
    const nameHints = ["ssn", "social", "email", "phone", "address", "dob"];
    if (nameHints.some(hint => column.name.toLowerCase().includes(hint))) {
      piiColumns.push({
        columnName: column.name,
        piiType: detectPIIType(column.name),
        confidence: 0.7,
        reason: "Column name suggests PII"
      });
      continue;
    }

    // 2. Sample data and check with regex
    const sampleData = await getSampleData(datasetId, column.name, 100);
    const piiType = detectPIIInData(sampleData);

    if (piiType) {
      piiColumns.push({
        columnName: column.name,
        piiType,
        confidence: 0.9,
        examples: sampleData.slice(0, 3).map(maskValue)
      });
    }

    // 3. Use AWS Comprehend for advanced detection
    if (column.type === "string") {
      const comprehendResponse = await comprehend.detectPiiEntities({
        Text: sampleData.join(" "),
        LanguageCode: "en"
      });

      if (comprehendResponse.Entities.length > 0) {
        piiColumns.push({
          columnName: column.name,
          piiType: comprehendResponse.Entities[0].Type,
          confidence: comprehendResponse.Entities[0].Score
        });
      }
    }
  }

  return { piiColumns };
}

function detectPIIInData(data: string[]): string | null {
  const patterns = {
    ssn: /^\d{3}-\d{2}-\d{4}$/,
    email: /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/,
    phone: /^\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/,
    credit_card: /^\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}$/
  };

  for (const [type, pattern] of Object.entries(patterns)) {
    if (data.some(value => pattern.test(value))) {
      return type;
    }
  }

  return null;
}
```

### Audit Logging

Log all actions to CloudWatch and DynamoDB:
```typescript
async function logAuditEvent(event: {
  userId: string,
  action: string,
  resource: string,
  resourceId: string,
  status: string
}) {
  const auditLog = {
    id: `audit-${Date.now()}-${event.userId}`,
    timestamp: new Date().toISOString(),
    userId: event.userId,
    userEmail: await getUserEmail(event.userId),
    action: event.action,
    resource: event.resource,
    resourceId: event.resourceId,
    details: {
      ipAddress: getClientIP(),
      userAgent: getUserAgent()
    },
    status: event.status
  };

  // 1. Store in DynamoDB (long-term retention)
  await dynamodb.send(new PutItemCommand({
    TableName: "dataops-audit-log",
    Item: marshall(auditLog)
  }));

  // 2. Send to CloudWatch Logs (real-time monitoring)
  await cloudwatch.send(new PutLogEventsCommand({
    logGroupName: "/dataops/audit",
    logStreamName: event.userId,
    logEvents: [{
      message: JSON.stringify(auditLog),
      timestamp: Date.now()
    }]
  }));
}

// Middleware to log all API requests
function auditMiddleware(handler: any) {
  return async (req: any, res: any) => {
    const start = Date.now();

    try {
      const result = await handler(req, res);

      await logAuditEvent({
        userId: req.user.id,
        action: req.method,
        resource: req.path,
        resourceId: req.params.id,
        status: "success"
      });

      return result;
    } catch (error) {
      await logAuditEvent({
        userId: req.user.id,
        action: req.method,
        resource: req.path,
        resourceId: req.params.id,
        status: "failed"
      });

      throw error;
    }
  };
}
```

### Compliance Checking

Evaluate policies automatically:
```typescript
async function checkCompliance(datasetId: string, policyId: string) {
  const dataset = await getDataset(datasetId);
  const policy = await getPolicy(policyId);

  const findings = [];

  for (const rule of policy.rules) {
    let result = "pass";
    let message = "";

    // Evaluate rule condition
    if (evaluateCondition(rule.condition, dataset)) {
      // Check if requirement is met
      const requirementMet = evaluateRequirement(rule.requirement, dataset);

      if (!requirementMet) {
        result = rule.enforcement === "blocking" ? "fail" : "warning";
        message = `Requirement not met: ${rule.requirement}`;
      }
    }

    findings.push({
      rule: rule.requirement,
      result,
      message,
      severity: determineSeverity(rule, result)
    });
  }

  const status = findings.some(f => f.result === "fail")
    ? "non-compliant"
    : findings.some(f => f.result === "warning")
    ? "warning"
    : "compliant";

  // Store compliance check result
  await createComplianceCheck({
    datasetId,
    policyId,
    status,
    findings
  });

  return { status, findings };
}
```

## Testing

### Unit Tests
- PII detection (regex patterns, Comprehend)
- Classification propagation through lineage
- Policy evaluation engine
- Audit log storage and retrieval

### Integration Tests
- End-to-end PII masking pipeline
- Compliance check workflow
- Access control enforcement
- Audit trail completeness

### Security Tests
- Attempt to access data above clearance (should fail)
- Attempt to modify audit logs (should fail)
- Encryption key rotation
- PII leakage in logs (should be none)

## Success Metrics

- **Classification Coverage**: 100% of datasets classified within 7 days
- **PII Detection**: 95%+ accuracy
- **Compliance Rate**: >85% across all policies
- **Audit Completeness**: 100% of actions logged
- **Access Control**: Zero unauthorized access incidents

## Related Features

- [01-data-catalog.md](./01-data-catalog.md) - Classification badges and PII flags in catalog
- [02-pipeline-builder.md](./02-pipeline-builder.md) - PII masking and classification nodes
- [03-quality-engine.md](./03-quality-engine.md) - Policy compliance as quality dimension
