import { VerifiedPermissionsClient, CreatePolicyStoreCommand, CreateIdentitySourceCommand, PutSchemaCommand, CreatePolicyCommand, IsAuthorizedCommand } from '@aws-sdk/client-verifiedpermissions';
import * as fs from 'fs';
import * as path from 'path';
export class CaptifyPolicyService {
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
    async setupPolicyStore() {
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
    async isAuthorized(request) {
        if (!this.policyStoreId) {
            throw new Error('Policy store not configured. Set VERIFIED_PERMISSIONS_POLICY_STORE_ID environment variable.');
        }
        try {
            const command = new IsAuthorizedCommand({
                policyStoreId: this.policyStoreId,
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
                decision: response.decision,
                determining_policies: response.determiningPolicies?.map(p => p.policyId || '') || [],
                errors: response.errors?.map(e => e.errorDescription || '') || []
            };
        }
        catch (error) {
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
    async canUpdateUserRecord(userId, tenantId, userGroups) {
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
            },
            context: {
                tenantId,
                groups: userGroups,
                tableName: 'captify-core-User',
                ownerId: userId
            }
        });
        return result.decision === 'ALLOW';
    }
    /**
     * Check authorization for user registration form creation
     */
    async canCreateUserRecord(userId, tenantId, userGroups) {
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
            },
            context: {
                tenantId,
                groups: userGroups,
                tableName: 'captify-core-User'
            }
        });
        return result.decision === 'ALLOW';
    }
    /**
     * Private methods for setup
     */
    async createPolicyStore() {
        const command = new CreatePolicyStoreCommand({
            validationSettings: {
                mode: 'STRICT'
            },
            description: 'Captify Platform Policy Store'
        });
        const response = await this.client.send(command);
        const policyStoreId = response.policyStoreId;
        console.log(`✅ Policy store created: ${policyStoreId}`);
        return policyStoreId;
    }
    async createIdentitySource(policyStoreId) {
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
        const identitySourceId = response.identitySourceId;
        console.log(`✅ Identity source created: ${identitySourceId}`);
        return identitySourceId;
    }
    async deploySchema(policyStoreId) {
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
    async deployPolicies(policyStoreId) {
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
    splitCedarPolicies(content) {
        return content
            .split(/;[\s]*(?=\/\/|permit|forbid)/m)
            .map(policy => policy.trim() + (policy.trim().endsWith(';') ? '' : ';'))
            .filter(policy => policy.length > 1 && !policy.startsWith('//'));
    }
}
export const policyService = new CaptifyPolicyService();
