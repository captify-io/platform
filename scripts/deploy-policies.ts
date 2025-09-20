#!/usr/bin/env tsx

import { config } from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import {
  VerifiedPermissionsClient,
  CreatePolicyCommand
} from '@aws-sdk/client-verifiedpermissions';

// Load environment variables
config({ path: path.join(process.cwd(), '.env.local') });

async function deployPolicies() {
  const client = new VerifiedPermissionsClient({
    region: process.env.AWS_REGION || 'us-east-1'
  });

  const policyStoreId = process.env.VERIFIED_PERMISSIONS_POLICY_STORE_ID;

  if (!policyStoreId) {
    throw new Error('VERIFIED_PERMISSIONS_POLICY_STORE_ID not found');
  }

  const policiesPath = path.join(process.cwd(), 'platform-policies.cedar');
  const policiesContent = fs.readFileSync(policiesPath, 'utf8');

  console.log('📋 Policies content:');
  console.log(policiesContent);
  console.log('\n🔄 Splitting policies...');

  // Simple approach: split by comment lines, then extract permit statements
  const lines = policiesContent.split('\n');
  const policies = [];
  let currentPolicy = '';

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Start of a new policy (comment line)
    if (trimmedLine.startsWith('//')) {
      // Save previous policy if it exists
      if (currentPolicy.trim() && currentPolicy.includes('permit')) {
        policies.push(currentPolicy.trim());
      }
      currentPolicy = '';
      continue;
    }

    // Add line to current policy
    if (trimmedLine) {
      currentPolicy += line + '\n';
    }

    // End of policy (semicolon)
    if (trimmedLine.endsWith(';') && currentPolicy.includes('permit')) {
      policies.push(currentPolicy.trim());
      currentPolicy = '';
    }
  }

  // Add final policy if exists
  if (currentPolicy.trim() && currentPolicy.includes('permit')) {
    policies.push(currentPolicy.trim());
  }

  console.log(`📊 Found ${policies.length} policies:`);
  policies.forEach((policy, index) => {
    console.log(`\n--- Policy ${index + 1} ---`);
    console.log(policy);
  });

  console.log('\n🚀 Deploying policies...');

  for (const [index, policy] of policies.entries()) {
    try {
      const command = new CreatePolicyCommand({
        policyStoreId,
        definition: {
          static: {
            statement: policy.trim(),
            description: `Platform policy ${index + 1}`
          }
        }
      });

      const response = await client.send(command);
      console.log(`✅ Policy ${index + 1} deployed: ${response.policyId}`);
    } catch (error) {
      console.error(`❌ Failed to deploy policy ${index + 1}:`, error);
    }
  }
}

deployPolicies().catch(console.error);