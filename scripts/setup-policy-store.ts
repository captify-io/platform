#!/usr/bin/env tsx

import { config } from 'dotenv';
import * as path from 'path';
import { policyService } from '../src/services/aws/policy';

// Load environment variables from .env.local
config({ path: path.join(process.cwd(), '.env.local') });

async function main() {
  try {
    console.log('🚀 Setting up Captify Policy Store...');

    const { policyStoreId, identitySourceId } = await policyService.setupPolicyStore();

    console.log('\n✅ Setup completed successfully!');
    console.log('\n📋 Add these to your .env.local file:');
    console.log(`VERIFIED_PERMISSIONS_POLICY_STORE_ID=${policyStoreId}`);
    console.log(`VERIFIED_PERMISSIONS_IDENTITY_SOURCE_ID=${identitySourceId}`);
    console.log('\n🔄 Restart your development server to apply the changes.');

  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

main();