"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Badge,
  useCaptify,
} from "@captify-io/core";
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Heart,
  Flag,
  Calendar,
  User,
} from "lucide-react";
import { format } from "date-fns";

interface Project {
  id: string;
  name: string;
  status: string;
  priority?: string;
  health?: string;
  lead?: string;
  targetDate?: string;
  workspaceId: string;
}

const STATUS_COLORS: Record<string, string> = {
  planned: "bg-gray-500",
  active: "bg-blue-500",
  paused: "bg-yellow-500",
  completed: "bg-green-500",
  cancelled: "bg-red-500",
};

const HEALTH_COLORS: Record<string, string> = {
  "on-track": "bg-green-500",
  "at-risk": "bg-yellow-500",
  "off-track": "bg-red-500",
  "update-missing": "bg-gray-500",
  "no-update-expected": "bg-gray-400",
};

const PRIORITY_LABELS: Record<string, string> = {
  none: "○",
  low: "↓",
  medium: "=",
  high: "↑",
  urgent: "‼",
};

export default function ProjectsPage() {
  const router = useRouter();
  const { workspace } = useCaptify();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  // Load projects
  useEffect(() => {
    if (!workspace) return;

    async function loadProjects() {
      setLoading(true);
      try {
        const response = await fetch("/api/captify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            service: "platform.ontology",
            operation: "query",
            objectType: "project",
            filters: {
              workspaceId: workspace.id,
            },
          }),
        });

        const result = await response.json();
        if (result.success && result.data) {
          setProjects(result.data);
        }
      } catch (error) {
        console.error("Error loading projects:", error);
      } finally {
        setLoading(false);
      }
    }

    loadProjects();
  }, [workspace]);

  // Filter projects
  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      !searchQuery ||
      project.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || project.status === statusFilter;
    const matchesPriority =
      priorityFilter === "all" || project.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const handleCreateProject = () => {
    router.push("/workspace/projects/new");
  };

  const handleRowClick = (projectId: string) => {
    setSelectedProject(projectId);
    router.push(`/workspace/projects/${projectId}`);
  };

  const handleViewUpdates = () => {
    if (selectedProject) {
      router.push(`/workspace/projects/${selectedProject}/updates`);
    }
  };

  const handleViewIssues = () => {
    if (selectedProject) {
      router.push(`/workspace/projects/${selectedProject}/issues`);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold">Projects</h1>
          <Button onClick={handleCreateProject} size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </div>

        {/* Filters and Actions */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="planned">Planned</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          {/* Priority Filter */}
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="none">No Priority</SelectItem>
            </SelectContent>
          </Select>

          {/* Action Buttons - Disabled until project selected */}
          <div className="flex items-center gap-2 ml-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handleViewUpdates}
              disabled={!selectedProject}
            >
              Updates
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleViewIssues}
              disabled={!selectedProject}
            >
              Issues
            </Button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">Loading projects...</div>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <div className="text-muted-foreground">No projects found</div>
            <Button onClick={handleCreateProject} size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Create your first project
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40%]">Name</TableHead>
                <TableHead className="w-[100px]">Health</TableHead>
                <TableHead className="w-[100px]">Priority</TableHead>
                <TableHead className="w-[150px]">Lead</TableHead>
                <TableHead className="w-[120px]">Target Date</TableHead>
                <TableHead className="w-[120px]">Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProjects.map((project) => (
                <TableRow
                  key={project.id}
                  onClick={() => handleRowClick(project.id)}
                  className={`cursor-pointer hover:bg-accent ${
                    selectedProject === project.id ? "bg-accent" : ""
                  }`}
                >
                  <TableCell className="font-medium">{project.name}</TableCell>
                  <TableCell>
                    {project.health && (
                      <div className="flex items-center gap-2">
                        <div
                          className={`h-2 w-2 rounded-full ${
                            HEALTH_COLORS[project.health]
                          }`}
                        />
                        <span className="text-xs capitalize">
                          {project.health.replace("-", " ")}
                        </span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {project.priority && (
                      <span className="text-lg">
                        {PRIORITY_LABELS[project.priority]}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {project.lead && (
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">{project.lead}</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {project.targetDate && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">
                          {format(new Date(project.targetDate), "MMM d, yyyy")}
                        </span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="capitalize">
                      <div
                        className={`h-2 w-2 rounded-full mr-2 ${
                          STATUS_COLORS[project.status]
                        }`}
                      />
                      {project.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        // TODO: Add project menu
                      }}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
