#!/usr/bin/env tsx
/**
 * Seed Workspace Ontology Types
 *
 * Creates ontology object types and link types for the workspace-centric
 * collaboration platform. Includes workspaces, teams, issues, projects,
 * milestones, cycles, and initiatives.
 *
 * All tables use captify-core-workspace-* naming convention.
 *
 * Usage:
 *   npx tsx scripts/seed-workspace-ontology.ts
 *   AWS_REGION="us-east-1" AWS_ACCESS_KEY_ID="..." AWS_SECRET_ACCESS_KEY="..." npx tsx scripts/seed-workspace-ontology.ts
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';

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
 * Workspace Object Types
 */
const workspaceObjectTypes = [
  // 1. Workspace
  {
    slug: 'workspace',
    name: 'Workspace',
    type: 'workspace',
    category: 'workspace',
    domain: 'Collaboration',
    description: 'A collaborative workspace for teams to manage projects, issues, and work',
    icon: 'Building2',
    color: '#3b82f6',
    status: 'active',
    app: 'core',
    properties: {
      dataSource: 'core-workspace',
      schema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Unique identifier (UUID)' },
          slug: { type: 'string', description: 'URL-safe identifier', required: true },
          name: { type: 'string', description: 'Workspace name', required: true },
          description: { type: 'string', description: 'Workspace description' },
          tenantId: { type: 'string', description: 'Parent tenant ID' },
          type: {
            type: 'string',
            enum: ['personal', 'team', 'organization'],
            description: 'Workspace type'
          },
          icon: { type: 'string', description: 'Icon name (Lucide)' },
          color: { type: 'string', description: 'Brand color (hex)' },
          settings: {
            type: 'object',
            properties: {
              defaultCycleDuration: { type: 'number', description: 'Cycle duration in weeks' },
              requireProjectEstimates: { type: 'boolean' },
              autoArchiveDays: { type: 'number' }
            }
          },
          status: {
            type: 'string',
            enum: ['active', 'archived', 'suspended'],
            description: 'Workspace status'
          },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        },
        required: ['id', 'slug', 'name', 'tenantId']
      },
      indexes: {
        'tenantId-index': { hashKey: 'tenantId', type: 'GSI' },
        'slug-index': { hashKey: 'slug', type: 'GSI' },
        'status-index': { hashKey: 'status', type: 'GSI' }
      }
    }
  },

  // 2. Workspace Member
  {
    slug: 'workspace-member',
    name: 'Workspace Member',
    type: 'member',
    category: 'workspace',
    domain: 'Collaboration',
    description: 'User membership in a workspace with role and permissions',
    icon: 'UserPlus',
    color: '#8b5cf6',
    status: 'active',
    app: 'core',
    properties: {
      dataSource: 'core-workspace-member',
      schema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Unique identifier (UUID)' },
          workspaceId: { type: 'string', description: 'Workspace ID', required: true },
          userId: { type: 'string', description: 'Cognito user ID (sub)', required: true },
          email: { type: 'string', description: 'User email from Cognito' },
          role: {
            type: 'string',
            enum: ['owner', 'admin', 'member', 'viewer'],
            description: 'Member role',
            required: true
          },
          permissions: {
            type: 'array',
            items: { type: 'string' },
            description: 'Custom permissions'
          },
          status: {
            type: 'string',
            enum: ['active', 'invited', 'suspended'],
            description: 'Membership status'
          },
          joinedAt: { type: 'string', format: 'date-time' },
          invitedBy: { type: 'string', description: 'User ID who invited' },
          lastAccessedAt: { type: 'string', format: 'date-time' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        },
        required: ['id', 'workspaceId', 'userId', 'role']
      },
      indexes: {
        'workspaceId-index': { hashKey: 'workspaceId', type: 'GSI' },
        'userId-index': { hashKey: 'userId', type: 'GSI' },
        'workspaceId-userId-index': {
          hashKey: 'workspaceId',
          rangeKey: 'userId',
          type: 'GSI'
        }
      }
    }
  },

  // 3. Workspace Team
  {
    slug: 'workspace-team',
    name: 'Workspace Team',
    type: 'team',
    category: 'workspace',
    domain: 'Collaboration',
    description: 'A team within a workspace that owns issues and projects',
    icon: 'Users',
    color: '#10b981',
    status: 'active',
    app: 'core',
    properties: {
      dataSource: 'core-workspace-team',
      schema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Unique identifier (UUID)' },
          workspaceId: { type: 'string', description: 'Parent workspace ID', required: true },
          name: { type: 'string', description: 'Team name', required: true },
          identifier: { type: 'string', description: 'Short code (e.g., ENG, DESIGN)', required: true },
          description: { type: 'string', description: 'Team description' },
          icon: { type: 'string', description: 'Icon name' },
          color: { type: 'string', description: 'Team color (hex)' },
          settings: {
            type: 'object',
            properties: {
              cycleEnabled: { type: 'boolean', description: 'Enable cycles/sprints' },
              cycleDuration: { type: 'number', description: 'Cycle duration in weeks' },
              cycleStartDay: { type: 'number', description: 'Start day (0=Sunday)' },
              triageEnabled: { type: 'boolean', description: 'Enable issue triage' },
              autoArchiveDays: { type: 'number', description: 'Auto-archive completed issues after N days' }
            }
          },
          status: { type: 'string', enum: ['active', 'archived'] },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        },
        required: ['id', 'workspaceId', 'name', 'identifier']
      },
      indexes: {
        'workspaceId-index': { hashKey: 'workspaceId', type: 'GSI' },
        'workspaceId-identifier-index': {
          hashKey: 'workspaceId',
          rangeKey: 'identifier',
          type: 'GSI'
        }
      }
    }
  },

  // 4. Workspace Issue
  {
    slug: 'workspace-issue',
    name: 'Workspace Issue',
    type: 'issue',
    category: 'workspace',
    domain: 'Work Management',
    description: 'A task or work item tracked by a team',
    icon: 'CheckCircle2',
    color: '#f59e0b',
    status: 'active',
    app: 'core',
    properties: {
      dataSource: 'core-workspace-issue',
      schema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Unique identifier (UUID)' },
          identifier: { type: 'string', description: 'Human-readable ID (e.g., ENG-123)', required: true },
          number: { type: 'number', description: 'Sequential number within team', required: true },
          workspaceId: { type: 'string', description: 'Parent workspace ID', required: true },
          teamId: { type: 'string', description: 'Owning team ID', required: true },
          title: { type: 'string', description: 'Issue title', required: true },
          description: { type: 'string', description: 'Rich text description (JSON)' },
          status: {
            type: 'string',
            enum: ['backlog', 'todo', 'in-progress', 'in-review', 'done', 'cancelled'],
            description: 'Issue status',
            required: true
          },
          priority: {
            type: 'string',
            enum: ['urgent', 'high', 'medium', 'low'],
            description: 'Issue priority'
          },
          assigneeId: { type: 'string', description: 'Assigned Cognito user ID' },
          reporterId: { type: 'string', description: 'Reporter Cognito user ID' },
          estimate: { type: 'number', description: 'Effort estimate (points)' },
          dueDate: { type: 'string', format: 'date', description: 'Due date' },
          labels: { type: 'array', items: { type: 'string' }, description: 'Labels/tags' },
          projectId: { type: 'string', description: 'Parent project ID' },
          milestoneId: { type: 'string', description: 'Parent milestone ID' },
          cycleId: { type: 'string', description: 'Current cycle ID' },
          parentIssueId: { type: 'string', description: 'Parent issue (for sub-issues)' },
          blockedBy: { type: 'array', items: { type: 'string' }, description: 'Blocking issue IDs' },
          blocking: { type: 'array', items: { type: 'string' }, description: 'Blocked issue IDs' },
          completedAt: { type: 'string', format: 'date-time' },
          archivedAt: { type: 'string', format: 'date-time' },
          createdAt: { type: 'string', format: 'date-time' },
          createdBy: { type: 'string', description: 'Creator Cognito user ID' },
          updatedAt: { type: 'string', format: 'date-time' },
          updatedBy: { type: 'string', description: 'Last updater Cognito user ID' }
        },
        required: ['id', 'identifier', 'number', 'workspaceId', 'teamId', 'title', 'status']
      },
      indexes: {
        'workspaceId-index': { hashKey: 'workspaceId', type: 'GSI' },
        'teamId-status-index': { hashKey: 'teamId', rangeKey: 'status', type: 'GSI' },
        'assigneeId-index': { hashKey: 'assigneeId', type: 'GSI' },
        'projectId-index': { hashKey: 'projectId', type: 'GSI' },
        'cycleId-index': { hashKey: 'cycleId', type: 'GSI' },
        'identifier-index': { hashKey: 'identifier', type: 'GSI' }
      }
    }
  },

  // 5. Workspace Project
  {
    slug: 'workspace-project',
    name: 'Workspace Project',
    type: 'project',
    category: 'workspace',
    domain: 'Work Management',
    description: 'Time-bound deliverable grouping issues towards a goal',
    icon: 'FolderKanban',
    color: '#ec4899',
    status: 'active',
    app: 'core',
    properties: {
      dataSource: 'core-workspace-project',
      schema: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          workspaceId: { type: 'string', required: true },
          name: { type: 'string', required: true },
          description: { type: 'string' },
          status: {
            type: 'string',
            enum: ['planned', 'active', 'paused', 'completed', 'cancelled'],
            required: true
          },
          startDate: { type: 'string', format: 'date' },
          targetDate: { type: 'string', format: 'date' },
          completedAt: { type: 'string', format: 'date-time' },
          teamIds: { type: 'array', items: { type: 'string' }, description: 'Associated teams' },
          initiativeId: { type: 'string', description: 'Parent initiative ID' },
          leadId: { type: 'string', description: 'Project lead Cognito user ID' },
          icon: { type: 'string' },
          color: { type: 'string' },
          progress: { type: 'number', description: 'Calculated progress (0-100)' },
          createdAt: { type: 'string', format: 'date-time' },
          createdBy: { type: 'string' },
          updatedAt: { type: 'string', format: 'date-time' },
          updatedBy: { type: 'string' }
        },
        required: ['id', 'workspaceId', 'name', 'status']
      },
      indexes: {
        'workspaceId-status-index': { hashKey: 'workspaceId', rangeKey: 'status', type: 'GSI' },
        'initiativeId-index': { hashKey: 'initiativeId', type: 'GSI' },
        'leadId-index': { hashKey: 'leadId', type: 'GSI' }
      }
    }
  },

  // 6. Workspace Project Milestone
  {
    slug: 'workspace-project-milestone',
    name: 'Workspace Project Milestone',
    type: 'milestone',
    category: 'workspace',
    domain: 'Work Management',
    description: 'Meaningful stage of completion within a project',
    icon: 'Flag',
    color: '#6366f1',
    status: 'active',
    app: 'core',
    properties: {
      dataSource: 'core-workspace-project-milestone',
      schema: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          projectId: { type: 'string', required: true },
          name: { type: 'string', required: true },
          description: { type: 'string' },
          targetDate: { type: 'string', format: 'date' },
          completedAt: { type: 'string', format: 'date-time' },
          sortOrder: { type: 'number', description: 'Display order' },
          progress: { type: 'number', description: 'Calculated progress (0-100)' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        },
        required: ['id', 'projectId', 'name']
      },
      indexes: {
        'projectId-sortOrder-index': { hashKey: 'projectId', rangeKey: 'sortOrder', type: 'GSI' }
      }
    }
  },

  // 7. Workspace Cycle
  {
    slug: 'workspace-cycle',
    name: 'Workspace Cycle',
    type: 'cycle',
    category: 'workspace',
    domain: 'Work Management',
    description: 'Recurring time-boxed sprint for a team',
    icon: 'RotateCw',
    color: '#14b8a6',
    status: 'active',
    app: 'core',
    properties: {
      dataSource: 'core-workspace-cycle',
      schema: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          workspaceId: { type: 'string', required: true },
          teamId: { type: 'string', required: true },
          name: { type: 'string', description: 'Auto-generated (e.g., Cycle 12)', required: true },
          number: { type: 'number', description: 'Sequential number', required: true },
          startDate: { type: 'string', format: 'date', required: true },
          endDate: { type: 'string', format: 'date', required: true },
          status: {
            type: 'string',
            enum: ['upcoming', 'active', 'completed'],
            required: true
          },
          completedAt: { type: 'string', format: 'date-time' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        },
        required: ['id', 'workspaceId', 'teamId', 'name', 'number', 'startDate', 'endDate', 'status']
      },
      indexes: {
        'teamId-startDate-index': { hashKey: 'teamId', rangeKey: 'startDate', type: 'GSI' },
        'workspaceId-index': { hashKey: 'workspaceId', type: 'GSI' }
      }
    }
  },

  // 8. Workspace Initiative
  {
    slug: 'workspace-initiative',
    name: 'Workspace Initiative',
    type: 'initiative',
    category: 'workspace',
    domain: 'Work Management',
    description: 'High-level goal organizing multiple projects',
    icon: 'Target',
    color: '#f43f5e',
    status: 'active',
    app: 'core',
    properties: {
      dataSource: 'core-workspace-initiative',
      schema: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          workspaceId: { type: 'string', required: true },
          name: { type: 'string', required: true },
          description: { type: 'string' },
          status: {
            type: 'string',
            enum: ['planned', 'active', 'completed', 'cancelled'],
            required: true
          },
          targetDate: { type: 'string', format: 'date' },
          completedAt: { type: 'string', format: 'date-time' },
          ownerId: { type: 'string', description: 'Initiative owner Cognito user ID' },
          progress: { type: 'number', description: 'Calculated progress (0-100)' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        },
        required: ['id', 'workspaceId', 'name', 'status']
      },
      indexes: {
        'workspaceId-status-index': { hashKey: 'workspaceId', rangeKey: 'status', type: 'GSI' }
      }
    }
  }
];

/**
 * Workspace Link Types (Relationships)
 */
const workspaceLinkTypes = [
  // Workspace relationships
  {
    slug: 'workspace-has-member',
    name: 'Workspace Has Member',
    description: 'A workspace contains members with specific roles',
    sourceObjectType: 'workspace',
    targetObjectType: 'workspace-member',
    cardinality: 'ONE_TO_MANY',
    bidirectional: true,
    inverseName: 'Member Belongs To Workspace',
    foreignKey: 'workspaceId',
    status: 'active'
  },
  {
    slug: 'workspace-has-team',
    name: 'Workspace Has Team',
    description: 'A workspace contains multiple teams',
    sourceObjectType: 'workspace',
    targetObjectType: 'workspace-team',
    cardinality: 'ONE_TO_MANY',
    bidirectional: true,
    inverseName: 'Team Belongs To Workspace',
    foreignKey: 'workspaceId',
    status: 'active'
  },
  {
    slug: 'workspace-has-project',
    name: 'Workspace Has Project',
    description: 'A workspace contains multiple projects',
    sourceObjectType: 'workspace',
    targetObjectType: 'workspace-project',
    cardinality: 'ONE_TO_MANY',
    bidirectional: true,
    inverseName: 'Project Belongs To Workspace',
    foreignKey: 'workspaceId',
    status: 'active'
  },
  {
    slug: 'workspace-has-initiative',
    name: 'Workspace Has Initiative',
    description: 'A workspace contains multiple initiatives',
    sourceObjectType: 'workspace',
    targetObjectType: 'workspace-initiative',
    cardinality: 'ONE_TO_MANY',
    bidirectional: true,
    inverseName: 'Initiative Belongs To Workspace',
    foreignKey: 'workspaceId',
    status: 'active'
  },

  // Team relationships
  {
    slug: 'workspace-team-has-issue',
    name: 'Workspace Team Has Issue',
    description: 'A team owns and manages issues',
    sourceObjectType: 'workspace-team',
    targetObjectType: 'workspace-issue',
    cardinality: 'ONE_TO_MANY',
    bidirectional: true,
    inverseName: 'Issue Belongs To Team',
    foreignKey: 'teamId',
    status: 'active'
  },
  {
    slug: 'workspace-team-has-cycle',
    name: 'Workspace Team Has Cycle',
    description: 'A team has recurring cycles/sprints',
    sourceObjectType: 'workspace-team',
    targetObjectType: 'workspace-cycle',
    cardinality: 'ONE_TO_MANY',
    bidirectional: true,
    inverseName: 'Cycle Belongs To Team',
    foreignKey: 'teamId',
    status: 'active'
  },

  // Project relationships
  {
    slug: 'workspace-project-has-milestone',
    name: 'Workspace Project Has Milestone',
    description: 'A project contains milestones to track progress',
    sourceObjectType: 'workspace-project',
    targetObjectType: 'workspace-project-milestone',
    cardinality: 'ONE_TO_MANY',
    bidirectional: true,
    inverseName: 'Milestone Belongs To Project',
    foreignKey: 'projectId',
    status: 'active'
  },
  {
    slug: 'workspace-project-has-issue',
    name: 'Workspace Project Has Issue',
    description: 'A project groups related issues',
    sourceObjectType: 'workspace-project',
    targetObjectType: 'workspace-issue',
    cardinality: 'ONE_TO_MANY',
    bidirectional: true,
    inverseName: 'Issue Belongs To Project',
    foreignKey: 'projectId',
    status: 'active'
  },

  // Initiative relationships
  {
    slug: 'workspace-initiative-has-project',
    name: 'Workspace Initiative Has Project',
    description: 'An initiative organizes multiple projects',
    sourceObjectType: 'workspace-initiative',
    targetObjectType: 'workspace-project',
    cardinality: 'ONE_TO_MANY',
    bidirectional: true,
    inverseName: 'Project Belongs To Initiative',
    foreignKey: 'initiativeId',
    status: 'active'
  },

  // Cycle relationships
  {
    slug: 'workspace-cycle-has-issue',
    name: 'Workspace Cycle Has Issue',
    description: 'A cycle contains issues planned for that sprint',
    sourceObjectType: 'workspace-cycle',
    targetObjectType: 'workspace-issue',
    cardinality: 'ONE_TO_MANY',
    bidirectional: true,
    inverseName: 'Issue Belongs To Cycle',
    foreignKey: 'cycleId',
    status: 'active'
  },

  // Issue relationships
  {
    slug: 'workspace-issue-has-subissue',
    name: 'Workspace Issue Has Sub-issue',
    description: 'An issue can have sub-issues for breaking down work',
    sourceObjectType: 'workspace-issue',
    targetObjectType: 'workspace-issue',
    cardinality: 'ONE_TO_MANY',
    bidirectional: true,
    inverseName: 'Sub-issue Belongs To Issue',
    foreignKey: 'parentIssueId',
    status: 'active'
  }
];

/**
 * Seed Object Types
 */
async function seedObjectTypes(): Promise<{ created: number; skipped: number }> {
  console.log('📦 Seeding Object Types...\n');

  const tableName = `${SCHEMA}-ontology-object-type`;
  console.log(`Checking existing types in ${tableName}...`);

  const scanResult = await client.send(
    new ScanCommand({
      TableName: tableName,
      FilterExpression: 'app = :app AND category = :category',
      ExpressionAttributeValues: {
        ':app': 'core',
        ':category': 'workspace',
      },
    })
  );

  const existingTypes = new Set((scanResult.Items || []).map((item: any) => item.slug));
  console.log(`Found ${existingTypes.size} existing workspace types\n`);

  let createdCount = 0;
  let skippedCount = 0;

  for (const objectType of workspaceObjectTypes) {
    if (existingTypes.has(objectType.slug)) {
      console.log(`⏭️  Skipping ${objectType.slug} (already exists)`);
      skippedCount++;
      continue;
    }

    console.log(`✨ Creating ${objectType.slug}...`);

    await client.send(
      new PutCommand({
        TableName: tableName,
        Item: {
          ...objectType,
          id: objectType.slug,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      })
    );

    createdCount++;
  }

  return { created: createdCount, skipped: skippedCount };
}

/**
 * Seed Link Types
 */
async function seedLinkTypes(): Promise<{ created: number; skipped: number }> {
  console.log('\n🔗 Seeding Link Types...\n');

  const tableName = `${SCHEMA}-ontology-link-type`;
  console.log(`Checking existing link types in ${tableName}...`);

  const scanResult = await client.send(
    new ScanCommand({
      TableName: tableName,
      FilterExpression: 'contains(slug, :prefix)',
      ExpressionAttributeValues: {
        ':prefix': 'workspace',
      },
    })
  );

  const existingLinks = new Set((scanResult.Items || []).map((item: any) => item.slug));
  console.log(`Found ${existingLinks.size} existing workspace link types\n`);

  let createdCount = 0;
  let skippedCount = 0;

  for (const linkType of workspaceLinkTypes) {
    if (existingLinks.has(linkType.slug)) {
      console.log(`⏭️  Skipping ${linkType.slug} (already exists)`);
      skippedCount++;
      continue;
    }

    console.log(`✨ Creating ${linkType.slug}...`);

    await client.send(
      new PutCommand({
        TableName: tableName,
        Item: {
          ...linkType,
          id: linkType.slug,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      })
    );

    createdCount++;
  }

  return { created: createdCount, skipped: skippedCount };
}

/**
 * Main execution
 */
async function main() {
  console.log('🌱 Seeding Workspace Ontology\n');
  console.log(`Schema: ${SCHEMA}`);
  console.log(`Region: ${REGION}\n`);

  // Seed object types
  const objectTypeStats = await seedObjectTypes();

  // Seed link types
  const linkTypeStats = await seedLinkTypes();

  // Summary
  console.log(`\n✅ Complete!\n`);
  console.log(`📦 Object Types:`);
  console.log(`   Created: ${objectTypeStats.created}`);
  console.log(`   Skipped: ${objectTypeStats.skipped} (already exist)`);

  console.log(`\n🔗 Link Types:`);
  console.log(`   Created: ${linkTypeStats.created}`);
  console.log(`   Skipped: ${linkTypeStats.skipped} (already exist)`);

  console.log(`\n📋 Database Tables (to be created):`);
  workspaceObjectTypes.forEach(t => {
    const tableName = `${SCHEMA}-${t.properties.dataSource}`;
    const indexes = Object.keys(t.properties.indexes || {}).length;
    console.log(`   - ${tableName} (${indexes} GSIs)`);
  });

  console.log(`\n⚠️  Note: DynamoDB tables need to be created separately.`);
  console.log(`   The ontology types define the schema, but tables must be created with:`);
  console.log(`   - AWS Console`);
  console.log(`   - CloudFormation/Terraform`);
  console.log(`   - create-workspace-tables.ts script (recommended)`);
}

// Run
main().catch(console.error);
