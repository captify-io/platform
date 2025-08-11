"use client";

import { useState, useEffect } from "react";
import { ApplicationEntity } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Save,
  RefreshCw,
  AlertCircle,
  Plus,
  Trash2,
  Shield,
  Users,
  UserCheck,
  UserX,
  Search,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface UserPermission {
  id: string;
  userId: string;
  email: string;
  name: string;
  role: "owner" | "admin" | "editor" | "viewer";
  status: "active" | "pending" | "revoked";
  grantedAt: string;
  grantedBy: string;
}

interface ApplicationPermissionsTabProps {
  application: ApplicationEntity;
  onUpdate: (application: ApplicationEntity) => void;
  onUnsavedChanges: (hasChanges: boolean) => void;
}

export function ApplicationPermissionsTab({
  onUnsavedChanges,
}: ApplicationPermissionsTabProps) {
  const [permissions, setPermissions] = useState<UserPermission[]>([
    {
      id: "1",
      userId: "user-1",
      email: "admin@company.com",
      name: "System Administrator",
      role: "owner",
      status: "active",
      grantedAt: "2024-01-01T00:00:00Z",
      grantedBy: "system",
    },
    {
      id: "2",
      userId: "user-2",
      email: "manager@company.com",
      name: "Application Manager",
      role: "admin",
      status: "active",
      grantedAt: "2024-01-15T00:00:00Z",
      grantedBy: "admin@company.com",
    },
    {
      id: "3",
      userId: "user-3",
      email: "analyst@company.com",
      name: "Data Analyst",
      role: "editor",
      status: "pending",
      grantedAt: "2024-01-20T00:00:00Z",
      grantedBy: "admin@company.com",
    },
  ]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRole, setNewUserRole] = useState<"admin" | "editor" | "viewer">(
    "viewer"
  );
  const [searchTerm, setSearchTerm] = useState("");

  // Track changes
  useEffect(() => {
    // In a real implementation, you'd compare with original permissions from the application
    onUnsavedChanges(true);
  }, [permissions, onUnsavedChanges]);

  const handlePermissionUpdate = (id: string, field: string, value: string) => {
    setPermissions((prev) =>
      prev.map((permission) =>
        permission.id === id ? { ...permission, [field]: value } : permission
      )
    );
    setError(null);
    setSuccess(null);
  };

  const handleAddUser = async () => {
    if (!newUserEmail.trim()) {
      setError("Email address is required");
      return;
    }

    // Check if user already has permission
    if (
      permissions.some(
        (p) => p.email.toLowerCase() === newUserEmail.toLowerCase()
      )
    ) {
      setError("User already has permissions for this application");
      return;
    }

    const newPermission: UserPermission = {
      id: (permissions.length + 1).toString(),
      userId: `user-${permissions.length + 1}`,
      email: newUserEmail,
      name: newUserEmail.split("@")[0], // Simple name extraction
      role: newUserRole,
      status: "pending",
      grantedAt: new Date().toISOString(),
      grantedBy: "current-user@company.com", // This would come from auth context
    };

    setPermissions((prev) => [...prev, newPermission]);
    setNewUserEmail("");
    setNewUserRole("viewer");
    setShowAddForm(false);
    setError(null);
    setSuccess("User invitation sent successfully!");

    setTimeout(() => setSuccess(null), 3000);
  };

  const handleRevokePermission = (id: string) => {
    setPermissions((prev) =>
      prev.map((permission) =>
        permission.id === id
          ? { ...permission, status: "revoked" as const }
          : permission
      )
    );
  };

  const handleDeletePermission = (id: string) => {
    setPermissions((prev) => prev.filter((permission) => permission.id !== id));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // In a real implementation, you'd save the permissions to the database
      setSuccess("Permissions saved successfully!");
      onUnsavedChanges(false);

      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error("Failed to save permissions:", error);
      setError(
        error instanceof Error ? error.message : "Failed to save permissions"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "owner":
        return "bg-purple-100 text-purple-800";
      case "admin":
        return "bg-red-100 text-red-800";
      case "editor":
        return "bg-blue-100 text-blue-800";
      case "viewer":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "revoked":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredPermissions = permissions.filter(
    (permission) =>
      permission.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      permission.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Permissions</h2>
          <p className="text-muted-foreground">
            Manage user access and permissions for this application
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save
              </>
            )}
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
          <div className="flex items-center">
            <AlertCircle className="h-4 w-4 text-destructive mr-2" />
            <span className="text-sm text-destructive">{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-md">
          <div className="flex items-center">
            <div className="h-4 w-4 bg-green-500 rounded-full mr-2" />
            <span className="text-sm text-green-700">{success}</span>
          </div>
        </div>
      )}

      {/* Permission Role Explanations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Permission Roles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-3 border rounded-lg">
              <Badge className="mb-2 bg-purple-100 text-purple-800">
                Owner
              </Badge>
              <p className="text-sm text-muted-foreground">
                Full access including user management and deletion
              </p>
            </div>
            <div className="p-3 border rounded-lg">
              <Badge className="mb-2 bg-red-100 text-red-800">Admin</Badge>
              <p className="text-sm text-muted-foreground">
                Manage settings, users, and application configuration
              </p>
            </div>
            <div className="p-3 border rounded-lg">
              <Badge className="mb-2 bg-blue-100 text-blue-800">Editor</Badge>
              <p className="text-sm text-muted-foreground">
                Create and modify content, access most features
              </p>
            </div>
            <div className="p-3 border rounded-lg">
              <Badge className="mb-2 bg-gray-100 text-gray-800">Viewer</Badge>
              <p className="text-sm text-muted-foreground">
                Read-only access to application content
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add User Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add User</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="new-user-email">Email Address</Label>
                <Input
                  id="new-user-email"
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="user@company.com"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="new-user-role">Role</Label>
                <Select
                  value={newUserRole}
                  onValueChange={(value) =>
                    setNewUserRole(value as "admin" | "editor" | "viewer")
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="editor">Editor</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-4">
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddUser}>Send Invitation</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* User Permissions List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              User Permissions ({filteredPermissions.length})
            </div>
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredPermissions.map((permission) => (
              <div
                key={permission.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center ${
                      permission.status === "active"
                        ? "bg-green-100"
                        : permission.status === "pending"
                        ? "bg-yellow-100"
                        : "bg-red-100"
                    }`}
                  >
                    {permission.status === "active" ? (
                      <UserCheck className="h-4 w-4 text-green-600" />
                    ) : permission.status === "pending" ? (
                      <Users className="h-4 w-4 text-yellow-600" />
                    ) : (
                      <UserX className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium">{permission.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {permission.email}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Added{" "}
                      {new Date(permission.grantedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Badge className={getRoleColor(permission.role)}>
                    {permission.role}
                  </Badge>
                  <Badge className={getStatusColor(permission.status)}>
                    {permission.status}
                  </Badge>

                  {permission.role !== "owner" && (
                    <div className="flex space-x-1">
                      <Select
                        value={permission.role}
                        onValueChange={(value) =>
                          handlePermissionUpdate(permission.id, "role", value)
                        }
                        disabled={permission.status === "revoked"}
                      >
                        <SelectTrigger className="w-24 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="editor">Editor</SelectItem>
                          <SelectItem value="viewer">Viewer</SelectItem>
                        </SelectContent>
                      </Select>

                      {permission.status === "active" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRevokePermission(permission.id)}
                          className="h-8 px-2 text-yellow-600 hover:text-yellow-700"
                        >
                          Revoke
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeletePermission(permission.id)}
                        className="h-8 px-2 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {filteredPermissions.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No users found matching your search.</p>
                <p className="text-sm">
                  Try adjusting your search terms or add a new user.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
