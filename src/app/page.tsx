"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useCaptify, LoadingScreen } from "@captify-io/core/components";
import { apiClient } from "@captify-io/core/lib";
import Link from "next/link";
import { Home, Settings, User, Bell, Bookmark, Clock } from "lucide-react";

export default function HomePage() {
  const { data: session } = useSession();
  const { userState } = useCaptify();
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApps = async () => {
      try {
        const response = await apiClient.run({
          service: "platform.dynamodb",
          operation: "scan",
          table: "captify-core-App",
          data: {
            FilterExpression: "#status = :status",
            ExpressionAttributeNames: {
              "#status": "status",
            },
            ExpressionAttributeValues: {
              ":status": "active",
            },
          },
        });

        if (response.success && response.data?.Items) {
          setApps(response.data.Items);
        }
      } catch (error) {
        console.error("Error fetching apps:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchApps();
  }, []);

  const favoriteApps = apps.filter((app) =>
    userState?.preferences?.favoriteApps?.includes(app.id)
  );

  const recentApps = apps.filter((app) =>
    userState?.preferences?.recentApps?.includes(app.id)
  );

  return (
    <div className="h-full w-full p-8 overflow-auto">
      <div className="max-w-7xl mx-auto">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            Welcome back, {session?.user?.name || "User"}
          </h1>
          <p className="text-muted-foreground">
            {session?.user?.email}
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-card border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Home className="h-5 w-5 text-primary" />
              </div>
              <div className="text-sm font-medium text-muted-foreground">
                Available Apps
              </div>
            </div>
            <div className="text-3xl font-bold">{apps.length}</div>
          </div>

          <div className="bg-card border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Bookmark className="h-5 w-5 text-blue-500" />
              </div>
              <div className="text-sm font-medium text-muted-foreground">
                Favorites
              </div>
            </div>
            <div className="text-3xl font-bold">
              {favoriteApps.length}
            </div>
          </div>

          <div className="bg-card border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Clock className="h-5 w-5 text-green-500" />
              </div>
              <div className="text-sm font-medium text-muted-foreground">
                Recent
              </div>
            </div>
            <div className="text-3xl font-bold">
              {recentApps.length}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link
              href="/profile"
              className="flex items-center gap-4 p-4 border rounded-lg hover:bg-accent transition-colors"
            >
              <div className="p-3 bg-primary/10 rounded-lg">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="font-semibold">Profile</div>
                <div className="text-sm text-muted-foreground">
                  View and edit your profile
                </div>
              </div>
            </Link>

            <Link
              href="/admin"
              className="flex items-center gap-4 p-4 border rounded-lg hover:bg-accent transition-colors"
            >
              <div className="p-3 bg-orange-500/10 rounded-lg">
                <Settings className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <div className="font-semibold">Admin</div>
                <div className="text-sm text-muted-foreground">
                  Manage applications
                </div>
              </div>
            </Link>

            <Link
              href="/agent"
              className="flex items-center gap-4 p-4 border rounded-lg hover:bg-accent transition-colors"
            >
              <div className="p-3 bg-purple-500/10 rounded-lg">
                <Bell className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <div className="font-semibold">AI Agent</div>
                <div className="text-sm text-muted-foreground">
                  Chat with AI assistant
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Favorite Apps */}
        {favoriteApps.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Favorite Apps</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {favoriteApps.map((app) => (
                <a
                  key={app.id}
                  href={`/${app.slug}`}
                  className="flex items-center gap-4 p-4 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Home className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold">{app.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {app.description || "No description"}
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* All Apps */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">All Applications</h2>
          {loading ? (
            <LoadingScreen message="Loading applications..." />
          ) : apps.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No applications available
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {apps.map((app) => (
                <a
                  key={app.id}
                  href={`/${app.slug}`}
                  className="flex items-center gap-4 p-4 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="p-3 bg-accent rounded-lg">
                    <Home className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">{app.name}</div>
                    <div className="text-sm text-muted-foreground truncate">
                      {app.description || "No description"}
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
