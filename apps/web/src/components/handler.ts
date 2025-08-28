import { NextRequest, NextResponse } from "next/server";
import { applicationController } from "./controller";

interface HandlerMethod {
  GET?: (request: NextRequest) => Promise<NextResponse>;
  POST?: (request: NextRequest) => Promise<NextResponse>;
  PUT?: (request: NextRequest) => Promise<NextResponse>;
  DELETE?: (request: NextRequest) => Promise<NextResponse>;
  PATCH?: (request: NextRequest) => Promise<NextResponse>;
}

interface HandlerRegistry {
  [path: string]: HandlerMethod;
}

class ApiHandlerManager {
  private handlers = new Map<string, HandlerRegistry>();
  private initialized = false;

  async initialize() {
    if (this.initialized) return;

    try {
      // Load all applications and their handlers
      const applications = await applicationController.getAllApplications();

      for (const app of applications) {
        try {
          // Try to import the application's handlers
          const appModule = await import(`@captify/${app.slug}`);

          if (appModule.captifyManifest?.handlers) {
            this.handlers.set(app.slug, appModule.captifyManifest.handlers);
            console.log(`Registered API handlers for ${app.slug}`);
          }
        } catch (importError) {
          console.warn(
            `Could not import handlers for ${app.slug}:`,
            importError
          );
        }
      }

      this.initialized = true;
    } catch (error) {
      console.error("Failed to initialize API handler manager:", error);
    }
  }

  async getHandler(
    appSlug: string,
    path: string,
    method: string
  ): Promise<HandlerMethod[keyof HandlerMethod] | null> {
    await this.initialize();

    const appHandlers = this.handlers.get(appSlug);
    if (!appHandlers) {
      return null;
    }

    const pathHandler = appHandlers[path];
    if (!pathHandler) {
      return null;
    }

    const methodHandler = pathHandler[method as keyof HandlerMethod];
    return methodHandler || null;
  }

  async getAllHandlers(): Promise<Map<string, HandlerRegistry>> {
    await this.initialize();
    return this.handlers;
  }

  async createApiHandler(appSlug: string, path: string) {
    return async (request: NextRequest) => {
      const method = request.method;
      const handler = await this.getHandler(appSlug, path, method);

      if (!handler) {
        return NextResponse.json(
          {
            success: false,
            error: `Handler not found for ${method} /api/${appSlug}/${path}`,
          },
          { status: 404 }
        );
      }

      try {
        return await handler(request);
      } catch (error) {
        console.error(`API handler error for ${appSlug}/${path}:`, error);
        return NextResponse.json(
          {
            success: false,
            error: "Internal server error",
          },
          { status: 500 }
        );
      }
    };
  }

  // Helper method to get all available API routes
  async getAvailableRoutes(): Promise<
    Array<{ app: string; path: string; methods: string[] }>
  > {
    await this.initialize();
    const routes: Array<{ app: string; path: string; methods: string[] }> = [];

    for (const [appSlug, handlers] of this.handlers.entries()) {
      for (const [path, methods] of Object.entries(handlers)) {
        routes.push({
          app: appSlug,
          path,
          methods: Object.keys(methods),
        });
      }
    }

    return routes;
  }
}

export const apiHandlerManager = new ApiHandlerManager();
