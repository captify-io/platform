"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Input, Button, Badge, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, apiClient } from "@captify-io/core";
import { Search, Grid, List, Filter, RefreshCw, AppWindow } from "lucide-react";
import { AppCard, AppCardCompact } from "@/components/app-card";
import type { AppRegistryEntry } from "@/types/app-config";

export default function AppCatalogPage() {
  const [apps, setApps] = useState<AppRegistryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedVisibility, setSelectedVisibility] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [refreshing, setRefreshing] = useState(false);

  // Load apps using apiClient
  const loadApps = async (refresh = false) => {
    try {
      if (refresh) setRefreshing(true);
      else setLoading(true);

      const response = await apiClient.run({
        service: 'platform.app',
        operation: 'getApps',
        data: { refresh }
      });

      if (response.success && response.data) {
        setApps(response.data.apps || []);
      }
    } catch (error) {
      console.error('Error loading apps:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadApps();
  }, []);

  // Extract unique categories and visibility levels
  const categories = useMemo(() => {
    const cats = new Set(apps.map(app => app.manifest?.category || 'productivity'));
    return Array.from(cats).sort();
  }, [apps]);

  const visibilityLevels = useMemo(() => {
    const levels = new Set(apps.map(app => app.manifest?.visibility || 'internal'));
    return Array.from(levels).sort();
  }, [apps]);

  // Filter and search apps
  const filteredApps = useMemo(() => {
    return apps.filter(app => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery ||
        app.name.toLowerCase().includes(searchLower) ||
        app.description.toLowerCase().includes(searchLower) ||
        app.slug.toLowerCase().includes(searchLower) ||
        (app.manifest?.tags || []).some(tag => tag.toLowerCase().includes(searchLower));

      // Category filter
      const appCategory = app.manifest?.category || 'productivity';
      const matchesCategory = selectedCategory === 'all' || appCategory === selectedCategory;

      // Visibility filter
      const appVisibility = app.manifest?.visibility || 'internal';
      const matchesVisibility = selectedVisibility === 'all' || appVisibility === selectedVisibility;

      // Only show valid apps by default (can be toggled in future)
      const isValid = app.isValid !== false;

      return matchesSearch && matchesCategory && matchesVisibility && isValid;
    });
  }, [apps, searchQuery, selectedCategory, selectedVisibility]);

  // Stats
  const stats = useMemo(() => {
    return {
      total: apps.length,
      valid: apps.filter(a => a.isValid !== false).length,
      invalid: apps.filter(a => a.isValid === false).length,
      public: apps.filter(a => a.manifest?.visibility === 'public').length,
      internal: apps.filter(a => a.manifest?.visibility === 'internal').length,
      private: apps.filter(a => a.manifest?.visibility === 'private').length,
    };
  }, [apps]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AppWindow className="w-12 h-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
          <p className="text-muted-foreground">Loading applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold mb-2">App Catalog</h1>
            <p className="text-lg text-muted-foreground">
              Discover and launch platform applications
            </p>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => loadApps(true)}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap gap-3">
          <Badge variant="outline" className="px-3 py-1">
            <span className="font-semibold">{stats.total}</span>
            <span className="ml-1 text-muted-foreground">Total Apps</span>
          </Badge>
          <Badge variant="outline" className="px-3 py-1 bg-green-500/10 text-green-600 border-green-500/20">
            <span className="font-semibold">{stats.public}</span>
            <span className="ml-1">Public</span>
          </Badge>
          <Badge variant="outline" className="px-3 py-1 bg-blue-500/10 text-blue-600 border-blue-500/20">
            <span className="font-semibold">{stats.internal}</span>
            <span className="ml-1">Internal</span>
          </Badge>
          <Badge variant="outline" className="px-3 py-1 bg-purple-500/10 text-purple-600 border-purple-500/20">
            <span className="font-semibold">{stats.private}</span>
            <span className="ml-1">Private</span>
          </Badge>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search apps by name, description, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* View Mode Toggle */}
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Visibility Filter */}
          <div className="flex items-center gap-2">
            <Select value={selectedVisibility} onValueChange={setSelectedVisibility}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Visibility" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Visibility</SelectItem>
                {visibilityLevels.map(level => (
                  <SelectItem key={level} value={level}>
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Active Filters Count */}
          {(searchQuery || selectedCategory !== 'all' || selectedVisibility !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setSelectedVisibility('all');
              }}
            >
              Clear filters
            </Button>
          )}
        </div>

        {/* Results count */}
        <div className="text-sm text-muted-foreground">
          Showing <span className="font-semibold">{filteredApps.length}</span> of <span className="font-semibold">{stats.valid}</span> apps
        </div>
      </div>

      {/* Apps Grid/List */}
      {filteredApps.length === 0 ? (
        <div className="text-center py-12">
          <AppWindow className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
          <h3 className="text-lg font-semibold mb-2">No apps found</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery || selectedCategory !== 'all' || selectedVisibility !== 'all'
              ? 'Try adjusting your filters or search query'
              : 'No applications are currently available'}
          </p>
          {(searchQuery || selectedCategory !== 'all' || selectedVisibility !== 'all') && (
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setSelectedVisibility('all');
              }}
            >
              Clear all filters
            </Button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredApps.map((app) => (
            <AppCard key={app.slug} app={app} showLaunchButton showDetails />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredApps.map((app) => (
            <AppCardCompact key={app.slug} app={app} />
          ))}
        </div>
      )}
    </div>
  );
}
