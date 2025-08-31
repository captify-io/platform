# AWS Amplify Deployment Guide

This document outlines the deployment2. **Push to GitHub**

```bash
git add .
git commit -m "Setup Amplify deployment"
git push origin main
```

3. **Connect Repository in Amplify Console**

   - Go to AWS Amplify Console
   - Choose "Host web app"
   - Connect your GitHub repository
   - Select the `main` branch

4. **Configure Build Settings**

   - Amplify should auto-detect the `amplify.yml` file
   - Verify the build configuration looks correct
   - Add environment variables in App settings > Environment variables

5. **Deploy**ptify platform to AWS Amplify.

## Project Structure

This is a **monorepo** with the following structure:

```
captify/
├── src/                    # Next.js application source
├── packages/
│   └── core/              # @captify/core package
├── amplify.yml            # Amplify build configuration
├── package.json           # Root package.json
├── pnpm-workspace.yaml    # PNPM workspace configuration
└── turbo.json            # Turbo build orchestration
```

## Build Process

The Amplify build follows this sequence:

1. **Setup Environment**

   - Install Node.js 22.15.1
   - Install pnpm 9.0.0 via corepack
   - Install all dependencies with `pnpm install --frozen-lockfile`

2. **Build Packages**

   - Build `@captify/core` package first (TypeScript → JavaScript)
   - Type-check the core package
   - Verify build outputs

3. **Build Application**
   - Type-check the entire workspace
   - Build the Next.js application using `pnpm run build:amplify`
   - Verify final build outputs

## Important Files for Deployment

- `amplify.yml` - Build configuration for AWS Amplify
- `pnpm-lock.yaml` - **MUST be committed** for reproducible builds
- `pnpm-workspace.yaml` - Workspace configuration
- `next.config.ts` - Next.js configuration with package transpilation

## Environment Variables

Configure these environment variables in your Amplify app settings:

### Required for Authentication

- `NEXTAUTH_URL` - Your app's URL (e.g., `https://main.d1234567890.amplifyapp.com`)
- `NEXTAUTH_SECRET` - Random secret for JWT signing (generate with `openssl rand -base64 32`)

### AWS Cognito Configuration

- `COGNITO_CLIENT_ID` - Cognito User Pool App Client ID
- `COGNITO_CLIENT_SECRET` - Cognito User Pool App Client Secret
- `COGNITO_USER_POOL_ID` - Cognito User Pool ID
- `COGNITO_IDENTITY_POOL_ID` - Cognito Identity Pool ID

### Optional

- `AWS_REGION` - AWS region (default: us-east-1)
- `SCHEMA` - Database schema name (default: captify)

## Deployment Steps

1. **Ensure Dependencies are Committed**

   ```bash
   # Make sure pnpm-lock.yaml is committed for reproducible builds
   git add pnpm-lock.yaml .gitignore amplify.yml
   git commit -m "Setup Amplify deployment with lockfile"
   ```

2. **Push to GitHub**

   ```bash
   git add .
   git commit -m "Setup Amplify deployment"
   git push origin main
   ```

3. **Connect Repository in Amplify Console**

   - Go to AWS Amplify Console
   - Choose "Host web app"
   - Connect your GitHub repository
   - Select the `main` branch

4. **Configure Build Settings**

   - Amplify should auto-detect the `amplify.yml` file
   - Verify the build configuration looks correct
   - Add environment variables in App settings > Environment variables

5. **Deploy**
   - Amplify will automatically build and deploy
   - Monitor the build process in the Amplify console

## Build Commands for Local Testing

```bash
# Test the full build locally (similar to Amplify)
pnpm run deploy:check    # Type-check and lint
pnpm run build:packages  # Build all packages
pnpm run build          # Build Next.js app

# Clean everything
pnpm run clean:all
```

## Troubleshooting

### Build Fails During Package Build

- Check that `@captify/core` builds successfully locally
- Verify TypeScript configuration in packages
- Check for missing dependencies

### Next.js Build Fails

- Ensure all packages are built before Next.js build
- Check `transpilePackages` in `next.config.ts`
- Verify environment variables are set

### Authentication Issues

- Verify `NEXTAUTH_URL` matches your Amplify app URL
- Check Cognito configuration and credentials
- Ensure `NEXTAUTH_SECRET` is set and secure

## Performance Optimizations

- **Caching**: Build outputs and dependencies are cached between deployments
- **Frozen Lockfile**: Uses `--frozen-lockfile` for faster, reproducible installs
- **Incremental Builds**: Packages only rebuild when changed
- **Bundle Optimization**: Next.js optimizations enabled for production builds

## Monitoring

After deployment, monitor:

- Build times in Amplify console
- Application performance
- Error rates and logs
- Authentication flow functionality
