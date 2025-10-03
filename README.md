# @captify-io/platform

Captify Platform - Next.js application with cross-origin authentication and API proxy for AWS services.

## Overview

This is the main platform application that provides:
- NextAuth.js authentication with AWS Cognito
- API proxy for AWS services (DynamoDB, S3, Bedrock, etc.)
- Cross-origin authentication support for external apps
- User registration and authorization workflows

## Architecture

This application depends on `@captify-io/core` for all UI components, hooks, and utilities. The platform application focuses on:

- **API Routes** (`/api/captify`) - Proxy for AWS service calls
- **Auth Endpoints** (`/api/auth/*`) - NextAuth.js authentication
- **Application Pages** - Platform UI and registration flows

## Installation

```bash
# Install dependencies (including @captify-io/core from GitHub)
npm install
```

**Note:** The `@captify-io/core` package is installed directly from GitHub. The package.json is configured to pull from `github:captify-io/core`.

## Environment Variables

Create a `.env.local` file:

```env
# Next.js
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key

# AWS Cognito
COGNITO_USER_POOL_ID=your-user-pool-id
COGNITO_CLIENT_ID=your-client-id
COGNITO_CLIENT_SECRET=your-client-secret
COGNITO_DOMAIN=your-cognito-domain
COGNITO_IDENTITY_POOL_ID=your-identity-pool-id

# AWS Region
AWS_REGION=us-east-1

# Schema (for DynamoDB table prefix)
SCHEMA=your-schema-name

# Domain (for CORS)
DOMAIN=captify.io
DEV_ORIGIN=http://localhost:3001

# Session Configuration (optional)
NEXT_PUBLIC_IDLE_TIMEOUT_MINUTES=60  # Idle timeout in minutes (default: 15 in production, 0 in development)
NEXTAUTH_TRUSTED_DOMAINS=.example.com,.internal.net  # Additional trusted domains for redirects
```

## Development

```bash
# Start development server with Turbopack
npm run dev

# Type checking
npm run type-check

# Build for production
npm run build

# Start production server
npm start
```

### Tailwind CSS v4 Configuration

This project uses **Tailwind CSS v4** with the following setup:

- **globals.css** contains `@import "tailwindcss"` and `@source` directives
- **postcss.config.cjs** uses `@tailwindcss/postcss` plugin
- **No tailwind.config.ts** - all configuration is in CSS using `@theme inline`
- **@captify-io/core components** are scanned via `@source "../../node_modules/@captify-io/core/dist/**/*.{js,cjs}"`

**Important:** If you add new external component libraries, add them to the `@source` directive in `globals.css` to ensure their utility classes are generated.

## API Routes

### `/api/captify` - AWS Service Proxy

Handles authenticated AWS service calls from external applications. All services are provided by `@captify-io/core` package.

**Important:** All service requests must use the `platform.*` namespace (e.g., `platform.dynamodb`, `platform.s3`). Services are **always** loaded from `@captify-io/core/services`, regardless of the package name in the request.

**Request:**
```json
{
  "service": "platform.dynamodb",
  "operation": "query",
  "table": "core-Notification",
  "data": {
    "IndexName": "userId-timestamp-index",
    "KeyConditionExpression": "#userId = :userId",
    "ExpressionAttributeNames": {
      "#userId": "userId"
    },
    "ExpressionAttributeValues": {
      ":userId": "user-id-here"
    },
    "ScanIndexForward": false,
    "Limit": 50
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "Items": [...],
    "Count": 5,
    "ScannedCount": 5
  }
}
```

**Available Services:**
- `platform.dynamodb` - DynamoDB operations (query, scan, get, put, update, delete)
- `platform.s3` - S3 operations (upload, download, list, delete)
- `platform.cognito` - Cognito user management
- `platform.aurora` - Aurora Serverless queries

### `/api/auth/[...nextauth]` - NextAuth.js

Standard NextAuth.js endpoints for authentication.

## External App Authentication

This platform provides centralized authentication for external applications using NextAuth.js with AWS Cognito.

### How It Works

External apps redirect unauthenticated users to this platform's sign-in endpoint with a `callbackUrl`:

```
User visits: http://localhost:3001/ops/contracts (pmbook app)
         ↓ (no session)
Redirects to: http://localhost:3000/api/auth/signin?callbackUrl=http://localhost:3001/ops/contracts
         ↓
Platform authenticates with Cognito
         ↓
Sets session cookie on .localhost domain
         ↓
Redirects back to: http://localhost:3001/ops/contracts
         ↓
pmbook receives request with valid session cookie
```

### Trusted Domains

The platform uses **server-side 302 redirects** throughout the flow and automatically whitelists:

- **localhost** - any port (e.g., localhost:3000, localhost:3001, localhost:3002)
- **.captify.io** - all subdomains (e.g., app.captify.io, admin.captify.io)

Additional domains can be configured via the `NEXTAUTH_TRUSTED_DOMAINS` environment variable:

```env
NEXTAUTH_TRUSTED_DOMAINS=.example.com,.internal.net
```

Domains starting with `.` are treated as wildcard subdomains.

### Session Cookie Configuration

The session cookie is set with:
- **Domain:** `.localhost` (development) or `.captify.io` (production)
- **SameSite:** `lax` (development) or `none` (production)
- **HttpOnly:** `true`
- **Secure:** `true` (production only)
- **MaxAge:** 8 hours

This allows all apps on the same domain to share the authentication session.

## Deployment

### AWS Elastic Beanstalk

```bash
# Deploy to EB (Windows)
npm run deploy:eb:windows

# Deploy to EB (Linux/Mac)
npm run deploy:eb
```

### Manual Deployment

1. Build the application:
   ```bash
   npm run build
   ```

2. Set environment variables on your server

3. Start the application:
   ```bash
   npm start
   ```

## Security

- **NEVER** commit `.env` files to git
- Token storage is server-side only (DynamoDB)
- CORS is configured for specific origins only
- **Session Configuration:**
  - **Idle Timeout:** Default 15 minutes in production (configurable via `NEXT_PUBLIC_IDLE_TIMEOUT_MINUTES`)
  - **Session Cookie MaxAge:** 8 hours
  - **Cognito Token Expiry:** 1 hour (auto-refreshes 15 minutes before expiry)
  - **DynamoDB Token TTL:** 24 hours (automatic cleanup)
- Warning dialog appears 2 minutes before idle timeout logout

## Architecture Dependencies

- **@captify-io/core** - UI components, hooks, and utilities
- **next-auth** - Authentication
- **AWS SDK** - Service integrations
- **React 19 & Next.js 15** - Framework

## License

Private - Captify.io Platform
