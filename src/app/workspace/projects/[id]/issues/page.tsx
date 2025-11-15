"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
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
} from "@captify-io/core";
import { ArrowLeft, Plus, Search } from "lucide-react";

interface Issue {
  id: string;
  identifier: string;
  title: string;
  status: string;
  priority?: string;
  assigneeId?: string;
  projectId: string;
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  backlog: "bg-gray-500",
  todo: "bg-blue-500",
  "in-progress": "bg-yellow-500",
  "in-review": "bg-purple-500",
  done: "bg-green-500",
  cancelled: "bg-red-500",
};

const PRIORITY_LABELS: Record<string, string> = {
  none: "○",
  low: "↓",
  medium: "=",
  high: "↑",
  urgent: "‼",
};

export default function ProjectIssuesPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<any>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  // Load project and issues
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

        // Load issues filtered by project
        const issuesResponse = await fetch("/api/captify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            service: "platform.ontology",
            operation: "query",
            objectType: "issue",
            filters: {
              projectId,
            },
          }),
        });

        const issuesResult = await issuesResponse.json();
        if (issuesResult.success && issuesResult.data) {
          setIssues(issuesResult.data);
        }
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [projectId]);

  // Filter issues
  const filteredIssues = issues.filter((issue) => {
    const matchesSearch =
      !searchQuery ||
      issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.identifier.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || issue.status === statusFilter;
    const matchesPriority =
      priorityFilter === "all" || issue.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const handleBack = () => {
    router.push(`/workspace/projects/${projectId}`);
  };

  const handleCreateIssue = () => {
    // TODO: Implement issue creation
    console.log("Create issue for project:", projectId);
  };

  const handleIssueClick = (issueId: string) => {
    // TODO: Navigate to issue detail page
    console.log("View issue:", issueId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Loading issues...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
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
              <div className="text-sm text-muted-foreground">Issues for</div>
              <h1 className="text-xl font-semibold">
                {project?.name || "Project"}
              </h1>
            </div>
          </div>

          <Button onClick={handleCreateIssue} size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            New Issue
          </Button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search issues..."
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
              <SelectItem value="backlog">Backlog</SelectItem>
              <SelectItem value="todo">Todo</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="in-review">In Review</SelectItem>
              <SelectItem value="done">Done</SelectItem>
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
        </div>
      </div>

      {/* Issues Table */}
      <div className="flex-1 overflow-auto">
        {filteredIssues.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <div className="text-muted-foreground">No issues found</div>
            <Button onClick={handleCreateIssue} size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Create first issue
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">ID</TableHead>
                <TableHead className="w-[50%]">Title</TableHead>
                <TableHead className="w-[100px]">Status</TableHead>
                <TableHead className="w-[80px]">Priority</TableHead>
                <TableHead className="w-[150px]">Assignee</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredIssues.map((issue) => (
                <TableRow
                  key={issue.id}
                  onClick={() => handleIssueClick(issue.id)}
                  className="cursor-pointer hover:bg-accent"
                >
                  <TableCell className="font-mono text-sm">
                    {issue.identifier}
                  </TableCell>
                  <TableCell className="font-medium">{issue.title}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="capitalize">
                      <div
                        className={`h-2 w-2 rounded-full mr-2 ${
                          STATUS_COLORS[issue.status]
                        }`}
                      />
                      {issue.status.replace("-", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {issue.priority && (
                      <span className="text-lg">
                        {PRIORITY_LABELS[issue.priority]}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {issue.assigneeId && (
                      <span className="text-sm">{issue.assigneeId}</span>
                    )}
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
