/**
 * Enhanced Application Type Definitions for TITAN Demo
 * Supports comprehensive application metadata, AI agent configuration, and UI customization
 */

export interface ApplicationMetadata {
  id: string;
  alias: string;
  name: string;
  description: string;
  longDescription?: string;
  version: string;
  category: ApplicationCategory;
  tags: string[];
  icon: string; // Lucide icon name
  color: string; // Tailwind color class
  status: "active" | "beta" | "coming-soon" | "maintenance";
  visibility: "public" | "private" | "beta-users";
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  organization: string;
}

export interface AIAgentConfig {
  agentId: string;
  bedrockAgentId?: string;
  bedrockAliasId?: string;
  bedrockRegion?: string;
  model:
    | "claude-3-sonnet"
    | "claude-3-haiku"
    | "claude-3-opus"
    | "gpt-4"
    | "custom";
  instructions: string;
  maxOutputTokens?: number;
  temperature?: number;
  capabilities: AgentCapability[];
  knowledgeBases?: string[];
  tools?: AgentTool[];
}

export interface AgentCapability {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

export interface AgentTool {
  id: string;
  name: string;
  description: string;
  type: "api" | "function" | "database" | "external";
  config: Record<string, unknown>;
}

export interface ApplicationUI {
  layout: "chat" | "dashboard" | "analytics" | "workflow" | "custom";
  theme: {
    primaryColor: string;
    accentColor: string;
    background: string;
  };
  navigation: NavigationItem[];
  widgets: Widget[];
  chatConfig?: ChatConfiguration;
  customCSS?: string;
}

export interface NavigationItem {
  id: string;
  label: string;
  icon: string;
  href?: string;
  action?: string;
  children?: NavigationItem[];
}

export interface Widget {
  id: string;
  type: "chart" | "table" | "metric" | "text" | "input" | "custom";
  title: string;
  position: { x: number; y: number; width: number; height: number };
  config: Record<string, unknown>;
  dataSource?: string;
}

export interface ChatConfiguration {
  enableFileUpload: boolean;
  maxFileSize: number;
  allowedFileTypes: string[];
  welcomeMessage: string;
  placeholderText: string;
  showTypingIndicator: boolean;
  maxMessages: number;
}

export interface ApplicationUsage {
  totalSessions: number;
  totalMessages: number;
  totalUsers: number;
  averageSessionDuration: number;
  lastAccessed: string;
  popularFeatures: string[];
  userRatings: {
    average: number;
    count: number;
  };
}

export interface ApplicationPermissions {
  requiredRoles: string[];
  requiredClearance?: string;
  departmentAccess?: string[];
  userGroups?: string[];
  customPermissions?: Record<string, boolean>;
}

export interface Application {
  metadata: ApplicationMetadata;
  aiAgent: AIAgentConfig;
  ui: ApplicationUI;
  usage: ApplicationUsage;
  permissions: ApplicationPermissions;
  demoData?: DemoData;
}

export interface DemoData {
  sampleQueries: string[];
  sampleResponses: string[];
  mockData: Record<string, unknown>;
  scenarios: DemoScenario[];
}

export interface DemoScenario {
  id: string;
  name: string;
  description: string;
  steps: DemoStep[];
}

export interface DemoStep {
  id: string;
  type: "message" | "action" | "data-load" | "ui-change";
  content: string;
  data?: Record<string, unknown>;
  delay?: number;
}

export type ApplicationCategory =
  | "strategy-planning"
  | "analytics-insights"
  | "research-intelligence"
  | "operations-process"
  | "customer-market"
  | "financial-analysis"
  | "risk-management"
  | "compliance-governance"
  | "innovation-rd"
  | "supply-chain"
  | "human-resources"
  | "cybersecurity"
  | "custom";

export const APPLICATION_CATEGORIES: Record<
  ApplicationCategory,
  {
    label: string;
    icon: string;
    color: string;
    description: string;
  }
> = {
  "strategy-planning": {
    label: "Strategy & Planning",
    icon: "Target",
    color: "bg-blue-500",
    description: "Strategic planning, roadmapping, and decision support",
  },
  "analytics-insights": {
    label: "Analytics & Insights",
    icon: "BarChart3",
    color: "bg-purple-500",
    description: "Data analysis, reporting, and business intelligence",
  },
  "research-intelligence": {
    label: "Research & Intelligence",
    icon: "Search",
    color: "bg-green-500",
    description: "Market research, competitive intelligence, and insights",
  },
  "operations-process": {
    label: "Operations & Process",
    icon: "Cog",
    color: "bg-orange-500",
    description: "Process optimization and operational efficiency",
  },
  "customer-market": {
    label: "Customer & Market",
    icon: "Users",
    color: "bg-pink-500",
    description: "Customer analysis and market understanding",
  },
  "financial-analysis": {
    label: "Financial Analysis",
    icon: "DollarSign",
    color: "bg-emerald-500",
    description: "Financial planning, analysis, and forecasting",
  },
  "risk-management": {
    label: "Risk Management",
    icon: "Shield",
    color: "bg-red-500",
    description: "Risk assessment, mitigation, and compliance",
  },
  "compliance-governance": {
    label: "Compliance & Governance",
    icon: "FileCheck",
    color: "bg-indigo-500",
    description: "Regulatory compliance and governance oversight",
  },
  "innovation-rd": {
    label: "Innovation & R&D",
    icon: "Lightbulb",
    color: "bg-yellow-500",
    description: "Innovation management and research & development",
  },
  "supply-chain": {
    label: "Supply Chain",
    icon: "Truck",
    color: "bg-cyan-500",
    description: "Supply chain optimization and logistics",
  },
  "human-resources": {
    label: "Human Resources",
    icon: "UserCheck",
    color: "bg-violet-500",
    description: "HR analytics, talent management, and workforce planning",
  },
  cybersecurity: {
    label: "Cybersecurity",
    icon: "Lock",
    color: "bg-slate-500",
    description: "Security analysis, threat detection, and compliance",
  },
  custom: {
    label: "Custom",
    icon: "Puzzle",
    color: "bg-gray-500",
    description: "Custom applications and specialized use cases",
  },
};
