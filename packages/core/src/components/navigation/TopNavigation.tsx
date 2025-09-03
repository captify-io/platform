"use client";

import { useRouter } from "next/navigation";
import { lazy, Suspense } from "react";
import type { Session } from "next-auth";
import type { CaptifyContextType } from "../../context/CaptifyContext";
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
import { GlobalSearch } from "../search/GlobalSearch";
import { ThemeToggle } from "../theme/ThemeToggle";
import {
  Bell,
  Zap,
  User,
  LogOut,
  ChevronDown,
  Shield,
  Settings,
  Bot,
  Grid3X3,
} from "lucide-react";

// Lazy load ApplicationLauncher to prevent useCaptify from being called at module import time
const ApplicationLauncher = lazy(() =>
  import("../ApplicationLauncher").then((module) => ({
    default: module.ApplicationLauncher,
  }))
);

interface TopNavigationProps {
  captifyContext: CaptifyContextType;
  onSearchFocus?: () => void;
  onAppMenuClick?: () => void;
  currentApplication?: {
    id: string;
    name: string;
  };
  session?: Session | null;
  handleCognitoLogout?: () => Promise<void>;
}

export function TopNavigation({
  captifyContext,
  onSearchFocus,
  onAppMenuClick,
  currentApplication,
  session: propSession,
  handleCognitoLogout,
}: TopNavigationProps) {
  const router = useRouter();
  const { session, isAuthenticated, favoriteApps, toggleFavorite } =
    captifyContext;

  // Get user from session
  const user = session?.user;

  // Remove problematic session checks - let CaptifyLayout handle authentication
  // Just render the navigation bar regardless of session status

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
            <Suspense
              fallback={
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-gray-800 hover:text-white p-2"
                  disabled
                >
                  <Grid3X3 className="h-4 w-4 animate-pulse" />
                </Button>
              }
            >
              <ApplicationLauncher
                captifyContext={captifyContext}
                session={session}
                favoriteApps={favoriteApps}
                toggleFavorite={toggleFavorite}
              />
            </Suspense>
          </div>

          {/* Search - Takes all available space */}
          <div className="flex-1 min-w-0">
            <GlobalSearch onFocus={onSearchFocus} />
          </div>

          {/* Right side - Fixed width with proper spacing */}
          <div className="flex items-center space-x-3 flex-shrink-0">
            <ThemeToggle />

            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/chat")}
              className="text-white hover:bg-gray-800 hover:text-white p-2 cursor-pointer"
            >
              <Bot className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-gray-800 hover:text-white p-2 cursor-pointer"
            >
              <Bell className="h-4 w-4" />
            </Button>

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
                    onClick={handleCognitoLogout}
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
