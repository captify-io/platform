/**
 * App Access Control - Direct File Read (No Cache)
 *
 * Simple approach: Read config.json directly from disk.
 * If visibility = 'public', grant access. No caching, no complexity.
 */

import 'server-only';
import fs from 'fs';
import path from 'path';
import type { Session } from 'next-auth';
import type { AppConfig } from '../types/app-config';

export interface AppAccessResult {
  hasAccess: boolean;
  reason?: string;
  requiresApproval?: boolean;
  appConfig?: AppConfig;
}

/**
 * Read config.json directly from app folder
 */
function readAppConfig(slug: string): AppConfig | null {
  try {
    const configPath = path.join(process.cwd(), 'src', 'app', slug, 'config.json');

    if (!fs.existsSync(configPath)) {
      return null;
    }

    const configContent = fs.readFileSync(configPath, 'utf-8');
    const config: AppConfig = JSON.parse(configContent);

    return config;
  } catch (error) {
    console.error(`[App Access] Error reading config for ${slug}:`, error);
    return null;
  }
}

/**
 * Check if user has access to a specific app
 * Simple logic: Read config.json, check visibility, grant/deny access
 */
export async function checkAppAccess(
  slug: string,
  session: Session | null
): Promise<AppAccessResult> {
  // Read config directly from disk
  const appConfig = readAppConfig(slug);

  // App not found
  if (!appConfig) {
    return {
      hasAccess: false,
      reason: 'app_not_found',
    };
  }

  // No session (user not authenticated)
  if (!session?.user) {
    return {
      hasAccess: false,
      reason: 'not_authenticated',
      appConfig,
    };
  }

  // Check app visibility
  const visibility = appConfig.manifest?.visibility || 'internal';

  // Public apps - everyone has access
  if (visibility === 'public') {
    return {
      hasAccess: true,
      appConfig,
    };
  }

  // Internal/Private apps - require membership
  // For now, deny access until core-app-member table is implemented
  return {
    hasAccess: false,
    reason: 'no_membership',
    requiresApproval: appConfig.access?.requiresApproval !== false,
    appConfig,
  };
}
