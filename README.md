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

The platform is configured for deployment to AWS Elastic Beanstalk:

1. Ensure AWS credentials are configured
2. Deploy using GitHub Actions (automatic on push to master)
3. Or deploy manually:
```bash
eb deploy
```

### Configuration

The platform uses:
- Amazon Linux 2023
- Node.js 20 platform
- nginx for reverse proxy
- Automatic npm package installation

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