# Captify-Inspired Security & Governance for IL5 NIST 800-53 Rev 5

## Vision

Build an **enterprise-grade, IL5-compliant security and governance framework** that provides Captify-level object security, data classification, and access control across all Captify applications and the foundry. The system implements NIST 800-53 Rev 5 controls using AWS Gov services while maintaining the flexibility and usability of Captify's security model.

## Core Principles

1. **Object-Level Security**: Every entity (node, edge, dataset, document, model, tool) has explicit security controls
2. **Data Lineage Security**: Security classifications propagate through data transformations automatically
3. **Zero Trust Architecture**: Verify every access attempt, assume breach, minimize blast radius
4. **IL5 NIST 800-53 Rev 5 Compliance**: Full implementation of required controls for Impact Level 5
5. **AWS-Native**: Maximize AWS GovCloud services (Cognito, IAM, KMS, CloudTrail, Config, Security Hub)
6. **Attribute-Based Access Control (ABAC)**: Dynamic permissions based on attributes, not just roles
7. **Audit Everything**: Complete audit trail for compliance, forensics, and threat detection

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                     SECURITY ENFORCEMENT LAYER                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐ │
│  │  Permission  │  │   Marking    │  │   Organization           │ │
│  │  Evaluation  │  │   System     │  │   Boundaries             │ │
│  │  Engine      │  │  (PII, CUI)  │  │   (Multi-Tenant)         │ │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                                 ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    ACCESS CONTROL FRAMEWORK                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐ │
│  │    RBAC      │  │    ABAC      │  │     Data Lineage         │ │
│  │  (Cognito    │  │  (Dynamic    │  │     Propagation          │ │
│  │   Groups)    │  │ Attributes)  │  │  (Ontology Edges)        │ │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                                 ↓
┌─────────────────────────────────────────────────────────────────────┐
│                      AWS GOVCLOUD SERVICES                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐ │
│  │   Cognito    │  │     IAM      │  │        KMS               │ │
│  │ (Identity)   │  │  (Policies)  │  │   (Encryption)           │ │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘ │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐ │
│  │  CloudTrail  │  │ Security Hub │  │      Config              │ │
│  │   (Audit)    │  │ (Compliance) │  │   (Monitoring)           │ │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                                 ↓
┌─────────────────────────────────────────────────────────────────────┐
│                     ONTOLOGY INTEGRATION                             │
│  All entities stored in ontology have security metadata:            │
│  - organizationId: Which org owns this resource                     │
│  - markings: [PII, CUI, SECRET, etc.]                              │
│  - acl: Access Control List (users/groups/roles)                   │
│  - dataClassification: UNCLASS, CUI, SECRET, TS                    │
│  - requiredClearance: Minimum clearance level                      │
│  - compartments: SCI compartments required                         │
└─────────────────────────────────────────────────────────────────────┘
```

## Captify Security Model Translation to AWS

| Captify Concept | AWS Implementation | Captify Implementation |
|------------------|-------------------|------------------------|
| **Organizations** | Cognito User Pools + Custom Attributes | `organizationId` on every entity |
| **Projects** | DynamoDB partition keys + IAM policies | `projectId` grouping in ontology |
| **Markings** | Resource tags + Attribute-based policies | `markings[]` array on entities |
| **Roles** | Cognito Groups + IAM roles | Cognito groups mapped to permissions |
| **Data Lineage Security** | DynamoDB GSI queries + edge traversal | Ontology edge propagation |
| **Audit Logging** | CloudTrail + DynamoDB audit table | Real-time audit events |
| **Encryption** | KMS + S3/DynamoDB encryption | Envelope encryption for all data |

## Key Features

### Phase 1: Foundation (Weeks 1-2)
**Goal**: Establish core security infrastructure

- **Organization Management**
  - Create/update/delete organizations
  - Assign users to organizations
  - Enforce single-organization membership
  - Cross-organization resource isolation

- **Marking System**
  - Define marking categories (PII, CUI, SECRET, etc.)
  - Apply markings to entities
  - Marking hierarchy and inheritance
  - Marking propagation through data lineage

- **Role-Based Access Control (RBAC)**
  - Cognito group management
  - Default roles: Owner, Editor, Viewer, Discoverer
  - Custom role creation
  - Permission mapping to operations

### Phase 2: ABAC & Data Classification (Weeks 3-4)
**Goal**: Implement attribute-based access control and data classification

- **Attribute-Based Access Control (ABAC)**
  - User attributes (clearance, compartments, need-to-know)
  - Resource attributes (classification, marking, sensitivity)
  - Contextual attributes (time, location, device)
  - Dynamic policy evaluation

- **Data Classification**
  - Classification levels: UNCLASSIFIED, CUI, SECRET, TOP SECRET
  - SCI compartments and special access programs
  - Banner marking generation
  - Portion marking support

- **Clearance Management**
  - User clearance levels stored in Cognito attributes
  - Clearance validation on access attempts
  - Clearance expiration tracking
  - Read/write clearance differentiation

### Phase 3: Data Lineage Security (Weeks 5-6)
**Goal**: Propagate security through data transformations

- **Lineage Propagation**
  - Automatic marking inheritance through ontology edges
  - Classification level escalation (not de-escalation)
  - Derived dataset security calculation
  - Cross-domain solution (CDS) integration points

- **Impact Analysis**
  - Security impact of permission changes
  - Downstream access revocation simulation
  - Risk assessment for classification changes
  - Audit trail for security modifications

- **Column-Level Security**
  - Sensitive field identification
  - Column-level marking application
  - Selective column removal for sanitization
  - Query-time column filtering

### Phase 4: Audit & Compliance (Weeks 7-8)
**Goal**: Complete audit logging and NIST compliance

- **Comprehensive Audit Logging**
  - All access attempts (success and failure)
  - Permission changes
  - Data exports and downloads
  - Query execution and results
  - User authentication events

- **NIST 800-53 Rev 5 Controls**
  - Access Control (AC-*) - 25 controls
  - Audit and Accountability (AU-*) - 16 controls
  - Identification and Authentication (IA-*) - 12 controls
  - System and Communications Protection (SC-*) - 23 controls
  - Full control mapping and evidence collection

- **Compliance Reporting**
  - Real-time compliance dashboard
  - Control status tracking
  - Evidence collection automation
  - POA&M management

### Phase 5: Advanced Features (Weeks 9-10)
**Goal**: Enterprise-grade security features

- **Permission Simulation**
  - "What if" permission analysis
  - Check access for any user
  - Simulate marking changes
  - Permission inheritance visualization

- **Security Monitoring**
  - Anomaly detection (unusual access patterns)
  - Failed access attempt tracking
  - Privilege escalation detection
  - Insider threat indicators

- **Encryption Management**
  - KMS key management UI
  - Envelope encryption for sensitive data
  - Key rotation scheduling
  - Encryption at rest verification

## Technology Stack

### AWS GovCloud Services
- **Cognito User Pools**: User authentication and attribute storage
- **Cognito Identity Pools**: Temporary credential federation
- **IAM**: Fine-grained permission policies
- **KMS**: Encryption key management
- **CloudTrail**: API audit logging
- **Security Hub**: NIST 800-53 compliance checks
- **Config**: Resource configuration tracking
- **Secrets Manager**: Credential storage
- **DynamoDB**: Security metadata and audit log storage

### Application Layer
- **Core Services**: `@captify-io/core/services/security`
- **Ontology Integration**: Security metadata on all entities
- **API Middleware**: Permission evaluation on every request
- **Real-time Events**: WebSocket security notifications

### Frontend
- **Security UI Components**: Permission dialogs, marking badges, clearance indicators
- **Admin Console**: Organization/marking/role management
- **Compliance Dashboard**: NIST control status visualization

## IL5 NIST 800-53 Rev 5 Control Families

This implementation addresses the following NIST control families:

| Family | Controls | Implementation |
|--------|----------|----------------|
| **AC - Access Control** | 25 | RBAC, ABAC, least privilege, session management |
| **AU - Audit & Accountability** | 16 | CloudTrail, DynamoDB audit logs, real-time monitoring |
| **AT - Awareness & Training** | 5 | User training modules, security documentation |
| **CM - Configuration Management** | 14 | AWS Config, baseline configurations, change tracking |
| **CP - Contingency Planning** | 13 | Backup/restore, disaster recovery, RTO/RPO |
| **IA - Identification & Authentication** | 12 | Cognito MFA, federated identity, session timeouts |
| **IR - Incident Response** | 10 | Security monitoring, incident workflow, forensics |
| **MA - Maintenance** | 6 | System maintenance procedures, audit of maintenance |
| **MP - Media Protection** | 8 | Data sanitization, media disposal, encryption |
| **PE - Physical & Environmental** | 23 | AWS facility controls (inherited) |
| **PL - Planning** | 11 | Security architecture, system security plans |
| **PS - Personnel Security** | 8 | Background checks, clearance verification |
| **RA - Risk Assessment** | 10 | Continuous monitoring, vulnerability scanning |
| **SA - System & Services Acquisition** | 23 | Secure development lifecycle, supply chain risk |
| **SC - System & Communications Protection** | 23 | Encryption, network segmentation, TLS |
| **SI - System & Information Integrity** | 23 | Vulnerability management, malware protection |

**Total Controls**: 224 controls mapped to AWS and application implementations

## Data Classification & Marking Standards

### Classification Levels

1. **UNCLASSIFIED**
   - No special handling required
   - Public release authorized
   - No markings needed

2. **CUI (Controlled Unclassified Information)**
   - Requires protection per federal regulations
   - Limited distribution
   - Marking: "CUI" or specific category (CUI//SP-PRVCY, etc.)

3. **SECRET**
   - National security information
   - Unauthorized disclosure could cause serious damage
   - Requires SECRET clearance

4. **TOP SECRET**
   - National security information
   - Unauthorized disclosure could cause exceptionally grave damage
   - Requires TOP SECRET clearance

### Marking Categories

| Category | Description | Example Use Cases |
|----------|-------------|-------------------|
| **PII** | Personally Identifiable Information | SSN, DOB, home address |
| **PHI** | Protected Health Information | Medical records, diagnoses |
| **FIN** | Financial Information | Bank accounts, credit cards |
| **LEO** | Law Enforcement Sensitive | Case files, investigations |
| **FOUO** | For Official Use Only | Internal communications |
| **NOFORN** | No Foreign Nationals | US-only information |
| **REL TO** | Releasable To | Specific country release |
| **SCI** | Sensitive Compartmented Information | Intelligence sources/methods |

### Portion Marking Examples

```
(U) This paragraph is unclassified
(CUI) This paragraph contains controlled unclassified information
(S) This paragraph is classified SECRET
(TS) This paragraph is classified TOP SECRET
(TS//SCI) This paragraph is TOP SECRET with SCI controls
```

## Security Metadata Schema

Every entity in the ontology has the following security properties:

```typescript
interface SecurityMetadata {
  // Organization & Ownership
  organizationId: string;              // Owning organization
  projectId?: string;                  // Optional project grouping
  ownerId: string;                     // User who created it

  // Classification
  classification: 'UNCLASSIFIED' | 'CUI' | 'SECRET' | 'TOP_SECRET';
  markings: string[];                  // [PII, CUI, NOFORN, etc.]
  sciCompartments?: string[];          // SCI compartment codes

  // Access Control
  acl: {
    users: { userId: string; role: string }[];      // User permissions
    groups: { groupId: string; role: string }[];    // Group permissions
    organizations: string[];                         // Org access list
  };

  // Clearance Requirements
  requiredClearance?: 'SECRET' | 'TOP_SECRET';
  requiredCompartments?: string[];     // Required SCI compartments
  needToKnow?: boolean;                // Need-to-know required

  // Audit
  createdAt: string;
  createdBy: string;
  lastAccessedAt?: string;
  lastAccessedBy?: string;
  accessCount: number;

  // Data Lineage Security
  inheritedMarkings: {
    marking: string;
    source: string;                    // Entity ID that marking came from
    path: string[];                    // Lineage path
  }[];

  // Encryption
  encrypted: boolean;
  kmsKeyId?: string;                   // KMS key used for encryption
}
```

## Permission Evaluation Algorithm

```typescript
function canAccess(user: User, entity: Entity, operation: string): boolean {
  // 1. Organization Check (Mandatory)
  if (user.organizationId !== entity.securityMetadata.organizationId) {
    // Check if cross-org access is explicitly granted
    if (!entity.securityMetadata.acl.organizations.includes(user.organizationId)) {
      return false;  // Hard fail - wrong organization
    }
  }

  // 2. Clearance Check (Mandatory if required)
  if (entity.securityMetadata.requiredClearance) {
    if (!hasClearance(user, entity.securityMetadata.requiredClearance)) {
      return false;  // Hard fail - insufficient clearance
    }
  }

  // 3. Compartment Check (Mandatory if required)
  if (entity.securityMetadata.requiredCompartments) {
    if (!hasCompartments(user, entity.securityMetadata.requiredCompartments)) {
      return false;  // Hard fail - missing compartments
    }
  }

  // 4. Marking Check (Mandatory - must have ALL markings)
  for (const marking of entity.securityMetadata.markings) {
    if (!user.markings.includes(marking)) {
      return false;  // Hard fail - missing required marking
    }
  }

  // 5. Role/Permission Check (Discretionary)
  const hasPermission =
    // Direct user permission
    entity.securityMetadata.acl.users.some(u =>
      u.userId === user.id && hasRolePermission(u.role, operation)
    ) ||
    // Group-based permission
    entity.securityMetadata.acl.groups.some(g =>
      user.groups.includes(g.groupId) && hasRolePermission(g.role, operation)
    ) ||
    // Owner always has full access
    (entity.securityMetadata.ownerId === user.id && operation !== 'delete');

  if (!hasPermission) {
    return false;  // No discretionary permission for this operation
  }

  // 6. Contextual Checks (ABAC)
  if (!evaluateAbacPolicy(user, entity, operation, context)) {
    return false;  // ABAC policy denied access
  }

  // All checks passed
  return true;
}
```

## Success Criteria

### Security
- ✅ 100% of entities have security metadata
- ✅ Zero unauthorized access attempts succeed
- ✅ All security events logged to CloudTrail
- ✅ Encryption at rest for all sensitive data
- ✅ TLS 1.3 for all data in transit

### Compliance
- ✅ NIST 800-53 Rev 5: 224 controls implemented
- ✅ Security Hub compliance score > 95%
- ✅ All IL5 requirements satisfied
- ✅ Continuous monitoring operational
- ✅ Audit logs retained for 7 years

### Performance
- ✅ Permission evaluation < 50ms per request
- ✅ Marking propagation < 1 second for 100-node lineage
- ✅ Audit log ingestion < 100ms
- ✅ Compliance dashboard loads < 2 seconds

### Usability
- ✅ Permission simulation available for all users
- ✅ Clear error messages for access denials
- ✅ Visual marking indicators on all entities
- ✅ One-click access request workflow

## Related Documentation

- [Features](./features/) - Detailed feature specifications
- [User Stories](./user-stories/) - YAML user stories with test scenarios
- [Implementation Roadmap](./plan/implementation-roadmap.md) - Phased delivery plan
- [Status](./status.md) - Current implementation progress
- [NIST 800-53 Control Mapping](./nist-control-mapping.md) - Complete control implementation
- [Security Architecture Decisions](./security-decisions.md) - Key architectural choices

## References

### Captify Documentation
- [Security Overview](https://www.palantir.com/docs/foundry/security/overview/)
- [Security Glossary](https://www.palantir.com/docs/foundry/security/security-glossary/)
- [Securing a Data Foundation](https://www.palantir.com/docs/foundry/security/securing-a-data-foundation/)
- [Protecting Sensitive Data](https://www.palantir.com/docs/foundry/security/protecting-sensitive-data/)
- [Checking Permissions](https://www.palantir.com/docs/foundry/security/checking-permissions/)

### AWS Documentation
- [NIST 800-53 Rev 5 in Security Hub](https://docs.aws.amazon.com/securityhub/latest/userguide/standards-reference-nist-800-53.html)
- [AWS Config NIST Best Practices](https://docs.aws.amazon.com/config/latest/developerguide/operational-best-practices-for-nist-800-53_rev_5.html)
- [AWS GovCloud IL5 Authorization](https://aws.amazon.com/compliance/dod/)
- [Implementing NIST Compliance](https://aws.amazon.com/blogs/security/implementing-a-compliance-and-reporting-strategy-for-nist-sp-800-53-rev-5/)

### NIST Standards
- [NIST SP 800-53 Rev 5](https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final) - Security and Privacy Controls
- [NIST SP 800-171](https://csrc.nist.gov/publications/detail/sp/800-171/rev-2/final) - Protecting CUI
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)

---

**Created**: 2025-11-09
**Owner**: Security Team
**Priority**: P0 (Critical - IL5 Compliance Required)
**Timeline**: 10 weeks
**Status**: Planning
