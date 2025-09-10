// Type declarations for @captify-io packages

declare module "@captify-io/*/app" {
  export const pageRegistry: Record<string, () => Promise<any>>;
  export const componentRegistry: Record<string, () => Promise<any>>;
}

declare module "@captify-io/pmbook/app" {
  export const pageRegistry: Record<string, () => Promise<any>>;
  export const componentRegistry: Record<string, () => Promise<any>>;
}

declare module "@captify-io/pmbook" {
  export const pageRegistry: Record<string, () => Promise<any>>;
  export const componentRegistry: Record<string, () => Promise<any>>;
}


// Component type for dynamically loaded components
export type DynamicComponent = React.ComponentType<any>;

// Module structure for app packages
export interface AppModule {
  pageRegistry: Record<string, () => Promise<{ default: DynamicComponent } | Record<string, DynamicComponent>>>;
  componentRegistry: Record<string, () => Promise<{ default: DynamicComponent } | Record<string, DynamicComponent>>>;
}