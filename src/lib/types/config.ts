/**
 * App Configuration Types
 *
 * TypeScript interfaces for application configuration files.
 * Ensures type safety when loading and using app configs.
 */

/**
 * Database configuration for an application
 */
export interface AppDatabaseConfig {
  tables: Record<string, string>;
  requiresSharedTables?: string[];
}

/**
 * Menu item configuration
 */
export interface AppMenuItem {
  id: string;
  label: string;
  icon?: string;
  href?: string;
  children?: AppMenuItem[];
}

/**
 * Complete application configuration
 */
export interface AppConfig {
  id: string;
  name: string;
  agentId?: string;
  agentAliasId?: string;
  database?: AppDatabaseConfig;
  menu: AppMenuItem[];
  description?: string;
  version?: string;
  enabled?: boolean;
}

/**
 * Validation result for app config
 */
export interface AppConfigValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Helper type for app table names
 */
export type AppTableName<T extends AppConfig = AppConfig> = T extends {
  database: { tables: infer Tables };
}
  ? Tables extends Record<string, string>
    ? keyof Tables
    : never
  : never;
