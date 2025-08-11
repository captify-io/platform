/**
 * Digital Twin Agent Creation and Management Page
 * /app/agents - Main interface for setting up and managing digital twin agents
 */

"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";

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
          // Fetch the actual agent data
          const agentResponse = await fetch(`/api/agents/${status.agentId}`);
          if (agentResponse.ok) {
            const agent = await agentResponse.json();
            setPersonalAgent(agent);
          }
        }
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          My Digital Twin
        </h1>
        <p className="text-gray-600">
          Your personal AI assistant that learns about your role and
          responsibilities to provide tailored support for your work at the Air
          Force Sustainment Center.
        </p>
      </div>

      {/* Setup Flow */}
      {setupStatus?.needsSetup && !currentJobId && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Create Your Digital Twin
          </h2>
          <p className="text-gray-600 mb-6">
            Let&apos;s set up your personal AI assistant. This process takes
            about 12-15 minutes and includes creating your knowledge base and
            configuring your agent.
          </p>
          <AgentSetupFormPlaceholder onSetupComplete={handleSetupComplete} />
        </div>
      )}

      {/* Creation Progress */}
      {currentJobId && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Creating Your Digital Twin
          </h2>
          <p className="text-gray-600 mb-6">
            Please wait while we create your personal AI assistant. This process
            typically takes 12-15 minutes. You can leave this page and return
            later to check the progress.
          </p>
          <AgentCreationProgressPlaceholder
            jobId={currentJobId}
            onComplete={handleCreationComplete}
          />
        </div>
      )}

      {/* Agent Management */}
      {personalAgent && !currentJobId && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                {personalAgent.name}
              </h2>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  personalAgent.isActive
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {personalAgent.isActive ? "Active" : "Inactive"}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <strong>Type:</strong> Personal Digital Twin
              </div>
              <div>
                <strong>Created:</strong>{" "}
                {new Date(personalAgent.createdAt).toLocaleDateString()}
              </div>
              <div>
                <strong>Profile Complete:</strong>{" "}
                {personalAgent.isProfileComplete ? "Yes" : "No"}
              </div>
              <div>
                <strong>Memory Enabled:</strong>{" "}
                {personalAgent.memoryEnabled ? "Yes" : "No"}
              </div>
            </div>

            {!personalAgent.isProfileComplete && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-yellow-800">
                  <strong>Profile Interview Pending:</strong> Complete your
                  profile interview to get personalized responses from your
                  digital twin.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error State */}
      {!loading && !setupStatus && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <h3 className="text-red-800 font-medium">
            Unable to Load Agent Status
          </h3>
          <p className="text-red-700 mt-1">
            There was an error checking your agent setup status. Please refresh
            the page or contact support.
          </p>
        </div>
      )}
    </div>
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
      const response = await fetch("/api/agents/create-async", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentName,
          agentType: "personal",
          instructions:
            "You are a helpful AI assistant for the Air Force Sustainment Center.",
        }),
      });

      if (response.ok) {
        const result = await response.json();
        onSetupComplete(result.jobId);
      } else {
        alert("Failed to start agent creation");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="agentName"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Agent Name
        </label>
        <input
          type="text"
          id="agentName"
          value={agentName}
          onChange={(e) => setAgentName(e.target.value)}
          placeholder="e.g., John's Assistant"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      <button
        type="submit"
        disabled={submitting || !agentName.trim()}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {submitting ? "Creating Agent..." : "Create My Digital Twin"}
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
  const [status, setStatus] = useState("PENDING");
  const [currentStep, setCurrentStep] = useState("Initializing...");

  useEffect(() => {
    const pollProgress = async () => {
      try {
        const response = await fetch(`/api/agents/create-async?jobId=${jobId}`);
        if (response.ok) {
          const data = await response.json();
          setProgress(data.progress);
          setStatus(data.status);
          setCurrentStep(data.currentStep);

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

    const interval = setInterval(pollProgress, 3000); // Poll every 3 seconds
    pollProgress(); // Initial poll

    return () => clearInterval(interval);
  }, [jobId, onComplete]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between text-sm text-gray-600">
        <span>{currentStep}</span>
        <span>{progress}%</span>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="text-center text-sm text-gray-500">Status: {status}</div>

      {status === "FAILED" && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">
            Agent creation failed. Please try again or contact support.
          </p>
        </div>
      )}
    </div>
  );
}
