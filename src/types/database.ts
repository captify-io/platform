/**
 * Database Types for DynamoDB-Driven Application Management
 * Extends existing application types with database-specific fields
 */

import {
  ApplicationMetadata,
  AIAgentConfig,
  ApplicationUI,
  ApplicationPermissions,
} from "./application";

// Core database entity for applications
export interface ApplicationEntity {
  organization_id: string;
  // DynamoDB Keys
  org_id?: string; // Partition Key
  app_id?: string; // Sort Key

  // Application UUID (primary identifier for references)
  id: string; // UUID - main identifier for app references
  owner_id?: string; // User who owns/created this application

  // Core application data (nested structure - preferred)
  metadata?: ApplicationMetadata;
  ai_agent?: AIAgentConfig;
  ui_config?: ApplicationUI;
  permissions?: ApplicationPermissions;

  // Flat structure fields (actual API response)
  name?: string; // Application name (flat)
  title?: string; // Application title (flat)
  description?: string; // Application description (flat)
  slug?: string; // Application slug (flat)
  category?: string; // Application category (flat)
  node_type?: string; // Node type for graph
  agentId?: string; // Agent ID
  agentAliasId?: string; // Agent alias ID
  tags?: string[]; // Tags array
  capabilities?: string[]; // Capabilities array
  menu?: Array<{
    icon: string;
    id: string;
    label: string;
    href: string;
    order: number;
  }>; // Menu items
  database_tables?: Record<string, string>; // Database tables config
  requires_shared_tables?: string[]; // Shared tables

  // Database-specific fields
  base_template?: boolean; // Is this a base template or user customization
  parent_app_id?: string; // For user-customized versions
  created_by?: string; // User ID from session
  status?: "active" | "draft" | "archived";
  version?: string; // Semantic version
  created_at?: string; // ISO timestamp
  updated_at?: string; // ISO timestamp

  // Legacy compatibility
  legacy_id?: string; // For migration from demo-applications.json
}

// User-specific application state and customizations
export interface UserApplicationState {
  // Graph-based DynamoDB Keys (new structure)
  from_node_id?: string; // Partition Key: user.id
  "to_node_id#context_org_id"?: string; // Sort Key: app.id#org.id

  // Legacy DynamoDB Keys (for backward compatibility)
  user_id: string; // Partition Key
  app_id: string; // Sort Key

  // User customizations
  custom_config?: Partial<ApplicationUI>;
  custom_agent_config?: Partial<AIAgentConfig>;
  custom_name?: string; // User's custom name for the app

  // User interaction data
  favorite: boolean;
  last_accessed: string; // ISO timestamp
  access_count: number;

  // Dynamic features (Phase 2)
  saved_tools: DynamicTool[];
  session_state: Record<string, unknown>;

  // Metadata
  created_at: string;
  updated_at: string;
}

// Dynamic tools that can be added through chat interactions
export interface DynamicTool {
  id: string;
  name: string;
  description: string;
  type: "api_call" | "data_query" | "ui_component" | "workflow";
  config: Record<string, unknown>;
  discovered_through: "chat" | "admin" | "suggestion";
  added_at: string;
  usage_count: number;
  enabled: boolean;
}

// Organization settings for application management
export interface OrganizationSettings {
  org_id: string; // Partition Key
  setting_key: string; // Sort Key

  setting_value: unknown;
  description?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// Database query interfaces
export interface ListApplicationsQuery {
  org_id: string;
  category?: string;
  status?: "active" | "draft" | "archived";
  search?: string;
  user_id?: string;
  template_only?: boolean;
  limit?: number;
  last_key?: string; // For pagination
}

export interface CreateApplicationRequest {
  name: string;
  description?: string;
  category: string;
  icon?: string;
  color?: string;
  agent_config: AIAgentConfig;
  ui_config?: Partial<ApplicationUI>;
  permissions?: Partial<ApplicationPermissions>;
  base_template?: boolean;
  parent_app_id?: string;
}

export interface UpdateApplicationRequest {
  name?: string;
  description?: string;
  category?: string;
  icon?: string;
  color?: string;
  agent_config?: Partial<AIAgentConfig>;
  ui_config?: Partial<ApplicationUI>;
  permissions?: Partial<ApplicationPermissions>;
  status?: "active" | "draft" | "archived";
}

// API Response types
export interface ApplicationListResponse {
  applications: ApplicationEntity[];
  last_key?: string;
  total_count?: number;
}

export interface UserApplicationResponse {
  application: ApplicationEntity;
  user_state?: UserApplicationState;
  is_customized: boolean;
  can_edit: boolean;
}

// Error types
export interface DatabaseError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// ============================================================================
// THREE-TABLE ARCHITECTURE FOR APPLICATIONS
// ============================================================================

/**
 * Application Menu Items - Dynamic menu structure per app
 * Table: application-menu-items
 */
export interface ApplicationMenuItem {
  // DynamoDB Keys
  app_id: string; // Partition Key - UUID reference to application
  menu_item_id: string; // Sort Key (e.g., "overview", "analytics", "settings")

  // Menu item properties
  label: string;
  icon: string; // Lucide icon name
  href: string; // Deep link URL
  order: number; // Display order (0-based)
  parent_id?: string; // For nested menus

  // Permissions and visibility
  required_permissions?: string[]; // User must have these permissions
  visible_when?: "always" | "admin" | "owner" | "custom"; // Visibility rules
  custom_visibility_rule?: string; // JSON rule for complex visibility

  // Metadata
  created_at: string;
  updated_at: string;
  created_by: string;
}

/**
 * Application Workspace Content - Dynamic content for the work area
 * Table: application-workspace-content
 */
export interface ApplicationWorkspaceContent {
  // DynamoDB Keys
  app_id: string; // Partition Key - UUID reference to application
  content_id: string; // Sort Key (e.g., "dashboard", "analytics-overview")

  // Menu relationship
  menu_item_id: string; // Reference to the menu item this content belongs to

  // Content properties
  content_type:
    | "dashboard"
    | "form"
    | "chart"
    | "table"
    | "custom"
    | "agent-generated"
    | "metric"
    | "overview_tiles"
    | "trading_watchlist"
    | "trading_chart"
    | "performance_tiles"
    | "volume_chart";
  title: string;
  description?: string;

  // Content data (JSON structure varies by content_type)
  content_data: Record<string, unknown>;

  // Layout and positioning
  layout_config: {
    position: { row: number; col: number };
    size: { width: number; height: number };
    responsive?: boolean;
    grid_area?: string; // CSS Grid area syntax: "row-start / col-start / row-end / col-end"
  };

  // Agent integration
  agent_updatable: boolean; // Can the AI agent modify this content?
  last_agent_update?: string; // Timestamp of last agent modification
  agent_update_reason?: string; // Why the agent updated this content

  // Metadata
  version: string; // Content version for change tracking
  created_at: string;
  updated_at: string;
  created_by: string; // "system", "user:email", or "agent:agentId"
}

/**
 * Extended Application Entity with references to menu and workspace
 * This extends the existing ApplicationEntity
 */
export interface ApplicationEntityExtended extends ApplicationEntity {
  // References to related data
  menu_items_count?: number; // Number of menu items
  workspace_content_count?: number; // Number of workspace content items

  // Cache for frequently accessed data (optional optimization)
  cached_menu_items?: ApplicationMenuItem[];
  cached_workspace_content?: ApplicationWorkspaceContent[];
  cache_updated_at?: string;
}

// ============================================================================
// API REQUEST/RESPONSE TYPES FOR THREE-TABLE ARCHITECTURE
// ============================================================================

export interface CreateMenuItemRequest {
  app_id: string;
  label: string;
  icon: string;
  href: string;
  order: number;
  parent_id?: string;
  required_permissions?: string[];
  visible_when?: "always" | "admin" | "owner" | "custom";
  custom_visibility_rule?: string;
}

export interface UpdateMenuItemRequest {
  label?: string;
  icon?: string;
  href?: string;
  order?: number;
  parent_id?: string;
  required_permissions?: string[];
  visible_when?: "always" | "admin" | "owner" | "custom";
  custom_visibility_rule?: string;
}

export interface CreateWorkspaceContentRequest {
  app_id: string;
  menu_item_id: string; // Required reference to menu item
  content_type:
    | "dashboard"
    | "form"
    | "chart"
    | "table"
    | "custom"
    | "agent-generated"
    | "metric"
    | "trading_watchlist"
    | "trading_chart"
    | "performance_tiles"
    | "volume_chart";
  title: string;
  description?: string;
  content_data: Record<string, unknown>;
  layout_config: {
    position: { row: number; col: number };
    size: { width: number; height: number };
    responsive?: boolean;
  };
  agent_updatable?: boolean;
}

export interface UpdateWorkspaceContentRequest {
  menu_item_id?: string; // Allow updating menu item relationship
  content_type?:
    | "dashboard"
    | "form"
    | "chart"
    | "table"
    | "custom"
    | "agent-generated"
    | "metric"
    | "overview_tiles"
    | "trading_watchlist"
    | "trading_chart"
    | "performance_tiles"
    | "volume_chart";
  title?: string;
  description?: string;
  content_data?: Record<string, unknown>;
  layout_config?: {
    position: { row: number; col: number };
    size: { width: number; height: number };
    responsive?: boolean;
  };
  agent_updatable?: boolean;
  agent_update_reason?: string; // Required when updated by agent
}

// Response types
export interface MenuItemsResponse {
  menu_items: ApplicationMenuItem[];
  app_id: string;
}

export interface WorkspaceContentResponse {
  workspace_content: ApplicationWorkspaceContent[];
  app_id: string;
}
