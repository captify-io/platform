# Amplify Monorepo Deployment Fix - URGENT

## 🚨 CRITICAL ISSUE
```
2025-08-24T20:33:06.142Z [ERROR]: !!! CustomerError: Cannot read 'next' version in package.json.
If you are using monorepo, please ensure that AMPLIFY_MONOREPO_APP_ROOT is set correctly.
```

## ❗ IMMEDIATE ACTION REQUIRED

**The error occurs BEFORE amplify.yml runs**, so our build script fix won't work. You must set the environment variable in the Amplify Console immediately.

### 🔥 Quick Fix Steps:
1. **Go to AWS Amplify Console NOW**
2. **Navigate to your app** → **App settings** → **Environment variables**
3. **Click "Manage variables"**
4. **Add new environment variable:**
   - **Key**: `AMPLIFY_MONOREPO_APP_ROOT`
   - **Value**: `.`
5. **Save changes**
6. **Redeploy the application**

## Root Cause Analysis

The build log shows:
1. ✅ Git checkout successful (commit: 28006bd)
2. ✅ Git cleanup successful  
3. ❌ **FAILURE HERE**: Amplify tries to read package.json for Next.js version
4. ❌ This happens during **initial detection phase** (before preBuild)
5. ❌ Our amplify.yml environment variable export is too late

## Why This Happens

Amplify's deployment process:
```
1. Git checkout              ← ✅ Works
2. Detect framework          ← ❌ FAILS HERE (needs AMPLIFY_MONOREPO_APP_ROOT)
3. Read amplify.yml          ← Never reaches this step
4. Run preBuild commands     ← Never reaches this step
```

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
