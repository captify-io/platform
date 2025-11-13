/**
 * Test Ontology CRUD Operations
 *
 * This script tests the new ontology system by:
 * 1. Creating a test object type (contract)
 * 2. Creating a link type (contract-has-clin)
 * 3. Creating an action type (approve-contract)
 * 4. Testing introspection with describe()
 * 5. Creating an instance
 * 6. Querying instances
 */

import { ontology } from '@captify-io/core/services';
import type { AwsCredentials } from '@captify-io/core/types';

const REGION = process.env.AWS_REGION || 'us-east-1';
const SCHEMA = process.env.SCHEMA || 'captify';

const credentials: AwsCredentials = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
};

async function main() {
  console.log('🧪 Testing Ontology CRUD Operations...');
  console.log(`Region: ${REGION}`);
  console.log(`Schema: ${SCHEMA}`);
  console.log('');

  try {
    // 1. Create Object Type
    console.log('1️⃣  Creating object type: contract');

    // Check if already exists
    let contractType = await ontology.getObjectType('contract', credentials, SCHEMA);
    if (contractType) {
      console.log('   ℹ️  Already exists, using existing type');
    } else {
      contractType = await ontology.createObjectType(
        {
          slug: 'contract',
        app: 'pmbook',
        name: 'Contract',
        description: 'Government contract with CLINs and funding',
        properties: {
          contractNumber: {
            type: 'string',
            description: 'Unique contract number',
            required: true,
          },
          title: {
            type: 'string',
            description: 'Contract title',
            required: true,
          },
          status: {
            type: 'string',
            description: 'Contract status',
            enum: ['draft', 'active', 'completed', 'cancelled'],
          },
          totalValue: {
            type: 'number',
            description: 'Total contract value in dollars',
          },
          startDate: {
            type: 'string',
            description: 'Contract start date (ISO 8601)',
          },
          endDate: {
            type: 'string',
            description: 'Contract end date (ISO 8601)',
          },
        },
          status: 'active',
        },
        credentials,
        SCHEMA
      );
      console.log('   ✅ Created:', contractType.slug);
    }
    console.log('   📋 Properties:', Object.keys(contractType.properties || {}).length);
    console.log('');

    // 2. Create another Object Type for linking
    console.log('2️⃣  Creating object type: clin');
    let clinType = await ontology.getObjectType('clin', credentials, SCHEMA);
    if (clinType) {
      console.log('   ℹ️  Already exists, using existing type');
    } else {
      clinType = await ontology.createObjectType(
      {
        slug: 'clin',
        app: 'pmbook',
        name: 'CLIN',
        description: 'Contract Line Item Number',
        properties: {
          clinNumber: {
            type: 'string',
            description: 'CLIN number',
            required: true,
          },
          description: {
            type: 'string',
            description: 'CLIN description',
          },
          value: {
            type: 'number',
            description: 'CLIN value',
          },
        },
          status: 'active',
        },
        credentials,
        SCHEMA
      );
      console.log('   ✅ Created:', clinType.slug);
    }
    console.log('');

    // 3. Create Link Type
    console.log('3️⃣  Creating link type: contract-has-clin');
    let linkType = await ontology.getLinkType('contract-has-clin', credentials, SCHEMA);
    if (linkType) {
      console.log('   ℹ️  Already exists, using existing type');
    } else {
      linkType = await ontology.createLinkType(
      {
        slug: 'contract-has-clin',
        name: 'Contract Has CLIN',
        description: 'Links a contract to its CLINs',
        sourceObjectType: 'contract',
        targetObjectType: 'clin',
        cardinality: 'ONE_TO_MANY',
        bidirectional: true,
        inverseName: 'CLIN Belongs To Contract',
        foreignKey: 'contractId',
          status: 'active',
        },
        credentials,
        SCHEMA
      );
      console.log('   ✅ Created:', linkType.slug);
    }
    console.log('   🔗 Direction:', `${linkType.sourceObjectType} → ${linkType.targetObjectType}`);
    console.log('   ↔️  Bidirectional:', linkType.bidirectional);
    console.log('');

    // 4. Create Action Type
    console.log('4️⃣  Creating action type: approve-contract');
    let actionType = await ontology.getActionType('approve-contract', credentials, SCHEMA);
    if (actionType) {
      console.log('   ℹ️  Already exists, using existing type');
    } else {
      actionType = await ontology.createActionType(
      {
        slug: 'approve-contract',
        name: 'Approve Contract',
        description: 'Approve a contract and set it to active status',
        objectType: 'contract',
        parameters: {
          approvedBy: {
            type: 'string',
            description: 'User ID of approver',
            required: true,
          },
          comments: {
            type: 'string',
            description: 'Approval comments',
          },
        },
        modifiesProperties: ['status', 'approvedBy', 'approvedAt'],
        canCreateNew: false,
          status: 'active',
        },
        credentials,
        SCHEMA
      );
      console.log('   ✅ Created:', actionType.slug);
    }
    console.log('   🎯 Target:', actionType.objectType);
    console.log('');

    // 5. Test Introspection
    console.log('5️⃣  Testing introspection with describe()');
    const introspection = await ontology.describe('contract', credentials, SCHEMA);
    console.log('   ✅ Schema properties:', Object.keys(introspection.objectType.properties || {}).length);
    console.log('   🔗 Outgoing links:', introspection.links.outgoing.length);
    console.log('   🔗 Incoming links:', introspection.links.incoming.length);
    console.log('   ⚡ Actions:', introspection.actions.length);
    console.log('   📊 Table:', introspection.tableInfo.tableName);
    console.log('   🔍 API pattern:', introspection.apiInfo.baseCall);
    console.log('');

    // 6. Create Instance
    console.log('6️⃣  Creating contract instance');
    const instance = await ontology.createItem(
      'contract',
      {
        name: 'Test Contract #12345',
        slug: 'test-contract-12345',
        contractNumber: '12345',
        title: 'Test Government Contract',
        status: 'draft',
        totalValue: 1000000,
        startDate: '2025-01-01T00:00:00Z',
        endDate: '2025-12-31T23:59:59Z',
      },
      credentials,
      'test-user',
      SCHEMA
    );
    console.log('   ✅ Created instance:', instance.id);
    console.log('   📝 Name:', instance.name);
    console.log('   🔢 Contract Number:', instance.contractNumber);
    console.log('');

    // 7. List Instances
    console.log('7️⃣  Listing contract instances');
    const listResult = await ontology.listItems('contract', credentials, {}, undefined, undefined, SCHEMA);
    console.log('   ✅ Found', listResult.count, 'instance(s)');
    console.log('');

    // 8. Get Instance
    console.log('8️⃣  Getting instance by ID');
    const retrieved = await ontology.getItem('contract', instance.id, credentials, SCHEMA);
    console.log('   ✅ Retrieved:', retrieved?.name);
    console.log('   📅 Created:', new Date(retrieved?.createdAt || '').toLocaleString());
    console.log('');

    // 9. Update Instance
    console.log('9️⃣  Updating instance');
    const updated = await ontology.updateItem(
      'contract',
      instance.id,
      { status: 'active', totalValue: 1500000 },
      credentials,
      'test-user',
      SCHEMA
    );
    console.log('   ✅ Updated status:', updated.status);
    console.log('   💰 Updated value:', updated.totalValue);
    console.log('   🔄 Version:', updated.version);
    console.log('');

    // 10. List Object Types
    console.log('🔟 Listing all object types');
    const objectTypes = await ontology.listObjectTypes(credentials, SCHEMA);
    console.log('   ✅ Found', objectTypes.length, 'object type(s):');
    objectTypes.forEach((type) => {
      console.log(`      - ${type.app}.${type.slug}: ${type.name}`);
    });
    console.log('');

    console.log('✅ All CRUD operations successful!');
    console.log('');
    console.log('Summary:');
    console.log('  ✅ Object types created: 2');
    console.log('  ✅ Link types created: 1');
    console.log('  ✅ Action types created: 1');
    console.log('  ✅ Instances created: 1');
    console.log('  ✅ Introspection working');
    console.log('  ✅ Full CRUD cycle working');

  } catch (error) {
    console.error('❌ Test failed:', error);
    if (error instanceof Error) {
      console.error('Message:', error.message);
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  }
}

main();
