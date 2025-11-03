/**
 * App Registry - SERVER ONLY
 *
 * Discovers and manages applications in platform/src/app/*
 * Each app folder should contain a config.json file with app metadata
 *
 * @note This module uses Node.js 'fs' and can only be imported in server-side code
 */

import 'server-only';
import fs from 'fs';
import path from 'path';
import type { AppConfig, AppRegistryEntry } from '../types/app-config';
import { SYSTEM_FOLDERS, validateAppConfig } from '../types/app-config';

// Cache for app registry (shorter in development for faster iteration)
let cachedRegistry: AppRegistryEntry[] | null = null;
let lastCacheTime = 0;
const CACHE_TTL = process.env.NODE_ENV === 'development' ? 10 * 1000 : 5 * 60 * 1000; // 10 seconds (dev) or 5 minutes (prod)

/**
 * Get the absolute path to the app directory
 */
function getAppDirectory(): string {
  // In development/build: /opt/captify-apps/platform/src/app
  // In production: /opt/captify-apps/platform/.next/server/app
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    return path.join(process.cwd(), 'src', 'app');
  }

  // In production, we need to scan the source directory, not the build
  return path.join(process.cwd(), 'src', 'app');
}

/**
 * Check if a folder is a system folder that should be excluded
 */
function isSystemFolder(folderName: string): boolean {
  // Exclude system folders
  if (SYSTEM_FOLDERS.includes(folderName as any)) {
    return true;
  }

  // Exclude folders starting with underscore or dot
  if (folderName.startsWith('_') || folderName.startsWith('.')) {
    return true;
  }

  // Exclude Next.js route groups
  if (folderName.startsWith('(') && folderName.endsWith(')')) {
    return true;
  }

  return false;
}

/**
 * Load config.json from an app folder
 */
function loadAppConfig(appPath: string, folderName: string): AppRegistryEntry | null {
  const configPath = path.join(appPath, 'config.json');

  try {
    // Check if config.json exists
    if (!fs.existsSync(configPath)) {
      console.warn(`[App Registry] No config.json found for app: ${folderName}`);
      return null;
    }

    // Read and parse config
    const configContent = fs.readFileSync(configPath, 'utf-8');
    const config: AppConfig = JSON.parse(configContent);

    // Validate config
    const validation = validateAppConfig(config, folderName);

    // Get file stats for last modified time
    const stats = fs.statSync(configPath);

    // Create registry entry
    const entry: AppRegistryEntry = {
      ...config,
      folderPath: appPath,
      configPath,
      isValid: validation.isValid,
      validationErrors: validation.errors,
      discoveredAt: new Date().toISOString(),
      lastModified: stats.mtime.toISOString(),
    };

    if (!validation.isValid) {
      console.error(`[App Registry] Invalid config for ${folderName}:`, validation.errors);
    }

    return entry;
  } catch (error) {
    console.error(`[App Registry] Error loading config for ${folderName}:`, error);
    return null;
  }
}

/**
 * Discover all apps in the platform/src/app directory
 */
export function discoverApps(): AppRegistryEntry[] {
  const appDir = getAppDirectory();
  const apps: AppRegistryEntry[] = [];

  try {
    // Check if directory exists
    if (!fs.existsSync(appDir)) {
      console.warn(`[App Registry] App directory not found: ${appDir}`);
      return [];
    }

    // Read all folders in app directory
    const entries = fs.readdirSync(appDir, { withFileTypes: true });

    for (const entry of entries) {
      // Skip non-directories
      if (!entry.isDirectory()) {
        continue;
      }

      const folderName = entry.name;

      // Skip system folders
      if (isSystemFolder(folderName)) {
        continue;
      }

      // Try to load app config
      const appPath = path.join(appDir, folderName);
      const appConfig = loadAppConfig(appPath, folderName);

      if (appConfig) {
        apps.push(appConfig);
      }
    }

    console.log(`[App Registry] Discovered ${apps.length} apps`);
    return apps;
  } catch (error) {
    console.error('[App Registry] Error discovering apps:', error);
    return [];
  }
}

/**
 * Get all registered apps (with caching)
 */
export function getAppRegistry(forceRefresh = false): AppRegistryEntry[] {
  const now = Date.now();

  // Return cached registry if available and not expired
  if (!forceRefresh && cachedRegistry && (now - lastCacheTime) < CACHE_TTL) {
    return cachedRegistry;
  }

  // Discover apps
  cachedRegistry = discoverApps();
  lastCacheTime = now;

  return cachedRegistry;
}

/**
 * Get a specific app by slug
 */
export function getAppBySlug(slug: string): AppRegistryEntry | null {
  const registry = getAppRegistry();
  return registry.find(app => app.slug === slug) || null;
}

/**
 * Get all valid apps (exclude invalid configs)
 */
export function getValidApps(): AppRegistryEntry[] {
  const registry = getAppRegistry();
  return registry.filter(app => app.isValid);
}

/**
 * Get apps by category
 */
export function getAppsByCategory(category: string): AppRegistryEntry[] {
  const registry = getAppRegistry();
  return registry.filter(app =>
    app.isValid && app.manifest?.category === category
  );
}

/**
 * Get apps by visibility
 */
export function getAppsByVisibility(visibility: 'public' | 'internal' | 'private'): AppRegistryEntry[] {
  const registry = getAppRegistry();
  return registry.filter(app =>
    app.isValid && (app.manifest?.visibility === visibility || (!app.manifest?.visibility && visibility === 'internal'))
  );
}

/**
 * Refresh the app registry cache
 */
export function refreshAppRegistry(): AppRegistryEntry[] {
  return getAppRegistry(true);
}
