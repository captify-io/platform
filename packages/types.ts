// Central types registry for all Captify packages
// This file exports all type definitions from all packages for convenient access

// API package types - Infrastructure and AWS interface types
export * from "./api/src/types";

// Client package types - All exports except conflicting ones
export type {
  CaptifyConfig,
  User,
  UserRole,
  UserState,
  SessionInfo,
  App,
  AppCategory,
  Application,
  ApplicationMenuItem,
} from "./client/src/types";

// Re-export conflicting types with prefixes to avoid ambiguity
export type {
  Organization as ClientOrganization,
  UserSession as ClientUserSession,
} from "./client/src/types";

// Type organization rules:
// 1. Each package has a dedicated types/ folder with concern-separated files
// 2. All properties use camelCase naming convention
// 3. Types are organized by domain and functionality
// 4. No cross-domain type dependencies between packages
// 5. Only infrastructure types in @captify/api
// 6. Domain-specific types in respective domain packages
