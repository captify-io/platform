"use client";

/**
 * DataOps Sidebar
 * Navigation for DataOps pages and features
 */

import { useRouter } from 'next/navigation';
import { Button } from '@captify-io/core';
import {
  LayoutDashboard,
  Database,
  Package,
  FolderOpen,
  ShieldCheck,
  GitBranch,
  Lock,
  Workflow,
  Sparkles,
} from 'lucide-react';
import { cn } from '@captify-io/core';

interface DataOpsSidebarProps {
  activePage?: string;
}

export function DataOpsSidebar({ activePage }: DataOpsSidebarProps) {
  const router = useRouter();

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      href: '/dataops',
      icon: LayoutDashboard,
      description: 'DataOps overview',
    },
    {
      id: 'sources',
      label: 'Data Sources',
      href: '/dataops/sources',
      icon: Database,
      description: 'Manage data sources',
    },
    {
      id: 'products',
      label: 'Data Products',
      href: '/dataops/products',
      icon: Package,
      description: 'Data product catalog',
    },
    {
      id: 'catalog',
      label: 'Catalog',
      href: '/dataops/catalog',
      icon: FolderOpen,
      description: 'Dataset catalog',
    },
    {
      id: 'quality',
      label: 'Quality',
      href: '/dataops/quality',
      icon: ShieldCheck,
      description: 'Data quality metrics',
    },
    {
      id: 'lineage',
      label: 'Lineage',
      href: '/dataops/lineage',
      icon: GitBranch,
      description: 'Data lineage tracking',
    },
    {
      id: 'compliance',
      label: 'Compliance',
      href: '/dataops/compliance',
      icon: Lock,
      description: 'IL5 NIST compliance',
    },
    {
      id: 'pipelines',
      label: 'Pipelines',
      href: '/dataops/pipelines',
      icon: Workflow,
      description: 'Data pipelines',
    },
  ];

  return (
    <div className="w-64 min-w-[250px] border-r bg-muted/30 flex flex-col h-full shrink-0">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <Database className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <h2 className="font-semibold">DataOps</h2>
            <p className="text-xs text-muted-foreground">IL5 Compliant</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;

            return (
              <button
                key={item.id}
                onClick={() => router.push(item.href)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-md transition-colors",
                  "hover:bg-muted",
                  isActive && "bg-muted font-medium"
                )}
              >
                <Icon className={cn(
                  "h-4 w-4",
                  isActive ? "text-primary" : "text-muted-foreground"
                )} />
                <span className="flex-1 text-left">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 border-t">
        <div className="px-3 py-2 bg-blue-500/10 rounded-md">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-3.5 w-3.5 text-blue-500" />
            <p className="text-xs font-medium">AI Discovery</p>
          </div>
          <p className="text-xs text-muted-foreground">
            Powered by AWS Kendra
          </p>
        </div>
      </div>
    </div>
  );
}
