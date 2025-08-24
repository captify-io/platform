# 🚨 URGENT: Amplify Console Environment Variable Setup

## Step-by-Step Visual Guide

### 1. Access AWS Amplify Console
- Go to: https://console.aws.amazon.com/amplify/
- Select your region
- Click on your `captify-io` app

### 2. Navigate to Environment Variables
```
App Overview → App settings (left sidebar) → Environment variables
```

### 3. Add the Critical Variable
Click **"Manage variables"** button

Add new environment variable:
```
Key:   AMPLIFY_MONOREPO_APP_ROOT
Value: .
```

### 4. Verify the Setting
Your environment variables should show:
```
AMPLIFY_MONOREPO_APP_ROOT = .
NEXTAUTH_URL = https://your-domain.amplifyapp.com
NEXTAUTH_SECRET = your-secret
... (other existing variables)
```

### 5. Redeploy
- Click **"Save"**
- Go to **"Deployments"** 
- Click **"Redeploy this version"** or trigger new deployment

## ⚠️ Critical Notes

1. **The dot (.) is correct** - it means "root directory"
2. **This MUST be set before deployment** - it cannot be fixed during build
3. **Case sensitive** - use exact key name: `AMPLIFY_MONOREPO_APP_ROOT`
4. **No quotes around the value** - just a single dot: `.`

## Verification

After setting the variable and redeploying, check build logs for:
```
✅ Successfully detected framework: Next.js
✅ Next.js version: 15.5.0 found in package.json
```

Instead of:
```
❌ Cannot read 'next' version in package.json
```
