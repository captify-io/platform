/**
 * Package configuration and state management types
 */

import { App } from "./app";

// ===== CHAT AND AGENT TYPES =====

// Chat message for agent interactions
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

// ===== MENU AND NAVIGATION TYPES =====

// Menu item structure for package navigation
export interface MenuItem {
  icon: string;
  id: string;
  label: string;
  href: string;
  order: number;
  children?: MenuItem[];
}

// Menu item configuration for packages (legacy - kept for compatibility)
export interface PackageMenuItem {
  id: string;
  label: string;
  icon?: string;
  route: string; // The hash route: "home", "users", etc.
  children?: PackageMenuItem[];
  permissions?: string[];
}

// ===== PACKAGE CONFIGURATION TYPES =====

// Agent configuration per package
export interface PackageAgentConfig {
  agentId: string;
  agentAliasId: string;
  capabilities: string[];
  systemPrompt?: string;
}

// Simplified package information for component props
export interface PackageInfo {
  name: string;
  slug: string;
  agentConfig?: PackageAgentConfig;
}

// App data structure returned from DynamoDB
export interface AppData {
  app: string;
  menu: MenuItem[];
  version: string;
  icon: string;
  status: string;
  visibility: string;
  slug: string;
  name: string;
  description: string;
  id: string;
  agentId?: string;
  agentAliasId?: string;
}

// ===== COMPONENT PROP INTERFACES =====

// Props for ThreePanelLayout component
export interface ThreePanelLayoutProps {
  children?: React.ReactNode;
  className?: string;
}

// Props for PackageAgentPanel component
export interface PackageAgentPanelProps {
  packageInfo?: PackageInfo;
}

// Props for PackagePageRouter component
export interface PackagePageRouterProps {
  currentHash?: string;
  packageSlug?: string;
  packageName?: string;
}

// Props for PackageContentPanel component
export interface PackageContentPanelProps {
  children?: React.ReactNode;
  currentHash?: string;
  packageSlug?: string;
  packageName?: string;
}

// ===== LEGACY PACKAGE CONFIGURATION TYPES =====
// Note: These are kept for backward compatibility but may be deprecated

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
