declare module "gremlin" {
  export namespace driver {
    interface ClientOptions {
      traversalSource?: string;
      mimeType?: string;
      pingEnabled?: boolean;
      connectOnStartup?: boolean;
      headers?: Record<string, string>;
    }

    export class Client {
      constructor(url: string, options?: ClientOptions);
      submit(
        query: string,
        bindings?: Record<string, unknown>
      ): Promise<{
        _items: unknown[];
        attributes?: Record<string, unknown>;
      }>;
      close(): void;
    }
  }

  export namespace process {
    interface Traversal {
      iterate(): Promise<void>;
      next(): Promise<{ value: unknown; done: boolean }>;
      toList(): Promise<unknown[]>;
    }

    interface GraphTraversalSource {
      V(id?: string): GraphTraversal;
      E(id?: string): GraphTraversal;
      addV(label?: string): GraphTraversal;
      addE(label: string): GraphTraversal;
    }

    interface GraphTraversal extends Traversal {
      hasLabel(label: string): GraphTraversal;
      has(property: string, value?: unknown): GraphTraversal;
      where(predicate: unknown): GraphTraversal;
      or(...predicates: unknown[]): GraphTraversal;
      and(...predicates: unknown[]): GraphTraversal;
      values(property: string): GraphTraversal;
      valueMap(): GraphTraversal;
      project(...keys: string[]): GraphTraversal;
      by(traversal?: unknown): GraphTraversal;
      limit(count: number): GraphTraversal;
      range(start: number, end: number): GraphTraversal;
      order(): GraphTraversal;
      count(): GraphTraversal;
      id(): GraphTraversal;
      label(): GraphTraversal;
      properties(): GraphTraversal;
      property(key: string, value: unknown): GraphTraversal;
      from_(traversal: unknown): GraphTraversal;
      to(traversal: unknown): GraphTraversal;
      outE(label?: string): GraphTraversal;
      inE(label?: string): GraphTraversal;
      bothE(label?: string): GraphTraversal;
      out(label?: string): GraphTraversal;
      in_(label?: string): GraphTraversal;
      both(label?: string): GraphTraversal;
      outV(): GraphTraversal;
      inV(): GraphTraversal;
      bothV(): GraphTraversal;
      drop(): GraphTraversal;
    }
  }

  export namespace structure {
    interface Graph {
      traversal(): process.GraphTraversalSource;
    }

    interface Vertex {
      id: unknown;
      label: string;
      properties: Record<string, unknown>;
    }

    interface Edge {
      id: unknown;
      label: string;
      outV: Vertex;
      inV: Vertex;
      properties: Record<string, unknown>;
    }
  }

  // Common predicates and functions
  export const __: {
    values(property: string): unknown;
    has(property: string, value?: unknown): unknown;
    hasLabel(label: string): unknown;
    in_(label?: string): unknown;
    out(label?: string): unknown;
    both(label?: string): unknown;
  };

  export function textContains(text: string): unknown;
  export function containing(text: string): unknown;
  export function coalesce(...values: unknown[]): unknown;
  export function constant(value: unknown): unknown;
  export function or(...predicates: unknown[]): unknown;
  export function and(...predicates: unknown[]): unknown;
}
