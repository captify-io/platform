# Security & Governance - Implementation Roadmap

## Overview

This roadmap outlines a 10-week plan to implement Captify-inspired security and governance for IL5 NIST 800-53 Rev 5 compliance across the Captify foundry. The implementation follows a phased approach, building foundational security controls first, then layering on advanced features.

**Goal**: Provide enterprise-grade, IL5-compliant security that protects data across all applications while maintaining usability and developer velocity.

## Timeline

**Total Duration**: 10 weeks (50 working days)
**Target Completion**: Week of 2025-01-20
**Total Story Points**: 89

## Implementation Strategy

### Build Order Rationale

1. **Foundation First**: Organizations, markings, and RBAC establish the security perimeter
2. **ABAC Layer**: Attribute-based controls provide dynamic, context-aware security
3. **Lineage Integration**: Security propagates through data transformations automatically
4. **Compliance**: Audit logging and NIST control implementation
5. **Advanced Features**: User-facing tools for managing and understanding security

### Technology Decisions

| Requirement | Technology Choice | Rationale |
|-------------|------------------|-----------|
| **Identity Management** | AWS Cognito User Pools | Native AWS integration, attribute storage, MFA support |
| **Permission Policies** | Cognito Groups + Custom ABAC | Balance simplicity (groups) with flexibility (ABAC) |
| **Audit Logging** | CloudTrail + DynamoDB | Real-time logs in DynamoDB, long-term storage in S3 |
| **Encryption** | AWS KMS + DynamoDB/S3 encryption | FIPS 140-2 compliant, automatic key rotation |
| **Compliance Monitoring** | AWS Security Hub + Config | Automated NIST 800-53 checks, continuous compliance |
| **Security Metadata** | Ontology node/edge properties | Unified data model, leverages existing architecture |

---

## Phase 1: Security Foundation (Weeks 1-2) - 13 Story Points

**Goal**: Establish core security infrastructure with organizations, markings, and RBAC.

### Week 1: Organizations & Markings

**Deliverables**:
1. [ ] Organization entity type in ontology
2. [ ] Organization CRUD service
3. [ ] Marking category and marking entities
4. [ ] Marking management service
5. [ ] User-organization assignment (Cognito attributes)
6. [ ] Cross-organization resource isolation enforcement

**Technical Tasks**:
- Create `captify-core-organization` table with schema
- Create `captify-core-marking-category` and `captify-core-marking` tables
- Add `organizationId` to Cognito user attributes
- Implement organization boundary checks in API middleware
- Build admin UI for organization management

**Acceptance Criteria**:
- ✅ Users can only belong to one organization
- ✅ Resources cannot be accessed across organization boundaries (unless explicitly shared)
- ✅ Markings can be created in hierarchical categories
- ✅ Marking assignment to entities works correctly

**Story Points**: 8

---

### Week 2: Role-Based Access Control (RBAC)

**Deliverables**:
1. [ ] Four default roles in Cognito groups (Owner, Editor, Viewer, Discoverer)
2. [ ] Permission mapping for each role
3. [ ] ACL (Access Control List) on entity security metadata
4. [ ] Role-based permission evaluation in API middleware
5. [ ] Role inheritance through ontology edges
6. [ ] Admin UI for role management

**Technical Tasks**:
- Create Cognito groups: `{org}-owners`, `{org}-editors`, `{org}-viewers`, `{org}-discoverers`
- Define operation→role mapping (e.g., `delete` requires `Owner`, `update` requires `Editor`)
- Add `acl` to security metadata schema on all entities
- Implement `canAccess(user, entity, operation)` function
- Build role assignment UI

**Acceptance Criteria**:
- ✅ Owners can grant any role to users
- ✅ Editors can grant Editor/Viewer/Discoverer roles
- ✅ Viewers can grant Viewer/Discoverer roles
- ✅ Discoverers can only grant Discoverer role
- ✅ Role inheritance works through project/folder hierarchy

**Story Points**: 5

---

## Phase 2: ABAC & Data Classification (Weeks 3-4) - 18 Story Points

**Goal**: Implement attribute-based access control and data classification system.

### Week 3: Attribute-Based Access Control (ABAC)

**Deliverables**:
1. [ ] User attribute schema (clearance, compartments, need-to-know)
2. [ ] Resource attribute schema (classification, sensitivity)
3. [ ] Contextual attribute capture (time, location, device)
4. [ ] ABAC policy engine
5. [ ] Policy evaluation in permission checks
6. [ ] ABAC policy management UI

**Technical Tasks**:
- Extend Cognito user attributes: `clearanceLevel`, `sciCompartments`, `needToKnow`
- Add security metadata fields: `classification`, `requiredClearance`, `requiredCompartments`
- Build ABAC policy evaluator with Zod schema validation
- Integrate ABAC checks into `canAccess()` function
- Create policy builder UI

**Acceptance Criteria**:
- ✅ Users with SECRET clearance cannot access TOP SECRET resources
- ✅ Users without required SCI compartments are denied access
- ✅ Contextual policies (time-based, location-based) evaluate correctly
- ✅ ABAC policies can be simulated before application

**Story Points**: 8

---

### Week 4: Data Classification

**Deliverables**:
1. [ ] Classification levels: UNCLASSIFIED, CUI, SECRET, TOP SECRET
2. [ ] Marking categories: PII, PHI, FIN, LEO, FOUO, NOFORN, REL TO, SCI
3. [ ] Banner marking generation
4. [ ] Portion marking support
5. [ ] Classification UI components (badges, indicators)
6. [ ] Declassification workflow

**Technical Tasks**:
- Create classification enum and validation
- Build marking badge component with color coding
- Implement banner marking generator (top/bottom of document)
- Add portion marking to text fields
- Create classification change workflow with approval

**Acceptance Criteria**:
- ✅ All entities display correct classification level
- ✅ Banner markings automatically generated
- ✅ Portion markings can be applied to paragraphs
- ✅ Classification changes require approval
- ✅ Downgrade/declassification has audit trail

**Story Points**: 10

---

## Phase 3: Data Lineage Security (Weeks 5-6) - 21 Story Points

**Goal**: Propagate security classifications through data transformations automatically.

### Week 5: Lineage Propagation

**Deliverables**:
1. [ ] Marking propagation algorithm (via ontology edges)
2. [ ] Classification escalation rules (not de-escalation)
3. [ ] Inherited marking tracking (`inheritedMarkings[]`)
4. [ ] Derived dataset security calculation
5. [ ] Lineage visualization with security overlay
6. [ ] Propagation preview before changes

**Technical Tasks**:
- Build graph traversal for marking propagation
- Implement max(classifications) for derived datasets
- Track marking source and path in `inheritedMarkings`
- Add security layer to ontology viewer
- Create "impact preview" for marking changes

**Acceptance Criteria**:
- ✅ Markings automatically propagate through edges (e.g., dataset → derived dataset)
- ✅ Classification level never decreases (only escalates or stays same)
- ✅ Inherited markings show source entity and path
- ✅ Lineage graph shows security boundaries visually
- ✅ Users can preview security impact before applying changes

**Story Points**: 13

---

### Week 6: Column-Level Security & Cross-Domain Solutions

**Deliverables**:
1. [ ] Sensitive field identification in schemas
2. [ ] Column-level marking application
3. [ ] Selective column removal for sanitization
4. [ ] Query-time column filtering
5. [ ] Cross-domain solution (CDS) integration points
6. [ ] Data sanitization workflows

**Technical Tasks**:
- Extend ontology schema to support field-level markings
- Implement column filter in DynamoDB query responses
- Build sanitization pipeline (remove PII columns)
- Create CDS export workflow with approval
- Add "sanitize" operation to data services

**Acceptance Criteria**:
- ✅ Individual columns can have markings independent of dataset
- ✅ Users without PII marking cannot see PII columns (query-time filter)
- ✅ Sanitized datasets have PII columns removed before export
- ✅ CDS exports require approval and full audit trail
- ✅ Column-level security works with Kendra search

**Story Points**: 8

---

## Phase 4: Audit & Compliance (Weeks 7-8) - 16 Story Points

**Goal**: Complete audit logging and NIST 800-53 Rev 5 compliance implementation.

### Week 7: Comprehensive Audit Logging

**Deliverables**:
1. [ ] Real-time audit event capture
2. [ ] Audit log DynamoDB table with GSIs
3. [ ] CloudTrail integration for AWS API calls
4. [ ] Audit dashboard (recent activity, failed attempts)
5. [ ] Audit search and filtering
6. [ ] Audit log export for compliance

**Technical Tasks**:
- Create `captify-core-audit-log` table
- Indexes: `userId-timestamp`, `entityId-timestamp`, `action-timestamp`, `success-timestamp`
- Implement audit middleware on all API routes
- Stream CloudTrail to DynamoDB
- Build audit viewer UI with filters

**Acceptance Criteria**:
- ✅ All access attempts logged (success and failure)
- ✅ Permission changes logged with before/after state
- ✅ Data exports and downloads logged
- ✅ User authentication events logged
- ✅ Audit logs cannot be modified (append-only)
- ✅ Audit logs retained for 7 years (S3 Glacier)

**Story Points**: 8

---

### Week 8: NIST 800-53 Rev 5 Compliance

**Deliverables**:
1. [ ] Control mapping document (224 controls)
2. [ ] Security Hub integration for automated checks
3. [ ] Config rules for continuous compliance
4. [ ] Compliance dashboard with control status
5. [ ] Evidence collection automation
6. [ ] POA&M (Plan of Action & Milestones) management

**Technical Tasks**:
- Map each NIST control to AWS service or application implementation
- Enable Security Hub NIST 800-53 standard
- Configure Config rules for automated compliance checks
- Build compliance dashboard showing control status
- Create evidence collection scripts

**Acceptance Criteria**:
- ✅ All 224 NIST controls mapped to implementations
- ✅ Security Hub compliance score > 95%
- ✅ Automated compliance checks run daily
- ✅ Compliance dashboard shows control status in real-time
- ✅ Evidence automatically collected for audits
- ✅ POA&M tracks remediation of failed controls

**Story Points**: 8

---

## Phase 5: Advanced Features (Weeks 9-10) - 21 Story Points

**Goal**: Enterprise-grade security features for usability and monitoring.

### Week 9: Permission Simulation & Security Monitoring

**Deliverables**:
1. [ ] "Check access" tool for any user
2. [ ] Permission inheritance visualization
3. [ ] "What if" permission simulation
4. [ ] Marking change impact analysis
5. [ ] Security anomaly detection
6. [ ] Failed access attempt monitoring
7. [ ] Privilege escalation detection

**Technical Tasks**:
- Build permission simulator (evaluate without executing)
- Create access graph visualization
- Implement anomaly detection (unusual access patterns)
- Failed attempt dashboard
- Privilege escalation alerts

**Acceptance Criteria**:
- ✅ Admins can check access for any user on any resource
- ✅ Permission inheritance visualized in graph
- ✅ Marking changes can be simulated before application
- ✅ Anomalies detected and alerted (e.g., access spike, unusual time)
- ✅ Failed attempts tracked and monitored
- ✅ Privilege escalation attempts trigger alerts

**Story Points**: 13

---

### Week 10: Encryption Management & Final Polish

**Deliverables**:
1. [ ] KMS key management UI
2. [ ] Key rotation scheduling
3. [ ] Encryption at rest verification
4. [ ] Envelope encryption for sensitive fields
5. [ ] Encryption status dashboard
6. [ ] Security documentation (admin guide, user guide)

**Technical Tasks**:
- Build KMS key viewer/manager UI
- Implement automatic key rotation
- Verify all DynamoDB tables and S3 buckets encrypted
- Add field-level envelope encryption for SSN, credit cards
- Create encryption status report

**Acceptance Criteria**:
- ✅ All sensitive data encrypted at rest with KMS
- ✅ TLS 1.3 enforced for all data in transit
- ✅ Key rotation automated (90-day cycle)
- ✅ Encryption status visible in dashboard
- ✅ Field-level encryption for PII/PHI
- ✅ Security documentation complete

**Story Points**: 8

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **Cognito attribute limits** | Medium | High | Use DynamoDB for extended attributes, reference by ID |
| **Performance impact of ABAC** | Medium | Medium | Cache policy evaluations, optimize attribute lookups |
| **Complexity of lineage propagation** | High | Medium | Start with simple propagation, iterate based on feedback |
| **User resistance to security controls** | Medium | High | Extensive training, clear error messages, permission simulation |
| **AWS service limits (CloudTrail, Config)** | Low | Medium | Monitor quotas, request increases proactively |
| **NIST control evidence collection** | Medium | High | Automate evidence collection from day 1 |

---

## Dependencies

### External Dependencies
1. **AWS GovCloud Account**: Required for IL5 compliance
2. **Security Hub**: Must be enabled in all regions
3. **CloudTrail**: Organization trail required
4. **KMS**: Customer-managed keys must be provisioned
5. **Cognito**: User pool and identity pool configured

### Internal Dependencies
1. **Ontology System**: Security metadata stored on ontology entities
2. **API Middleware**: Permission checks on every request
3. **Core Services**: Security service integrated across all apps
4. **Audit Logging**: Real-time event capture in all services

### Team Dependencies
1. **Security Team**: NIST control mapping, compliance review
2. **Operations Team**: KMS key provisioning, CloudTrail setup
3. **Development Team**: API middleware integration, UI components
4. **Compliance Team**: Evidence review, audit support

---

## Success Metrics

### Security Metrics
- **Unauthorized Access Attempts**: 0 successful breaches
- **Audit Log Coverage**: 100% of operations logged
- **Encryption Coverage**: 100% of sensitive data encrypted
- **Permission Evaluation Time**: < 50ms per request

### Compliance Metrics
- **NIST Control Implementation**: 224/224 controls (100%)
- **Security Hub Score**: > 95%
- **Audit Finding Response Time**: < 24 hours
- **Evidence Collection**: Automated for 100% of controls

### Performance Metrics
- **Marking Propagation**: < 1 second for 100-node lineage
- **Permission Check Latency**: < 50ms per request
- **Audit Log Ingestion**: < 100ms per event
- **Compliance Dashboard Load**: < 2 seconds

### Usability Metrics
- **User Training Completion**: 100% of users
- **Permission Simulation Usage**: > 50 uses per week
- **Access Request Resolution Time**: < 1 hour
- **Security Incident False Positives**: < 5%

---

## Rollout Strategy

### Phase 1: Development Environment (Week 1-2)
- Implement in dev environment
- Test with synthetic data
- Iterate based on developer feedback

### Phase 2: Staging Environment (Week 3-6)
- Deploy to staging with real schemas
- Test with limited user group
- Load testing and performance tuning

### Phase 3: Production Pilot (Week 7-8)
- Enable for pilot group (10% of users)
- Monitor closely for issues
- Collect feedback and iterate

### Phase 4: Full Production (Week 9-10)
- Roll out to all users
- Continuous monitoring and improvement
- Complete documentation and training

---

## Post-Implementation

### Ongoing Activities
1. **Security Monitoring**: 24/7 monitoring of audit logs and anomalies
2. **Compliance Review**: Quarterly NIST control review
3. **User Training**: Onboarding security training for all new users
4. **Policy Updates**: Annual review and update of ABAC policies
5. **Penetration Testing**: Semi-annual security assessments

### Continuous Improvement
1. **User Feedback**: Monthly security usability survey
2. **Performance Optimization**: Quarterly performance review
3. **Feature Enhancements**: Bi-annual feature planning
4. **Threat Modeling**: Annual threat assessment and updates

---

**Created**: 2025-11-09
**Owner**: Security Team
**Status**: Draft
**Next Review**: 2025-11-16
