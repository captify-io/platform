/**
 * Database Service Base
 *
 * Common DynamoDB operations and client setup for all applications.
 * Uses graph-ready table structure for Neptune migration preparation.
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
import { v4 as uuidv4 } from "uuid";

// Initialize DynamoDB client
const dynamoClient = new DynamoDBClient({
  region: process.env.REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID!,
    secretAccessKey: process.env.SECRET_ACCESS_KEY!,
  },
});

const docClient = DynamoDBDocumentClient.from(dynamoClient);

/**
 * Base database service with common operations
 */
export class DatabaseService {
  protected tableName: string;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  /**
   * Get a single item by primary key
   */
  async getItem<T = Record<string, unknown>>(
    key: Record<string, unknown>
  ): Promise<T | null> {
    try {
      const command = new GetCommand({
        TableName: this.tableName,
        Key: key,
      });

      const response = await docClient.send(command);
      return (response.Item as T) || null;
    } catch (error) {
      console.error(`Error getting item from ${this.tableName}:`, error);
      throw error;
    }
  }

  /**
   * Put an item (create or replace)
   */
  async putItem(item: Record<string, unknown>): Promise<void> {
    try {
      const command = new PutCommand({
        TableName: this.tableName,
        Item: item,
      });

      await docClient.send(command);
    } catch (error) {
      console.error(`Error putting item to ${this.tableName}:`, error);
      throw error;
    }
  }

  /**
   * Update an item with partial data
   */
  async updateItem(
    key: Record<string, unknown>,
    updates: Record<string, unknown>,
    options: {
      conditionExpression?: string;
      returnValues?:
        | "NONE"
        | "ALL_OLD"
        | "UPDATED_OLD"
        | "ALL_NEW"
        | "UPDATED_NEW";
    } = {}
  ): Promise<Record<string, unknown> | null> {
    try {
      // Build update expression dynamically
      const updateExpressions: string[] = [];
      const expressionAttributeNames: Record<string, string> = {};
      const expressionAttributeValues: Record<string, unknown> = {};

      Object.entries(updates).forEach(([key, value], index) => {
        const nameKey = `#attr${index}`;
        const valueKey = `:val${index}`;

        updateExpressions.push(`${nameKey} = ${valueKey}`);
        expressionAttributeNames[nameKey] = key;
        expressionAttributeValues[valueKey] = value;
      });

      const command = new UpdateCommand({
        TableName: this.tableName,
        Key: key,
        UpdateExpression: `SET ${updateExpressions.join(", ")}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ConditionExpression: options.conditionExpression,
        ReturnValues: options.returnValues || "UPDATED_NEW",
      });

      const response = await docClient.send(command);
      return (response.Attributes as Record<string, unknown>) || null;
    } catch (error) {
      console.error(`Error updating item in ${this.tableName}:`, error);
      throw error;
    }
  }

  /**
   * Delete an item
   */
  async deleteItem(key: Record<string, unknown>): Promise<void> {
    try {
      const command = new DeleteCommand({
        TableName: this.tableName,
        Key: key,
      });

      await docClient.send(command);
    } catch (error) {
      console.error(`Error deleting item from ${this.tableName}:`, error);
      throw error;
    }
  }

  /**
   * Query items with optional filters
   */
  async queryItems<T = Record<string, unknown>>(
    keyConditionExpression: string,
    options: {
      expressionAttributeNames?: Record<string, string>;
      expressionAttributeValues?: Record<string, unknown>;
      filterExpression?: string;
      indexName?: string;
      limit?: number;
      scanIndexForward?: boolean;
    } = {}
  ): Promise<T[]> {
    try {
      const command = new QueryCommand({
        TableName: this.tableName,
        KeyConditionExpression: keyConditionExpression,
        ExpressionAttributeNames: options.expressionAttributeNames,
        ExpressionAttributeValues: options.expressionAttributeValues,
        FilterExpression: options.filterExpression,
        IndexName: options.indexName,
        Limit: options.limit,
        ScanIndexForward: options.scanIndexForward,
      });

      const response = await docClient.send(command);
      return (response.Items as T[]) || [];
    } catch (error) {
      console.error(`Error querying items from ${this.tableName}:`, error);
      throw error;
    }
  }

  /**
   * Query by Global Secondary Index with simple key-value pairs
   */
  async queryByIndex<T = Record<string, unknown>>(
    indexName: string,
    keyValues: Record<string, unknown>,
    options: {
      filterExpression?: string;
      limit?: number;
      scanIndexForward?: boolean;
    } = {}
  ): Promise<{ items: T[]; count: number; scannedCount: number }> {
    try {
      // Build key condition expression from key-value pairs
      const keyConditions: string[] = [];
      const expressionAttributeNames: Record<string, string> = {};
      const expressionAttributeValues: Record<string, unknown> = {};

      Object.entries(keyValues).forEach(([key, value], index) => {
        const nameKey = `#key${index}`;
        const valueKey = `:val${index}`;

        keyConditions.push(`${nameKey} = ${valueKey}`);
        expressionAttributeNames[nameKey] = key;
        expressionAttributeValues[valueKey] = value;
      });

      const command = new QueryCommand({
        TableName: this.tableName,
        IndexName: indexName,
        KeyConditionExpression: keyConditions.join(" AND "),
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        FilterExpression: options.filterExpression,
        Limit: options.limit,
        ScanIndexForward: options.scanIndexForward,
      });

      const response = await docClient.send(command);
      return {
        items: (response.Items as T[]) || [],
        count: response.Count || 0,
        scannedCount: response.ScannedCount || 0,
      };
    } catch (error) {
      console.error(
        `Error querying index ${indexName} on ${this.tableName}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Scan all items with optional filters
   */
  async scanItems<T = Record<string, unknown>>(
    options: {
      filterExpression?: string;
      expressionAttributeNames?: Record<string, string>;
      expressionAttributeValues?: Record<string, unknown>;
      limit?: number;
    } = {}
  ): Promise<T[]> {
    try {
      const command = new ScanCommand({
        TableName: this.tableName,
        FilterExpression: options.filterExpression,
        ExpressionAttributeNames: options.expressionAttributeNames,
        ExpressionAttributeValues: options.expressionAttributeValues,
        Limit: options.limit,
      });

      const response = await docClient.send(command);
      return (response.Items as T[]) || [];
    } catch (error) {
      console.error(`Error scanning items from ${this.tableName}:`, error);
      throw error;
    }
  }
}

/**
 * Graph-Ready Database Services
 *
 * Application-specific services using optimized table structure
 */

// Applications Service - Manages application registry (nodes in graph)
export class ApplicationsService extends DatabaseService {
  constructor() {
    super("captify-applications");
  }

  async getBySlug(slug: string) {
    return this.queryByIndex("SlugIndex", { slug });
  }

  async getByCategory(category: string) {
    return this.queryByIndex("CategoryIndex", { category });
  }

  async getActiveApplications() {
    return this.queryByIndex("StatusIndex", { status: "active" });
  }

  async createApplication(appData: Record<string, unknown>) {
    const application = {
      id: uuidv4(),
      slug: this.generateSlug(
        (appData.title as string) || (appData.name as string)
      ),
      name:
        (appData.name as string) ||
        this.generateSlug((appData.title as string) || ""),
      title: (appData.title as string) || (appData.name as string) || "", // Ensure title is always present
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      node_type: "application",
      graph_properties: {
        centrality_score: 0,
        relationship_count: 0,
        last_graph_update: new Date().toISOString(),
      },
      ...appData,
    };

    await this.putItem(application);
    return application;
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  // Legacy compatibility methods
  async getApplication(appId: string) {
    return this.getItem({ id: appId });
  }

  async getApplicationMetadata(appId: string) {
    const app = await this.getItem({ id: appId });
    if (!app) return null;

    // Return in the format expected by ApplicationLayout
    return {
      id: app.id,
      title: app.title || app.name, // Fallback to name if title not present
      description: app.description || "",
      name: app.name,
      slug: app.slug,
      category: app.category,
      status: app.status,
      version: app.version,
      capabilities: app.capabilities || [],
      tags: app.tags || [],
      created_at: app.created_at,
      updated_at: app.updated_at,
    };
  }

  async updateApplication(appId: string, updates: Record<string, unknown>) {
    const updateData = {
      ...updates,
      updated_at: new Date().toISOString(),
    };
    return this.updateItem({ id: appId }, updateData);
  }

  async listApplications() {
    return this.scanItems();
  }
}

// Organizations Service - Manages organizational structure (nodes in graph)
export class OrganizationsService extends DatabaseService {
  constructor() {
    super("captify-organizations");
  }

  async getBySlug(slug: string) {
    return this.queryByIndex("SlugIndex", { slug });
  }

  async getByType(type: string) {
    return this.queryByIndex("TypeIndex", { type });
  }

  async getByDomain(domain: string) {
    return this.queryByIndex("DomainIndex", { domain });
  }

  async getHierarchy(parentOrgId: string) {
    return this.queryByIndex("HierarchyIndex", { parent_org_id: parentOrgId });
  }

  async createOrganization(orgData: Record<string, unknown>) {
    const organization = {
      id: uuidv4(),
      slug: this.generateSlug(orgData.name as string),
      type: orgData.type || "department",
      hierarchy_level: orgData.hierarchy_level || 1,
      classification_level: orgData.classification_level || "unclassified",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      node_type: "organization",
      graph_properties: {
        hierarchy_depth: orgData.hierarchy_level || 1,
        member_count: 0,
        application_count: 0,
        last_graph_update: new Date().toISOString(),
      },
      ...orgData,
    };

    await this.putItem(organization);
    return organization;
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  // Legacy compatibility methods
  async getOrganization(orgId: string) {
    return this.getItem({ id: orgId });
  }

  async updateOrganization(orgId: string, updates: Record<string, unknown>) {
    const updateData = {
      ...updates,
      updated_at: new Date().toISOString(),
    };
    return this.updateItem({ id: orgId }, updateData);
  }
}

// Users Service - Manages user accounts (nodes in graph)
export class UsersService extends DatabaseService {
  constructor() {
    super("captify-users");
  }

  async getByEmail(email: string) {
    const result = await this.queryByIndex("EmailIndex", { email });
    return result.items?.[0] || null;
  }

  async getByDepartment(department: string) {
    return this.queryByIndex("DepartmentIndex", { department });
  }

  async getBySecurityClearance(clearance: string) {
    return this.queryByIndex("SecurityClearanceIndex", {
      security_clearance: clearance,
    });
  }

  async getActiveUsers() {
    return this.queryByIndex("StatusIndex", { status: "active" });
  }

  async createUser(userData: Record<string, unknown>) {
    const user = {
      id: uuidv4(),
      email: userData.email,
      full_name: userData.full_name || userData.name,
      user_type: userData.user_type || "standard",
      status: "active",
      department: userData.department || "unassigned",
      security_clearance: userData.security_clearance || "public",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      node_type: "user",
      search_vector: this.createSearchVector(
        userData.full_name as string,
        userData.email as string
      ),
      graph_properties: {
        relationship_count: 0,
        activity_score: 0,
        last_graph_update: new Date().toISOString(),
      },
      auth_metadata: {
        cognito_user_id: userData.sub,
        identity_provider:
          ((userData.identities as Record<string, unknown>[])?.[0]
            ?.providerName as string) || "cognito",
      },
      ...userData,
    };

    await this.putItem(user);
    return user;
  }

  private createSearchVector(name: string, email: string): string {
    return [name, email].filter(Boolean).join(" ").toLowerCase();
  }
}

// User Organizations Service - Manages user-org membership edges
export class UserOrganizationsService extends DatabaseService {
  constructor() {
    super("captify-user-organizations");
  }

  async getUserOrganizations(userId: string) {
    return this.queryItems("from_node_id = :userId", {
      expressionAttributeValues: { ":userId": userId },
    });
  }

  async getOrganizationMembers(orgId: string) {
    return this.queryByIndex("OrgMembersIndex", { to_node_id: orgId });
  }

  async getUserRole(userId: string, orgId: string) {
    const result = await this.getItem({
      from_node_id: userId,
      to_node_id: orgId,
    });
    return result?.role || null;
  }

  async addUserToOrganization(
    userId: string,
    orgId: string,
    role: string,
    permissions: string[] = []
  ) {
    const membership = {
      from_node_id: userId,
      to_node_id: orgId,
      edge_type: "MEMBER_OF",
      edge_id: `${userId}#${orgId}`,
      role,
      permissions,
      access_level: "standard",
      status: "active",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await this.putItem(membership);
    return membership;
  }
}

// Organization Applications Service - Manages org-app access edges
export class OrganizationApplicationsService extends DatabaseService {
  constructor() {
    super("captify-organization-applications");
  }

  async getOrganizationApplications(orgId: string) {
    return this.queryItems("from_node_id = :orgId", {
      expressionAttributeValues: { ":orgId": orgId },
    });
  }

  async getApplicationOrganizations(appId: string) {
    return this.queryByIndex("AppOrgsIndex", { to_node_id: appId });
  }

  async grantApplicationAccess(
    orgId: string,
    appId: string,
    accessType = "standard",
    config = {}
  ) {
    const access = {
      from_node_id: orgId,
      to_node_id: appId,
      edge_type: "HAS_ACCESS_TO",
      edge_id: `${orgId}#${appId}`,
      access_type: accessType,
      enabled: true,
      org_config: config,
      installed_at: new Date().toISOString(),
      usage_metrics: {
        total_users: 0,
        monthly_active_users: 0,
        last_usage: null,
      },
      relationship_strength: 0.5,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await this.putItem(access);
    return access;
  }
}

// User Applications Service - Manages user-app usage edges
export class UserApplicationsService extends DatabaseService {
  constructor() {
    super("captify-user-applications");
  }

  async getUserApplications(userId: string) {
    return this.queryItems("from_node_id = :userId", {
      expressionAttributeValues: { ":userId": userId },
    });
  }

  async getApplicationUsers(appId: string) {
    return this.queryByIndex("AppUsersIndex", { to_node_id: appId });
  }

  async getUserApplicationState(userId: string, appId: string, orgId: string) {
    const sortKey = `${appId}#${orgId}`;
    return this.getItem({
      from_node_id: userId,
      "to_node_id#context_org_id": sortKey,
    });
  }

  async updateUserApplicationState(
    userId: string,
    appId: string,
    orgId: string,
    state: Record<string, unknown>,
    preferences = {}
  ) {
    const sortKey = `${appId}#${orgId}`;
    const existing = await this.getUserApplicationState(userId, appId, orgId);

    if (existing) {
      return this.updateItem(
        { from_node_id: userId, "to_node_id#context_org_id": sortKey },
        {
          user_state: {
            ...(typeof existing.user_state === "object" &&
            existing.user_state !== null
              ? existing.user_state
              : {}),
            ...state,
          },
          preferences: {
            ...(typeof existing.preferences === "object" &&
            existing.preferences !== null
              ? existing.preferences
              : {}),
            ...preferences,
          },
          updated_at: new Date().toISOString(),
        }
      );
    } else {
      const newState = {
        from_node_id: userId,
        "to_node_id#context_org_id": sortKey,
        to_node_id: appId,
        context_org_id: orgId,
        edge_type: "USES",
        edge_id: `${userId}#${appId}#${orgId}`,
        access_level: "user",
        user_state: state,
        preferences,
        status: "active",
        usage_metrics: {
          session_count: 1,
          total_time: 0,
          last_session: new Date().toISOString(),
          feature_usage: {},
        },
        expertise_level: "novice",
        relationship_strength: 0.1,
        first_accessed: new Date().toISOString(),
        last_accessed: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await this.putItem(newState);
      return newState;
    }
  }

  // Legacy compatibility method
  async getUserAppState(userId: string, appId: string) {
    // For backward compatibility, assume a default org context
    const userApps = await this.getUserApplications(userId);
    return (
      userApps.find((app: Record<string, unknown>) =>
        app.to_node_id?.toString().startsWith(appId)
      ) || null
    );
  }

  async updateUserAppState(
    userId: string,
    appId: string,
    state: Record<string, unknown>
  ) {
    // For backward compatibility, find the first matching org context
    const userApps = await this.getUserApplications(userId);
    const existingApp = userApps.find((app: Record<string, unknown>) =>
      app.to_node_id?.toString().startsWith(appId)
    );

    if (existingApp) {
      const orgId = existingApp.context_org_id as string;
      return this.updateUserApplicationState(userId, appId, orgId, state);
    }

    throw new Error(
      `No application context found for user ${userId} and app ${appId}`
    );
  }

  async getUserStates(userId: string) {
    return { items: await this.getUserApplications(userId) };
  }
}

// Legacy Organization Settings - keeping for backward compatibility
export class OrganizationSettingsService extends DatabaseService {
  constructor() {
    // Use a separate table for settings if it exists, otherwise store in main org table
    super("captify-organization-settings");
  }

  async getSettings(orgId: string, settingKey?: string) {
    if (settingKey) {
      return this.getItem({ org_id: orgId, setting_key: settingKey });
    }
    // Query all settings for the organization
    return this.queryItems("org_id = :orgId", {
      expressionAttributeValues: { ":orgId": orgId },
    });
  }

  async updateSetting(
    orgId: string,
    settingKey: string,
    value: Record<string, unknown>
  ) {
    const settingData = {
      org_id: orgId,
      setting_key: settingKey,
      value,
      updated_at: new Date().toISOString(),
    };
    return this.putItem(settingData);
  }
}

// Export service instances
export const applicationsService = new ApplicationsService();
export const organizationsService = new OrganizationsService();
export const usersService = new UsersService();
export const userOrganizationsService = new UserOrganizationsService();
export const organizationApplicationsService =
  new OrganizationApplicationsService();
export const userApplicationsService = new UserApplicationsService();
export const organizationSettingsService = new OrganizationSettingsService();

// Legacy exports for backward compatibility
export const userApplicationStateService = userApplicationsService;

// Export the base client for custom operations
export { docClient, dynamoClient };
