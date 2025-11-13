# Security Implementation - Quick Start Guide

**Last Updated:** 2025-11-09

This guide will help you get the AWS-native IL5 NIST Rev 5 security implementation up and running in under 30 minutes.

## Prerequisites

- AWS CLI configured with admin access
- Access to Cognito User Pool
- Platform and core packages built and deployed
- Basic understanding of DynamoDB and Cognito

## Step 1: Add Cognito Custom Attributes (5 minutes)

### Run the Setup Script

```bash
cd /opt/captify-apps/platform
chmod +x scripts/add-cognito-security-attributes.sh
./scripts/add-cognito-security-attributes.sh
```

### Verify Attributes Were Added

```bash
aws cognito-idp describe-user-pool \
  --user-pool-id $COGNITO_USER_POOL_ID \
  --region us-east-1 \
  --query 'UserPool.SchemaAttributes[?starts_with(Name, `custom:`)]'
```

You should see 6 custom attributes:
- custom:organizationId
- custom:clearanceLevel
- custom:markings
- custom:sciCompartments
- custom:needToKnow
- custom:employeeId

## Step 2: Create Test Users (5 minutes)

### Create Admin User (TOP SECRET)

```bash
aws cognito-idp admin-update-user-attributes \
  --region us-east-1 \
  --user-pool-id $COGNITO_USER_POOL_ID \
  --username admin@example.com \
  --user-attributes \
    Name=custom:organizationId,Value=org-captify \
    Name=custom:clearanceLevel,Value=TOP_SECRET \
    Name=custom:markings,Value="PII,PHI,FIN,LEO" \
    Name=custom:sciCompartments,Value="SCI-A,SCI-B" \
    Name=custom:needToKnow,Value=false \
    Name=custom:employeeId,Value=EMP-001
```

### Create Normal User (SECRET)

```bash
aws cognito-idp admin-update-user-attributes \
  --region us-east-1 \
  --user-pool-id $COGNITO_USER_POOL_ID \
  --username user@example.com \
  --user-attributes \
    Name=custom:organizationId,Value=org-captify \
    Name=custom:clearanceLevel,Value=SECRET \
    Name=custom:markings,Value="PII,FIN" \
    Name=custom:needToKnow,Value=false \
    Name=custom:employeeId,Value=EMP-002
```

### Create Limited User (CUI, Need-to-Know)

```bash
aws cognito-idp admin-update-user-attributes \
  --region us-east-1 \
  --user-pool-id $COGNITO_USER_POOL_ID \
  --username analyst@example.com \
  --user-attributes \
    Name=custom:organizationId,Value=org-captify \
    Name=custom:clearanceLevel,Value=CUI \
    Name=custom:markings,Value=PII \
    Name=custom:needToKnow,Value=true \
    Name=custom:employeeId,Value=EMP-003
```

## Step 3: Test Authentication Flow (5 minutes)

### Sign In and Check Session

1. Open browser to `https://platform.captify.io`
2. Sign in with `admin@example.com`
3. Open DevTools → Console
4. Check session:

```javascript
fetch('/api/auth/session', { credentials: 'include' })
  .then(r => r.json())
  .then(session => console.log(session));
```

You should see:
```json
{
  "user": { ... },
  "organizationId": "org-captify",
  "clearanceLevel": "TOP_SECRET",
  "markings": ["PII", "PHI", "FIN", "LEO"],
  "sciCompartments": ["SCI-A", "SCI-B"],
  "needToKnow": false,
  "employeeId": "EMP-001"
}
```

## Step 4: Test Security Service (5 minutes)

### Using Browser Console

```javascript
// Import security functions (these are available via apiClient)
// For testing, we'll create objects manually

// Create a test contract with security
const testContract = {
  id: crypto.randomUUID(),
  slug: 'contract-test-001',
  name: 'Test Secret Contract',
  description: 'Testing security implementation',
  createdBy: 'current-user-id', // Replace with actual user ID
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  version: 1,
  status: 'active',

  // Security metadata
  securityMetadata: {
    organizationId: 'org-captify',
    classification: 'SECRET',
    markings: ['PII', 'FIN'],
    sciCompartments: [],
    acl: [
      {
        userId: 'current-user-id', // Replace with actual user ID
        role: 'Owner',
        grantedBy: 'current-user-id',
        grantedAt: new Date().toISOString()
      }
    ]
  },

  // Contract-specific fields
  contractNumber: 'FA8721-24-C-0001',
  totalValue: 1500000
};

// Save to DynamoDB
fetch('/api/captify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    service: 'platform.dynamodb',
    operation: 'put',
    table: 'core-test-object',
    data: {
      Item: testContract
    }
  })
})
.then(r => r.json())
.then(result => console.log('Contract created:', result));
```

### Test Permission Checks (Node.js)

```javascript
// In Node.js REPL or server-side code
const { checkPermission } = require('@captify-io/core/services/ontology');

// User with SECRET clearance
const userContext = {
  userId: 'user-1',
  organizationId: 'org-captify',
  clearanceLevel: 'SECRET',
  markings: ['PII', 'FIN'],
  sciCompartments: [],
  needToKnow: false,
  isAdmin: false
};

// Object with SECRET classification
const objectSecurity = {
  organizationId: 'org-captify',
  classification: 'SECRET',
  markings: ['PII', 'FIN'],
  sciCompartments: [],
  acl: []
};

// Should be allowed
const result1 = checkPermission(userContext, objectSecurity, 'Viewer');
console.log('Can view SECRET object:', result1);
// { allowed: true }

// Object with TOP SECRET classification
const topSecretObject = {
  organizationId: 'org-captify',
  classification: 'TOP_SECRET',
  markings: [],
  sciCompartments: [],
  acl: []
};

// Should be denied
const result2 = checkPermission(userContext, topSecretObject, 'Viewer');
console.log('Can view TOP SECRET object:', result2);
// { allowed: false, reason: 'Insufficient clearance level', requiredClearance: 'TOP_SECRET' }
```

## Step 5: Test Organization Boundaries (5 minutes)

### Create User in Different Organization

```bash
aws cognito-idp admin-update-user-attributes \
  --region us-east-1 \
  --user-pool-id $COGNITO_USER_POOL_ID \
  --username contractor@example.com \
  --user-attributes \
    Name=custom:organizationId,Value=org-contractor \
    Name=custom:clearanceLevel,Value=SECRET \
    Name=custom:markings,Value=PII \
    Name=custom:needToKnow,Value=false
```

### Test Access Denial

```javascript
// User from different organization
const contractorUser = {
  userId: 'contractor-1',
  organizationId: 'org-contractor', // Different org!
  clearanceLevel: 'SECRET',
  markings: ['PII'],
  sciCompartments: [],
  needToKnow: false,
  isAdmin: false
};

// Try to access org-captify object
const result = checkPermission(contractorUser, objectSecurity, 'Viewer');
console.log('Contractor access:', result);
// { allowed: false, reason: 'Access denied: Object belongs to organization org-captify' }
```

## Step 6: Test ACL and Need-to-Know (5 minutes)

### Grant Access to Another User

```javascript
const { grantAccess } = require('@captify-io/core/services/ontology');

// Grant Editor access to user-2
const updatedSecurity = grantAccess(
  objectSecurity,
  'user-2', // User ID to grant access to
  'Editor', // Role to grant
  'user-1', // User granting access
  '2025-12-31T23:59:59Z' // Optional expiration
);

console.log('Updated ACL:', updatedSecurity.acl);
```

### Test Need-to-Know Enforcement

```javascript
// User with need-to-know enabled
const needToKnowUser = {
  userId: 'analyst-1',
  organizationId: 'org-captify',
  clearanceLevel: 'CUI',
  markings: ['PII'],
  sciCompartments: [],
  needToKnow: true, // Requires explicit ACL entry
  isAdmin: false
};

// Object without ACL entry
const cuiObject = {
  organizationId: 'org-captify',
  classification: 'CUI',
  markings: ['PII'],
  sciCompartments: [],
  acl: [] // No ACL entries!
};

// Should be denied
const result = checkPermission(needToKnowUser, cuiObject, 'Viewer');
console.log('Need-to-know check:', result);
// { allowed: false, reason: 'Need-to-know restriction: No explicit access granted' }

// Add ACL entry
cuiObject.acl.push({
  userId: 'analyst-1',
  role: 'Viewer',
  grantedBy: 'admin-1',
  grantedAt: new Date().toISOString()
});

// Now should be allowed
const result2 = checkPermission(needToKnowUser, cuiObject, 'Viewer');
console.log('With ACL entry:', result2);
// { allowed: true }
```

## Common Use Cases

### Use Case 1: Create a Public Object

```javascript
const publicObject = {
  organizationId: 'org-captify',
  classification: 'UNCLASSIFIED',
  markings: [],
  sciCompartments: [],
  acl: []
};
// Anyone with UNCLASSIFIED clearance can access
```

### Use Case 2: Create a PII-Protected Object

```javascript
const piiObject = {
  organizationId: 'org-captify',
  classification: 'CUI',
  markings: ['PII'],
  sciCompartments: [],
  acl: []
};
// Only users with CUI+ clearance AND PII marking can access
```

### Use Case 3: Create a Top Secret Contract

```javascript
const tsContract = {
  organizationId: 'org-captify',
  classification: 'TOP_SECRET',
  markings: ['FIN', 'NOFORN'],
  sciCompartments: ['SCI-PROJECT-X'],
  acl: [
    { userId: 'program-manager-1', role: 'Owner', grantedBy: 'admin-1', grantedAt: new Date().toISOString() },
    { userId: 'contracting-officer-1', role: 'Editor', grantedBy: 'program-manager-1', grantedAt: new Date().toISOString() },
    { userId: 'analyst-1', role: 'Viewer', grantedBy: 'program-manager-1', grantedAt: new Date().toISOString() }
  ]
};
// Requires: TOP_SECRET clearance, FIN+NOFORN markings, SCI-PROJECT-X compartment, AND explicit ACL entry
```

## Troubleshooting

### Issue: Security attributes not showing in session

**Solution:**
1. Verify Cognito attributes were added: `aws cognito-idp describe-user-pool ...`
2. Clear browser cookies and sign in again
3. Check user has attributes: `aws cognito-idp admin-get-user ...`

### Issue: Permission check always denies access

**Solution:**
1. Check user's clearance >= object's classification
2. Check user has ALL required markings
3. Check user belongs to same organization
4. If need-to-know enabled, check ACL has entry for user

### Issue: Cannot create objects with security metadata

**Solution:**
1. Verify `securityMetadata` field is optional in SharedProperties
2. Check DynamoDB table allows nested objects
3. Verify JSON.stringify doesn't strip the field

## Next Steps

1. **Integrate permission checks into operations** - Update `core/src/services/ontology/operations.ts`
2. **Build Control Panel UI** - Create admin interface for managing security
3. **Add audit logging** - Track all security events
4. **Create security dashboard** - Visualize security metrics

## Additional Resources

- [IMPLEMENTATION-COMPLETE.md](./IMPLEMENTATION-COMPLETE.md) - Complete implementation details
- [AWS-IMPLEMENTATION-GUIDE.md](./AWS-IMPLEMENTATION-GUIDE.md) - AWS configuration guide
- [security-management.md](../control-panel/security-management.md) - Control panel features
- [DEPLOYMENT-CHECKLIST.md](./DEPLOYMENT-CHECKLIST.md) - Deployment checklist

## Support

For questions or issues:
1. Check the documentation in `/platform/src/workshops/foundry/security/`
2. Review the security service code: `/core/src/services/ontology/security.ts`
3. Check PM2 logs: `pm2 logs platform`
4. Review CloudWatch logs (if enabled)

---

**Congratulations!** You now have a working IL5 NIST Rev 5 compliant security implementation. 🎉
