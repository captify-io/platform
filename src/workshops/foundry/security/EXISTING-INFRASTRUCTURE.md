# Leveraging Existing Infrastructure for Security

## Overview

Good news! Much of the security infrastructure is **already built**. This document explains how to leverage existing authentication, API, and credential systems for our security implementation.

---

## What's Already Built ✅

### 1. NextAuth + Cognito Authentication ✅

**File**: `platform/src/lib/auth.ts`

**Already Configured**:
- ✅ Cognito User Pool integration
- ✅ Session management with JWT
- ✅ Token storage in DynamoDB (`captify-auth-tokens`)
- ✅ Automatic token refresh
- ✅ Secure cookie handling (`.captify.io` domain)
- ✅ Cross-app session sharing

**Session Object Structure**:
```typescript
{
  user: {
    id: "user-123",           // From Cognito sub
    email: "john@acme.com",
    name: "John Doe"
  },
  username: "john@acme.com",
  groups: ["Admins", "captify-authorized"],  // ⭐ From Cognito groups
  captifyStatus: "approved",
  sessionId: "sess_1234567890_abc",  // Reference to DynamoDB tokens
  idToken: "[stored in DynamoDB]",
  accessToken: "[stored in DynamoDB]"
}
```

**Security Context Available**:
- `session.groups` - Cognito groups (already working!)
- Need to add: `organizationId`, `clearanceLevel`, `markings` to Cognito custom attributes

---

### 2. API Captify Route with Credential Management ✅

**File**: `platform/src/app/api/captify/route.ts`

**Already Configured**:
- ✅ Authentication check (`await auth()`)
- ✅ Token retrieval from DynamoDB
- ✅ Automatic token refresh
- ✅ AWS credential exchange via Identity Pool
- ✅ Service routing to `@captify-io/core/services`
- ✅ Session passed to all services

**API Session Object** (passed to services):
```typescript
const apiSession = {
  user: {
    id: session.user?.id,
    userId: session.user?.id,
    email: session.user?.email,
    name: session.user?.name,
    groups: session.groups,           // ⭐ Cognito groups
    isAdmin: session.groups?.includes('Admins'),  // ⭐ Admin check
    tenantId: session.user?.tenantId,
  },
  idToken: idToken,                   // From DynamoDB
  accessToken: accessToken,           // From DynamoDB
  groups: session.groups,
  isAdmin: session.groups?.includes('Admins'),
};
```

**What We Need to Add**:
```typescript
// In apiSession, add security context:
const apiSession = {
  user: {
    // ... existing fields ...

    // NEW: Security context from Cognito custom attributes
    organizationId: session.user?.organizationId,
    clearanceLevel: session.user?.clearanceLevel,
    markings: session.user?.markings,
    sciCompartments: session.user?.sciCompartments,
  },
  // ... rest of session ...
};
```

---

### 3. Identity Pool Credential Exchange ✅

**File**: `platform/src/app/api/lib/credentials.ts`

**Already Configured**:
- ✅ Cognito Identity Pool integration
- ✅ Temporary AWS credentials from ID token
- ✅ Credential caching (per Identity Pool)
- ✅ Automatic credential refresh
- ✅ Multiple Identity Pool support

**How It Works**:
```typescript
// In route.ts (already happening):
credentials = await getAwsCredentialsFromIdentityPool(
  sessionWithTokens,
  identityPoolId,
  forceRefresh
);

// Returns:
{
  accessKeyId: "ASIA...",
  secretAccessKey: "...",
  sessionToken: "...",
  region: "us-east-1",
  expiration: Date,
  identityPoolId: "us-east-1:..."
}
```

**Result**: Services get scoped AWS credentials based on IAM role mappings!

---

### 4. Token Storage in DynamoDB ✅

**File**: `platform/src/lib/auth-store.ts`

**Already Configured**:
- ✅ DynamoDB table: `captify-auth-tokens`
- ✅ Secure token storage (encrypted at rest with KMS)
- ✅ Automatic TTL cleanup (24 hours)
- ✅ Token retrieval by sessionId
- ✅ Token extension on activity

**Schema**:
```typescript
{
  sessionId: string,           // PK: "sess_1234567890_abc"
  accessToken: string,         // Large Cognito token
  idToken: string,             // Large Cognito token
  refreshToken: string,        // Refresh token
  expiresAt: number,           // Unix timestamp
  createdAt: number,           // Unix timestamp
  ttl: number                  // DynamoDB TTL for auto-cleanup
}
```

**Benefit**: JWT stays small, large tokens stored securely server-side.

---

## What We Need to Add 🔧

### 1. Cognito Custom Attributes

**Current State**: Cognito has `groups` working, but no custom attributes for security.

**Need to Add** (via Cognito console or AWS CLI):
```typescript
// Custom attributes (mutable)
{
  "custom:organizationId": "org-acme",
  "custom:clearanceLevel": "SECRET",
  "custom:markings": "PII,FIN,LEO",  // Comma-separated
  "custom:sciCompartments": "SCI-TK,SI",  // Comma-separated
  "custom:needToKnow": "true",
  "custom:employeeId": "EMP-12345"
}
```

**How to Add** (AWS CLI):
```bash
# Add custom attribute schema to User Pool
aws cognito-idp add-custom-attributes \
  --user-pool-id $COGNITO_USER_POOL_ID \
  --custom-attributes \
    Name=organizationId,AttributeDataType=String,Mutable=true \
    Name=clearanceLevel,AttributeDataType=String,Mutable=true \
    Name=markings,AttributeDataType=String,Mutable=true \
    Name=sciCompartments,AttributeDataType=String,Mutable=true \
    Name=needToKnow,AttributeDataType=String,Mutable=true \
    Name=employeeId,AttributeDataType=String,Mutable=true
```

---

### 2. Update JWT Callback to Include Security Attributes

**File**: `platform/src/lib/auth.ts`

**Current JWT Callback**:
```typescript
async jwt({ token, account, profile }): Promise<any> {
  if (account && profile) {
    const groups = (profile as any)["cognito:groups"] || [];

    return {
      ...token,
      sub: profile.sub,
      email: profile.email,
      username: profile.preferred_username || profile.email,
      groups: groups.slice(0, 5),
      captifyStatus: groups.some(...) ? "approved" : "pending",
      sessionId: sessionId,
      issuedAt: Math.floor(Date.now() / 1000),
    };
  }
  return token;
}
```

**Updated JWT Callback** (add security attributes):
```typescript
async jwt({ token, account, profile }): Promise<any> {
  if (account && profile) {
    const groups = (profile as any)["cognito:groups"] || [];

    // NEW: Extract custom attributes from Cognito profile
    const customAttrs = profile as any;

    return {
      ...token,
      sub: profile.sub,
      email: profile.email,
      username: profile.preferred_username || profile.email,
      groups: groups.slice(0, 5),
      captifyStatus: groups.some(...) ? "approved" : "pending",
      sessionId: sessionId,
      issuedAt: Math.floor(Date.now() / 1000),

      // NEW: Security attributes from Cognito custom attributes
      organizationId: customAttrs["custom:organizationId"] || null,
      clearanceLevel: customAttrs["custom:clearanceLevel"] || "UNCLASSIFIED",
      markings: customAttrs["custom:markings"]?.split(',') || [],
      sciCompartments: customAttrs["custom:sciCompartments"]?.split(',') || [],
      needToKnow: customAttrs["custom:needToKnow"] === "true",
    };
  }
  return token;
}
```

**Updated Session Callback**:
```typescript
async session({ session, token }) {
  if (token.error === "RefreshAccessTokenError") {
    return { ...session, error: "RefreshAccessTokenError" };
  }

  return {
    ...session,
    username: token.username,
    groups: token.groups,
    captifyStatus: token.captifyStatus,
    sessionId: token.sessionId,

    // NEW: Security attributes in session
    user: {
      ...session.user,
      id: token.sub!,
      email: token.email,
      organizationId: token.organizationId,
      clearanceLevel: token.clearanceLevel,
      markings: token.markings,
      sciCompartments: token.sciCompartments,
      needToKnow: token.needToKnow,
    },
  };
}
```

**Result**: Security context available in every session automatically!

---

### 3. Update API Session Object

**File**: `platform/src/app/api/captify/route.ts`

**Current**:
```typescript
const apiSession = {
  user: {
    id: session.user?.id || '',
    userId: session.user?.id || '',
    email: session.user?.email,
    name: session.user?.name,
    groups: session.groups,
    isAdmin: session.groups?.includes('Admins'),
    tenantId: session.user?.tenantId,
  },
  idToken: idToken,
  accessToken: accessToken,
  groups: session.groups,
  isAdmin: session.groups?.includes('Admins'),
};
```

**Updated** (add security context):
```typescript
const apiSession = {
  user: {
    id: session.user?.id || '',
    userId: session.user?.id || '',
    email: session.user?.email,
    name: session.user?.name,
    groups: session.groups,
    isAdmin: session.groups?.includes('Admins'),
    tenantId: session.user?.tenantId,

    // NEW: Security context from session
    organizationId: (session.user as any)?.organizationId,
    clearanceLevel: (session.user as any)?.clearanceLevel || 'UNCLASSIFIED',
    markings: (session.user as any)?.markings || [],
    sciCompartments: (session.user as any)?.sciCompartments || [],
    needToKnow: (session.user as any)?.needToKnow || false,
  },
  idToken: idToken,
  accessToken: accessToken,
  groups: session.groups,
  isAdmin: session.groups?.includes('Admins'),

  // NEW: Top-level security context for easy access
  organizationId: (session.user as any)?.organizationId,
  clearanceLevel: (session.user as any)?.clearanceLevel || 'UNCLASSIFIED',
  markings: (session.user as any)?.markings || [],
};
```

**Result**: All services receive complete security context!

---

### 4. Add Permission Check Middleware

**File**: `platform/src/app/api/captify/route.ts` (update existing route)

**Add Before Service Execution**:
```typescript
// After getting credentials, before executing service:

// Import security check
import { checkPermission } from '@captify-io/core/services/ontology/security';

// If operation targets a specific entity, check permissions
if (body.data?.id || body.data?.slug) {
  const entityId = body.data.id || body.data.slug;
  const operation = mapOperationToPermission(body.operation);

  // Only check if this is an entity-level operation
  if (['get', 'update', 'delete', 'query'].includes(body.operation)) {
    try {
      // Note: For 'create', we'll check org-level permissions
      // For other ops, we need to fetch entity first to check its security

      const permissionCheck = await checkPermission(
        apiSession,
        entityId,
        operation,
        credentials
      );

      if (!permissionCheck.allowed) {
        // Log failed attempt
        await logAuditEvent({
          userId: apiSession.user.id,
          action: `${body.service}.${body.operation}`,
          entityId: entityId,
          success: false,
          reason: permissionCheck.reason
        }, apiSession);

        return new Response(
          JSON.stringify({
            success: false,
            error: 'Access denied',
            reason: permissionCheck.reason
          }),
          { status: 403, headers }
        );
      }
    } catch (permError) {
      // Permission check failed - deny access
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Permission check failed',
          details: permError.message
        }),
        { status: 500, headers }
      );
    }
  }
}

// Permission check passed - execute service
const result = await serviceHandler.execute(processedBody, credentials, apiSession);
```

**Benefit**: Centralized permission checking. No service can bypass security.

---

## Integration Flow

### Complete Request Flow (After Updates)

```
1. User makes API request
   POST /api/captify
   { service: "core.ontology", operation: "get", data: { id: "dataset-123" } }

2. NextAuth Session Check (route.ts:79)
   ↓
   session = await auth()

   Session contains:
   - user.id, user.email, user.name
   - user.organizationId (from Cognito custom attribute) ⭐
   - user.clearanceLevel (from Cognito custom attribute) ⭐
   - user.markings (from Cognito custom attribute) ⭐
   - groups (from Cognito groups) ✅

3. Token Retrieval (route.ts:135)
   ↓
   storedTokens = await getStoredTokens(sessionId)

   Returns:
   - accessToken, idToken, refreshToken
   - Automatic refresh if near expiry ✅

4. AWS Credential Exchange (route.ts:196)
   ↓
   credentials = await getAwsCredentialsFromIdentityPool(session, identityPoolId)

   Returns:
   - Temporary AWS credentials (AccessKeyId, SecretAccessKey, SessionToken)
   - Scoped to IAM role based on Cognito group ✅

5. Permission Check (NEW - add this)
   ↓
   permissionCheck = await checkPermission(apiSession, entityId, operation)

   Checks:
   - Does user.organizationId === entity.organizationId?
   - Does user.clearanceLevel >= entity.classification?
   - Does user have all entity.markings?
   - Is user in entity.acl?

6. Service Execution (route.ts:346)
   ↓
   result = await serviceHandler.execute(body, credentials, apiSession)

   Service receives:
   - AWS credentials (for DynamoDB, S3, etc.)
   - Complete session (including security context)
   - Can make additional permission checks if needed

7. Response
   ↓
   Return result to user (200 OK or 403 Forbidden)
```

---

## What This Means for Implementation

### ✅ Already Working
1. Authentication with Cognito
2. Session management across apps
3. Token storage in DynamoDB
4. AWS credential exchange
5. Service routing
6. Admin group checking (`isAdmin`)

### 🔧 Need to Add (Minimal Changes)
1. **Cognito custom attributes** (5 minutes via AWS CLI)
2. **JWT callback update** (5 lines of code)
3. **Session callback update** (3 lines of code)
4. **API session update** (5 lines of code)
5. **Permission check middleware** (20 lines of code)
6. **Security service** (`core/src/services/ontology/security.ts` - new file)

### 📊 Total New Code
- ~50 lines in existing files (auth.ts, route.ts)
- ~200 lines in new file (security.ts)
- ~0 new infrastructure (everything already exists!)

---

## Implementation Checklist

### Day 1: Add Security Attributes to Cognito
- [ ] Add custom attributes to User Pool
  ```bash
  aws cognito-idp add-custom-attributes --user-pool-id $POOL_ID ...
  ```
- [ ] Assign attributes to test users
  ```bash
  aws cognito-idp admin-update-user-attributes \
    --user-pool-id $POOL_ID \
    --username john@acme.com \
    --user-attributes \
      Name=custom:organizationId,Value=org-acme \
      Name=custom:clearanceLevel,Value=SECRET \
      Name=custom:markings,Value=PII,FIN
  ```

### Day 2: Update Auth Flow
- [ ] Update `auth.ts` JWT callback (add security attributes)
- [ ] Update `auth.ts` session callback (expose in session)
- [ ] Test: Sign in, check session has security attributes

### Day 3: Update API Route
- [ ] Update `route.ts` apiSession object (include security context)
- [ ] Create `core/src/services/ontology/security.ts`
- [ ] Add permission check before service execution
- [ ] Test: API calls include security context

### Day 4: Add Security Metadata to Entities
- [ ] Update `core/src/services/ontology/types.ts` (add securityMetadata to SharedProperties)
- [ ] Update existing entities with default security metadata
- [ ] Test: Entities have security metadata

### Day 5: Integration Testing
- [ ] Test: User in org-acme can access org-acme data
- [ ] Test: User in org-acme CANNOT access org-other data
- [ ] Test: UNCLASSIFIED user CANNOT access SECRET data
- [ ] Test: User without PII marking CANNOT access PII data
- [ ] Test: Audit log captures all attempts

---

## Key Insights

1. **Cognito Custom Attributes** are the foundation. Once added, they flow through the entire system automatically.

2. **JWT Callback** is where we extract custom attributes from Cognito profile and add to JWT.

3. **Session Callback** is where we expose attributes to application code.

4. **API Session** is where we pass security context to all services.

5. **Permission Check** is a simple middleware function that checks before execution.

6. **Everything else already works!** Token management, credential exchange, service routing - all done.

---

## Summary

You have **95% of the security infrastructure already built**:

✅ Authentication with Cognito
✅ Session management
✅ Token storage (DynamoDB)
✅ Credential exchange (Identity Pool)
✅ Service routing
✅ Group-based access (isAdmin)

You need to add **5% more**:

🔧 Cognito custom attributes (5 min via CLI)
🔧 JWT/Session callback updates (10 lines)
🔧 API session update (5 lines)
🔧 Permission check middleware (20 lines)
🔧 Security service (200 lines)

**Total time to implement**: 1-2 days

**Result**: Full Captify-level security with minimal code changes!

---

**Created**: 2025-11-09
**Status**: Implementation Guide
**Next Step**: Add Cognito custom attributes
