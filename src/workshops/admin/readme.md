# Admin Application

## Vision

The Admin application provides centralized platform administration for managing users, applications, system settings, and monitoring platform health. It enables administrators to control access, configure applications, and maintain the Captify platform ecosystem.

## Core Principles

1. **Centralized Control** - Single interface for all platform administration tasks
2. **Security First** - Role-based access control with AWS Cognito integration
3. **Reuse Core Services** - Leverage existing `@captify-io/core` services (Cognito, DynamoDB, API client)
4. **Consistent UX** - Follow the spaces app pattern (sidebar + content layout)
5. **AWS-Native** - Maximize AWS service usage (Cognito for users, DynamoDB for metadata, QuickSight for analytics)
6. **Audit Trail** - Track all administrative actions for compliance and security

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Admin Application                       │
│                    (platform/src/app/admin)                 │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
┌───────▼──────┐    ┌─────────▼────────┐    ┌──────▼──────┐
│  User Mgmt   │    │  App Mgmt        │    │  System     │
│  (Cognito)   │    │  (DynamoDB)      │    │  Monitoring │
└──────────────┘    └──────────────────┘    └─────────────┘
        │                     │                     │
        └─────────────────────┴─────────────────────┘
                              │
                              ▼
                ┌─────────────────────────┐
                │   @captify-io/core      │
                │  - Cognito Service      │
                │  - DynamoDB Service     │
                │  - API Client           │
                │  - UI Components        │
                └─────────────────────────┘
```

### Data Flow

1. **User Management**: Admin UI → API Client → Cognito Service → AWS Cognito User Pool
2. **User Metadata**: Admin UI → API Client → DynamoDB Service → core-user table
3. **Application Registry**: Admin UI → App Registry API → File-based config.json discovery
4. **System Monitoring**: Admin UI → CloudWatch Service → AWS CloudWatch Logs/Metrics

## Key Features

1. **User Management** (P0)
   - List all users with pagination and filtering
   - View user details and group memberships
   - Enable/disable user accounts
   - Reset passwords and manage credentials
   - Add/remove users from Cognito groups
   - Sync user metadata to DynamoDB

2. **Application Management** (P0)
   - View all registered applications
   - Configure application settings
   - Manage application access control
   - View application health and status

3. **Group & Role Management** (P1)
   - List all Cognito groups
   - Create and manage custom groups
   - Assign role-based permissions
   - Bulk user group assignments

4. **System Monitoring** (P1)
   - Platform health dashboard
   - User activity logs
   - Application metrics
   - Error tracking and alerts

5. **Security & Audit** (P2)
   - Audit log viewer
   - Security event monitoring
   - Access control review
   - Compliance reporting

6. **Configuration Management** (P2)
   - Platform-wide settings
   - Feature flags
   - Integration configurations
   - Environment variables management

## Technology Stack

### Frontend
- **React 19.1.1** - UI framework
- **Next.js 15.5.2** - Full-stack framework
- **TypeScript** - Type safety
- **Tailwind CSS v4** - Styling
- **shadcn/ui** - UI components (from `@captify-io/core`)

### Backend Services (via `@captify-io/core`)
- **AWS Cognito** - User authentication and management
- **AWS DynamoDB** - User metadata storage (`core-user` table)
- **API Client** - Unified service communication layer
- **App Registry** - File-based application discovery

### AWS Services
- **Cognito User Pool** - User directory and authentication
- **DynamoDB** - Metadata storage
- **CloudWatch** - Logs and metrics (future)
- **QuickSight** - Analytics dashboards (future)

## Success Criteria

### Phase 1: Foundation (Weeks 1-2)
- ✅ User management fully functional (CRUD operations)
- ✅ Integration with AWS Cognito complete
- ✅ Admin UI follows spaces pattern (sidebar + content)
- ✅ Role-based access control enforced
- ✅ All tests passing (95%+ coverage)

### Phase 2: Application Management (Weeks 3-4)
- ✅ Application registry integration complete
- ✅ Application CRUD operations working
- ✅ Access control management functional
- ✅ Application health monitoring implemented

### Phase 3: Advanced Features (Weeks 5-6)
- ✅ Group management fully functional
- ✅ System monitoring dashboard live
- ✅ Audit logging implemented
- ✅ QuickSight dashboards embedded

### Overall Success Metrics
- **User Adoption**: 100% of admins using the admin panel
- **Efficiency**: <5 seconds to complete common admin tasks
- **Reliability**: 99.9% uptime for admin operations
- **Security**: Zero unauthorized access incidents
- **Test Coverage**: ≥90% for all admin services

## Architecture Decisions

### 1. User Management Strategy
**Decision**: Use AWS Cognito as primary user directory with DynamoDB for extended metadata

**Rationale**:
- Cognito provides built-in authentication, MFA, and security features
- Core Cognito service already exists in `@captify-io/core`
- DynamoDB used for application-specific user metadata (spaces, preferences, etc.)
- Separation of concerns: Auth in Cognito, app data in DynamoDB

### 2. Application Registry
**Decision**: Use existing file-based app registry (config.json discovery) rather than database storage

**Rationale**:
- Application configurations are deployment artifacts, not runtime data
- File-based approach keeps configs versioned with code
- Existing app-registry service works well
- Database would add complexity without benefits

### 3. UI Architecture
**Decision**: Follow spaces app pattern (sidebar + content layout)

**Rationale**:
- Consistent UX across platform applications
- Proven pattern with role-based navigation
- Reusable components from `@captify-io/core`
- Users already familiar with the pattern

### 4. Service Layer
**Decision**: Create thin admin service wrappers around core services, not duplicate implementations

**Rationale**:
- DRY principle - reuse existing Cognito, DynamoDB services
- Simpler codebase with fewer bugs
- Easier maintenance and testing
- Admin-specific logic only in wrappers

## Related Documentation

- **Workshop Index**: [/opt/captify-apps/workshops/index.md](../index.md)
- **Platform Architecture**: [/opt/captify-apps/CLAUDE.md](../../CLAUDE.md)
- **Core Library**: [/opt/captify-apps/core/README.md](../../core/README.md)
- **Workshop Process**: [/opt/captify-apps/workshops/readme.md](../readme.md)
- **User Stories**: [./user-stories/01-user-management.yaml](./user-stories/01-user-management.yaml)

---

**Created**: 2025-11-03
**Last Updated**: 2025-11-03
**Status**: Planning Complete, Implementation Starting
