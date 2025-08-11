"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  AlertTriangle,
  Lock,
  Eye,
  RefreshCw,
  Download,
  Settings,
  Key,
  UserCheck,
  Clock,
  CheckCircle,
  XCircle,
  Activity,
} from "lucide-react";

export default function SecurityPage() {
  // Security settings state
  const [mfaEnabled] = useState<boolean>(true);
  const [sessionTimeout] = useState<boolean>(true);
  const [auditLogging] = useState<boolean>(true);

  // Mock data - replace with real security data
  const securityMetrics = {
    totalEvents: 1247,
    criticalAlerts: 3,
    activeUsers: 42,
    failedLogins: 12,
  };

  const recentEvents = [
    {
      id: "1",
      type: "authentication",
      severity: "medium",
      user: "john.doe@acme.com",
      action: "Failed login attempt",
      timestamp: "2024-01-20T10:30:00Z",
      ip: "192.168.1.100",
    },
    {
      id: "2",
      type: "permission",
      severity: "high",
      user: "admin@acme.com",
      action: "Permission escalation",
      timestamp: "2024-01-20T09:15:00Z",
      ip: "10.0.0.5",
    },
    {
      id: "3",
      type: "data_access",
      severity: "low",
      user: "jane.smith@acme.com",
      action: "Data export",
      timestamp: "2024-01-20T08:45:00Z",
      ip: "172.16.0.10",
    },
    {
      id: "4",
      type: "system",
      severity: "critical",
      user: "system",
      action: "Unusual API activity detected",
      timestamp: "2024-01-20T07:20:00Z",
      ip: "203.0.113.1",
    },
  ];

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "critical":
        return { variant: "destructive" as const, text: "Critical" };
      case "high":
        return { variant: "destructive" as const, text: "High" };
      case "medium":
        return { variant: "default" as const, text: "Medium" };
      case "low":
        return { variant: "secondary" as const, text: "Low" };
      default:
        return { variant: "secondary" as const, text: "Unknown" };
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case "authentication":
        return <UserCheck className="h-4 w-4" />;
      case "permission":
        return <Shield className="h-4 w-4" />;
      case "data_access":
        return <Eye className="h-4 w-4" />;
      case "system":
        return <Activity className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  return (
    <div className="h-full bg-background overflow-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Security</h1>
              <p className="mt-2 text-muted-foreground">
                Monitor security events and manage security settings
              </p>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button>
                <Download className="h-4 w-4 mr-2" />
                Export Logs
              </Button>
            </div>
          </div>
        </div>

        {/* Security Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Security Events
              </CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {securityMetrics.totalEvents}
              </div>
              <p className="text-xs text-muted-foreground">Last 24 hours</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Critical Alerts
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {securityMetrics.criticalAlerts}
              </div>
              <p className="text-xs text-muted-foreground">
                Requires attention
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Sessions
              </CardTitle>
              <UserCheck className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {securityMetrics.activeUsers}
              </div>
              <p className="text-xs text-muted-foreground">
                Currently logged in
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Failed Logins
              </CardTitle>
              <XCircle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {securityMetrics.failedLogins}
              </div>
              <p className="text-xs text-muted-foreground">Last 24 hours</p>
            </CardContent>
          </Card>
        </div>

        {/* Security Settings */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              Security Settings
            </CardTitle>
            <CardDescription>
              Configure global security policies and controls
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-base font-medium">
                  Multi-Factor Authentication
                </div>
                <div className="text-sm text-muted-foreground">
                  Require MFA for all users
                </div>
              </div>
              <Button variant="outline" size="sm">
                {mfaEnabled ? "Enabled" : "Disabled"}
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-base font-medium">Session Timeout</div>
                <div className="text-sm text-muted-foreground">
                  Automatically log out inactive users after 30 minutes
                </div>
              </div>
              <Button variant="outline" size="sm">
                {sessionTimeout ? "Enabled" : "Disabled"}
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-base font-medium">Audit Logging</div>
                <div className="text-sm text-muted-foreground">
                  Log all user actions and system events
                </div>
              </div>
              <Button variant="outline" size="sm">
                {auditLogging ? "Enabled" : "Disabled"}
              </Button>
            </div>

            <div className="flex space-x-4 pt-4">
              <Button>
                <Key className="h-4 w-4 mr-2" />
                Manage API Keys
              </Button>
              <Button variant="outline">
                <Lock className="h-4 w-4 mr-2" />
                Password Policy
              </Button>
              <Button variant="outline">
                <Shield className="h-4 w-4 mr-2" />
                Role Permissions
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Security Events */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Recent Security Events
            </CardTitle>
            <CardDescription>
              Latest security events and alerts requiring attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentEvents.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  All Clear
                </h3>
                <p className="text-muted-foreground">
                  No security events detected in the last 24 hours.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentEvents.map((event) => {
                      const severityBadge = getSeverityBadge(event.severity);
                      return (
                        <TableRow key={event.id}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <div className="flex-shrink-0">
                                {getEventIcon(event.type)}
                              </div>
                              <div>
                                <div className="font-medium text-foreground">
                                  {event.action}
                                </div>
                                <div className="text-sm text-muted-foreground capitalize">
                                  {event.type.replace("_", " ")}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium text-foreground">
                              {event.user}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={severityBadge.variant}>
                              {severityBadge.text}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <code className="text-sm bg-muted px-2 py-1 rounded">
                              {event.ip}
                            </code>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">
                                {new Date(event.timestamp).toLocaleString()}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                title="View Details"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                title="Investigate"
                              >
                                <AlertTriangle className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
