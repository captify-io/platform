"use client";

import { AppLayout } from "@captify/core";
import { Key, Plus, Search, Loader2, Shield, Users, Lock } from "lucide-react";
import { useEffect, useState } from "react";
import { UserRole } from "@captify/core";
import { useSession } from "next-auth/react";

interface RoleListProps {
  roles: UserRole[];
  loading: boolean;
  error?: string;
}

function RoleTable({ roles, loading, error }: RoleListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading roles...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-4">
        <p className="text-red-800">Error loading roles: {error}</p>
      </div>
    );
  }

  if (roles.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-gray-300 p-8 text-center">
        <Key className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No roles</h3>
        <p className="mt-1 text-sm text-gray-500">
          Get started by creating a new role.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <table className="w-full">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="h-12 px-4 text-left align-middle font-medium">
              Role
            </th>
            <th className="h-12 px-4 text-left align-middle font-medium">
              Description
            </th>
            <th className="h-12 px-4 text-left align-middle font-medium">
              Permissions
            </th>
            <th className="h-12 px-4 text-left align-middle font-medium">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {roles.map((role) => (
            <tr key={role.roleId} className="border-b">
              <td className="h-12 px-4 align-middle">
                <div className="flex items-center space-x-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100">
                    <Shield className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <div className="font-medium">{role.name}</div>
                    <div className="text-sm text-muted-foreground">
                      ID: {role.roleId.substring(0, 8)}...
                    </div>
                  </div>
                </div>
              </td>
              <td className="h-12 px-4 align-middle">
                <p className="text-sm text-muted-foreground max-w-xs truncate">
                  {role.description || "No description"}
                </p>
              </td>
              <td className="h-12 px-4 align-middle">
                <div className="flex items-center space-x-2">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {role.permissions.length} permissions
                  </span>
                  {role.permissions.length > 0 && (
                    <div className="flex space-x-1">
                      {role.permissions.slice(0, 3).map((permission, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800"
                        >
                          {permission}
                        </span>
                      ))}
                      {role.permissions.length > 3 && (
                        <span className="text-xs text-muted-foreground">
                          +{role.permissions.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </td>
              <td className="h-12 px-4 align-middle">
                <div className="flex items-center space-x-2">
                  <button
                    className="text-blue-600 hover:text-blue-500 text-sm"
                    onClick={() => console.log("Edit role:", role.roleId)}
                  >
                    Edit
                  </button>
                  <button
                    className="text-red-600 hover:text-red-500 text-sm"
                    onClick={() => console.log("Delete role:", role.roleId)}
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function RolesPage() {
  const { data: session } = useSession();
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function fetchRoles() {
      try {
        setLoading(true);
        // TODO: Implement role service
        // const roleService = new UserRoleService(session);
        // const data = await roleService.listRoles({
        //   searchName: searchTerm || undefined,
        // });
        // setRoles(data);
        setRoles([]); // Temporary empty array
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    if (session) {
      fetchRoles();
    }
  }, [session, searchTerm]);

  const handleCreateRole = () => {
    console.log("Create role");
  };

  return (
    <AppLayout applicationId="core" showMenu={true} showChat={true}>
      <div className="container mx-auto py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Roles & Permissions</h1>
          <p className="text-muted-foreground">
            Manage user roles and their associated permissions
          </p>
        </div>

        <div className="mb-6 flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div className="flex flex-1 items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                placeholder="Search roles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-64 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>

          <button
            onClick={handleCreateRole}
            className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Role
          </button>
        </div>

        <RoleTable roles={roles} loading={loading} error={error} />

        {/* Permission categories info */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4">
            Available Permission Categories
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="rounded-lg border p-4">
              <h3 className="font-medium text-sm mb-2">
                Platform Administration
              </h3>
              <p className="text-xs text-muted-foreground mb-2">
                Core platform management permissions
              </p>
              <div className="flex flex-wrap gap-1">
                <span className="inline-flex items-center rounded px-2 py-0.5 text-xs bg-purple-100 text-purple-800">
                  platform.admin
                </span>
                <span className="inline-flex items-center rounded px-2 py-0.5 text-xs bg-purple-100 text-purple-800">
                  system.monitor
                </span>
              </div>
            </div>

            <div className="rounded-lg border p-4">
              <h3 className="font-medium text-sm mb-2">
                Organization Management
              </h3>
              <p className="text-xs text-muted-foreground mb-2">
                Organization CRUD operations
              </p>
              <div className="flex flex-wrap gap-1">
                <span className="inline-flex items-center rounded px-2 py-0.5 text-xs bg-blue-100 text-blue-800">
                  organizations.read
                </span>
                <span className="inline-flex items-center rounded px-2 py-0.5 text-xs bg-blue-100 text-blue-800">
                  organizations.write
                </span>
              </div>
            </div>

            <div className="rounded-lg border p-4">
              <h3 className="font-medium text-sm mb-2">User Management</h3>
              <p className="text-xs text-muted-foreground mb-2">
                User administration permissions
              </p>
              <div className="flex flex-wrap gap-1">
                <span className="inline-flex items-center rounded px-2 py-0.5 text-xs bg-green-100 text-green-800">
                  users.read
                </span>
                <span className="inline-flex items-center rounded px-2 py-0.5 text-xs bg-green-100 text-green-800">
                  users.write
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
