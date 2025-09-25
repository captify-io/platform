"use client";

import { useRouter } from "next/navigation";
import React, { lazy, Suspense, useRef, useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import type { Session } from "next-auth";
import { useSafeRef } from "../../lib/react-compat";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { GlobalSearch } from "../search";
import { ThemeToggle } from "../theme";
import { ApplicationLauncher } from "./ApplicationLauncher";
import {
  Bell,
  Zap,
  User,
  LogOut,
  ChevronDown,
  Shield,
  Settings,
  Grid3X3,
  CheckCircle,
  AlertCircle,
  Clock,
  X,
} from "lucide-react";

interface TopNavigationProps {
  onSearchFocus?: () => void;
  onAppMenuClick?: () => void;
  currentApplication?: {
    id: string;
    name: string;
  };
  session?: Session | null;
}

// Mock notifications data - in a real app, this would come from an API
const mockNotifications = [
  {
    id: "1",
    title: "System Update",
    message: "Platform has been updated to version 2.1.0",
    type: "success" as const,
    timestamp: new Date(Date.now() - 1000 * 60 * 10), // 10 minutes ago
    read: false,
  },
  {
    id: "2", 
    title: "Security Alert",
    message: "New login detected from Washington, DC",
    type: "warning" as const,
    timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
    read: true,
  },
  {
    id: "3",
    title: "Report Ready",
    message: "Your monthly analytics report is ready for download",
    type: "info" as const,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    read: false,
  },
];

export function TopNavigation({
  onSearchFocus,
  onAppMenuClick,
  currentApplication,
  session: propSession,
}: TopNavigationProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState(mockNotifications);

  // Use session from prop
  const session = propSession || null;
  const isAuthenticated = !!session;
  const user = session?.user;

  // Enhanced debugging to track where TopNavigation is called from
  console.log("🚀 TopNavigation RENDER:", {
    timestamp: new Date().toISOString(),
    hasSession: !!session,
    userId: user?.id,
    userEmail: user?.email,
    currentApplication: currentApplication?.name,
    stackTrace: new Error().stack?.split("\n").slice(1, 4).join("\n"),
  });

  // Add a visible counter to see multiple renders (client-side only)
  const renderCount = useSafeRef(0);

  // Only update render count on client-side
  useEffect(() => {
    renderCount.current += 1;
  });

  // Handle sign out
  const handleSignOut = async () => {
    console.log("🚪 Signing out via NextAuth");

    // Clear client-side storage
    if (typeof window !== "undefined") {
      window.localStorage.clear();
      window.sessionStorage.clear();
    }

    // Use NextAuth signOut with proper redirect
    await signOut({
      redirect: false // Don't auto-redirect, we'll handle it
    });

    // After signout completes, redirect to signout page
    window.location.href = "/signout";
  };

  // Handle notification actions
  const markAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const dismissNotification = (notificationId: string) => {
    setNotifications(prev =>
      prev.filter(notification => notification.id !== notificationId)
    );
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div>
      {/* Main Top Bar */}
      <div className="bg-black text-white">
        <div className="flex items-center px-4 h-12 gap-4">
          {/* Left side - Fixed width */}
          <div className="flex items-center space-x-3 flex-shrink-0">
            <span className="font-medium whitespace-nowrap">
              <span className="text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.6)]">
                AFSC
              </span>
              <span className="text-white ml-1">TITAN</span>
            </span>
          </div>

          {/* App Menu Button - Fixed width */}
          <div className="flex-shrink-0">
            <ApplicationLauncher currentApplication={currentApplication} />
          </div>

          {/* Search - Takes all available space */}
          <div className="flex-1 min-w-0">
            <GlobalSearch onFocus={onSearchFocus} />
          </div>

          {/* Right side - Fixed width with proper spacing */}
          <div className="flex items-center space-x-3 flex-shrink-0">
            <ThemeToggle />

            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-gray-800 hover:text-white p-2 cursor-pointer relative"
                >
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="flex items-center justify-between">
                  <span>Notifications</span>
                  {unreadCount > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {unreadCount} unread
                    </span>
                  )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No notifications</p>
                  </div>
                ) : (
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-3 border-b last:border-b-0 hover:bg-accent/50 ${
                          !notification.read ? "bg-blue-50/50 dark:bg-blue-900/10" : ""
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              {notification.type === "success" && (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              )}
                              {notification.type === "warning" && (
                                <AlertCircle className="h-4 w-4 text-yellow-500" />
                              )}
                              {notification.type === "info" && (
                                <Clock className="h-4 w-4 text-blue-500" />
                              )}
                              <h4 className="font-medium text-sm truncate">
                                {notification.title}
                              </h4>
                              {!notification.read && (
                                <div className="h-2 w-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mb-1">
                              {notification.message}
                            </p>
                            <span className="text-xs text-muted-foreground">
                              {formatTimeAgo(notification.timestamp)}
                            </span>
                          </div>
                          <div className="flex gap-1">
                            {!notification.read && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => markAsRead(notification.id)}
                                className="h-6 w-6 p-0 hover:bg-accent"
                                title="Mark as read"
                              >
                                <CheckCircle className="h-3 w-3" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => dismissNotification(notification.id)}
                              className="h-6 w-6 p-0 hover:bg-accent"
                              title="Dismiss"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Token Counter */}
            <div className="flex items-center space-x-2 px-3 py-1 bg-gray-800 rounded-md border border-gray-700 whitespace-nowrap">
              <Zap className="h-4 w-4 text-yellow-400" />
              <span className="text-sm font-medium text-white">4,600</span>
              <span className="text-xs text-gray-400">tokens</span>
            </div>

            <div className="relative">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center space-x-2 text-white hover:bg-gray-800 hover:text-white px-3 py-2 h-auto"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={session?.user?.image || undefined}
                        alt={session?.user?.name || "User"}
                      />
                      <AvatarFallback className="bg-blue-600 text-white text-sm">
                        {(user?.name || session?.user?.name) &&
                        user?.name !== user?.email &&
                        session?.user?.name !== session?.user?.email
                          ? (user?.name || session?.user?.name || "")
                              .split(" ")
                              .map((n: string) => n[0])
                              .join("")
                              .toUpperCase()
                              .slice(0, 2)
                          : user?.email || session?.user?.email
                          ? (user?.email || session?.user?.email || "")
                              .split("@")[0]
                              ?.slice(0, 2)
                              ?.toUpperCase()
                          : isAuthenticated
                          ? "AU"
                          : "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start text-left min-w-0 flex-1">
                      <span className="text-sm font-medium truncate max-w-full">
                        {user?.name ||
                          session?.user?.name ||
                          user?.email?.split("@")[0] ||
                          session?.user?.email?.split("@")[0] ||
                          "User"}
                      </span>
                      {(user?.email || session?.user?.email) && (
                        <span className="text-xs text-gray-300 truncate max-w-full">
                          {user?.email || session?.user?.email}
                        </span>
                      )}
                    </div>
                    <ChevronDown className="h-4 w-4 text-gray-300" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel className="p-4">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={session?.user?.image || undefined}
                          alt={session?.user?.name || "User"}
                        />
                        <AvatarFallback className="bg-blue-600 text-white">
                          {session?.user?.name &&
                          session?.user?.name !== session?.user?.email
                            ? session.user.name
                                .split(" ")
                                .map((n: string) => n[0])
                                .join("")
                                .toUpperCase()
                                .slice(0, 2)
                            : session?.user?.email
                                ?.split("@")[0]
                                ?.slice(0, 2)
                                ?.toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium text-popover-foreground">
                          {session?.user?.name ||
                            session?.user?.email?.split("@")[0] ||
                            "User"}
                        </span>
                        {session?.user?.email && (
                          <span className="text-sm text-muted-foreground">
                            {session.user.email}
                          </span>
                        )}
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => router.push("/profile")}
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <User className="h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => router.push("/settings")}
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <Settings className="h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => router.push("/admin")}
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <Shield className="h-4 w-4" />
                    <span>Platform Admin</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="flex items-center space-x-2 cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
