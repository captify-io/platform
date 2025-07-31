"use client";

import { useState, type ReactNode } from "react";
import { X, Star, Clock } from "lucide-react";
import { DynamicIcon } from "@/components/ui/dynamic-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter } from "next/navigation";
import { useApps } from "@/context/AppsContext";
import { Application, APPLICATION_CATEGORIES } from "@/types/application";

interface ApplicationDisplayData {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: ReactNode;
  color: string;
  href: string;
  isRecent?: boolean;
  isFavorite?: boolean;
  isAwsNative?: boolean;
  status: string;
  tags: string[];
  userRating: number;
  totalUsers: number;
}

interface ApplicationMenuProps {
  onClose: () => void;
  onSelect: (app: ApplicationDisplayData) => void;
}

export function ApplicationMenu({ onClose, onSelect }: ApplicationMenuProps) {
  const router = useRouter();
  const {
    demoApplications,
    favoriteApps,
    recentApps,
    toggleFavorite,
    markAsRecent,
  } = useApps();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  // Transform demo applications to display format
  const apps: ApplicationDisplayData[] = demoApplications.map(
    (app: Application) => ({
      id: app.metadata.alias,
      name: app.metadata.name,
      description: app.metadata.description,
      category:
        APPLICATION_CATEGORIES[app.metadata.category]?.label ||
        app.metadata.category,
      icon: <DynamicIcon name={app.metadata.icon} className="h-5 w-5" />,
      color: app.metadata.color,
      href: `/apps/${app.metadata.alias}`,
      isRecent: recentApps.includes(app.metadata.alias),
      isFavorite: favoriteApps.includes(app.metadata.alias),
      isAwsNative: false, // These are all agentic applications
      status: app.metadata.status,
      tags: app.metadata.tags,
      userRating: app.usage.userRatings.average,
      totalUsers: app.usage.totalUsers,
    })
  );

  const filteredApplications = apps.filter((app) => {
    const matchesSearch =
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.tags.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      );

    if (activeTab === "all") return matchesSearch;
    if (activeTab === "favorites") return matchesSearch && app.isFavorite;
    if (activeTab === "recent") return matchesSearch && app.isRecent;
    if (activeTab === "agentic") return matchesSearch && !app.isAwsNative;

    return matchesSearch;
  });

  const handleAppClick = (app: ApplicationDisplayData) => {
    markAsRecent(app.id);
    onSelect(app);
    router.push(app.href);
    onClose();
  };

  const handleFavoriteClick = (e: React.MouseEvent, appId: string) => {
    e.stopPropagation();
    toggleFavorite(appId);
  };

  const recentAppsData = apps.filter((app) => app.isRecent);
  const favoriteAppsData = apps.filter((app) => app.isFavorite);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              All Applications
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {apps.length} AI-powered applications available
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="p-1 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Search */}
        <div className="p-6 border-b border-gray-200">
          <Input
            type="text"
            placeholder="Search applications, categories, or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="flex w-full justify-start p-6 pb-0 bg-transparent">
              <TabsTrigger value="all" className="px-4 py-2">
                All ({apps.length})
              </TabsTrigger>
              <TabsTrigger value="favorites" className="px-4 py-2">
                <Star className="w-4 h-4 mr-1" />
                Favorites ({favoriteAppsData.length})
              </TabsTrigger>
              <TabsTrigger value="recent" className="px-4 py-2">
                <Clock className="w-4 h-4 mr-1" />
                Recent ({recentAppsData.length})
              </TabsTrigger>
              <TabsTrigger value="agentic" className="px-4 py-2">
                Agentic ({apps.filter((app) => !app.isAwsNative).length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="p-6 pt-4">
              {filteredApplications.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <p className="text-gray-500 mb-2">No applications found</p>
                    {searchQuery && (
                      <p className="text-sm text-gray-400">
                        Try adjusting your search terms
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredApplications.map((app) => (
                    <div
                      key={app.id}
                      className="group relative bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-all duration-200 cursor-pointer hover:border-gray-300"
                      onClick={() => handleAppClick(app)}
                    >
                      {/* Favorite Button */}
                      <button
                        onClick={(e) => handleFavoriteClick(e, app.id)}
                        className={`absolute top-4 right-4 p-1 rounded-full transition-colors ${
                          app.isFavorite
                            ? "text-yellow-500 hover:text-yellow-600"
                            : "text-gray-400 hover:text-yellow-500"
                        }`}
                      >
                        <Star
                          className={`w-4 h-4 ${
                            app.isFavorite ? "fill-current" : ""
                          }`}
                        />
                      </button>

                      {/* App Icon and Header */}
                      <div className="flex items-start space-x-4 mb-4">
                        <div
                          className={`${app.color} p-3 rounded-lg flex-shrink-0 text-white`}
                        >
                          {app.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                            {app.name}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {app.category}
                          </p>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {app.description}
                      </p>

                      {/* Status and Tags */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        <Badge
                          variant={
                            app.status === "active" ? "default" : "secondary"
                          }
                          className="text-xs"
                        >
                          {app.status}
                        </Badge>
                        {app.tags.slice(0, 2).map((tag) => (
                          <Badge
                            key={tag}
                            variant="outline"
                            className="text-xs"
                          >
                            {tag}
                          </Badge>
                        ))}
                        {app.tags.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{app.tags.length - 2}
                          </Badge>
                        )}
                      </div>

                      {/* Footer with metrics */}
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center space-x-3">
                          {app.userRating > 0 && (
                            <span className="flex items-center">
                              <Star className="w-3 h-3 fill-current text-yellow-400 mr-1" />
                              {app.userRating.toFixed(1)}
                            </span>
                          )}
                          <span>{app.totalUsers} users</span>
                        </div>
                        {(app.isRecent || app.isFavorite) && (
                          <div className="flex space-x-1">
                            {app.isRecent && (
                              <Clock className="w-3 h-3 text-blue-500" />
                            )}
                            {app.isFavorite && (
                              <Star className="w-3 h-3 fill-current text-yellow-500" />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
