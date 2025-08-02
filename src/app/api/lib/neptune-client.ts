import { driver } from "gremlin";
import { fromCognitoIdentityPool } from "@aws-sdk/credential-providers";
import { GetCallerIdentityCommand, STSClient } from "@aws-sdk/client-sts";

// AWS Configuration
const AWS_REGION = process.env.REGION || "us-east-1";
const IDENTITY_POOL_ID = process.env.COGNITO_SERVICE_CATALOG_POOL_ID;
const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID;

interface NeptuneClientOptions {
  idToken?: string;
  accessToken?: string;
}

interface SearchOptions {
  searchFields?: string[];
  limit?: number;
  filters?: Record<string, unknown>;
}

interface NeptuneResponseItem {
  [key: string]: unknown;
}

/**
 * Basic Gremlin client for Neptune connections without IAM authentication
 * Used for development and VPC-secured environments
 */
export function GremlinClient() {
  const rawEndpoint = process.env.NEPTUNE_ENDPOINT;

  if (!rawEndpoint) {
    throw new Error("NEPTUNE_ENDPOINT environment variable is required");
  }

  // Build WebSocket URL for Neptune
  let url: string;

  if (rawEndpoint.startsWith("wss://")) {
    // Already formatted
    url = rawEndpoint;
  } else if (rawEndpoint.startsWith("https://")) {
    // Convert https to wss and add gremlin path
    url = rawEndpoint.replace("https://", "wss://") + ":8182/gremlin";
  } else {
    // Raw endpoint - add protocol and path
    url = `wss://${rawEndpoint}:8182/gremlin`;
  }

  console.log("Connecting to Neptune at:", url);

  const clientOptions = {
    traversalSource: "g",
    mimeType: "application/vnd.gremlin-v2.0+json",
    pingEnabled: false,
    connectOnStartup: false,
  };

  return new driver.Client(url, clientOptions);
}

interface GremlinClient {
  submit(query: string, bindings?: Record<string, unknown>): Promise<unknown>;
  close(): void;
}

interface GremlinResponse {
  _items: unknown[];
}

/**
 * Enhanced Neptune client with session authentication and search capabilities
 * Supports IAM authentication via Cognito Identity Pool
 */
export class NeptuneClient {
  private client: GremlinClient;
  private credentials: ReturnType<typeof fromCognitoIdentityPool> | null = null;
  private options: NeptuneClientOptions;

  constructor(options: NeptuneClientOptions = {}) {
    this.options = options;
    this.client = this.createClient();
  }

  private createClient() {
    const rawEndpoint = process.env.NEPTUNE_ENDPOINT;

    if (!rawEndpoint) {
      throw new Error("NEPTUNE_ENDPOINT environment variable is required");
    }

    // Build WebSocket URL for Neptune
    let url: string;

    if (rawEndpoint.startsWith("wss://")) {
      url = rawEndpoint;
    } else if (rawEndpoint.startsWith("https://")) {
      url = rawEndpoint.replace("https://", "wss://") + ":8182/gremlin";
    } else {
      url = `wss://${rawEndpoint}:8182/gremlin`;
    }

    console.log("Neptune Client connecting to:", url);

    const clientOptions = {
      traversalSource: "g",
      mimeType: "application/vnd.gremlin-v2.0+json",
      pingEnabled: false,
      connectOnStartup: false,
    };

    // Future: Add IAM authentication headers here
    // if (this.options.idToken && IDENTITY_POOL_ID) {
    //   clientOptions.headers = await this.getIAMHeaders();
    // }

    return new driver.Client(url, clientOptions);
  }

  /**
   * Future implementation for IAM authentication
   * Currently prepared for when IAM is enabled on Neptune cluster
   */
  private async setupIAMAuthentication(): Promise<void> {
    if (!this.options.idToken || !IDENTITY_POOL_ID || !USER_POOL_ID) {
      console.warn("IAM authentication not configured, using VPC access");
      return;
    }

    try {
      this.credentials = fromCognitoIdentityPool({
        identityPoolId: IDENTITY_POOL_ID,
        logins: {
          [`cognito-idp.${AWS_REGION}.amazonaws.com/${USER_POOL_ID}`]:
            this.options.idToken,
        },
      });

      // Verify credentials work
      const stsClient = new STSClient({
        region: AWS_REGION,
        credentials: this.credentials,
      });

      const identity = await stsClient.send(new GetCallerIdentityCommand({}));
      console.log("IAM Authentication successful:", {
        userId: identity.UserId,
        arn: identity.Arn,
      });
    } catch (error) {
      console.error("IAM authentication failed:", error);
      throw new Error(
        "Failed to authenticate with AWS using Cognito Identity Pool"
      );
    }
  }

  /**
   * Generic search method for finding vertices by label and text search
   */
  async search(
    label: string,
    query: string,
    options: SearchOptions = {}
  ): Promise<NeptuneResponseItem[]> {
    const {
      searchFields = ["name", "description"],
      limit = 20,
      filters = {},
    } = options;

    if (!query.trim()) {
      return [];
    }

    const searchTerm = query.toLowerCase().trim();

    try {
      // Build dynamic search query using text matching across multiple fields
      let gremlinQuery = `g.V().hasLabel('${label}')`;

      // Add filters if provided
      Object.entries(filters).forEach(([key, value]) => {
        gremlinQuery += `.has('${key}', '${value}')`;
      });

      // Build text search conditions for multiple fields
      const searchConditions = searchFields
        .map((field) => `has('${field}', textContains('${searchTerm}'))`)
        .join(" or ");

      // If Neptune supports text search, use it; otherwise fall back to property matching
      if (process.env.NEPTUNE_TEXT_SEARCH_ENABLED === "true") {
        gremlinQuery += `.where(${searchConditions})`;
      } else {
        // Fallback: use case-insensitive contains matching
        const fieldConditions = searchFields
          .map(
            (field) => `__.values('${field}').is(containing('${searchTerm}'))`
          )
          .join(", ");
        gremlinQuery += `.where(or(${fieldConditions}))`;
      }

      gremlinQuery += `.limit(${limit})`;

      // Project common properties
      gremlinQuery += `
        .project('id', 'alias', 'name', 'description', 'category', 'status', 'version', 'keywords', 'capabilities', 'createdAt', 'updatedAt')
          .by(id())
          .by(coalesce(values('alias'), constant('')))
          .by(coalesce(values('name'), constant('')))
          .by(coalesce(values('description'), constant('')))
          .by(coalesce(values('category'), constant('')))
          .by(coalesce(values('status'), constant('active')))
          .by(coalesce(values('version'), constant('')))
          .by(coalesce(values('keywords'), constant('')))
          .by(coalesce(values('capabilities'), constant('')))
          .by(coalesce(values('createdAt'), constant('')))
          .by(coalesce(values('updatedAt'), constant('')))`;

      console.log("Neptune search query:", gremlinQuery);
      console.log("Search parameters:", {
        label,
        query: searchTerm,
        searchFields,
        limit,
      });

      const response = await this.client.submit(gremlinQuery);
      const results = (response as GremlinResponse)._items || [];

      console.log(
        `Neptune search found ${results.length} results for "${query}"`
      );

      return results as NeptuneResponseItem[];
    } catch (error) {
      console.error("Neptune search error:", error);
      throw error;
    }
  }

  /**
   * Execute a raw Gremlin query with parameters
   */
  async submit(
    query: string,
    parameters: Record<string, unknown> = {}
  ): Promise<unknown> {
    try {
      console.log("Executing Gremlin query:", query);
      console.log("Parameters:", parameters);

      const response = await this.client.submit(query, parameters);
      return response;
    } catch (error) {
      console.error("Gremlin query error:", error);
      throw error;
    }
  }

  /**
   * Get all vertices of a specific label
   */
  async findByLabel(
    label: string,
    limit: number = 100
  ): Promise<NeptuneResponseItem[]> {
    const query = `g.V().hasLabel('${label}').limit(${limit})
      .project('id', 'alias', 'name', 'description', 'status')
        .by(id())
        .by(coalesce(values('alias'), constant('')))
        .by(coalesce(values('name'), constant('')))
        .by(coalesce(values('description'), constant('')))
        .by(coalesce(values('status'), constant('active')))`;

    const response = await this.submit(query);
    return ((response as GremlinResponse)._items ||
      []) as NeptuneResponseItem[];
  }

  /**
   * Find a vertex by ID
   */
  async findById(id: string): Promise<NeptuneResponseItem | null> {
    const query = `g.V('${id}')
      .project('id', 'alias', 'name', 'description', 'status', 'properties')
        .by(id())
        .by(coalesce(values('alias'), constant('')))
        .by(coalesce(values('name'), constant('')))
        .by(coalesce(values('description'), constant('')))
        .by(coalesce(values('status'), constant('active')))
        .by(valueMap())`;

    const response = await this.submit(query);
    const results = (response as GremlinResponse)._items || [];
    return results.length > 0 ? (results[0] as NeptuneResponseItem) : null;
  }

  /**
   * Verify database connectivity
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.submit("g.V().limit(1).count()");
      const count = (response as GremlinResponse)._items?.[0] || 0;
      console.log("Neptune connection test successful, vertex count:", count);
      return true;
    } catch (error) {
      console.error("Neptune connection test failed:", error);
      return false;
    }
  }

  /**
   * Close the client connection
   */
  close(): void {
    if (this.client) {
      this.client.close();
    }
  }
}
