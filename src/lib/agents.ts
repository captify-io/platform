import {
  BedrockAgent,
  CreateAgentRequest,
  UpdateAgentRequest,
  AgentTestRequest,
  AgentTestResponse,
  ApplicationAgentMapping,
  AgentError,
} from "@/types/agents";

// Client-side agent utilities
export class AgentService {
  private baseUrl = "/api/agents";

  async listAgents(): Promise<BedrockAgent[]> {
    try {
      const response = await fetch(this.baseUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch agents: ${response.statusText}`);
      }
      const data = await response.json();
      return data.agents || [];
    } catch (error) {
      console.error("Error listing agents:", error);
      const errorData =
        error instanceof Error
          ? { message: error.message, name: error.name }
          : undefined;
      throw new AgentError("FETCH_ERROR", "Failed to fetch agents", errorData);
    }
  }

  async getAgent(agentId: string): Promise<BedrockAgent> {
    try {
      const response = await fetch(`${this.baseUrl}/${agentId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch agent: ${response.statusText}`);
      }
      const data = await response.json();
      return data.agent;
    } catch (error) {
      console.error("Error fetching agent:", error);
      const errorData =
        error instanceof Error
          ? { message: error.message, name: error.name }
          : undefined;
      throw new AgentError("FETCH_ERROR", "Failed to fetch agent", errorData);
    }
  }

  async createAgent(request: CreateAgentRequest): Promise<BedrockAgent> {
    try {
      const response = await fetch(this.baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `Failed to create agent: ${response.statusText}`
        );
      }

      const data = await response.json();
      return data.agent;
    } catch (error) {
      console.error("Error creating agent:", error);
      const errorData =
        error instanceof Error
          ? { message: error.message, name: error.name }
          : undefined;
      throw new AgentError("CREATE_ERROR", "Failed to create agent", errorData);
    }
  }

  async updateAgent(request: UpdateAgentRequest): Promise<BedrockAgent> {
    try {
      const response = await fetch(`${this.baseUrl}/${request.agentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `Failed to update agent: ${response.statusText}`
        );
      }

      const data = await response.json();
      return data.agent;
    } catch (error) {
      console.error("Error updating agent:", error);
      const errorData =
        error instanceof Error
          ? { message: error.message, name: error.name }
          : undefined;
      throw new AgentError("UPDATE_ERROR", "Failed to update agent", errorData);
    }
  }

  async deleteAgent(agentId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/${agentId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `Failed to delete agent: ${response.statusText}`
        );
      }
    } catch (error) {
      console.error("Error deleting agent:", error);
      const errorData =
        error instanceof Error
          ? { message: error.message, name: error.name }
          : undefined;
      throw new AgentError("DELETE_ERROR", "Failed to delete agent", errorData);
    }
  }

  async prepareAgent(agentId: string): Promise<BedrockAgent> {
    try {
      const response = await fetch(`${this.baseUrl}/${agentId}/prepare`, {
        method: "POST",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `Failed to prepare agent: ${response.statusText}`
        );
      }

      const data = await response.json();
      return data.agent;
    } catch (error) {
      console.error("Error preparing agent:", error);
      const errorData =
        error instanceof Error
          ? { message: error.message, name: error.name }
          : undefined;
      throw new AgentError(
        "PREPARE_ERROR",
        "Failed to prepare agent",
        errorData
      );
    }
  }

  async testAgent(request: AgentTestRequest): Promise<AgentTestResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/${request.agentId}/test`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `Failed to test agent: ${response.statusText}`
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error testing agent:", error);
      const errorData =
        error instanceof Error
          ? { message: error.message, name: error.name }
          : undefined;
      throw new AgentError("TEST_ERROR", "Failed to test agent", errorData);
    }
  }

  async getApplicationAgentMappings(): Promise<ApplicationAgentMapping[]> {
    try {
      const response = await fetch(`${this.baseUrl}/mappings`);
      if (!response.ok) {
        throw new Error(
          `Failed to fetch application mappings: ${response.statusText}`
        );
      }
      const data = await response.json();
      return data.mappings || [];
    } catch (error) {
      console.error("Error fetching application mappings:", error);
      const errorData =
        error instanceof Error
          ? { message: error.message, name: error.name }
          : undefined;
      throw new AgentError(
        "FETCH_ERROR",
        "Failed to fetch application mappings",
        errorData
      );
    }
  }

  async createApplicationAgent(applicationId: string): Promise<BedrockAgent> {
    try {
      const response = await fetch(
        `${this.baseUrl}/applications/${applicationId}`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message ||
            `Failed to create application agent: ${response.statusText}`
        );
      }

      const data = await response.json();
      return data.agent;
    } catch (error) {
      console.error("Error creating application agent:", error);
      const errorData =
        error instanceof Error
          ? { message: error.message, name: error.name }
          : undefined;
      throw new AgentError(
        "CREATE_ERROR",
        "Failed to create application agent",
        errorData
      );
    }
  }

  async getFoundationModels(): Promise<Record<string, unknown>[]> {
    try {
      const response = await fetch("/api/agents/models");
      if (!response.ok) {
        throw new Error(
          `Failed to fetch foundation models: ${response.statusText}`
        );
      }
      const data = await response.json();
      return data.models || [];
    } catch (error) {
      console.error("Error fetching foundation models:", error);
      const errorData =
        error instanceof Error
          ? { message: error.message, name: error.name }
          : undefined;
      throw new AgentError(
        "FETCH_ERROR",
        "Failed to fetch foundation models",
        errorData
      );
    }
  }
}

// Singleton instance
export const agentService = new AgentService();

// Utility functions
export function getAgentStatusColor(status: string): string {
  switch (status) {
    case "PREPARED":
      return "text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20";
    case "CREATING":
    case "PREPARING":
    case "UPDATING":
    case "VERSIONING":
      return "text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/20";
    case "NOT_PREPARED":
      return "text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/20";
    case "FAILED":
    case "DELETING":
      return "text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20";
    default:
      return "text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/20";
  }
}

export function getAgentStatusIcon(status: string): string {
  switch (status) {
    case "PREPARED":
      return "✅";
    case "CREATING":
    case "PREPARING":
    case "UPDATING":
    case "VERSIONING":
      return "⏳";
    case "NOT_PREPARED":
      return "⚠️";
    case "FAILED":
      return "❌";
    case "DELETING":
      return "🗑️";
    default:
      return "❓";
  }
}

export function formatAgentName(
  applicationId: string,
  applicationName?: string
): string {
  const name = applicationName || applicationId;
  return `${name.charAt(0).toUpperCase() + name.slice(1)} Agent`;
}

export function generateAgentName(applicationId: string): string {
  const parts = applicationId.split("-");
  const capitalizedParts = parts.map(
    (part) => part.charAt(0).toUpperCase() + part.slice(1)
  );
  return `${capitalizedParts.join(" ")} Agent`;
}
