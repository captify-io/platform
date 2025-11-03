"use client";

import React, { useState, useEffect } from "react";
import { useCaptify } from "@captify-io/core";
import { redirect } from "next/navigation";
import type { Session } from "next-auth";
import {
  Bot,
  Shield,
  Activity,
  Gauge,
  Lock,
  Users,
  Calendar,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Save,
  Plus,
  Trash2,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@captify-io/core/ui";
import { Input } from "@captify-io/core/ui";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@captify-io/core/ui";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@captify-io/core/ui";
import { Label } from "@captify-io/core/ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@captify-io/core/ui";
import { Switch } from "@captify-io/core/ui";
import { Separator } from "@captify-io/core/ui";
import { Badge } from "@captify-io/core/ui";
import { apiClient } from "@captify-io/core";

// Type definitions for security features
interface RateLimit {
  id: string;
  resource: string;
  limit: number;
  window: number;
  scope: "user" | "tenant" | "global";
}

interface Permission {
  id: string;
  resource: string;
  action: "read" | "write" | "execute" | "delete" | "admin";
  effect: "allow" | "deny";
  conditions?: any[];
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  inherits?: string[];
}

interface UserRole {
  userId: string;
  roleId: string;
  assignedAt: number;
  assignedBy: string;
  expiresAt?: number;
}

interface AuditLog {
  id: string;
  timestamp: number;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  result: "success" | "failure" | "denied";
  metadata?: Record<string, any>;
}

interface AuditQueryFilters {
  userId?: string;
  action?: string;
  resource?: string;
  startTime?: number;
  endTime?: number;
  result?: "success" | "failure" | "denied";
  limit?: number;
}

interface UserActivitySummary {
  userId: string;
  totalActions: number;
  actionsByType: Record<string, number>;
  successRate: number;
  deniedActions: number;
  failedActions: number;
  timeRange: { start: number; end: number };
}

// Helper to get user's groups
function getUserGroups(session: Session | null): string[] {
  if (!session) return [];
  const userGroups = (session.user as any)?.groups;
  if (userGroups && userGroups.length > 0) return userGroups;
  const sessionGroups = (session as any).groups;
  if (sessionGroups && sessionGroups.length > 0) return sessionGroups;
  return [];
}

interface CognitoUser {
  Username: string;
  Attributes: Array<{ Name: string; Value: string }>;
  UserCreateDate: string;
  UserStatus: string;
  Enabled: boolean;
  Groups?: string[];
}

interface TokenAllocation {
  userId: string;
  userName: string;
  userEmail: string;
  monthlyTokens: number;
  currentUsage: number;
  autoRenew: boolean;
  renewalDay: number; // Day of month (1-31)
  lastRenewal: string;
  nextRenewal: string;
}

interface RateLimitConfig extends RateLimit {
  enabled: boolean;
}

export default function AgentAdminPage() {
  const { session } = useCaptify();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Cognito User Management State
  const [cognitoUsers, setCognitoUsers] = useState<CognitoUser[]>([]);
  const [cognitoGroups, setCognitoGroups] = useState<string[]>([]);
  const [selectedCognitoUser, setSelectedCognitoUser] = useState<CognitoUser | null>(null);

  // Token Management State
  const [tokenAllocations, setTokenAllocations] = useState<TokenAllocation[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [monthlyTokens, setMonthlyTokens] = useState<number>(1000000);
  const [autoRenew, setAutoRenew] = useState<boolean>(true);
  const [renewalDay, setRenewalDay] = useState<number>(1);

  // Role Management State
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);

  // Rate Limits State
  const [rateLimits, setRateLimits] = useState<RateLimitConfig[]>([]);

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditFilters, setAuditFilters] = useState<AuditQueryFilters>({
    limit: 50,
  });
  const [userActivity, setUserActivity] = useState<UserActivitySummary | null>(null);

  // Check if user has admin access
  const userGroups = getUserGroups(session);
  const hasAdminAccess = userGroups.includes("captify-admin");

  useEffect(() => {
    if (hasAdminAccess) {
      loadInitialData();
    }
  }, [hasAdminAccess]);

  if (!session?.user) {
    redirect("/auth/signin");
  }

  if (!hasAdminAccess) {
    return (
      <div className="h-screen w-full bg-background flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-16 w-16 mx-auto mb-4 text-destructive" />
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground">
            You do not have permission to access agent administration.
          </p>
        </div>
      </div>
    );
  }

  const loadInitialData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadCognitoUsers(),
        loadCognitoGroups(),
        loadTokenAllocations(),
        loadRoles(),
        loadRateLimits(),
      ]);
    } catch (err: any) {
      setError(err.message || "Failed to load initial data");
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // COGNITO USER MANAGEMENT FUNCTIONS
  // ============================================================================

  const loadCognitoUsers = async () => {
    try {
      const response = await apiClient.run({
        service: "platform.cognito",
        operation: "listUsers",
        data: {
          Limit: 60,
        },
      });

      if (response.success && response.data?.Users) {
        const users = response.data.Users as CognitoUser[];

        // Load groups for each user
        const usersWithGroups = await Promise.all(
          users.map(async (user) => {
            try {
              const groupsResponse = await apiClient.run({
                service: "platform.cognito",
                operation: "adminListGroupsForUser",
                data: {
                  Username: user.Username,
                },
              });

              return {
                ...user,
                Groups: groupsResponse.success && groupsResponse.data?.Groups
                  ? groupsResponse.data.Groups.map((g: any) => g.GroupName)
                  : [],
              };
            } catch {
              return { ...user, Groups: [] };
            }
          })
        );

        setCognitoUsers(usersWithGroups);
      }
    } catch (err: any) {
      console.error("Failed to load Cognito users:", err);
    }
  };

  const loadCognitoGroups = async () => {
    try {
      const response = await apiClient.run({
        service: "platform.cognito",
        operation: "listGroups",
        data: {
          Limit: 60,
        },
      });

      if (response.success && response.data?.Groups) {
        const groups = response.data.Groups.map((g: any) => g.GroupName);
        setCognitoGroups(groups);
      }
    } catch (err: any) {
      console.error("Failed to load Cognito groups:", err);
    }
  };

  const addUserToGroup = async (username: string, groupName: string) => {
    setLoading(true);
    try {
      await apiClient.run({
        service: "platform.cognito",
        operation: "adminAddUserToGroup",
        data: {
          Username: username,
          GroupName: groupName,
        },
      });

      setSuccess(`User ${username} added to group ${groupName}`);
      await loadCognitoUsers();
    } catch (err: any) {
      setError(err.message || "Failed to add user to group");
    } finally {
      setLoading(false);
    }
  };

  const removeUserFromGroup = async (username: string, groupName: string) => {
    setLoading(true);
    try {
      await apiClient.run({
        service: "platform.cognito",
        operation: "adminRemoveUserFromGroup",
        data: {
          Username: username,
          GroupName: groupName,
        },
      });

      setSuccess(`User ${username} removed from group ${groupName}`);
      await loadCognitoUsers();
    } catch (err: any) {
      setError(err.message || "Failed to remove user from group");
    } finally {
      setLoading(false);
    }
  };

  const getUserAttribute = (user: CognitoUser, attributeName: string): string => {
    const attr = user.Attributes.find((a) => a.Name === attributeName);
    return attr?.Value || "";
  };

  // ============================================================================
  // TOKEN MANAGEMENT FUNCTIONS
  // ============================================================================

  const loadTokenAllocations = async () => {
    try {
      // Query all user rate limits for token resource
      const response = await apiClient.run({
        service: "platform.dynamodb",
        operation: "scan",
        table: "core-ratelimit",
        data: {
          FilterExpression: "begins_with(#key, :prefix)",
          ExpressionAttributeNames: {
            "#key": "key",
          },
          ExpressionAttributeValues: {
            ":prefix": "tokens#",
          },
        },
      });

      if (response.success && response.data?.Items) {
        // Transform rate limit records to token allocations
        const allocations: TokenAllocation[] = response.data.Items.map((item: any) => {
          const userId = item.key.split("#")[1];

          // Find matching Cognito user
          const cognitoUser = cognitoUsers.find((u) => u.Username === userId);
          const userName = cognitoUser
            ? getUserAttribute(cognitoUser, "name") || cognitoUser.Username
            : userId;
          const userEmail = cognitoUser
            ? getUserAttribute(cognitoUser, "email")
            : "";

          return {
            userId,
            userName,
            userEmail,
            monthlyTokens: item.limit || 1000000,
            currentUsage: item.count || 0,
            autoRenew: item.metadata?.autoRenew ?? true,
            renewalDay: item.metadata?.renewalDay || 1,
            lastRenewal: new Date(item.windowStart).toISOString(),
            nextRenewal: new Date(item.windowStart + item.window * 1000).toISOString(),
          };
        });
        setTokenAllocations(allocations);
      }
    } catch (err: any) {
      console.error("Failed to load token allocations:", err);
    }
  };

  const updateTokenAllocation = async () => {
    if (!selectedUserId) {
      setError("Please select a user");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Update or create rate limit for user
      const key = `tokens#${selectedUserId}`;
      const now = Date.now();
      const windowSeconds = 30 * 24 * 60 * 60; // 30 days

      await apiClient.run({
        service: "platform.dynamodb",
        operation: "put",
        table: "core-ratelimit",
        data: {
          Item: {
            key,
            count: 0,
            windowStart: now,
            limit: monthlyTokens,
            window: windowSeconds,
            ttl: Math.floor((now + windowSeconds * 1000) / 1000) + 3600,
            metadata: {
              autoRenew,
              renewalDay,
              updatedBy: session.user.id,
              updatedAt: now,
            },
          },
        },
      });

      setSuccess(`Token allocation updated for user ${selectedUserId}`);
      await loadTokenAllocations();
    } catch (err: any) {
      setError(err.message || "Failed to update token allocation");
    } finally {
      setLoading(false);
    }
  };

  const resetUserTokens = async (userId: string) => {
    setLoading(true);
    try {
      const key = `tokens#${userId}`;
      await apiClient.run({
        service: "platform.dynamodb",
        operation: "update",
        table: "core-ratelimit",
        data: {
          Key: { key },
          UpdateExpression: "SET #count = :zero, windowStart = :now",
          ExpressionAttributeNames: {
            "#count": "count",
          },
          ExpressionAttributeValues: {
            ":zero": 0,
            ":now": Date.now(),
          },
        },
      });

      setSuccess(`Tokens reset for user ${userId}`);
      await loadTokenAllocations();
    } catch (err: any) {
      setError(err.message || "Failed to reset tokens");
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // ROLE MANAGEMENT FUNCTIONS
  // ============================================================================

  const loadRoles = async () => {
    try {
      const response = await apiClient.run({
        service: "platform.dynamodb",
        operation: "scan",
        table: "core-role",
        data: {},
      });

      if (response.success && response.data?.Items) {
        setRoles(response.data.Items as Role[]);
      }
    } catch (err: any) {
      console.error("Failed to load roles:", err);
    }
  };

  const loadUserRoles = async (userId: string) => {
    try {
      const response = await apiClient.run({
        service: "platform.dynamodb",
        operation: "query",
        table: "core-userrole",
        data: {
          KeyConditionExpression: "userId = :userId",
          ExpressionAttributeValues: {
            ":userId": userId,
          },
        },
      });

      if (response.success && response.data?.Items) {
        setUserRoles(response.data.Items as UserRole[]);
      }
    } catch (err: any) {
      console.error("Failed to load user roles:", err);
    }
  };

  const assignRoleToUser = async (userId: string, roleId: string, expiresAt?: number) => {
    setLoading(true);
    try {
      const now = Date.now();
      await apiClient.run({
        service: "platform.dynamodb",
        operation: "put",
        table: "core-userrole",
        data: {
          Item: {
            userId,
            roleId,
            assignedAt: now,
            assignedBy: session.user.id,
            expiresAt,
          },
        },
      });

      setSuccess(`Role assigned to user ${userId}`);
      await loadUserRoles(userId);
    } catch (err: any) {
      setError(err.message || "Failed to assign role");
    } finally {
      setLoading(false);
    }
  };

  const revokeRoleFromUser = async (userId: string, roleId: string) => {
    setLoading(true);
    try {
      await apiClient.run({
        service: "platform.dynamodb",
        operation: "delete",
        table: "core-userrole",
        data: {
          Key: { userId, roleId },
        },
      });

      setSuccess(`Role revoked from user ${userId}`);
      await loadUserRoles(userId);
    } catch (err: any) {
      setError(err.message || "Failed to revoke role");
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // RATE LIMIT MANAGEMENT FUNCTIONS
  // ============================================================================

  const loadRateLimits = async () => {
    // Load default rate limits from configuration
    const defaultLimits: RateLimitConfig[] = [
      {
        id: "limit-messages-user",
        resource: "agent.sendMessage",
        limit: 100,
        window: 3600,
        scope: "user",
        enabled: true,
      },
      {
        id: "limit-threads-user",
        resource: "agent.createThread",
        limit: 50,
        window: 86400,
        scope: "user",
        enabled: true,
      },
      {
        id: "limit-tools-user",
        resource: "tool.*",
        limit: 200,
        window: 3600,
        scope: "user",
        enabled: true,
      },
      {
        id: "limit-tokens-user",
        resource: "tokens",
        limit: 1000000,
        window: 86400,
        scope: "user",
        enabled: true,
      },
      {
        id: "limit-files-user",
        resource: "agent.uploadFile",
        limit: 20,
        window: 3600,
        scope: "user",
        enabled: true,
      },
    ];

    setRateLimits(defaultLimits);
  };

  const updateRateLimit = async (limitConfig: RateLimitConfig) => {
    setLoading(true);
    try {
      // In a full implementation, this would update the rate limiter configuration
      // For now, we'll just update the local state
      setRateLimits(prev =>
        prev.map(limit => (limit.id === limitConfig.id ? limitConfig : limit))
      );
      setSuccess("Rate limit updated");
    } catch (err: any) {
      setError(err.message || "Failed to update rate limit");
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // AUDIT LOG FUNCTIONS
  // ============================================================================

  const loadAuditLogs = async (filters?: AuditQueryFilters) => {
    setLoading(true);
    try {
      const queryFilters = filters || auditFilters;

      if (!queryFilters.userId) {
        setError("User ID is required to query audit logs");
        return;
      }

      const response = await apiClient.run({
        service: "platform.dynamodb",
        operation: "query",
        table: "core-auditlog",
        data: {
          IndexName: "userId-timestamp-index",
          KeyConditionExpression: "userId = :userId",
          ExpressionAttributeValues: {
            ":userId": queryFilters.userId,
          },
          Limit: queryFilters.limit || 50,
          ScanIndexForward: false, // Most recent first
        },
      });

      if (response.success && response.data?.Items) {
        setAuditLogs(response.data.Items as AuditLog[]);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  };

  const loadUserActivity = async (userId: string, days: number = 30) => {
    setLoading(true);
    try {
      const endTime = Date.now();
      const startTime = endTime - days * 24 * 60 * 60 * 1000;

      const response = await apiClient.run({
        service: "platform.dynamodb",
        operation: "query",
        table: "core-auditlog",
        data: {
          IndexName: "userId-timestamp-index",
          KeyConditionExpression: "userId = :userId AND #ts BETWEEN :start AND :end",
          ExpressionAttributeNames: {
            "#ts": "timestamp",
          },
          ExpressionAttributeValues: {
            ":userId": userId,
            ":start": startTime,
            ":end": endTime,
          },
        },
      });

      if (response.success && response.data?.Items) {
        const logs = response.data.Items as AuditLog[];

        // Calculate activity summary
        const actionsByType: Record<string, number> = {};
        let successCount = 0;
        let deniedCount = 0;
        let failedCount = 0;

        for (const log of logs) {
          actionsByType[log.action] = (actionsByType[log.action] || 0) + 1;

          if (log.result === "success") successCount++;
          else if (log.result === "denied") deniedCount++;
          else if (log.result === "failure") failedCount++;
        }

        const summary: UserActivitySummary = {
          userId,
          totalActions: logs.length,
          actionsByType,
          successRate: logs.length > 0 ? successCount / logs.length : 0,
          deniedActions: deniedCount,
          failedActions: failedCount,
          timeRange: { start: startTime, end: endTime },
        };

        setUserActivity(summary);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load user activity");
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="h-screen w-full bg-background p-6 overflow-auto">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Bot className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Agent Security Administration</h1>
          </div>
          <p className="text-muted-foreground">
            Manage agent security, permissions, rate limits, and audit logs
          </p>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-4 p-4 rounded-lg bg-destructive/10 border border-destructive flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <span className="text-destructive">{error}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setError(null)}
              className="ml-auto"
            >
              <XCircle className="h-4 w-4" />
            </Button>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 rounded-lg bg-green-500/10 border border-green-500 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span className="text-green-500">{success}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSuccess(null)}
              className="ml-auto"
            >
              <XCircle className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Main Tabs */}
        <Tabs defaultValue="tokens" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="tokens">
              <Calendar className="h-4 w-4 mr-2" />
              Token Management
            </TabsTrigger>
            <TabsTrigger value="roles">
              <Shield className="h-4 w-4 mr-2" />
              Roles & Permissions
            </TabsTrigger>
            <TabsTrigger value="limits">
              <Gauge className="h-4 w-4 mr-2" />
              Rate Limits
            </TabsTrigger>
            <TabsTrigger value="audit">
              <Activity className="h-4 w-4 mr-2" />
              Audit Logs
            </TabsTrigger>
          </TabsList>

          {/* Token Management Tab */}
          <TabsContent value="tokens" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Set User Token Allocation</CardTitle>
                <CardDescription>
                  Configure monthly token limits and automatic renewal for users
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="cognitoUser">Select Cognito User</Label>
                    <Select
                      value={selectedUserId}
                      onValueChange={(value: string) => {
                        setSelectedUserId(value);
                        const user = cognitoUsers.find((u) => u.Username === value);
                        if (user) {
                          setSelectedCognitoUser(user);
                        }
                      }}
                    >
                      <SelectTrigger id="cognitoUser">
                        <SelectValue placeholder="Select a user" />
                      </SelectTrigger>
                      <SelectContent>
                        {cognitoUsers.map((user) => (
                          <SelectItem key={user.Username} value={user.Username}>
                            {getUserAttribute(user, "name") || user.Username} ({getUserAttribute(user, "email")})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="monthlyTokens">Monthly Tokens</Label>
                    <Input
                      id="monthlyTokens"
                      type="number"
                      value={monthlyTokens}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMonthlyTokens(parseInt(e.target.value) || 0)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="renewalDay">Renewal Day of Month</Label>
                    <Select
                      value={renewalDay.toString()}
                      onValueChange={(value: string) => setRenewalDay(parseInt(value))}
                    >
                      <SelectTrigger id="renewalDay">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                          <SelectItem key={day} value={day.toString()}>
                            Day {day}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="autoRenew"
                      checked={autoRenew}
                      onCheckedChange={setAutoRenew}
                    />
                    <Label htmlFor="autoRenew">Automatic Monthly Renewal</Label>
                  </div>
                </div>

                <Button
                  onClick={updateTokenAllocation}
                  disabled={loading}
                  className="w-full"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? "Saving..." : "Save Token Allocation"}
                </Button>
              </CardContent>
            </Card>

            {/* Current Allocations */}
            <Card>
              <CardHeader>
                <CardTitle>Current Token Allocations</CardTitle>
                <CardDescription>
                  View and manage existing token allocations
                </CardDescription>
              </CardHeader>
              <CardContent>
                {tokenAllocations.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No token allocations configured
                  </p>
                ) : (
                  <div className="space-y-4">
                    {tokenAllocations.map((allocation) => (
                      <div
                        key={allocation.userId}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="space-y-1">
                          <p className="font-medium">{allocation.userId}</p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>
                              {allocation.currentUsage.toLocaleString()} / {allocation.monthlyTokens.toLocaleString()} tokens
                            </span>
                            <Separator orientation="vertical" className="h-4" />
                            <span>
                              Next renewal: {new Date(allocation.nextRenewal).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => resetUserTokens(allocation.userId)}
                          disabled={loading}
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Reset
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Roles & Permissions Tab */}
          <TabsContent value="roles" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Available Roles */}
              <Card>
                <CardHeader>
                  <CardTitle>Available Roles</CardTitle>
                  <CardDescription>System and custom roles</CardDescription>
                </CardHeader>
                <CardContent>
                  {roles.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No roles configured
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {roles.map((role) => (
                        <div
                          key={role.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer"
                          onClick={() => setSelectedRole(role)}
                        >
                          <div>
                            <p className="font-medium">{role.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {role.permissions.length} permissions
                            </p>
                          </div>
                          {selectedRole?.id === role.id && (
                            <CheckCircle className="h-5 w-5 text-primary" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Role Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Role Details</CardTitle>
                  <CardDescription>
                    {selectedRole ? selectedRole.name : "Select a role"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedRole ? (
                    <div className="space-y-4">
                      <div>
                        <Label>Description</Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          {selectedRole.description}
                        </p>
                      </div>

                      <div>
                        <Label>Permissions ({selectedRole.permissions.length})</Label>
                        <div className="mt-2 space-y-2">
                          {selectedRole.permissions.map((perm: Permission, idx: number) => (
                            <div key={idx} className="flex items-center gap-2 text-sm">
                              <Badge variant={perm.effect === "allow" ? "default" : "destructive"}>
                                {perm.action}
                              </Badge>
                              <span className="text-muted-foreground">{perm.resource}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {selectedRole.inherits && selectedRole.inherits.length > 0 && (
                        <div>
                          <Label>Inherits From</Label>
                          <div className="mt-2 space-y-1">
                            {selectedRole.inherits.map((roleId: string) => (
                              <Badge key={roleId} variant="outline">
                                {roles.find((r) => r.id === roleId)?.name || roleId}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Select a role to view details
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Cognito Group Management */}
            <Card>
              <CardHeader>
                <CardTitle>Cognito Group Management</CardTitle>
                <CardDescription>
                  Manage user access by adding/removing users to/from Cognito groups
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* User Groups Display */}
                {selectedCognitoUser && (
                  <div className="p-4 border rounded-lg bg-accent/50">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium">
                          {getUserAttribute(selectedCognitoUser, "name") || selectedCognitoUser.Username}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {getUserAttribute(selectedCognitoUser, "email")}
                        </p>
                      </div>
                      <Badge variant="outline">{selectedCognitoUser.UserStatus}</Badge>
                    </div>
                    <Separator className="my-3" />
                    <div>
                      <Label className="mb-2 block">Current Groups</Label>
                      {selectedCognitoUser.Groups && selectedCognitoUser.Groups.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {selectedCognitoUser.Groups.map((group) => (
                            <Badge key={group} className="flex items-center gap-1">
                              {group}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-4 w-4 p-0 hover:bg-transparent"
                                onClick={() => removeUserFromGroup(selectedCognitoUser.Username, group)}
                              >
                                <XCircle className="h-3 w-3" />
                              </Button>
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No groups assigned</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Add User to Group */}
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2 md:col-span-1">
                    <Label htmlFor="groupUser">Cognito User</Label>
                    <Select
                      value={selectedCognitoUser?.Username || ""}
                      onValueChange={(value: string) => {
                        const user = cognitoUsers.find((u) => u.Username === value);
                        setSelectedCognitoUser(user || null);
                      }}
                    >
                      <SelectTrigger id="groupUser">
                        <SelectValue placeholder="Select user" />
                      </SelectTrigger>
                      <SelectContent>
                        {cognitoUsers.map((user) => (
                          <SelectItem key={user.Username} value={user.Username}>
                            {getUserAttribute(user, "name") || user.Username}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 md:col-span-1">
                    <Label htmlFor="assignGroup">Cognito Group</Label>
                    <Select>
                      <SelectTrigger id="assignGroup">
                        <SelectValue placeholder="Select group" />
                      </SelectTrigger>
                      <SelectContent>
                        {cognitoGroups.map((group) => (
                          <SelectItem key={group} value={group}>
                            {group}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-end md:col-span-1">
                    <Button
                      className="w-full"
                      disabled={loading || !selectedCognitoUser}
                      onClick={() => {
                        const selectElement = document.getElementById("assignGroup") as HTMLSelectElement;
                        const groupName = selectElement?.value;
                        if (selectedCognitoUser && groupName) {
                          addUserToGroup(selectedCognitoUser.Username, groupName);
                        }
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add to Group
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cognito Users List */}
            <Card>
              <CardHeader>
                <CardTitle>All Cognito Users</CardTitle>
                <CardDescription>
                  {cognitoUsers.length} users in Cognito user pool
                </CardDescription>
              </CardHeader>
              <CardContent>
                {cognitoUsers.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No users found
                  </p>
                ) : (
                  <div className="space-y-2">
                    {cognitoUsers.map((user) => (
                      <div
                        key={user.Username}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer"
                        onClick={() => setSelectedCognitoUser(user)}
                      >
                        <div className="flex-1">
                          <p className="font-medium">
                            {getUserAttribute(user, "name") || user.Username}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {getUserAttribute(user, "email")}
                          </p>
                          {user.Groups && user.Groups.length > 0 && (
                            <div className="flex gap-1 mt-1">
                              {user.Groups.map((group) => (
                                <Badge key={group} variant="outline" className="text-xs">
                                  {group}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={user.UserStatus === "CONFIRMED" ? "default" : "secondary"}>
                            {user.UserStatus}
                          </Badge>
                          {selectedCognitoUser?.Username === user.Username && (
                            <CheckCircle className="h-5 w-5 text-primary" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Rate Limits Tab */}
          <TabsContent value="limits" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Rate Limit Configuration</CardTitle>
                <CardDescription>
                  Configure rate limits for agent operations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {rateLimits.map((limit) => (
                    <div
                      key={limit.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{limit.resource}</p>
                          <Badge variant="outline">{limit.scope}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {limit.limit.toLocaleString()} requests per {limit.window < 3600 ? `${limit.window / 60} min` : `${limit.window / 3600} hr`}
                        </p>
                      </div>
                      <Switch
                        checked={limit.enabled}
                        onCheckedChange={(checked: boolean) =>
                          updateRateLimit({ ...limit, enabled: checked })
                        }
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Audit Logs Tab */}
          <TabsContent value="audit" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Query Audit Logs</CardTitle>
                <CardDescription>
                  Search security events and user activity
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="auditUserId">User ID</Label>
                    <Input
                      id="auditUserId"
                      placeholder="user-12345"
                      value={auditFilters.userId || ""}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setAuditFilters({ ...auditFilters, userId: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="auditLimit">Result Limit</Label>
                    <Input
                      id="auditLimit"
                      type="number"
                      value={auditFilters.limit || 50}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setAuditFilters({
                          ...auditFilters,
                          limit: parseInt(e.target.value) || 50,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => loadAuditLogs()}
                    disabled={loading || !auditFilters.userId}
                    className="flex-1"
                  >
                    <Activity className="h-4 w-4 mr-2" />
                    Load Logs
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => auditFilters.userId && loadUserActivity(auditFilters.userId)}
                    disabled={loading || !auditFilters.userId}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Activity Summary
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* User Activity Summary */}
            {userActivity && (
              <Card>
                <CardHeader>
                  <CardTitle>User Activity Summary</CardTitle>
                  <CardDescription>
                    Activity for {userActivity.userId} over last 30 days
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-4">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Total Actions</p>
                      <p className="text-2xl font-bold">{userActivity.totalActions}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Success Rate</p>
                      <p className="text-2xl font-bold">
                        {(userActivity.successRate * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Denied</p>
                      <p className="text-2xl font-bold text-destructive">
                        {userActivity.deniedActions}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Failed</p>
                      <p className="text-2xl font-bold text-yellow-500">
                        {userActivity.failedActions}
                      </p>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  <div>
                    <Label>Actions by Type</Label>
                    <div className="mt-2 space-y-2">
                      {Object.entries(userActivity.actionsByType).map(([action, count]) => (
                        <div key={action} className="flex items-center justify-between">
                          <span className="text-sm">{action}</span>
                          <Badge>{count}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Audit Logs List */}
            {auditLogs.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Audit Log Entries</CardTitle>
                  <CardDescription>
                    {auditLogs.length} most recent events
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {auditLogs.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge
                              variant={
                                log.result === "success"
                                  ? "default"
                                  : log.result === "denied"
                                  ? "destructive"
                                  : "outline"
                              }
                            >
                              {log.result}
                            </Badge>
                            <span className="text-sm font-medium">{log.action}</span>
                            <Separator orientation="vertical" className="h-4" />
                            <span className="text-sm text-muted-foreground">
                              {log.resource}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {new Date(log.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
