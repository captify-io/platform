"use client";

import React, { useEffect, useState } from "react";
import { useCaptify, PageToolbar } from "@captify-io/core/components";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Rocket, User, Calendar, DollarSign, Wrench } from "lucide-react";
import { LifecycleStepIndicator } from "@captify-io/core/components";
import { Badge, Button } from "@captify-io/core/components";
import { getEntitiesByTenant, getCapabilitiesByOutcome, getTasksByEntity } from "@/lib/ontology";
import type { Capability, Outcome, UseCase, Task, LifecycleStage } from "@/types/ontology";
import { ONTOLOGY_TABLES } from "@/types/ontology";

const lifecycleStages: { key: LifecycleStage; label: string; color: string }[] = [
  { key: "ideation", label: "Planning", color: "bg-gray-100" },
  { key: "validation", label: "Design", color: "bg-blue-100" },
  { key: "prototype", label: "Build", color: "bg-purple-100" },
  { key: "operational", label: "Deployed", color: "bg-green-100" },
  { key: "continuous", label: "Optimizing", color: "bg-teal-100" },
  { key: "retired", label: "Sunset", color: "bg-gray-200" },
];

export default function CapabilitiesPage() {
  const { session } = useCaptify();
  const router = useRouter();
  const searchParams = useSearchParams();
  const outcomeFilter = searchParams?.get("outcome");

  const [capabilities, setCapabilities] = useState<Capability[]>([]);
  const [outcomes, setOutcomes] = useState<Outcome[]>([]);
  const [useCases, setUseCases] = useState<UseCase[]>([]);
  const [tasks, setTasks] = useState<Record<string, Task[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Toolbar state
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isWatched, setIsWatched] = useState(false);

  const userGroups = (session as any)?.groups || [];
  const hasEditAccess = userGroups.some((g: string) =>
    g.includes("admin") || g.includes("program-manager")
  );

  useEffect(() => {
    loadData();
  }, [session, outcomeFilter]);

  async function loadData() {
    if (!session?.user) return;

    try {
      setLoading(true);
      const tenantId = (session.user as any).tenantId || "default";

      // Load capabilities, outcomes, and use cases
      const [capabilitiesRes, outcomesRes, useCasesRes] = await Promise.all([
        getEntitiesByTenant<Capability>(ONTOLOGY_TABLES.CAPABILITY, tenantId),
        getEntitiesByTenant<Outcome>(ONTOLOGY_TABLES.OUTCOME, tenantId),
        getEntitiesByTenant<UseCase>(ONTOLOGY_TABLES.USE_CASE, tenantId),
      ]);

      if (capabilitiesRes.success && capabilitiesRes.data?.items) {
        let filteredCapabilities = capabilitiesRes.data.items;

        // Filter by outcome if specified
        if (outcomeFilter) {
          filteredCapabilities = filteredCapabilities.filter(
            (cap) => cap.outcomeId === outcomeFilter
          );
        }

        setCapabilities(filteredCapabilities);

        // Load tasks for each capability
        const tasksMap: Record<string, Task[]> = {};
        await Promise.all(
          filteredCapabilities.map(async (cap) => {
            const tasksRes = await getTasksByEntity(cap.id, "Capability");
            if (tasksRes.success && tasksRes.data?.items) {
              tasksMap[cap.id] = tasksRes.data.items;
            }
          })
        );
        setTasks(tasksMap);
      } else {
        setError(capabilitiesRes.error || "Failed to load capabilities");
      }

      if (outcomesRes.success && outcomesRes.data?.items) {
        setOutcomes(outcomesRes.data.items);
      }

      if (useCasesRes.success && useCasesRes.data?.items) {
        setUseCases(useCasesRes.data.items);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  // Group capabilities by stage
  const capabilitiesByStage = lifecycleStages.reduce((acc, stage) => {
    acc[stage.key] = capabilities.filter((cap) => cap.stage === stage.key);
    return acc;
  }, {} as Record<LifecycleStage, Capability[]>);

  // Get outcome name by ID
  const getOutcomeName = (outcomeId: string) => {
    const outcome = outcomes.find((o) => o.id === outcomeId);
    return outcome?.name || "Unknown outcome";
  };

  // Get use case name by ID
  const getUseCaseName = (useCaseId?: string) => {
    if (!useCaseId) return null;
    const useCase = useCases.find((uc) => uc.id === useCaseId);
    return useCase?.name || "Unknown POC";
  };

  if (!session?.user) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Please log in to continue</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-background p-6 overflow-auto">
      <div className="max-w-full mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
              <Rocket className="h-8 w-8" />
              Capabilities (Delivery Pipeline)
            </h1>
            <p className="text-muted-foreground">
              Deploy proven capabilities from POC to production
            </p>
            {outcomeFilter && (
              <Badge className="mt-2">
                Filtered by outcome: {outcomes.find((o) => o.id === outcomeFilter)?.name || outcomeFilter}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3">
            <PageToolbar
              isBookmarked={isBookmarked}
              onBookmarkToggle={() => setIsBookmarked(!isBookmarked)}
              isWatched={isWatched}
              onWatchToggle={() => setIsWatched(!isWatched)}
              onAgentOpen={() => {
                alert("Opening AI Agent for Capabilities");
              }}
            />
            <Button
              onClick={() => router.push("/captify/strategy/capabilities/new")}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Capability
            </Button>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-muted-foreground">Loading capabilities...</div>
          </div>
        )}

        {error && !loading && (
          <div className="p-4 bg-destructive/10 border border-destructive text-destructive rounded-md">
            Error: {error}
          </div>
        )}

        {!loading && !error && capabilities.length === 0 && (
          <div className="text-center py-12">
            <Rocket className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">No capabilities found</p>
            {hasEditAccess && (
              <button
                onClick={() => router.push("/captify/strategy/capabilities/new")}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                Create Your First Capability
              </button>
            )}
          </div>
        )}

        {!loading && !error && capabilities.length > 0 && (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
              {lifecycleStages.map((stage) => (
                <div key={stage.key} className={`p-3 border rounded-lg ${stage.color}`}>
                  <div className="text-xs text-muted-foreground mb-1">{stage.label}</div>
                  <div className="text-2xl font-bold">
                    {capabilitiesByStage[stage.key]?.length || 0}
                  </div>
                </div>
              ))}
            </div>

            {/* Kanban Board */}
            <div className="flex gap-4 overflow-x-auto pb-4">
              {lifecycleStages.map((stage) => {
                const stageCapabilities = capabilitiesByStage[stage.key] || [];

                return (
                  <div
                    key={stage.key}
                    className="flex-shrink-0 w-80 bg-muted/30 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-sm">{stage.label}</h3>
                      <Badge variant="secondary">{stageCapabilities.length}</Badge>
                    </div>

                    <div className="space-y-3">
                      {stageCapabilities.map((capability) => {
                        const capabilityTasks = tasks[capability.id] || [];
                        const completedTasks = capabilityTasks.filter(
                          (t) => t.status === "done"
                        ).length;
                        const totalTasks = capabilityTasks.length;
                        const useCaseName = getUseCaseName(capability.linkedUseCaseId);

                        return (
                          <div
                            key={capability.id}
                            className="bg-card border rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() =>
                              router.push(`/captify/strategy/capabilities/${capability.id}`)
                            }
                          >
                            <h4 className="font-medium text-sm mb-2 line-clamp-2">
                              {capability.name}
                            </h4>

                            {capability.description && (
                              <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                                {capability.description}
                              </p>
                            )}

                            {/* Linked Use Case (POC) */}
                            {useCaseName && (
                              <div className="flex items-center gap-1 mb-2">
                                <Wrench className="h-3 w-3 text-blue-500" />
                                <span className="text-xs text-blue-600">
                                  From POC: {useCaseName}
                                </span>
                              </div>
                            )}

                            {/* Funding Source */}
                            {capability.fundingSource && (
                              <div className="flex items-center gap-1 mb-2">
                                <DollarSign className="h-3 w-3 text-green-600" />
                                <span className="text-xs text-muted-foreground">
                                  {capability.fundingSource}
                                </span>
                              </div>
                            )}

                            {/* Owner & Priority */}
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">
                                  {capability.owner}
                                </span>
                              </div>
                              <Badge
                                variant={
                                  capability.priority === "high" || capability.priority === "urgent"
                                    ? "destructive"
                                    : capability.priority === "medium"
                                    ? "default"
                                    : "secondary"
                                }
                                className="text-xs"
                              >
                                {capability.priority}
                              </Badge>
                            </div>

                            {/* Target Date */}
                            {capability.targetDate && (
                              <div className="flex items-center gap-1 mb-2">
                                <Calendar className="h-3 w-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">
                                  Target: {new Date(capability.targetDate).toLocaleDateString()}
                                </span>
                              </div>
                            )}

                            {/* Tasks Progress */}
                            {totalTasks > 0 && (
                              <div className="mt-2 pt-2 border-t">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-muted-foreground">Tasks</span>
                                  <span className="font-medium">
                                    {completedTasks}/{totalTasks}
                                  </span>
                                </div>
                                <div className="mt-1 h-1.5 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-green-500"
                                    style={{
                                      width: `${totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0}%`,
                                    }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {stageCapabilities.length === 0 && (
                        <div className="text-center py-8 text-sm text-muted-foreground">
                          No capabilities in this stage
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
