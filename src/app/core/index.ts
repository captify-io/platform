/**
 * Core Deploy Package
 * Complete CRUD operations and management interfaces for all core tables
 * Built on top of the CaptifyClient API
 */

// Export all services
export * from "./services";

// Export all page components
export { default as CoreDashboard } from "./page";
export { default as OrganizationsPage } from "./organizations/page";
export { default as UsersPage } from "./users/page";
export { default as RolesPage } from "./roles/page";

// Export service types
export type { CoreServices } from "./services";
