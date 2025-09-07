/**
 * Tenant Service
 * Handles tenant management operations
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import type { AwsCredentials, ApiUserSession, Tenant } from "../../types";

interface TenantServiceRequest {
  service: string;
  operation: string;
  data?: any;
  schema?: string;
  app?: string;
}

/**
 * Execute tenant management operations
 */
export async function execute(
  request: TenantServiceRequest,
  credentials?: AwsCredentials,
  session?: ApiUserSession
): Promise<any> {
  const tableName = `${request.schema || "captify"}-core-Tenant`;

  try {
    switch (request.operation) {
      case "listActiveTenants": {
        // List all active tenants for registration dropdown
        // This can be called without credentials for registration
        if (!credentials) {
          return { success: false, error: "Credentials required for tenant operations" };
        }
        
        const client = new DynamoDBClient({
          region: "us-east-1",
          credentials: {
            accessKeyId: credentials.accessKeyId,
            secretAccessKey: credentials.secretAccessKey,
            sessionToken: credentials.sessionToken,
          },
        });

        const docClient = DynamoDBDocumentClient.from(client);
        
        const scanCommand = new ScanCommand({
          TableName: tableName,
          FilterExpression: "#status = :status AND #settings.#allowReg = :true",
          ExpressionAttributeNames: {
            "#status": "status",
            "#settings": "settings",
            "#allowReg": "allowSelfRegistration",
          },
          ExpressionAttributeValues: {
            ":status": "active",
            ":true": true,
          },
        });

        const response = await docClient.send(scanCommand);
        
        // Return simplified tenant list for registration
        const tenants = (response.Items || []).map(tenant => ({
          id: tenant.id,
          code: tenant.code,
          name: tenant.name,
          requireApproval: tenant.settings?.requireApproval ?? true,
        }));
        
        return { 
          success: true, 
          data: tenants
        };
      }

      case "getTenant": {
        // Get a specific tenant by ID
        if (!credentials) {
          return { success: false, error: "Authentication required" };
        }

        const client = new DynamoDBClient({
          region: "us-east-1",
          credentials: {
            accessKeyId: credentials.accessKeyId,
            secretAccessKey: credentials.secretAccessKey,
            sessionToken: credentials.sessionToken,
          },
        });

        const docClient = DynamoDBDocumentClient.from(client);
        
        const getCommand = new GetCommand({
          TableName: tableName,
          Key: { id: request.data?.tenantId },
        });

        const response = await docClient.send(getCommand);
        
        if (response.Item) {
          return { 
            success: true, 
            data: response.Item
          };
        } else {
          return { 
            success: false, 
            error: "Tenant not found"
          };
        }
      }

      case "createTenant": {
        // Admin operation to create a new tenant
        const isAdmin = session?.user?.email?.includes("admin") || false;
        
        if (!isAdmin) {
          return { success: false, error: "Admin access required" };
        }

        // Implementation for creating tenant
        // This would include validation and DynamoDB PutCommand
        return { 
          success: false, 
          error: "Not implemented yet" 
        };
      }

      default:
        return {
          success: false,
          error: `Unknown operation: ${request.operation}`,
        };
    }
  } catch (error) {
    console.error(`Error in tenantService.${request.operation}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

// Export the service
export const tenantService = {
  execute,
};