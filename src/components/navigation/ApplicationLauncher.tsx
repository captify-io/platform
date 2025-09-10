"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../ui/popover";
import { Button } from "../ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import { Separator } from "../ui/separator";
import { ScrollArea } from "../ui/scroll-area";
import { Skeleton } from "../ui/skeleton";
import {
  Grid3X3,
  Star,
  Users,
  Shield,
  Activity,
  Settings,
  FileText,
  BarChart,
  Package,
  Layers,
  Search,
  Home,
  Loader2,
} from "lucide-react";
import { cn, apiClient } from "../../lib/utils";
import { useSession } from "next-auth/react";

// Application types
interface Application {
  id: string;
  name: string;
  description: string;
  icon?: React.ComponentType<{ className?: string }>;
  iconName?: string;
  href?: string;
  slug?: string;
  category?: string;
  isShared?: boolean;
  status?: string;
  tags?: string[];
}

// Categories from core types
const categories = [
  "Operations",
  "Analytics", 
  "Security",
  "Compliance",
  "Engineering",
  "Administration",
];

// Icon mapping from string names to components
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Activity,
  FileText,
  Shield,
  BarChart,
  Package,
  Settings,
  Layers,
  Grid3X3,
  Star,
  Users,
  Home,
  Search,
};

const getIconComponent = (iconName?: string) => {
  if (!iconName) return Grid3X3;
  return iconMap[iconName] || Grid3X3;
};

interface ApplicationLauncherProps {
  currentApplication?: {
    id: string;
    name: string;
  };
}

export function ApplicationLauncher({ currentApplication }: ApplicationLauncherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [selectedTab, setSelectedTab] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { data: session } = useSession();

  // Fetch user favorites from DynamoDB
  const fetchUserFavorites = useCallback(async () => {
    if (!session?.user?.id) {
      // Fall back to localStorage if no session
      const storedFavorites = localStorage.getItem("captify-app-favorites");
      if (storedFavorites) {
        setFavorites(JSON.parse(storedFavorites));
      }
      return;
    }

    try {
      // Query UserState table by userId
      const response = await apiClient.run({
        service: "dynamodb",
        operation: "query",
        app: "core",
        table: "UserState",
        data: {
          IndexName: "userId-index",
          KeyConditionExpression: "userId = :userId",
          ExpressionAttributeValues: {
            ":userId": session.user.id
          }
        }
      });

      if (response?.data?.Items?.length > 0) {
        const userState = response.data.Items[0];
        if (userState?.favoriteApps) {
          setFavorites(userState.favoriteApps);
        }
      }
    } catch (err) {
      console.error("Failed to fetch user favorites:", err);
      // Fall back to localStorage
      const storedFavorites = localStorage.getItem("captify-app-favorites");
      if (storedFavorites) {
        setFavorites(JSON.parse(storedFavorites));
      }
    }
  }, [session?.user?.id]);

  // Load favorites from user preferences and fetch applications
  useEffect(() => {
    // Fetch applications and user preferences when component opens
    if (isOpen) {
      fetchApplications();
      fetchUserFavorites();
    }
  }, [isOpen, fetchUserFavorites]);

  // Fetch applications from DynamoDB
  const fetchApplications = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.run({
        service: "dynamodb",
        operation: "scan",
        app: "core",
        table: "App",
      });
      
      console.log("ApplicationLauncher API Response:", response);
      
      // The actual data is in response.data.Items based on the DynamoDB response structure
      const items = response?.data?.Items || [];
      
      if (items && items.length > 0) {
        // Transform the data to match our Application interface
        const apps = items.map((item: any) => ({
          id: item.id || item.slug || item.name,
          name: item.name || item.title || "Unnamed App",
          description: item.description || "",
          iconName: item.icon || "Grid3X3",
          href: item.href || `/${item.slug || item.id || item.name}`,
          slug: item.slug || item.id,
          category: item.category || "Operations",
          isShared: item.isShared || false,
          status: item.status || "active",
          tags: item.tags || [],
        }));
        
        console.log("Transformed apps:", apps);
        
        // Filter only active applications
        const activeApps = apps.filter((app: Application) => app.status === "active");
        setApplications(activeApps);
      } else {
        console.log("No applications found in response");
        setApplications([]);
      }
    } catch (err) {
      console.error("Failed to fetch applications:", err);
      setError("Failed to load applications");
      setApplications([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Save favorites to DynamoDB and localStorage
  const toggleFavorite = async (appId: string) => {
    const newFavorites = favorites.includes(appId)
      ? favorites.filter(id => id !== appId)
      : [...favorites, appId];
    
    setFavorites(newFavorites);
    
    // Always save to localStorage for offline/anonymous users
    localStorage.setItem("captify-app-favorites", JSON.stringify(newFavorites));
    
    // If user is logged in, save to UserState in DynamoDB
    if (session?.user?.id) {
      try {
        // First check if UserState exists
        const queryResponse = await apiClient.run({
          service: "dynamodb",
          operation: "query",
          app: "core",
          table: "UserState",
          data: {
            IndexName: "userId-index",
            KeyConditionExpression: "userId = :userId",
            ExpressionAttributeValues: {
              ":userId": session.user.id
            }
          }
        });

        if (queryResponse?.data?.Items?.length > 0) {
          // Update existing UserState
          const userState = queryResponse.data.Items[0];
          await apiClient.run({
            service: "dynamodb",
            operation: "update",
            app: "core",
            table: "UserState",
            data: {
              key: {
                id: userState.id
              },
              updateExpression: "SET favoriteApps = :favorites, updatedAt = :updatedAt",
              expressionAttributeValues: {
                ":favorites": newFavorites,
                ":updatedAt": new Date().toISOString()
              }
            }
          });
        } else {
          // Create new UserState
          const newUserState = {
            id: `userstate-${session.user.id}-${Date.now()}`,
            slug: `userstate-${session.user.id}`,
            name: `UserState for ${session.user.email || session.user.id}`,
            app: "core",
            order: "0",
            fields: {},
            description: "User preferences and state",
            ownerId: session.user.id,
            createdAt: new Date().toISOString(),
            createdBy: session.user.id,
            updatedAt: new Date().toISOString(),
            updatedBy: session.user.id,
            userId: session.user.id,
            favoriteApps: newFavorites,
            recentApps: [],
            preferences: {}
          };

          await apiClient.run({
            service: "dynamodb",
            operation: "put",
            app: "core",
            table: "UserState",
            data: {
              item: newUserState
            }
          });
        }
      } catch (err) {
        console.error("Failed to save favorites to database:", err);
      }
    }
  };

  // Filter applications based on selected view
  const getFilteredApplications = () => {
    let filtered = applications;

    if (selectedTab === "favorites") {
      filtered = applications.filter(app => favorites.includes(app.id));
    } else if (selectedTab === "shared") {
      filtered = applications.filter(app => app.isShared);
    }

    if (selectedCategory) {
      filtered = filtered.filter(app => app.category === selectedCategory);
    }

    return filtered;
  };

  const filteredApps = getFilteredApplications();

  const ApplicationCard = ({ app }: { app: Application }) => {
    const Icon = app.icon || getIconComponent(app.iconName);
    const isFavorite = favorites.includes(app.id);
    const isCurrent = currentApplication?.id === app.id;

    return (
      <a
        href={app.href || `/${app.slug || app.id}`}
        className={cn(
          "block p-3 rounded-lg transition-all hover:bg-gray-100 dark:hover:bg-gray-800 group",
          isCurrent && "bg-blue-50 dark:bg-blue-950"
        )}
        onClick={() => setIsOpen(false)}
      >
        <div className="flex items-center gap-3">
          <Icon className="h-5 w-5 text-gray-600 dark:text-gray-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-sm truncate">{app.name}</h3>
              <Button
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleFavorite(app.id);
                }}
              >
                <Star
                  className={cn(
                    "h-4 w-4",
                    isFavorite ? "fill-yellow-400 text-yellow-400" : "text-gray-400 hover:text-yellow-400"
                  )}
                />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground truncate">{app.description}</p>
          </div>
        </div>
      </a>
    );
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-white hover:bg-gray-800 hover:text-white p-2"
        >
          <Grid3X3 className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[600px] p-0" align="start">
        <div className="flex h-[400px]">
          {/* Left Panel */}
          <div className="w-48 border-r bg-gray-50 dark:bg-gray-900 p-4">
            <div className="space-y-1">
              <Button
                variant={selectedTab === "all" && !selectedCategory ? "secondary" : "ghost"}
                size="sm"
                className="w-full justify-start"
                onClick={() => {
                  setSelectedTab("all");
                  setSelectedCategory(null);
                }}
              >
                <Home className="h-4 w-4 mr-2" />
                All
              </Button>
              <Button
                variant={selectedTab === "favorites" ? "secondary" : "ghost"}
                size="sm"
                className="w-full justify-start"
                onClick={() => {
                  setSelectedTab("favorites");
                  setSelectedCategory(null);
                }}
              >
                <Star className="h-4 w-4 mr-2" />
                Favorites
              </Button>
              <Button
                variant={selectedTab === "shared" ? "secondary" : "ghost"}
                size="sm"
                className="w-full justify-start"
                onClick={() => {
                  setSelectedTab("shared");
                  setSelectedCategory(null);
                }}
              >
                <Users className="h-4 w-4 mr-2" />
                Shared
              </Button>
              
              <Separator className="my-2" />
              
              <div className="text-xs font-medium text-muted-foreground mb-2">
                Categories
              </div>
              {categories.map(category => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "secondary" : "ghost"}
                  size="sm"
                  className="w-full justify-start text-xs"
                  onClick={() => {
                    setSelectedTab("all");
                    setSelectedCategory(category);
                  }}
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>

          {/* Right Panel - Applications Grid */}
          <div className="flex-1 p-4">
            <div className="mb-3">
              <h2 className="text-lg font-semibold">
                {selectedCategory || 
                  (selectedTab === "favorites" ? "Favorite Applications" : 
                   selectedTab === "shared" ? "Shared Applications" : 
                   "All Applications")}
              </h2>
              <p className="text-sm text-muted-foreground">
                {filteredApps.length} application{filteredApps.length !== 1 ? 's' : ''}
              </p>
            </div>
            
            <ScrollArea className="h-[320px]">
              {isLoading ? (
                <div className="space-y-2">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="p-3 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-5 w-5" />
                        <div className="flex-1">
                          <Skeleton className="h-4 w-32 mb-1" />
                          <Skeleton className="h-3 w-48" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-8">
                  <p className="text-sm text-red-500 mb-2">{error}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchApplications}
                  >
                    <Loader2 className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                </div>
              ) : filteredApps.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-8">
                  <Search className="h-12 w-12 text-gray-300 mb-3" />
                  <p className="text-sm text-muted-foreground">
                    {selectedTab === "favorites" 
                      ? "No favorite applications yet. Click the star icon to add favorites."
                      : "No applications found in this category."}
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredApps.map(app => (
                    <ApplicationCard key={app.id} app={app} />
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}