/**
 * Digital Twin Agent Creation and Management Page
 * /app/agents - Main interface for setting up and managing digital twin agents
 */

"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { ApplicationLayout } from "@/components/apps/ApplicationLayout";

interface SetupStatus {
  needsSetup: boolean;
  hasPersonalAgent: boolean;
  agentId?: string;
  isProfileComplete?: boolean;
}

interface UserAgent {
  id: string;
  name: string;
  type: string;
  isActive: boolean;
  isProfileComplete?: boolean;
  memoryEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AgentsPage() {
  const { data: session, status } = useSession();
  const [setupStatus, setSetupStatus] = useState<SetupStatus | null>(null);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [personalAgent, setPersonalAgent] = useState<UserAgent | null>(null);
  const [loading, setLoading] = useState(true);

  // Redirect if not authenticated
  if (status === "unauthenticated") {
    redirect("/auth/signin");
  }

  useEffect(() => {
    if (session?.user?.email) {
      checkSetupStatus();
    }
  }, [session]);

  const checkSetupStatus = async () => {
    try {
      const response = await fetch("/api/agents/setup");
      if (response.ok) {
        const status = await response.json();
        setSetupStatus(status);

        if (status.hasPersonalAgent && status.agentId) {
          // Fetch agent details
          const agentResponse = await fetch(`/api/agents/${status.agentId}`);
          if (agentResponse.ok) {
            const agent = await agentResponse.json();
            setPersonalAgent(agent);
          }
        }
      } else {
        console.error("Failed to check setup status");
      }
    } catch (error) {
      console.error("Error checking setup status:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSetupComplete = (jobId: string) => {
    setCurrentJobId(jobId);
  };

  const handleCreationComplete = (agent: UserAgent) => {
    setPersonalAgent(agent);
    setCurrentJobId(null);
    setSetupStatus({
      needsSetup: false,
      hasPersonalAgent: true,
      agentId: agent.id,
      isProfileComplete: agent.isProfileComplete,
    });
  };

  if (loading) {
    return (
      <ApplicationLayout
        applicationId="agents"
        applicationName="Digital Twin Agents"
        showChat={false}
      >
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </ApplicationLayout>
    );
  }

  return (
    <ApplicationLayout
      applicationId="agents"
      applicationName="Digital Twin Agents"
      showChat={false}
    >
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            My Digital Twin
          </h1>
          <p className="text-muted-foreground">
            Your personal AI assistant that learns about your role and
            responsibilities to provide tailored support for your work at the
            Air Force Sustainment Center.
          </p>
        </div>

        {/* Setup Flow */}
        {setupStatus?.needsSetup && !currentJobId && (
          <div className="bg-card rounded-lg shadow-lg p-6 border">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              Create Your Digital Twin
            </h2>
            <p className="text-muted-foreground mb-6">
              Let&apos;s set up your personal AI assistant. This process takes
              about 12-15 minutes and includes creating your knowledge base and
              configuring your agent.
            </p>
            <AgentSetupFormPlaceholder onSetupComplete={handleSetupComplete} />
          </div>
        )}

        {/* Creation Progress */}
        {currentJobId && (
          <div className="bg-card rounded-lg shadow-lg p-6 border">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              Creating Your Digital Twin
            </h2>
            <p className="text-muted-foreground mb-6">
              Please wait while we create your personal AI assistant. This
              process typically takes 12-15 minutes. You can leave this page and
              return later to check the progress.
            </p>
            <AgentCreationProgressPlaceholder
              jobId={currentJobId}
              onComplete={handleCreationComplete}
            />
          </div>
        )}

        {/* Agent Management */}
        {personalAgent && setupStatus?.hasPersonalAgent && (
          <div className="bg-card rounded-lg shadow-lg p-6 border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-foreground">
                {personalAgent.name}
              </h2>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  personalAgent.isActive
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {personalAgent.isActive ? "Active" : "Inactive"}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
              <div>
                <strong className="text-foreground">Type:</strong>{" "}
                {personalAgent.type}
              </div>
              <div>
                <strong className="text-foreground">Created:</strong>{" "}
                {new Date(personalAgent.createdAt).toLocaleDateString()}
              </div>
              <div>
                <strong className="text-foreground">Profile Complete:</strong>{" "}
                {personalAgent.isProfileComplete ? "Yes" : "No"}
              </div>
              <div>
                <strong className="text-foreground">Memory Enabled:</strong>{" "}
                {personalAgent.memoryEnabled ? "Yes" : "No"}
              </div>
            </div>

            {!personalAgent.isProfileComplete && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md dark:bg-yellow-900/20 dark:border-yellow-800">
                <p className="text-yellow-800 dark:text-yellow-200">
                  <strong>Profile Interview Pending:</strong> Complete your
                  profile interview to get personalized responses from your
                  digital twin.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Error State */}
        {!loading && !setupStatus && (
          <div className="bg-destructive/15 border border-destructive/20 rounded-md p-4">
            <h3 className="text-destructive font-medium">
              Unable to Load Agent Status
            </h3>
            <p className="text-destructive/80 mt-1">
              There was an error checking your agent setup status. Please
              refresh the page or contact support.
            </p>
          </div>
        )}
      </div>
    </ApplicationLayout>
  );
}

// Placeholder components - to be replaced with actual implementations
function AgentSetupFormPlaceholder({
  onSetupComplete,
}: {
  onSetupComplete: (jobId: string) => void;
}) {
  const [agentName, setAgentName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agentName.trim()) return;

    setSubmitting(true);
    try {
      const response = await fetch("/api/agents/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentName: agentName.trim(),
          agentDescription:
            "Personal digital twin for Air Force Sustainment Center",
          organizationalRole: "operations",
          department: "Air Force Sustainment Center",
          specialFocus: [],
        }),
      });

      if (response.ok) {
        const result = await response.json();
        onSetupComplete(result.jobId);
      } else {
        console.error("Failed to create agent");
      }
    } catch (error) {
      console.error("Error creating agent:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="agentName"
          className="block text-sm font-medium text-foreground mb-2"
        >
          Agent Name
        </label>
        <input
          type="text"
          id="agentName"
          value={agentName}
          onChange={(e) => setAgentName(e.target.value)}
          className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="e.g., My Digital Assistant"
          required
        />
      </div>
      <button
        type="submit"
        disabled={submitting || !agentName.trim()}
        className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? "Creating..." : "Create Digital Twin"}
      </button>
    </form>
  );
}

function AgentCreationProgressPlaceholder({
  jobId,
  onComplete,
}: {
  jobId: string;
  onComplete: (agent: UserAgent) => void;
}) {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState("Initializing...");
  const [status, setStatus] = useState("PENDING");

  useEffect(() => {
    const pollProgress = async () => {
      try {
        const response = await fetch(`/api/agents/create-async?jobId=${jobId}`);
        if (response.ok) {
          const data = await response.json();
          setProgress(data.progress || 0);
          setCurrentStep(data.currentStep || "Processing...");
          setStatus(data.status);

          if (data.status === "COMPLETED" && data.agentId) {
            // Fetch the completed agent
            const agentResponse = await fetch(`/api/agents/${data.agentId}`);
            if (agentResponse.ok) {
              const agent = await agentResponse.json();
              onComplete(agent);
            }
          }
        }
      } catch (error) {
        console.error("Error polling progress:", error);
      }
    };

    const interval = setInterval(pollProgress, 5000); // Poll every 5 seconds
    pollProgress(); // Initial poll

    return () => clearInterval(interval);
  }, [jobId, onComplete]);

  return (
    <div className="space-y-4">
      <div className="w-full bg-muted rounded-full h-2">
        <div
          className="bg-primary h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      <div className="text-center">
        <p className="text-sm text-muted-foreground">{progress}% Complete</p>
        <p className="text-foreground mt-1">{currentStep}</p>
        {status === "FAILED" && (
          <p className="text-destructive mt-2">
            Creation failed. Please try again.
          </p>
        )}
      </div>
    </div>
  );
}
