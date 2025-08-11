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
  Building2,
  Plus,
  Edit,
  Settings,
  Users,
  Search,
  RefreshCw,
  Shield,
  Globe,
} from "lucide-react";

export default function OrganizationsPage() {
  const [searchTerm, setSearchTerm] = useState("");

  // Mock data - replace with real data from your backend
  const organizations = [
    {
      id: "org-1",
      name: "Acme Corporation",
      domain: "acme.com",
      plan: "Enterprise",
      users: 125,
      status: "active",
      createdAt: "2024-01-15",
    },
    {
      id: "org-2",
      name: "TechFlow Inc",
      domain: "techflow.io",
      plan: "Professional",
      users: 45,
      status: "active",
      createdAt: "2024-02-20",
    },
  ];

  const filteredOrganizations = organizations.filter(
    (org) =>
      org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.domain.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full bg-background overflow-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Organizations
              </h1>
              <p className="mt-2 text-muted-foreground">
                Manage organizations and their settings
              </p>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Organization
              </Button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Organizations
              </CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{organizations.length}</div>
              <p className="text-xs text-muted-foreground">
                Active organizations
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {organizations.reduce((sum, org) => sum + org.users, 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Across all organizations
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Enterprise</CardTitle>
              <Shield className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {
                  organizations.filter((org) => org.plan === "Enterprise")
                    .length
                }
              </div>
              <p className="text-xs text-muted-foreground">Enterprise plans</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Domains</CardTitle>
              <Globe className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {organizations.length}
              </div>
              <p className="text-xs text-muted-foreground">Verified domains</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Search Organizations</CardTitle>
            <CardDescription>
              Find organizations by name or domain
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search organizations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Organizations Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              Organizations ({filteredOrganizations.length})
            </CardTitle>
            <CardDescription>
              Manage organizations and their configurations
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredOrganizations.length === 0 ? (
              <div className="text-center py-8">
                <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No organizations found
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm
                    ? "No organizations match your search."
                    : "Get started by adding your first organization."}
                </p>
                {!searchTerm && (
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Organization
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Organization</TableHead>
                      <TableHead>Domain</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Users</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrganizations.map((org) => (
                      <TableRow key={org.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                              <Building2 className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <div className="font-medium text-foreground">
                                {org.name}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                ID: {org.id}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{org.domain}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              org.plan === "Enterprise"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {org.plan}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span>{org.users}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="default">Active</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-muted-foreground">
                            {new Date(org.createdAt).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Edit Organization"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Organization Settings"
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
