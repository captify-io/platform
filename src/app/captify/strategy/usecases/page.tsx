"use client";

import React, { useEffect, useState } from "react";
import { useCaptify, PageToolbar } from "@captify-io/core/components";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Beaker, User, TrendingUp, Eye, EyeOff } from "lucide-react";
import { Badge, Button } from "@captify-io/core/components";
import { getEntitiesByTenant, getTasksByEntity, updateEntity } from "@/lib/ontology";
import type { UseCase, Outcome, Task, LifecycleStage } from "@/types/ontology";
import { ONTOLOGY_TABLES } from "@/types/ontology";

const lifecycleStages: { key: LifecycleStage; label: string; headerColor: string; bgColor: string }[] = [
  { key: "ideation", label: "Ideation", headerColor: "bg-gray-500/90 dark:bg-gray-600", bgColor: "bg-gray-100" },
  { key: "validation", label: "Validation", headerColor: "bg-blue-500/90 dark:bg-blue-600", bgColor: "bg-blue-100" },
  { key: "prototype", label: "In Work", headerColor: "bg-purple-500/90 dark:bg-purple-600", bgColor: "bg-purple-100" },
  { key: "operational", label: "Operational", headerColor: "bg-green-500/90 dark:bg-green-600", bgColor: "bg-green-100" },
  { key: "retired", label: "Retired", headerColor: "bg-gray-600/90 dark:bg-gray-700", bgColor: "bg-gray-200" },
];

export default function UseCasesPage() {
  const { session } = useCaptify();
  const router = useRouter();
  const searchParams = useSearchParams();
  const outcomeFilter = searchParams?.get("outcome");

  const [useCases, setUseCases] = useState<UseCase[]>([]);
  const [outcomes, setOutcomes] = useState<Outcome[]>([]);
  const [tasks, setTasks] = useState<Record<string, Task[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draggedItem, setDraggedItem] = useState<UseCase | null>(null);
  const [dragOverStage, setDragOverStage] = useState<LifecycleStage | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Toolbar state
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isWatched, setIsWatched] = useState(false);
  const [showRetired, setShowRetired] = useState(false);

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

      // Load use cases and outcomes
      const [useCasesRes, outcomesRes] = await Promise.all([
        getEntitiesByTenant<UseCase>(ONTOLOGY_TABLES.USE_CASE, tenantId),
        getEntitiesByTenant<Outcome>(ONTOLOGY_TABLES.OUTCOME, tenantId),
      ]);

      if (useCasesRes.success && useCasesRes.data?.items) {
        let filteredUseCases = useCasesRes.data.items;

        // Filter by outcome if specified
        if (outcomeFilter) {
          filteredUseCases = filteredUseCases.filter((uc) =>
            uc.outcomes?.includes(outcomeFilter)
          );
        }

        setUseCases(filteredUseCases);

        // Load tasks for each use case
        const tasksMap: Record<string, Task[]> = {};
        await Promise.all(
          filteredUseCases.map(async (uc) => {
            const tasksRes = await getTasksByEntity(uc.id, "UseCase");
            if (tasksRes.success && tasksRes.data?.items) {
              tasksMap[uc.id] = tasksRes.data.items;
            }
          })
        );
        setTasks(tasksMap);
      } else {
        setError(useCasesRes.error || "Failed to load use cases");
      }

      if (outcomesRes.success && outcomesRes.data?.items) {
        setOutcomes(outcomesRes.data.items);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  // Group use cases by stage, filtering out retired unless showRetired is true
  const useCasesByStage = lifecycleStages.reduce((acc, stage) => {
    const filtered = useCases.filter((uc) => uc.stage === stage.key);
    // Only include retired stage if showRetired is true
    if (stage.key === "retired" && !showRetired) {
      acc[stage.key] = [];
    } else {
      acc[stage.key] = filtered;
    }
    return acc;
  }, {} as Record<LifecycleStage, UseCase[]>);

  // Get outcome name by ID
  const getOutcomeName = (outcomeIds: string[]) => {
    if (!outcomeIds || outcomeIds.length === 0) return "No outcome";
    const outcome = outcomes.find((o) => o.id === outcomeIds[0]);
    return outcome?.name || "Unknown";
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, useCase: UseCase) => {
    if (!hasEditAccess) {
      e.preventDefault();
      return;
    }
    setDraggedItem(useCase);
    setIsDragging(true);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", useCase.id);
  };

  const handleDragOver = (e: React.DragEvent, stage: LifecycleStage) => {
    if (!hasEditAccess || !draggedItem) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverStage(stage);
  };

  const handleDragLeave = () => {
    setDragOverStage(null);
  };

  const handleDrop = async (e: React.DragEvent, targetStage: LifecycleStage) => {
    e.preventDefault();
    e.stopPropagation();

    setDragOverStage(null);

    if (!draggedItem || !hasEditAccess) return;

    if (draggedItem.stage !== targetStage) {
      try {
        // Update the use case stage in the database
        const response = await updateEntity(ONTOLOGY_TABLES.USE_CASE, draggedItem.id, {
          stage: targetStage,
        });

        if (response.success) {
          // Update local state
          setUseCases(useCases.map(uc =>
            uc.id === draggedItem.id ? { ...uc, stage: targetStage } : uc
          ));
        } else {
          console.error("Failed to update use case:", response.error);
          alert("Failed to move use case: " + (response.error || "Unknown error"));
        }
      } catch (err) {
        console.error("Failed to update use case stage:", err);
        alert("Failed to move use case. Please try again.");
      }
    }

    setDraggedItem(null);
    setIsDragging(false);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverStage(null);
    setIsDragging(false);
  };

  const handleCardClick = (e: React.MouseEvent, useCaseId: string) => {
    // Don't navigate if dragging or just finished dragging
    if (isDragging) {
      e.preventDefault();
      return;
    }
    router.push(`/captify/strategy/usecases/${useCaseId}`);
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
              <Beaker className="h-8 w-8" />
              Use Cases (Validation Pipeline)
            </h1>
            <p className="text-muted-foreground">
              Experiment and validate new capabilities from idea to POC
            </p>
            {outcomeFilter && (
              <Badge className="mt-2">
                Filtered by outcome: {outcomes.find((o) => o.id === outcomeFilter)?.name || outcomeFilter}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setShowRetired(!showRetired)}
            >
              {showRetired ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
              {showRetired ? "Hide" : "Show"} Retired
            </Button>
            <PageToolbar
              isBookmarked={isBookmarked}
              onBookmarkToggle={() => setIsBookmarked(!isBookmarked)}
              isWatched={isWatched}
              onWatchToggle={() => setIsWatched(!isWatched)}
              onAgentOpen={() => {
                alert("Opening AI Agent for Use Cases");
              }}
            />
            <Button
              onClick={() => router.push("/captify/strategy/usecases/new")}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Use Case
            </Button>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-muted-foreground">Loading use cases...</div>
          </div>
        )}

        {error && !loading && (
          <div className="p-4 bg-destructive/10 border border-destructive text-destructive rounded-md">
            Error: {error}
          </div>
        )}

        {!loading && !error && useCases.length === 0 && (
          <div className="text-center py-12">
            <Beaker className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">No use cases found</p>
            {hasEditAccess && (
              <button
                onClick={() => router.push("/captify/strategy/usecases/new")}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                Create Your First Use Case
              </button>
            )}
          </div>
        )}

        {!loading && !error && useCases.length > 0 && (
          <>
            {/* Kanban Board */}
            <div className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-280px)]">
              {lifecycleStages.filter(stage => stage.key !== "retired" || showRetired).map((stage) => {
                const stageUseCases = useCasesByStage[stage.key] || [];

                return (
                  <div
                    key={stage.key}
                    className="flex-shrink-0 w-80 flex flex-col rounded-lg overflow-hidden"
                  >
                    {/* Column Header - Darker background for visibility */}
                    <div className={`${stage.headerColor} text-white border border-b-0 rounded-t-lg px-4 py-3`}>
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-sm">{stage.label}</h3>
                        <Badge variant="outline" className="bg-white/20 text-white border-white/30">{stageUseCases.length}</Badge>
                      </div>
                    </div>

                    {/* Scrollable Content Area */}
                    <div
                      className={`flex-1 overflow-y-auto border border-t-0 rounded-b-lg p-3 space-y-3 transition-colors ${
                        dragOverStage === stage.key
                          ? 'bg-primary/10 border-primary'
                          : 'bg-muted/30'
                      }`}
                      onDragOver={(e) => handleDragOver(e, stage.key)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, stage.key)}
                    >
                      {stageUseCases.map((useCase) => {
                        const useCaseTasks = tasks[useCase.id] || [];
                        const completedTasks = useCaseTasks.filter(
                          (t) => t.status === "done"
                        ).length;
                        const totalTasks = useCaseTasks.length;

                        return (
                          <div
                            key={useCase.id}
                            draggable={hasEditAccess}
                            onDragStart={(e) => handleDragStart(e, useCase)}
                            onDragEnd={handleDragEnd}
                            className={`bg-card border rounded-lg p-3 hover:shadow-md transition-all select-none ${
                              hasEditAccess ? 'cursor-move' : 'cursor-pointer'
                            } ${draggedItem?.id === useCase.id ? 'opacity-50 rotate-2 scale-95' : ''}`}
                            onClick={(e) => handleCardClick(e, useCase.id)}
                          >
                            <h4 className="font-medium text-sm mb-2 line-clamp-2">
                              {useCase.name}
                            </h4>

                            {useCase.description && (
                              <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                                {useCase.description}
                              </p>
                            )}

                            {/* Linked Outcome */}
                            <div className="flex items-center gap-1 mb-2">
                              <TrendingUp className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                {getOutcomeName(useCase.outcomes || [])}
                              </span>
                            </div>

                            {/* Owner & Priority */}
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">
                                  {useCase.owner}
                                </span>
                              </div>
                              <Badge
                                variant={
                                  useCase.priority === "high" || useCase.priority === "urgent"
                                    ? "destructive"
                                    : useCase.priority === "medium"
                                    ? "default"
                                    : "secondary"
                                }
                                className="text-xs"
                              >
                                {useCase.priority}
                              </Badge>
                            </div>

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
                                    className="h-full bg-blue-500"
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

                      {stageUseCases.length === 0 && (
                        <div className="text-center py-8 text-sm text-muted-foreground">
                          No use cases in this stage
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
