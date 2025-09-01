/**
 * Core package type definitions
 *
 * These types represent application-specific data that wraps and extends AWS services.
 * We do not duplicate AWS-managed properties but add our own business logic on top.
 */

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

// ===== APPLICATION MANAGEMENT =====
// App interface for managing all applications in the platform

export interface App extends Core {
  version: string;
  status: "active" | "inactive" | "maintenance" | "deprecated";
  category: string; // e.g., "administration", "analytics", "compliance"
  visibility: "public" | "internal" | "private";
  icon: string; // Icon identifier for UI
  menu: Array<{
    id: string;
    label: string;
    href: string;
    icon: string;
    order: number;
    children?: Array<{
      id: string;
      label: string;
      href: string;
      icon: string;
      order: number;
    }>;
  }>;
  agentId?: string; // AWS Bedrock Agent ID if applicable
  agentAliasId?: string; // AWS Bedrock Agent Alias ID if applicable,
  identityPoolId: string;
}

// ===== ORGANIZATION & TENANT MANAGEMENT =====

export interface Organization extends Core {
  domain: string; // Primary domain for the organization
  status: "active" | "suspended" | "pending";
  tier: "starter" | "professional" | "enterprise";
  settings: {
    maxUsers: number;
    allowedFeatures: string[];
    customBranding?: {
      logoUrl?: string;
      primaryColor?: string;
      secondaryColor?: string;
    };
  };
  cognitoUserPoolId?: string; // Reference to AWS Cognito User Pool
  cognitoIdentityPoolId?: string; // Reference to AWS Cognito Identity Pool
}

// ===== USER MANAGEMENT =====

export interface User extends Core {
  userId: string; // AWS Cognito User ID (sub claim)
  orgId: string; // Reference to Organization
  email: string;
  username: string;
  profile: {
    firstName?: string;
    lastName?: string;
    title?: string;
    department?: string;
    phone?: string;
  };
  roles: string[]; // Array of role IDs
  groups: string[]; // Array of group IDs
  status: "active" | "inactive" | "pending" | "suspended";
  preferences: {
    theme: "light" | "dark" | "auto";
    notifications: {
      email: boolean;
      inApp: boolean;
      security: boolean;
    };
    dashboard: {
      layout: string;
      widgets: string[];
    };
  };
  lastLoginAt?: string;
}

export interface UserState extends Core {
  userId: string; // Reference to User.userId (AWS Cognito User ID)
  orgId: string; // Reference to Organization
  preferences: {
    theme: "light" | "dark" | "auto";
    language: string;
    timezone: string;
    notifications: {
      email: boolean;
      inApp: boolean;
      security: boolean;
      marketing: boolean;
    };
    dashboard: {
      layout: "grid" | "list" | "compact";
      widgets: string[];
      defaultView: string;
    };
    accessibility: {
      highContrast: boolean;
      fontSize: "small" | "medium" | "large";
      reduceMotion: boolean;
    };
  };
  favorites: {
    applications: string[]; // Array of App IDs
    pages: string[]; // Array of page/route identifiers
    searches: string[]; // Array of saved search queries
    reports: string[]; // Array of report IDs
  };
  recentActivity: {
    applications: Array<{
      appId: string;
      lastAccessed: string;
      accessCount: number;
    }>;
    pages: Array<{
      pageId: string;
      lastAccessed: string;
      accessCount: number;
    }>;
  };
  customSettings: Record<string, any>; // Extensible for app-specific user settings
  lastSyncAt: string; // Last time preferences were synchronized
}

export interface Role extends Core {
  orgId: string;
  permissions: string[]; // Array of permission identifiers
  isSystem: boolean; // Whether this is a system-defined role
  status: "active" | "inactive";
}

export interface Group extends Core {
  orgId: string;
  type: "department" | "project" | "security" | "custom";
  parentGroupId?: string; // For hierarchical groups
  members: string[]; // Array of user IDs
  roles: string[]; // Array of role IDs assigned to this group
  status: "active" | "inactive";
}

export interface SOP extends Core {
  orgId: string;
  category: string;
  version: string;
  status: "draft" | "active" | "archived";
  content: {
    purpose: string;
    scope: string;
    procedures: SOPProcedure[];
    responsibilities: SOPResponsibility[];
  };
  relatedPolicies: string[]; // Array of policy IDs
  nextReviewDate: string;
  procedures: SOPProcedure[];
  responsibilities: SOPResponsibility[];
}

interface SOPProcedure {
  id: string;
  title: string;
  steps: string[];
  estimatedTime?: string;
  requiredTools?: string[];
}

interface SOPResponsibility {
  role: string;
  description: string;
  accountabilities: string[];
}

export interface POAM extends Core {
  orgId: string;
  weakness: string;
  risk: "low" | "medium" | "high" | "critical";
  status: "open" | "in_progress" | "closed" | "risk_accepted";
  plannedActions: POAMAction[];
  assignedTo: string; // User ID
  dueDate: string;
  estimatedCost?: number;
  actualCost?: number;
  relatedControls: string[]; // Array of control IDs
}

export interface POAMAction extends Core {
  description: string;
  status: "pending" | "in_progress" | "completed";
  assignedTo?: string; // User ID
  dueDate?: string;
  completedAt?: string;
  notes?: string;
}

export interface ChangeRequest extends Core {
  orgId: string;
  type: "security" | "infrastructure" | "application" | "process" | "emergency";
  priority: "low" | "medium" | "high" | "critical";
  status:
    | "submitted"
    | "under_review"
    | "approved"
    | "rejected"
    | "implemented"
    | "closed";
  requestedBy: string; // User ID
  impact: {
    systems: string[];
    users: string[];
    downtime?: string;
    riskLevel: "low" | "medium" | "high";
  };
  implementation: {
    plannedDate?: string;
    actualDate?: string;
    rollbackPlan?: string;
    testingPlan?: string;
  };
  approvals: ChangeApproval[];
  sponsorUserId: string; // user Id
  customerUserId: string; // userId
}

export interface ChangeApproval {
  approverUserId: string;
  status: "pending" | "approved" | "rejected";
  comments?: string;
  timestamp: string;
}

export interface RiskAssessment extends Core {
  orgId: string;
  scope: string;
  methodology: string; // e.g., "NIST RMF", "ISO 27005", "OCTAVE"
  status: "draft" | "in_progress" | "completed" | "approved";
  risks: RiskItem[];
  assessor: string; // User ID
  reviewers: string[]; // Array of user IDs
  completedAt?: string;
  nextAssessmentDate?: string;
}

export interface RiskItem {
  id: string;
  threat: string;
  vulnerability: string;
  impact: string;
  likelihood: "very_low" | "low" | "medium" | "high" | "very_high";
  impactRating: "very_low" | "low" | "medium" | "high" | "very_high";
  riskScore: number; // Calculated value
  riskLevel: "low" | "medium" | "high" | "critical";
  mitigationStrategy: string;
  residualRisk: "low" | "medium" | "high" | "critical";
  status: "identified" | "analyzing" | "mitigating" | "monitoring" | "closed";
}

export interface ComplianceMonitoring extends Core {
  orgId: string;
  framework: string; // e.g., "SOC2", "NIST", "ISO27001", "GDPR"
  status:
    | "compliant"
    | "non_compliant"
    | "partially_compliant"
    | "under_review";
  lastAssessmentDate: string;
  nextAssessmentDate: string;
  controls: ComplianceControl[];
  assessor?: string; // User ID
  certificationDetails?: {
    certificationBody: string;
    certificateNumber?: string;
    validFrom?: string;
    validTo?: string;
  };
}

export interface ComplianceControl {
  id: string;
  controlId: string; // Framework-specific control ID
  title: string;
  description: string;
  requirement: string;
  status: "compliant" | "non_compliant" | "not_applicable" | "compensating";
  implementationStatus:
    | "not_started"
    | "in_progress"
    | "implemented"
    | "validated";
  evidence: string[]; // Array of evidence document IDs
  gaps?: string[];
  remediationPlan?: string;
  lastReviewDate?: string;
  nextReviewDate?: string;
}

// ===== ACCESS MANAGEMENT =====

export interface AccessRequest extends Core {
  orgId: string;
  requestType: "new_access" | "modify_access" | "remove_access" | "role_change";
  targetUserId: string;
  requestedBy: string; // User ID
  requestedAccess: {
    roles?: string[];
    groups?: string[];
    resources?: AccessResource[];
  };
  justification: string;
  urgency: "low" | "medium" | "high" | "critical";
  status: "pending" | "approved" | "rejected" | "provisioned" | "cancelled";
  approvals: AccessApproval[];
  provisioningDetails?: {
    provisionedAt?: string;
    provisionedBy?: string; // User ID
    expirationDate?: string;
  };
}

export interface AccessResource {
  resourceType: "application" | "system" | "data" | "physical";
  resourceId: string;
  accessLevel: "read" | "write" | "admin" | "owner";
  conditions?: {
    timeRestrictions?: string;
    locationRestrictions?: string[];
    deviceRestrictions?: string[];
  };
}

export interface AccessApproval {
  approverUserId: string;
  approverRole: string;
  status: "pending" | "approved" | "rejected";
  conditions?: string;
  comments?: string;
  timestamp: string;
}

export interface AccessReview extends Core {
  orgId: string;
  type: "periodic" | "event_driven" | "certification" | "audit";
  scope: {
    userGroups?: string[];
    roles?: string[];
    resources?: string[];
  };
  frequency: "monthly" | "quarterly" | "semi_annual" | "annual" | "ad_hoc";
  status: "scheduled" | "in_progress" | "completed" | "overdue";
  reviewers: string[]; // Array of user IDs
  findings: AccessReviewFinding[];
  completionDate?: string;
  nextReviewDate?: string;
}

export interface AccessReviewFinding {
  userId: string;
  currentAccess: string[];
  recommendedAction: "no_change" | "modify" | "remove" | "review_further";
  justification: string;
  reviewerUserId: string;
  reviewDate: string;
  implemented: boolean;
}

// ===== SERVICES & INTEGRATIONS =====

export interface ServiceIntegration extends Core {
  orgId: string;
  serviceName: string;
  serviceType: "aws" | "third_party" | "internal";
  category:
    | "database"
    | "storage"
    | "compute"
    | "ai_ml"
    | "monitoring"
    | "security";
  status: "active" | "inactive" | "maintenance" | "error";
  configuration: {
    endpoint?: string;
    region?: string; // For AWS services
    version?: string;
    customSettings: Record<string, any>;
  };
  healthStatus: {
    isHealthy: boolean;
    lastCheck: string;
    metrics?: ServiceMetrics;
  };
  accessControls: {
    allowedRoles: string[];
    allowedGroups: string[];
    resourcePolicies?: string[];
  };
}

export interface ServiceMetrics {
  availability: number; // Percentage
  responseTime: number; // Milliseconds
  errorRate: number; // Percentage
  lastIncident?: string; // ISO date string
}

// ===== SETTINGS & CONFIGURATION =====

export interface OrganizationSettings extends Core {
  orgId: string;
  general: {
    timezone: string;
    dateFormat: string;
    language: string;
    fiscalYearStart: string; // Month
  };
  security: {
    mfaRequired: boolean;
    sessionTimeout: number; // Minutes
    allowedIpRanges?: string[];
    ssoEnabled: boolean;
    ssoProvider?: string;
  };
  compliance: {
    frameworks: string[]; // Active compliance frameworks
    dataRetentionPeriod: number; // Days
    auditLogRetention: number; // Days
    encryptionRequired: boolean;
  };
  notifications: {
    emailSettings: EmailSettings;
    webhookUrls?: string[];
    alertThresholds: AlertThresholds;
  };
  integrations: {
    awsAccountId?: string;
    enabledServices: string[];
    customIntegrations: Record<string, any>;
  };
}

export interface EmailSettings {
  fromAddress: string;
  smtpHost?: string;
  smtpPort?: number;
  useAuth: boolean;
  templates: Record<string, string>;
}

export interface AlertThresholds {
  failedLogins: number;
  suspiciousActivity: number;
  systemErrors: number;
  complianceViolations: number;
}

// ===== MONITORING & AUDIT =====

export interface Notification extends Core {
  toList: string[]; // List of user IDs to notify
  orgId: string;
  description: string;
  severity: "info" | "warning" | "error" | "critical";
  category: "security" | "performance" | "compliance" | "system" | "user";
  status: "active" | "acknowledged" | "resolved" | "suppressed";
  source: {
    service: string;
    component?: string;
    region?: string;
  };
  metrics?: Record<string, number>;
  acknowledgedBy?: string; // User ID
  acknowledgedAt?: string;
  resolvedBy?: string; // User ID
  resolvedAt?: string;
}

export interface PerformanceMetric {
  id: string; // UUID - Primary key
  orgId: string;
  metricName: string;
  category: "system" | "application" | "security" | "user";
  value: number;
  unit: string;
  timestamp: string;
  dimensions: Record<string, string>; // Additional context/tags
  source: string; // Source system/service
}

// ===== SHARED TYPES =====

export interface CoreResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    timestamp: string;
    requestId: string;
    pagination?: {
      page: number;
      limit: number;
      total: number;
    };
  };
}

// AWS Credentials interface for S3 operations (temporary credentials)
export interface AwsCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken: string;
  expiration?: string;
}

// API User Session interface for authentication
export interface ApiUserSession {
  user: {
    id: string; // Our internal user ID
    userId: string; // Cognito user ID (sub)
    email: string;
    name?: string;
    orgId: string;
    roles: string[];
  };
  accessToken: string;
  idToken: string;
  refreshToken?: string;
  expiresAt: number;
}

// ===== PACKAGE CONFIGURATION TYPES =====
// Package-specific configuration and state management

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
