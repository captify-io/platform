// Central types registry for all Captify packages
// This file exports all type definitions from all packages for convenient access

// API package types - Infrastructure and AWS interface types
export * from "./api/src/types";

// Core package types - Shared utilities and configuration types
export * from "./core/src/types";

// Type organization rules:
// 1. Each package has a dedicated types/ folder with concern-separated files
// 2. All properties use camelCase naming convention
// 3. Types are organized by domain and functionality
// 4. No cross-domain type dependencies between packages
// 5. Only infrastructure types in @captify/api
// 6. Domain-specific types in respective domain packages
