/**
 * Graph Migration Service
 *
 * Utilities for migrating from current DynamoDB tables to graph-ready structure.
 * Prepares data for future Neptune migration while maintaining current functionality.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  DynamoDBClient,
  ScanCommand,
  PutItemCommand,
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { v4 as uuidv4 } from "uuid";

interface MigrationStep {
  id: string;
  name: string;
  description: string;
  sourceTable?: string;
  targetTable: string;
  transformFunction: (
    sourceItem: Record<string, unknown>
  ) => Record<string, unknown> | Record<string, unknown>[];
  rollbackFunction?: (
    targetItems: Record<string, unknown>[]
  ) => Record<string, unknown>[];
}

interface MigrationPlan {
  version: string;
  description: string;
  steps: MigrationStep[];
  validationChecks: string[];
}

export class GraphMigrationService {
  private client: DynamoDBClient;

  constructor(region = "us-east-1") {
    this.client = new DynamoDBClient({ region });
  }

  /**
   * Complete migration plan from current tables to graph-ready structure
   */
  getMigrationPlan(): MigrationPlan {
    return {
      version: "1.0.0",
      description:
        "Migration to graph-ready DynamoDB structure for future Neptune integration",
      steps: [
        // Step 1: Migrate Applications (already mostly compatible)
        {
          id: "migrate-applications",
          name: "Migrate Applications Table",
          description:
            "Transform applications to include graph metadata and enhanced indexes",
          sourceTable: "captify-applications",
          targetTable: "captify-applications",
          transformFunction: this.transformApplication.bind(this),
        },

        // Step 2: Migrate Organizations
        {
          id: "migrate-organizations",
          name: "Migrate Organizations Table",
          description:
            "Transform organizations with hierarchy support and graph metadata",
          sourceTable: "captify-organizations",
          targetTable: "captify-organizations",
          transformFunction: this.transformOrganization.bind(this),
        },

        // Step 3: Create Users table (new)
        {
          id: "create-users",
          name: "Create Users Table",
          description:
            "Extract user data from auth systems into centralized user nodes",
          targetTable: "captify-users",
          transformFunction: this.createUserFromAuth.bind(this),
        },

        // Step 4: Transform org-app relationships to edges
        {
          id: "migrate-org-app-edges",
          name: "Migrate Organization-Application Relationships",
          description: "Transform many-to-many relationships into graph edges",
          sourceTable: "captify-organization-applications", // If it exists
          targetTable: "captify-organization-applications",
          transformFunction: this.transformOrgAppEdge.bind(this),
        },

        // Step 5: Transform user state to user-app edges
        {
          id: "migrate-user-app-edges",
          name: "Migrate User Application State to Edges",
          description:
            "Transform user state into user-application relationship edges",
          sourceTable: "captify-user-application-state",
          targetTable: "captify-user-applications",
          transformFunction: this.transformUserAppEdge.bind(this),
        },

        // Step 6: Create user-org membership edges
        {
          id: "create-user-org-edges",
          name: "Create User-Organization Memberships",
          description:
            "Create membership edges based on existing access patterns",
          targetTable: "captify-user-organizations",
          transformFunction: this.createUserOrgEdge.bind(this),
        },

        // Step 7: Migrate audit trail
        {
          id: "migrate-audit-trail",
          name: "Migrate Audit Logs to Graph Trail",
          description: "Transform audit logs into graph-aware audit trail",
          sourceTable: "captify-audit-logs", // If it exists
          targetTable: "captify-audit-trail",
          transformFunction: this.transformAuditTrail.bind(this),
        },
      ],
      validationChecks: [
        "Verify all applications have UUIDs",
        "Verify all organizations have UUIDs",
        "Verify user-app relationships maintain context",
        "Verify audit trail preserves compliance data",
        "Verify graph traversal performance",
      ],
    };
  }

  /**
   * Transform current application record to graph-ready format
   */
  private transformApplication(
    sourceItem: Record<string, unknown>
  ): Record<string, unknown> {
    return {
      ...sourceItem,
      id: sourceItem.id || uuidv4(),
      slug:
        sourceItem.slug ||
        this.generateSlug((sourceItem.title || sourceItem.name) as string),
      name:
        sourceItem.name ||
        this.generateSlug((sourceItem.title || "") as string),
      title: sourceItem.title || sourceItem.name || "", // Ensure title field exists
      created_by: sourceItem.created_by || "system",
      updated_at: sourceItem.updated_at || new Date().toISOString(),
      capabilities: sourceItem.capabilities || [],
      tags: sourceItem.tags || [],

      // Graph metadata
      node_type: "application",
      search_vector: this.createSearchVector(
        (sourceItem.title || sourceItem.name) as string,
        sourceItem.description as string
      ),
      graph_properties: {
        centrality_score: 0,
        relationship_count: 0,
        last_graph_update: new Date().toISOString(),
      },
    };
  }

  /**
   * Transform organization record with hierarchy support
   */
  private transformOrganization(
    sourceItem: Record<string, unknown>
  ): Record<string, unknown> {
    return {
      ...sourceItem,
      id: sourceItem.id || uuidv4(),
      slug: sourceItem.slug || this.generateSlug(sourceItem.name as string),
      type: sourceItem.type || "department",
      hierarchy_level: sourceItem.hierarchy_level || 1,
      parent_org_id: sourceItem.parent_org_id || null,
      domain:
        sourceItem.domain ||
        this.extractDomain(sourceItem.email as string | undefined),
      classification_level: sourceItem.classification_level || "unclassified",

      // Graph metadata
      node_type: "organization",
      search_vector: this.createSearchVector(
        sourceItem.name as string,
        sourceItem.description as string
      ),
      graph_properties: {
        hierarchy_depth: this.calculateHierarchyDepth(sourceItem),
        member_count: 0,
        application_count: 0,
        last_graph_update: new Date().toISOString(),
      },
    };
  }

  /**
   * Create user record from authentication data
   */
  private createUserFromAuth(authData: any): any {
    return {
      id: uuidv4(),
      email: authData.email,
      full_name: authData.name || authData.full_name,
      user_type: authData.user_type || "standard",
      status: "active",
      department: authData.department || "unassigned",
      role_title: authData.role || "user",
      security_clearance: authData.clearance || "public",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_login: authData.last_sign_in_at,

      // Graph metadata
      node_type: "user",
      search_vector: this.createSearchVector(authData.name, authData.email),
      graph_properties: {
        relationship_count: 0,
        activity_score: 0,
        last_graph_update: new Date().toISOString(),
      },

      // Original auth metadata
      auth_metadata: {
        cognito_user_id: authData.sub,
        identity_provider: authData.identities?.[0]?.providerName || "cognito",
        auth_time: authData.auth_time,
      },
    };
  }

  /**
   * Transform org-app relationship to graph edge
   */
  private transformOrgAppEdge(sourceItem: any): any {
    return {
      from_node_id: sourceItem.org_id,
      to_node_id: sourceItem.app_id,
      edge_type: "HAS_ACCESS_TO",
      edge_id: `${sourceItem.org_id}#${sourceItem.app_id}`,

      // Edge properties
      access_type: sourceItem.access_type || "standard",
      enabled: sourceItem.enabled !== false,
      org_config: sourceItem.config || {},
      installed_at: sourceItem.created_at || new Date().toISOString(),
      last_accessed: sourceItem.last_accessed || null,

      // Analytics properties
      usage_metrics: {
        total_users: 0,
        monthly_active_users: 0,
        last_usage: null,
      },
      relationship_strength: this.calculateRelationshipStrength(sourceItem),

      // Graph metadata
      created_at: sourceItem.created_at || new Date().toISOString(),
      updated_at: sourceItem.updated_at || new Date().toISOString(),
    };
  }

  /**
   * Transform user application state to user-app edge
   */
  private transformUserAppEdge(sourceItem: any): any {
    const [orgId, appId] = sourceItem.sort_key?.split("#") || ["", ""];

    return {
      from_node_id: sourceItem.user_id,
      to_node_id: `${appId}#${orgId}`, // Composite for 3-way relationship
      edge_type: "USES",
      edge_id: `${sourceItem.user_id}#${appId}#${orgId}`,
      context_org_id: orgId,

      // Edge properties
      access_level: sourceItem.access_level || "user",
      user_state: sourceItem.state || {},
      preferences: sourceItem.preferences || {},
      status: sourceItem.status || "active",

      // Analytics properties
      usage_metrics: {
        session_count: sourceItem.session_count || 0,
        total_time: sourceItem.total_time || 0,
        last_session: sourceItem.last_accessed,
        feature_usage: sourceItem.feature_usage || {},
      },
      expertise_level: this.calculateExpertiseLevel(sourceItem),
      relationship_strength: this.calculateUserAppStrength(sourceItem),

      // Timestamps
      first_accessed: sourceItem.created_at,
      last_accessed: sourceItem.last_accessed || sourceItem.updated_at,
      created_at: sourceItem.created_at || new Date().toISOString(),
      updated_at: sourceItem.updated_at || new Date().toISOString(),
    };
  }

  /**
   * Create user-organization membership edge
   */
  private createUserOrgEdge(membershipData: any): any {
    return {
      from_node_id: membershipData.user_id,
      to_node_id: membershipData.org_id,
      edge_type: "MEMBER_OF",
      edge_id: `${membershipData.user_id}#${membershipData.org_id}`,

      // Edge properties
      role: membershipData.role || "member",
      permissions: membershipData.permissions || [],
      access_level: membershipData.access_level || "standard",
      status: "active",

      // Temporal properties
      created_at: membershipData.joined_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      expires_at: membershipData.expires_at || null,
    };
  }

  /**
   * Transform audit log to graph-aware audit trail
   */
  private transformAuditTrail(sourceItem: any): any {
    const date = sourceItem.date || new Date().toISOString().split("T")[0];
    const timestamp = sourceItem.timestamp || new Date().toISOString();

    return {
      target_node_type: `${sourceItem.resource_type || "unknown"}#${date}`,
      timestamp_id: `${timestamp}#${uuidv4()}`,

      // Audit properties
      event_id: sourceItem.event_id || uuidv4(),
      action: sourceItem.action,
      actor_id: sourceItem.user_id,
      target_node_id: sourceItem.resource_id,
      organization_context: sourceItem.organization_id,

      // Event details
      changes: sourceItem.changes || {},
      metadata: {
        ip_address: sourceItem.ip_address,
        user_agent: sourceItem.user_agent,
        session_id: sourceItem.session_id,
        risk_level: this.calculateRiskLevel(sourceItem),
        compliance_flags: sourceItem.compliance_flags || [],
      },

      // Timestamps
      timestamp,
      created_at: timestamp,
    };
  }

  /**
   * Utility functions
   */
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  private createSearchVector(name: string, description?: string): string {
    return [name, description].filter(Boolean).join(" ").toLowerCase();
  }

  private extractDomain(email?: string): string | null {
    return email?.split("@")[1] || null;
  }

  private calculateHierarchyDepth(org: any): number {
    // Would need to traverse parent chain
    return org.hierarchy_level || 1;
  }

  private calculateRelationshipStrength(relationship: any): number {
    // Simple scoring based on usage
    const baseScore = relationship.enabled ? 0.5 : 0.1;
    const usageScore = relationship.last_accessed ? 0.3 : 0;
    const configScore = Object.keys(relationship.config || {}).length * 0.05;

    return Math.min(1.0, baseScore + usageScore + configScore);
  }

  private calculateExpertiseLevel(
    userApp: any
  ): "novice" | "intermediate" | "expert" {
    const sessions = userApp.session_count || 0;
    const features = Object.keys(userApp.feature_usage || {}).length;

    if (sessions > 100 && features > 10) return "expert";
    if (sessions > 20 && features > 3) return "intermediate";
    return "novice";
  }

  private calculateUserAppStrength(userApp: any): number {
    const sessionScore = Math.min(0.4, (userApp.session_count || 0) / 100);
    const timeScore = Math.min(0.3, (userApp.total_time || 0) / 10000);
    const recencyScore = userApp.last_accessed
      ? Math.max(
          0,
          0.3 -
            (Date.now() - new Date(userApp.last_accessed).getTime()) /
              (1000 * 60 * 60 * 24 * 30)
        )
      : 0;

    return sessionScore + timeScore + recencyScore;
  }

  private calculateRiskLevel(
    auditEvent: any
  ): "low" | "medium" | "high" | "critical" {
    const securityActions = [
      "login_failed",
      "permission_escalation",
      "data_export",
    ];
    const adminActions = [
      "user_created",
      "permission_changed",
      "config_modified",
    ];

    if (securityActions.includes(auditEvent.action)) return "high";
    if (adminActions.includes(auditEvent.action)) return "medium";
    return "low";
  }

  /**
   * Execute migration step
   */
  async executeMigrationStep(
    step: MigrationStep
  ): Promise<{ success: boolean; itemsProcessed: number; errors: any[] }> {
    const errors: any[] = [];
    let itemsProcessed = 0;

    try {
      if (step.sourceTable) {
        // Scan source table and transform items
        const scanCommand = new ScanCommand({
          TableName: step.sourceTable,
        });

        const result = await this.client.send(scanCommand);
        const items = result.Items?.map((item) => unmarshall(item)) || [];

        for (const item of items) {
          try {
            const transformResult = step.transformFunction(item);
            const transformedItems = Array.isArray(transformResult)
              ? transformResult
              : [transformResult];

            for (const transformedItem of transformedItems) {
              await this.client.send(
                new PutItemCommand({
                  TableName: step.targetTable,
                  Item: marshall(transformedItem),
                })
              );
              itemsProcessed++;
            }
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : String(error);
            errors.push({ item: item.id || "unknown", error: errorMessage });
          }
        }
      } else {
        // Handle steps that don't have a source table (like creating users from auth)
        console.log(`Skipping step ${step.id} - requires manual data source`);
      }

      return { success: errors.length === 0, itemsProcessed, errors };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return {
        success: false,
        itemsProcessed,
        errors: [{ step: step.id, error: errorMessage }],
      };
    }
  }

  /**
   * Validate migration results
   */
  async validateMigration(): Promise<{ isValid: boolean; issues: string[] }> {
    const issues: string[] = [];

    // Check that all node tables have proper graph metadata
    const nodeTables = [
      "captify-applications",
      "captify-organizations",
      "captify-users",
    ];

    for (const tableName of nodeTables) {
      try {
        const scanCommand = new ScanCommand({
          TableName: tableName,
          Limit: 10, // Sample check
        });

        const result = await this.client.send(scanCommand);
        const items = result.Items?.map((item) => unmarshall(item)) || [];

        for (const item of items) {
          if (!item.node_type) {
            issues.push(`${tableName}: Missing node_type in item ${item.id}`);
          }
          if (!item.graph_properties) {
            issues.push(
              `${tableName}: Missing graph_properties in item ${item.id}`
            );
          }
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        issues.push(`${tableName}: Table scan failed - ${errorMessage}`);
      }
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  }
}

export default GraphMigrationService;
