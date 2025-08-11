/**
 * App Configuration Loader Service
 *
 * Loads and validates application configurations from config.json files.
 * Provides type-safe access to app configs and database table mappings.
 */

import { AppConfig, AppConfigValidation } from "@/lib/types/config";
import { SHARED_TABLES } from "@/lib/config/database";

/**
 * Cache for loaded app configurations to avoid repeated file reads
 */
const configCache = new Map<string, AppConfig>();

/**
 * Load application configuration from config.json file
 */
export async function loadAppConfig(appId: string): Promise<AppConfig> {
  // Check cache first
  if (configCache.has(appId)) {
    return configCache.get(appId)!;
  }

  try {
    // Load config from app folder
    const configPath = `/app/${appId}/config.json`;
    const response = await fetch(configPath);

    if (!response.ok) {
      throw new Error(
        `Failed to load config for app ${appId}: ${response.statusText}`
      );
    }

    const config: AppConfig = await response.json();

    // Validate the config
    const validation = validateAppConfig(config);
    if (!validation.isValid) {
      console.warn(
        `Config validation warnings for ${appId}:`,
        validation.warnings
      );
      if (validation.errors.length > 0) {
        throw new Error(
          `Invalid config for ${appId}: ${validation.errors.join(", ")}`
        );
      }
    }

    // Cache the validated config
    configCache.set(appId, config);

    return config;
  } catch (error) {
    console.error(`Failed to load config for app ${appId}:`, error);
    throw error;
  }
}

/**
 * Get app-specific table name with type safety
 */
export function getAppTable(config: AppConfig, tableName: string): string {
  if (!config.database?.tables) {
    throw new Error(`App ${config.id} has no database configuration`);
  }

  const table = config.database.tables[tableName];
  if (!table) {
    throw new Error(`Table ${tableName} not found in app ${config.id} config`);
  }

  return table;
}

/**
 * Get shared table name that the app requires
 */
export function getRequiredSharedTable(
  config: AppConfig,
  tableName: keyof typeof SHARED_TABLES
): string {
  if (!config.database?.requiresSharedTables?.includes(tableName)) {
    console.warn(
      `App ${config.id} doesn't declare dependency on shared table ${tableName}`
    );
  }

  return SHARED_TABLES[tableName];
}

/**
 * Validate app configuration
 */
export function validateAppConfig(config: AppConfig): AppConfigValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!config.id) errors.push("Missing required field: id");
  if (!config.name) errors.push("Missing required field: name");
  if (!config.menu || config.menu.length === 0) {
    warnings.push("No menu items defined");
  }

  // Database config validation
  if (config.database) {
    if (
      !config.database.tables ||
      Object.keys(config.database.tables).length === 0
    ) {
      warnings.push("Database config exists but no tables defined");
    }

    // Check for valid shared table references
    if (config.database.requiresSharedTables) {
      for (const tableName of config.database.requiresSharedTables) {
        if (!(tableName in SHARED_TABLES)) {
          errors.push(`Invalid shared table reference: ${tableName}`);
        }
      }
    }
  }

  // Menu validation
  if (config.menu) {
    for (const item of config.menu) {
      if (!item.id) errors.push("Menu item missing id");
      if (!item.label) errors.push("Menu item missing label");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Clear config cache (useful for development/testing)
 */
export function clearConfigCache(): void {
  configCache.clear();
}

/**
 * Get all cached config IDs
 */
export function getCachedConfigIds(): string[] {
  return Array.from(configCache.keys());
}
