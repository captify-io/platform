"use client";

import React, { useEffect, useState } from "react";
import { useCaptify, PageToolbar } from "@captify-io/core/components";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
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
import { getEntitiesByTenant } from "@/lib/ontology";
import type { Outcome, Objective, UseCase, Capability } from "@/types/ontology";
import { ONTOLOGY_TABLES } from "@/types/ontology";

export default function OutcomesPage() {
  const { session } = useCaptify();
  const router = useRouter();
  const [outcomes, setOutcomes] = useState<Outcome[]>([]);
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [useCases, setUseCases] = useState<UseCase[]>([]);
  const [capabilities, setCapabilities] = useState<Capability[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Toolbar state
  const [filterPriority, setFilterPriority] = useState<string>("");
  const [filterCategory, setFilterCategory] = useState<string>("");
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

      // Load all entities in parallel
      const [outcomesRes, objectivesRes, useCasesRes, capabilitiesRes] = await Promise.all([
        getEntitiesByTenant<Outcome>(ONTOLOGY_TABLES.OUTCOME, tenantId),
        getEntitiesByTenant<Objective>(ONTOLOGY_TABLES.OBJECTIVE, tenantId),
        getEntitiesByTenant<UseCase>(ONTOLOGY_TABLES.USE_CASE, tenantId),
        getEntitiesByTenant<Capability>(ONTOLOGY_TABLES.CAPABILITY, tenantId),
      ]);

      if (outcomesRes.success && outcomesRes.data?.items) {
        setOutcomes(outcomesRes.data.items);
      } else {
        setError(outcomesRes.error || "Failed to load outcomes");
      }

      if (objectivesRes.success && objectivesRes.data?.items) {
        setObjectives(objectivesRes.data.items);
      }

      if (useCasesRes.success && useCasesRes.data?.items) {
        setUseCases(useCasesRes.data.items);
      }

      if (capabilitiesRes.success && capabilitiesRes.data?.items) {
        setCapabilities(capabilitiesRes.data.items);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  function getPriorityColor(priority: string): string {
    switch (priority) {
      case "High":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "Medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "Low":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  }

  function getStatusColor(status: string): string {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "Planned":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "Committed":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "Sustaining":
        return "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200";
      case "Retired":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  }

  // Get unique categories for filter
  const categories = React.useMemo(() => {
    const uniqueCategories = new Set(outcomes.map(o => o.category).filter(Boolean));
    return Array.from(uniqueCategories).sort();
  }, [outcomes]);

  // Filter outcomes based on toolbar filters
  const filteredOutcomes = React.useMemo(() => {
    return outcomes.filter((outcome) => {
      if (filterPriority && outcome.priority !== filterPriority) return false;
      if (filterCategory && outcome.category !== filterCategory) return false;
      return true;
    });
  }, [outcomes, filterPriority, filterCategory]);

  // Get relationship counts for an outcome
  function getRelationshipCounts(outcome: Outcome) {
    const linkedObjectivesCount = outcome.linkedObjectives?.length || 0;
    const linkedUseCasesCount = outcome.linkedUseCases?.length || 0;
    const linkedCapabilitiesCount = outcome.linkedCapabilities?.length || 0;

    return {
      objectives: linkedObjectivesCount,
      useCases: linkedUseCasesCount,
      capabilities: linkedCapabilitiesCount,
    };
  }

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
            <h1 className="text-3xl font-bold mb-2">Outcomes</h1>
            <p className="text-muted-foreground">
              Define and track strategic outcomes that drive mission and business value
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
                    { value: "High", label: "High" },
                    { value: "Medium", label: "Medium" },
                    { value: "Low", label: "Low" },
                  ],
                  value: filterPriority,
                  onChange: setFilterPriority,
                },
                {
                  id: "category",
                  label: "Category",
                  type: "select",
                  options: categories.map(c => ({ value: c as string, label: c as string })),
                  value: filterCategory,
                  onChange: setFilterCategory,
                },
              ]}
              isBookmarked={isBookmarked}
              onBookmarkToggle={() => setIsBookmarked(!isBookmarked)}
              isWatched={isWatched}
              onWatchToggle={() => setIsWatched(!isWatched)}
              onAgentOpen={() => {
                alert("Opening AI Agent for Outcomes");
              }}
            />
            <Button
              onClick={() => router.push("/captify/strategy/outcomes/new")}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Outcome
            </Button>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-muted-foreground">Loading outcomes...</div>
          </div>
        )}

        {error && !loading && (
          <div className="p-4 bg-destructive/10 border border-destructive text-destructive rounded-md">
            Error: {error}
          </div>
        )}

        {!loading && !error && outcomes.length === 0 && (
          <div className="text-center py-12 border rounded-lg">
            <p className="text-muted-foreground mb-4">No outcomes found</p>
            {hasEditAccess && (
              <button
                onClick={() => router.push("/captify/outcomes/new")}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                Create Your First Outcome
              </button>
            )}
          </div>
        )}

        {!loading && !error && outcomes.length > 0 && (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">Priority</TableHead>
                  <TableHead className="min-w-[200px]">Outcome Name</TableHead>
                  <TableHead className="w-32">Category</TableHead>
                  <TableHead className="w-24 text-center">Objectives</TableHead>
                  <TableHead className="w-24 text-center">Use Cases</TableHead>
                  <TableHead className="w-24 text-center">Capabilities</TableHead>
                  <TableHead className="w-32">Status</TableHead>
                  <TableHead className="w-32">Readiness</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOutcomes.map((outcome) => {
                  const counts = getRelationshipCounts(outcome);

                  return (
                    <TableRow
                      key={outcome.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => router.push(`/captify/strategy/outcomes/${outcome.id}`)}
                    >
                      <TableCell>
                        <span
                          className={`inline-flex items-center justify-center px-2 py-1 rounded text-xs font-medium uppercase w-16 ${getPriorityColor(outcome.priority || "Medium")}`}
                        >
                          {outcome.priority || "Medium"}
                        </span>
                      </TableCell>
                      <TableCell className="min-w-[200px]">
                        <div className="space-y-1">
                          <div className="flex items-baseline gap-2 flex-wrap">
                            <div className="font-medium">
                              {outcome.name}
                            </div>
                            <div className="text-xs text-muted-foreground whitespace-nowrap">
                              {new Date(outcome.updatedAt || "").toLocaleDateString()}
                            </div>
                          </div>
                          {outcome.description && (
                            <div className="text-sm text-muted-foreground">
                              {outcome.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {outcome.category && (
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            {outcome.category}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {counts.objectives > 0 ? (
                          <span className="text-blue-600 dark:text-blue-400 font-medium">
                            {counts.objectives}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {counts.useCases > 0 ? (
                          <span className="text-blue-600 dark:text-blue-400 font-medium">
                            {counts.useCases}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {counts.capabilities > 0 ? (
                          <span className="text-blue-600 dark:text-blue-400 font-medium">
                            {counts.capabilities}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getStatusColor(outcome.status || "Planned")}`}
                        >
                          {outcome.status || "Planned"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="w-32">
                          <ReadinessProgressBar
                            score={outcome.readinessScore || 0}
                            size="sm"
                            showLabel={true}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
