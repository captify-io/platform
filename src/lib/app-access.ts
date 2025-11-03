/**
 * App Access Control - SERVER ONLY
 *
 * Validates user access to applications based on:
 * 1. App visibility (public = everyone, internal/private = require membership)
 * 2. User membership in core-app-member table
 * 3. App configuration settings
 *
 * @note This module imports app-registry which uses 'fs', server-side only
 */

import 'server-only';
import type { Session } from 'next-auth';
import type { AppRegistryEntry } from '../types/app-config';
import { getAppBySlug } from './app-registry';
import { dynamodb } from '@captify-io/core/services';
import { getAwsCredentialsFromIdentityPool } from '../app/api/lib/credentials';

export interface AppAccessResult {
  hasAccess: boolean;
  reason?: string;
  requiresApproval?: boolean;
  appConfig?: AppRegistryEntry;
}

/**
 * System routes that don't require app membership check
 */
export const SYSTEM_ROUTES = [
  'api',
  'auth',
  'admin',
  'profile',
  '_next',
  'favicon.ico',
  'robots.txt',
  'sitemap.xml',
] as const;

/**
 * Check if a route is a system route that should skip app access validation
 */
export function isSystemRoute(pathname: string): boolean {
  const segments = pathname.split('/').filter(Boolean);
  const firstSegment = segments[0];

  if (!firstSegment) {
    return true; // Root path
  }

  return SYSTEM_ROUTES.includes(firstSegment as any);
}

/**
 * Extract app slug from pathname
 * Examples:
 * - /agent -> "agent"
 * - /agent/builder/123 -> "agent"
 * - /core/home -> "core"
 */
export function extractAppSlug(pathname: string): string | null {
  const segments = pathname.split('/').filter(Boolean);
  return segments[0] || null;
}

/**
 * Check if user has access to a specific app
 *
 * Access flow:
 * 1. Get app config from registry
 * 2. If app is public (visibility = 'public'), grant access
 * 3. If app is internal/private, check core-app-member table
 * 4. Return access result with reason
 */
export async function checkAppAccess(
  slug: string,
  session: Session | null
): Promise<AppAccessResult> {
  // Get app config
  const appConfig = getAppBySlug(slug);

  // App not found in registry
  if (!appConfig) {
    return {
      hasAccess: false,
      reason: 'app_not_found',
    };
  }

  // App config is invalid
  if (!appConfig.isValid) {
    return {
      hasAccess: false,
      reason: 'invalid_config',
      appConfig,
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

  // For internal/private apps, check membership in DynamoDB
  try {
    const userId = session.user.id || session.user.email;

    // Temporary: Allow access for development
    // Remove this when tables are created and populated
    const isDevelopment = process.env.NODE_ENV === 'development';

    if (isDevelopment) {
      console.log(`[App Access] Dev mode: Granting access to ${slug} for user ${userId}`);
      return {
        hasAccess: true,
        appConfig,
      };
    }

    // In production, check actual membership
    const hasMembership = await checkAppMembership(userId, slug, session);

    if (hasMembership) {
      return {
        hasAccess: true,
        appConfig,
      };
    }

    // No membership found
    return {
      hasAccess: false,
      reason: 'no_membership',
      requiresApproval: appConfig.access?.requiresApproval !== false,
      appConfig,
    };
  } catch (error) {
    console.error(`[App Access] Error checking access for ${slug}:`, error);
    return {
      hasAccess: false,
      reason: 'error',
      appConfig,
    };
  }
}

/**
 * Check if user is a member of an app
 * Queries core-app-member table in DynamoDB
 */
async function checkAppMembership(userId: string, appSlug: string, session: Session): Promise<boolean> {
  try {
    // Get AWS credentials from Cognito Identity Pool
    const identityPoolId = process.env.COGNITO_IDENTITY_POOL_ID;
    if (!identityPoolId) {
      console.error('[App Access] Missing COGNITO_IDENTITY_POOL_ID');
      return false;
    }

    const credentials = await getAwsCredentialsFromIdentityPool(session, identityPoolId);

    // Query DynamoDB directly (server-side)
    const result = await dynamodb.execute(
      {
        service: 'platform.dynamodb',
        operation: 'query',
        table: 'core-app-member',
        data: {
          IndexName: 'userId-appSlug-index',
          KeyConditionExpression: 'userId = :userId AND appSlug = :appSlug',
          ExpressionAttributeValues: {
            ':userId': userId,
            ':appSlug': appSlug,
          },
        },
      },
      credentials
    );

    // Check if any active memberships exist
    const memberships = (result.data as any)?.Items || [];
    const activeMembership = memberships.find((m: any) => m.status === 'active');

    return !!activeMembership;
  } catch (error) {
    console.error('[App Access] Error checking membership:', error);
    // On error, deny access (fail closed)
    return false;
  }
}

/**
 * Get user's role for a specific app
 * Returns the user's role or null if not a member
 */
export async function getUserAppRole(
  userId: string,
  appSlug: string,
  session: Session
): Promise<string | null> {
  try {
    // Get AWS credentials from Cognito Identity Pool
    const identityPoolId = process.env.COGNITO_IDENTITY_POOL_ID;
    if (!identityPoolId) {
      console.error('[App Access] Missing COGNITO_IDENTITY_POOL_ID');
      return null;
    }

    const credentials = await getAwsCredentialsFromIdentityPool(session, identityPoolId);

    // Query DynamoDB directly (server-side)
    const result = await dynamodb.execute(
      {
        service: 'platform.dynamodb',
        operation: 'query',
        table: 'core-app-member',
        data: {
          IndexName: 'userId-appSlug-index',
          KeyConditionExpression: 'userId = :userId AND appSlug = :appSlug',
          ExpressionAttributeValues: {
            ':userId': userId,
            ':appSlug': appSlug,
          },
        },
      },
      credentials
    );

    const memberships = (result.data as any)?.Items || [];
    const activeMembership = memberships.find((m: any) => m.status === 'active');

    return activeMembership?.role || null;
  } catch (error) {
    console.error('[App Access] Error getting user role:', error);
    return null;
  }
}
