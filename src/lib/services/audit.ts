/**
 * Audit Service
 *
 * Activity logging across all applications for security, compliance,
 * and debugging purposes. Tracks user actions, API calls, and system events.
 */

import { DatabaseService } from "./database";
import { getSharedTable } from "@/lib/config/database";

export interface AuditLog {
  id: string;
  user_id?: string;
  app_id?: string;
  session_id?: string;
  event_type: string;
  event_category:
    | "user_action"
    | "api_call"
    | "system_event"
    | "security_event";
  resource_type?: string;
  resource_id?: string;
  action: string;
  status: "success" | "failure" | "pending";
  ip_address?: string;
  user_agent?: string;
  timestamp: string;
  details?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface CreateAuditLogInput {
  user_id?: string;
  app_id?: string;
  session_id?: string;
  event_type: string;
  event_category:
    | "user_action"
    | "api_call"
    | "system_event"
    | "security_event";
  resource_type?: string;
  resource_id?: string;
  action: string;
  status: "success" | "failure" | "pending";
  ip_address?: string;
  user_agent?: string;
  details?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface AuditLogFilters {
  user_id?: string;
  app_id?: string;
  event_category?: string;
  event_type?: string;
  action?: string;
  status?: string;
  resource_type?: string;
  resource_id?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}

export class AuditService extends DatabaseService {
  constructor() {
    super(getSharedTable("audit_logs"));
  }

  /**
   * Create a new audit log entry
   */
  async createAuditLog(input: CreateAuditLogInput): Promise<AuditLog> {
    const id = this.generateId();
    const timestamp = new Date().toISOString();

    const auditLog: AuditLog = {
      id,
      user_id: input.user_id,
      app_id: input.app_id,
      session_id: input.session_id,
      event_type: input.event_type,
      event_category: input.event_category,
      resource_type: input.resource_type,
      resource_id: input.resource_id,
      action: input.action,
      status: input.status,
      ip_address: input.ip_address,
      user_agent: input.user_agent,
      timestamp,
      details: input.details,
      metadata: input.metadata,
    };

    await this.putItem({ ...auditLog });
    return auditLog;
  }

  /**
   * Get audit logs with filters
   */
  async getAuditLogs(filters: AuditLogFilters = {}): Promise<AuditLog[]> {
    const {
      user_id,
      app_id,
      event_category,
      event_type,
      action,
      status,
      resource_type,
      resource_id,
      startDate,
      endDate,
      limit = 100,
    } = filters;

    // Build filter expression
    const filterExpressions: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, unknown> = {};

    if (user_id) {
      filterExpressions.push("user_id = :userId");
      expressionAttributeValues[":userId"] = user_id;
    }

    if (app_id) {
      filterExpressions.push("app_id = :appId");
      expressionAttributeValues[":appId"] = app_id;
    }

    if (event_category) {
      filterExpressions.push("event_category = :eventCategory");
      expressionAttributeValues[":eventCategory"] = event_category;
    }

    if (event_type) {
      filterExpressions.push("event_type = :eventType");
      expressionAttributeValues[":eventType"] = event_type;
    }

    if (action) {
      filterExpressions.push("#action = :actionValue");
      expressionAttributeNames["#action"] = "action";
      expressionAttributeValues[":actionValue"] = action;
    }

    if (status) {
      filterExpressions.push("#status = :statusValue");
      expressionAttributeNames["#status"] = "status";
      expressionAttributeValues[":statusValue"] = status;
    }

    if (resource_type) {
      filterExpressions.push("resource_type = :resourceType");
      expressionAttributeValues[":resourceType"] = resource_type;
    }

    if (resource_id) {
      filterExpressions.push("resource_id = :resourceId");
      expressionAttributeValues[":resourceId"] = resource_id;
    }

    if (startDate) {
      filterExpressions.push("#timestamp >= :startDate");
      expressionAttributeNames["#timestamp"] = "timestamp";
      expressionAttributeValues[":startDate"] = startDate;
    }

    if (endDate) {
      filterExpressions.push("#timestamp <= :endDate");
      expressionAttributeNames["#timestamp"] = "timestamp";
      expressionAttributeValues[":endDate"] = endDate;
    }

    return this.scanItems<AuditLog>({
      filterExpression:
        filterExpressions.length > 0
          ? filterExpressions.join(" AND ")
          : undefined,
      expressionAttributeNames:
        Object.keys(expressionAttributeNames).length > 0
          ? expressionAttributeNames
          : undefined,
      expressionAttributeValues:
        Object.keys(expressionAttributeValues).length > 0
          ? expressionAttributeValues
          : undefined,
      limit,
    });
  }

  /**
   * Get audit logs for a specific user
   */
  async getUserAuditLogs(
    userId: string,
    filters: Omit<AuditLogFilters, "user_id"> = {}
  ): Promise<AuditLog[]> {
    return this.getAuditLogs({ ...filters, user_id: userId });
  }

  /**
   * Get audit logs for a specific application
   */
  async getAppAuditLogs(
    appId: string,
    filters: Omit<AuditLogFilters, "app_id"> = {}
  ): Promise<AuditLog[]> {
    return this.getAuditLogs({ ...filters, app_id: appId });
  }

  /**
   * Get security events
   */
  async getSecurityEvents(filters: AuditLogFilters = {}): Promise<AuditLog[]> {
    return this.getAuditLogs({
      ...filters,
      event_category: "security_event",
    });
  }

  /**
   * Get failed actions for security monitoring
   */
  async getFailedActions(filters: AuditLogFilters = {}): Promise<AuditLog[]> {
    return this.getAuditLogs({
      ...filters,
      status: "failure",
    });
  }

  /**
   * Generate a unique audit log ID
   */
  private generateId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }
}

// Export service instance
export const auditService = new AuditService();

// Helper functions for common audit scenarios
export const AuditHelpers = {
  /**
   * Log a user action
   */
  async logUserAction(
    userId: string,
    appId: string,
    action: string,
    resourceType?: string,
    resourceId?: string,
    details?: Record<string, unknown>,
    sessionId?: string,
    status: "success" | "failure" = "success"
  ) {
    return auditService.createAuditLog({
      user_id: userId,
      app_id: appId,
      session_id: sessionId,
      event_type: "user_interaction",
      event_category: "user_action",
      resource_type: resourceType,
      resource_id: resourceId,
      action,
      status,
      details,
      metadata: {
        category: "user_action",
        source: "application",
      },
    });
  },

  /**
   * Log an API call
   */
  async logApiCall(
    method: string,
    endpoint: string,
    userId?: string,
    appId?: string,
    status: "success" | "failure" = "success",
    statusCode?: number,
    responseTime?: number,
    ipAddress?: string,
    userAgent?: string,
    sessionId?: string
  ) {
    return auditService.createAuditLog({
      user_id: userId,
      app_id: appId,
      session_id: sessionId,
      event_type: "api_request",
      event_category: "api_call",
      action: `${method} ${endpoint}`,
      status,
      ip_address: ipAddress,
      user_agent: userAgent,
      details: {
        method,
        endpoint,
        status_code: statusCode,
        response_time_ms: responseTime,
      },
      metadata: {
        category: "api_call",
        source: "api_gateway",
      },
    });
  },

  /**
   * Log a security event
   */
  async logSecurityEvent(
    eventType: string,
    action: string,
    userId?: string,
    appId?: string,
    ipAddress?: string,
    userAgent?: string,
    details?: Record<string, unknown>,
    status: "success" | "failure" = "failure"
  ) {
    return auditService.createAuditLog({
      user_id: userId,
      app_id: appId,
      event_type: eventType,
      event_category: "security_event",
      action,
      status,
      ip_address: ipAddress,
      user_agent: userAgent,
      details,
      metadata: {
        category: "security",
        source: "security_monitor",
        severity: status === "failure" ? "high" : "medium",
      },
    });
  },

  /**
   * Log a system event
   */
  async logSystemEvent(
    eventType: string,
    action: string,
    appId?: string,
    details?: Record<string, unknown>,
    status: "success" | "failure" = "success"
  ) {
    return auditService.createAuditLog({
      app_id: appId,
      event_type: eventType,
      event_category: "system_event",
      action,
      status,
      details,
      metadata: {
        category: "system",
        source: "system_monitor",
      },
    });
  },

  /**
   * Log authentication events
   */
  async logAuthEvent(
    action:
      | "login"
      | "logout"
      | "login_failed"
      | "password_change"
      | "session_expired",
    userId?: string,
    ipAddress?: string,
    userAgent?: string,
    details?: Record<string, unknown>
  ) {
    const status = action.includes("failed") ? "failure" : "success";

    return auditService.createAuditLog({
      user_id: userId,
      event_type: "authentication",
      event_category: "security_event",
      action,
      status,
      ip_address: ipAddress,
      user_agent: userAgent,
      details,
      metadata: {
        category: "authentication",
        source: "auth_service",
        severity: status === "failure" ? "medium" : "low",
      },
    });
  },
};
