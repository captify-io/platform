"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  User,
  Plus,
  Edit,
  Settings,
  Search,
  RefreshCw,
  Shield,
  UserCheck,
  Mail,
} from "lucide-react";

export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState("");

  // Mock data - replace with real data from your backend
  const users = [
    {
      id: "user-1",
      name: "John Doe",
      email: "john.doe@acme.com",
      role: "Administrator",
      organization: "Acme Corporation",
      groups: ["Administrators", "Data Scientists"],
      status: "active",
      lastLogin: "2024-01-20T10:30:00Z",
      createdAt: "2024-01-15",
      avatar: null,
    },
    {
      id: "user-2",
      name: "Jane Smith",
      email: "jane.smith@acme.com",
      role: "Data Scientist",
      organization: "Acme Corporation",
      groups: ["Data Scientists"],
      status: "active",
      lastLogin: "2024-01-19T14:20:00Z",
      createdAt: "2024-01-18",
      avatar: null,
    },
    {
      id: "user-3",
      name: "Bob Wilson",
      email: "bob.wilson@techflow.io",
      role: "Viewer",
      organization: "TechFlow Inc",
      groups: ["Viewers"],
      status: "inactive",
      lastLogin: "2024-01-10T09:15:00Z",
      createdAt: "2024-02-20",
      avatar: null,
    },
  ];

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.organization.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase();
  };

  const getStatusBadge = (status: string) => {
    if (status === "active") {
      return { variant: "default" as const, text: "Active" };
    }
    return { variant: "secondary" as const, text: "Inactive" };
  };

  return (
    <div className="h-full bg-background overflow-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Users</h1>
              <p className="mt-2 text-muted-foreground">
                Manage users and their access permissions
              </p>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Invite User
              </Button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
              <p className="text-xs text-muted-foreground">Registered users</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Users
              </CardTitle>
              <UserCheck className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {users.filter((user) => user.status === "active").length}
              </div>
              <p className="text-xs text-muted-foreground">Currently active</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Administrators
              </CardTitle>
              <Shield className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {users.filter((user) => user.role === "Administrator").length}
              </div>
              <p className="text-xs text-muted-foreground">Admin privileges</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Invitations</CardTitle>
              <Mail className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">3</div>
              <p className="text-xs text-muted-foreground">Pending invites</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Search Users</CardTitle>
            <CardDescription>
              Find users by name, email, role, or organization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Users ({filteredUsers.length})</CardTitle>
            <CardDescription>
              Manage user accounts and their access permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredUsers.length === 0 ? (
              <div className="text-center py-8">
                <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No users found
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm
                    ? "No users match your search."
                    : "Get started by inviting your first user."}
                </p>
                {!searchTerm && (
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Invite User
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Organization</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Groups</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => {
                      const statusBadge = getStatusBadge(user.status);
                      return (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={user.avatar || undefined} />
                                <AvatarFallback>
                                  {getInitials(user.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium text-foreground">
                                  {user.name}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {user.email}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{user.organization}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                user.role === "Administrator"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {user.groups.slice(0, 2).map((group) => (
                                <Badge
                                  key={group}
                                  variant="outline"
                                  className="text-xs"
                                >
                                  {group}
                                </Badge>
                              ))}
                              {user.groups.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{user.groups.length - 2} more
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusBadge.variant}>
                              {statusBadge.text}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-muted-foreground">
                              {new Date(user.lastLogin).toLocaleDateString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                title="Edit User"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                title="User Settings"
                              >
                                <Settings className="h-4 w-4" />
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
