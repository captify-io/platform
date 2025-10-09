"use client";

import React, { useEffect, useState } from "react";
import { useCaptify } from "@captify-io/core/components";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Edit, Trash2, Calendar, Users, Target } from "lucide-react";
import { getEntityById, deleteEntity, getOutcomesByStrategy } from "@/lib/ontology";
import type { Strategy, Outcome } from "@/types/ontology";
import { ONTOLOGY_TABLES } from "@/types/ontology";

export default function StrategyDetailPage() {
  const { session } = useCaptify();
  const router = useRouter();
  const params = useParams();
  const strategyId = params.id as string;

  // Redirect if this is actually a sub-route, not a strategy ID
  const reservedRoutes = ['usecases', 'capabilities', 'outcomes', 'objectives', 'contracts'];
  if (reservedRoutes.includes(strategyId)) {
    // This shouldn't render - Next.js should match the specific folder first
    // But just in case, return null
    return null;
  }

  const [strategy, setStrategy] = useState<Strategy | null>(null);
  const [outcomes, setOutcomes] = useState<Outcome[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const userGroups = (session as any)?.groups || [];
  const hasEditAccess = userGroups.some((g: string) =>
    g.includes("admin") || g.includes("program-manager")
  );

  useEffect(() => {
    loadStrategy();
    loadOutcomes();
  }, [strategyId]);

  async function loadStrategy() {
    try {
      setLoading(true);
      const response = await getEntityById<Strategy>(ONTOLOGY_TABLES.STRATEGY, strategyId);

      if (response.success && response.data) {
        setStrategy(response.data);
      } else {
        setError(response.error || "Strategy not found");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  async function loadOutcomes() {
    try {
      const response = await getOutcomesByStrategy(strategyId);
      if (response.success && response.data?.items) {
        setOutcomes(response.data.items);
      }
    } catch (err) {
      console.error("Failed to load outcomes:", err);
    }
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this strategy?")) return;

    try {
      const response = await deleteEntity(ONTOLOGY_TABLES.STRATEGY, strategyId);
      if (response.success) {
        router.push("/captify/strategy");
      } else {
        alert("Failed to delete strategy: " + response.error);
      }
    } catch (err) {
      alert("Error deleting strategy");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading strategy...</p>
      </div>
    );
  }

  if (error || !strategy) {
    return (
      <div className="p-6">
        <div className="p-4 bg-destructive/10 border border-destructive text-destructive rounded-md">
          {error || "Strategy not found"}
        </div>
        <button
          onClick={() => router.push("/captify/strategy")}
          className="mt-4 px-4 py-2 bg-muted rounded-md hover:bg-muted/80"
        >
          Back to Strategies
        </button>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-background p-6 overflow-auto">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push("/captify/strategy")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Strategies
          </button>

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{strategy.name}</h1>
              {strategy.description && (
                <p className="text-muted-foreground">{strategy.description}</p>
              )}
            </div>
            {hasEditAccess && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => router.push(`/strategy/${strategyId}/edit`)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  className="p-2 hover:bg-destructive/10 text-destructive rounded-md"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 border rounded-lg bg-card">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Users className="h-4 w-4" />
              <span className="text-sm">Owner Team</span>
            </div>
            <div className="font-medium">{strategy.ownerTeam}</div>
          </div>

          <div className="p-4 border rounded-lg bg-card">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Calendar className="h-4 w-4" />
              <span className="text-sm">Period</span>
            </div>
            <div className="font-medium">
              {strategy.startDate && strategy.endDate
                ? `${new Date(strategy.startDate).toLocaleDateString()} - ${new Date(
                    strategy.endDate
                  ).toLocaleDateString()}`
                : "Not set"}
            </div>
          </div>

          <div className="p-4 border rounded-lg bg-card">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Target className="h-4 w-4" />
              <span className="text-sm">Status</span>
            </div>
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
          </div>
        </div>

        {/* Outcomes Section */}
        <div className="border rounded-lg p-6 bg-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Linked Outcomes</h2>
            {hasEditAccess && (
              <button
                onClick={() =>
                  router.push(`/strategy/outcomes/new?strategyId=${strategyId}`)
                }
                className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                Add Outcome
              </button>
            )}
          </div>

          {outcomes.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No outcomes linked to this strategy yet
            </p>
          ) : (
            <div className="space-y-3">
              {outcomes.map((outcome) => (
                <div
                  key={outcome.id}
                  className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                  onClick={() => router.push(`/strategy/outcomes/${outcome.id}`)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium mb-1">{outcome.name}</h3>
                      {outcome.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {outcome.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">
                          Readiness
                        </div>
                        <div className="font-medium">{outcome.readinessScore}%</div>
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          outcome.maturity === "operational"
                            ? "bg-green-100 text-green-800"
                            : outcome.maturity === "prototype"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-muted text-foreground"
                        }`}
                      >
                        {outcome.maturity}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* KPIs Section */}
        {strategy.kpis && Object.keys(strategy.kpis).length > 0 && (
          <div className="mt-6 border rounded-lg p-6 bg-card">
            <h2 className="text-xl font-semibold mb-4">Key Performance Indicators</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(strategy.kpis).map(([key, value]) => (
                <div key={key} className="p-3 border rounded bg-background">
                  <div className="text-sm text-muted-foreground mb-1">{key}</div>
                  <div className="font-medium">{String(value)}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
