"use client";

import { useState, useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Search,
  Grid3X3,
  Settings,
  Bell,
  ExternalLink,
  Loader2,
  Plane,
  Wrench,
  BarChart3,
  Database,
  Zap,
  Package,
  Hammer,
  Target,
  DollarSign,
  Bot,
  User,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useUnifiedSearch } from "@/hooks/useUnifiedSearch";
import { useDebounce } from "@/hooks/useDebounce";

interface FavoriteApplication {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  href: string;
}

interface TopNavigationProps {
  onSearchFocus: () => void;
  onApplicationMenuClick: () => void;
  currentApplication?: {
    id: string;
    name: string;
  };
}

const favoriteApplications: FavoriteApplication[] = [
  {
    id: "aircraft-console",
    name: "Aircraft Readiness",
    icon: Plane,
    color: "bg-blue-500",
    href: "/console",
  },
  {
    id: "materiel-insights",
    name: "Materiel Insights",
    icon: Wrench,
    color: "bg-green-500",
    href: "/apps/materiel-insights",
  },
  {
    id: "dataops",
    name: "DataOps",
    icon: Database,
    color: "bg-cyan-500",
    href: "/apps/dataops",
  },
  {
    id: "express-dashboard",
    name: "Express Dashboard",
    icon: BarChart3,
    color: "bg-orange-500",
    href: "/apps/express-dashboard",
  },
  {
    id: "mescip",
    name: "MESCIP",
    icon: Zap,
    color: "bg-purple-500",
    href: "/apps/mescip",
  },
  {
    id: "supply-chain",
    name: "Supply Chain",
    icon: Package,
    color: "bg-red-500",
    href: "/apps/supply-chain",
  },
];

const availableApplications = [
  {
    id: "aircraft-console",
    name: "Aircraft Readiness Assistant",
    description: "Real-time aircraft status and maintenance overview",
    icon: Plane,
    color: "bg-blue-500",
    href: "/console",
  },
  {
    id: "materiel-insights",
    name: "Materiel Insights",
    description: "Advanced analytics for materiel management",
    icon: Wrench,
    color: "bg-green-500",
    href: "/apps/materiel-insights",
  },
  {
    id: "dataops",
    name: "DataOps",
    description: "Data operations and analytics platform",
    icon: Database,
    color: "bg-cyan-500",
    href: "/apps/dataops",
  },
  {
    id: "express-dashboard",
    name: "Express Dashboard",
    description: "Quick operational status overview",
    icon: BarChart3,
    color: "bg-orange-500",
    href: "/apps/express-dashboard",
  },
  {
    id: "mescip",
    name: "MESCIP",
    description: "Mission Essential Supply Chain Information Portal",
    icon: Zap,
    color: "bg-purple-500",
    href: "/apps/mescip",
  },
  {
    id: "supply-chain",
    name: "Supply Chain Management",
    description: "End-to-end supply chain visibility and control",
    icon: Package,
    color: "bg-red-500",
    href: "/apps/supply-chain",
  },
  {
    id: "maintenance-ops",
    name: "Maintenance Operations",
    description: "Comprehensive maintenance planning and tracking",
    icon: Hammer,
    color: "bg-indigo-500",
    href: "/apps/maintenance-ops",
  },
  {
    id: "strategic-planning",
    name: "Strategic Planning Assistant",
    description: "AI-powered strategic planning and decision support",
    icon: Target,
    color: "bg-slate-500",
    href: "/apps/strategic-planning-assistant",
  },
  {
    id: "financial-forecasting",
    name: "Financial Forecasting",
    description: "Advanced financial modeling and budget analysis",
    icon: DollarSign,
    color: "bg-emerald-500",
    href: "/apps/financial-forecasting-advisor",
  },
];

export function TopNavigation({
  onSearchFocus,
  onApplicationMenuClick, // eslint-disable-line @typescript-eslint/no-unused-vars
  currentApplication,
}: TopNavigationProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [applicationMenuOpen, setApplicationMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const applicationMenuRef = useRef<HTMLDivElement>(null);

  // Close application menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        applicationMenuRef.current &&
        !applicationMenuRef.current.contains(event.target as Node)
      ) {
        setApplicationMenuOpen(false);
      }
    }

    if (applicationMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [applicationMenuOpen]);

  // Unified search integration
  const { results, isLoading, error, search, clearResults } =
    useUnifiedSearch();
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Effect to trigger search when debounced query changes
  useEffect(() => {
    if (debouncedSearchQuery.trim()) {
      search(debouncedSearchQuery);
    } else {
      clearResults();
    }
  }, [debouncedSearchQuery, search, clearResults]);

  const handleSearchFocus = () => {
    setSearchFocused(true);
    onSearchFocus();
  };

  const handleSearchBlur = () => {
    // Delay hiding to allow clicking on dropdown items
    setTimeout(() => setSearchFocused(false), 200);
  };

  const handleSearchItemClick = (item: { url: string; title: string }) => {
    setSearchFocused(false);
    setSearchQuery("");
    clearResults();

    // Navigate to the selected item
    if (item.url.startsWith("/")) {
      router.push(item.url);
    } else if (item.url.startsWith("http")) {
      window.open(item.url, "_blank");
    } else {
      // Handle AWS console URLs
      router.push(`/console${item.url}`);
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setSearchFocused(false);
      setSearchQuery("");
      clearResults();
    }
  };

  return (
    <div ref={applicationMenuRef}>
      {/* Main Top Bar */}
      <div className="bg-black text-white">
        <div className="flex items-center justify-between px-4 h-12">
          {/* Left side */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3 relative">
              <span className="font-medium">
                <span className="text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.6)]">
                  AFSC
                </span>
                <span className="text-white ml-1">TITAN</span>
              </span>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setApplicationMenuOpen(!applicationMenuOpen)}
                className="text-white hover:bg-gray-800 hover:text-white p-1 cursor-pointer"
              >
                <Grid3X3 className="h-3 w-3" />
              </Button>

              {/* Application Menu Dropdown */}
              {applicationMenuOpen && (
                <div className="absolute top-full left-0 mt-2 w-96 bg-white border border-gray-200 shadow-lg z-50 max-h-96 overflow-y-auto rounded-lg">
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Available Applications
                    </h3>
                    <div className="grid grid-cols-1 gap-3">
                      {availableApplications.map((app) => {
                        const isActive = currentApplication?.id === app.id;
                        const IconComponent = app.icon;
                        return (
                          <div
                            key={app.id}
                            onClick={() => {
                              router.push(app.href);
                              setApplicationMenuOpen(false);
                            }}
                            className={`flex items-start space-x-3 p-3 rounded-lg cursor-pointer transition-colors border ${
                              isActive
                                ? "bg-blue-50 border-blue-200 hover:bg-blue-100"
                                : "border-gray-100 hover:bg-gray-50 hover:border-gray-200"
                            }`}
                          >
                            <div
                              className={`w-10 h-10 rounded-lg ${app.color} flex items-center justify-center text-white flex-shrink-0`}
                            >
                              <IconComponent className="h-5 w-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4
                                className={`text-sm font-medium truncate ${
                                  isActive ? "text-blue-900" : "text-gray-900"
                                }`}
                              >
                                {app.name}
                              </h4>
                              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                {app.description}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Center - Search */}
          <div className="flex-1 mx-8 relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search for services, applications, and resources"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={handleSearchFocus}
                onBlur={handleSearchBlur}
                onKeyDown={handleSearchKeyDown}
                className="pl-10 pr-20 bg-gray-900 border-gray-700 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                {isLoading && (
                  <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
                )}
                <span className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded border border-gray-700">
                  Alt+S
                </span>
              </div>
            </div>

            {/* Search Dropdown */}
            {searchFocused && (searchQuery.trim() || results) && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-96 overflow-y-auto">
                {error ? (
                  <div className="p-4 text-center text-red-600">
                    <div className="text-sm font-medium">Search Error</div>
                    <div className="text-xs text-gray-500 mt-1">{error}</div>
                  </div>
                ) : results ? (
                  <div className="py-2">
                    {results.sections.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        <div className="text-sm">No results found</div>
                        <div className="text-xs text-gray-400 mt-1">
                          Try searching for AWS services like
                          &quot;lambda&quot;, &quot;s3&quot;, or
                          &quot;cognito&quot;
                        </div>
                      </div>
                    ) : (
                      results.sections.map((section) => (
                        <div key={section.provider} className="mb-2 last:mb-0">
                          <div className="px-3 py-2 text-xs font-medium text-gray-500 border-b border-gray-100">
                            {section.sectionTitle} ({section.totalCount})
                          </div>
                          <div className="space-y-1">
                            {section.results.map((item, index) => (
                              <div
                                key={`${section.provider}-${item.serviceId}-${index}`}
                                onClick={() => handleSearchItemClick(item)}
                                className="flex items-start space-x-3 p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                              >
                                <div className="flex-shrink-0 mt-1">
                                  {item.source === "aws" ? (
                                    <div className="w-6 h-6 bg-orange-500 rounded text-white text-xs flex items-center justify-center font-bold">
                                      AWS
                                    </div>
                                  ) : (
                                    <div className="w-6 h-6 bg-blue-500 rounded text-white text-xs flex items-center justify-center">
                                      <ExternalLink className="h-3 w-3" />
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium text-gray-900 truncate">
                                    {item.title}
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                                    {item.description}
                                  </div>
                                  {item.topServiceFeatures &&
                                    item.topServiceFeatures.length > 0 && (
                                      <div className="flex flex-wrap gap-1 mt-2">
                                        {item.topServiceFeatures
                                          .slice(0, 3)
                                          .map((feature, idx) => (
                                            <span
                                              key={idx}
                                              className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600"
                                            >
                                              {feature}
                                            </span>
                                          ))}
                                      </div>
                                    )}
                                </div>
                                <div className="flex-shrink-0">
                                  <ExternalLink className="h-3 w-3 text-gray-400" />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                    )}

                    {results.suggestions && results.suggestions.length > 0 && (
                      <div className="border-t border-gray-100 pt-2 mt-2">
                        <div className="px-3 py-1 text-xs font-medium text-gray-500">
                          Suggestions
                        </div>
                        <div className="px-3 py-2 text-xs text-gray-400 space-y-1">
                          {results.suggestions.map((suggestion, index) => (
                            <div key={index}>{suggestion}</div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : searchQuery.trim() && isLoading ? (
                  <div className="p-4 text-center text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                    <div className="text-sm">Searching...</div>
                  </div>
                ) : searchQuery.trim() ? (
                  <div className="p-4 text-center text-gray-500">
                    <div className="text-sm">Start typing to search</div>
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            <ThemeToggle />

            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/agents")}
              className="text-white hover:bg-gray-800 hover:text-white p-1 cursor-pointer"
              title="Agent Management"
            >
              <Bot className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-gray-800 hover:text-white p-1 cursor-pointer"
            >
              <Bell className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-gray-800 hover:text-white p-1 cursor-pointer"
            >
              <Settings className="h-4 w-4" />
            </Button>

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
                        {session?.user?.name &&
                        session?.user?.name !== session?.user?.email
                          ? session.user.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()
                              .slice(0, 2)
                          : session?.user?.email
                              ?.split("@")[0]
                              ?.slice(0, 2)
                              ?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start text-left">
                      <span className="text-sm font-medium">
                        {session?.user?.name ||
                          session?.user?.email?.split("@")[0] ||
                          "User"}
                      </span>
                      {session?.user?.email && (
                        <span className="text-xs text-gray-300">
                          {session.user.email}
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
                                .map((n) => n[0])
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
                        <span className="font-medium text-gray-900">
                          {session?.user?.name ||
                            session?.user?.email?.split("@")[0] ||
                            "User"}
                        </span>
                        {session?.user?.email && (
                          <span className="text-sm text-gray-500">
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
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => router.push("/auth/signout")}
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

      {/* Favorites Bar */}
      <div className="bg-gray-900 border-b border-gray-800">
        <div className="flex items-center px-4 h-10 space-x-1">
          {favoriteApplications.map((app) => {
            const isActive = currentApplication?.id === app.id;
            const IconComponent = app.icon;
            return (
              <Button
                key={app.id}
                variant="ghost"
                size="sm"
                onClick={() => router.push(app.href)}
                className={`transition-all duration-200 text-xs px-3 py-1 h-8 flex items-center space-x-2 cursor-pointer ${
                  isActive
                    ? "bg-gray-800 text-white border border-gray-600"
                    : "text-white hover:bg-gray-800 hover:text-white border border-transparent hover:border-gray-700"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded flex items-center justify-center ${app.color}`}
                >
                  <IconComponent className="h-3 w-3 text-white" />
                </div>
                <span>{app.name}</span>
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
