"use client";

import { AppLayout } from "@captify/core";
import { Building, Users, Settings, Plus, Search, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Organization } from "@captify/core";
import { OrganizationService } from "../services/OrganizationService";
import { useSession } from "next-auth/react";

interface OrganizationListProps {
  organizations: Organization[];
  loading: boolean;
  error?: string;
}

function OrganizationTable({
  organizations,
  loading,
  error,
}: OrganizationListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading organizations...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-4">
        <p className="text-red-800">Error loading organizations: {error}</p>
      </div>
    );
  }

  if (organizations.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-gray-300 p-8 text-center">
        <Building className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">
          No organizations
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Get started by creating a new organization.
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
              Organization
            </th>
            <th className="h-12 px-4 text-left align-middle font-medium">
              Domain
            </th>
            <th className="h-12 px-4 text-left align-middle font-medium">
              Status
            </th>
            <th className="h-12 px-4 text-left align-middle font-medium">
              Tier
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
          {organizations.map((org) => (
            <tr key={org.orgId} className="border-b">
              <td className="p-4">
                <div className="flex items-center space-x-3">
                  <Building className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{org.displayName}</div>
                    <div className="text-sm text-muted-foreground">
                      {org.name}
                    </div>
                  </div>
                </div>
              </td>
              <td className="p-4 text-sm">{org.domain}</td>
              <td className="p-4">
                <span
                  className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                    org.status === "active"
                      ? "bg-green-100 text-green-800"
                      : org.status === "suspended"
                      ? "bg-red-100 text-red-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {org.status}
                </span>
              </td>
              <td className="p-4">
                <span
                  className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                    org.subscriptionTier === "enterprise"
                      ? "bg-purple-100 text-purple-800"
                      : org.subscriptionTier === "business"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {org.subscriptionTier}
                </span>
              </td>
              <td className="p-4 text-sm text-muted-foreground">
                {new Date().toLocaleDateString()}{" "}
                {/* TODO: Add createdAt to Organization type */}
              </td>
              <td className="p-4">
                <button
                  className="inline-flex items-center justify-center rounded-md p-2 hover:bg-muted"
                  onClick={() => console.log("Edit organization:", org.orgId)}
                >
                  <Settings className="h-4 w-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function OrganizationsPage() {
  const { data: session } = useSession();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function fetchOrganizations() {
      try {
        setLoading(true);
        const organizationService = new OrganizationService(session);
        const data = await organizationService.listOrganizations();
        setOrganizations(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    if (session) {
      fetchOrganizations();
    }
  }, [session]);

  const handleCreateOrganization = () => {
    // TODO: Open create organization modal/page
    console.log("Create organization");
  };

  const handleEditOrganization = (orgId: string) => {
    // TODO: Navigate to organization details page
    console.log("Edit organization:", orgId);
  };

  const filteredOrganizations = organizations.filter(
    (org) =>
      org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.domain.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AppLayout applicationId="core" showMenu={true} showChat={true}>
      <div className="flex-1 space-y-6 p-8 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Organizations</h2>
            <p className="text-muted-foreground">
              Manage organizations and their settings
            </p>
          </div>
          <button
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            onClick={handleCreateOrganization}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Organization
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              placeholder="Search organizations..."
              className="pl-8 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <OrganizationTable
          organizations={filteredOrganizations}
          loading={loading}
          error={error}
        />
      </div>
    </AppLayout>
  );
}
