"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SidebarItem {
  id: string;
  label: string;
  href?: string;
  children?: SidebarItem[];
  badge?: string | number;
  external?: boolean;
}

interface SidebarSection {
  id: string;
  title: string;
  items: SidebarItem[];
  defaultOpen?: boolean;
}

interface ApplicationSidebarProps {
  application: {
    id: string;
    name: string;
    sidebar?: SidebarSection[];
  };
  collapsed: boolean;
  onToggle: () => void;
}

// Default sidebar structure for Neptune (from the screenshot)
const neptuneSidebar: SidebarSection[] = [
  {
    id: "databases",
    title: "Databases",
    defaultOpen: true,
    items: [
      { id: "clusters", label: "Clusters", href: "/console/neptune/clusters" },
      {
        id: "snapshots",
        label: "Snapshots",
        href: "/console/neptune/snapshots",
      },
      {
        id: "subnet-groups",
        label: "Subnet groups",
        href: "/console/neptune/subnet-groups",
      },
      {
        id: "parameter-groups",
        label: "Parameter groups",
        href: "/console/neptune/parameter-groups",
      },
      { id: "events", label: "Events", href: "/console/neptune/events" },
      {
        id: "event-subscriptions",
        label: "Event subscriptions",
        href: "/console/neptune/event-subscriptions",
      },
      {
        id: "latest-updates",
        label: "Latest updates",
        href: "/console/neptune/latest-updates",
        external: true,
      },
    ],
  },
  {
    id: "analytics",
    title: "Analytics",
    defaultOpen: true,
    items: [
      { id: "graphs", label: "Graphs", href: "/console/neptune/graphs" },
      {
        id: "analytics-snapshots",
        label: "Snapshots",
        href: "/console/neptune/analytics/snapshots",
      },
      {
        id: "import-tasks",
        label: "Import tasks",
        href: "/console/neptune/import-tasks",
      },
      {
        id: "export-tasks",
        label: "Export tasks",
        href: "/console/neptune/export-tasks",
      },
      {
        id: "analytics-latest-updates",
        label: "Latest updates",
        href: "/console/neptune/analytics/latest-updates",
        external: true,
      },
    ],
  },
  {
    id: "notebooks",
    title: "Notebooks",
    items: [
      {
        id: "notebook-instances",
        label: "Notebook instances",
        href: "/console/neptune/notebooks",
      },
    ],
  },
  {
    id: "resources",
    title: "Resources",
    items: [
      {
        id: "whats-new",
        label: "What's new posts",
        href: "/console/neptune/whats-new",
        external: true,
      },
      {
        id: "neptune-resources",
        label: "Neptune resources",
        href: "/console/neptune/resources",
        external: true,
      },
    ],
  },
];

import { useApps } from "@/context/AppsContext";
import { useRouter } from "next/navigation";
// ...existing imports
export function ApplicationSidebar({
  application,
  collapsed,
  onToggle,
}: ApplicationSidebarProps) {
  const { availableApps } = useApps();
  const router = useRouter();
  const [openSections, setOpenSections] = useState<Set<string>>(
    new Set(neptuneSidebar.filter((s) => s.defaultOpen).map((s) => s.id))
  );

  const toggleSection = (sectionId: string) => {
    const newOpenSections = new Set(openSections);
    if (newOpenSections.has(sectionId)) {
      newOpenSections.delete(sectionId);
    } else {
      newOpenSections.add(sectionId);
    }
    setOpenSections(newOpenSections);
  };

  // Build sections: first list all applications, then app-specific or default
  const appsSection: SidebarSection = {
    id: "applications",
    title: "Applications",
    defaultOpen: true,
    items: availableApps.map((app) => ({
      id: app.alias,
      label: app.name,
      href: `/apps/${app.alias}`,
    })),
  };
  const sidebarSections = [
    appsSection,
    ...(application.sidebar ?? neptuneSidebar),
  ];

  if (collapsed) {
    return (
      <div className="w-12 bg-white border-r border-gray-200 flex flex-col">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="m-2 p-1"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Sidebar Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="font-semibold text-gray-900">{application.name}</h2>
        <Button variant="ghost" size="sm" onClick={onToggle} className="p-1">
          <ChevronDown className="h-4 w-4 rotate-90" />
        </Button>
      </div>

      {/* Sidebar Navigation */}
      <nav className="flex-1 overflow-y-auto py-2">
        {sidebarSections.map((section) => (
          <div key={section.id} className="mb-1">
            {/* Section Header */}
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full flex items-center justify-between px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
            >
              <span>▼ {section.title}</span>
              {openSections.has(section.id) ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </button>

            {/* Section Items */}
            {openSections.has(section.id) && (
              <div className="pl-4">
                {section.items.map((item) => (
                  <a
                    key={item.id}
                    href={item.href}
                    className={cn(
                      "flex items-center justify-between px-4 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-sm mx-2 cursor-pointer",
                      window.location.pathname === item.href &&
                        "bg-blue-50 text-blue-700"
                    )}
                  >
                    <span>{item.label}</span>
                    <div className="flex items-center space-x-1">
                      {item.badge && (
                        <span className="bg-gray-200 text-gray-700 text-xs px-1.5 py-0.5 rounded">
                          {item.badge}
                        </span>
                      )}
                      {item.external && (
                        <ExternalLink className="h-3 w-3 text-gray-400" />
                      )}
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
      {/* New Application Button */}
      <div className="p-4 border-t border-gray-200">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => router.push("/apps/new")}
        >
          + New Application
        </Button>
      </div>
    </aside>
  );
}
