"use client";

/**
 * Spaces Sidebar
 * Role-aware navigation for Spaces work management system using shadcn Sidebar component
 *
 * Features:
 * - Organized by section headers (My Stuff, Team, Portfolio, Financial)
 * - Uses shadcn/ui Sidebar components from core
 * - No search (removed as requested)
 * - Insights button at top with counts
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
  CheckSquare,
  BookOpen,
  FileText,
  Calendar,
  Inbox,
  Layers,
  Target,
  BarChart3,
  DollarSign,
  TrendingUp,
  Package,
  Boxes,
  Sparkles,
  ListChecks,
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
  roles: Array<'technical' | 'manager' | 'executive' | 'admin'>;
}

interface SpacesSidebarProps {
  onViewChange?: (view: string) => void;
  activeView?: string | null;
}

export function SpacesSidebar({
  onViewChange,
  activeView,
}: SpacesSidebarProps = {}) {
  const permissions = useRolePermissions('spaces');
  const [counts, setCounts] = useState({
    myTasks: 0,
    teamTasks: 0,
    contracts: 0,
    clins: 0,
    workstreams: 0,
    topTasks: 0,
    requests: 0,
  });

  // Load counts based on user role
  useEffect(() => {
    if (permissions.hasAccess) {
      loadCounts();
    }
  }, [permissions.userId, permissions.role]);

  const loadCounts = async () => {
    // TODO: Implement actual count loading from DynamoDB
    // For now, using placeholder values
    setCounts({
      myTasks: 12,
      teamTasks: 45,
      contracts: 3,
      clins: 15,
      workstreams: 5,
      topTasks: 8,
      requests: 7,
    });
  };

  const handleViewChange = (viewId: string) => {
    onViewChange?.(viewId);
  };

  // Define menu sections based on new structure
  const sections: MenuSection[] = [];

  // ===== MY STUFF =====
  if (permissions.isTechnical || permissions.isManager || permissions.isAdmin) {
    sections.push({
      header: 'My Stuff',
      roles: ['technical', 'manager', 'admin'],
      items: [
        {
          id: 'my-tasks',
          label: 'Tasks',
          icon: CheckSquare,
          count: counts.myTasks,
        },
        {
          id: 'my-journal',
          label: 'Journal',
          icon: BookOpen,
        },
        {
          id: 'my-documents',
          label: 'Documents',
          icon: FileText,
        },
      ],
    });
  }

  // ===== PERFORMANCE =====
  if (permissions.isManager || permissions.isAdmin) {
    sections.push({
      header: 'Performance',
      roles: ['manager', 'admin'],
      items: [
        {
          id: 'workstreams',
          label: 'Workstreams',
          icon: Layers,
          count: counts.workstreams,
        },
        {
          id: 'capabilities',
          label: 'Capabilities',
          icon: Boxes,
        },
        {
          id: 'objectives',
          label: 'Objectives',
          icon: Target,
        },
        {
          id: 'reports',
          label: 'Reports',
          icon: BarChart3,
        },
      ],
    });
  }

  // ===== PRODUCT MANAGEMENT =====
  if (permissions.isManager || permissions.isAdmin) {
    sections.push({
      header: 'Product Management',
      roles: ['manager', 'admin'],
      items: [
        {
          id: 'features',
          label: 'Features',
          icon: Sparkles,
        },
        {
          id: 'use-cases',
          label: 'Use Cases',
          icon: ListChecks,
        },
        {
          id: 'backlog',
          label: 'Backlog',
          icon: Inbox,
        },
        {
          id: 'sprints',
          label: 'Sprints',
          icon: Calendar,
        },
      ],
    });
  }

  // ===== FINANCIAL =====
  if (permissions.canViewFinancials) {
    sections.push({
      header: 'Financial',
      roles: ['executive', 'admin'],
      items: [
        {
          id: 'contracts',
          label: 'Contracts',
          icon: DollarSign,
          count: counts.contracts,
        },
        {
          id: 'sow',
          label: 'SOW',
          icon: FileText,
        },
        {
          id: 'cdrls',
          label: 'CDRLs',
          icon: FileText,
        },
        {
          id: 'clins',
          label: 'CLINs',
          icon: FileText,
          count: counts.clins,
        },
      ],
    });
  }

  return (
    <Sidebar>
      <SidebarContent>
        {/* Insights - Top of sidebar */}
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => handleViewChange('insights')}
                isActive={activeView === 'insights'}
                tooltip="Insights Dashboard"
                className="h-12"
              >
                <TrendingUp className="h-5 w-5" />
                <span className="font-semibold">Insights</span>
                <div className="ml-auto flex gap-2">
                  <SidebarMenuBadge className="bg-muted">
                    {counts.topTasks}
                  </SidebarMenuBadge>
                  <SidebarMenuBadge className="bg-muted">
                    {counts.workstreams}
                  </SidebarMenuBadge>
                  <SidebarMenuBadge className="bg-muted">
                    {counts.requests}
                  </SidebarMenuBadge>
                </div>
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
