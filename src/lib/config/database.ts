/**
 * Shared Database Table Configuration
 *
 * Defines table names used across multiple applications.
 * These tables contain data that is shared between apps or used by common services.
 */

export const SHARED_TABLES = {
  // User management
  users: "captify-users",
  sessions: "captify-sessions",

  // Cross-app functionality
  notifications: "captify-notifications",
  audit_logs: "captify-audit-logs",
  permissions: "captify-permissions",

  // Application registry (actual table from DynamoDB)
  applications: "captify-applications",

  // Organization management (actual tables from DynamoDB)
  organizations: "captify-organizations",
  organization_settings: "captify-organization-settings",
  user_application_state: "captify-user-application-state",

  // Authentication (actual table from DynamoDB)
  auth_codes: "oidc-cac-auth-stack-authorization-codes",

  // System tables
  health_checks: "captify-health-checks",
  feature_flags: "captify-feature-flags",
} as const;

/**
 * Type helper for shared table names
 */
export type SharedTableName = keyof typeof SHARED_TABLES;

/**
 * Get a shared table name with type safety
 */
export function getSharedTable(tableName: SharedTableName): string {
  return SHARED_TABLES[tableName];
}

/**
 * Environment-aware table naming
 * Allows for prefixing tables based on environment (dev, staging, prod)
 */
export function getEnvironmentTable(tableName: SharedTableName): string {
  const prefix = process.env.TABLE_PREFIX || "";
  return `${prefix}${SHARED_TABLES[tableName]}`;
}
