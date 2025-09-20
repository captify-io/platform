#!/usr/bin/env tsx

import { config } from 'dotenv';
import * as path from 'path';
import { policyService } from '../src/services/aws/policy';

// Load environment variables
config({ path: path.join(process.cwd(), '.env.local') });

async function testPolicy() {
  try {
    console.log('🧪 Testing verified permissions...');
    console.log('Policy Store ID:', process.env.VERIFIED_PERMISSIONS_POLICY_STORE_ID);

    // Test user authorization for creating a user record
    const canCreate = await policyService.canCreateUserRecord(
      'test-user-123',
      'default',
      ['captify']
    );

    console.log('✅ Can create user record:', canCreate);

    // Test user authorization for updating a user record
    const canUpdate = await policyService.canUpdateUserRecord(
      'test-user-123',
      'default',
      ['captify']
    );

    console.log('✅ Can update user record:', canUpdate);

    console.log('\n🎉 Verified permissions setup is working!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testPolicy();