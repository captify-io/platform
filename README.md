# Captify Platform

A Next.js-based enterprise application platform with dynamic package loading and AWS integration.

## Overview

Captify Platform is a modular application framework that dynamically loads and integrates business applications. It provides authentication via AWS Cognito, a unified UI framework, and seamless integration with AWS services.

## Architecture

### Core Technologies
- **Next.js 15.5** - React framework with App Router
- **TypeScript** - Type-safe development
- **AWS SDK** - Integration with AWS services
- **NextAuth** - Authentication with AWS Cognito
- **Tailwind CSS** - Utility-first CSS framework

### Package Ecosystem

The Captify platform uses a modular package system under the `@captify-io` organization:

#### Foundation Package
- **@captify-io/core** (v1.0.11) - The foundational package providing:
  - Core UI components and design system
  - Authentication utilities and providers
  - Common hooks and utilities
  - Service integration patterns
  - TypeScript type definitions
  - AWS service wrappers

#### Application Packages
Additional application packages are available in the @captify-io ecosystem:

- **@captify-io/pmbook** - Strategic alignment and business operations platform
- **@captify-io/admin** - Platform administration and user management
- **@captify-io/mi** - Materiel Insights for aircraft lifecycle management
- **@captify-io/rmf** - Resource Management Framework for supply chain

Each package is independently versioned and can be installed as needed:

```bash
npm install @captify-io/[package-name]
```

## Installation

### Prerequisites
- Node.js 20.x or later
- npm 10.x or later
- AWS Account with configured services

### Setup

1. Clone the repository:
```bash
git clone https://github.com/captify-io/platform.git
cd platform
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your AWS and application settings:
```env
# AWS Configuration
AWS_REGION=us-east-1
COGNITO_USER_POOL_ID=your-user-pool-id
COGNITO_CLIENT_ID=your-client-id
COGNITO_CLIENT_SECRET=your-client-secret
COGNITO_IDENTITY_POOL_ID=your-identity-pool-id

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret

# Application Configuration
SCHEMA=captify
```

4. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Development

### Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run type-check` - Run TypeScript type checking
- `npm run lint` - Run ESLint

### Adding New Packages

To add a new @captify-io package to your deployment:

1. Install the package:
```bash
npm install @captify-io/[package-name]
```

2. The platform will automatically discover and integrate the package
3. Access the package through the application launcher

### Creating Custom Packages

Custom packages should follow the @captify-io package structure:

1. Export services from a `services` directory
2. Include proper TypeScript definitions
3. Follow the established service pattern with `execute` methods
4. Publish to the GitHub Packages registry

## Deployment

### AWS Elastic Beanstalk

The platform is configured for automated deployment to AWS Elastic Beanstalk via GitHub Actions.

#### Automatic Deployment (GitHub Actions)

Deployments are triggered automatically when pushing to the `master` branch:

1. **Build Phase**: 
   - Runs TypeScript type checking
   - Builds the Next.js application
   - Creates optimized production bundle

2. **Deploy Phase**:
   - Uploads build artifacts to S3
   - Creates new application version in Elastic Beanstalk
   - Deploys to the environment: `Anautics-ai-env`

#### Prerequisites

The following AWS resources must be configured:
- **S3 Bucket**: `elasticbeanstalk-us-east-1-211125459951` (created automatically)
- **EB Application**: `anautics-ai`
- **EB Environment**: `Anautics-ai-env`
- **IAM User**: `mi-app-user` with deployment permissions

#### Required GitHub Secrets

Configure these in your repository settings:
- `NODE_AUTH_TOKEN` - GitHub Personal Access Token for package access
- `AWS_ACCESS_KEY_ID` - AWS access key for deployment
- `AWS_SECRET_ACCESS_KEY` - AWS secret key for deployment

#### Manual Deployment

For manual deployment using EB CLI:
```bash
# Initialize EB CLI (first time only)
eb init -p node.js-20 anautics-ai --region us-east-1

# Deploy to environment
eb deploy Anautics-ai-env
```

### Configuration

The platform uses:
- **Platform**: Amazon Linux 2023
- **Node.js**: Version 20.x
- **Web Server**: nginx (reverse proxy)
- **Port**: 8081 (internal), 80 (external)
- **Instance Type**: Configurable (default: t3.micro)

### Environment Variables

Required environment variables for production:
- `NEXTAUTH_URL` - Production URL
- `NEXTAUTH_SECRET` - NextAuth secret key
- `COGNITO_USER_POOL_ID` - AWS Cognito User Pool
- `COGNITO_CLIENT_ID` - Cognito App Client ID
- `COGNITO_CLIENT_SECRET` - Cognito App Client Secret
- `COGNITO_IDENTITY_POOL_ID` - Cognito Identity Pool
- `AWS_REGION` - AWS region (default: us-east-1)

### Monitoring

Monitor your deployment:
- **Application Health**: AWS Elastic Beanstalk Console
- **Logs**: Available via EB CLI (`eb logs`) or AWS Console
- **Metrics**: CloudWatch dashboards for CPU, memory, and request metrics

## Security

- Authentication via AWS Cognito User Pools
- Authorization with Cognito Identity Pools
- Secure session management
- Environment-based configuration
- No hardcoded credentials

## Package Registry

All @captify-io packages are published to GitHub Packages:

- Registry: `https://npm.pkg.github.com`
- Scope: `@captify-io`
- Authentication: Required for private packages

Configure npm to use GitHub Packages:
```bash
npm config set @captify-io:registry https://npm.pkg.github.com
npm config set //npm.pkg.github.com/:_authToken YOUR_GITHUB_TOKEN
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run type checking: `npm run type-check`
5. Submit a pull request

## License

Proprietary - All rights reserved

## Support

For issues and questions:
- Create an issue in the GitHub repository
- Contact the development team

---

Built with the Captify Platform Framework