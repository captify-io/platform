"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button, Input, Textarea, Badge } from "@captify-io/core";
import { ArrowLeft, Plus, Calendar, User } from "lucide-react";
import { format } from "date-fns";

interface ProjectUpdate {
  id: string;
  projectId: string;
  content: string;
  createdAt: string;
  createdBy: string;
  status?: string;
  health?: string;
}

const HEALTH_COLORS: Record<string, string> = {
  "on-track": "bg-green-500",
  "at-risk": "bg-yellow-500",
  "off-track": "bg-red-500",
  "update-missing": "bg-gray-500",
  "no-update-expected": "bg-gray-400",
};

export default function ProjectUpdatesPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<any>(null);
  const [updates, setUpdates] = useState<ProjectUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewUpdate, setShowNewUpdate] = useState(false);
  const [newUpdateContent, setNewUpdateContent] = useState("");

  // Load project and updates
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        // Load project
        const projectResponse = await fetch("/api/captify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            service: "platform.ontology",
            operation: "get",
            objectType: "project",
            id: projectId,
          }),
        });

        const projectResult = await projectResponse.json();
        if (projectResult.success && projectResult.data) {
          setProject(projectResult.data);
        }

        // Load updates
        // TODO: Implement updates query when update entity is created
        // For now, show empty state
        setUpdates([]);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [projectId]);

  const handleBack = () => {
    router.push(`/workspace/projects/${projectId}`);
  };

  const handleCreateUpdate = async () => {
    if (!newUpdateContent.trim()) return;

    try {
      const response = await fetch("/api/captify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          service: "platform.ontology",
          operation: "create",
          objectType: "project-update",
          data: {
            projectId,
            content: newUpdateContent,
            createdAt: new Date().toISOString(),
          },
        }),
      });

      const result = await response.json();
      if (result.success && result.data) {
        setUpdates([result.data, ...updates]);
        setNewUpdateContent("");
        setShowNewUpdate(false);
      }
    } catch (error) {
      console.error("Error creating update:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Loading updates...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b px-6 py-4">
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          <div>
            <div className="text-sm text-muted-foreground">Updates for</div>
            <h1 className="text-xl font-semibold">{project?.name || "Project"}</h1>
          </div>

          <div className="flex-1" />

          <Button
            onClick={() => setShowNewUpdate(!showNewUpdate)}
            size="sm"
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            New Update
          </Button>
        </div>

        {/* New Update Form */}
        {showNewUpdate && (
          <div className="bg-accent/50 rounded-lg p-4 space-y-3">
            <Textarea
              value={newUpdateContent}
              onChange={(e) => setNewUpdateContent(e.target.value)}
              placeholder="What's the latest on this project?"
              className="min-h-[120px]"
            />
            <div className="flex items-center gap-2">
              <Button onClick={handleCreateUpdate} size="sm">
                Post Update
              </Button>
              <Button
                onClick={() => {
                  setShowNewUpdate(false);
                  setNewUpdateContent("");
                }}
                variant="outline"
                size="sm"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Updates List */}
      <div className="flex-1 overflow-auto p-6">
        {updates.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <div className="text-muted-foreground">No updates yet</div>
            <Button
              onClick={() => setShowNewUpdate(true)}
              size="sm"
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Post the first update
            </Button>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-4">
            {updates.map((update) => (
              <div
                key={update.id}
                className="bg-card border rounded-lg p-4 space-y-3"
              >
                {/* Update Header */}
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <User className="h-3.5 w-3.5" />
                  <span>{update.createdBy}</span>
                  <span>•</span>
                  <Calendar className="h-3.5 w-3.5" />
                  <span>
                    {format(new Date(update.createdAt), "MMM d, yyyy 'at' h:mm a")}
                  </span>
                  {update.health && (
                    <>
                      <span>•</span>
                      <div className="flex items-center gap-2">
                        <div
                          className={`h-2 w-2 rounded-full ${
                            HEALTH_COLORS[update.health]
                          }`}
                        />
                        <span className="capitalize">
                          {update.health.replace("-", " ")}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {/* Update Content */}
                <div className="prose prose-sm max-w-none">
                  {update.content}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
