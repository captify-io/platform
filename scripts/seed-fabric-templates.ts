/**
 * Seed Fabric Templates Script
 *
 * Populates the fabric-template table with starter SOP templates
 *
 * Usage: npx tsx scripts/seed-fabric-templates.ts
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

// Configuration
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const SCHEMA = process.env.SCHEMA || 'captify';
const TABLE_NAME = `${SCHEMA}-fabric-template`;

// Default values
const DEFAULT_SPACE_ID = 'space-default';
const DEFAULT_ORG_ID = 'captify';

// Inline starter templates - simplified versions
// In production, these would come from @captify-io/core exports
const allStarterTemplates = [
  {
    name: 'Security Incident Response SOP',
    description: 'Standard operating procedure for responding to security incidents and breaches',
    category: 'SOP',
    icon: 'Shield',
    folder: '/sops/security',
    tags: ['security', 'incident', 'compliance', 'response'],
    variables: [
      { name: 'title', type: 'text' as const, label: 'Document Title', default: 'Security Incident Response SOP', required: true },
      { name: 'owner', type: 'text' as const, label: 'Document Owner', required: true },
      { name: 'version', type: 'text' as const, label: 'Version', default: '1.0', required: true },
      { name: 'effectiveDate', type: 'date' as const, label: 'Effective Date', required: true },
      { name: 'reviewDate', type: 'date' as const, label: 'Next Review Date', required: true },
    ],
    content: {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: '{{title}}' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Document Owner: ' }, { type: 'text', text: '{{owner}}', marks: [{ type: 'strong' }] }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '1. Purpose' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'This SOP defines the process for identifying, responding to, and recovering from security incidents.' }] },
      ],
    },
  },
  {
    name: 'Data Backup and Recovery SOP',
    description: 'Procedures for regular data backups and disaster recovery',
    category: 'SOP',
    icon: 'Database',
    folder: '/sops/operations',
    tags: ['backup', 'recovery', 'data', 'disaster-recovery'],
    variables: [
      { name: 'title', type: 'text' as const, label: 'Document Title', default: 'Data Backup and Recovery SOP', required: true },
      { name: 'owner', type: 'text' as const, label: 'Document Owner', required: true },
      { name: 'version', type: 'text' as const, label: 'Version', default: '1.0', required: true },
      { name: 'backupFrequency', type: 'select' as const, label: 'Backup Frequency', options: ['Hourly', 'Daily', 'Weekly', 'Monthly'], required: true },
    ],
    content: {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: '{{title}}' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Backup Frequency: ' }, { type: 'text', text: '{{backupFrequency}}', marks: [{ type: 'strong' }] }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '1. Purpose' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'This SOP ensures regular backups and defines recovery procedures.' }] },
      ],
    },
  },
  {
    name: 'Change Management SOP',
    description: 'Process for managing and approving system changes',
    category: 'SOP',
    icon: 'GitBranch',
    folder: '/sops/operations',
    tags: ['change-management', 'approval', 'operations'],
    variables: [
      { name: 'title', type: 'text' as const, label: 'Document Title', default: 'Change Management SOP', required: true },
      { name: 'owner', type: 'text' as const, label: 'Document Owner', required: true },
      { name: 'version', type: 'text' as const, label: 'Version', default: '1.0', required: true },
    ],
    content: {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: '{{title}}' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '1. Purpose' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'This SOP defines the process for requesting, reviewing, and implementing changes.' }] },
      ],
    },
  },
  {
    name: 'User Access Control SOP',
    description: 'Procedures for managing user access and permissions',
    category: 'SOP',
    icon: 'UserCheck',
    folder: '/sops/security',
    tags: ['access-control', 'security', 'permissions', 'identity'],
    variables: [
      { name: 'title', type: 'text' as const, label: 'Document Title', default: 'User Access Control SOP', required: true },
      { name: 'owner', type: 'text' as const, label: 'Document Owner', required: true },
      { name: 'version', type: 'text' as const, label: 'Version', default: '1.0', required: true },
    ],
    content: {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: '{{title}}' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '1. Purpose' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'This SOP defines procedures for granting, modifying, and revoking user access.' }] },
      ],
    },
  },
  {
    name: 'Document Review and Approval SOP',
    description: 'Workflow for reviewing and approving organizational documents',
    category: 'SOP',
    icon: 'FileCheck',
    folder: '/sops/administration',
    tags: ['review', 'approval', 'documentation', 'workflow'],
    variables: [
      { name: 'title', type: 'text' as const, label: 'Document Title', default: 'Document Review and Approval SOP', required: true },
      { name: 'owner', type: 'text' as const, label: 'Document Owner', required: true },
      { name: 'version', type: 'text' as const, label: 'Version', default: '1.0', required: true },
    ],
    content: {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: '{{title}}' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '1. Purpose' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'This SOP defines the review and approval workflow for organizational documents.' }] },
      ],
    },
  },
];

async function seedTemplates() {
  console.log('🌱 Seeding Fabric Templates...\n');

  // Create DynamoDB client
  const client = new DynamoDBClient({
    region: AWS_REGION,
  });

  const docClient = DynamoDBDocumentClient.from(client);

  let successCount = 0;
  let errorCount = 0;

  for (const template of allStarterTemplates) {
    try {
      const now = new Date().toISOString();
      const templateId = `template-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

      const templateItem = {
        id: templateId,
        spaceId: DEFAULT_SPACE_ID,
        organizationId: DEFAULT_ORG_ID,
        name: template.name,
        description: template.description,
        category: template.category,
        icon: template.icon,
        folder: template.folder,
        tags: template.tags,
        content: JSON.stringify(template.content),
        variables: template.variables,
        clearanceLevel: 'UNCLASSIFIED',
        createdAt: now,
        updatedAt: now,
      };

      await docClient.send(
        new PutCommand({
          TableName: TABLE_NAME,
          Item: templateItem,
        })
      );

      console.log(`✅ Created: ${template.name}`);
      console.log(`   ID: ${templateId}`);
      console.log(`   Category: ${template.category}`);
      console.log(`   Variables: ${template.variables.length}`);
      console.log('');

      successCount++;

      // Small delay to ensure unique timestamps
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error: any) {
      console.error(`❌ Error creating ${template.name}:`, error.message);
      errorCount++;
      console.log('');
    }
  }

  console.log('\n📊 Summary:');
  console.log(`   ✅ Successfully created: ${successCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log(`   📝 Total templates: ${allStarterTemplates.length}`);
  console.log('');

  if (successCount > 0) {
    console.log('✨ Template seeding complete!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Open Fabric in your application');
    console.log('2. Click "+" → "From Template"');
    console.log('3. Browse and select a template');
    console.log('4. Fill in variables and create your note');
  }
}

// Run the seed script
seedTemplates()
  .then(() => {
    console.log('\n✅ Seed script finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Seed script failed:', error);
    process.exit(1);
  });
