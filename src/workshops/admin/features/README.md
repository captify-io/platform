# Admin Features - Complete Specification

**Last Updated**: 2025-11-04

This directory contains comprehensive feature specifications for all 10 admin features across 3 implementation phases.

## Feature Overview

### Phase 1: Foundation (18 story points)
Core admin functionality with user/group management and access requests.

| # | Feature | Priority | Story Points | AWS Services | Status |
|---|---------|----------|--------------|--------------|--------|
| 1 | [User Management](./01-user-management.md) | P0 | 5 | Cognito, DynamoDB | ✅ Complete |
| 2 | [Group Management](./02-group-management.md) | P0 | 3 | Cognito | 📝 Spec Complete |
| 3 | [Application Management](./03-application-management.md) | P0 | 5 | DynamoDB, STS, PM2 | 📝 Spec Complete |
| 4 | [Access Requests](./04-access-requests.md) | P1 | 5 | DynamoDB, SES, SNS | 📝 Spec Complete |

### Phase 2: Application & Access Control (18 story points)
Advanced access control, monitoring, and database management.

| # | Feature | Priority | Story Points | AWS Services | Status |
|---|---------|----------|--------------|--------------|--------|
| 5 | [App Access Control](./05-app-access-control.md) | P0 | 5 | DynamoDB, Cognito, STS, IAM | 📝 Spec Complete |
| 6 | [System Monitoring](./06-system-monitoring.md) | P1 | 8 | CloudWatch, PM2, SNS | 📝 Spec Complete |
| 7 | [Database Management](./07-database-management.md) | P1 | 5 | DynamoDB, S3, Ontology | 📝 Spec Complete |

### Phase 3: Compliance & Analytics (18 story points)
Audit logging, reporting, and platform configuration.

| # | Feature | Priority | Story Points | AWS Services | Status |
|---|---------|----------|--------------|--------------|--------|
| 8 | [Audit Logs](./08-audit-logs.md) | P0 | 5 | EventBridge, Lambda, DynamoDB, S3 | 📝 Spec Complete |
| 9 | [Reports](./09-reports.md) | P2 | 8 | Lambda, DynamoDB, CloudWatch, S3, SES | 📝 Spec Complete |
| 10 | [Settings](./10-settings.md) | P1 | 5 | DynamoDB, Parameter Store, Secrets Manager | 📝 Spec Complete |

**Total Story Points**: 54

## Feature Details

### 1. User Management (P0, 5 pts) ✅
**File**: [01-user-management.md](./01-user-management.md)

**Purpose**: Complete CRUD operations for user accounts with AWS Cognito integration.

**Key Capabilities**:
- Create, read, update, delete users
- Manage user groups and permissions
- List users with filtering and pagination
- AWS Cognito User Pool integration
- DynamoDB metadata storage

**AWS Services**: Cognito User Pool, DynamoDB (core-user)

**Status**: ✅ Service implemented in `core/src/services/admin/user.ts`

---

### 2. Group Management (P0, 3 pts)
**File**: [02-group-management.md](./02-group-management.md)

**Purpose**: Manage AWS Cognito groups and group memberships for role-based access control.

**Key Capabilities**:
- Create/delete Cognito groups
- Add/remove users from groups
- List groups with member counts
- Standard groups: captify-admin, captify-operations, {app}-admin, {app}-user

**AWS Services**: Cognito User Pool

**Standard Groups**:
- `captify-admin` - Platform administrators
- `captify-operations` - Operations team
- `{app}-admin` - App-specific administrators (e.g., pmbook-admin)
- `{app}-user` - App-specific users (e.g., pmbook-user)

---

### 3. Application Management (P0, 5 pts)
**File**: [03-application-management.md](./03-application-management.md)

**Purpose**: Manage application configurations, dedicated Identity Pools, and health monitoring.

**Key Capabilities**:
- View/edit application configs
- Assign dedicated Identity Pools to apps
- Switch between shared/dedicated pools
- PM2 process health monitoring
- App metadata management

**AWS Services**: DynamoDB (core-app), STS (Identity Pools), PM2

**Identity Pool Architecture**:
```
Shared Identity Pool (default)         App-Specific Pools (optional)
- Platform services                    - pmbook-pool (isolation)
- Default apps                         - aihub-pool (custom IAM)
                                       - mi-pool (cost tracking)
```

**Use Cases for Dedicated Pools**:
- Resource isolation (sensitive data)
- Custom IAM policies per app
- Cost tracking by application
- Compliance requirements

---

### 4. Access Requests (P1, 5 pts)
**File**: [04-access-requests.md](./04-access-requests.md)

**Purpose**: Self-service workflow for users to request application access with admin approval.

**Key Capabilities**:
- User submits access request for app
- Admin reviews request (user profile, app groups)
- Approve → Auto-add user to required groups
- Deny → Send notification with reason
- Request history and filtering

**AWS Services**: DynamoDB (core-access-request), SES (emails), SNS (notifications)

**Workflow**:
1. User requests app access with reason
2. Admins notified via email/SNS
3. Admin reviews: user info + app requirements
4. Approve → Add to groups, send confirmation
5. Deny → Send denial email with reason

---

### 5. App Access Control (P0, 5 pts)
**File**: [05-app-access-control.md](./05-app-access-control.md)

**Purpose**: Manage which groups can access which applications and configure Identity Pool assignments.

**Key Capabilities**:
- Access matrix: Apps × Groups
- Assign/remove group access to apps
- Identity Pool management per app
- Access rules (IP whitelist, MFA, time windows)
- Validate user access to apps

**AWS Services**: DynamoDB (core-app), Cognito, STS, IAM

**Access Matrix View**:
```
                 captify-admin  pmbook-admin  pmbook-user
Platform            ✓              -             -
PMBook              ✓              ✓             ✓
AIHub               ✓              -             -
MI                  ✓              -             -
```

---

### 6. System Monitoring (P1, 8 pts)
**File**: [06-system-monitoring.md](./06-system-monitoring.md)

**Purpose**: Real-time platform health monitoring with CloudWatch integration and alerts.

**Key Capabilities**:
- Platform health dashboard
- PM2 process monitoring (CPU, memory, uptime)
- AWS service metrics (DynamoDB, S3, Cognito)
- CloudWatch logs viewer
- Alerts with SNS notifications
- Performance trends

**AWS Services**: CloudWatch (metrics & logs), PM2, SNS (alerts), DynamoDB (metric storage)

**Monitored Components**:
- Platform applications (PM2 processes)
- DynamoDB tables (capacity, throttles)
- S3 buckets (storage, requests)
- Cognito (sign-ins, failures)
- Aurora (connections, latency)

---

### 7. Database Management (P1, 5 pts)
**File**: [07-database-management.md](./07-database-management.md)

**Purpose**: Safe DynamoDB table management with query builder and maintenance tools.

**Key Capabilities**:
- Browse DynamoDB tables
- Visual query builder (scan, query, getItem)
- Item viewer/editor with validation
- Export table data (CSV/JSON)
- Backup/restore operations
- Table metrics from CloudWatch

**AWS Services**: DynamoDB, Ontology Service, S3 (exports), CloudWatch (metrics)

**Safety Features**:
- Schema validation via Ontology
- Confirmation for destructive operations
- Query result limits (1000 items max)
- Audit logging of all operations
- Read-only mode toggle

---

### 8. Audit Logs (P0, 5 pts)
**File**: [08-audit-logs.md](./08-audit-logs.md)

**Purpose**: Comprehensive audit trail for compliance, security monitoring, and troubleshooting.

**Key Capabilities**:
- Log all admin actions (user, group, app, database)
- Search and filter logs
- Event details (before/after values)
- Export logs (CSV/JSON)
- Auto-archival to S3 after 90 days
- Compliance reporting

**AWS Services**: EventBridge, Lambda, DynamoDB (core-audit-log), S3 (archive), Glacier

**Event Categories**:
- User Management (create, update, delete)
- Group Management (add/remove members)
- Application Management (config changes)
- Access Control (permission changes)
- Database Operations (query, update, delete)
- System Events (auth failures, errors)

**Retention**:
- Hot storage: 90 days (DynamoDB)
- Cold storage: 1 year (S3)
- Archive: 7 years (Glacier)

---

### 9. Reports (P2, 8 pts)
**File**: [09-reports.md](./09-reports.md)

**Purpose**: Generate analytics reports with scheduled delivery and export capabilities.

**Key Capabilities**:
- Pre-built report templates
- Custom report builder
- Scheduled reports (daily/weekly/monthly)
- Email delivery with PDF/CSV/Excel
- Report visualizations (charts, tables, metrics)
- User activity, app usage, security, compliance reports

**AWS Services**: Lambda (generation), DynamoDB, CloudWatch, S3 (storage), SES (delivery), EventBridge (scheduling)

**Report Types**:
- **User Activity**: Sign-ins, active users, session duration
- **Application Usage**: Access counts, top users, feature adoption
- **System Performance**: Response times, error rates, uptime
- **Security**: Failed auth, privilege escalations, violations
- **Compliance**: Audit summary, data retention, policy compliance
- **Cost**: AWS service usage, resource consumption

---

### 10. Settings (P1, 5 pts)
**File**: [10-settings.md](./10-settings.md)

**Purpose**: Platform-wide configuration and feature flag management.

**Key Capabilities**:
- General settings (platform name, timezone, session timeout)
- Security settings (password policy, MFA, IP whitelist)
- Authentication settings (Cognito, OAuth, SSO)
- Email settings (SES, templates)
- Feature flags (enable/disable features, gradual rollouts)
- Integration settings (API keys, webhooks)

**AWS Services**: DynamoDB (core-setting), Parameter Store, Secrets Manager, Cognito

**Feature Flags**:
- Gradual rollouts (percentage-based)
- Per-app feature toggles
- Per-group feature access
- Beta feature management

**Setting Categories**:
- General (platform name, timezone, date format)
- Security (password policy, MFA, IP whitelist)
- Auth (Cognito, OAuth, SAML)
- Email (SES, templates, sender addresses)
- Features (core features, beta features, experimental)
- Integrations (API keys, webhooks, external services)

---

## Common Patterns

### Access Control
All admin features require `captify-admin` or `captify-operations` group membership. Implemented via `hasAdminAccess()` function in services.

### Audit Trail
All features log actions to audit service (Feature #8). Includes actor, action, resource, before/after values, and timestamp.

### AWS Integration
Features heavily integrate with AWS services:
- **Cognito**: User/group management
- **DynamoDB**: Data storage with GSIs
- **CloudWatch**: Metrics and logging
- **S3**: File storage, exports, backups
- **SES**: Email notifications
- **SNS**: Real-time alerts
- **EventBridge**: Event routing, scheduling
- **Lambda**: Async processing

### UI Patterns
All features follow consistent UI patterns:
- Sidebar navigation (shadcn Sidebar components)
- Content area with PageHeader
- Tables with sorting/filtering/pagination
- Modal dialogs for forms
- EmptyState for no data
- Loading states and error handling

### Data Model
Common DynamoDB patterns:
- Partition key: Entity ID
- Sort key: Timestamp or composite key
- GSIs: For common queries (userId, status, createdAt)
- TTL: Auto-deletion for temporary data
- Audit fields: createdBy, createdAt, updatedBy, updatedAt

### Security
All features implement:
- Admin-only access control
- Input validation (Zod schemas)
- Confirmation for destructive operations
- Sensitive data redaction
- Audit logging
- Rate limiting

---

## Implementation Order

Recommended implementation order based on dependencies:

1. **User Management** (#1) - ✅ Complete
2. **Group Management** (#2) - Depends on #1
3. **Audit Logs** (#8) - Early implementation for compliance
4. **Application Management** (#3) - Depends on #1, #2
5. **Access Requests** (#4) - Depends on #1, #2, #3
6. **App Access Control** (#5) - Depends on #2, #3
7. **Settings** (#10) - Feature flags needed for other features
8. **System Monitoring** (#6) - Monitor implemented features
9. **Database Management** (#7) - Advanced admin tool
10. **Reports** (#9) - Requires data from all features

---

## Testing Strategy

Each feature requires:
1. **Unit tests** - Service layer (TDD approach)
2. **Integration tests** - API endpoints
3. **UI tests** - Component rendering and user interactions
4. **E2E tests** - Full workflows

YAML user stories drive test generation via `workshops/scripts/generate-tests-from-yaml.ts`.

---

## Deployment

All admin services are deployed to `core/src/services/admin/` for reusability across applications. UI components are in `platform/src/app/admin/components/`.

**Build Process**:
```bash
# 1. Build core library
cd /opt/captify-apps/core && npm run build

# 2. Build platform
cd /opt/captify-apps/platform && npm run build

# 3. Deploy via PM2
pm2 restart platform
```

---

## Success Criteria

- ✅ All 10 feature specs created
- ⏳ YAML user stories for all features
- ⏳ Services implemented with 90%+ test coverage
- ⏳ UI components with 80%+ test coverage
- ⏳ E2E tests for critical workflows
- ⏳ Admin panel accessible at captify.io/admin
- ⏳ All features functional in production

**Current Status**: 100% feature specs complete, 20% implementation complete
