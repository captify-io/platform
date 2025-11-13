# Feature: Group Management

## Overview

Enable administrators to manage AWS Cognito groups for role-based access control across the Captify platform. Groups determine what features and data users can access.

## Requirements

### Functional Requirements

1. **List Cognito Groups**
   - Display all groups from Cognito User Pool
   - Show group name, description, precedence, role ARN
   - Show member count for each group
   - Filter by group type (admin, app-specific, role-based)

2. **Create Group**
   - Create new Cognito group with name and description
   - Set group precedence (priority order)
   - Optionally assign IAM role ARN
   - Validate group name uniqueness
   - Naming convention: `{app}-{role}` or `captify-{role}`

3. **Update Group**
   - Update group description
   - Modify precedence
   - Update role ARN
   - Cannot change group name (Cognito limitation)

4. **Delete Group**
   - Remove group from Cognito
   - Warn if group has members
   - Require confirmation for deletion
   - Cannot delete system groups (captify-admin, captify-operations)

5. **View Group Members**
   - List all users in a specific group
   - Show user details (name, email, status)
   - Add/remove users from group
   - Bulk operations for adding multiple users

6. **Standard Groups**
   - `captify-admin` - Full platform admin access
   - `captify-operations` - Operations and user management
   - `{app}-admin` - App-specific admin (e.g., `pmbook-admin`)
   - `{app}-user` - App-specific user access (e.g., `aihub-user`)

### Non-Functional Requirements

1. **Performance**: Group list loads in <500ms
2. **Security**: Only captify-admin can manage groups
3. **Validation**: Prevent deletion of system-critical groups
4. **Audit**: Log all group changes (create, update, delete, membership)

## Architecture

```
Admin UI → API Client → Cognito Service → AWS Cognito User Pool
                                            ├─ Groups
                                            └─ Group Memberships
```

## Data Model

### AWS Cognito Group

```typescript
interface CognitoGroup {
  GroupName: string;           // e.g., "captify-admin", "pmbook-user"
  Description?: string;
  Precedence?: number;         // Lower = higher priority (0-highest)
  RoleArn?: string;           // IAM role ARN
  CreationDate: Date;
  LastModifiedDate: Date;
}
```

## API Actions

### listGroups()
- **Purpose**: List all Cognito groups with member counts
- **Input**: `{ limit?: number, nextToken?: string }`
- **Output**: `{ groups: CognitoGroup[], nextToken?: string }`

### createGroup(data: CreateGroupInput)
- **Purpose**: Create new Cognito group
- **Input**: `{ name: string, description?: string, precedence?: number, roleArn?: string }`
- **Output**: `{ group: CognitoGroup }`

### deleteGroup(groupName: string)
- **Purpose**: Delete Cognito group
- **Input**: `groupName: string`
- **Output**: `{ deleted: boolean }`

### addUserToGroup(userId: string, groupName: string)
- **Purpose**: Add user to Cognito group
- **Input**: `userId, groupName`
- **Output**: `{ success: boolean }`

## UI/UX

### Groups List View
- Table: Group Name, Description, Members, Precedence, Actions
- Filter: System groups, app groups, role groups
- Create Group button

### Group Detail View
- Group info card
- Members list with add/remove actions
- Edit description and precedence
- Delete group button (with confirmation)

## Dependencies

- Core Cognito service (already exists in `@captify-io/core`)
- User Management feature (#1)

---

**Feature ID**: #2
**Priority**: P0
**Story Points**: 3
**Status**: Not Started
