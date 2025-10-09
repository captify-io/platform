"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Network,
  Star,
  Eye,
  CheckSquare,
  Grid3X3,
  ArrowRight,
  Clock,
} from "lucide-react";
import { config } from "@/config";

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate?: string;
}

interface BookmarkedPage {
  path: string;
  title: string;
  lastVisited: string;
}

interface WatchedPage {
  path: string;
  title: string;
  lastUpdate: string;
}

export default function HomePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [bookmarks, setBookmarks] = useState<BookmarkedPage[]>([]);
  const [watchedItems, setWatchedItems] = useState<WatchedPage[]>([]);

  useEffect(() => {
    if (session?.user) {
      loadUserData();
    }
  }, [session]);

  async function loadUserData() {
    // Load user's tasks (mock data for now - replace with actual API calls)
    setTasks([
      {
        id: "1",
        title: "Review Q4 Strategic Objectives",
        status: "In Progress",
        priority: "High",
        dueDate: "2025-10-15",
      },
      {
        id: "2",
        title: "Update AI Model Documentation",
        status: "Pending",
        priority: "Medium",
        dueDate: "2025-10-20",
      },
      {
        id: "3",
        title: "Approve Contract CLIN-2024-003",
        status: "Pending",
        priority: "High",
        dueDate: "2025-10-10",
      },
    ]);

    // Load bookmarked pages (from UserState)
    const userState = (session as any)?.userState;
    if (userState?.preferences?.bookmarkedPages) {
      const bookmarkedPaths = userState.preferences.bookmarkedPages;
      setBookmarks(
        bookmarkedPaths.map((path: string) => ({
          path,
          title: getPageTitle(path),
          lastVisited: new Date().toISOString(),
        }))
      );
    }

    // Load watched pages (from UserState)
    if (userState?.preferences?.watchedPages) {
      const watchedPaths = userState.preferences.watchedPages;
      setWatchedItems(
        watchedPaths.map((path: string) => ({
          path,
          title: getPageTitle(path),
          lastUpdate: new Date().toISOString(),
        }))
      );
    }
  }

  function getPageTitle(path: string): string {
    // Get title from menu configuration
    // This automatically stays in sync with menu changes in config.ts
    let title = "";

    function findMenuItem(items: any[]): void {
      for (const item of items) {
        if (item.href === path) {
          title = item.label;
          return;
        }
        if (item.children) {
          findMenuItem(item.children);
        }
      }
    }

    if (config.menu) {
      findMenuItem(config.menu);
    }

    // Fallback to path-based title if not found in menu
    return title || path.split("/").pop() || path;
  }

  function getPriorityColor(priority: string): string {
    switch (priority) {
      case "High":
        return "text-red-600 dark:text-red-400";
      case "Medium":
        return "text-yellow-600 dark:text-yellow-400";
      case "Low":
        return "text-green-600 dark:text-green-400";
      default:
        return "text-muted-foreground";
    }
  }

  if (!session?.user) {
    return (
      <div className="w-full bg-background flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Welcome to Captify</h1>
          <p className="text-muted-foreground">Please log in to continue</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-background p-6 overflow-auto min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {session.user.name || session.user.email}
          </h1>
          <p className="text-muted-foreground">
            Here's what's happening with your work today
          </p>
        </div>

        {/* Main Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Tasks */}
          <div className="lg:col-span-2 space-y-6">
            {/* My Tasks */}
            <div className="border rounded-lg p-6 bg-card">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <CheckSquare className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold">My Tasks</h2>
                </div>
                <button
                  onClick={() => router.push("/captify/operations/tasks")}
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  View all
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
              <div className="space-y-3">
                {tasks.length > 0 ? (
                  tasks.map((task) => (
                    <div
                      key={task.id}
                      className="border rounded-lg p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => router.push(`/captify/operations/tasks/${task.id}`)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium mb-1">{task.title}</h3>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span className={getPriorityColor(task.priority)}>
                              {task.priority}
                            </span>
                            <span>•</span>
                            <span>{task.status}</span>
                            {task.dueDate && (
                              <>
                                <span>•</span>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {new Date(task.dueDate).toLocaleDateString()}
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No tasks assigned
                  </p>
                )}
              </div>
            </div>

            {/* Quick Access - Applications */}
            <div className="border rounded-lg p-6 bg-card">
              <div className="flex items-center gap-2 mb-4">
                <Grid3X3 className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">Applications</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => router.push("/captify")}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Network className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold">Ontology Manager</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    AI ontology and strategy management
                  </p>
                </div>

                <div
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => {
                    const pmBookUrl =
                      typeof window !== "undefined" &&
                      window.location.hostname === "localhost"
                        ? "http://localhost:3001"
                        : "https://pmbook.captify.io";
                    window.location.href = pmBookUrl;
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold">PMBook</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Government contracting operations
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Bookmarks & Watched Items */}
          <div className="space-y-6">
            {/* Bookmarks */}
            <div className="border rounded-lg p-6 bg-card">
              <div className="flex items-center gap-2 mb-4">
                <Star className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">Bookmarks</h2>
              </div>
              <div className="space-y-2">
                {bookmarks.length > 0 ? (
                  bookmarks.slice(0, 5).map((bookmark, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-2 rounded hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => router.push(bookmark.path)}
                    >
                      <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                      <span className="text-sm truncate">{bookmark.title}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No bookmarks yet
                  </p>
                )}
              </div>
            </div>

            {/* Watched Items */}
            <div className="border rounded-lg p-6 bg-card">
              <div className="flex items-center gap-2 mb-4">
                <Eye className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">Watching</h2>
              </div>
              <div className="space-y-2">
                {watchedItems.length > 0 ? (
                  watchedItems.slice(0, 5).map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-2 rounded hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => router.push(item.path)}
                    >
                      <Eye className="h-3 w-3 text-blue-500" />
                      <span className="text-sm truncate">{item.title}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Not watching any pages
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
