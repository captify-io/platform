"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import type { Session } from "next-auth";
import {
  AppWindow,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Settings,
  Users,
  Shield,
} from "lucide-react";
import type { AppRegistryEntry } from "../../../types/app-config";

// Helper to get user's groups
function getUserGroups(session: Session | null): string[] {
  if (!session) return [];
  const userGroups = (session.user as any)?.groups;
  if (userGroups && userGroups.length > 0) {
    return userGroups;
  }
  const sessionGroups = (session as any).groups;
  if (sessionGroups && sessionGroups.length > 0) {
    return sessionGroups;
  }
  return [];
}

export default function AdminAppsPage() {
  const { data: session } = useSession();
  const [apps, setApps] = useState<AppRegistryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterVisibility, setFilterVisibility] = useState<string>("all");

  // Check if user has admin access
  const userGroups = getUserGroups(session);
  const hasAdminAccess = userGroups.includes("captify-admin");

  useEffect(() => {
    loadApps();
  }, []);

  async function loadApps() {
    setLoading(true);
    try {
      const response = await fetch('/api/app/registry');
      if (!response.ok) {
        throw new Error('Failed to load apps');
      }
      const data = await response.json();
      setApps(data.apps || []);
    } catch (error) {
      console.error('Error loading apps:', error);
    } finally {
      setLoading(false);
    }
  }

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
            You do not have permission to access app management.
          </p>
        </div>
      </div>
    );
  }

  // Filter apps based on search and filters
  const filteredApps = apps.filter(app => {
    const matchesSearch = app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = filterCategory === "all" ||
      app.manifest?.category === filterCategory;

    const matchesVisibility = filterVisibility === "all" ||
      (app.manifest?.visibility || 'internal') === filterVisibility;

    return matchesSearch && matchesCategory && matchesVisibility;
  });

  // Get unique categories for filter
  const categories = Array.from(new Set(apps.map(app => app.manifest?.category).filter(Boolean))) as string[];

  return (
    <div className="h-screen w-full bg-background p-6 overflow-auto">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">App Management</h1>
            <p className="text-muted-foreground">
              Manage platform applications and access control
            </p>
          </div>
          <button
            onClick={loadApps}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh Registry
          </button>
        </div>

        {/* Filters */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search apps..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background"
            />
          </div>

          {/* Category Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background appearance-none"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Visibility Filter */}
          <div className="relative">
            <Eye className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <select
              value={filterVisibility}
              onChange={(e) => setFilterVisibility(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background appearance-none"
            >
              <option value="all">All Visibility</option>
              <option value="public">Public</option>
              <option value="internal">Internal</option>
              <option value="private">Private</option>
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="border rounded-lg p-4 bg-card">
            <div className="flex items-center gap-2 mb-2">
              <AppWindow className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Total Apps</span>
            </div>
            <p className="text-2xl font-bold">{apps.length}</p>
          </div>

          <div className="border rounded-lg p-4 bg-card">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Valid</span>
            </div>
            <p className="text-2xl font-bold text-green-500">
              {apps.filter(a => a.isValid).length}
            </p>
          </div>

          <div className="border rounded-lg p-4 bg-card">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-4 w-4 text-destructive" />
              <span className="text-sm font-medium">Invalid</span>
            </div>
            <p className="text-2xl font-bold text-destructive">
              {apps.filter(a => !a.isValid).length}
            </p>
          </div>

          <div className="border rounded-lg p-4 bg-card">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Public</span>
            </div>
            <p className="text-2xl font-bold text-blue-500">
              {apps.filter(a => a.manifest?.visibility === 'public').length}
            </p>
          </div>
        </div>

        {/* App List */}
        {loading ? (
          <div className="text-center py-12">
            <RefreshCw className="h-8 w-8 mx-auto mb-4 text-primary animate-spin" />
            <p className="text-muted-foreground">Loading apps...</p>
          </div>
        ) : filteredApps.length === 0 ? (
          <div className="text-center py-12 border border-dashed rounded-lg">
            <AppWindow className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No apps found</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredApps.map(app => (
              <div
                key={app.slug}
                className="border rounded-lg p-6 bg-card hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between">
                  {/* App Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold">{app.name}</h3>
                      <span className="text-sm text-muted-foreground">v{app.version}</span>
                      {!app.isValid && (
                        <span className="px-2 py-1 bg-destructive/10 text-destructive text-xs rounded">
                          Invalid Config
                        </span>
                      )}
                      <span className={`px-2 py-1 text-xs rounded ${
                        app.manifest?.visibility === 'public'
                          ? 'bg-green-500/10 text-green-500'
                          : app.manifest?.visibility === 'private'
                          ? 'bg-red-500/10 text-red-500'
                          : 'bg-blue-500/10 text-blue-500'
                      }`}>
                        {app.manifest?.visibility || 'internal'}
                      </span>
                      {app.manifest?.category && (
                        <span className="px-2 py-1 bg-muted text-xs rounded">
                          {app.manifest.category}
                        </span>
                      )}
                    </div>
                    <p className="text-muted-foreground mb-3">{app.description}</p>

                    {/* Slug */}
                    <div className="flex items-center gap-2 mb-2">
                      <code className="text-sm bg-muted px-2 py-1 rounded">/{app.slug}</code>
                    </div>

                    {/* Validation Errors */}
                    {!app.isValid && app.validationErrors && app.validationErrors.length > 0 && (
                      <div className="mt-3 p-3 bg-destructive/5 border border-destructive/20 rounded">
                        <p className="text-sm font-medium text-destructive mb-1">Configuration Errors:</p>
                        <ul className="text-sm text-destructive/80 list-disc list-inside">
                          {app.validationErrors.map((error, i) => (
                            <li key={i}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Menu Items */}
                    {app.menu && app.menu.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm font-medium mb-2">Menu Items:</p>
                        <div className="flex flex-wrap gap-2">
                          {app.menu.map((item, i) => (
                            <span key={i} className="text-xs bg-muted px-2 py-1 rounded">
                              {item.label}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 ml-6">
                    <button
                      onClick={() => window.location.href = `/${app.slug}`}
                      className="flex items-center gap-2 px-3 py-2 border border-border rounded hover:bg-muted text-sm"
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </button>
                    <button
                      className="flex items-center gap-2 px-3 py-2 border border-border rounded hover:bg-muted text-sm"
                    >
                      <Settings className="h-4 w-4" />
                      Configure
                    </button>
                    <button
                      className="flex items-center gap-2 px-3 py-2 border border-border rounded hover:bg-muted text-sm"
                    >
                      <Users className="h-4 w-4" />
                      Members
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
