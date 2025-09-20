import {
  VerifiedPermissionsClient,
  CreatePolicyStoreCommand,
  CreateIdentitySourceCommand,
  PutSchemaCommand,
  CreatePolicyCommand,
  IsAuthorizedCommand,
  BatchIsAuthorizedCommand
} from '@aws-sdk/client-verifiedpermissions';
import * as fs from 'fs';
import * as path from 'path';

export interface AuthorizationRequest {
  principal: {
    entityType: string;
    entityId: string;
  };
  action: {
    actionType: string;
    actionId: string;
  };
  resource: {
    entityType: string;
    entityId: string;
  };
  context?: Record<string, any>;
}

export interface AuthorizationResult {
  decision: 'ALLOW' | 'DENY';
  determining_policies?: string[];
  errors?: string[];
}

export class CaptifyPolicyService {
  private client: VerifiedPermissionsClient;
  private policyStoreId?: string;
  private identitySourceId?: string;

  constructor() {
    this.client = new VerifiedPermissionsClient({
      region: process.env.AWS_REGION || 'us-east-1'
    });

    this.policyStoreId = process.env.VERIFIED_PERMISSIONS_POLICY_STORE_ID;
    this.identitySourceId = process.env.VERIFIED_PERMISSIONS_IDENTITY_SOURCE_ID;
  }

  /**
   * Setup the policy store with schema and policies
   */
  async setupPolicyStore(): Promise<{ policyStoreId: string; identitySourceId: string }> {
    console.log('🚀 Setting up Captify Policy Store...');

    // Create policy store
    const policyStoreId = await this.createPolicyStore();

    // Create identity source
    const identitySourceId = await this.createIdentitySource(policyStoreId);

    // Deploy schema
    await this.deploySchema(policyStoreId);

    // Deploy policies
    await this.deployPolicies(policyStoreId);

    console.log('✅ Policy store setup completed');
    console.log(`Policy Store ID: ${policyStoreId}`);
    console.log(`Identity Source ID: ${identitySourceId}`);

    return { policyStoreId, identitySourceId };
  }

  /**
   * Check if user is authorized to perform action on resource
   */
  async isAuthorized(request: AuthorizationRequest): Promise<AuthorizationResult> {
    // Check for policy store ID at runtime, not just in constructor
    const policyStoreId = this.policyStoreId || process.env.VERIFIED_PERMISSIONS_POLICY_STORE_ID;
    if (!policyStoreId) {
      throw new Error('Policy store not configured. Set VERIFIED_PERMISSIONS_POLICY_STORE_ID environment variable.');
    }

    try {
      const command = new IsAuthorizedCommand({
        policyStoreId: policyStoreId,
        principal: {
          entityType: request.principal.entityType,
          entityId: request.principal.entityId
        },
        action: {
          actionType: request.action.actionType,
          actionId: request.action.actionId
        },
        resource: {
          entityType: request.resource.entityType,
          entityId: request.resource.entityId
        },
        context: request.context ? {
          contextMap: request.context
        } : undefined
      });

      const response = await this.client.send(command);

      return {
        decision: response.decision as 'ALLOW' | 'DENY',
        determining_policies: response.determiningPolicies?.map(p => p.policyId || '') || [],
        errors: response.errors?.map(e => e.errorDescription || '') || []
      };
    } catch (error) {
      console.error('Authorization check failed:', error);
      return {
        decision: 'DENY',
        errors: [error instanceof Error ? error.message : 'Authorization check failed']
      };
    }
  }

  /**
   * Check authorization for user registration form updates
   */
  async canUpdateUserRecord(userId: string, tenantId: string, userGroups: string[]): Promise<boolean> {
    const result = await this.isAuthorized({
      principal: {
        entityType: 'CaptifyPlatform::User',
        entityId: userId
      },
      action: {
        actionType: 'CaptifyPlatform::Action',
        actionId: 'update'
      },
      resource: {
        entityType: 'CaptifyPlatform::UserRecord',
        entityId: `captify-core-User-${userId}`
      }
    });

    return result.decision === 'ALLOW';
  }

  /**
   * Check authorization for user registration form creation
   */
  async canCreateUserRecord(userId: string, tenantId: string, userGroups: string[]): Promise<boolean> {
    const result = await this.isAuthorized({
      principal: {
        entityType: 'CaptifyPlatform::User',
        entityId: userId
      },
      action: {
        actionType: 'CaptifyPlatform::Action',
        actionId: 'create'
      },
      resource: {
        entityType: 'CaptifyPlatform::UserRecord',
        entityId: `captify-core-User-${userId}`
      }
    });

    return result.decision === 'ALLOW';
  }

  /**
   * Private methods for setup
   */
  private async createPolicyStore(): Promise<string> {
    const command = new CreatePolicyStoreCommand({
      validationSettings: {
        mode: 'STRICT'
      },
      description: 'Captify Platform Policy Store'
    });

    const response = await this.client.send(command);
    const policyStoreId = response.policyStoreId!;

    console.log(`✅ Policy store created: ${policyStoreId}`);
    return policyStoreId;
  }

  private async createIdentitySource(policyStoreId: string): Promise<string> {
    const userPoolId = process.env.COGNITO_USER_POOL_ID;
    const clientId = process.env.COGNITO_CLIENT_ID;
    const region = process.env.AWS_REGION || 'us-east-1';
    const accountId = process.env.AWS_ACCOUNT_ID;

    if (!userPoolId || !clientId || !accountId) {
      throw new Error('Missing Cognito configuration: COGNITO_USER_POOL_ID, COGNITO_CLIENT_ID, AWS_ACCOUNT_ID');
    }

    const command = new CreateIdentitySourceCommand({
      policyStoreId,
      configuration: {
        cognitoUserPoolConfiguration: {
          userPoolArn: `arn:aws:cognito-idp:${region}:${accountId}:userpool/${userPoolId}`,
          clientIds: [clientId]
        }
      },
      principalEntityType: 'CaptifyPlatform::User'
    });

    const response = await this.client.send(command);
    const identitySourceId = response.identitySourceId!;

    console.log(`✅ Identity source created: ${identitySourceId}`);
    return identitySourceId;
  }

  private async deploySchema(policyStoreId: string): Promise<void> {
    const schemaPath = path.join(process.cwd(), 'platform-schema.json');

    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found: ${schemaPath}`);
    }

    const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));

    const command = new PutSchemaCommand({
      policyStoreId,
      definition: {
        cedarJson: JSON.stringify(schema)
      }
    });

    await this.client.send(command);
    console.log('✅ Schema deployed');
  }

  private async deployPolicies(policyStoreId: string): Promise<void> {
    const policiesPath = path.join(process.cwd(), 'platform-policies.cedar');

    if (!fs.existsSync(policiesPath)) {
      throw new Error(`Policies file not found: ${policiesPath}`);
    }

    const policiesContent = fs.readFileSync(policiesPath, 'utf8');
    const policies = this.splitCedarPolicies(policiesContent);

    for (const [index, policy] of policies.entries()) {
      const command = new CreatePolicyCommand({
        policyStoreId,
        definition: {
          static: {
            statement: policy.trim(),
            description: `Platform policy ${index + 1}`
          }
        }
      });

      await this.client.send(command);
    }

    console.log(`✅ Deployed ${policies.length} policies`);
  }

  private splitCedarPolicies(content: string): string[] {
    // Split policies by comment lines, then extract permit statements
    const lines = content.split('\n');
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

    return policies;
  }
}

export const policyService = new CaptifyPolicyService();