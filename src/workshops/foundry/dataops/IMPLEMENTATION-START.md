# NextGen DataOps - Implementation Start

**Date**: 2025-11-06
**Status**: Ready to Build

## Clarifications Confirmed

### 1. Service Architecture Priority ✅
- **Build services in**: `core/src/services/aws` first
- **Next priority**: Databricks integration
- **Pattern**: AWS services → Databricks → Snowflake (later)

### 2. AI Capabilities Priority ✅
- **Priority 1**: Discovery agent (natural language search)
- **Priority 2**: Quality assistant (anomaly detection, explanation)
- **Priority 3**: Pipeline builder agent (auto-generate pipelines)

### 3. Quality Engine Depth ✅
- **Start**: Basic (schema validation, completeness, null checks)
- **Evolve**: Advanced (statistical profiling, anomaly detection, ML-based)
- **Future**: Expert (column-level lineage, semantic validation)

### 4. Compliance Requirements ✅
**CRITICAL**: IL5 NIST Rev 5 compliant environment

**Must Have (Phase 1)**:
- Classification management (U/C/S/TS) with proper labeling
- PII detection and masking (MANDATORY for IL5)
- Audit logging (complete trail, 7-year retention)
- Encryption at rest and in transit (AES-256, TLS 1.3)
- Access control (role-based, least privilege)

**Must Have (Phase 2)**:
- Policy engine (NIST 800-53 Rev 5 controls)
- STIG compliance tracking
- FedRAMP compliance reporting
- FISMA compliance documentation

**Key NIST 800-53 Rev 5 Controls to Implement**:
- **AC-3**: Access Enforcement
- **AC-4**: Information Flow Enforcement
- **AC-6**: Least Privilege
- **AU-2**: Audit Events
- **AU-3**: Content of Audit Records
- **AU-9**: Protection of Audit Information
- **CM-3**: Configuration Change Control
- **IA-2**: Identification and Authentication
- **SC-8**: Transmission Confidentiality
- **SC-13**: Cryptographic Protection
- **SC-28**: Protection of Information at Rest
- **SI-7**: Software, Firmware, and Information Integrity

## Implementation Approach

### No Mockups - Production Ready Code
- Build directly in `/opt/captify-apps/platform/src/app/dataops`
- Follow same pattern as `/ontology` app
- Production-quality TypeScript with strict types
- Full error handling
- Comprehensive logging

### Existing Ontology Nodes to Reuse

**Data-Related Nodes (Already Exist)**:
- `node-dataproduct` (type: dataproduct, category: data)
- `node-dataset` (type: dataset, category: data)
- `node-source` (type: source, category: data)
- `node-catalog` (type: catalog, category: data)
- `node-schema` (type: schema, category: data)
- `node-transform` (type: transform, category: data)
- `node-pipeline` (type: pipeline, category: technology)

**DO NOT CREATE**: These already exist!

### New Ontology Nodes Needed

**DataOps-Specific Nodes**:
1. **dataops-data-source** (external system - S3, Glue, Databricks)
2. **dataops-quality-rule** (validation rule)
3. **dataops-quality-check** (quality check result)
4. **dataops-lineage** (data lineage relationship)
5. **dataops-policy** (governance policy)
6. **dataops-classification** (data classification metadata)
7. **dataops-pii-field** (PII field metadata)
8. **dataops-compliance-check** (NIST compliance check)

**AWS Service Nodes** (for integration):
9. **aws-glue-database**
10. **aws-glue-table**
11. **aws-s3-bucket**
12. **aws-athena-table**
13. **aws-quicksight-dataset**

## Phase 1 Implementation Plan (This Week)

### Day 1: Foundation & Services
- [x] Create ontology nodes (dataops-* and aws-*)
- [ ] Create DynamoDB tables (dataops-data-source, dataops-quality-rule, etc.)
- [ ] Build core services in `core/src/services/aws`:
  - [ ] `dataSourceService.ts`
  - [ ] `qualityService.ts`
  - [ ] `lineageService.ts`
  - [ ] `complianceService.ts`

### Day 2: UI Shell & Data Source Management
- [ ] Create `/platform/src/app/dataops` directory structure
- [ ] Create `layout.tsx` (similar to ontology)
- [ ] Create `page.tsx` (main dashboard)
- [ ] Build data source list component
- [ ] Build data source detail component
- [ ] Integrate with AWS Glue catalog sync

### Day 3: Dataset Catalog
- [ ] Build dataset list component with filters
- [ ] Build dataset detail page (6 sections)
- [ ] Integrate Kendra for search
- [ ] Add quality scores to datasets
- [ ] Add classification badges

### Day 4: Quality & Compliance
- [ ] Build quality profiling service (Glue-based)
- [ ] Build PII detection service (Comprehend + regex)
- [ ] Build classification management
- [ ] Build audit logging middleware
- [ ] Build compliance dashboard

### Day 5: Testing & Deployment
- [ ] Write unit tests for services
- [ ] Write integration tests for UI
- [ ] Deploy to dev environment
- [ ] Test with sample data
- [ ] Document setup and usage

## File Structure

```
/opt/captify-apps/
├── core/src/services/aws/
│   ├── dataSourceService.ts       # NEW - Data source management
│   ├── qualityService.ts          # NEW - Quality profiling
│   ├── lineageService.ts          # NEW - Lineage tracking
│   ├── complianceService.ts       # NEW - NIST compliance
│   └── piiService.ts              # NEW - PII detection
│
├── core/src/types/
│   └── dataops.ts                 # NEW - DataOps types
│
└── platform/src/app/dataops/
    ├── layout.tsx                 # Layout with nav
    ├── page.tsx                   # Main dashboard
    ├── components/
    │   ├── data-source-list.tsx   # Data source list
    │   ├── data-source-detail.tsx # Data source profile
    │   ├── dataset-list.tsx       # Dataset catalog
    │   ├── dataset-detail.tsx     # Dataset profile
    │   ├── quality-dashboard.tsx  # Quality metrics
    │   ├── compliance-dashboard.tsx # NIST compliance
    │   └── classification-badge.tsx # Classification UI
    ├── hooks/
    │   ├── use-data-sources.ts
    │   ├── use-datasets.ts
    │   └── use-quality-metrics.ts
    └── config.json                # App config
```

## NIST 800-53 Rev 5 Implementation Checklist

### Access Control (AC)
- [ ] AC-3: Implement role-based access enforcement
- [ ] AC-4: Implement information flow control (classification-based)
- [ ] AC-6: Implement least privilege (read-only, editor, admin)

### Audit & Accountability (AU)
- [ ] AU-2: Define audit events (all CRUD operations)
- [ ] AU-3: Capture audit record content (who, what, when, where, outcome)
- [ ] AU-9: Protect audit logs (write-only, tamper-proof)
- [ ] AU-11: Audit retention (7 years minimum)

### Configuration Management (CM)
- [ ] CM-3: Track configuration changes with approval

### Identification & Authentication (IA)
- [ ] IA-2: Use platform authentication (Cognito MFA)

### System & Communications Protection (SC)
- [ ] SC-8: Encrypt data in transit (TLS 1.3)
- [ ] SC-13: Use FIPS 140-2 validated crypto (AWS KMS)
- [ ] SC-28: Encrypt data at rest (AES-256)

### System & Information Integrity (SI)
- [ ] SI-7: Verify data integrity (checksums, versioning)

## Ready to Build

**All planning complete. Starting implementation now.**

Next step: Create ontology nodes and DynamoDB tables.
