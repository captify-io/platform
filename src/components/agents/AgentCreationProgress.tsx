/**
 * Agent Creation Progress Component
 * Shows real-time progress for async agent creation
 */

"use client";

import { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, AlertCircle, Loader2 } from "lucide-react";

interface AgentCreationProgressProps {
  jobId: string;
  onComplete?: (agentId: string, aliasId: string) => void;
  onError?: (error: string) => void;
}

interface JobStatus {
  id: string;
  status:
    | "PENDING"
    | "CREATING_KB"
    | "CREATING_AGENT"
    | "DEPLOYING"
    | "COMPLETED"
    | "FAILED";
  progress: number;
  currentStep: string;
  agentId?: string;
  aliasId?: string;
  knowledgeBaseId?: string;
  error?: string;
  estimatedTimeRemaining: string;
  isComplete: boolean;
  isFailed: boolean;
}

export function AgentCreationProgress({
  jobId,
  onComplete,
  onError,
}: AgentCreationProgressProps) {
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [polling, setPolling] = useState(true);

  useEffect(() => {
    if (!polling) return;

    const pollStatus = async () => {
      try {
        const response = await fetch(`/api/agents/create-async?jobId=${jobId}`);
        const data = await response.json();

        if (data.success) {
          setJobStatus(data.job);

          if (data.job.isComplete) {
            setPolling(false);
            onComplete?.(data.job.agentId, data.job.aliasId);
          } else if (data.job.isFailed) {
            setPolling(false);
            onError?.(data.job.error || "Agent creation failed");
          }
        }
      } catch (error) {
        console.error("Error polling job status:", error);
        onError?.("Failed to check creation status");
        setPolling(false);
      }
    };

    // Poll immediately, then every 10 seconds
    pollStatus();
    const interval = setInterval(pollStatus, 10000);

    return () => clearInterval(interval);
  }, [jobId, polling, onComplete, onError]);

  if (!jobStatus) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading creation status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = () => {
    switch (jobStatus.status) {
      case "COMPLETED":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "FAILED":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
    }
  };

  const getStatusColor = () => {
    switch (jobStatus.status) {
      case "COMPLETED":
        return "bg-green-500";
      case "FAILED":
        return "bg-red-500";
      case "CREATING_KB":
        return "bg-blue-500";
      case "CREATING_AGENT":
        return "bg-purple-500";
      case "DEPLOYING":
        return "bg-orange-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusText = () => {
    switch (jobStatus.status) {
      case "PENDING":
        return "Initializing";
      case "CREATING_KB":
        return "Creating Knowledge Base";
      case "CREATING_AGENT":
        return "Creating Agent";
      case "DEPLOYING":
        return "Deploying";
      case "COMPLETED":
        return "Completed";
      case "FAILED":
        return "Failed";
      default:
        return jobStatus.status;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              {getStatusIcon()}
              <span>Creating Your Personal Agent</span>
            </CardTitle>
            <CardDescription>
              {jobStatus.isComplete
                ? "Your agent is ready to use!"
                : jobStatus.isFailed
                ? "Agent creation encountered an error"
                : `This process typically takes 10-15 minutes. Estimated time remaining: ${jobStatus.estimatedTimeRemaining}`}
            </CardDescription>
          </div>
          <Badge variant="outline" className={getStatusColor()}>
            {getStatusText()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!jobStatus.isFailed && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{jobStatus.progress}%</span>
            </div>
            <Progress value={jobStatus.progress} className="w-full" />
          </div>
        )}

        <div className="space-y-3">
          <div className="flex items-center space-x-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Current Step:</span>
            <span>{jobStatus.currentStep}</span>
          </div>

          {jobStatus.knowledgeBaseId && (
            <div className="text-sm text-muted-foreground">
              ✓ Knowledge Base Created: {jobStatus.knowledgeBaseId}
            </div>
          )}

          {jobStatus.agentId && (
            <div className="text-sm text-muted-foreground">
              ✓ Agent Created: {jobStatus.agentId}
            </div>
          )}

          {jobStatus.aliasId && (
            <div className="text-sm text-muted-foreground">
              ✓ Agent Deployed: {jobStatus.aliasId}
            </div>
          )}

          {jobStatus.error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center space-x-2 text-red-700">
                <AlertCircle className="h-4 w-4" />
                <span className="font-medium">Error:</span>
              </div>
              <p className="text-red-600 text-sm mt-1">{jobStatus.error}</p>
            </div>
          )}
        </div>

        <div className="text-xs text-muted-foreground border-t pt-4">
          <p>
            <strong>What&apos;s happening:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 mt-1">
            <li>
              Creating an OpenSearch Serverless collection for vector storage
            </li>
            <li>
              Setting up a Bedrock Knowledge Base connected to your S3 folder
            </li>
            <li>
              Creating your personal Bedrock Agent with custom instructions
            </li>
            <li>Deploying the agent and making it available for chat</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
