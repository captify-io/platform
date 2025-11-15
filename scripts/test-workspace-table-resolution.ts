#!/usr/bin/env tsx
/**
 * Test Workspace Table Name Resolution
 *
 * Verifies that the ontology correctly resolves short table names
 * to full DynamoDB table names with schema prefix.
 *
 * Usage:
 *   npx tsx scripts/test-workspace-table-resolution.ts
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';

const REGION = process.env.AWS_REGION || 'us-east-1';
const SCHEMA = process.env.SCHEMA || 'captify';

const credentials = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
};

const client = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: REGION, credentials })
);

/**
 * Test cases: short name → expected full table name
 */
const testCases = [
  { slug: 'workspace', short: 'core-workspace', expected: 'captify-core-workspace' },
  { slug: 'workspace-member', short: 'core-workspace-member', expected: 'captify-core-workspace-member' },
  { slug: 'workspace-team', short: 'core-workspace-team', expected: 'captify-core-workspace-team' },
  { slug: 'workspace-issue', short: 'core-workspace-issue', expected: 'captify-core-workspace-issue' },
  { slug: 'workspace-project', short: 'core-workspace-project', expected: 'captify-core-workspace-project' },
  { slug: 'workspace-project-milestone', short: 'core-workspace-project-milestone', expected: 'captify-core-workspace-project-milestone' },
  { slug: 'workspace-cycle', short: 'core-workspace-cycle', expected: 'captify-core-workspace-cycle' },
  { slug: 'workspace-initiative', short: 'core-workspace-initiative', expected: 'captify-core-workspace-initiative' },
];

/**
 * Get ObjectType from ontology
 */
async function getObjectType(slug: string) {
  const result = await client.send(
    new GetCommand({
      TableName: `${SCHEMA}-ontology-object-type`,
      Key: { slug },
    })
  );

  return result.Item;
}

/**
 * Resolve table name using ontology
 */
function resolveTableName(dataSource: string, schema: string = SCHEMA): string {
  // Simple resolution: schema + dataSource
  return `${schema}-${dataSource}`;
}

/**
 * Test table name resolution
 */
async function testResolution() {
  console.log('🧪 Testing Workspace Table Name Resolution\n');
  console.log(`Schema: ${SCHEMA}`);
  console.log(`Region: ${REGION}\n`);

  let passedCount = 0;
  let failedCount = 0;

  for (const test of testCases) {
    console.log(`\n📋 Testing: ${test.slug}`);

    try {
      // Get ObjectType from ontology
      const objectType = await getObjectType(test.slug);

      if (!objectType) {
        console.log(`   ❌ ObjectType not found in ontology`);
        failedCount++;
        continue;
      }

      const dataSource = objectType.properties?.dataSource;

      if (!dataSource) {
        console.log(`   ❌ No dataSource defined`);
        failedCount++;
        continue;
      }

      console.log(`   📦 DataSource: ${dataSource}`);

      // Resolve table name
      const resolvedName = resolveTableName(dataSource);

      console.log(`   🔄 Resolved: ${resolvedName}`);
      console.log(`   ✓ Expected: ${test.expected}`);

      // Verify
      if (resolvedName === test.expected) {
        console.log(`   ✅ PASS - Table name resolved correctly`);
        passedCount++;
      } else {
        console.log(`   ❌ FAIL - Mismatch!`);
        failedCount++;
      }

    } catch (error: any) {
      console.log(`   ❌ ERROR: ${error.message}`);
      failedCount++;
    }
  }

  // Summary
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 Test Results:\n`);
  console.log(`   ✅ Passed: ${passedCount}/${testCases.length}`);
  console.log(`   ❌ Failed: ${failedCount}/${testCases.length}`);

  if (failedCount === 0) {
    console.log(`\n🎉 All tests passed!`);
    console.log(`\n✨ Table name resolution is working correctly.`);
    console.log(`   Short format: "core-workspace"`);
    console.log(`   Resolves to: "${SCHEMA}-core-workspace"`);
  } else {
    console.log(`\n⚠️  Some tests failed. Please review the output above.`);
    process.exit(1);
  }
}

// Run
testResolution().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
