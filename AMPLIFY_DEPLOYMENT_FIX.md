# Amplify Monorepo Deployment Fix

## Problem
```
CustomerError: Cannot read 'next' version in package.json.
If you are using monorepo, please ensure that AMPLIFY_MONOREPO_APP_ROOT is set correctly.
```

## Root Cause
AWS Amplify doesn't automatically detect that the Next.js application is in the root directory of the monorepo. It needs explicit configuration.

## Solution 1: Environment Variable in Amplify Console (Recommended)

### Steps:
1. Go to your Amplify App in AWS Console
2. Navigate to **App settings** → **Environment variables**
3. Add new environment variable:
   - **Key**: `AMPLIFY_MONOREPO_APP_ROOT`
   - **Value**: `.` (dot for root directory)
4. Redeploy the application

### Alternative Values:
- If your Next.js app was in a subdirectory like `apps/web`, you'd use: `apps/web`
- Since our app is in the root, we use: `.`

## Solution 2: amplify.yml Configuration (Already Applied)

I've updated the `amplify.yml` file to:
1. Set the `AMPLIFY_MONOREPO_APP_ROOT` environment variable at build time
2. Add debugging output to verify package.json detection
3. Validate Next.js version is found

## Verification

After applying either solution, check the build logs for:
```bash
✅ Next.js version found in package.json: 15.5.0
✅ AMPLIFY_MONOREPO_APP_ROOT set to: .
```

## Monorepo Structure Explanation

Our project structure:
```
captify/                    ← Root (where Next.js app lives)
├── package.json           ← Contains Next.js 15.5.0
├── next.config.ts         ← Next.js config
├── src/app/              ← Next.js app directory
└── packages/             ← Workspace packages
    ├── api/
    ├── core/
    └── veripicks/
```

## Additional Resources
- [AWS Amplify Monorepo Documentation](https://docs.aws.amazon.com/amplify/latest/userguide/monorepo-configuration.html)
- [Amplify Environment Variables](https://docs.aws.amazon.com/amplify/latest/userguide/environment-variables.html)
