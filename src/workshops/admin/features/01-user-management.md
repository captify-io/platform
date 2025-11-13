# Feature: User Management

## Overview

Enable administrators to manage user accounts through AWS Cognito integration, including viewing, creating, updating, disabling, and deleting users. Provide user metadata storage in DynamoDB for application-specific data.

## Requirements

### Functional Requirements

1. **List Users**
   - Display paginated list of all users from Cognito User Pool
   - Filter users by status (active, disabled, unconfirmed)
   - Search users by email, name, or username
   - Show user groups and attributes
   - Support pagination for large user bases (10,000+ users)

2. **View User Details**
   - Display complete user profile (Cognito attributes)
   - Show group memberships
   - Display user status and account info
   - Show creation and last modified timestamps
   - Display user metadata from DynamoDB (if exists)

3. **Create User**
   - Create new user in Cognito User Pool
   - Set initial password (temporary or permanent)
   - Assign user to groups during creation
   - Validate email format and uniqueness
   - Create corresponding metadata record in DynamoDB

4. **Update User**
   - Update user attributes (name, email, phone, custom attributes)
   - Modify group memberships
   - Update user metadata in DynamoDB
   - Prevent email conflicts across users

5. **Enable/Disable User**
   - Enable disabled user accounts
   - Disable active user accounts (soft delete)
   - Invalidate sessions when disabling

6. **Delete User**
   - Permanently delete user from Cognito
   - Delete associated metadata from DynamoDB
   - Prevent self-deletion
   - Warn about data loss before deletion

7. **Reset Password**
   - Trigger password reset email
   - Set temporary password (admin only)
   - Force password change on next login

8. **Group Management**
   - Add user to Cognito groups
   - Remove user from groups
   - View all available groups
   - Bulk assign users to groups

### Non-Functional Requirements

1. **Performance**
   - User list loads in <500ms (50 users per page)
   - User detail loads in <200ms
   - Operations complete in <1 second
   - Support 10,000+ users without degradation

2. **Security**
   - Only users in 'captify-admin' or 'captify-operations' groups can access
   - Use temporary AWS credentials via Cognito Identity Pool
   - Audit log all administrative actions
   - Prevent privilege escalation
   - Validate all inputs to prevent injection attacks

3. **Scalability**
   - Pagination for large user lists
   - Efficient DynamoDB queries with GSIs
   - Caching for frequently accessed data
   - Rate limiting to prevent Cognito API throttling

4. **Reliability**
   - Graceful error handling
   - User-friendly error messages
   - Rollback on partial failures
   - Retry logic for transient errors

5. **Usability**
   - Intuitive UI following spaces pattern
   - Clear action buttons and confirmations
   - Responsive design (mobile-friendly)
   - Keyboard shortcuts for power users

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Admin UI (React)                         │
│         platform/src/app/admin/components/                  │
│  - user-list.tsx (table with pagination)                    │
│  - user-detail.tsx (view/edit form)                         │
│  - user-actions.tsx (enable/disable/delete)                 │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              User Service (Admin)                           │
│         platform/src/app/admin/services/user/               │
│  - user-service.ts (business logic)                         │
│  - types.ts (TypeScript interfaces)                         │
└─────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┴─────────────┐
                ▼                           ▼
┌──────────────────────────┐    ┌──────────────────────────┐
│   API Client             │    │   API Client             │
│   (@captify-io/core)     │    │   (@captify-io/core)     │
└──────────────────────────┘    └──────────────────────────┘
                │                           │
                ▼                           ▼
┌──────────────────────────┐    ┌──────────────────────────┐
│   Cognito Service        │    │   DynamoDB Service       │
│   (@captify-io/core)     │    │   (@captify-io/core)     │
└──────────────────────────┘    └──────────────────────────┘
                │                           │
                ▼                           ▼
┌──────────────────────────┐    ┌──────────────────────────┐
│   AWS Cognito            │    │   DynamoDB               │
│   User Pool              │    │   core-user table        │
└──────────────────────────┘    └──────────────────────────┘
```

### Data Flow

1. **List Users**: UI → User Service → API Client → Cognito Service → AWS Cognito → Response
2. **Get User Details**: UI → User Service → API Client → Cognito Service + DynamoDB Service → Merge Data → Response
3. **Update User**: UI → User Service → API Client → Cognito Service (attributes) + DynamoDB Service (metadata) → Response

## Data Model

### Cognito User Pool (AWS Managed)

User attributes stored in Cognito:
- `sub` (UUID) - Unique user identifier
- `email` - Email address (unique)
- `email_verified` - Email verification status
- `name` - Full name
- `phone_number` - Phone number (optional)
- `custom:role` - Application role (optional)
- `custom:tenantId` - Tenant ID (optional)
- Groups - Cognito group memberships

### DynamoDB Table: `core-user`

Extended user metadata:

```typescript
interface UserMetadata {
  id: string;                    // PK: Cognito sub (user ID)
  email: string;                 // GSI: email-index
  name: string;
  status: 'active' | 'disabled' | 'pending';  // GSI: status-index
  tenantId: string;              // Tenant association

  // Metadata
  preferences?: {
    theme?: 'light' | 'dark';
    notifications?: boolean;
  };

  // Spaces data
  spaces?: string[];             // Space IDs user is member of
  lastActivity?: string;         // ISO timestamp

  // Audit
  createdAt: string;             // ISO timestamp
  updatedAt: string;             // ISO timestamp
  createdBy: string;             // Admin user ID
  updatedBy?: string;            // Admin user ID
}
```

**Indexes**:
- Primary Key: `id` (Cognito sub)
- GSI: `email-index` (email) - For email lookups
- GSI: `status-index` (status) - For filtering by status

## API Actions

### getUserById(userId: string)

**Purpose**: Fetch user by Cognito ID, merge with DynamoDB metadata

**Input**:
- `userId: string` - Cognito sub (UUID)

**Output**:
```typescript
{
  // Cognito data
  id: string;
  email: string;
  name: string;
  status: 'active' | 'disabled';
  groups: string[];

  // DynamoDB metadata
  tenantId: string;
  preferences?: object;
  spaces?: string[];
  lastActivity?: string;
  createdAt: string;
  updatedAt: string;
}
```

**Example**:
```typescript
const user = await getUserById('user-123');
// Returns merged Cognito + DynamoDB data
```

### createUser(userData: CreateUserInput)

**Purpose**: Create new user in Cognito and DynamoDB

**Input**:
```typescript
interface CreateUserInput {
  email: string;
  name: string;
  password?: string;            // Optional: temp password
  groups?: string[];            // Initial groups
  tenantId: string;
  sendWelcomeEmail?: boolean;
}
```

**Output**:
```typescript
{
  id: string;                   // Generated Cognito sub
  email: string;
  name: string;
  status: 'pending' | 'active';
  createdAt: string;
}
```

**Example**:
```typescript
const newUser = await createUser({
  email: 'user@example.com',
  name: 'John Doe',
  groups: ['users'],
  tenantId: 'tenant-123',
  sendWelcomeEmail: true
});
```

### updateUser(userId: string, updates: UpdateUserInput)

**Purpose**: Update user attributes in Cognito and/or metadata in DynamoDB

**Input**:
```typescript
interface UpdateUserInput {
  name?: string;
  email?: string;
  phone?: string;
  groups?: string[];            // Replace group memberships
  preferences?: object;
  status?: 'active' | 'disabled';
}
```

**Output**:
```typescript
{
  id: string;
  ...updatedFields;
  updatedAt: string;
}
```

**Example**:
```typescript
const updated = await updateUser('user-123', {
  name: 'Jane Doe',
  groups: ['users', 'admins']
});
```

### deleteUser(userId: string)

**Purpose**: Permanently delete user from Cognito and DynamoDB

**Input**:
- `userId: string` - Cognito sub

**Output**:
```typescript
{
  deleted: boolean;
  userId: string;
}
```

**Example**:
```typescript
await deleteUser('user-123');
// User removed from Cognito and DynamoDB
```

### listUsers(options: ListUsersOptions)

**Purpose**: List users with pagination and filtering

**Input**:
```typescript
interface ListUsersOptions {
  limit?: number;               // Default: 50
  nextToken?: string;           // Pagination cursor
  status?: 'active' | 'disabled' | 'pending';
  search?: string;              // Email or name search
}
```

**Output**:
```typescript
{
  items: User[];
  nextToken?: string;           // For next page
  totalCount?: number;          // Total users (estimate)
}
```

**Example**:
```typescript
const users = await listUsers({
  limit: 50,
  status: 'active',
  search: 'john'
});
```

## UI/UX

### User List View

- Table with columns: Name, Email, Status, Groups, Last Activity, Actions
- Search bar (email/name)
- Status filter dropdown
- Pagination controls
- "Create User" button
- Bulk actions (future): Select multiple users for group assignment

### User Detail View

- User profile card (avatar, name, email, status)
- Attributes section (editable)
- Groups section (add/remove groups)
- Metadata section (preferences, spaces)
- Action buttons: Enable/Disable, Reset Password, Delete
- Audit trail (creation date, last modified)

### Create/Edit User Modal

- Form fields: Email, Name, Password (create only), Groups
- Validation feedback
- Submit/Cancel buttons
- Success/error toast notifications

## Implementation Notes

### Reuse Core Services

- **DO NOT** create new Cognito or DynamoDB clients
- **USE** `apiClient` from `@captify-io/core/lib/api`
- **WRAP** core services with admin-specific business logic

### Error Handling

- Cognito errors: Map to user-friendly messages
- DynamoDB errors: Retry transient failures
- Validation errors: Show field-level errors
- Network errors: Show retry option

### Security Considerations

- Validate all inputs (email format, password strength)
- Prevent SQL/NoSQL injection
- Use parameterized queries
- Audit log all changes
- Rate limit API calls

### Performance Optimization

- Cache user lists for 30 seconds
- Lazy load user details
- Use DynamoDB batch operations where possible
- Implement pagination early

## Testing

### Unit Tests

```typescript
describe('getUserById', () => {
  it('should fetch user from Cognito and merge with DynamoDB', async () => {
    // Mock apiClient.run for Cognito
    // Mock apiClient.run for DynamoDB
    // Call getUserById
    // Assert merged data
  });

  it('should throw error if user not found', async () => {
    // Mock Cognito returning null
    // Expect getUserById to throw
  });
});
```

### Integration Tests

```typescript
describe('User Management E2E', () => {
  it('should create user in Cognito and DynamoDB', async () => {
    // Create user
    // Verify in Cognito
    // Verify in DynamoDB
    // Cleanup
  });
});
```

### Manual Testing Scenarios

1. Create user → Verify welcome email sent
2. Update user email → Verify uniqueness check
3. Disable user → Verify sessions invalidated
4. Delete user → Verify all data removed
5. List 10,000 users → Verify pagination works

## Dependencies

- AWS Cognito User Pool configured
- `@captify-io/core` Cognito service (v2.0.4+)
- `@captify-io/core` DynamoDB service (v2.0.4+)
- `@captify-io/core` API client (v2.0.4+)
- DynamoDB table: `core-user` with GSIs
- Admin UI layout (Feature #2)

## Success Metrics

### Development Metrics
- Tests passing: 95%+ coverage
- No TypeScript `any` types
- All functions < 50 lines
- Code review approved

### Product Metrics
- User list loads in <500ms
- User operations complete in <1s
- Zero unauthorized access incidents
- 100% of admin actions logged

### User Satisfaction
- Admins can complete common tasks in <5 seconds
- Positive feedback from admin users
- No critical bugs in production

---

**Feature ID**: #1
**Priority**: P0
**Story Points**: 5
**Status**: Ready for Implementation
**Created**: 2025-11-03
**Last Updated**: 2025-11-03
