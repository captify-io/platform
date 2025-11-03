"use client";

import { } from "@captify-io/core";
import { useEffect, useState } from "react";
import { Flow } from "@captify-io/core/flow";
import {
  spacesFlows,
  spacesFlowConfig
} from "@captify-io/core/spaces/flow";
import {
  Card,
  Button,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@captify-io/core/ui";
import {
  Network,
  Package,
  Users,
  MessageSquare,
  Layers,
  GitBranch
} from "lucide-react";

export default function SpacesArchitecturePage() {
  const [selectedFlow, setSelectedFlow] = useState<string>("complete");

  useEffect(() => {
  }, []);

  const flowViews = [
    {
      id: "complete",
      label: "Complete Architecture",
      icon: Network,
      description: "All entities and relationships",
      flow: spacesFlows.complete
    },
    {
      id: "technical",
      label: "Technical View",
      icon: Users,
      description: "What technical users see: spaces, tasks, tickets, time entries",
      flow: spacesFlows.technical
    },
    {
      id: "manager",
      label: "Manager View",
      icon: Layers,
      description: "What managers see: workstreams, spaces, features, team, requests",
      flow: spacesFlows.manager
    },
    {
      id: "executive",
      label: "Executive View",
      icon: GitBranch,
      description: "What executives see: contracts, CLINs, workstreams, objectives",
      flow: spacesFlows.executive
    },
    {
      id: "financial",
      label: "Financial View",
      icon: MessageSquare,
      description: "What financial users see: contracts, CLINs, time tracking",
      flow: spacesFlows.financial
    },
    {
      id: "productSpace",
      label: "Product Space",
      icon: Package,
      description: "Product space hierarchy: Feature → User Story → Task",
      flow: spacesFlows.productSpace
    },
    {
      id: "serviceSpace",
      label: "Service Space",
      icon: Network,
      description: "Service space hierarchy: Task and Ticket (flat)",
      flow: spacesFlows.serviceSpace
    },
    {
      id: "financialHierarchy",
      label: "Financial Chain",
      icon: GitBranch,
      description: "Complete financial traceability: Contract → Task → Time Entry",
      flow: spacesFlows.financialHierarchy
    }
  ];

  const currentView = flowViews.find(v => v.id === selectedFlow) || flowViews[0];

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Compact Header */}
      <div className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Spaces Architecture
              </h1>
              <div className="flex items-center gap-1">
                {flowViews.map((view) => {
                  const Icon = view.icon;
                  const isActive = selectedFlow === view.id;
                  return (
                    <Button
                      key={view.id}
                      variant={isActive ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setSelectedFlow(view.id)}
                      className={
                        isActive
                          ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 h-8"
                          : "h-8"
                      }
                      title={view.description}
                    >
                      <Icon className="w-3.5 h-3.5 mr-1.5" />
                      <span className="text-xs">{view.label.split(' ')[0]}</span>
                    </Button>
                  );
                })}
              </div>
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400">
              {currentView.description}
            </div>
          </div>
        </div>
      </div>

      {/* Flow Canvas */}
      <div className="flex-1 relative">
        <Flow
          initialNodes={currentView.flow.nodes}
          initialEdges={currentView.flow.edges}
          mode="ontology"
          config={spacesFlowConfig}
        />
      </div>

      {/* Legend */}
      <div className="border-t bg-white dark:bg-slate-900 px-6 py-3">
        <div className="container mx-auto">
          <div className="grid grid-cols-6 gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-900"></div>
              <span className="text-slate-600 dark:text-slate-400">Contract</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-700"></div>
              <span className="text-slate-600 dark:text-slate-400">CLIN</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
              <span className="text-slate-600 dark:text-slate-400">Workstream</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-slate-600 dark:text-slate-400">Space</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-pink-500"></div>
              <span className="text-slate-600 dark:text-slate-400">Feature</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500"></div>
              <span className="text-slate-600 dark:text-slate-400">User Story</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-lime-500"></div>
              <span className="text-slate-600 dark:text-slate-400">Task</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-slate-600 dark:text-slate-400">Ticket</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-teal-500"></div>
              <span className="text-slate-600 dark:text-slate-400">Time Entry</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-0.5 bg-slate-400" style={{ borderTop: "2px dashed" }}></div>
              <span className="text-slate-600 dark:text-slate-400">Many-to-Many</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-0.5 bg-purple-500"></div>
              <span className="text-slate-600 dark:text-slate-400">Animated = Financial Flow</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";
