"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Search, Star, Check, Lock, AppWindow, Filter, X } from "lucide-react";
import { apiClient } from "@captify-io/core/lib/api";
import { useRouter } from "next/navigation";

// Application interface
interface Application {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon?: string;
  category?: string;
  tags?: string[];
  visibility?: 'public' | 'internal' | 'private';
  status?: string;
  active?: string;
  version?: string;
  manifest?: any;
}

// Access request interface
interface AccessRequest {
  id: string;
  appId: string;
  userId: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
}

export default function MarketplacePage() {
  const router = useRouter();
  const { data: session } = useSession();

  // State
  const [applications, setApplications] = useState<Application[]>([]);
  const [filteredApps, setFilteredApps] = useState<Application[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>([]);
  const [requestingAccess, setRequestingAccess] = useState<string | null>(null);

  // Get user ID from session
  const userId = (session?.user as any)?.sub || (session as any)?.sub;

  // Fetch applications
  useEffect(() => {
    fetchApplications();
    fetchAccessRequests();
  }, []);

  const fetchApplications = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.run({
        service: "platform.dynamodb",
        operation: "scan",
        table: "core-app",
      });

      const items = response?.data?.Items || [];

      const apps = items.map((item: any) => {
        // Parse manifest if it's a JSON string
        let manifest = item.manifest;
        if (typeof manifest === 'string') {
          try {
            manifest = JSON.parse(manifest);
          } catch {
            manifest = {};
          }
        }

        return {
          id: item.id || item.slug,
          slug: item.slug,
          name: item.name || "Unnamed App",
          description: item.description || "",
          icon: manifest?.icon || item.icon || "AppWindow",
          category: manifest?.category || item.category || "other",
          tags: manifest?.tags || item.tags || [],
          visibility: manifest?.visibility || 'internal',
          status: item.status,
          active: item.active,
          version: item.version || "1.0.0",
          manifest,
        };
      });

      // Filter only active apps
      const activeApps = apps.filter((app: Application) =>
        app.active === "true" || app.status === "active"
      );

      setApplications(activeApps);
      setFilteredApps(activeApps);
    } catch (error) {
      console.error("Failed to fetch applications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAccessRequests = async () => {
    if (!userId) return;

    try {
      const response = await apiClient.run({
        service: "platform.dynamodb",
        operation: "query",
        table: "core-app-access-request",
        data: {
          IndexName: "userId-index",
          KeyConditionExpression: "userId = :userId",
          ExpressionAttributeValues: {
            ":userId": userId,
          },
        },
      });

      setAccessRequests(response?.data?.Items || []);
    } catch (error) {
      console.error("Failed to fetch access requests:", error);
    }
  };

  // Handle search and filtering
  useEffect(() => {
    let filtered = applications;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(app =>
        app.name.toLowerCase().includes(query) ||
        app.description.toLowerCase().includes(query) ||
        app.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Category filter
    if (selectedCategory) {
      filtered = filtered.filter(app => app.category === selectedCategory);
    }

    setFilteredApps(filtered);
  }, [searchQuery, selectedCategory, applications]);

  // Get unique categories
  const categories = Array.from(new Set(applications.map(app => app.category)));

  // Check if user has requested access to an app
  const hasRequestedAccess = (appId: string) => {
    return accessRequests.some(req =>
      req.appId === appId && req.status === 'pending'
    );
  };

  // Check if user has access to an app
  const hasAccess = (app: Application) => {
    return app.visibility === 'public';
  };

  // Request access to an app
  const requestAccess = async (app: Application) => {
    if (!userId) return;

    setRequestingAccess(app.id);
    try {
      await apiClient.run({
        service: "platform.dynamodb",
        operation: "put",
        table: "core-app-access-request",
        data: {
          Item: {
            id: `access-${Date.now()}-${Math.random().toString(36).substring(7)}`,
            appId: app.id,
            appSlug: app.slug,
            appName: app.name,
            userId: userId,
            userEmail: session?.user?.email,
            userName: session?.user?.name,
            status: 'pending',
            requestedAt: new Date().toISOString(),
            message: `Access request for ${app.name}`,
          },
        },
      });

      // Refresh access requests
      await fetchAccessRequests();
    } catch (error) {
      console.error("Failed to request access:", error);
    } finally {
      setRequestingAccess(null);
    }
  };

  // Launch app
  const launchApp = (app: Application) => {
    router.push(`/${app.slug}`);
  };

  return (
    <div className="h-full w-full overflow-auto">
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">App Marketplace</h1>
          <p className="text-muted-foreground">
            Discover and access applications across the platform
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search applications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Category Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                selectedCategory === null
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              All
            </button>
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1 rounded-full text-sm capitalize transition-colors ${
                  selectedCategory === category
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4 text-sm text-muted-foreground">
          {filteredApps.length} {filteredApps.length === 1 ? 'application' : 'applications'} found
        </div>

        {/* Applications Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="border rounded-lg p-6 animate-pulse">
                <div className="h-12 w-12 bg-muted rounded-lg mb-4" />
                <div className="h-6 bg-muted rounded w-3/4 mb-2" />
                <div className="h-4 bg-muted rounded w-full mb-1" />
                <div className="h-4 bg-muted rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : filteredApps.length === 0 ? (
          <div className="text-center py-12">
            <AppWindow className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No applications found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search or filters
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredApps.map(app => {
              const userHasAccess = hasAccess(app);
              const hasPendingRequest = hasRequestedAccess(app.id);
              const isRequesting = requestingAccess === app.id;

              return (
                <div
                  key={app.id}
                  className="border rounded-lg p-6 hover:shadow-lg transition-shadow"
                >
                  {/* App Icon & Title */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <AppWindow className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg mb-1 truncate">{app.name}</h3>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="capitalize">{app.category}</span>
                        <span>•</span>
                        <span>v{app.version}</span>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {app.description}
                  </p>

                  {/* Tags */}
                  {app.tags && app.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {app.tags.slice(0, 3).map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 text-xs bg-muted rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Access Status & Actions */}
                  <div className="pt-4 border-t">
                    {userHasAccess ? (
                      <button
                        onClick={() => launchApp(app)}
                        className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 flex items-center justify-center gap-2"
                      >
                        <Check className="h-4 w-4" />
                        Launch App
                      </button>
                    ) : hasPendingRequest ? (
                      <div className="w-full px-4 py-2 bg-muted text-muted-foreground rounded-lg flex items-center justify-center gap-2">
                        <Star className="h-4 w-4" />
                        Access Requested
                      </div>
                    ) : (
                      <button
                        onClick={() => requestAccess(app)}
                        disabled={isRequesting}
                        className="w-full px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        <Lock className="h-4 w-4" />
                        {isRequesting ? "Requesting..." : "Request Access"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
