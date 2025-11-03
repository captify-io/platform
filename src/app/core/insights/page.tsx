"use client";

import { } from "@captify-io/core";
import { Card } from "@captify-io/core/ui/card";
import { useEffect, useState } from "react";
import { Star, Clock, Bookmark, TrendingUp } from "lucide-react";

interface RecentItem {
  id: string;
  title: string;
  path: string;
  timestamp: Date;
  type: "page" | "document" | "agent";
}

export default function InsightsPage() {
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);

  useEffect(() => {
    // Load recent items from localStorage
    const stored = localStorage.getItem("recentItems");
    if (stored) {
      const items = JSON.parse(stored);
      setRecentItems(items.map((item: any) => ({
        ...item,
        timestamp: new Date(item.timestamp)
      })));
    }
  }, []);

  const favorites = recentItems.filter(item =>
    localStorage.getItem(`favorite-${item.id}`) === "true"
  );

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Insights</h1>
        <p className="text-muted-foreground">
          Your personalized dashboard with favorites, bookmarks, and recent activity
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <Star className="h-5 w-5 text-yellow-500" />
            <h3 className="font-semibold">Favorites</h3>
          </div>
          <p className="text-3xl font-bold">{favorites.length}</p>
          <p className="text-sm text-muted-foreground mt-1">Starred items</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <Bookmark className="h-5 w-5 text-blue-500" />
            <h3 className="font-semibold">Bookmarks</h3>
          </div>
          <p className="text-3xl font-bold">0</p>
          <p className="text-sm text-muted-foreground mt-1">Saved for later</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="h-5 w-5 text-purple-500" />
            <h3 className="font-semibold">Recent</h3>
          </div>
          <p className="text-3xl font-bold">{recentItems.length}</p>
          <p className="text-sm text-muted-foreground mt-1">Recently accessed</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            <h3 className="font-semibold">Activity</h3>
          </div>
          <p className="text-3xl font-bold">
            {recentItems.filter(item => {
              const now = new Date();
              const diff = now.getTime() - item.timestamp.getTime();
              return diff < 86400000; // Last 24 hours
            }).length}
          </p>
          <p className="text-sm text-muted-foreground mt-1">Last 24 hours</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Star className="h-5 w-5 text-yellow-500" />
            <h2 className="text-xl font-semibold">Favorites</h2>
          </div>
          {favorites.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No favorites yet. Star items to see them here.
            </p>
          ) : (
            <div className="space-y-3">
              {favorites.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-accent cursor-pointer transition-colors"
                >
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-sm text-muted-foreground">{item.path}</p>
                  </div>
                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Clock className="h-5 w-5 text-purple-500" />
            <h2 className="text-xl font-semibold">Recently Accessed</h2>
          </div>
          {recentItems.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No recent activity. Start exploring to see your history here.
            </p>
          ) : (
            <div className="space-y-3">
              {recentItems.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-accent cursor-pointer transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium">{item.title}</p>
                    <p className="text-sm text-muted-foreground">{item.path}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatTimestamp(item.timestamp)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Bookmark className="h-5 w-5 text-blue-500" />
          <h2 className="text-xl font-semibold">Bookmarks</h2>
        </div>
        <p className="text-muted-foreground text-sm">
          Coming soon: Save and organize bookmarks for quick access.
        </p>
      </Card>
    </div>
  );
}

export const dynamic = "force-dynamic";
