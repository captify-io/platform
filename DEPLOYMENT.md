# Amplify Deployment Guide

This guide covers how to deploy the Captify application to AWS Amplify.

## Prerequisites

1. **AWS Account** with appropriate permissions
2. **Amplify CLI** installed globally
3. **Node.js 22.15.1** (managed automatically by Amplify)
4. **pnpm** package manager
5. **Environment variables** configured

## Quick Start

### 1. Install Amplify CLI
```bash
npm install -g @aws-amplify/cli
```

### 2. Configure Amplify
```bash
amplify configure
```
Follow the prompts to set up your AWS credentials.

### 3. Deploy to Environment

**For Linux/macOS:**
```bash
chmod +x deploy.sh
./deploy.sh dev     # Deploy to development
./deploy.sh staging # Deploy to staging  
./deploy.sh prod    # Deploy to production
```

**For Windows:**
```powershell
.\deploy.ps1 dev     # Deploy to development
.\deploy.ps1 staging # Deploy to staging
.\deploy.ps1 prod    # Deploy to production
```

## Environment Configuration

### Required Environment Variables

Set these in the Amplify Console for each environment:

#### Authentication
- `NEXTAUTH_URL` - Your application URL
- `NEXTAUTH_SECRET` - Secret key for NextAuth.js

#### AWS Cognito
- `NEXT_PUBLIC_COGNITO_CLIENT_ID` - Cognito App Client ID
- `NEXT_PUBLIC_COGNITO_ISSUER` - Cognito Issuer URL
- `COGNITO_CLIENT_SECRET` - Cognito App Client Secret
- `COGNITO_USER_POOL_ID` - Cognito User Pool ID
- `COGNITO_SERVICE_CATALOG_POOL_ID` - Service Catalog Pool ID
- `COGNITO_DOMAIN` - Cognito Domain URL

#### AWS Services
- `REGION` - AWS Region (e.g., us-east-1)
- `ACCESS_KEY_ID` - AWS Access Key ID
- `SECRET_ACCESS_KEY` - AWS Secret Access Key
- `BEDROCK_AGENT_ID` - Bedrock Agent ID
- `BEDROCK_AGENT_ALIAS_ID` - Bedrock Agent Alias ID
- `BEDROCK_SESSION_ID` - Bedrock Session ID
- `NEXT_PUBLIC_BEDROCK_AGENT_ID` - Public Bedrock Agent ID

#### Storage & Database
- `S3_BUCKET` - S3 Bucket Name
- `S3_REGION` - S3 Region
- `DYNAMODB_APPLICATIONS_TABLE` - Applications Table Name
- `DYNAMODB_USER_APPLICATION_STATE_TABLE` - User State Table Name
- `DYNAMODB_ORGANIZATION_SETTINGS_TABLE` - Organization Settings Table Name

#### API Gateway
- `API_GATEWAY_URL` - API Gateway URL

### Setting Environment Variables in Amplify Console

1. Go to AWS Amplify Console
2. Select your app
3. Go to **Environment variables** in the left sidebar
4. Add variables for your environment (dev/staging/prod)

## Build Configuration

The build process includes:

1. **Environment Setup** - Node.js 22.15.1 and pnpm installation
2. **Dependency Installation** - Clean install with frozen lockfile
3. **Environment Validation** - Verify critical variables are set
4. **Quality Checks** - Linting and type checking
5. **Build** - Next.js production build
6. **Deployment** - Static assets deployment

## Environments

### Development (`dev`)
- Automatic deployment on feature branch pushes
- Basic validation and testing
- Relaxed error handling for debugging

### Staging (`staging`) 
- Deployment for testing and QA
- Full validation pipeline
- Production-like environment for final testing

### Production (`prod`)
- Manual deployment with confirmation
- Strict validation and error handling
- Production optimizations enabled

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check environment variables are set correctly
   - Verify AWS credentials have proper permissions
   - Review build logs in Amplify Console

2. **Environment Variable Issues**
   - Ensure all required variables are set in Amplify Console
   - Check variable names match exactly (case-sensitive)
   - Verify public variables start with `NEXT_PUBLIC_`

3. **Authentication Issues**
   - Verify Cognito configuration is correct
   - Check NEXTAUTH_URL matches your domain
   - Ensure NEXTAUTH_SECRET is properly generated

4. **AWS Service Permissions**
   - Verify IAM roles have necessary permissions
   - Check resource access policies
   - Ensure region consistency across services

### Debug Commands

```bash
# Check Amplify status
amplify status

# View deployment logs
amplify console

# Test local build
pnpm run build

# Validate environment
pnpm run validate
```

## Performance Optimizations

The deployment includes several optimizations:

- **Image Optimization** - WebP and AVIF formats
- **Caching** - Aggressive caching for static assets
- **Bundle Optimization** - Tree shaking and code splitting
- **Security Headers** - Production security headers
- **Compression** - Gzip compression enabled

## Security

- Environment variables are encrypted in Amplify
- Secrets are not logged during build
- Security headers are enforced
- HTTPS is enabled by default

## Monitoring

Monitor your deployment through:

- **Amplify Console** - Build logs and metrics
- **CloudWatch** - Application logs and metrics
- **AWS X-Ray** - Request tracing (if enabled)

## Support

For deployment issues:

1. Check the troubleshooting section above
2. Review Amplify Console logs
3. Verify environment configuration
4. Contact the development team

---

**Last Updated:** $(date)
**Version:** 1.0.0
