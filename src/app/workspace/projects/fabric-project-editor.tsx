"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useCaptify, Button } from "@captify-io/core";
import { ArrowLeft, Loader2 } from "lucide-react";
import { debounce } from "lodash";
import dynamic from "next/dynamic";

// Dynamically import Fabric to avoid SSR issues
const FabricEditor = dynamic(
  () => import("@captify-io/core/components/fabric").then((mod) => ({ default: mod.FabricEditor })),
  { ssr: false, loading: () => <div className="flex items-center justify-center h-64"><Loader2 className="h-6 w-6 animate-spin" /></div> }
);

interface Project {
  id?: string;
  name: string;
  workspaceId: string;
  slug?: string;
  summary?: string;
  description?: string;
  status?: string;
  priority?: string;
  health?: string;
  projectType?: string;
  lead?: string;
  members?: string[];
  startDate?: string;
  targetDate?: string;
  tags?: string[];
  dependencies?: string[];
  fabricDocId?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

/**
 * Convert project data to Fabric document
 */
function projectToDocument(project: Partial<Project>): any {
  return {
    type: "doc",
    content: [
      // Title
      {
        type: "heading",
        attrs: { level: 1 },
        content: [{ type: "text", text: project.name || "Untitled Project" }],
      },
      // Summary
      {
        type: "paragraph",
        attrs: { class: "project-summary text-muted-foreground" },
        content: project.summary
          ? [{ type: "text", text: project.summary }]
          : [{ type: "text", text: "Add a short summary..." }],
      },
      // Property buttons (custom node)
      {
        type: "project_properties",
        attrs: {
          status: project.status || "planned",
          priority: project.priority || "none",
          health: project.health,
          projectType: project.projectType,
          lead: project.lead,
          members: project.members || [],
          startDate: project.startDate,
          targetDate: project.targetDate,
          tags: project.tags || [],
          dependencies: project.dependencies || [],
        },
      },
      // Divider
      {
        type: "horizontal_rule",
      },
      // Description heading
      {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: "Description" }],
      },
      // Description body
      {
        type: "paragraph",
        content: project.description
          ? [{ type: "text", text: project.description }]
          : [
              {
                type: "text",
                text: "Write a description, a project brief, or collect ideas...",
              },
            ],
      },
    ],
  };
}

/**
 * Parse Fabric document back into project data
 */
function documentToProject(doc: any): Partial<Project> {
  const project: Partial<Project> = {
    name: "",
    summary: "",
    description: "",
    status: "planned",
  };

  if (!doc || !doc.content) return project;

  let foundHR = false;
  const descriptionParts: string[] = [];

  for (const node of doc.content) {
    // Extract title from first H1
    if (node.type === "heading" && node.attrs?.level === 1 && node.content) {
      project.name = node.content.map((n: any) => n.text || "").join("");
    }

    // Extract summary from paragraph with class
    if (
      node.type === "paragraph" &&
      node.attrs?.class?.includes("project-summary") &&
      node.content
    ) {
      project.summary = node.content.map((n: any) => n.text || "").join("");
    }

    // Extract properties from custom node
    if (node.type === "project_properties" && node.attrs) {
      Object.assign(project, {
        status: node.attrs.status,
        priority: node.attrs.priority,
        health: node.attrs.health,
        projectType: node.attrs.projectType,
        lead: node.attrs.lead,
        members: node.attrs.members,
        startDate: node.attrs.startDate,
        targetDate: node.attrs.targetDate,
        tags: node.attrs.tags,
        dependencies: node.attrs.dependencies,
      });
    }

    // Collect description (everything after horizontal_rule, except first H2)
    if (foundHR && node.type !== "horizontal_rule") {
      if (
        node.type === "heading" &&
        node.attrs?.level === 2 &&
        node.content?.[0]?.text === "Description"
      ) {
        continue; // Skip the "Description" heading
      }

      if (node.type === "paragraph" && node.content) {
        descriptionParts.push(
          node.content.map((n: any) => n.text || "").join("")
        );
      }
    }

    if (node.type === "horizontal_rule") {
      foundHR = true;
    }
  }

  project.description = descriptionParts.join("\n\n");

  return project;
}

interface FabricProjectEditorProps {
  projectId?: string;
  mode?: "create" | "edit";
}

export function FabricProjectEditor({
  projectId,
  mode = "create",
}: FabricProjectEditorProps) {
  const router = useRouter();
  const { workspace } = useCaptify();
  const [project, setProject] = useState<Partial<Project> | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fabricDocId, setFabricDocId] = useState<string | null>(null);

  // Load project if editing
  useEffect(() => {
    if (mode === "edit" && projectId) {
      loadProject();
    } else {
      // Create mode - initialize empty project
      setProject({
        name: "Untitled Project",
        workspaceId: workspace?.id || "",
        status: "planned",
      });
      setLoading(false);
    }
  }, [mode, projectId, workspace]);

  async function loadProject() {
    setLoading(true);
    try {
      const response = await fetch("/api/captify", {
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

      const result = await response.json();
      if (result.success && result.data) {
        setProject(result.data);
        setFabricDocId(result.data.fabricDocId || `project-${projectId}`);
      } else {
        setError("Failed to load project");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load project");
    } finally {
      setLoading(false);
    }
  }

  // Debounced save function
  const saveProject = useRef(
    debounce(async (projectData: Partial<Project>) => {
      if (!projectData.name || !projectData.workspaceId) {
        return;
      }

      setIsSaving(true);
      setError(null);

      try {
        const response = await fetch("/api/captify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            service: "platform.ontology",
            operation: mode === "create" && !projectData.id ? "create" : "update",
            objectType: "project",
            data: {
              ...projectData,
              updatedAt: new Date().toISOString(),
            },
          }),
        });

        const result = await response.json();

        if (result.success && result.data) {
          setProject(result.data);
          setLastSaved(new Date());

          // If we just created, redirect to edit mode
          if (mode === "create" && result.data.id) {
            router.push(`/workspace/projects/${result.data.id}`);
          }
        } else {
          setError(result.error?.message || "Failed to save project");
        }
      } catch (err: any) {
        setError(err.message || "Failed to save project");
      } finally {
        setIsSaving(false);
      }
    }, 1000)
  ).current;

  // Handle document changes from Fabric
  const handleDocumentChange = useCallback(
    (doc: any) => {
      const updatedProject = documentToProject(doc);
      const merged = { ...project, ...updatedProject };
      setProject(merged);
      saveProject(merged);
    },
    [project, saveProject]
  );

  const handleBack = () => {
    router.push("/workspace/projects");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading project...</span>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="text-muted-foreground">Project not found</div>
        <Button onClick={handleBack} size="sm" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Projects
        </Button>
      </div>
    );
  }

  const initialDoc = projectToDocument(project);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b px-6 py-3 flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={handleBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Projects
        </Button>

        <div className="flex-1" />

        {/* Save status */}
        <div className="text-xs text-muted-foreground flex items-center gap-2">
          {isSaving && (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Saving...</span>
            </>
          )}
          {!isSaving && lastSaved && (
            <span>Last saved {lastSaved.toLocaleTimeString()}</span>
          )}
          {error && <span className="text-destructive">{error}</span>}
        </div>
      </div>

      {/* Fabric Editor */}
      <div className="flex-1 overflow-auto">
        <FabricEditor
          documentId={fabricDocId || `project-${mode}-${Date.now()}`}
          initialContent={initialDoc}
          onChange={handleDocumentChange}
          className="max-w-4xl mx-auto p-8"
        />
      </div>
    </div>
  );
}
