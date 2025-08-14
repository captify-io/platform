"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DynamicIcon } from "lucide-react/dynamic";
import {
  WorkbenchFilters,
  WorkbenchSummaryCards,
  WorkbenchIssuesTable,
  WorkbenchCharts,
  WorkbenchDecisionDrawer,
  WorkbenchPartDrawer,
} from "./components";
import {
  WorkbenchApiClient,
  type WorkbenchData,
  type WorkbenchSummary,
  type WorkbenchIssueDetail,
  type WorkbenchParams,
} from "@/app/mi/services/workbench-api-client";
import { useChatIntegration } from "@/hooks/useChatIntegration";

export default function WorkbenchPage() {
  const searchParams = useSearchParams();
  const [workbenchData, setWorkbenchData] = useState<WorkbenchData | null>(null);
  const [summaryData, setSummaryData] = useState<WorkbenchSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Drawer states
  const [selectedIssue, setSelectedIssue] = useState<WorkbenchIssueDetail | null>(null);
  const [selectedPartNsn, setSelectedPartNsn] = useState<string | null>(null);
  const [decisionDrawerOpen, setDecisionDrawerOpen] = useState(false);
  const [partDrawerOpen, setPartDrawerOpen] = useState(false);

  // Chat integration
  const { sendMessage } = useChatIntegration();

  // Handle URL parameters
  useEffect(() => {
    const nsn = searchParams.get('nsn');
    const part = searchParams.get('part');
    const context = searchParams.get('context');
    
    if (nsn) {
      setSelectedPartNsn(nsn);
      setPartDrawerOpen(true);
      
      // Send context to chat about the specific part being viewed
      const contextMessage = `Viewing part NSN: ${nsn}${part ? ` (${decodeURIComponent(part)})` : ''}${context ? ` - Context: ${context}` : ''} in the workbench.`;
      sendMessage(contextMessage);
    }
  }, [searchParams, sendMessage]);

  const fetchWorkbenchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params: WorkbenchParams = {
        status: statusFilter !== "all" ? statusFilter as WorkbenchParams["status"] : undefined,
        priority: priorityFilter !== "all" ? priorityFilter as WorkbenchParams["priority"] : undefined,
        search: searchTerm || undefined,
      };

      const [workbenchResponse, summaryResponse] = await Promise.all([
        WorkbenchApiClient.getIssues(params),
        WorkbenchApiClient.getSummary(),
      ]);

      if (!workbenchResponse.ok) {
        throw new Error(
          workbenchResponse.error || `HTTP error! status: ${workbenchResponse.status}`
        );
      }

      if (!summaryResponse.ok) {
        console.warn("Failed to fetch summary data:", summaryResponse.error);
      }

      setWorkbenchData(workbenchResponse.data || null);
      setSummaryData(summaryResponse.data || null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch workbench data"
      );
    } finally {
      setLoading(false);
    }
  }, [statusFilter, priorityFilter, searchTerm]);

  useEffect(() => {
    fetchWorkbenchData();
  }, [fetchWorkbenchData]);

  const handleIssueClick = (issue: WorkbenchIssueDetail) => {
    setSelectedIssue(issue);
    setDecisionDrawerOpen(true);
    
    // Send context to chat
    sendMessage(
      `I'm viewing workbench issue: ${issue.title}. Risk score: ${issue.risk?.micap30d}, Status: ${issue.status}, Priority: ${issue.criticality}. AI recommendation: ${issue.aiRecommendation}`
    );
  };

  const handlePartClick = (nsn: string) => {
    setSelectedPartNsn(nsn);
    setPartDrawerOpen(true);
    
    // Send context to chat  
    sendMessage(
      `I'm viewing part details for NSN: ${nsn} in the workbench.`
    );
  };

  const filteredIssues = workbenchData?.issues.filter((issue) => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      issue.title.toLowerCase().includes(searchLower) ||
      issue.status.toLowerCase().includes(searchLower) ||
      issue.criticality.toLowerCase().includes(searchLower) ||
      issue.aiRecommendation.toLowerCase().includes(searchLower) ||
      issue.links.nodes.some(node => node.toLowerCase().includes(searchLower))
    );
  }) || [];

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert className="mb-6">
          <DynamicIcon name="alert-triangle" className="h-4 w-4" />
          <AlertDescription>
            Error loading workbench data: {error}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">MI Workbench</h1>
          <p className="text-muted-foreground">
            Track issues, decisions, and part analysis workflow
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          {workbenchData?.metadata.generated && (
            <>Generated: {new Date(workbenchData.metadata.generated).toLocaleString()}</>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <WorkbenchSummaryCards summary={summaryData} loading={loading} />

      {/* Filters */}
      <WorkbenchFilters
        statusFilter={statusFilter}
        priorityFilter={priorityFilter}
        searchTerm={searchTerm}
        onStatusChange={setStatusFilter}
        onPriorityChange={setPriorityFilter}
        onSearchChange={setSearchTerm}
        onRefresh={fetchWorkbenchData}
        loading={loading}
      />

      {/* Charts */}
      <WorkbenchCharts 
        data={workbenchData} 
        summary={summaryData} 
        loading={loading} 
      />

      {/* Issues Table */}
      <WorkbenchIssuesTable
        issues={filteredIssues}
        loading={loading}
        onIssueClick={handleIssueClick}
        onPartClick={handlePartClick}
      />

      {/* Decision Drawer */}
      <WorkbenchDecisionDrawer
        issue={selectedIssue}
        open={decisionDrawerOpen}
        onOpenChange={setDecisionDrawerOpen}
      />

      {/* Part Drawer */}
      <WorkbenchPartDrawer
        nsn={selectedPartNsn}
        open={partDrawerOpen}
        onOpenChange={setPartDrawerOpen}
      />
    </div>
  );
}