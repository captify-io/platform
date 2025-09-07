'use client';

import * as React from "react";
import { Button } from "@captify/core/ui";
import { Input } from "@captify/core/ui";
import { Label } from "@captify/core/ui";
import { apiClient } from "@captify/core/lib";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@captify/core/ui";
import { Badge } from "@captify/core/ui";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@captify/core/ui";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@captify/core/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@captify/core/ui";
import { Search, UserPlus, RefreshCw, Users, Mail, Phone, Building, Shield, Calendar, Edit2, Save, X } from "lucide-react";
import { ScrollArea } from "@captify/core/ui";
import { Separator } from "@captify/core/ui";
import { Switch } from "@captify/core/ui";

interface User {
  userId: string;
  email: string;
  name: string;
  status: string;
  enabled: boolean;
  createdAt?: string;
  lastModified?: string;
  emailVerified?: boolean;
  phoneNumber?: string;
  department?: string;
  title?: string;
  attributes?: Record<string, any>;
}

export function AccessUsersPage() {
  const [users, setUsers] = React.useState<User[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedUser, setSelectedUser] = React.useState<User | null>(null);
  const [isEditing, setIsEditing] = React.useState(false);
  const [editedUser, setEditedUser] = React.useState<User | null>(null);
  const [saving, setSaving] = React.useState(false);

  // Fetch users from Cognito via API
  const fetchUsers = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Debug: Check what identity pool is currently set
      const currentPool = apiClient.getCurrentIdentityPool();
      console.log("[AccessUsersPage] Current identity pool:", currentPool || "none");
      console.log("[AccessUsersPage] Fetching users...");
      
      const result = await apiClient.run({
        service: "cognito",
        operation: "listUsers",
      });

      if (result.success && result.data) {
        const mappedUsers: User[] = result.data.map((user: any) => {
          const attributes = user.Attributes?.reduce((acc: any, attr: any) => {
            acc[attr.Name] = attr.Value;
            return acc;
          }, {}) || {};

          return {
            userId: user.Username,
            email: attributes.email || "",
            name: attributes.name || attributes.given_name || user.Username,
            status: user.UserStatus,
            enabled: user.Enabled !== false,
            createdAt: user.UserCreateDate,
            lastModified: user.UserLastModifiedDate,
            emailVerified: attributes.email_verified === "true",
            phoneNumber: attributes.phone_number,
            department: attributes["custom:department"],
            title: attributes["custom:title"],
            attributes,
          };
        });

        setUsers(mappedUsers);
      } else {
        // If API fails, show mock data so the UI still works
        console.warn("Failed to fetch users from Cognito:", result.error);
        setUsers([
          {
            userId: "demo-user",
            email: "demo@example.com",
            name: "Demo User (API Unavailable)",
            status: "CONFIRMED",
            enabled: true,
          },
        ]);
        setError("Unable to connect to Cognito. Showing demo data.");
      }
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("Failed to load users. Please check your AWS configuration.");
      // Show demo data on error
      setUsers([
        {
          userId: "demo-user",
          email: "demo@example.com",
          name: "Demo User (Error)",
          status: "CONFIRMED",
          enabled: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Update user in Cognito
  const updateUser = async () => {
    if (!editedUser || !selectedUser) return;
    
    setSaving(true);
    try {
      const updates: any = {
        Username: editedUser.userId,
        UserAttributes: [],
      };

      // Add changed attributes
      if (editedUser.name !== selectedUser.name) {
        updates.UserAttributes.push({ Name: "name", Value: editedUser.name });
      }
      if (editedUser.email !== selectedUser.email) {
        updates.UserAttributes.push({ Name: "email", Value: editedUser.email });
      }
      if (editedUser.phoneNumber !== selectedUser.phoneNumber) {
        updates.UserAttributes.push({ Name: "phone_number", Value: editedUser.phoneNumber || "" });
      }
      if (editedUser.department !== selectedUser.department) {
        updates.UserAttributes.push({ Name: "custom:department", Value: editedUser.department || "" });
      }
      if (editedUser.title !== selectedUser.title) {
        updates.UserAttributes.push({ Name: "custom:title", Value: editedUser.title || "" });
      }

      const result = await apiClient.run({
        service: "cognito",
        operation: "updateUser",
        data: updates,
      });
      
      if (result.success) {
        // Update local state
        setUsers(users.map(u => u.userId === editedUser.userId ? editedUser : u));
        setSelectedUser(editedUser);
        setIsEditing(false);
        setEditedUser(null);
      } else {
        alert(`Failed to update user: ${result.error || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Error updating user:", err);
      alert("Failed to update user. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Toggle user enabled status
  const toggleUserStatus = async (userId: string, enabled: boolean) => {
    try {
      const operation = enabled ? "enableUser" : "disableUser";
      const result = await apiClient.run({
        service: "cognito",
        operation,
        data: { Username: userId },
      });
      
      if (result.success) {
        setUsers(users.map(u => u.userId === userId ? { ...u, enabled } : u));
        if (selectedUser?.userId === userId) {
          setSelectedUser({ ...selectedUser, enabled });
        }
      } else {
        alert(`Failed to ${enabled ? "enable" : "disable"} user: ${result.error || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Error toggling user status:", err);
      alert("Failed to update user status. Please try again.");
    }
  };

  React.useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return "success";
      case "UNCONFIRMED":
        return "warning";
      case "FORCE_CHANGE_PASSWORD":
        return "secondary";
      case "ARCHIVED":
        return "destructive";
      default:
        return "default";
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage Cognito users and their permissions
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchUsers} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button>
            <UserPlus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="pb-3">
            <CardDescription className="text-yellow-800">{error}</CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => u.enabled).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmed</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => u.status === "CONFIRMED").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => u.emailVerified).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>
            Click on a user to view and edit their details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Enabled</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                        <span className="ml-2 text-muted-foreground">Loading users...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.userId} className="cursor-pointer hover:bg-muted/50">
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(user.status) as any}>
                          {user.status?.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={user.enabled}
                          onCheckedChange={(checked) => toggleUserStatus(user.userId, checked)}
                        />
                      </TableCell>
                      <TableCell>
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedUser(user);
                            setEditedUser(user);
                            setIsEditing(false);
                          }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* User Details Sheet */}
      <Sheet open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <SheetContent className="w-[600px] sm:max-w-[600px]">
          {selectedUser && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center justify-between">
                  <span>User Details</span>
                  {!isEditing ? (
                    <Button size="sm" onClick={() => {
                      setIsEditing(true);
                      setEditedUser(selectedUser);
                    }}>
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => {
                        setIsEditing(false);
                        setEditedUser(selectedUser);
                      }}>
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                      <Button size="sm" onClick={updateUser} disabled={saving}>
                        <Save className="h-4 w-4 mr-2" />
                        {saving ? "Saving..." : "Save"}
                      </Button>
                    </div>
                  )}
                </SheetTitle>
                <SheetDescription>
                  User ID: {selectedUser.userId}
                </SheetDescription>
              </SheetHeader>

              <ScrollArea className="h-[calc(100vh-120px)] mt-6">
                <div className="space-y-6">
                  {/* Basic Information */}
                  <div>
                    <h3 className="text-sm font-medium mb-3">Basic Information</h3>
                    <div className="space-y-3">
                      <div>
                        <Label>Name</Label>
                        {isEditing ? (
                          <Input
                            value={editedUser?.name || ""}
                            onChange={(e) => setEditedUser(prev => prev ? { ...prev, name: e.target.value } : null)}
                          />
                        ) : (
                          <p className="text-sm mt-1">{selectedUser.name}</p>
                        )}
                      </div>
                      <div>
                        <Label>Email</Label>
                        {isEditing ? (
                          <Input
                            type="email"
                            value={editedUser?.email || ""}
                            onChange={(e) => setEditedUser(prev => prev ? { ...prev, email: e.target.value } : null)}
                          />
                        ) : (
                          <p className="text-sm mt-1">{selectedUser.email}</p>
                        )}
                      </div>
                      <div>
                        <Label>Phone</Label>
                        {isEditing ? (
                          <Input
                            type="tel"
                            value={editedUser?.phoneNumber || ""}
                            onChange={(e) => setEditedUser(prev => prev ? { ...prev, phoneNumber: e.target.value } : null)}
                          />
                        ) : (
                          <p className="text-sm mt-1">{selectedUser.phoneNumber || "Not set"}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Organization */}
                  <div>
                    <h3 className="text-sm font-medium mb-3">Organization</h3>
                    <div className="space-y-3">
                      <div>
                        <Label>Department</Label>
                        {isEditing ? (
                          <Input
                            value={editedUser?.department || ""}
                            onChange={(e) => setEditedUser(prev => prev ? { ...prev, department: e.target.value } : null)}
                          />
                        ) : (
                          <p className="text-sm mt-1">{selectedUser.department || "Not set"}</p>
                        )}
                      </div>
                      <div>
                        <Label>Title</Label>
                        {isEditing ? (
                          <Input
                            value={editedUser?.title || ""}
                            onChange={(e) => setEditedUser(prev => prev ? { ...prev, title: e.target.value } : null)}
                          />
                        ) : (
                          <p className="text-sm mt-1">{selectedUser.title || "Not set"}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Account Status */}
                  <div>
                    <h3 className="text-sm font-medium mb-3">Account Status</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Status</Label>
                        <Badge variant={getStatusColor(selectedUser.status) as any}>
                          {selectedUser.status?.replace(/_/g, " ")}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Enabled</Label>
                        <Switch
                          checked={selectedUser.enabled}
                          onCheckedChange={(checked) => toggleUserStatus(selectedUser.userId, checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Email Verified</Label>
                        <Badge variant={selectedUser.emailVerified ? "default" : "secondary"} className={selectedUser.emailVerified ? "bg-green-500/10 text-green-700 dark:text-green-400" : ""}>
                          {selectedUser.emailVerified ? "Verified" : "Unverified"}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Timestamps */}
                  <div>
                    <h3 className="text-sm font-medium mb-3">Timestamps</h3>
                    <div className="space-y-2">
                      <div>
                        <Label>Created</Label>
                        <p className="text-sm mt-1">
                          {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleString() : "Unknown"}
                        </p>
                      </div>
                      <div>
                        <Label>Last Modified</Label>
                        <p className="text-sm mt-1">
                          {selectedUser.lastModified ? new Date(selectedUser.lastModified).toLocaleString() : "Unknown"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default AccessUsersPage;