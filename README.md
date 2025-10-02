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
# Install dependencies (including @captify-io/core)
npm install

# For local development, link to local @captify-io/core
cd ../captify-core
npm link
cd ../captify-platform
npm link @captify-io/core
```

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
```

## Development

```bash
# Start development server
npm run dev

# Type checking
npm run type-check

# Build for production
npm run build

# Start production server
npm start
```

## API Routes

### `/api/captify` - AWS Service Proxy

Handles authenticated AWS service calls from external applications.

**Request:**
```json
{
  "service": "platform.dynamodb",
  "operation": "get",
  "table": "core-Users",
  "data": {
    "Key": { "userId": "user-123" }
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": { ... }
}
```

### `/api/auth/[...nextauth]` - NextAuth.js

Standard NextAuth.js endpoints for authentication.

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
- Session timeout is 15 minutes of inactivity
- Tokens refresh 15 minutes before expiry

## Architecture Dependencies

- **@captify-io/core** - UI components, hooks, and utilities
- **next-auth** - Authentication
- **AWS SDK** - Service integrations
- **React 19 & Next.js 15** - Framework

## License

Private - Captify.io Platform
