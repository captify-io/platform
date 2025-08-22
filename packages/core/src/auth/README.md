# Core Authentication

Authentication utilities for Captify applications using NextAuth.js with AWS Cognito integration.

## Overview

This directory contains client-side authentication utilities that integrate with the platform's three-tier authentication system and NextAuth.js session management.

## Files

### `auth.ts`

Core authentication functions for session validation and AWS credential management.

**Key Functions:**

- `validateSession(idToken)`: Validates JWT tokens from Cognito
- `getAwsCredentials(idToken, identityPoolId)`: Retrieves AWS credentials from Identity Pool
- `refreshSession(session)`: Refreshes user session when needed

**Usage:**

```typescript
import { validateSession, getAwsCredentials } from "@captify/core/auth";

// Validate user token
const isValid = await validateSession(session.idToken);

// Get AWS credentials for direct AWS SDK usage
const credentials = await getAwsCredentials(
  session.idToken,
  process.env.COGNITO_IDENTITY_POOL_ID
);
```

### `session.ts`

Client-side session storage and management utilities.

**Key Functions:**

- `storeSession(session)`: Store session in localStorage
- `getStoredSession()`: Retrieve stored session
- `clearStoredSession()`: Clear stored session
- `isSessionValid(session)`: Check session validity

**Usage:**

```typescript
import {
  storeSession,
  getStoredSession,
  clearStoredSession,
  isSessionValid,
} from "@captify/core/auth";

// Store session after login
storeSession(userSession);

// Retrieve session on app startup
const session = getStoredSession();
if (session && isSessionValid(session)) {
  // Use session
}

// Clear on logout
clearStoredSession();
```

### `index.ts`

Export definitions for the auth module.

## Authentication Flow

### Three-Tier System

The platform uses a three-tier authentication system:

1. **Tier 1: Session Token (Preferred)**

   - AWS session tokens from NextAuth JWT callback
   - Highest privilege level
   - Used for direct AWS service access

2. **Tier 2: User Credentials**

   - Cognito Identity Pool credentials
   - User-scoped access
   - Fallback when session tokens unavailable

3. **Tier 3: Static Fallback**
   - Service account credentials
   - Least privileged access
   - Emergency fallback only

### Session Management

```typescript
// In your app layout or provider
import { useSession } from "next-auth/react";
import { storeSession } from "@captify/core/auth";

function AuthProvider({ children }) {
  const { data: session } = useSession();

  useEffect(() => {
    if (session) {
      storeSession(session);
    }
  }, [session]);

  return <>{children}</>;
}
```

## Integration with NextAuth.js

The auth utilities work seamlessly with NextAuth.js:

```typescript
// pages/api/auth/[...nextauth].ts
import NextAuth from "next-auth";
import CognitoProvider from "next-auth/providers/cognito";

export default NextAuth({
  providers: [
    CognitoProvider({
      clientId: process.env.COGNITO_CLIENT_ID,
      clientSecret: process.env.COGNITO_CLIENT_SECRET,
      issuer: process.env.COGNITO_ISSUER,
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.idToken = account.id_token;
        // Get AWS session token here
      }
      return token;
    },
    async session({ session, token }) {
      session.idToken = token.idToken;
      session.awsSessionToken = token.awsSessionToken;
      return session;
    },
  },
});
```

## Server-Side Usage

For server-side authentication in API routes:

```typescript
// In API routes - use @captify/api instead
import { requireUserSession } from "@captify/api";

export async function GET(request: Request) {
  const session = await requireUserSession(request);
  // Session is now validated and contains AWS credentials
}
```

## Security Considerations

1. **Token Storage**: Only store non-sensitive session data in localStorage
2. **Validation**: Always validate sessions before use
3. **Refresh**: Implement session refresh before expiration
4. **Clear**: Always clear sessions on logout
5. **HTTPS**: Ensure all authentication flows use HTTPS

## TODO List

- [ ] Implement JWT token validation with proper signature verification
- [ ] Add Cognito Identity Pool integration for AWS credentials
- [ ] Create session refresh logic with automatic renewal
- [ ] Add session expiration checking and handling
- [ ] Implement secure token storage with encryption
- [ ] Add biometric authentication support for mobile
- [ ] Create session timeout handling
- [ ] Add multi-factor authentication support
- [ ] Implement session sharing across tabs
- [ ] Add session analytics and monitoring
- [ ] Create authentication error handling utilities
- [ ] Add password reset flow utilities
- [ ] Implement account verification helpers
