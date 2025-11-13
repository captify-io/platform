# Control Panel - Foundry Management Interface

## Vision

Build a **unified management interface** for all foundry items, providing administrators and operations teams with centralized control over security, ontology, data products, models, tools, and infrastructure. The Control Panel is the "mission control" for the entire Captify platform.

**Key Insight**: Don't scatter management UIs across applications. Centralize all foundry management in one place.

## Core Principles

1. **Single Pane of Glass**: All foundry management in one interface
2. **Role-Based Access**: Admins, operations, and read-only views
3. **Real-Time Monitoring**: Live dashboards and alerts
4. **Security First**: Security management is the foundation
5. **Agent-Friendly**: Expose management capabilities to AI agents via tools
6. **Audit Everything**: Complete audit trail for all management operations

## Architecture Overview

```
┌────────────────────────────────────────────────────────────────┐
│                      CONTROL PANEL UI                           │
│             /control-panel/* (Next.js App)                      │
│                                                                 │
│  Navigation:                                                    │
│  ├── Dashboard (Overview)                                       │
│  ├── Security ⭐                                                │
│  │   ├── Organizations                                          │
│  │   ├── Markings & Categories                                 │
│  │   ├── Clearances & Compartments                            │
│  │   ├── Security Policies (ABAC)                              │
│  │   ├── Audit Logs                                            │
│  │   └── Compliance Dashboard                                  │
│  ├── Ontology                                                   │
│  │   ├── Object Types                                           │
│  │   ├── Link Types                                             │
│  │   ├── Action Types                                           │
│  │   └── Schema Management                                      │
│  ├── Data Products                                              │
│  │   ├── Product Catalog                                        │
│  │   ├── Quality Monitoring                                     │
│  │   └── Lineage Viewer                                         │
│  ├── Models                                                      │
│  │   ├── Model Registry                                         │
│  │   ├── Endpoints                                              │
│  │   └── Performance Metrics                                    │
│  ├── Tools                                                       │
│  │   ├── Agent Tools                                            │
│  │   ├── Tool Registry                                          │
│  │   └── Tool Analytics                                         │
│  └── Infrastructure                                             │
│      ├── AWS Resources                                          │
│      ├── Monitoring                                             │
│      └── Cost Analysis                                          │
└────────────────────────────────────────────────────────────────┘
                             ↓ API Calls
┌────────────────────────────────────────────────────────────────┐
│                   ONTOLOGY SERVICE API                          │
│          core/src/services/ontology                            │
│                                                                 │
│  All management operations go through ontology:                │
│  - core.organization.*                                          │
│  - core.marking.*                                               │
│  - core.security-policy.*                                       │
│  - core.object-type.*                                           │
│  - core.link-type.*                                             │
│  - etc.                                                         │
└────────────────────────────────────────────────────────────────┘
```

## Key Features

### Phase 1: Security Management (Weeks 1-2) ⭐ PRIORITY

**Goal**: Centralized security management for all foundry items.

#### Feature #1: Organization Management
- Create/update/delete organizations
- Assign users to organizations
- Configure organization settings (default classification, cross-org sharing)
- View organization metrics (member count, resource count)

#### Feature #2: Marking Management
- Create marking categories (Sensitive Information, Financial, etc.)
- Create markings within categories (PII, PHI, FIN, etc.)
- Assign marking members and managers
- Configure marking rules (propagation, justification requirements)
- Visual marking hierarchy

#### Feature #3: Clearance Management
- Assign clearance levels to users (UNCLASS, CUI, SECRET, TS)
- Manage SCI compartments
- Track clearance expiration dates
- Bulk clearance updates
- Clearance history and audit trail

#### Feature #4: Security Policy Management (ABAC)
- Create attribute-based access policies
- Time-based access rules (business hours only)
- Location-based access rules (on-site only)
- Contextual policies (device type, network)
- Policy simulation and testing
- Policy priority management

#### Feature #5: Audit Log Viewer
- Real-time audit log table
- Advanced filtering (user, action, entity, success/failure, date range)
- Export to CSV/JSON
- Failed access attempt monitoring
- Security event details
- Alert configuration

#### Feature #6: Compliance Dashboard
- NIST 800-53 Rev 5 control status
- Security Hub integration (live compliance score)
- Evidence collection status
- POA&M (Plan of Action & Milestones) tracking
- Compliance reports (PDF generation)
- Control detail viewer

### Phase 2: Ontology Management (Weeks 3-4)

#### Feature #7: Object Type Management
- Create/update/delete object types
- Schema editor (property definitions)
- Visual schema builder
- Example data editor
- Table name and index configuration
- Object type versioning

#### Feature #8: Link Type Management
- Create/update/delete link types
- Define link directionality
- Cardinality rules (one-to-one, one-to-many, many-to-many)
- Link validation rules
- Visual link relationship viewer

#### Feature #9: Action Type Management
- Create/update/delete action types
- Input/output schema definition
- Action validation rules
- Execution monitoring
- Action performance metrics

### Phase 3: Data Product Management (Weeks 5-6)

#### Feature #10: Data Product Catalog
- Browse all data products
- Product details (schema, SLOs, consumers)
- Quality score dashboard
- Lineage visualization
- Product versioning
- Product access requests

#### Feature #11: Quality Monitoring
- Data quality metrics (completeness, accuracy, timeliness, etc.)
- Quality score trends
- Anomaly detection and alerts
- Quality rules management
- Profiling reports

### Phase 4: Model & Tool Management (Weeks 7-8)

#### Feature #12: Model Registry
- Browse deployed models
- Model details (endpoint, version, metrics)
- Endpoint management
- Performance monitoring
- Cost analysis
- Model versioning

#### Feature #13: Tool Registry
- Browse all agent tools
- Tool details (schema, usage, analytics)
- Tool versioning
- Tool testing interface
- Tool documentation editor

### Phase 5: Infrastructure Management (Weeks 9-10)

#### Feature #14: AWS Resource Viewer
- DynamoDB tables (status, metrics, costs)
- S3 buckets (usage, costs)
- Lambda functions (invocations, errors)
- KMS keys (rotation status)
- CloudWatch dashboards

#### Feature #15: Monitoring & Alerts
- System health dashboard
- Performance metrics
- Error rate monitoring
- Alert configuration
- Incident management

## Technology Stack

### Frontend
- **React 19** + **Next.js 15**
- **Tailwind CSS v4**: Styling
- **shadcn/ui**: Component library
- **@tanstack/react-table**: Data tables
- **recharts**: Charts and visualizations
- **@xyflow/react**: Graph visualizations

### Backend
- **Ontology Service**: All CRUD operations
- **AWS SDK v3**: Direct AWS service calls
- **Real-time**: WebSocket for live updates

### Authentication
- **NextAuth.js 5**: Session management
- **Cognito**: User authentication
- **RBAC**: Role-based access control

## Access Control

### Roles

| Role | Access Level | Capabilities |
|------|-------------|--------------|
| **Platform Admin** | Full access | All control panel features, security management |
| **Operations** | Read/write | Operational features, no security policy changes |
| **Security Admin** | Security only | All security features, no infrastructure changes |
| **Analyst** | Read-only | View-only access to dashboards and reports |

### Permission Requirements

- **Security Features**: Requires `captify-admins` or `captify-security-admins` group
- **Ontology Features**: Requires `captify-admins` or `captify-operations` group
- **Data Product Features**: Requires `captify-operations` group
- **Infrastructure Features**: Requires `captify-admins` group
- **Dashboards**: All authenticated users (filtered by permissions)

## UI/UX Principles

### 1. Progressive Disclosure
- Start with overview dashboards
- Drill down into details on demand
- Hide complexity until needed

### 2. Contextual Actions
- Actions always available in context
- Bulk operations for efficiency
- Keyboard shortcuts for power users

### 3. Real-Time Feedback
- Live data updates via WebSocket
- Optimistic UI updates
- Clear loading and error states

### 4. Audit Everything
- Every management operation logged
- "Who changed what when" always visible
- Rollback capabilities where possible

### 5. Mobile-Responsive
- Desktop-first, but mobile-friendly
- Responsive tables with horizontal scroll
- Touch-friendly controls

## Success Criteria

### Usability
- ✅ All foundry management tasks centralized
- ✅ < 3 clicks to any management feature
- ✅ Real-time updates visible within 500ms
- ✅ Clear error messages with resolution steps
- ✅ Keyboard shortcuts for all major actions

### Performance
- ✅ Dashboard loads in < 2 seconds
- ✅ Table pagination < 500ms
- ✅ Real-time updates < 500ms latency
- ✅ Export operations < 5 seconds for 10k rows

### Security
- ✅ Role-based access enforced
- ✅ All management operations audited
- ✅ Session timeout after 15 minutes idle
- ✅ MFA required for sensitive operations

### Adoption
- ✅ 100% of admins use Control Panel daily
- ✅ 0 management operations outside Control Panel
- ✅ < 1 hour training time for new admins
- ✅ > 90% user satisfaction score

## Related Documentation

- [Features](./features/) - Detailed feature specifications
- [User Stories](./user-stories/) - YAML user stories with test scenarios
- [Implementation Roadmap](./plan/implementation-roadmap.md) - Phased delivery plan
- [Status](./status.md) - Current implementation progress
- [Security Integration](../security/INTEGRATION-PLAN.md) - How security integrates with Control Panel

---

**Created**: 2025-11-09
**Owner**: Platform Team
**Priority**: P0 (Critical Infrastructure)
**Timeline**: 10 weeks
**Status**: Planning
