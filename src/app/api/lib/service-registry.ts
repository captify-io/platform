/**
 * Service Registry
 * Dynamically registers and manages service modules
 * This allows the API to remain completely generic
 */

type ServiceModule = {
  services: {
    use: (serviceName: string) =>
      | {
          execute: (
            request: any,
            credentials?: any,
            session?: any
          ) => Promise<any>;
        }
      | undefined;
  };
};

class ServiceRegistry {
  private static instance: ServiceRegistry;
  private registry: Map<string, () => Promise<ServiceModule>> = new Map();

  private constructor() {
    // Registry starts empty - packages are loaded on-demand
    // No hardcoded packages - everything is dynamic
  }

  static getInstance(): ServiceRegistry {
    if (!ServiceRegistry.instance) {
      ServiceRegistry.instance = new ServiceRegistry();
    }
    return ServiceRegistry.instance;
  }

  /**
   * Register a package loader
   */
  registerPackage(name: string, loader: () => Promise<ServiceModule>) {
    this.registry.set(name, loader);
  }

  /**
   * Get a service handler from a package
   */
  async getServiceHandler(packageName: string, serviceName: string) {
    console.log(`[ServiceRegistry] ===== GETTING SERVICE HANDLER =====`);
    console.log(`[ServiceRegistry] Package: ${packageName}`);
    console.log(`[ServiceRegistry] Service: ${serviceName}`);

    // Check if we've already cached this package loader
    let loader = this.registry.get(packageName);
    console.log(
      `[ServiceRegistry] Cached loader exists: ${loader ? "yes" : "no"}`
    );

    if (!loader) {
      // Create a loader for this package on first request
      // This way we only load packages that are actually used
      const importPath = `@captify-io/${packageName}/services`;
      console.log(`[ServiceRegistry] Creating new loader for: ${importPath}`);
      loader = () => import(importPath) as Promise<ServiceModule>;
      this.registry.set(packageName, loader);
      console.log(
        `[ServiceRegistry] Loader cached for package: ${packageName}`
      );
    }

    try {
      console.log(
        `[ServiceRegistry] Executing loader for package: ${packageName}`
      );
      // Load the package and get the service
      const serviceModule = await loader();
      console.log(
        `[ServiceRegistry] Service module loaded:`,
        serviceModule ? "success" : "failed"
      );
      console.log(
        `[ServiceRegistry] Service module has 'services' property:`,
        serviceModule && "services" in serviceModule
      );

      if (serviceModule && serviceModule.services) {
        console.log(
          `[ServiceRegistry] Services object type:`,
          typeof serviceModule.services
        );
        console.log(
          `[ServiceRegistry] Services has 'use' method:`,
          typeof serviceModule.services.use === "function"
        );

        if (typeof serviceModule.services.use === "function") {
          console.log(
            `[ServiceRegistry] Calling services.use('${serviceName}')`
          );
          const handler = serviceModule.services.use(serviceName);
          console.log(
            `[ServiceRegistry] Handler result:`,
            handler ? "found" : "not found"
          );
          return handler;
        } else {
          console.log(`[ServiceRegistry] ❌ services.use is not a function`);
          return undefined;
        }
      } else {
        console.log(
          `[ServiceRegistry] ❌ Service module does not have 'services' property`
        );
        return undefined;
      }
    } catch (error) {
      console.error(
        `[ServiceRegistry] ❌ Error loading package @captify-io/${packageName}:`,
        error
      );
      console.error(
        `[ServiceRegistry] Error type:`,
        error instanceof Error ? error.constructor.name : typeof error
      );
      console.error(
        `[ServiceRegistry] Error message:`,
        error instanceof Error ? error.message : String(error)
      );

      // Clear from registry if it failed
      this.registry.delete(packageName);
      throw new Error(
        `Package @captify-io/${packageName} not found or not installed`
      );
    }
  }

  /**
   * List all registered packages
   */
  getRegisteredPackages(): string[] {
    return Array.from(this.registry.keys());
  }

  /**
   * Check if a package is registered
   */
  isPackageRegistered(packageName: string): boolean {
    return this.registry.has(packageName);
  }
}

export const serviceRegistry = ServiceRegistry.getInstance();
