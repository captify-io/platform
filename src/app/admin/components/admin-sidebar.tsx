"use client";

/**
 * Admin Sidebar
 * Role-aware navigation for admin panel using shadcn Sidebar component
 *
 * Features:
 * - Organized by section headers (User Management, Application Management, System)
 * - Uses shadcn/ui Sidebar components from core
 * - Admin-only access (captify-admin or captify-operations groups)
 */

import { useEffect, useState } from 'react';
import { useRolePermissions } from '@captify-io/core/hooks';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuBadge,
} from '@captify-io/core';
import {
  Users,
  AppWindow,
  Settings,
  Database,
  Activity,
  FileText,
  Shield,
  BarChart3,
  type LucideIcon,
} from 'lucide-react';

interface MenuItem {
  id: string;
  label: string;
  icon?: LucideIcon;
  count?: number;
  badge?: string;
}

interface MenuSection {
  header: string;
  items: MenuItem[];
}

interface AdminSidebarProps {
  onViewChange?: (view: string) => void;
  activeView?: string | null;
}

export function AdminSidebar({
  onViewChange,
  activeView,
}: AdminSidebarProps = {}) {
  const permissions = useRolePermissions('admin');
  const [counts, setCounts] = useState({
    users: 0,
    apps: 0,
    pendingRequests: 0,
  });

  // Load counts based on user role
  useEffect(() => {
    if (permissions.hasAccess) {
      loadCounts();
    }
  }, [permissions.userId, permissions.role]);

  const loadCounts = async () => {
    // TODO: Implement actual count loading
    setCounts({
      users: 24,
      apps: 8,
      pendingRequests: 3,
    });
  };

  const handleViewChange = (viewId: string) => {
    onViewChange?.(viewId);
  };

  // Define menu sections
  const sections: MenuSection[] = [
    {
      header: 'User Management',
      items: [
        {
          id: 'users',
          label: 'Users',
          icon: Users,
          count: counts.users,
        },
        {
          id: 'groups',
          label: 'Groups',
          icon: Shield,
        },
        {
          id: 'access-requests',
          label: 'Access Requests',
          icon: FileText,
          badge: counts.pendingRequests > 0 ? counts.pendingRequests.toString() : undefined,
        },
      ],
    },
    {
      header: 'Application Management',
      items: [
        {
          id: 'applications',
          label: 'Applications',
          icon: AppWindow,
          count: counts.apps,
        },
        {
          id: 'app-access',
          label: 'App Access Control',
          icon: Shield,
        },
      ],
    },
    {
      header: 'System',
      items: [
        {
          id: 'monitoring',
          label: 'Monitoring',
          icon: Activity,
        },
        {
          id: 'database',
          label: 'Database',
          icon: Database,
        },
        {
          id: 'audit-logs',
          label: 'Audit Logs',
          icon: FileText,
        },
        {
          id: 'reports',
          label: 'Reports',
          icon: BarChart3,
        },
        {
          id: 'settings',
          label: 'Settings',
          icon: Settings,
        },
      ],
    },
  ];

  return (
    <Sidebar>
      <SidebarContent>
        {/* Overview - Top of sidebar */}
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => handleViewChange('overview')}
                isActive={activeView === 'overview'}
                tooltip="Admin Overview"
                className="h-12"
              >
                <BarChart3 className="h-5 w-5" />
                <span className="font-semibold">Overview</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {/* Sections */}
        {sections.map((section) => (
          <SidebarGroup key={section.header}>
            <SidebarGroupLabel>{section.header}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeView === item.id;

                  return (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        onClick={() => handleViewChange(item.id)}
                        isActive={isActive}
                        tooltip={item.label}
                      >
                        {Icon && <Icon className="h-4 w-4" />}
                        <span>{item.label}</span>
                        {item.count !== undefined && item.count > 0 && (
                          <SidebarMenuBadge className="ml-auto bg-muted">
                            {item.count}
                          </SidebarMenuBadge>
                        )}
                        {item.badge && (
                          <SidebarMenuBadge className="ml-auto bg-primary text-primary-foreground">
                            {item.badge}
                          </SidebarMenuBadge>
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
