#!/usr/bin/env tsx
/**
 * Migrate Spaces Tables to Correct Naming Convention
 *
 * Deletes old incorrectly-named tables and creates new ones with correct naming:
 * - Old: captify-core-{entity}
 * - New: captify-core-spaces-{entity}
 *
 * IMPORTANT: This will DELETE DATA. Only run if tables are empty or data can be lost.
 *
 * Usage:
 *   tsx platform/scripts/migrate-spaces-tables.ts
 */

import {
  DynamoDBClient,
  DeleteTableCommand,
  DescribeTableCommand,
  waitUntilTableNotExists,
} from '@aws-sdk/client-dynamodb';

const SCHEMA = process.env.SCHEMA || 'captify';
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';

const client = new DynamoDBClient({ region: AWS_REGION });

// Tables to delete (old naming convention)
const oldTables = [
  `${SCHEMA}-core-space`,
  `${SCHEMA}-core-workstream`,
  `${SCHEMA}-core-capability`,
  `${SCHEMA}-core-feature`,
  `${SCHEMA}-core-user-story`,
  `${SCHEMA}-core-task`,
  `${SCHEMA}-core-ticket`,
  `${SCHEMA}-core-time-entry`,
  `${SCHEMA}-core-sprint`,
  `${SCHEMA}-core-objective`,
  `${SCHEMA}-core-request`,
  `${SCHEMA}-core-feature-capability`,
  `${SCHEMA}-core-space-member`,
];

/**
 * Check if a table exists
 */
async function tableExists(tableName: string): Promise<boolean> {
  try {
    await client.send(new DescribeTableCommand({ TableName: tableName }));
    return true;
  } catch (error: any) {
    if (error.name === 'ResourceNotFoundException') {
      return false;
    }
    throw error;
  }
}

/**
 * Delete a single table
 */
async function deleteTable(tableName: string): Promise<boolean> {
  console.log(`\n🗑️  Deleting table: ${tableName}`);

  // Check if table exists
  if (!(await tableExists(tableName))) {
    console.log(`   ⏭️  Table doesn't exist (already deleted): ${tableName}`);
    return false;
  }

  try {
    // Delete the table
    await client.send(new DeleteTableCommand({ TableName: tableName }));
    console.log(`   ⏳ Table deletion initiated: ${tableName}`);

    // Wait for table to be deleted
    console.log(`   ⏳ Waiting for table deletion to complete...`);
    await waitUntilTableNotExists(
      { client, maxWaitTime: 300, minDelay: 2, maxDelay: 10 },
      { TableName: tableName }
    );

    console.log(`   ✅ Table deleted successfully: ${tableName}`);
    return true;
  } catch (error: any) {
    console.error(`   ❌ Error deleting table ${tableName}:`, error.message);
    throw error;
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Starting Spaces Table Migration');
  console.log(`📍 Region: ${AWS_REGION}`);
  console.log(`🏷️  Schema: ${SCHEMA}`);
  console.log(`🗑️  Tables to delete: ${oldTables.length}`);

  console.log('\n⚠️  WARNING: This will DELETE the following tables:');
  oldTables.forEach((table) => console.log(`   - ${table}`));

  console.log('\n❓ Are you sure you want to continue?');
  console.log('   Press Ctrl+C to cancel, or wait 5 seconds to proceed...\n');

  // Wait 5 seconds before proceeding
  await new Promise((resolve) => setTimeout(resolve, 5000));

  console.log('='.repeat(60));

  let deleted = 0;
  let skipped = 0;
  let failed = 0;

  for (const tableName of oldTables) {
    try {
      const wasDeleted = await deleteTable(tableName);
      if (wasDeleted) {
        deleted++;
      } else {
        skipped++;
      }
    } catch (error) {
      failed++;
      console.error(`Failed to delete table ${tableName}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Deletion Summary:');
  console.log(`   ✅ Deleted: ${deleted}`);
  console.log(`   ⏭️  Skipped (didn't exist): ${skipped}`);
  console.log(`   ❌ Failed: ${failed}`);

  if (failed > 0) {
    console.log('\n⚠️  Some tables failed to delete. Check errors above.');
    console.log('   You may need to manually delete them in AWS Console.');
    process.exit(1);
  }

  console.log('\n✨ All old tables deleted successfully!');
  console.log('\n📝 Next steps:');
  console.log('   1. Run: tsx platform/scripts/create-spaces-tables.ts');
  console.log('   2. Verify new tables in AWS Console');
  console.log('   3. Test the application');
}

// Run the script
main().catch((error) => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
