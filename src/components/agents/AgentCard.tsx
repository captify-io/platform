/**
 * Agent Management Card - Displays agent status with deploy and test capabilities
 */

"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  PlayCircle,
  Rocket,
  Settings,
  MessageSquare,
  CheckCircle2,
  Clock,
  AlertCircle,
  User,
  Brain,
  Zap,
} from "lucide-react";
import { UserAgent } from "@/types/agents";

interface AgentCardProps {
  agent: UserAgent;
  onDeploy?: (agentId: string) => void;
  onTest?: (agentId: string, testMessage: string) => void;
  onSettings?: (agentId: string) => void;
}

interface TestResult {
  success: boolean;
  response?: string;
  responseTime?: number;
  error?: string;
  timestamp?: string;
}

export function AgentCard({
  agent,
  onDeploy,
  onTest,
  onSettings,
}: AgentCardProps) {
  const [isDeploying, setIsDeploying] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testMessage, setTestMessage] = useState(
    "Hello! Can you tell me about yourself and what you can help me with?"
  );
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [showTestForm, setShowTestForm] = useState(false);

  const handleDeploy = async () => {
    if (!onDeploy) return;
    setIsDeploying(true);
    try {
      await onDeploy(agent.id);
    } finally {
      setIsDeploying(false);
    }
  };

  const handleTest = async () => {
    if (!onTest || !testMessage.trim()) return;
    setIsTesting(true);
    setTestResult(null);

    try {
      await onTest(agent.id, testMessage);
    } finally {
      setIsTesting(false);
    }
  };

  const getAgentTypeIcon = (type: string) => {
    switch (type) {
      case "personal":
        return <User className="h-4 w-4" />;
      case "application":
        return <Zap className="h-4 w-4" />;
      default:
        return <Brain className="h-4 w-4" />;
    }
  };

  const getAgentTypeBadge = (type: string) => {
    const badges = {
      personal: { variant: "default" as const, label: "Personal" },
      application: { variant: "secondary" as const, label: "Application" },
      "policy-advisor": {
        variant: "outline" as const,
        label: "Policy Advisor",
      },
      "technical-writer": {
        variant: "outline" as const,
        label: "Technical Writer",
      },
      "safety-compliance": { variant: "outline" as const, label: "Safety" },
      "procurement-specialist": {
        variant: "outline" as const,
        label: "Procurement",
      },
      "data-analyst": { variant: "outline" as const, label: "Data Analysis" },
      "project-manager": { variant: "outline" as const, label: "Project Mgmt" },
      "training-coordinator": {
        variant: "outline" as const,
        label: "Training",
      },
      "quality-assurance": { variant: "outline" as const, label: "QA" },
    };

    const badge = badges[type as keyof typeof badges] || {
      variant: "outline" as const,
      label: type,
    };
    return <Badge variant={badge.variant}>{badge.label}</Badge>;
  };

  const getStatusBadge = () => {
    if (!agent.isActive) {
      return (
        <Badge variant="secondary">
          <Clock className="h-3 w-3 mr-1" />
          Not Deployed
        </Badge>
      );
    }

    if (agent.type === "personal" && !agent.isProfileComplete) {
      return (
        <Badge variant="destructive">
          <AlertCircle className="h-3 w-3 mr-1" />
          Profile Incomplete
        </Badge>
      );
    }

    return (
      <Badge variant="default">
        <CheckCircle2 className="h-3 w-3 mr-1" />
        Active
      </Badge>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {getAgentTypeIcon(agent.type)}
            <CardTitle className="text-lg">{agent.name}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {getAgentTypeBadge(agent.type)}
            {getStatusBadge()}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Agent Details */}
        <div className="text-sm text-muted-foreground space-y-1">
          <div>Created: {new Date(agent.createdAt).toLocaleDateString()}</div>
          <div>Updated: {new Date(agent.updatedAt).toLocaleDateString()}</div>
          {agent.memoryEnabled && (
            <div className="flex items-center gap-1">
              <Brain className="h-3 w-3" />
              Memory Enabled
            </div>
          )}
        </div>

        <div className="border-t pt-3" />

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          {!agent.isActive && (
            <Button
              onClick={handleDeploy}
              disabled={isDeploying}
              size="sm"
              className="flex items-center gap-2"
            >
              <Rocket className="h-4 w-4" />
              {isDeploying ? "Deploying..." : "Deploy"}
            </Button>
          )}

          {agent.isActive && (
            <>
              <Button
                onClick={() => setShowTestForm(!showTestForm)}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <PlayCircle className="h-4 w-4" />
                Test Agent
              </Button>

              <Button
                onClick={handleDeploy}
                disabled={isDeploying}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Rocket className="h-4 w-4" />
                {isDeploying ? "Redeploying..." : "Redeploy"}
              </Button>
            </>
          )}

          {onSettings && (
            <Button
              onClick={() => onSettings(agent.id)}
              variant="ghost"
              size="sm"
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Settings
            </Button>
          )}
        </div>

        {/* Test Form */}
        {showTestForm && agent.isActive && (
          <div className="space-y-3 pt-2 border-t">
            <div>
              <label className="text-sm font-medium">Test Message</label>
              <Textarea
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                placeholder="Enter a message to test your agent..."
                className="mt-1"
                rows={3}
              />
            </div>

            <Button
              onClick={handleTest}
              disabled={isTesting || !testMessage.trim()}
              size="sm"
              className="flex items-center gap-2"
            >
              <MessageSquare className="h-4 w-4" />
              {isTesting ? "Testing..." : "Send Test"}
            </Button>
          </div>
        )}

        {/* Test Results */}
        {testResult && (
          <div className="space-y-2 pt-2 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Test Result</span>
              {testResult.success ? (
                <Badge variant="default">Success</Badge>
              ) : (
                <Badge variant="destructive">Failed</Badge>
              )}
            </div>

            {testResult.success && testResult.response && (
              <div className="text-sm bg-muted p-3 rounded-md">
                <div className="font-medium mb-1">Agent Response:</div>
                <div>{testResult.response}</div>
                {testResult.responseTime && (
                  <div className="text-xs text-muted-foreground mt-2">
                    Response time: {testResult.responseTime}ms
                  </div>
                )}
              </div>
            )}

            {!testResult.success && testResult.error && (
              <div className="text-sm bg-destructive/10 text-destructive p-3 rounded-md">
                <div className="font-medium mb-1">Error:</div>
                <div>{testResult.error}</div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default AgentCard;
