/**
 * Service Registry
 * Dynamically registers and manages service modules
 * This allows the API to remain completely generic
 */

type ServiceModule = {
  services: {
    use: (serviceName: string) => {
      execute: (request: any, credentials?: any, session?: any) => Promise<any>;
    } | undefined;
  };
};

class ServiceRegistry {
  private static instance: ServiceRegistry;
  private registry: Map<string, () => Promise<ServiceModule>> = new Map();

  private constructor() {
    // Pre-register known packages for webpack optimization
    // These will be bundled by webpack but loaded on-demand
    this.registerPackage('core', () => import('@captify/core/services') as Promise<ServiceModule>);
    this.registerPackage('admin', () => import('@captify/admin/services') as Promise<ServiceModule>);
    this.registerPackage('mi', () => import('@captify/mi/services') as Promise<ServiceModule>);
    this.registerPackage('rmf', () => import('@captify/rmf/services') as Promise<ServiceModule>);
    this.registerPackage('pmbook', () => import('@captify/pmbook/services') as Promise<ServiceModule>);
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
    // Check if package is registered
    const loader = this.registry.get(packageName);
    
    if (!loader) {
      // Try dynamic import for unregistered packages
      // This allows for truly dynamic package loading
      try {
        const serviceModule = await import(`@captify/${packageName}/services`);
        return serviceModule.services?.use(serviceName);
      } catch (error) {
        throw new Error(`Package @captify/${packageName} not found or not installed`);
      }
    }

    // Load the registered package
    const serviceModule = await loader();
    return serviceModule.services?.use(serviceName);
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