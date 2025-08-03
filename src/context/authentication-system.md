# Authentication & Email Management System

## Overview

The Captify platform implements a comprehensive authentication system that integrates AWS Cognito with NextAuth.js, featuring email-based session management and login hints for improved user experience.

## Architecture Components

### 1. API Client with Email Headers (`src/lib/api-client.ts`)

The enhanced API client automatically includes user email in all requests through multiple sources:

**Email Source Priority**:

1. **Authenticated Session**: Uses `session.user.email` from NextAuth
2. **Saved Email Session**: Falls back to session-stored email via `/api/auth/save-email`
3. **Graceful Degradation**: Continues operation without email if unavailable

**Headers Added**:

- `X-User-Email`: User's email address
- `X-User-ID`: Cognito user ID (when authenticated)
- `Authorization`: Bearer token (when authenticated)
- `X-ID-Token`: Cognito ID token for AWS services

### 2. Session-Based Email Storage (`src/hooks/useSavedEmail.ts`)

**Long-Lived Email Storage for CAC Authentication**:

- **HttpOnly Cookies**: Secure server-side storage
- **1-Year Expiration**: Long-lived for user convenience since CAC handles security
- **Encryption**: Secure cookie configuration
- **User Control**: Manual clear option for different email usage

**Security Rationale**:
Since users authenticate via CAC (Common Access Card), the email address is not sensitive security data - it's only used for login convenience and system context. The actual authentication security is handled by the CAC/Cognito integration.

**API Endpoints**:

- `POST /api/auth/save-email`: Store email with validation (1-year cookie)
- `GET /api/auth/save-email`: Retrieve stored email
- `DELETE /api/auth/save-email`: Clear stored email (user choice)

### 3. Enhanced Signin Flow (`src/app/auth/signin/page.tsx`)

**User Experience Flow**:

1. Email input with real-time validation
2. Save email to secure session storage
3. Continue button (only appears after successful save)
4. Redirect to Cognito with login_hint pre-populated

**Features**:

- Email validation before session storage
- Visual feedback for save/forget actions
- Persistent email across browser sessions
- Seamless integration with Cognito

### 4. Login Hint Integration (`src/app/api/auth/signin-with-hint/route.ts`)

**Email Source Detection**:

1. Request body (`email` parameter)
2. API headers (`X-User-Email`)
3. Session cookies (saved email)

**Cognito Integration**:

- Constructs proper OAuth authorization URL
- Adds `login_hint` parameter with user's email
- Maintains CSRF protection with state parameter
- Handles callback URL configuration

## Implementation Details

### API Client Email Integration

```typescript
// Enhanced getAuthHeaders method
private async getAuthHeaders(): Promise<Record<string, string>> {
  const session = await getSession();
  let userEmail: string | null = null;

  // Priority 1: Session email
  if (session?.user?.email) {
    userEmail = session.user.email;
  }

  // Priority 2: Saved email from session storage
  if (!userEmail) {
    userEmail = await this.getSavedEmail();
  }

  // Add email to all requests
  if (userEmail) {
    headers["X-User-Email"] = userEmail;
  }
}
```

### Signin Flow with Login Hint

```typescript
// Updated handleContinue function
const handleContinue = async () => {
  const emailToUse = savedEmail || email;

  // Use signin-with-hint endpoint
  const response = await fetch("/api/auth/signin-with-hint", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: emailToUse,
      callbackUrl: "/",
    }),
  });

  const { authUrl } = await response.json();
  window.location.href = authUrl; // Redirect with login_hint
};
```

### NextAuth Configuration

The NextAuth configuration remains focused on core authentication while the email management is handled by the custom endpoints:

```typescript
// Clean separation of concerns
providers: [
  CognitoProvider({
    // Standard Cognito configuration
    // Login hint handled by signin-with-hint endpoint
  }),
];
```

## Security Considerations

### Long-Lived Email Storage Approach

1. **Security Model**:

   - CAC authentication provides the security layer
   - Email is convenience data, not authentication credential
   - Long-lived storage improves user experience
   - Users can manually clear email if desired

2. **Data Protection**:

   - Email validation before storage
   - HttpOnly cookies prevent XSS attacks
   - Secure flag for HTTPS-only transmission
   - SameSite policy prevents CSRF
   - No sensitive authentication data stored

3. **Authentication Flow**:
   - CSRF protection with state parameters
   - Secure redirect validation
   - CAC handles actual credential validation
   - Proper token handling for AWS services

## Benefits

### User Experience

- **Email Persistence**: Users don't need to re-enter email
- **Faster Login**: Pre-populated Cognito forms
- **Seamless Flow**: Smooth transition from email to authentication
- **Visual Feedback**: Clear save/forget actions

### Developer Experience

- **Automatic Headers**: Email included in all API requests
- **Type Safety**: TypeScript interfaces for all components
- **Debugging**: Comprehensive logging throughout
- **Modularity**: Clean separation of concerns

### Security

- **Industry Standards**: NIST Rev 5 compliance
- **Defense in Depth**: Multiple security layers
- **Audit Trail**: Comprehensive logging
- **Zero Trust**: No assumption of client-side security

## Testing & Validation

### End-to-End Flow Test

1. Navigate to `/auth/signin`
2. Enter email and save to session
3. Click continue button
4. Verify Cognito form pre-populated with email
5. Complete authentication
6. Verify email in API request headers

### API Integration Test

```bash
# Test API client headers
curl -H "X-User-Email: test@example.com" /api/test-endpoint

# Test saved email session
curl -b "saved-email=..." /api/auth/signin-with-hint

# Test authentication flow
curl /api/auth/signin-with-hint -d '{"email":"test@example.com"}'
```

## Future Enhancements

1. **Multi-Factor Authentication**: Integration with Cognito MFA
2. **Social Logins**: Extended provider support
3. **Organization Support**: Multi-tenant email management
4. **Advanced Analytics**: Login pattern analysis
5. **Mobile Support**: React Native compatibility
