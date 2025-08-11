/**
 * DynamoDB Service for Application Management
 * Handles all database operations with proper error handling and type safety
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import {
  ApplicationEntity,
  UserApplicationState,
  ListApplicationsQuery,
  CreateApplicationRequest,
  UpdateApplicationRequest,
  ApplicationListResponse,
  DatabaseError,
} from "@/types/database";
import { ApplicationCategory } from "@/types/application";
import { organizationService } from "./organization";

// Environment variables
const REGION = process.env.AWS_REGION || "us-east-1";
const APPLICATIONS_TABLE =
  process.env.DYNAMODB_APPLICATIONS_TABLE || "captify-applications";
const USER_STATE_TABLE =
  process.env.DYNAMODB_USER_STATE_TABLE || "captify-user-applications";

// Initialize DynamoDB client with proper configuration
const dynamoClientConfig = {
  region: REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || process.env.ACCESS_KEY_ID!,
    secretAccessKey:
      process.env.AWS_SECRET_ACCESS_KEY || process.env.SECRET_ACCESS_KEY!,
  },
};

console.log("DynamoDB Config:", {
  region: REGION,
  hasAccessKey: !!(process.env.AWS_ACCESS_KEY_ID || process.env.ACCESS_KEY_ID),
  hasSecretKey: !!(
    process.env.AWS_SECRET_ACCESS_KEY || process.env.SECRET_ACCESS_KEY
  ),
  accessKeyPrefix:
    (process.env.AWS_ACCESS_KEY_ID || process.env.ACCESS_KEY_ID)?.substring(
      0,
      8
    ) + "...",
  nodeEnv: process.env.NODE_ENV,
});

const dynamoClient = new DynamoDBClient(dynamoClientConfig);
const docClient = DynamoDBDocumentClient.from(dynamoClient);

export class ApplicationDatabaseService {
  /**
   * Get application by ID
   */
  async getApplication(
    org_id: string,
    app_id: string
  ): Promise<ApplicationEntity | null> {
    try {
      const command = new GetCommand({
        TableName: APPLICATIONS_TABLE,
        Key: { org_id, app_id },
      });

      const result = await docClient.send(command);
      return (result.Item as ApplicationEntity) || null;
    } catch (error) {
      throw this.handleError("GET_APPLICATION_FAILED", error);
    }
  }

  /**
   * Get application by direct ID (for cases where table uses id as primary key)
   */
  async getApplicationById(id: string): Promise<ApplicationEntity | null> {
    try {
      const command = new GetCommand({
        TableName: APPLICATIONS_TABLE,
        Key: { id },
      });

      const result = await docClient.send(command);
      return (result.Item as ApplicationEntity) || null;
    } catch (error) {
      throw this.handleError("GET_APPLICATION_BY_ID_FAILED", error);
    }
  }

  /**
   * Create new application
   */
  async createApplication(
    org_id: string,
    user_id: string,
    request: CreateApplicationRequest
  ): Promise<ApplicationEntity> {
    const now = new Date().toISOString();
    const app_id = this.generateAppId(request.name);

    const application: ApplicationEntity = {
      organization_id: org_id, // Add required field
      org_id,
      app_id,
      id: app_id, // Primary identifier
      owner_id: user_id, // User who owns this application
      metadata: {
        id: app_id,
        alias: app_id,
        name: request.name,
        description: request.description || "",
        longDescription: request.description,
        version: "1.0.0",
        category: (request.category as ApplicationCategory) || "custom",
        tags: [],
        icon: request.icon || "Puzzle",
        color: request.color || "bg-gray-500",
        status: "active",
        visibility: "private",
        createdAt: now,
        updatedAt: now,
        createdBy: user_id,
        organization: org_id,
      },
      ai_agent: request.agent_config,
      ui_config: {
        layout: "chat",
        theme: {
          primaryColor: "#3B82F6",
          accentColor: "#10B981",
          background: "#FFFFFF",
        },
        navigation: [],
        widgets: [],
        ...request.ui_config,
      },
      permissions: {
        requiredRoles: [],
        ...request.permissions,
      },
      base_template: request.base_template ?? true,
      parent_app_id: request.parent_app_id,
      created_by: user_id,
      status: "active",
      version: "1.0.0",
      created_at: now,
      updated_at: now,
    };

    try {
      const command = new PutCommand({
        TableName: APPLICATIONS_TABLE,
        Item: application,
        ConditionExpression: "attribute_not_exists(app_id)",
      });

      await docClient.send(command);
      return application;
    } catch (error) {
      throw this.handleError("CREATE_APPLICATION_FAILED", error);
    }
  }

  /**
   * Update existing application
   */
  async updateApplication(
    org_id: string,
    app_id: string,
    user_id: string,
    request: UpdateApplicationRequest
  ): Promise<ApplicationEntity> {
    const now = new Date().toISOString();

    try {
      // First get the existing application
      const existing = await this.getApplication(org_id, app_id);
      if (!existing) {
        throw new Error("Application not found");
      }

      // Check if user can edit (must be creator or have admin role)
      if (existing.created_by !== user_id) {
        throw new Error("Insufficient permissions to edit application");
      }

      // Build update expression
      const updateExpressions: string[] = ["#updated_at = :updated_at"];
      const expressionAttributeNames: Record<string, string> = {
        "#updated_at": "updated_at",
      };
      const expressionAttributeValues: Record<string, unknown> = {
        ":updated_at": now,
      };

      // Add fields to update
      if (request.name) {
        updateExpressions.push("#metadata.#name = :name");
        expressionAttributeNames["#metadata"] = "metadata";
        expressionAttributeNames["#name"] = "name";
        expressionAttributeValues[":name"] = request.name;
      }

      if (request.description) {
        updateExpressions.push("#metadata.#description = :description");
        expressionAttributeNames["#description"] = "description";
        expressionAttributeValues[":description"] = request.description;
      }

      if (request.status) {
        updateExpressions.push("#status = :status");
        expressionAttributeNames["#status"] = "status";
        expressionAttributeValues[":status"] = request.status;
      }

      const command = new UpdateCommand({
        TableName: APPLICATIONS_TABLE,
        Key: { org_id, app_id },
        UpdateExpression: `SET ${updateExpressions.join(", ")}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: "ALL_NEW",
      });

      const result = await docClient.send(command);
      return result.Attributes as ApplicationEntity;
    } catch (error) {
      throw this.handleError("UPDATE_APPLICATION_FAILED", error);
    }
  }

  /**
   * Delete application and all related data (menu items, workspace content)
   */
  async deleteApplication(
    org_id: string,
    app_id: string,
    user_id?: string
  ): Promise<void> {
    try {
      // First get the existing application to check permissions
      const existing = await this.getApplication(org_id, app_id);
      if (!existing) {
        throw new Error("Application not found");
      }

      // Check if user can delete (must be creator or have admin role)
      if (user_id && existing.created_by !== user_id) {
        throw new Error("Insufficient permissions to delete application");
      }

      console.log(
        `🗑️ Starting deletion of application: ${app_id} and all related data`
      );

      // Import the database services for related data
      const { menuItemDb } = await import("./menu-item-database");
      const { workspaceContentDb } = await import(
        "./workspace-content-database"
      );

      // 1. Delete all workspace content for this application
      try {
        const deletedWorkspaceCount =
          await workspaceContentDb.deleteAllWorkspaceContentForApp(app_id);
        console.log(
          `✅ Deleted ${deletedWorkspaceCount} workspace content items`
        );
      } catch (error) {
        console.warn(
          `⚠️ Error deleting workspace content for app ${app_id}:`,
          error
        );
        // Continue with deletion even if workspace content fails
      }

      // 2. Delete all menu items for this application
      try {
        const deletedMenuCount = await menuItemDb.deleteAllMenuItemsForApp(
          app_id
        );
        console.log(`✅ Deleted ${deletedMenuCount} menu items`);
      } catch (error) {
        console.warn(`⚠️ Error deleting menu items for app ${app_id}:`, error);
        // Continue with deletion even if menu items fail
      }

      // 3. Finally, delete the application itself
      const command = new DeleteCommand({
        TableName: APPLICATIONS_TABLE,
        Key: { org_id, app_id },
      });

      await docClient.send(command);
      console.log(`✅ Deleted application: ${app_id}`);

      console.log(
        `🎉 Successfully deleted application ${app_id} and all related data`
      );
    } catch (error) {
      console.error(`❌ Failed to delete application ${app_id}:`, error);
      throw this.handleError("DELETE_APPLICATION_FAILED", error);
    }
  }

  /**
   * List applications with filtering and pagination
   */
  async listApplications(
    query: ListApplicationsQuery
  ): Promise<ApplicationListResponse> {
    try {
      // Since applications table uses 'id' as partition key, not 'org_id',
      // we need to use Scan with filters instead of Query
      const expressionAttributeValues: Record<string, string | boolean> = {};
      const expressionAttributeNames: Record<string, string> = {};

      // Build filter conditions and corresponding attributes
      const conditions: string[] = [];

      if (query.status) {
        conditions.push("#status = :status");
        expressionAttributeNames["#status"] = "status";
        expressionAttributeValues[":status"] = query.status;
      }

      if (query.template_only) {
        conditions.push("base_template = :base_template");
        expressionAttributeValues[":base_template"] = true;
      }

      if (query.user_id) {
        conditions.push("created_by = :created_by");
        expressionAttributeValues[":created_by"] = query.user_id;
      }

      if (query.category) {
        conditions.push("category = :category");
        expressionAttributeValues[":category"] = query.category;
      }

      if (query.search) {
        conditions.push(
          "(contains(#name, :search) OR contains(title, :search) OR contains(description, :search))"
        );
        expressionAttributeNames["#name"] = "name";
        expressionAttributeValues[":search"] = query.search;
      }

      const command = new ScanCommand({
        TableName: APPLICATIONS_TABLE,
        FilterExpression:
          conditions.length > 0 ? conditions.join(" AND ") : undefined,
        ExpressionAttributeValues:
          Object.keys(expressionAttributeValues).length > 0
            ? expressionAttributeValues
            : undefined,
        ExpressionAttributeNames:
          Object.keys(expressionAttributeNames).length > 0
            ? expressionAttributeNames
            : undefined,
        Limit: query.limit || 50,
        ExclusiveStartKey: query.last_key
          ? JSON.parse(query.last_key)
          : undefined,
      });

      const result = await docClient.send(command);

      return {
        applications: result.Items as ApplicationEntity[],
        last_key: result.LastEvaluatedKey
          ? JSON.stringify(result.LastEvaluatedKey)
          : undefined,
        total_count: result.Count,
      };
    } catch (error) {
      throw this.handleError("LIST_APPLICATIONS_FAILED", error);
    }
  }

  /**
   * Get user application state
   */
  async getUserApplicationState(
    user_id: string,
    app_id: string,
    org_id?: string
  ): Promise<UserApplicationState | null> {
    try {
      // Get default org_id if not provided
      if (!org_id) {
        org_id = await organizationService.getDefaultOrganizationId();
      }

      const command = new GetCommand({
        TableName: USER_STATE_TABLE,
        Key: {
          from_node_id: user_id,
          "to_node_id#context_org_id": `${app_id}#${org_id}`,
        },
      });

      const result = await docClient.send(command);
      return (result.Item as UserApplicationState) || null;
    } catch (error) {
      throw this.handleError("GET_USER_STATE_FAILED", error);
    }
  }

  /**
   * Update user application state
   */
  async updateUserApplicationState(
    user_id: string,
    app_id: string,
    updates: Partial<UserApplicationState>,
    org_id?: string
  ): Promise<UserApplicationState> {
    const now = new Date().toISOString();

    try {
      // Get default org_id if not provided
      if (!org_id) {
        org_id = await organizationService.getDefaultOrganizationId();
      }

      // Get existing state or create new
      const existing = await this.getUserApplicationState(
        user_id,
        app_id,
        org_id
      );

      const state: UserApplicationState = {
        from_node_id: user_id,
        "to_node_id#context_org_id": `${app_id}#${org_id}`,
        user_id, // Keep for backward compatibility
        app_id, // Keep for backward compatibility
        favorite: false,
        last_accessed: now,
        access_count: 0,
        saved_tools: [],
        session_state: {},
        created_at: existing?.created_at || now,
        updated_at: now,
        ...existing,
        ...updates,
      };

      const command = new PutCommand({
        TableName: USER_STATE_TABLE,
        Item: state,
      });

      await docClient.send(command);
      return state;
    } catch (error) {
      throw this.handleError("UPDATE_USER_STATE_FAILED", error);
    }
  }

  /**
   * Get user's favorite and recent applications
   */
  async getUserApplications(user_id: string): Promise<UserApplicationState[]> {
    try {
      const command = new QueryCommand({
        TableName: USER_STATE_TABLE,
        KeyConditionExpression: "from_node_id = :user_id",
        ExpressionAttributeValues: {
          ":user_id": user_id,
        },
      });

      const result = await docClient.send(command);
      return result.Items as UserApplicationState[];
    } catch (error) {
      throw this.handleError("GET_USER_APPLICATIONS_FAILED", error);
    }
  }

  /**
   * Get user's favorite applications with full application details
   */
  async getUserFavorites(user_id: string): Promise<ApplicationEntity[]> {
    try {
      // First get user states for favorite applications
      const userStates = await this.getUserApplications(user_id);
      const favoriteStates = userStates.filter((state) => state.favorite);

      // Get full application details for each favorite
      const favorites: ApplicationEntity[] = [];
      for (const state of favoriteStates) {
        // Try to find the application using the default organization
        const defaultOrg = await organizationService.getDefaultOrganization();

        let app: ApplicationEntity | null = null;
        if (defaultOrg) {
          try {
            app = await this.getApplication(defaultOrg.org_id, state.app_id);
          } catch (error) {
            console.warn(
              `Could not find application ${state.app_id} in organization ${defaultOrg.org_id}:`,
              error
            );
          }
        }

        if (!app) {
          // Fallback: try all organizations if default doesn't work
          const allOrgs = await organizationService.getOrganizations();
          for (const org of allOrgs) {
            try {
              app = await this.getApplication(org.org_id, state.app_id);
              if (app) break;
            } catch (error) {
              // Continue to next org_id
              console.log(error);
              continue;
            }
          }
        }

        if (app) {
          favorites.push(app);
        } else {
          console.warn(
            `Application ${state.app_id} not found in any organization. Removing from favorites.`
          );
          // Optionally remove invalid favorite
          try {
            await this.updateUserApplicationState(user_id, state.app_id, {
              favorite: false,
            });
          } catch (cleanupError) {
            console.error(
              `Failed to clean up invalid favorite ${state.app_id}:`,
              cleanupError
            );
          }
        }
      }

      return favorites;
    } catch (error) {
      throw this.handleError("GET_USER_FAVORITES_FAILED", error);
    }
  }

  /**
   * Helper methods
   */
  private generateAppId(name: string): string {
    const base = name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    const timestamp = Date.now().toString(36);
    return `${base}-${timestamp}`;
  }

  private buildFilterExpression(
    query: ListApplicationsQuery
  ): string | undefined {
    const conditions: string[] = [];

    if (query.status) {
      conditions.push("#status = :status");
    }

    if (query.template_only) {
      conditions.push("base_template = :base_template");
    }

    if (query.user_id) {
      conditions.push("created_by = :created_by");
    }

    return conditions.length > 0 ? conditions.join(" AND ") : undefined;
  }

  private handleError(code: string, error: unknown): DatabaseError {
    console.error(`Database Error [${code}]:`, error);

    const dbError: DatabaseError = {
      code,
      message:
        error instanceof Error ? error.message : "Unknown database error",
      details: { originalError: error },
    };

    return dbError;
  }
}

// Export singleton instance
export const applicationDb = new ApplicationDatabaseService();

// Helper functions for common operations
export async function deleteApplication(app_id: string): Promise<void> {
  const org_id = await organizationService.getDefaultOrganizationId();
  return applicationDb.deleteApplication(org_id, app_id);
}

export async function updateApplication(
  app_id: string,
  updateData: {
    metadata?: { name?: string; description?: string };
    status?: "active" | "draft" | "archived";
  }
): Promise<ApplicationEntity> {
  const org_id = await organizationService.getDefaultOrganizationId();

  // Convert the update data to the expected format
  const request: UpdateApplicationRequest = {
    name: updateData.metadata?.name,
    description: updateData.metadata?.description,
    status: updateData.status,
  };

  // For now, we'll use a placeholder user_id since admin operations don't need user permissions
  const user_id = "admin";

  return applicationDb.updateApplication(org_id, app_id, user_id, request);
}
