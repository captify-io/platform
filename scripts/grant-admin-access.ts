#!/usr/bin/env tsx
/**
 * Grant Admin Access to Mike Johnson
 *
 * Creates app-member entries to grant admin access to all apps:
 * - admin (platform administration)
 * - spaces (work management)
 * - pmbook (contracting operations)
 * - aihub (AI hub)
 * - mi (materiel insights)
 */

import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';

const SCHEMA = process.env.SCHEMA || 'captify';
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';

const client = new DynamoDBClient({ region: AWS_REGION });

// Mike's user information
const MIKE_USER_ID = 'b7f4c827-e6ec-4f0f-a5bd-997f011ba3a0';
const MIKE_EMAIL = 'mike.johnson@anautics.com';
const MIKE_NAME = 'Mike Johnson';

// Apps to grant access to
const apps = [
  { appId: 'admin', name: 'Platform Administration' },
  { appId: 'spaces', name: 'Spaces (Work Management)' },
  { appId: 'pmbook', name: 'PMBook (Contracting)' },
  { appId: 'aihub', name: 'AI Hub' },
  { appId: 'mi', name: 'Materiel Insights' },
];

async function grantAccess(appId: string, appName: string) {
  const timestamp = new Date().toISOString();
  const membershipId = `${MIKE_USER_ID}-${appId}`;

  const item = {
    id: { S: membershipId },
    userId: { S: MIKE_USER_ID },
    appId: { S: appId },
    role: { S: 'admin' },
    status: { S: 'active' },
    iamRoleArn: { S: `arn:aws:iam::${process.env.AWS_ACCOUNT_ID || '123456789012'}:role/Captify${appId.charAt(0).toUpperCase() + appId.slice(1)}AdminRole` },
    requestedAt: { S: timestamp },
    approvedAt: { S: timestamp },
    approvedBy: { S: 'system' },
    createdAt: { S: timestamp },
    updatedAt: { S: timestamp },
    createdBy: { S: 'system' },
    updatedBy: { S: 'system' },
  };

  try {
    await client.send(
      new PutItemCommand({
        TableName: `${SCHEMA}-core-app-member`,
        Item: item,
      })
    );
    console.log(`   ✅ ${appName} (${appId})`);
  } catch (error: any) {
    console.error(`   ❌ ${appName} (${appId}):`, error.message);
    throw error;
  }
}

async function main() {
  console.log('🚀 Granting Admin Access');
  console.log(`📍 Region: ${AWS_REGION}`);
  console.log(`🏷️  Schema: ${SCHEMA}`);
  console.log('');
  console.log('👤 User Information:');
  console.log(`   Name: ${MIKE_NAME}`);
  console.log(`   Email: ${MIKE_EMAIL}`);
  console.log(`   ID: ${MIKE_USER_ID}`);
  console.log('');
  console.log(`📝 Granting admin access to ${apps.length} apps:`);
  console.log('');

  for (const app of apps) {
    await grantAccess(app.appId, app.name);
  }

  console.log('');
  console.log('✨ All access granted successfully!');
  console.log('');
  console.log('📋 Summary:');
  console.log(`   User: ${MIKE_NAME} (${MIKE_EMAIL})`);
  console.log(`   Apps: ${apps.length}`);
  console.log('   Role: admin (all apps)');
  console.log('   Status: active');
  console.log('');
  console.log('📝 Next Steps:');
  console.log('   1. Rebuild platform: npm run build');
  console.log('   2. Restart platform: pm2 restart platform');
  console.log('   3. Hard refresh browser (Ctrl+Shift+R)');
  console.log('   4. Access /admin and /spaces pages');
}

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
