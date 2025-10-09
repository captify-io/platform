"use client";

import React, { useEffect, useState } from "react";
import { useCaptify } from "@captify-io/core/components";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Edit, Trash2, Calendar, Link as LinkIcon, Rocket } from "lucide-react";
import { getEntityById, deleteEntity } from "@/lib/ontology";
import type { Capability } from "@/types/ontology";
import { ONTOLOGY_TABLES } from "@/types/ontology";
import { Button, ReadinessProgressBar } from "@captify-io/core/components";

export default function CapabilityDetailPage() {
  const { session } = useCaptify();
  const router = useRouter();
  const params = useParams();
  const capabilityId = params.id as string;

  const [capability, setCapability] = useState<Capability | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const userGroups = (session as any)?.groups || [];
  const hasEditAccess = userGroups.some((g: string) =>
    g.includes("admin") || g.includes("program-manager")
  );

  useEffect(() => {
    loadCapability();
  }, [capabilityId]);

  async function loadCapability() {
    try {
      setLoading(true);
      const response = await getEntityById<Capability>(ONTOLOGY_TABLES.CAPABILITY, capabilityId);

      if (response.success && response.data) {
        setCapability(response.data);
      } else {
        setError(response.error || "Capability not found");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this capability?")) return;

    try {
      const response = await deleteEntity(ONTOLOGY_TABLES.CAPABILITY, capabilityId);
      if (response.success) {
        router.push("/captify/strategy/capabilities");
      } else {
        alert("Failed to delete capability: " + response.error);
      }
    } catch (err) {
      alert("Error deleting capability");
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading capability...</p>
      </div>
    );
  }

  if (error || !capability) {
    return (
      <div className="p-6">
        <div className="p-4 bg-destructive/10 border border-destructive text-destructive rounded-md">
          {error || "Capability not found"}
        </div>
        <Button
          variant="outline"
          onClick={() => router.push("/captify/strategy/capabilities")}
          className="mt-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Capabilities
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-background p-6 overflow-auto">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push("/captify/strategy/capabilities")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Capabilities
          </Button>

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Rocket className="h-8 w-8 text-primary" />
                <h1 className="text-3xl font-bold">{capability.name}</h1>
                <span
                  className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getStatusColor(capability.status || "Planned")}`}
                >
                  {capability.status || "Planned"}
                </span>
              </div>
              {capability.description && (
                <p className="text-muted-foreground">{capability.description}</p>
              )}
            </div>

            {hasEditAccess && (
              <div className="flex items-center gap-2 ml-4">
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button variant="destructive" size="sm" onClick={handleDelete}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="border rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-4">Details</h2>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm text-muted-foreground">ID</dt>
                  <dd className="text-sm font-mono">{capability.id}</dd>
                </div>
                {capability.category && (
                  <div>
                    <dt className="text-sm text-muted-foreground">Category</dt>
                    <dd className="text-sm">
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {capability.category}
                      </span>
                    </dd>
                  </div>
                )}
                {capability.maturityLevel && (
                  <div>
                    <dt className="text-sm text-muted-foreground">Maturity Level</dt>
                    <dd className="text-sm">
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                        {capability.maturityLevel}
                      </span>
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-sm text-muted-foreground">Created</dt>
                  <dd className="text-sm flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {new Date(capability.createdAt).toLocaleDateString()}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Last Updated</dt>
                  <dd className="text-sm flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {new Date(capability.updatedAt || capability.createdAt).toLocaleDateString()}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Readiness */}
            <div className="border rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-4">Readiness Score</h2>
              <ReadinessProgressBar
                score={capability.readinessScore || 0}
                size="lg"
                showLabel={true}
              />
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Linked Outcomes */}
            <div className="border rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <LinkIcon className="h-5 w-5" />
                Linked Outcomes
              </h2>
              {capability.linkedOutcomes && capability.linkedOutcomes.length > 0 ? (
                <ul className="space-y-2">
                  {capability.linkedOutcomes.map((outcomeId) => (
                    <li key={outcomeId}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => router.push(`/captify/strategy/outcomes/${outcomeId}`)}
                      >
                        <LinkIcon className="h-3 w-3 mr-2" />
                        {outcomeId}
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No linked outcomes</p>
              )}
            </div>

            {/* Linked Use Cases */}
            <div className="border rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <LinkIcon className="h-5 w-5" />
                Linked Use Cases
              </h2>
              {capability.linkedUseCases && capability.linkedUseCases.length > 0 ? (
                <ul className="space-y-2">
                  {capability.linkedUseCases.map((ucId) => (
                    <li key={ucId}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => router.push(`/captify/strategy/usecases/${ucId}`)}
                      >
                        <LinkIcon className="h-3 w-3 mr-2" />
                        {ucId}
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No linked use cases</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
