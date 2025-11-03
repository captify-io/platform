/**
 * App Utilities - SHARED (client + server)
 *
 * Pure utility functions that don't require server-only imports
 */

// System routes that don't require app access validation
export const SYSTEM_ROUTES = [
  '/api',
  '/auth',
  '/admin',
  '/profile',
  '/_next',
  '/favicon',
  '/robots',
  '/sitemap',
];

/**
 * Check if a pathname is a system route
 */
export function isSystemRoute(pathname: string): boolean {
  return SYSTEM_ROUTES.some(route => pathname.startsWith(route));
}

/**
 * Extract app slug from pathname
 * Examples:
 *   /pmbook/contracts -> pmbook
 *   /core/agents -> core
 *   /ontology/viewer -> ontology
 */
export function extractAppSlug(pathname: string): string | null {
  const parts = pathname.split('/').filter(Boolean);
  return parts.length > 0 ? parts[0] : null;
}
