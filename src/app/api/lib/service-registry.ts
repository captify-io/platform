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
    // Check if we've already cached this package loader
    let loader = this.registry.get(packageName);

    if (!loader) {
      // Create a loader for this package on first request
      // This way we only load packages that are actually used
      loader = () => import(`@captify-io/${packageName}/services`) as Promise<ServiceModule>;
      this.registry.set(packageName, loader);
    }

    try {
      // Load the package and get the service
      const serviceModule = await loader();
      return serviceModule.services?.use(serviceName);
    } catch (error) {
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
