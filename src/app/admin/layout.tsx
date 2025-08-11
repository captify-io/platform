"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TopNavigation } from "@/components/layout/TopNavigation";
import { SmartBreadcrumb } from "@/components/navigation/SmartBreadcrumb";
import {
  Settings,
  Building2,
  Users,
  UserCheck,
  Globe,
  Bot,
  BarChart3,
  Shield,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

interface SidebarItem {
  title: string;
  href?: string;
  icon: React.ElementType;
  children?: SidebarItem[];
  isExpandable?: boolean;
}

const sidebarItems: SidebarItem[] = [
  {
    title: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
  {
    title: "Administration",
    icon: Building2,
    isExpandable: true,
    children: [
      {
        title: "Organizations",
        href: "/admin/organizations",
        icon: Building2,
      },
      {
        title: "Groups",
        href: "/admin/groups",
        icon: Users,
      },
      {
        title: "Users",
        href: "/admin/users",
        icon: UserCheck,
      },
    ],
  },
  {
    title: "Applications",
    href: "/admin/applications",
    icon: Globe,
  },
  {
    title: "Agents",
    href: "/admin/agents",
    icon: Bot,
  },
  {
    title: "Analytics",
    href: "/admin/analytics",
    icon: BarChart3,
  },
  {
    title: "Security",
    href: "/admin/security",
    icon: Shield,
  },
];

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>([
    "Administration",
  ]);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleExpanded = (title: string) => {
    setExpandedItems((prev) =>
      prev.includes(title)
        ? prev.filter((item) => item !== title)
        : [...prev, title]
    );
  };

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + "/");
  };

  const renderSidebarItem = (item: SidebarItem, depth = 0) => {
    const isExpanded = expandedItems.includes(item.title);
    const hasChildren = item.children && item.children.length > 0;
    const active = item.href ? isActive(item.href) : false;

    return (
      <div key={item.title}>
        <Button
          variant={active ? "secondary" : "ghost"}
          className={cn(
            "w-full justify-start text-left font-normal",
            depth > 0 && "ml-6 text-sm",
            active && "bg-secondary font-medium"
          )}
          onClick={() => {
            if (hasChildren) {
              toggleExpanded(item.title);
            } else if (item.href) {
              router.push(item.href);
            }
          }}
        >
          <item.icon className="mr-2 h-4 w-4" />
          <span className="flex-1">{item.title}</span>
          {hasChildren &&
            (isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            ))}
        </Button>

        {hasChildren && isExpanded && (
          <div className="mt-1 space-y-1">
            {item.children?.map((child) => renderSidebarItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Top Navigation */}
      <TopNavigation
        onSearchFocus={() => {}}
        onApplicationMenuClick={() => {}}
      />

      {/* Breadcrumbs */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="px-4 py-3">
          <SmartBreadcrumb />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div
          className={cn(
            "flex flex-col border-r bg-background transition-all duration-300",
            sidebarOpen ? "w-64" : "w-0 overflow-hidden"
          )}
        >
          {/* Sidebar Navigation */}
          <ScrollArea className="flex-1 px-3 py-4">
            <nav className="space-y-2">
              {sidebarItems.map((item) => renderSidebarItem(item))}
            </nav>
          </ScrollArea>

          {/* Sidebar Footer */}
          <div className="p-4 border-t">
            <div className="text-xs text-muted-foreground">
              <div>Admin Dashboard</div>
              <div>v1.0.0</div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Content */}
          <main className="flex-1 overflow-auto">{children}</main>
        </div>

        {/* Mobile Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </div>
    </div>
  );
}
