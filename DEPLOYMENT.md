# Captify Platform Deployment Guide

## Prerequisites

1. SSH access to EC2 instance at captify.io
2. SSH key: ~/.ssh/captify-platform.pem
3. GitHub access configured on EC2

## Deployment Steps

### 1. SSH into EC2

```bash
ssh -i ~/.ssh/captify-platform.pem ubuntu@captify.io
```

### 2. Clone/Update Platform Repository

If first deployment:
```bash
cd /home/ubuntu
git clone https://github.com/captify-io/platform.git captify-platform
cd captify-platform
```

If updating:
```bash
cd /home/ubuntu/captify-platform
git pull origin master
```

### 3. Install Dependencies

The platform uses @captify-io/core as a linked dependency for now (until GitHub packages authentication is set up):

```bash
# Clone core library
cd /home/ubuntu
git clone https://github.com/captify-io/core.git captify-core
cd captify-core
npm install --legacy-peer-deps
npm run build
npm link

# Link to platform
cd /home/ubuntu/captify-platform
npm install --legacy-peer-deps
npm link @captify-io/core
```

### 4. Set Environment Variables

Create `.env.local` file:

```bash
cd /home/ubuntu/captify-platform
nano .env.local
```

Required variables:
```env
NEXTAUTH_URL=https://captify.io
NEXTAUTH_SECRET=your-secret-key
COGNITO_USER_POOL_ID=your-user-pool-id
COGNITO_CLIENT_ID=your-client-id
COGNITO_CLIENT_SECRET=your-client-secret
COGNITO_DOMAIN=your-cognito-domain
COGNITO_IDENTITY_POOL_ID=your-identity-pool-id
AWS_REGION=us-east-1
SCHEMA=your-schema-name
DOMAIN=captify.io
```

### 5. Build Platform

```bash
npm run build
```

### 6. Stop Old Platform (if running)

```bash
pm2 stop platform
# or
pm2 delete platform
```

### 7. Start New Platform

```bash
pm2 start npm --name "platform" -- start
pm2 save
```

### 8. Verify Deployment

```bash
pm2 logs platform
curl https://captify.io/health
```

## Nginx Configuration

The platform should be proxied through nginx:

```nginx
server {
    listen 443 ssl;
    server_name captify.io;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Troubleshooting

### Build Fails

Check that @captify-io/core is properly linked:
```bash
ls -la node_modules/@captify-io/core
npm link @captify-io/core
```

### Platform Won't Start

Check logs:
```bash
pm2 logs platform --lines 100
```

Check environment variables:
```bash
cat .env.local
```

### Type Errors

Rebuild @captify-io/core:
```bash
cd /home/ubuntu/captify-core
npm run build
```

## Architecture Notes

- **@captify-io/core** (v2.0.0): Library package with components, hooks, and utilities
- **@captify-io/platform** (v1.0.0): Next.js application with API routes and auth
- Core is built with tsup, Platform is built with Next.js

## Version Information

- Current Core Version: 2.0.0
- Current Platform Version: 1.0.0
- Node Version Required: 18+
- Next.js Version: 15.5.4
- React Version: 19.1.1
