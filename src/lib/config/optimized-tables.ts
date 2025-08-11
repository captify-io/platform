/**
 * Database Table Optimization & Migration - Graph-Ready Design
 *
 * Designed as nodes and edges for future Neptune migration.
 * Each table represents either a vertex (node) or edge (relationship) in the graph.
 */

// Graph Node Types - Core entities that exist independently
export interface GraphNodeSchemas {
  // APPLICATION NODES - Independent entities that can be connected
  applications: {
    // Identity (Node ID)
    id: string; // UUID: app_123e4567-e89b-12d3-a456-426614174000
    slug: string; // Human-readable: "aircraft-console", "materiel-insights"
    node_type: "application"; // Graph label

    // Node Properties
    name: string; // Internal/slug-friendly name
    title: string; // Human-readable display name (required by ApplicationLayout)
    description: string;
    version: string;
    status: "active" | "inactive" | "deprecated";
    category: string; // Will become graph traversal path

    // Node Metadata
    created_at: string;
    updated_at: string;
    created_by: string; // Edge to User node

    // Graph Properties (for future Neptune migration)
    capabilities: string[]; // Graph properties for traversal
    tags: string[]; // Graph labels/properties

    // Configuration (Node Properties)
    config: {
      database_tables?: Record<string, string>;
      features?: string[]; // Will become graph properties
      permissions?: string[]; // Will become edge properties
      api_endpoints?: string[]; // Graph properties
    };

    // Optional Node Properties
    logo_url?: string;
    documentation_url?: string;
    repository_url?: string;

    // Graph Metadata
    graph_metadata?: {
      centrality_score?: number; // For graph analytics
      connection_count?: number; // Cache for performance
      last_accessed?: string;
    };
  };

  // ORGANIZATION NODES - Tenant/boundary entities
  organizations: {
    // Identity (Node ID)
    id: string; // UUID: org_123e4567-e89b-12d3-a456-426614174000
    slug: string; // Human-readable: "air-force", "navy", "contractor-acme"
    node_type: "organization"; // Graph label

    // Node Properties
    name: string;
    description?: string;
    type: "government" | "contractor" | "partner"; // Graph classification
    status: "active" | "inactive" | "suspended";
    classification_level?: string; // "public" | "cui" | "secret" | "top_secret"

    // Node Metadata
    created_at: string;
    updated_at: string;

    // Organizational Properties (Graph traversal)
    hierarchy_level?: number; // For graph depth queries
    parent_org_id?: string; // Self-referential edge
    domain?: string; // Graph property for filtering

    // Contact Properties
    primary_contact?: string;
    email_domain?: string;

    // Configuration (Node Properties)
    settings: {
      branding?: Record<string, unknown>;
      features?: string[];
      limits?: Record<string, unknown>;
      security_policies?: string[]; // Graph properties
    };

    // Graph Metadata
    graph_metadata?: {
      centrality_score?: number;
      user_count?: number; // Cache
      app_count?: number; // Cache
      activity_score?: number; // For graph analytics
    };
  };

  // USER NODES - Actor entities in the graph
  users: {
    // Identity (Node ID)
    id: string; // UUID: user_123e4567-e89b-12d3-a456-426614174000
    email: string; // Natural key + graph property
    node_type: "user"; // Graph label

    // Node Properties
    first_name: string;
    last_name: string;
    full_name: string; // Computed for graph queries
    status: "active" | "inactive" | "suspended";
    user_type: "internal" | "external" | "service"; // Graph classification

    // Authentication Properties
    email_verified: boolean;
    last_login?: string;
    security_clearance?: string; // Graph property for access control

    // Node Metadata
    created_at: string;
    updated_at: string;

    // Profile Properties (Graph searchable)
    avatar_url?: string;
    timezone?: string;
    department?: string; // Graph property
    role_title?: string; // Graph property

    // Preferences (Node Properties)
    preferences?: {
      theme?: string;
      notifications?: string[];
      language?: string;
    };

    // Graph Metadata
    graph_metadata?: {
      activity_score?: number; // For recommendation algorithms
      connection_count?: number; // Social network analysis
      expertise_areas?: string[]; // Graph properties
      influence_score?: number; // Graph analytics
    };
  };

  // RESOURCE NODES - Data/content entities
  resources: {
    // Identity (Node ID)
    id: string; // UUID: resource_123e4567-e89b-12d3-a456-426614174000
    slug?: string; // Optional human-readable identifier
    node_type: "resource"; // Graph label

    // Node Properties
    name: string;
    description?: string;
    resource_type:
      | "document"
      | "dataset"
      | "api"
      | "service"
      | "knowledge_base";
    content_type?: string; // MIME type or classification
    status: "active" | "inactive" | "archived";

    // Node Metadata
    created_at: string;
    updated_at: string;
    created_by: string; // Edge to User node

    // Resource Properties (Graph searchable)
    tags: string[]; // Graph labels/properties
    categories: string[]; // Graph properties for traversal
    security_classification?: string; // Access control

    // Content Properties
    content_url?: string;
    content_hash?: string; // For integrity/versioning
    file_size?: number;
    version?: string;

    // Graph Metadata
    graph_metadata?: {
      access_count?: number; // Usage analytics
      relevance_score?: number; // Search/recommendation
      quality_score?: number; // Content quality metrics
      relationships_count?: number; // Cache
    };
  };
}

// Graph Edge Types - Relationships between nodes
export interface GraphEdgeSchemas {
  // USER-ORGANIZATION RELATIONSHIPS (MEMBERSHIP edges)
  user_organizations: {
    // Edge Identity
    id: string; // UUID for the relationship itself
    edge_type: "MEMBER_OF"; // Graph edge label

    // Edge Endpoints (Graph traversal)
    from_node_id: string; // user.id
    from_node_type: "user";
    to_node_id: string; // organization.id
    to_node_type: "organization";

    // Edge Properties
    role: "owner" | "admin" | "member" | "viewer" | "guest";
    status: "active" | "inactive" | "pending" | "suspended";
    access_level?: string; // Inherited from security clearance

    // Edge Metadata
    created_at: string; // When relationship started
    updated_at: string;
    expires_at?: string; // Temporal relationships

    // Relationship Context
    invited_by?: string; // User UUID - creates invitation edge
    approved_by?: string; // User UUID - creates approval edge

    // Edge Properties (Graph traversal)
    permissions: string[]; // What this relationship allows
    restrictions?: string[]; // What this relationship restricts

    // Graph Analytics
    relationship_strength?: number; // 0-1 for graph algorithms
    activity_level?: "low" | "medium" | "high";
  };

  // ORGANIZATION-APPLICATION RELATIONSHIPS (ACCESS/INSTALL edges)
  organization_applications: {
    // Edge Identity
    id: string;
    edge_type: "HAS_ACCESS_TO"; // Graph edge label

    // Edge Endpoints
    from_node_id: string; // organization.id
    from_node_type: "organization";
    to_node_id: string; // application.id
    to_node_type: "application";

    // Edge Properties
    enabled: boolean;
    access_type: "full" | "limited" | "readonly" | "trial";

    // Edge Metadata
    installed_at: string;
    installed_by: string; // User UUID
    last_accessed?: string;
    expires_at?: string; // For trial/temporary access

    // Configuration (Edge Properties)
    org_config?: {
      customizations?: Record<string, unknown>;
      feature_flags?: string[];
      limits?: {
        users?: number;
        storage?: number;
        api_calls?: number;
      };
    };

    // Usage Analytics (Graph properties)
    usage_metrics?: {
      access_count?: number;
      active_users?: number;
      last_week_usage?: number;
    };

    // Graph Analytics
    relationship_strength?: number; // Usage-based scoring
  };

  // USER-APPLICATION RELATIONSHIPS (USAGE edges)
  user_applications: {
    // Edge Identity
    id: string;
    edge_type: "USES"; // Graph edge label

    // Edge Endpoints
    from_node_id: string; // user.id
    from_node_type: "user";
    to_node_id: string; // application.id
    to_node_type: "application";

    // Context (which org context)
    context_org_id: string; // organization.id - creates 3-way relationship

    // Edge Properties
    access_level: "full" | "limited" | "readonly";
    status: "active" | "inactive";

    // Edge Metadata
    first_accessed: string;
    last_accessed: string;
    updated_at: string;

    // State Data (Edge Properties)
    user_state?: Record<string, unknown>; // Application-specific state
    preferences?: Record<string, unknown>; // User preferences for this app
    bookmarks?: string[]; // User bookmarks within app

    // Usage Analytics
    usage_metrics?: {
      session_count?: number;
      total_time?: number; // seconds
      feature_usage?: Record<string, number>;
      last_action?: string;
    };

    // Graph Analytics
    relationship_strength?: number; // Usage-based scoring
    expertise_level?: "beginner" | "intermediate" | "expert";
  };

  // USER-RESOURCE RELATIONSHIPS (ACCESS/CREATION edges)
  user_resources: {
    // Edge Identity
    id: string;
    edge_type: "CREATED" | "ACCESSED" | "OWNS" | "SHARED"; // Multiple edge types

    // Edge Endpoints
    from_node_id: string; // user.id
    from_node_type: "user";
    to_node_id: string; // resource.id
    to_node_type: "resource";

    // Edge Properties
    permission_level: "read" | "write" | "admin" | "owner";
    access_context?: string; // How they got access

    // Edge Metadata
    created_at: string;
    last_accessed?: string;
    expires_at?: string;

    // Relationship Context
    granted_by?: string; // User UUID who granted access
    shared_via?: string; // "direct" | "org" | "group" | "public"

    // Usage Data
    access_count?: number;
    last_action?: string;

    // Graph Analytics
    relationship_strength?: number;
  };

  // RESOURCE-APPLICATION RELATIONSHIPS (DEPENDENCY edges)
  resource_applications: {
    // Edge Identity
    id: string;
    edge_type: "DEPENDS_ON" | "PROVIDES_TO" | "INTEGRATES_WITH";

    // Edge Endpoints
    from_node_id: string; // Can be resource.id or application.id
    from_node_type: "resource" | "application";
    to_node_id: string; // Can be application.id or resource.id
    to_node_type: "application" | "resource";

    // Edge Properties
    dependency_type: "required" | "optional" | "enhanced";
    integration_type?: "api" | "data" | "ui" | "workflow";

    // Edge Metadata
    created_at: string;
    updated_at: string;

    // Configuration
    config?: {
      api_version?: string;
      data_format?: string;
      sync_frequency?: string;
    };

    // Health Metrics
    status: "healthy" | "degraded" | "failed";
    last_check?: string;
    error_rate?: number;
  };
}

// Audit Trail - Special edge type for tracking all changes
export interface AuditTrail {
  id: string;
  edge_type: "AUDIT_TRAIL";

  // What was affected
  target_node_id: string;
  target_node_type: string;
  target_edge_id?: string; // If auditing an edge change

  // Who did it
  actor_id: string; // User UUID
  actor_type: "user" | "system" | "service";

  // What happened
  action: "created" | "updated" | "deleted" | "accessed" | "shared";
  event_type: string; // Specific event classification

  // When and where
  timestamp: string;
  ip_address?: string;
  user_agent?: string;
  session_id?: string;

  // Context
  organization_context?: string; // org.id
  application_context?: string; // app.id

  // Change details
  changes?: {
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
    fields_changed?: string[];
  };

  // Metadata
  metadata?: {
    risk_level?: "low" | "medium" | "high";
    compliance_flags?: string[];
    automated?: boolean;
  };
}

/**
 * AWS DynamoDB Table Definitions - Graph-Ready Design
 *
 * Tables designed as nodes and edges for Neptune migration.
 * Each table supports both current DynamoDB usage and future graph operations.
 */

// TypeScript interface for table definitions
export interface GraphReadyTableDefinition {
  partitionKey: string;
  sortKey?: string;
  globalSecondaryIndexes: Array<{
    name: string;
    partitionKey: string;
    sortKey?: string;
    projectionType: "ALL" | "KEYS_ONLY" | "INCLUDE";
    nonKeyAttributes?: string[];
  }>;
  graphMetadata: {
    nodeType?: string;
    edgeType?: string;
    fromNodeType?: string | "MULTIPLE";
    toNodeType?: string | "MULTIPLE";
    contextNodeType?: string;
    primaryKey?: string;
    traversalProperties?: string[];
    searchableFields?: string[];
    hierarchicalEdge?: string;
    edgeProperties?: string[];
    temporalProperties?: string[];
    analyticsProperties?: string[];
    healthProperties?: string[];
    auditProperties?: string[];
    purpose?: string;
    metricsTypes?: string[];
    computationSchedule?: string;
  };
}

export const GRAPH_READY_TABLE_DEFINITIONS: Record<
  string,
  GraphReadyTableDefinition
> = {
  // === NODE TABLES ===

  // Applications - Independent application nodes
  "captify-applications": {
    partitionKey: "id", // UUID - unique node ID
    sortKey: undefined, // Single item per partition
    globalSecondaryIndexes: [
      {
        name: "SlugIndex",
        partitionKey: "slug", // Human-readable lookups
        projectionType: "ALL",
      },
      {
        name: "CategoryIndex",
        partitionKey: "category", // Graph traversal by category
        sortKey: "title", // Sort by display name, not internal name
        projectionType: "ALL",
      },
      {
        name: "StatusIndex",
        partitionKey: "status",
        sortKey: "updated_at",
        projectionType: "ALL",
      },
      {
        name: "CreatedByIndex",
        partitionKey: "created_by", // Find apps created by user
        sortKey: "created_at",
        projectionType: "KEYS_ONLY",
      },
    ],
    // Graph metadata for Neptune migration
    graphMetadata: {
      nodeType: "application",
      primaryKey: "id",
      traversalProperties: ["category", "capabilities", "tags"],
      searchableFields: ["name", "title", "description", "slug"],
    },
  },

  // Organizations - Tenant/boundary nodes
  "captify-organizations": {
    partitionKey: "id", // UUID - unique node ID
    sortKey: undefined,
    globalSecondaryIndexes: [
      {
        name: "SlugIndex",
        partitionKey: "slug",
        projectionType: "ALL",
      },
      {
        name: "TypeIndex",
        partitionKey: "type", // Graph traversal by org type
        sortKey: "name",
        projectionType: "ALL",
      },
      {
        name: "HierarchyIndex",
        partitionKey: "parent_org_id", // Parent-child relationships
        sortKey: "hierarchy_level",
        projectionType: "ALL",
      },
      {
        name: "DomainIndex",
        partitionKey: "domain", // Lookup by email domain
        projectionType: "KEYS_ONLY",
      },
    ],
    graphMetadata: {
      nodeType: "organization",
      primaryKey: "id",
      traversalProperties: ["type", "classification_level", "domain"],
      hierarchicalEdge: "parent_org_id", // Self-referential edges
    },
  },

  // Users - Actor nodes
  "captify-users": {
    partitionKey: "id", // UUID - unique node ID
    sortKey: undefined,
    globalSecondaryIndexes: [
      {
        name: "EmailIndex",
        partitionKey: "email", // Natural key lookup
        projectionType: "ALL",
      },
      {
        name: "StatusIndex",
        partitionKey: "status",
        sortKey: "last_login",
        projectionType: "ALL",
      },
      {
        name: "DepartmentIndex",
        partitionKey: "department", // Organizational structure
        sortKey: "role_title",
        projectionType: "KEYS_ONLY",
      },
      {
        name: "SecurityClearanceIndex",
        partitionKey: "security_clearance", // Access control
        projectionType: "KEYS_ONLY",
      },
    ],
    graphMetadata: {
      nodeType: "user",
      primaryKey: "id",
      traversalProperties: ["user_type", "department", "security_clearance"],
      searchableFields: ["full_name", "email", "department"],
    },
  },

  // Resources - Data/content nodes
  "captify-resources": {
    partitionKey: "id", // UUID - unique node ID
    sortKey: undefined,
    globalSecondaryIndexes: [
      {
        name: "SlugIndex",
        partitionKey: "slug",
        projectionType: "ALL",
      },
      {
        name: "TypeIndex",
        partitionKey: "resource_type",
        sortKey: "updated_at",
        projectionType: "ALL",
      },
      {
        name: "CreatedByIndex",
        partitionKey: "created_by",
        sortKey: "created_at",
        projectionType: "KEYS_ONLY",
      },
      {
        name: "SecurityClassificationIndex",
        partitionKey: "security_classification",
        sortKey: "updated_at",
        projectionType: "KEYS_ONLY",
      },
    ],
    graphMetadata: {
      nodeType: "resource",
      primaryKey: "id",
      traversalProperties: ["resource_type", "categories", "tags"],
      searchableFields: ["name", "description", "tags"],
    },
  },

  // === EDGE TABLES ===

  // User-Organization Memberships (MEMBER_OF edges)
  "captify-user-organizations": {
    partitionKey: "from_node_id", // user.id
    sortKey: "to_node_id", // organization.id
    globalSecondaryIndexes: [
      {
        name: "OrgMembersIndex",
        partitionKey: "to_node_id", // org.id
        sortKey: "from_node_id", // user.id - reverse lookup
        projectionType: "ALL",
      },
      {
        name: "UserRoleIndex",
        partitionKey: "from_node_id", // user.id
        sortKey: "role",
        projectionType: "ALL",
      },
      {
        name: "ActiveMembershipsIndex",
        partitionKey: "status",
        sortKey: "created_at",
        projectionType: "KEYS_ONLY",
      },
      {
        name: "EdgeTypeIndex",
        partitionKey: "edge_type", // Graph edge traversal
        sortKey: "created_at",
        projectionType: "KEYS_ONLY",
      },
    ],
    graphMetadata: {
      edgeType: "MEMBER_OF",
      fromNodeType: "user",
      toNodeType: "organization",
      edgeProperties: ["role", "permissions", "access_level"],
      temporalProperties: ["created_at", "expires_at"],
    },
  },

  // Organization-Application Access (HAS_ACCESS_TO edges)
  "captify-organization-applications": {
    partitionKey: "from_node_id", // org.id
    sortKey: "to_node_id", // app.id
    globalSecondaryIndexes: [
      {
        name: "AppOrgsIndex",
        partitionKey: "to_node_id", // app.id
        sortKey: "from_node_id", // org.id - reverse lookup
        projectionType: "ALL",
      },
      {
        name: "EnabledAppsIndex",
        partitionKey: "from_node_id", // org.id
        sortKey: "enabled#last_accessed", // Composite sort for enabled apps
        projectionType: "ALL",
      },
      {
        name: "EdgeTypeIndex",
        partitionKey: "edge_type",
        sortKey: "installed_at",
        projectionType: "KEYS_ONLY",
      },
      {
        name: "AccessTypeIndex",
        partitionKey: "access_type",
        sortKey: "last_accessed",
        projectionType: "KEYS_ONLY",
      },
    ],
    graphMetadata: {
      edgeType: "HAS_ACCESS_TO",
      fromNodeType: "organization",
      toNodeType: "application",
      edgeProperties: ["access_type", "enabled", "org_config"],
      analyticsProperties: ["usage_metrics", "relationship_strength"],
    },
  },

  // User-Application Usage (USES edges)
  "captify-user-applications": {
    partitionKey: "from_node_id", // user.id
    sortKey: "to_node_id#context_org_id", // app.id#org.id - 3-way relationship
    globalSecondaryIndexes: [
      {
        name: "AppUsersIndex",
        partitionKey: "to_node_id", // app.id
        sortKey: "from_node_id", // user.id
        projectionType: "ALL",
      },
      {
        name: "OrgAppUsageIndex",
        partitionKey: "context_org_id", // org.id
        sortKey: "to_node_id#last_accessed", // app.id#timestamp
        projectionType: "ALL",
      },
      {
        name: "ActiveUsageIndex",
        partitionKey: "status",
        sortKey: "last_accessed",
        projectionType: "KEYS_ONLY",
      },
      {
        name: "ExpertiseIndex",
        partitionKey: "expertise_level",
        sortKey: "relationship_strength",
        projectionType: "KEYS_ONLY",
      },
    ],
    graphMetadata: {
      edgeType: "USES",
      fromNodeType: "user",
      toNodeType: "application",
      contextNodeType: "organization", // 3-way relationship
      edgeProperties: ["access_level", "user_state", "preferences"],
      analyticsProperties: [
        "usage_metrics",
        "expertise_level",
        "relationship_strength",
      ],
    },
  },

  // User-Resource Relationships (CREATED/ACCESSED/OWNS edges)
  "captify-user-resources": {
    partitionKey: "from_node_id", // user.id
    sortKey: "edge_type#to_node_id", // relationship_type#resource.id
    globalSecondaryIndexes: [
      {
        name: "ResourceUsersIndex",
        partitionKey: "to_node_id", // resource.id
        sortKey: "edge_type#from_node_id", // relationship_type#user.id
        projectionType: "ALL",
      },
      {
        name: "EdgeTypeIndex",
        partitionKey: "edge_type",
        sortKey: "created_at",
        projectionType: "ALL",
      },
      {
        name: "PermissionIndex",
        partitionKey: "permission_level",
        sortKey: "last_accessed",
        projectionType: "KEYS_ONLY",
      },
      {
        name: "SharedResourcesIndex",
        partitionKey: "shared_via",
        sortKey: "created_at",
        projectionType: "KEYS_ONLY",
      },
    ],
    graphMetadata: {
      edgeType: "MULTIPLE", // CREATED, ACCESSED, OWNS, SHARED
      fromNodeType: "user",
      toNodeType: "resource",
      edgeProperties: ["permission_level", "access_context"],
      temporalProperties: ["created_at", "last_accessed", "expires_at"],
    },
  },

  // Resource-Application Dependencies (DEPENDS_ON/PROVIDES_TO edges)
  "captify-resource-applications": {
    partitionKey: "from_node_id", // resource.id or app.id
    sortKey: "edge_type#to_node_id", // dependency_type#target.id
    globalSecondaryIndexes: [
      {
        name: "ReverseDependencyIndex",
        partitionKey: "to_node_id",
        sortKey: "edge_type#from_node_id",
        projectionType: "ALL",
      },
      {
        name: "DependencyTypeIndex",
        partitionKey: "dependency_type",
        sortKey: "status",
        projectionType: "ALL",
      },
      {
        name: "HealthStatusIndex",
        partitionKey: "status",
        sortKey: "last_check",
        projectionType: "KEYS_ONLY",
      },
      {
        name: "IntegrationTypeIndex",
        partitionKey: "integration_type",
        sortKey: "updated_at",
        projectionType: "KEYS_ONLY",
      },
    ],
    graphMetadata: {
      edgeType: "MULTIPLE", // DEPENDS_ON, PROVIDES_TO, INTEGRATES_WITH
      fromNodeType: "MULTIPLE", // resource or application
      toNodeType: "MULTIPLE", // application or resource
      edgeProperties: ["dependency_type", "integration_type", "config"],
      healthProperties: ["status", "error_rate", "last_check"],
    },
  },

  // === AUDIT TRAIL TABLE ===

  // Audit Trail - Special edge type for tracking all changes
  "captify-audit-trail": {
    partitionKey: "target_node_type#date", // node_type#YYYY-MM-DD for partitioning
    sortKey: "timestamp#id", // Time-ordered with unique ID
    globalSecondaryIndexes: [
      {
        name: "ActorIndex",
        partitionKey: "actor_id",
        sortKey: "timestamp",
        projectionType: "ALL",
      },
      {
        name: "TargetNodeIndex",
        partitionKey: "target_node_id",
        sortKey: "timestamp",
        projectionType: "ALL",
      },
      {
        name: "ActionIndex",
        partitionKey: "action",
        sortKey: "timestamp",
        projectionType: "KEYS_ONLY",
      },
      {
        name: "OrganizationContextIndex",
        partitionKey: "organization_context",
        sortKey: "timestamp",
        projectionType: "KEYS_ONLY",
      },
      {
        name: "RiskLevelIndex",
        partitionKey: "metadata.risk_level",
        sortKey: "timestamp",
        projectionType: "KEYS_ONLY",
      },
    ],
    graphMetadata: {
      edgeType: "AUDIT_TRAIL",
      fromNodeType: "user", // actor
      toNodeType: "MULTIPLE", // any node type
      temporalProperties: ["timestamp"],
      auditProperties: ["action", "changes", "metadata"],
    },
  },

  // === GRAPH ANALYTICS TABLES ===

  // Pre-computed graph metrics for performance
  "captify-graph-metrics": {
    partitionKey: "node_id",
    sortKey: "metric_type#date", // centrality#2025-08-09
    globalSecondaryIndexes: [
      {
        name: "MetricTypeIndex",
        partitionKey: "metric_type",
        sortKey: "metric_value",
        projectionType: "ALL",
      },
      {
        name: "NodeTypeMetricsIndex",
        partitionKey: "node_type",
        sortKey: "metric_value",
        projectionType: "KEYS_ONLY",
      },
    ],
    graphMetadata: {
      purpose: "graph_analytics",
      metricsTypes: ["centrality", "pagerank", "clustering", "influence"],
      computationSchedule: "daily",
    },
  },
};

/**
 * Migration utilities
 */
export const MIGRATION_HELPERS = {
  /**
   * Generate UUID for new records
   */
  generateUUID(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  },

  /**
   * Generate slug from name
   */
  generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "") // Remove special chars
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .replace(/-+/g, "-") // Remove duplicate hyphens
      .trim();
  },

  /**
   * Create composite sort key
   */
  createCompositeKey(...parts: string[]): string {
    return parts.join("#");
  },

  /**
   * Parse composite sort key
   */
  parseCompositeKey(key: string): string[] {
    return key.split("#");
  },
};

// Export default
export default GRAPH_READY_TABLE_DEFINITIONS;

// Type-safe table names
export type GraphReadyTableName = keyof typeof GRAPH_READY_TABLE_DEFINITIONS;

// Helper functions for graph operations
export const getNodeTables = () => {
  return Object.entries(GRAPH_READY_TABLE_DEFINITIONS)
    .filter(([, def]) => def.graphMetadata.nodeType)
    .map(([name]) => name);
};

export const getEdgeTables = () => {
  return Object.entries(GRAPH_READY_TABLE_DEFINITIONS)
    .filter(([, def]) => def.graphMetadata.edgeType)
    .map(([name]) => name);
};

export const getTableByNodeType = (nodeType: string) => {
  return Object.entries(GRAPH_READY_TABLE_DEFINITIONS).find(
    ([, def]) => def.graphMetadata.nodeType === nodeType
  )?.[0];
};

export const getEdgeTablesByTypes = (fromType: string, toType: string) => {
  return Object.entries(GRAPH_READY_TABLE_DEFINITIONS)
    .filter(([, def]) => {
      const meta = def.graphMetadata;
      return (
        meta.edgeType &&
        (meta.fromNodeType === fromType || meta.fromNodeType === "MULTIPLE") &&
        (meta.toNodeType === toType || meta.toNodeType === "MULTIPLE")
      );
    })
    .map(([name]) => name);
};
