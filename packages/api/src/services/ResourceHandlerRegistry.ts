/**
 * Resource Handler Registry
 * Manages all resource type handlers
 */

import type { ResourceHandler, ApiRequest, ApiResponse } from "../types";

export class ResourceHandlerRegistry {
  private handlers = new Map<string, ResourceHandler>();

  register(resourceType: string, handler: ResourceHandler): void {
    this.handlers.set(resourceType, handler);
  }

  async handle(request: ApiRequest): Promise<ApiResponse> {
    const handler = this.handlers.get(request.resource);

    if (!handler) {
      return {
        success: false,
        error: `No handler registered for resource type: ${request.resource}`,
      };
    }

    try {
      return await handler.handle(request);
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  getRegisteredTypes(): string[] {
    return Array.from(this.handlers.keys());
  }

  hasHandler(resourceType: string): boolean {
    return this.handlers.has(resourceType);
  }
}
