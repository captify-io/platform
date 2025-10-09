"use client";

import React, { useEffect, useState } from "react";
import { useCaptify, PageToolbar } from "@captify-io/core/components";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Button,
} from "@captify-io/core/components";
import { ReadinessProgressBar } from "@captify-io/core/components";
import { getObjectives, deleteEntity, getEntitiesByTenant } from "@/lib/ontology";
import type { Objective, Outcome } from "@/types/ontology";
import { ONTOLOGY_TABLES } from "@/types/ontology";

export default function ObjectivesPage() {
  const { session } = useCaptify();
  const router = useRouter();
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [outcomes, setOutcomes] = useState<Outcome[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOutcomeIds, setSelectedOutcomeIds] = useState<string[]>([]);
  const [showOutcomeFlyout, setShowOutcomeFlyout] = useState(false);

  // Toolbar state
  const [filterPriority, setFilterPriority] = useState<string>("");
  const [filterDomain, setFilterDomain] = useState<string>("");
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isWatched, setIsWatched] = useState(false);

  const userGroups = (session as any)?.groups || [];
  const hasEditAccess = userGroups.some((g: string) =>
    g.includes("admin") || g.includes("program-manager")
  );

  useEffect(() => {
    loadData();
  }, [session]);

  async function loadData() {
    if (!session?.user) return;

    try {
      setLoading(true);
      const tenantId = (session.user as any).tenantId || "default";

      // Load objectives and outcomes in parallel
      const [objectivesRes, outcomesRes] = await Promise.all([
        getObjectives(tenantId),
        getEntitiesByTenant<Outcome>(ONTOLOGY_TABLES.OUTCOME, tenantId),
      ]);

      if (objectivesRes.success && objectivesRes.data?.items) {
        setObjectives(objectivesRes.data.items);
      } else {
        setError(objectivesRes.error || "Failed to load objectives");
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

  function handleOutcomesClick(outcomeIds: string[]) {
    setSelectedOutcomeIds(outcomeIds);
    setShowOutcomeFlyout(true);
  }

  function getPriorityColor(priority: string): string {
    switch (priority) {
      case "critical":
      case "urgent":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "high":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  }

  // Calculate progress for each objective based on linked outcomes
  function getObjectiveProgress(objective: Objective): number {
    if (!objective.linkedOutcomes || objective.linkedOutcomes.length === 0) {
      return 0;
    }

    const linkedOutcomes = outcomes.filter((o) =>
      objective.linkedOutcomes.includes(o.id)
    );

    if (linkedOutcomes.length === 0) return 0;

    const totalReadiness = linkedOutcomes.reduce(
      (sum, outcome) => sum + (outcome.readinessScore || 0),
      0
    );

    return Math.round(totalReadiness / linkedOutcomes.length);
  }

  // Get unique domains for filter
  const domains = React.useMemo(() => {
    const uniqueDomains = new Set(objectives.map(o => o.ownerTeam).filter(Boolean));
    return Array.from(uniqueDomains).sort();
  }, [objectives]);

  // Filter objectives based on toolbar filters
  const filteredObjectives = React.useMemo(() => {
    return objectives.filter((obj) => {
      if (filterPriority && obj.priority !== filterPriority) return false;
      if (filterDomain && obj.ownerTeam !== filterDomain) return false;
      return true;
    });
  }, [objectives, filterPriority, filterDomain]);

  // Group objectives by domain (ownerTeam)
  const groupedObjectives = React.useMemo(() => {
    const groups: Record<string, Objective[]> = {};
    filteredObjectives.forEach((obj) => {
      const domain = obj.ownerTeam || "Uncategorized";
      if (!groups[domain]) {
        groups[domain] = [];
      }
      groups[domain].push(obj);
    });
    return groups;
  }, [filteredObjectives]);

  if (!session?.user) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Please log in to continue</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-background p-6 overflow-auto">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Strategic Objectives</h1>
            <p className="text-muted-foreground">
              Manage high-level strategic goals and align them to outcomes
            </p>
          </div>
          <div className="flex items-center gap-3">
            <PageToolbar
              filters={[
                {
                  id: "priority",
                  label: "Priority",
                  type: "select",
                  options: [
                    { value: "critical", label: "Critical" },
                    { value: "urgent", label: "Urgent" },
                    { value: "high", label: "High" },
                    { value: "medium", label: "Medium" },
                    { value: "low", label: "Low" },
                  ],
                  value: filterPriority,
                  onChange: setFilterPriority,
                },
                {
                  id: "domain",
                  label: "Domain",
                  type: "select",
                  options: domains.map(d => ({ value: d, label: d })),
                  value: filterDomain,
                  onChange: setFilterDomain,
                },
              ]}
              isBookmarked={isBookmarked}
              onBookmarkToggle={() => setIsBookmarked(!isBookmarked)}
              isWatched={isWatched}
              onWatchToggle={() => setIsWatched(!isWatched)}
              onAgentOpen={() => {
                // TODO: Implement agent panel
                alert("Opening AI Agent for Strategic Objectives");
              }}
            />
            <Button
              onClick={() => router.push("/captify/strategy/objectives/new")}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Objective
            </Button>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-muted-foreground">Loading objectives...</div>
          </div>
        )}

        {error && !loading && (
          <div className="p-4 bg-destructive/10 border border-destructive text-destructive rounded-md">
            Error: {error}
          </div>
        )}

        {!loading && !error && objectives.length === 0 && (
          <div className="text-center py-12">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">No objectives found</p>
            {hasEditAccess && (
              <button
                onClick={() => router.push("/captify/objectives/new")}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                Create Your First Objective
              </button>
            )}
          </div>
        )}

        {!loading && !error && objectives.length > 0 && (
          <>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24">Priority</TableHead>
                    <TableHead className="min-w-[200px] max-w-[500px]">Objective Name</TableHead>
                    <TableHead className="w-24 text-center">Outcomes</TableHead>
                    <TableHead className="w-24 text-center">Use Cases</TableHead>
                    <TableHead className="w-24 text-center">Capabilities</TableHead>
                    <TableHead className="w-32">Progress</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(groupedObjectives).map(([domain, domainObjectives]) => (
                    <React.Fragment key={domain}>
                      {/* Domain Header Row */}
                      <TableRow className="bg-blue-100 dark:bg-blue-800 hover:bg-blue-100 dark:hover:bg-blue-800">
                        <TableCell colSpan={6} className="font-semibold text-blue-900 dark:text-blue-50">
                          {domain}
                          <span className="ml-2 text-sm font-normal text-blue-700 dark:text-blue-200">
                            ({domainObjectives.length} objective{domainObjectives.length !== 1 ? 's' : ''})
                          </span>
                        </TableCell>
                      </TableRow>

                      {/* Objective Rows */}
                      {domainObjectives.map((objective) => {
                        const progress = getObjectiveProgress(objective);
                        const linkedOutcomes = objective.linkedOutcomes?.length || 0;
                        const linkedUseCases = 0; // TODO: Add when available
                        const linkedCapabilities = 0; // TODO: Add when available

                        return (
                          <TableRow
                            key={objective.id}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => router.push(`/captify/strategy/objectives/${objective.id}`)}
                          >
                            <TableCell>
                              <span
                                className={`inline-flex items-center justify-center px-2 py-1 rounded text-xs font-medium uppercase w-16 ${getPriorityColor(objective.priority)}`}
                              >
                                {objective.priority}
                              </span>
                            </TableCell>
                            <TableCell className="min-w-[200px] max-w-[500px]">
                              <div className="space-y-1">
                                <div className="flex items-baseline gap-2 flex-wrap">
                                  <div className="font-medium break-words">
                                    {objective.name}
                                  </div>
                                  <div className="text-xs text-muted-foreground whitespace-nowrap">
                                    {new Date(objective.updatedAt || "").toLocaleDateString()}
                                  </div>
                                </div>
                                {objective.description && (
                                  <div className="text-sm text-muted-foreground break-words line-clamp-2">
                                    {objective.description}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              {linkedOutcomes > 0 ? (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOutcomesClick(objective.linkedOutcomes || []);
                                  }}
                                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium hover:underline"
                                >
                                  {linkedOutcomes}
                                </button>
                              ) : (
                                <span className="text-muted-foreground">0</span>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              <span className="text-muted-foreground">{linkedUseCases}</span>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className="text-muted-foreground">{linkedCapabilities}</span>
                            </TableCell>
                            <TableCell>
                              <div className="w-32">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // TODO: Show ROI modal
                                    alert(`ROI details for ${objective.name}`);
                                  }}
                                  className="w-full"
                                >
                                  <ReadinessProgressBar
                                    score={progress}
                                    size="sm"
                                    showLabel={true}
                                  />
                                </button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Outcome Flyout */}
            {showOutcomeFlyout && (
              <div className="fixed inset-0 z-50 flex">
                <div
                  className="flex-1 bg-black/50"
                  onClick={() => setShowOutcomeFlyout(false)}
                />
                <div className="w-96 bg-background border-l shadow-xl overflow-y-auto">
                  <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-background">
                    <h3 className="text-lg font-semibold">Linked Outcomes</h3>
                    <button
                      onClick={() => setShowOutcomeFlyout(false)}
                      className="p-2 hover:bg-muted rounded-md"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="p-4 space-y-4">
                    {selectedOutcomeIds.map((outcomeId) => {
                      const outcome = outcomes.find((o) => o.id === outcomeId);
                      return (
                        <div
                          key={outcomeId}
                          className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                          onClick={() => router.push(`/captify/outcomes/${outcomeId}`)}
                        >
                          {outcome ? (
                            <>
                              <div className="font-medium mb-1">{outcome.name}</div>
                              {outcome.description && (
                                <div className="text-sm text-muted-foreground">
                                  {outcome.description}
                                </div>
                              )}
                              {outcome.readinessScore !== undefined && (
                                <div className="mt-2">
                                  <ReadinessProgressBar
                                    score={outcome.readinessScore}
                                    size="sm"
                                    showLabel={true}
                                  />
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="text-sm text-muted-foreground">
                              Outcome ID: {outcomeId}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
