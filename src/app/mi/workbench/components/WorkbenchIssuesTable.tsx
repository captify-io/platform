"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DynamicIcon } from "lucide-react/dynamic";
import type { WorkbenchIssueDetail } from "@/app/mi/services/workbench-api-client";

interface WorkbenchIssuesTableProps {
  issues: WorkbenchIssueDetail[];
  loading?: boolean;
  onIssueClick?: (issue: WorkbenchIssueDetail) => void;
  onPartClick?: (nsn: string) => void;
}

export default function WorkbenchIssuesTable({
  issues,
  loading = false,
  onIssueClick,
  onPartClick,
}: WorkbenchIssuesTableProps) {
  const [sortField, setSortField] = useState<keyof WorkbenchIssueDetail>("updated_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const handleSort = (field: keyof WorkbenchIssueDetail) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const sortedIssues = [...issues].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortDirection === "asc" 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    if (typeof aValue === "number" && typeof bValue === "number") {
      return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
    }
    
    return 0;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Analyze":
        return "search";
      case "Validate Solution":
        return "check-circle";
      case "Qualify":
        return "clipboard-check";
      case "Field":
        return "wrench";
      case "Monitor":
        return "eye";
      default:
        return "circle";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Analyze":
        return "bg-blue-100 text-blue-800";
      case "Validate Solution":
        return "bg-orange-100 text-orange-800";
      case "Qualify":
        return "bg-yellow-100 text-yellow-800";
      case "Field":
        return "bg-green-100 text-green-800";
      case "Monitor":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Critical":
        return "bg-red-100 text-red-800";
      case "High":
        return "bg-orange-100 text-orange-800";
      case "Medium":
        return "bg-yellow-100 text-yellow-800";
      case "Low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Workbench Issues</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DynamicIcon name="clipboard-list" className="h-5 w-5" />
          Workbench Issues ({issues.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("title")}
                >
                  <div className="flex items-center gap-1">
                    Issue
                    <DynamicIcon name="arrow-up-down" className="h-3 w-3" />
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("status")}
                >
                  <div className="flex items-center gap-1">
                    Status
                    <DynamicIcon name="arrow-up-down" className="h-3 w-3" />
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("criticality")}
                >
                  <div className="flex items-center gap-1">
                    Priority
                    <DynamicIcon name="arrow-up-down" className="h-3 w-3" />
                  </div>
                </TableHead>
                <TableHead>Risk Score</TableHead>
                <TableHead>Linked Parts</TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("updated_at")}
                >
                  <div className="flex items-center gap-1">
                    Last Updated
                    <DynamicIcon name="arrow-up-down" className="h-3 w-3" />
                  </div>
                </TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedIssues.map((issue) => (
                <TableRow key={issue.pk} className="hover:bg-muted/50">
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium text-sm">{issue.title}</div>
                      <div className="text-xs text-muted-foreground line-clamp-2">
                        {issue.aiRecommendation}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(issue.status)}>
                      <DynamicIcon name={getStatusIcon(issue.status) as any} className="h-3 w-3 mr-1" />
                      {issue.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getPriorityColor(issue.criticality)}>
                      {issue.criticality}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-medium">{issue.risk?.micap30d || 0}</div>
                      <div className="w-16 h-2 bg-gray-200 rounded-full">
                        <div 
                          className="h-2 bg-red-500 rounded-full transition-all"
                          style={{ width: `${Math.min((issue.risk?.micap30d || 0), 100)}%` }}
                        />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {issue.links.nodes.slice(0, 2).map((node, idx) => (
                        <Button
                          key={`${issue.pk}-node-${idx}`}
                          variant="outline"
                          size="sm"
                          className="text-xs h-6"
                          onClick={() => onPartClick?.(node.replace("NODE#", ""))}
                        >
                          <DynamicIcon name="external-link" className="h-3 w-3 mr-1" />
                          {node.replace("NODE#", "").substring(0, 12)}...
                        </Button>
                      ))}
                      {issue.links.nodes.length > 2 && (
                        <div className="text-xs text-muted-foreground">
                          +{issue.links.nodes.length - 2} more
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{formatDate(issue.updated_at)}</div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onIssueClick?.(issue)}
                    >
                      <DynamicIcon name="eye" className="h-3 w-3 mr-1" />
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
