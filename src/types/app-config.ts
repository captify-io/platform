/**
 * App Configuration Types
 *
 * Defines the schema for config.json files that each app folder must contain.
 * Platform layout will discover and validate these configs to build the app registry.
 */

export interface MenuItem {
  label: string;
  href?: string;
  icon?: string;
  description?: string;
  children?: MenuItem[];
  roles?: string[]; // Required roles to see this menu item
  badge?: string; // Optional badge text
}

export interface AppManifest {
  // Display properties
  name: string;
  icon?: string;
  color?: string;

  // Organization
  category?: string;
  tags?: string[];

  // Access control
  visibility?: 'public' | 'internal' | 'private';

  // AWS Resources (optional)
  resources?: {
    agentId?: string;
    agentAliasId?: string;
    knowledgeBaseId?: string;
    s3Bucket?: string;
    identityPoolId?: string;
  };
}

export interface AppFeature {
  id: string;
  name: string;
  description?: string;
  enabled?: boolean;
  icon?: string;
  href?: string;
}

export interface AppConfig {
  // Required: Basic identification
  slug: string; // Must match folder name
  name: string;
  version: string;
  description: string;

  // Optional: Menu structure
  menu?: MenuItem[];

  // Optional: Manifest with extended properties
  manifest?: AppManifest;

  // Optional: Feature flags
  features?: AppFeature[];

  // Optional: User stories for planning/documentation
  userStories?: string[];

  // Optional: Custom metadata
  metadata?: Record<string, any>;

  // Optional: Access control settings
  access?: {
    requiresApproval?: boolean;
    defaultRole?: string;
    allowedRoles?: string[];
  };
}

/**
 * App Registry Entry
 *
 * Combines the static config.json with runtime information
 */
export interface AppRegistryEntry extends AppConfig {
  // Runtime properties
  folderPath: string; // Absolute path to app folder
  configPath: string; // Path to config.json

  // Validation
  isValid: boolean;
  validationErrors?: string[];

  // Discovery metadata
  discoveredAt: string; // ISO timestamp
  lastModified?: string; // ISO timestamp of config.json
}

/**
 * System apps that should be excluded from app registry
 */
export const SYSTEM_FOLDERS = [
  'api',
  'auth',
  '(auth)', // Next.js route groups
  'favicon.ico',
  'robots.txt',
  'sitemap.xml'
] as const;

/**
 * Validate an app config
 */
export function validateAppConfig(config: any, folderName: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Required fields
  if (!config.slug) {
    errors.push('Missing required field: slug');
  } else if (config.slug !== folderName) {
    errors.push(`Slug "${config.slug}" does not match folder name "${folderName}"`);
  }

  if (!config.name) {
    errors.push('Missing required field: name');
  }

  if (!config.version) {
    errors.push('Missing required field: version');
  } else if (!/^\d+\.\d+\.\d+/.test(config.version)) {
    errors.push(`Invalid version format: "${config.version}" (expected semver like 1.0.0)`);
  }

  if (!config.description) {
    errors.push('Missing required field: description');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Default app config template
 */
export function createDefaultAppConfig(slug: string): AppConfig {
  return {
    slug,
    name: slug.charAt(0).toUpperCase() + slug.slice(1),
    version: '1.0.0',
    description: `${slug} application`,
    menu: [],
    manifest: {
      name: slug.charAt(0).toUpperCase() + slug.slice(1),
      category: 'general',
      visibility: 'internal',
    },
    access: {
      requiresApproval: false,
      allowedRoles: ['user'],
    }
  };
}
