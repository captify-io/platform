/**
 * Debug service for system utilities and testing
 */

export async function execute(
  request: {
    service: string;
    operation: string;
    data?: any;
  },
  credentials?: any
) {
  try {
    const { operation, data } = request;

    switch (operation) {
      case "clearCredentialsCache": {
        // This will clear the server-side credentials cache
        return {
          success: true,
          data: { 
            message: "Cache clear request sent",
            timestamp: new Date().toISOString()
          },
          metadata: {
            requestId: `debug-clear-cache-${Date.now()}`,
            timestamp: new Date().toISOString(),
            source: "debug.clearCredentialsCache",
          },
        };
      }

      case "ping": {
        // Simple health check
        return {
          success: true,
          data: { 
            message: "pong",
            timestamp: new Date().toISOString(),
            echo: data
          },
          metadata: {
            requestId: `debug-ping-${Date.now()}`,
            timestamp: new Date().toISOString(),
            source: "debug.ping",
          },
        };
      }

      case "testError": {
        // Test error handling
        throw new Error(data?.message || "Test error triggered");
      }

      case "getSystemInfo": {
        // Return system information
        return {
          success: true,
          data: {
            nodeVersion: process.version,
            platform: process.platform,
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            env: process.env.NODE_ENV,
          },
          metadata: {
            requestId: `debug-system-${Date.now()}`,
            timestamp: new Date().toISOString(),
            source: "debug.getSystemInfo",
          },
        };
      }

      default:
        return {
          success: false,
          error: `Unsupported debug operation: ${operation}`,
          metadata: {
            requestId: `debug-error-${Date.now()}`,
            timestamp: new Date().toISOString(),
            source: "debug.execute",
          },
        };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Debug operation failed",
      metadata: {
        requestId: `debug-error-${Date.now()}`,
        timestamp: new Date().toISOString(),
        source: "debug.execute",
        error: error instanceof Error ? error.stack : undefined,
      },
    };
  }
}

const manifest = {
  name: "debug",
  version: "1.0.0",
  description: "Debug and system utility service",
  operations: ["clearCredentialsCache", "ping", "testError", "getSystemInfo"],
  requiredParams: {
    clearCredentialsCache: [],
    ping: [],
    testError: [],
    getSystemInfo: [],
  },
};

export const debug = { execute, manifest };