/**
 * Core base interfaces and shared types
 */

import type { UUID } from "crypto";

// ===== BASE CORE INTERFACE =====
// All entities in the system extend this base interface

export interface Core {
  id: string; // UUID - Primary key for all entities
  slug: string; // URL-friendly identifier (unique within app)
  name: string; // Human-readable name
  app: string; // Which app/package this entity belongs to (e.g., 'core', 'veripicks')
  fields: Record<string, any>; // Extensible JSON object for app-specific data
  description: string; // Human-readable description
  ownerId: string; // UUID of the user who owns this entity
  createdAt: string; // ISO timestamp
  createdBy: string; // UUID of user who created this
  updatedAt: string; // ISO timestamp
  updatedBy: string; // UUID of user who last updated this
}

// ===== TABLE METADATA TRACKING =====
// Track all tables created by the installer across all apps

export interface TableMetadata extends Core {
  typeName: string; // TypeScript interface name (e.g., 'User')
  keySchema: {
    hashKey: string; // Primary key attribute name
    rangeKey?: string; // Sort key attribute name (optional)
  };
  attributes: Array<{
    name: string;
    type: "S" | "N" | "B" | "SS" | "NS" | "BS" | "M" | "L" | "BOOL" | "NULL";
    required: boolean;
  }>;
  indexes?: Array<{
    name: string;
    type: "GSI" | "LSI";
    keySchema: {
      hashKey: string;
      rangeKey?: string;
    };
  }>;
  status: "active" | "deprecated" | "migrating";
}
