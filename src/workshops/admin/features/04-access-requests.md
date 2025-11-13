# Feature: Access Requests

## Overview

Enable users to request access to applications and allow administrators to approve/deny requests. Implements a self-service workflow for application access management.

## Requirements

### Functional Requirements

1. **Submit Access Request** (User-facing)
   - User browses available applications
   - User requests access to specific app
   - Provide reason for access request
   - Auto-creates request record in DynamoDB
   - Notify admins of new request

2. **List Access Requests** (Admin)
   - Display all pending requests
   - Filter by: status (pending, approved, denied), app, user
   - Sort by: date submitted, priority
   - Show: user name/email, app requested, reason, date

3. **Review Request** (Admin)
   - View full request details
   - View user profile and current groups
   - See what groups the app requires
   - Add admin notes
   - Approve or deny with reason

4. **Approve Request** (Admin)
   - Add user to required app groups
   - Optionally add to additional groups
   - Send approval email to user
   - Update request status to "approved"
   - Log admin action in audit trail

5. **Deny Request** (Admin)
   - Update request status to "denied"
   - Provide denial reason
   - Send denial email to user
   - Log admin action

6. **Request History**
   - View all requests (pending, approved, denied)
   - Filter by date range
   - Export to CSV for reporting

### Non-Functional Requirements

1. **Performance**: Request list loads in <500ms
2. **Notifications**: Admins notified within 1 minute of new request
3. **Audit**: All approvals/denials logged
4. **Email**: Send confirmation emails to users

## Architecture

```
User UI → API → DynamoDB (core-access-request table)
                → Cognito Service (add to groups on approval)
                → Email Service (notifications)
                → Audit Service (log actions)
```

## Data Model

### DynamoDB Table: `core-access-request`

```typescript
interface AccessRequest {
  id: string;                    // PK: request-{timestamp}-{random}
  userId: string;                // SK: Cognito sub
  appSlug: string;               // GSI: appSlug-status-index
  appName: string;

  status: 'pending' | 'approved' | 'denied';  // GSI: status-createdAt-index
  reason: string;                // User's reason for request

  // Request metadata
  createdAt: string;             // ISO timestamp
  updatedAt: string;

  // User info (denormalized for easy display)
  userName: string;
  userEmail: string;

  // Admin review
  reviewedBy?: string;           // Admin user ID
  reviewedAt?: string;
  reviewNotes?: string;
  denialReason?: string;

  // Groups granted (for approved requests)
  groupsGranted?: string[];
}
```

**Indexes**:
- Primary Key: `id`
- GSI: `userId-createdAt-index` (userId, createdAt) - User's request history
- GSI: `appSlug-status-index` (appSlug, status) - Pending requests per app
- GSI: `status-createdAt-index` (status, createdAt) - All pending requests

## API Actions

### createAccessRequest(data: CreateRequestInput)
- **Purpose**: User submits access request
- **Input**: `{ userId, appSlug, reason }`
- **Output**: `{ request: AccessRequest }`
- **Side Effects**: Notify admins

### listAccessRequests(options: ListRequestsOptions)
- **Purpose**: Admin lists requests
- **Input**: `{ status?, appSlug?, limit?, nextToken? }`
- **Output**: `{ requests: AccessRequest[], nextToken? }`

### approveRequest(requestId: string, data: ApprovalData)
- **Purpose**: Admin approves request
- **Input**: `{ requestId, groups: string[], notes?: string }`
- **Output**: `{ request: AccessRequest }`
- **Side Effects**: Add user to Cognito groups, send email, audit log

### denyRequest(requestId: string, reason: string)
- **Purpose**: Admin denies request
- **Input**: `{ requestId, reason }`
- **Output**: `{ request: AccessRequest }`
- **Side Effects**: Send email, audit log

## UI/UX

### User-Facing: Request Access Flow
1. Browse apps in marketplace/apps list
2. Click "Request Access" button
3. Modal: App name, required groups, reason textarea
4. Submit → Success toast: "Request submitted"
5. User receives email confirmation

### Admin: Pending Requests Badge
- Sidebar shows badge count of pending requests
- Clicking navigates to Access Requests view

### Admin: Request List View
- Table: User, App, Reason, Date, Status, Actions
- Filter: Status dropdown, App dropdown
- Actions: Review, Approve, Deny buttons

### Admin: Request Detail Modal
- User profile card (name, email, current groups)
- App card (name, required groups)
- Request details (reason, date submitted)
- Approval form:
  - Checkboxes for groups to grant
  - Notes textarea
  - Approve/Deny buttons

## Notification Flow

### New Request Submitted
```
1. User submits request
2. Create record in DynamoDB
3. Publish to SNS topic: "admin-notifications"
4. Send email to captify-admin group members
5. Show toast notification in admin UI (real-time)
```

### Request Approved
```
1. Admin approves request
2. Add user to Cognito groups
3. Update DynamoDB record
4. Send email to user: "Access Granted"
5. Audit log entry
```

### Request Denied
```
1. Admin denies request
2. Update DynamoDB record
3. Send email to user: "Access Denied" with reason
4. Audit log entry
```

## Email Templates

### To User: Request Submitted
```
Subject: Access Request Received - {App Name}

Your request for access to {App Name} has been received and is pending review.

Request Details:
- Application: {App Name}
- Submitted: {Date}
- Status: Pending

You will receive an email once your request is reviewed.
```

### To User: Access Approved
```
Subject: Access Granted - {App Name}

Your request for access to {App Name} has been approved!

Groups Granted:
- {group1}
- {group2}

You can now access {App Name} at: {App URL}

Admin Notes: {notes}
```

### To Admins: New Request
```
Subject: New Access Request - {User Name}

{User Name} ({User Email}) has requested access to {App Name}.

Reason: {reason}

Review Request: {Admin URL}/admin/access-requests/{requestId}
```

## Security Considerations

- Users can only create requests for themselves
- Only captify-admin can approve/deny requests
- Validate app exists before creating request
- Prevent duplicate pending requests (same user + app)
- Log all approval/denial actions

## Testing

### Test Scenarios
1. User submits request → Verify record created
2. Admin approves → Verify user added to groups
3. Admin denies → Verify email sent
4. Duplicate request → Verify rejected
5. Invalid app → Verify validation error

## Dependencies

- User Management (#1)
- Group Management (#2)
- Email service (AWS SES or similar)
- Notification system (SNS/real-time)

---

**Feature ID**: #4
**Priority**: P1
**Story Points**: 5
**Status**: Not Started
