"use client";

import React, { useEffect, useState } from "react";
import { useCaptify, PageToolbar } from "@captify-io/core/components";
import { useRouter } from "next/navigation";
import { Plus, Edit, Trash2, Eye, Target, Flag, Beaker, Rocket, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button } from "@captify-io/core/components";
import { getStrategies, deleteEntity, getEntitiesByTenant } from "@/lib/ontology";
import { ONTOLOGY_TABLES } from "@/types/ontology";
import type { Strategy, Objective, Outcome, UseCase, Capability } from "@/types/ontology";

export default function StrategyPage() {
  const { session } = useCaptify();
  const router = useRouter();
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [outcomes, setOutcomes] = useState<Outcome[]>([]);
  const [useCases, setUseCases] = useState<UseCase[]>([]);
  const [capabilities, setCapabilities] = useState<Capability[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Toolbar state
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isWatched, setIsWatched] = useState(false);

  // Check permissions
  const userGroups = (session as any)?.groups || [];
  const hasEditAccess = userGroups.some((g: string) =>
    g.includes("admin") || g.includes("program-manager")
  );

  useEffect(() => {
    loadStrategies();
  }, [session]);

  async function loadStrategies() {
    if (!session?.user) return;

    try {
      setLoading(true);
      const tenantId = (session.user as any).tenantId || "default";

      // Load all strategy-related data in parallel
      const [strategiesRes, objectivesRes, outcomesRes, useCasesRes, capabilitiesRes] = await Promise.all([
        getStrategies(tenantId),
        getEntitiesByTenant<Objective>(ONTOLOGY_TABLES.OBJECTIVE, tenantId),
        getEntitiesByTenant<Outcome>(ONTOLOGY_TABLES.OUTCOME, tenantId),
        getEntitiesByTenant<UseCase>(ONTOLOGY_TABLES.USE_CASE, tenantId),
        getEntitiesByTenant<Capability>(ONTOLOGY_TABLES.CAPABILITY, tenantId),
      ]);

      if (strategiesRes.success && strategiesRes.data?.items) {
        setStrategies(strategiesRes.data.items);
      } else {
        setError(strategiesRes.error || "Failed to load strategies");
      }

      if (objectivesRes.success && objectivesRes.data?.items) {
        setObjectives(objectivesRes.data.items);
      }

      if (outcomesRes.success && outcomesRes.data?.items) {
        setOutcomes(outcomesRes.data.items);
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

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this strategy?")) return;

    try {
      const response = await deleteEntity(ONTOLOGY_TABLES.STRATEGY, id);
      if (response.success) {
        setStrategies(strategies.filter((s) => s.id !== id));
      } else {
        alert("Failed to delete strategy: " + response.error);
      }
    } catch (err) {
      alert("Error deleting strategy");
    }
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
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Strategies</h1>
            <p className="text-muted-foreground">
              Manage strategic objectives and enterprise AI initiatives
            </p>
          </div>
          <div className="flex items-center gap-3">
            <PageToolbar
              isBookmarked={isBookmarked}
              onBookmarkToggle={() => setIsBookmarked(!isBookmarked)}
              isWatched={isWatched}
              onWatchToggle={() => setIsWatched(!isWatched)}
              onAgentOpen={() => {
                alert("Opening AI Agent for Strategies");
              }}
            />
            <Button
              onClick={() => router.push("/captify/strategy/strategies/new")}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Strategy
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-muted-foreground">Loading strategies...</div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="p-4 bg-destructive/10 border border-destructive text-destructive rounded-md">
            Error: {error}
          </div>
        )}

        {/* Navigation Cards */}
        {!loading && !error && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {/* Objectives Card */}
              <Card
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => router.push("/captify/objectives")}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Target className="h-8 w-8 text-blue-600" />
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <CardTitle className="text-lg">Objectives</CardTitle>
                  <CardDescription>Strategic goals & targets</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{objectives.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Active objectives
                  </p>
                </CardContent>
              </Card>

              {/* Outcomes Card */}
              <Card
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => router.push("/captify/strategy/outcomes")}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Flag className="h-8 w-8 text-green-600" />
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <CardTitle className="text-lg">Outcomes</CardTitle>
                  <CardDescription>Business & mission results</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{outcomes.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {outcomes.filter((o) => o.maturity === "operational").length} operational
                  </p>
                </CardContent>
              </Card>

              {/* Use Cases Card */}
              <Card
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => router.push("/captify/strategy/usecases")}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Beaker className="h-8 w-8 text-purple-600" />
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <CardTitle className="text-lg">Use Cases</CardTitle>
                  <CardDescription>Validation pipeline</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{useCases.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {useCases.filter((uc) => uc.stage === "validation" || uc.stage === "prototype").length} in progress
                  </p>
                </CardContent>
              </Card>

              {/* Capabilities Card */}
              <Card
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => router.push("/captify/strategy/capabilities")}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Rocket className="h-8 w-8 text-orange-600" />
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <CardTitle className="text-lg">Capabilities</CardTitle>
                  <CardDescription>Delivery pipeline</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{capabilities.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {capabilities.filter((c) => c.stage === "operational").length} deployed
                  </p>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {/* Empty State */}
        {!loading && !error && strategies.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No strategies found</p>
            {hasEditAccess && (
              <button
                onClick={() => router.push("/captify/strategy/new")}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                Create Your First Strategy
              </button>
            )}
          </div>
        )}

        {/* Strategies Table */}
        {!loading && !error && strategies.length > 0 && (
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-4 font-semibold">Name</th>
                  <th className="text-left p-4 font-semibold">Owner Team</th>
                  <th className="text-left p-4 font-semibold">Status</th>
                  <th className="text-left p-4 font-semibold">Period</th>
                  <th className="text-left p-4 font-semibold">Outcomes</th>
                  <th className="text-right p-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {strategies.map((strategy) => (
                  <tr
                    key={strategy.id}
                    className="border-t hover:bg-muted/50 cursor-pointer"
                    onClick={() => router.push(`/captify/strategy/${strategy.id}`)}
                  >
                    <td className="p-4">
                      <div>
                        <div className="font-medium">{strategy.name}</div>
                        {strategy.description && (
                          <div className="text-sm text-muted-foreground line-clamp-1">
                            {strategy.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-sm">{strategy.ownerTeam}</span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          strategy.status === "active"
                            ? "bg-green-100 text-green-800"
                            : strategy.status === "draft"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-muted text-foreground"
                        }`}
                      >
                        {strategy.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="text-sm">
                        {strategy.startDate && strategy.endDate && (
                          <>
                            {new Date(strategy.startDate).getFullYear()} -{" "}
                            {new Date(strategy.endDate).getFullYear()}
                          </>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-sm">
                        {strategy.linkedObjectives?.length || 0} objectives
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        {hasEditAccess && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(strategy.id);
                            }}
                            className="p-2 hover:bg-destructive/10 text-destructive rounded-md"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
