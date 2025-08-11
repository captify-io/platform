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
import {
  Users,
  Plus,
  Edit,
  Settings,
  Search,
  RefreshCw,
  Shield,
  UserCheck,
  Lock,
} from "lucide-react";

export default function GroupsPage() {
  const [searchTerm, setSearchTerm] = useState("");

  // Mock data - replace with real data from your backend
  const groups = [
    {
      id: "group-1",
      name: "Administrators",
      description: "Full system access and management permissions",
      permissions: ["admin", "user_management", "application_management"],
      members: 5,
      organization: "Acme Corporation",
      createdAt: "2024-01-15",
    },
    {
      id: "group-2",
      name: "Data Scientists",
      description: "Access to analytics and AI capabilities",
      permissions: ["analytics", "ai_agents", "data_export"],
      members: 12,
      organization: "Acme Corporation",
      createdAt: "2024-02-01",
    },
    {
      id: "group-3",
      name: "Viewers",
      description: "Read-only access to applications",
      permissions: ["view_applications"],
      members: 28,
      organization: "TechFlow Inc",
      createdAt: "2024-02-20",
    },
  ];

  const filteredGroups = groups.filter(
    (group) =>
      group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.organization.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full bg-background overflow-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Groups</h1>
              <p className="mt-2 text-muted-foreground">
                Manage user groups and their permissions
              </p>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Group
              </Button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Groups
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{groups.length}</div>
              <p className="text-xs text-muted-foreground">Configured groups</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Members
              </CardTitle>
              <UserCheck className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {groups.reduce((sum, group) => sum + group.members, 0)}
              </div>
              <p className="text-xs text-muted-foreground">Across all groups</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Admin Groups
              </CardTitle>
              <Shield className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {
                  groups.filter((group) => group.permissions.includes("admin"))
                    .length
                }
              </div>
              <p className="text-xs text-muted-foreground">
                With admin privileges
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Permissions</CardTitle>
              <Lock className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {
                  [...new Set(groups.flatMap((group) => group.permissions))]
                    .length
                }
              </div>
              <p className="text-xs text-muted-foreground">
                Unique permissions
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Search Groups</CardTitle>
            <CardDescription>
              Find groups by name, description, or organization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search groups..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Groups Table */}
        <Card>
          <CardHeader>
            <CardTitle>Groups ({filteredGroups.length})</CardTitle>
            <CardDescription>
              Manage user groups and their permission levels
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredGroups.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No groups found
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm
                    ? "No groups match your search."
                    : "Get started by creating your first group."}
                </p>
                {!searchTerm && (
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Group
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Group</TableHead>
                      <TableHead>Organization</TableHead>
                      <TableHead>Members</TableHead>
                      <TableHead>Permissions</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredGroups.map((group) => (
                      <TableRow key={group.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                              <Users className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <div className="font-medium text-foreground">
                                {group.name}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {group.description}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{group.organization}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <UserCheck className="h-4 w-4 text-muted-foreground" />
                            <span>{group.members}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {group.permissions.slice(0, 2).map((permission) => (
                              <Badge
                                key={permission}
                                variant="secondary"
                                className="text-xs"
                              >
                                {permission.replace("_", " ")}
                              </Badge>
                            ))}
                            {group.permissions.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{group.permissions.length - 2} more
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-muted-foreground">
                            {new Date(group.createdAt).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Edit Group"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Group Settings"
                            >
                              <Settings className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
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
