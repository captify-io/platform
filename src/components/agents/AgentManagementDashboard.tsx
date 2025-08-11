/**
 * Agent Management Dashboard - Enhanced agents page with Phase 3 capabilities
 */

"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { ApplicationLayout } from "@/components/apps/ApplicationLayout";
import AgentCard from "@/components/agents/AgentCard";
import ProfileInterview from "@/components/agents/ProfileInterview";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Plus,
  RefreshCw,
  User,
  Brain,
  Zap,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { UserAgent } from "@/types/agents";

interface SetupStatus {
  needsSetup: boolean;
  hasPersonalAgent: boolean;
  agentId?: string;
  isProfileComplete?: boolean;
}

export default function AgentManagementDashboard() {
  const { data: session } = useSession();
  const [agents, setAgents] = useState<UserAgent[]>([]);
  const [setupStatus, setSetupStatus] = useState<SetupStatus | null>(null);
  const [showInterview, setShowInterview] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>("all");

  useEffect(() => {
    if (session?.user?.email) {
      loadAgents();
      checkSetupStatus();
    }
  }, [session]);

  const loadAgents = async () => {
    try {
      const response = await fetch("/api/agents");
      if (response.ok) {
        const data = await response.json();
        setAgents(data.agents || []);
      }
    } catch (error) {
      console.error("Error loading agents:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkSetupStatus = async () => {
    try {
      const response = await fetch("/api/agents/setup");
      if (response.ok) {
        const status = await response.json();
        setSetupStatus(status);
      }
    } catch (error) {
      console.error("Error checking setup status:", error);
    }
  };

  const handleDeploy = async (agentId: string) => {
    try {
      const response = await fetch(`/api/agents/${agentId}/deploy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ forceUpdate: true }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log("Deployment result:", result);
        // Reload agents to get updated status
        loadAgents();
      } else {
        const error = await response.json();
        console.error(`Deployment failed: ${error.message}`);
      }
    } catch (error) {
      console.error("Error deploying agent:", error);
    }
  };

  const handleTest = async (agentId: string, testMessage: string) => {
    try {
      const response = await fetch(`/api/agents/${agentId}/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testMessage,
          includeContext: true,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        console.log("Test result:", result);
        // Test successful - could show a toast or modal with the result
      } else {
        console.error(
          `Test failed: ${result.error?.message || result.message}`
        );
      }
    } catch (error) {
      console.error("Error testing agent:", error);
    }
  };

  const handleSettings = (agentId: string) => {
    // Navigate to agent settings page
    window.location.href = `/agents/${agentId}`;
  };

  const filteredAgents = agents.filter((agent) => {
    if (selectedType === "all") return true;
    return agent.type === selectedType;
  });

  const personalAgents = agents.filter((agent) => agent.type === "personal");
  const specializedAgents = agents.filter((agent) => agent.type !== "personal");
  const activeAgents = agents.filter((agent) => agent.isActive);
  const incompleteAgents = agents.filter(
    (agent) => agent.type === "personal" && !agent.isProfileComplete
  );

  const agentTypes = [
    { value: "all", label: "All Agents", icon: Brain, count: agents.length },
    {
      value: "personal",
      label: "Personal",
      icon: User,
      count: personalAgents.length,
    },
    {
      value: "application",
      label: "Application",
      icon: Zap,
      count: specializedAgents.length,
    },
  ];

  if (loading) {
    return (
      <ApplicationLayout applicationName="Agent Management">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
        </div>
      </ApplicationLayout>
    );
  }

  return (
    <ApplicationLayout applicationName="Agent Management">
      <div className="space-y-6">
        {/* Setup Status Alert */}
        {setupStatus?.needsSetup && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              You need to create your personal digital twin agent before using
              the platform.
              <Button
                onClick={() => setShowInterview(true)}
                variant="link"
                className="p-0 ml-2 h-auto"
              >
                Start Setup
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-card rounded-lg p-4">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-blue-500" />
              <span className="text-sm font-medium">Total Agents</span>
            </div>
            <div className="text-2xl font-bold mt-1">{agents.length}</div>
          </div>

          <div className="bg-card rounded-lg p-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span className="text-sm font-medium">Active</span>
            </div>
            <div className="text-2xl font-bold mt-1">{activeAgents.length}</div>
          </div>

          <div className="bg-card rounded-lg p-4">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-purple-500" />
              <span className="text-sm font-medium">Personal</span>
            </div>
            <div className="text-2xl font-bold mt-1">
              {personalAgents.length}
            </div>
          </div>

          <div className="bg-card rounded-lg p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <span className="text-sm font-medium">Need Setup</span>
            </div>
            <div className="text-2xl font-bold mt-1">
              {incompleteAgents.length}
            </div>
          </div>
        </div>

        {/* Agent Type Filter */}
        <Tabs value={selectedType} onValueChange={setSelectedType}>
          <div className="flex items-center justify-between">
            <TabsList>
              {agentTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <TabsTrigger
                    key={type.value}
                    value={type.value}
                    className="flex items-center gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    {type.label}
                    <Badge variant="secondary" className="ml-1">
                      {type.count}
                    </Badge>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            <div className="flex items-center gap-2">
              <Button
                onClick={loadAgents}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>

              <Button
                onClick={() => setShowInterview(true)}
                size="sm"
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                New Agent
              </Button>
            </div>
          </div>

          <TabsContent value={selectedType} className="mt-6">
            {filteredAgents.length === 0 ? (
              <div className="text-center py-12">
                <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No agents found</h3>
                <p className="text-muted-foreground mb-4">
                  {selectedType === "all"
                    ? "You haven't created any agents yet."
                    : `No ${selectedType} agents found.`}
                </p>
                <Button onClick={() => setShowInterview(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Agent
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredAgents.map((agent) => (
                  <AgentCard
                    key={agent.id}
                    agent={agent}
                    onDeploy={handleDeploy}
                    onTest={handleTest}
                    onSettings={handleSettings}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Profile Interview Modal */}
        {showInterview && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-background rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-hidden mx-4">
              <ProfileInterview
                agentId={setupStatus?.agentId || "new"}
                onComplete={() => {
                  setShowInterview(false);
                  loadAgents();
                  checkSetupStatus();
                }}
                onCancel={() => setShowInterview(false)}
              />
            </div>
          </div>
        )}
      </div>
    </ApplicationLayout>
  );
}
