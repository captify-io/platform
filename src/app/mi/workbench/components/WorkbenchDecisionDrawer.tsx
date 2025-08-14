"use client";

import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { DynamicIcon } from "lucide-react/dynamic";
import { WorkbenchApiClient, type WorkbenchIssueDetail, type WorkbenchDecision } from "@/app/mi/services/workbench-api-client";

interface WorkbenchDecisionDrawerProps {
  issue: WorkbenchIssueDetail | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function WorkbenchDecisionDrawer({
  issue,
  open,
  onOpenChange,
}: WorkbenchDecisionDrawerProps) {
  const [decisions, setDecisions] = useState<WorkbenchDecision[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (issue && open) {
      fetchDecisions();
    }
  }, [issue, open]);

  const fetchDecisions = async () => {
    if (!issue) return;

    try {
      setLoading(true);
      const response = await WorkbenchApiClient.getDecisions({
        issueId: issue.pk,
      });

      if (response.ok && response.data) {
        setDecisions(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch decisions:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Draft":
        return "bg-gray-100 text-gray-800";
      case "Approved":
        return "bg-green-100 text-green-800";
      case "Implemented":
        return "bg-blue-100 text-blue-800";
      case "Reviewed":
        return "bg-purple-100 text-purple-800";
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (!issue) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="min-w-[800px] max-w-[90vw] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <DynamicIcon name="clipboard-check" className="h-5 w-5" />
            Issue Details & Decisions
          </SheetTitle>
          <SheetDescription>
            View issue details and associated decisions for {issue.title}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* Issue Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{issue.title}</span>
                <div className="flex gap-2">
                  <Badge className={getPriorityColor(issue.criticality)}>
                    {issue.criticality}
                  </Badge>
                  <Badge variant="outline">{issue.status}</Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-2">AI Recommendation</h4>
                <p className="text-sm text-muted-foreground">{issue.aiRecommendation}</p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <h4 className="text-sm font-medium mb-1">Risk Score</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold">{issue.risk?.micap30d || 0}</span>
                    <div className="w-16 h-2 bg-gray-200 rounded-full">
                      <div 
                        className="h-2 bg-red-500 rounded-full"
                        style={{ width: `${Math.min((issue.risk?.micap30d || 0), 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-1">Mission Impact</h4>
                  <span className="text-2xl font-bold">{issue.risk?.missionImpact || 0}%</span>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-1">Financial Impact</h4>
                  <span className="text-lg font-bold">{formatCurrency(issue.risk?.financialImpact || 0)}</span>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">Linked Parts</h4>
                <div className="flex flex-wrap gap-2">
                  {issue.links.nodes.map((node, idx) => (
                    <Badge key={idx} variant="outline">
                      {node.replace("NODE#", "")}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">Stream IDs</h4>
                <div className="flex flex-wrap gap-2">
                  {issue.streamIds.map((streamId, idx) => (
                    <Badge key={idx} variant="secondary">
                      {streamId}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Decisions Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Associated Decisions</h3>
              {loading && (
                <DynamicIcon name="loader-2" className="h-4 w-4 animate-spin" />
              )}
            </div>

            {decisions.length === 0 && !loading ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <DynamicIcon name="clipboard-x" className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No decisions found for this issue</p>
                  <Button variant="outline" className="mt-4">
                    <DynamicIcon name="plus" className="h-4 w-4 mr-2" />
                    Create Decision
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {decisions.map((decision) => (
                  <Card key={decision.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base">{decision.title}</CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            {decision.description}
                          </p>
                        </div>
                        <Badge className={getStatusColor(decision.status)}>
                          {decision.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium mb-2">Decision</h4>
                        <p className="text-sm">{decision.decision}</p>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium mb-2">Rationale</h4>
                        <p className="text-sm text-muted-foreground">{decision.rationale}</p>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium mb-2">Expected Impact</h4>
                        <p className="text-sm text-muted-foreground">{decision.impact}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-sm font-medium mb-1">Financial Impact</h4>
                          <span className="text-lg font-semibold">{formatCurrency(decision.financialImpact)}</span>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium mb-1">Timeline</h4>
                          <span className="text-sm">{decision.timeline}</span>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium mb-2">Implementation Plan</h4>
                        <p className="text-sm text-muted-foreground">{decision.implementationPlan}</p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="text-xs text-muted-foreground">
                          Approved by {decision.approvedBy} on {formatDate(decision.approvedDate)}
                        </div>
                        <Button variant="outline" size="sm">
                          <DynamicIcon name="external-link" className="h-3 w-3 mr-1" />
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
