"use client";

import { AppLayout, DynamicIcon } from "@captify/core";
import { useEffect, useState } from "react";
import { User } from "@captify/core";
import { useSession } from "next-auth/react";

interface UserListProps {
  users: User[];
  loading: boolean;
  error?: string;
}

function UserTable({ users, loading, error }: UserListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <DynamicIcon name="loader-2" className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading users...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-4">
        <p className="text-red-800">Error loading users: {error}</p>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-gray-300 p-8 text-center">
        <DynamicIcon name="users" className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No users</h3>
        <p className="mt-1 text-sm text-gray-500">
          Get started by creating a new user.
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
              User
            </th>
            <th className="h-12 px-4 text-left align-middle font-medium">
              Email
            </th>
            <th className="h-12 px-4 text-left align-middle font-medium">
              Organization
            </th>
            <th className="h-12 px-4 text-left align-middle font-medium">
              Role
            </th>
            <th className="h-12 px-4 text-left align-middle font-medium">
              Status
            </th>
            <th className="h-12 px-4 text-left align-middle font-medium">
              Created
            </th>
            <th className="h-12 px-4 text-left align-middle font-medium">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.userId} className="border-b">
              <td className="h-12 px-4 align-middle">
                <div className="flex items-center space-x-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                    <DynamicIcon
                      name="users"
                      className="h-4 w-4 text-blue-600"
                    />
                  </div>
                  <div>
                    <div className="font-medium">{user.name || "Unknown"}</div>
                    <div className="text-sm text-muted-foreground">
                      ID: {user.userId.substring(0, 8)}...
                    </div>
                  </div>
                </div>
              </td>
              <td className="h-12 px-4 align-middle">
                <div className="flex items-center">
                  <DynamicIcon
                    name="mail"
                    className="mr-2 h-4 w-4 text-muted-foreground"
                  />
                  {user.email}
                </div>
              </td>
              <td className="h-12 px-4 align-middle">
                <div className="flex items-center">
                  <DynamicIcon
                    name="building"
                    className="mr-2 h-4 w-4 text-muted-foreground"
                  />
                  {user.orgId || "None"}
                </div>
              </td>
              <td className="h-12 px-4 align-middle">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    user.role === "admin"
                      ? "bg-purple-100 text-purple-800"
                      : user.role === "member"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {user.role}
                </span>
              </td>
              <td className="h-12 px-4 align-middle">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    user.status === "active"
                      ? "bg-green-100 text-green-800"
                      : user.status === "pending"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {user.status === "active" && (
                    <DynamicIcon name="user-check" className="mr-1 h-3 w-3" />
                  )}
                  {user.status === "suspended" && (
                    <DynamicIcon name="user-x" className="mr-1 h-3 w-3" />
                  )}
                  {user.status}
                </span>
              </td>
              <td className="h-12 px-4 align-middle text-sm text-muted-foreground">
                {new Date(user.createdAt).toLocaleDateString()}
              </td>
              <td className="h-12 px-4 align-middle">
                <button
                  className="text-blue-600 hover:text-blue-500"
                  onClick={() => console.log("Edit user:", user.userId)}
                >
                  Edit
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function UsersPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "pending" | "suspended"
  >("all");
  const [roleFilter, setRoleFilter] = useState<
    "all" | "admin" | "member" | "viewer"
  >("all");

  useEffect(() => {
    async function fetchUsers() {
      try {
        setLoading(true);
        // TODO: Implement user service
        // const userService = new UserService(session);
        // const params: any = {};

        // if (statusFilter !== "all") {
        //   params.status = statusFilter;
        // }
        // if (roleFilter !== "all") {
        //   params.role = roleFilter;
        // }

        // const data = await userService.listUsers(params);
        // setUsers(data);
        setUsers([]); // Temporary empty array
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    if (session) {
      fetchUsers();
    }
  }, [session, statusFilter, roleFilter]);

  const handleCreateUser = () => {
    console.log("Create user");
  };

  // Filter users based on search term
  const filteredUsers = users.filter(
    (user) =>
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <AppLayout applicationId="core" showMenu={true} showChat={true}>
      <div className="container mx-auto py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Users</h1>
          <p className="text-muted-foreground">
            Manage platform users and their permissions
          </p>
        </div>

        <div className="mb-6 flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div className="flex flex-1 items-center space-x-4">
            <div className="relative">
              <DynamicIcon
                name="search"
                className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground"
              />
              <input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-64 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="suspended">Suspended</option>
            </select>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="member">Member</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>

          <button
            onClick={handleCreateUser}
            className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
          >
            <DynamicIcon name="plus" className="mr-2 h-4 w-4" />
            Add User
          </button>
        </div>

        <UserTable users={filteredUsers} loading={loading} error={error} />
      </div>
    </AppLayout>
  );
}
