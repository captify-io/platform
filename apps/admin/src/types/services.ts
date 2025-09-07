/**
 * Services, integrations, and monitoring types
 */

import { Core } from "@captify/core/types";

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
