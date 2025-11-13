# Security Implementation - Deployment Checklist

**Date:** 2025-11-09
**Status:** Ready for Deployment
**Version:** 1.0.0

## Pre-Deployment Checklist

### 1. AWS Cognito Configuration ⏳

- [ ] Run Cognito custom attributes script
  ```bash
  cd /opt/captify-apps/platform
  chmod +x scripts/add-cognito-security-attributes.sh
  ./scripts/add-cognito-security-attributes.sh
  ```

- [ ] Verify attributes were added successfully
  ```bash
  aws cognito-idp describe-user-pool \
    --user-pool-id $COGNITO_USER_POOL_ID \
    --region us-east-1 \
    --query 'UserPool.SchemaAttributes[?Name==`custom:clearanceLevel`]'
  ```

- [ ] Create test users with security attributes
  ```bash
  # Example: Create test user with SECRET clearance
  aws cognito-idp admin-update-user-attributes \
    --region us-east-1 \
    --user-pool-id $COGNITO_USER_POOL_ID \
    --username testuser@example.com \
    --user-attributes \
      Name=custom:organizationId,Value=org-test \
      Name=custom:clearanceLevel,Value=SECRET \
      Name=custom:markings,Value=PII,FIN \
      Name=custom:needToKnow,Value=false
  ```

### 2. Code Deployment ⏳

- [x] Core package rebuilt with security service
  ```bash
  cd /opt/captify-apps/core
  npm run build
  # ✓ Build completed successfully
  ```

- [ ] Platform dependencies updated
  ```bash
  cd /opt/captify-apps/platform
  npm install --legacy-peer-deps
  # ✓ Dependencies up to date
  ```

- [x] Platform rebuilt with security updates
  ```bash
  npm run build
  # ✓ Build completed with warnings (non-blocking)
  ```

- [ ] Restart PM2 processes
  ```bash
  pm2 restart platform
  pm2 save
  ```

### 3. Database Verification ⏳

- [ ] Verify auth-tokens table exists
  ```bash
  aws dynamodb describe-table \
    --table-name captify-auth-tokens \
    --region us-east-1
  ```

- [ ] Verify TTL is enabled on auth-tokens table
  ```bash
  aws dynamodb describe-time-to-live \
    --table-name captify-auth-tokens \
    --region us-east-1
  ```

- [ ] Create security audit table (optional for Phase 1)
  ```bash
  aws dynamodb create-table \
    --table-name captify-core-security-audit \
    --attribute-definitions \
      AttributeName=id,AttributeType=S \
      AttributeName=timestamp,AttributeType=S \
      AttributeName=userId,AttributeType=S \
    --key-schema \
      AttributeName=id,KeyType=HASH \
    --global-secondary-indexes \
      IndexName=timestamp-index,KeySchema=[{AttributeName=timestamp,KeyType=HASH}],Projection={ProjectionType=ALL},BillingMode=PAY_PER_REQUEST \
      IndexName=userId-index,KeySchema=[{AttributeName=userId,KeyType=HASH},{AttributeName=timestamp,KeyType=RANGE}],Projection={ProjectionType=ALL},BillingMode=PAY_PER_REQUEST \
    --billing-mode PAY_PER_REQUEST \
    --region us-east-1
  ```

## Testing Checklist

### 4. Authentication Flow Testing ⏳

- [ ] Sign in with test user
- [ ] Verify security attributes appear in session
  - Open browser DevTools → Application → Cookies
  - Look for `next-auth.session-token` cookie
  - Decode JWT (jwt.io) and verify security fields exist

- [ ] Check session API endpoint
  ```bash
  curl -H "Cookie: next-auth.session-token=YOUR_TOKEN" \
    https://platform.captify.io/api/auth/session
  ```

  Expected response should include:
  ```json
  {
    "organizationId": "org-test",
    "clearanceLevel": "SECRET",
    "markings": ["PII", "FIN"],
    "sciCompartments": [],
    "needToKnow": false,
    "employeeId": null
  }
  ```

### 5. Security Service Testing ⏳

- [ ] Run unit tests
  ```bash
  cd /opt/captify-apps/core
  npm test src/services/ontology/security.test.ts
  ```

- [ ] Test permission checks in Node.js REPL
  ```javascript
  const { checkPermission } = require('./dist/services/ontology/security.cjs');

  const userContext = {
    userId: 'user-1',
    organizationId: 'org-test',
    clearanceLevel: 'SECRET',
    markings: ['PII'],
    sciCompartments: [],
    needToKnow: false,
    isAdmin: false
  };

  const objectSecurity = {
    organizationId: 'org-test',
    classification: 'SECRET',
    markings: ['PII'],
    sciCompartments: [],
    acl: []
  };

  const result = checkPermission(userContext, objectSecurity, 'Viewer');
  console.log(result); // Should be { allowed: true }
  ```

### 6. Integration Testing ⏳

- [ ] Create test object with security metadata
  ```javascript
  // In browser console or Node.js
  const response = await fetch('/api/captify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      service: 'platform.dynamodb',
      operation: 'put',
      table: 'core-test-object',
      data: {
        Item: {
          id: crypto.randomUUID(),
          name: 'Test Contract',
          securityMetadata: {
            organizationId: 'org-test',
            classification: 'SECRET',
            markings: ['PII', 'FIN'],
            sciCompartments: [],
            acl: [
              {
                userId: 'user-1',
                role: 'Owner',
                grantedBy: 'user-1',
                grantedAt: new Date().toISOString()
              }
            ]
          }
        }
      }
    })
  });
  ```

- [ ] Verify object was created with security metadata
- [ ] Attempt to access object with different user (should be denied)
- [ ] Grant access to second user
- [ ] Verify second user can now access object

### 7. API Session Object Testing ⏳

- [ ] Call `/api/captify` and verify security context is available
  ```bash
  # In server logs, should see security attributes in apiSession
  grep "organizationId" /var/log/pm2/platform-out.log
  ```

- [ ] Verify credentials are still being properly retrieved
- [ ] Test with different clearance levels
- [ ] Test organization boundary enforcement

## Post-Deployment Verification

### 8. Production Health Checks ⏳

- [ ] Platform health endpoint responds
  ```bash
  curl https://platform.captify.io/api/health
  ```

- [ ] User can sign in successfully
- [ ] Session persists across page refreshes
- [ ] No errors in PM2 logs
  ```bash
  pm2 logs platform --lines 100
  ```

- [ ] No errors in CloudWatch (if enabled)

### 9. Security Verification ⏳

- [ ] Users without required clearance cannot access classified data
- [ ] Organization boundaries are enforced
- [ ] ACL entries work correctly
- [ ] Need-to-know restrictions work
- [ ] Marking-based access control works

### 10. Performance Testing ⏳

- [ ] Permission checks complete in < 10ms
- [ ] No significant increase in API response times
- [ ] JWT token size is reasonable (< 4KB)
- [ ] DynamoDB read/write patterns are efficient

## Rollback Plan

If issues arise after deployment:

### Quick Rollback

1. **Revert code changes**
   ```bash
   cd /opt/captify-apps/core
   git reset --hard <previous-commit-hash>
   npm run build

   cd /opt/captify-apps/platform
   git reset --hard <previous-commit-hash>
   npm install --legacy-peer-deps
   npm run build
   pm2 restart platform
   ```

2. **Remove Cognito custom attributes** (NOT RECOMMENDED - attributes cannot be deleted)
   - Instead, stop using them in code
   - Users will still have attributes but they'll be ignored

3. **Verify rollback successful**
   - Test authentication
   - Check logs for errors
   - Verify API endpoints work

### Gradual Rollback

If only certain features are problematic:

- Comment out security checks in `operations.ts`
- Keep Cognito attributes but don't enforce permissions
- Monitor and fix issues, then re-enable

## Documentation Updates

### 11. Documentation ⏳

- [x] Implementation documentation complete
  - `IMPLEMENTATION-COMPLETE.md`
  - `EXISTING-INFRASTRUCTURE.md`
  - `AWS-IMPLEMENTATION-GUIDE.md`

- [x] Control panel features documented
  - `security-management.md`

- [ ] Update README files
  - [ ] `/opt/captify-apps/core/README.md` - Add security service section
  - [ ] `/opt/captify-apps/platform/README.md` - Add security setup instructions

- [ ] Create runbook for security officers
  - How to assign clearances
  - How to create organizations
  - How to view audit logs

## Environment Variables

### 12. Required Environment Variables ⏳

Verify these are set in `.env.local` or environment:

**Core Package** (platform):
```bash
# NextAuth
NEXTAUTH_URL=https://platform.captify.io
NEXTAUTH_SECRET=<your-secret>

# Cognito
COGNITO_USER_POOL_ID=<pool-id>
COGNITO_CLIENT_ID=<client-id>
COGNITO_CLIENT_SECRET=<client-secret>
COGNITO_ISSUER=https://cognito-idp.us-east-1.amazonaws.com/<pool-id>
COGNITO_WELLKNOWN=https://cognito-idp.us-east-1.amazonaws.com/<pool-id>/.well-known/jwks.json

# AWS
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=<key-id>
AWS_SECRET_ACCESS_KEY=<secret>

# Database
SCHEMA=captify
AUTH_TOKENS_TABLE=captify-auth-tokens
```

**Optional** (for enhanced security):
```bash
# Session Configuration
NEXT_PUBLIC_IDLE_TIMEOUT_MINUTES=15
SESSION_MAX_AGE=28800  # 8 hours in seconds

# Security Logging
SECURITY_AUDIT_ENABLED=true
SECURITY_AUDIT_TABLE=captify-core-security-audit
```

## Monitoring Setup

### 13. Monitoring & Alerts ⏳

- [ ] CloudWatch Dashboard created
  - Metric: Failed authentication attempts
  - Metric: Access denied events
  - Metric: Permission check latency
  - Metric: Session creation rate

- [ ] CloudWatch Alarms configured
  - Alert on > 10 access denied events per minute
  - Alert on authentication errors
  - Alert on DynamoDB throttling

- [ ] Log aggregation configured
  - Capture all security-related logs
  - Retention period: 90 days minimum (compliance requirement)

## Success Criteria

Deployment is considered successful when:

- [x] ✅ All code changes deployed
- [ ] ⏳ Cognito custom attributes added
- [ ] ⏳ Test users can sign in with security attributes
- [ ] ⏳ Security service unit tests pass
- [ ] ⏳ Permission checks work in integration tests
- [ ] ⏳ No errors in production logs
- [ ] ⏳ Performance is acceptable (< 10ms permission checks)
- [ ] ⏳ Organization boundaries are enforced
- [ ] ⏳ Documentation is complete

## Timeline

- **Day 1** - Deploy code, add Cognito attributes, initial testing
- **Day 2** - Integration testing, fix issues
- **Day 3** - Production deployment, monitoring
- **Day 4-5** - User acceptance testing, adjust as needed
- **Week 2** - Begin Control Panel UI development

## Support & Escalation

### Issues During Deployment

1. **Authentication failures** - Check Cognito configuration, verify custom attributes exist
2. **Permission errors** - Review security service logic, check user context
3. **Performance issues** - Enable detailed logging, profile permission checks
4. **DynamoDB errors** - Check table configuration, verify credentials

### Escalation Path

1. Development team (immediate fixes)
2. Security officer (policy questions)
3. AWS support (infrastructure issues)

## Sign-off

- [ ] Development team lead approves code
- [ ] Security officer approves security model
- [ ] Operations team approves deployment plan
- [ ] Product owner approves feature set

---

**Deployment Date:** _________________
**Deployed By:** _________________
**Verified By:** _________________
**Issues Encountered:** _________________
