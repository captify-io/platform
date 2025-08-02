/**
 * External Service Connection Architecture
 * Centralized configuration for AWS and external service integrations
 */

export interface ServiceConnection {
  id: string;
  name: string;
  type: "aws" | "external" | "api";
  endpoint: string;
  region?: string;
  authentication: {
    type: "iam" | "api-key" | "oauth" | "custom";
    config: Record<string, unknown>;
  };
  healthCheck?: {
    enabled: boolean;
    endpoint: string;
    interval: number;
  };
  metadata?: Record<string, unknown>;
}

export interface ServiceConnectionManager {
  connections: Map<string, ServiceConnection>;
  registerConnection(connection: ServiceConnection): void;
  getConnection(id: string): ServiceConnection | undefined;
  testConnection(id: string): Promise<boolean>;
  getHealthStatus(id: string): Promise<"healthy" | "unhealthy" | "unknown">;
}

class ExternalServiceManager implements ServiceConnectionManager {
  public connections = new Map<string, ServiceConnection>();

  registerConnection(connection: ServiceConnection): void {
    this.connections.set(connection.id, connection);
  }

  getConnection(id: string): ServiceConnection | undefined {
    return this.connections.get(id);
  }

  async testConnection(id: string): Promise<boolean> {
    const connection = this.getConnection(id);
    if (!connection) return false;

    try {
      // Implementation would depend on service type
      return true;
    } catch (error) {
      console.error(`Connection test failed for ${id}:`, error);
      return false;
    }
  }

  async getHealthStatus(
    id: string
  ): Promise<"healthy" | "unhealthy" | "unknown"> {
    const connection = this.getConnection(id);
    if (!connection?.healthCheck?.enabled) return "unknown";

    try {
      const response = await fetch(connection.healthCheck.endpoint);
      return response.ok ? "healthy" : "unhealthy";
    } catch {
      return "unhealthy";
    }
  }
}

// Singleton instance
export const serviceManager = new ExternalServiceManager();

// Default AWS service connections
export const defaultAWSServices: ServiceConnection[] = [
  {
    id: "neptune",
    name: "Amazon Neptune",
    type: "aws",
    endpoint: "https://neptune.amazonaws.com",
    region: "us-east-1",
    authentication: {
      type: "iam",
      config: {
        useDefaultCredentials: true,
      },
    },
    healthCheck: {
      enabled: true,
      endpoint: "/health",
      interval: 30000,
    },
    metadata: {
      service: "neptune",
      category: "database",
    },
  },
  {
    id: "bedrock",
    name: "Amazon Bedrock",
    type: "aws",
    endpoint: "https://bedrock.amazonaws.com",
    region: "us-east-1",
    authentication: {
      type: "iam",
      config: {
        useDefaultCredentials: true,
      },
    },
    metadata: {
      service: "bedrock",
      category: "ai",
    },
  },
  {
    id: "lambda",
    name: "AWS Lambda",
    type: "aws",
    endpoint: "https://lambda.amazonaws.com",
    region: "us-east-1",
    authentication: {
      type: "iam",
      config: {
        useDefaultCredentials: true,
      },
    },
    metadata: {
      service: "lambda",
      category: "compute",
    },
  },
];

// Initialize default connections
defaultAWSServices.forEach((service) => {
  serviceManager.registerConnection(service);
});
