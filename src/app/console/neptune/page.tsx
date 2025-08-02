"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ConsoleLayout } from "@/components/layout/ConsoleLayout";
import { Search, RefreshCw, MoreVertical, Settings } from "lucide-react";

// Mock Neptune clusters data
const mockClusters = [
  {
    id: "titan-dev-neptune",
    identifier: "titan-dev-neptune",
    status: "Available",
    role: "Cluster",
    engineVersion: "1.4.5.1",
    region: "us-east-1",
    size: "-",
    cpu: "-",
  },
  {
    id: "titan-dev-neptune-instance",
    identifier: "titan-dev-neptune-instance",
    status: "Available",
    role: "Writer",
    engineVersion: "1.4.5.1",
    region: "us-east-1b",
    size: "db.t3.medium",
    cpu: "10.76%",
  },
  {
    id: "neptune-cluster-algohyxmzk4",
    identifier: "neptune-cluster-algohyxmzk4",
    status: "Available",
    role: "Serverless",
    engineVersion: "1.2.1.3",
    region: "us-east-1",
    size: "-",
    cpu: "-",
  },
  {
    id: "neptune-instance-1amyqzcewx1w",
    identifier: "neptune-instance-1amyqzcewx1w",
    status: "Available",
    role: "Writer",
    engineVersion: "1.2.1.3",
    region: "us-east-1a",
    size: "db.serverless",
    cpu: "0.00%",
  },
];

export default function NeptunePage() {
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState("");
  const [groupResources] = useState(true);

  const filteredClusters = mockClusters.filter(
    (cluster) =>
      cluster.identifier.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cluster.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cluster.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const neptuneApplication = {
    id: "neptune",
    name: "Neptune",
    // Sidebar configuration matching the AWS Neptune console
    sidebar: [
      {
        id: "databases",
        title: "Databases",
        defaultOpen: true,
        items: [
          {
            id: "clusters",
            label: "Clusters",
            href: "/console/neptune/clusters",
          },
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
    ],
  };

  if (!session) {
    return <div>Loading...</div>;
  }

  return (
    <ConsoleLayout currentApplication={neptuneApplication}>
      <div className="p-6">
        {/* Breadcrumb */}
        <div className="flex items-center text-sm text-gray-600 mb-4">
          <span className="text-blue-600 hover:underline cursor-pointer">
            Neptune
          </span>
          <span className="mx-2">›</span>
          <span>Databases</span>
        </div>

        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Database clusters (2)
            </h1>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm" className="cursor-pointer">
              <Settings className="h-4 w-4 mr-2" />
              Group resources
              <Badge variant="secondary" className="ml-2">
                {groupResources ? "On" : "Off"}
              </Badge>
            </Button>
            <Button variant="outline" size="sm" className="cursor-pointer">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" className="cursor-pointer">
              Modify
            </Button>
            <Button variant="outline" size="sm" className="cursor-pointer">
              Actions
              <MoreVertical className="h-4 w-4 ml-2" />
            </Button>
            <Button className="cursor-pointer">Create database</Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Filter databases"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Clusters Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left p-4 font-medium text-gray-600">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          className="rounded cursor-pointer"
                        />
                        <span>Identifier</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-0 h-auto cursor-pointer"
                        >
                          ↕️
                        </Button>
                      </div>
                    </th>
                    <th className="text-left p-4 font-medium text-gray-600">
                      <div className="flex items-center space-x-2">
                        <span>Status</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-0 h-auto cursor-pointer"
                        >
                          ↕️
                        </Button>
                      </div>
                    </th>
                    <th className="text-left p-4 font-medium text-gray-600">
                      <div className="flex items-center space-x-2">
                        <span>Role</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-0 h-auto cursor-pointer"
                        >
                          ↕️
                        </Button>
                      </div>
                    </th>
                    <th className="text-left p-4 font-medium text-gray-600">
                      <div className="flex items-center space-x-2">
                        <span>Engine version</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-0 h-auto cursor-pointer"
                        >
                          ↕️
                        </Button>
                      </div>
                    </th>
                    <th className="text-left p-4 font-medium text-gray-600">
                      <div className="flex items-center space-x-2">
                        <span>Region/AZ</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-0 h-auto cursor-pointer"
                        >
                          ↕️
                        </Button>
                      </div>
                    </th>
                    <th className="text-left p-4 font-medium text-gray-600">
                      <div className="flex items-center space-x-2">
                        <span>Size</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-0 h-auto cursor-pointer"
                        >
                          ↕️
                        </Button>
                      </div>
                    </th>
                    <th className="text-left p-4 font-medium text-gray-600">
                      <div className="flex items-center space-x-2">
                        <span>CPU</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-0 h-auto cursor-pointer"
                        >
                          ↕️
                        </Button>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClusters.map((cluster, index) => (
                    <tr
                      key={cluster.id}
                      className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                    >
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            className="rounded cursor-pointer"
                          />
                          <span className="text-blue-600 hover:underline cursor-pointer">
                            {cluster.identifier}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span>{cluster.status}</span>
                        </div>
                      </td>
                      <td className="p-4">{cluster.role}</td>
                      <td className="p-4">{cluster.engineVersion}</td>
                      <td className="p-4">{cluster.region}</td>
                      <td className="p-4">{cluster.size}</td>
                      <td className="p-4">
                        {cluster.cpu !== "-" && (
                          <div className="flex items-center space-x-2">
                            <div className="w-16 h-2 bg-gray-200 rounded-full">
                              <div
                                className="h-2 bg-blue-500 rounded-full"
                                style={{ width: cluster.cpu }}
                              ></div>
                            </div>
                            <span className="text-sm">{cluster.cpu}</span>
                          </div>
                        )}
                        {cluster.cpu === "-" && <span>-</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" disabled>
              ‹
            </Button>
            <span className="px-3 py-1 bg-blue-600 text-white rounded text-sm">
              1
            </span>
            <Button variant="outline" size="sm" disabled>
              ›
            </Button>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm">
              ⚙️
            </Button>
          </div>
        </div>
      </div>
    </ConsoleLayout>
  );
}
