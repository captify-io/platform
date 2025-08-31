/**
 * Package Configuration Types
 * Extends existing App interface for package-specific needs
 */

import { App } from "../types";

// Menu item configuration for packages
export interface PackageMenuItem {
  id: string;
  label: string;
  icon?: string;
  route: string; // The hash route: "home", "users", etc.
  children?: PackageMenuItem[];
  permissions?: string[];
}

// Agent configuration per package
export interface PackageAgentConfig {
  agentId: string;
  agentAliasId: string;
  capabilities: string[];
  systemPrompt?: string;
}

// Package-specific configuration that extends App
export interface PackageConfig extends App {
  // Menu configuration stored in DynamoDB
  menuItems: PackageMenuItem[];

  // Default route when package loads
  defaultRoute: string;

  // Agent configuration for this package
  agentConfig: PackageAgentConfig;

  // Layout preferences
  layout?: {
    menuCollapsed?: boolean;
    menuWidth?: number;
    agentPanelOpen?: boolean;
  };
}

// Package state management
export interface PackageState {
  currentPackage: string;
  currentRoute: string; // Current hash route within package
  agentPanelOpen: boolean;
  agentWidth: number;
}

// Context for package-level state
export interface PackageContextType {
  // Current package info
  packageConfig: PackageConfig | null;
  packageLoading: boolean;

  // Navigation state
  packageState: PackageState;
  setCurrentRoute: (route: string) => void;

  // Panel controls
  toggleAgentPanel: () => void;
  setAgentWidth: (width: number) => void;

  // Agent state
  chatHistory: any[]; // Use existing chat types
  sendMessage: (message: string) => Promise<void>;
}
