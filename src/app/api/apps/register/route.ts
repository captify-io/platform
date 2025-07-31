export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { GremlinClient } from "../../lib/neptune-client";

interface ApplicationRegistration {
  alias: string;
  name: string;
  description?: string;
  category?: string;
  version?: string;
  author?: string;
  homepage?: string;
  repository?: string;
  license?: string;
  keywords?: string[];
  dependencies?: Record<string, string>;
  capabilities?: string[];
  endpoints?: Array<{
    path: string;
    method: string;
    description?: string;
  }>;
  agentId?: string; // For backward compatibility
}

export async function POST(request: NextRequest) {
  try {
    const endpoint = process.env.NEPTUNE_ENDPOINT;
    if (!endpoint) {
      throw new Error("NEPTUNE_ENDPOINT is not configured");
    }

    const body: ApplicationRegistration = await request.json();

    // Validate required fields
    if (!body.alias || !body.name) {
      return NextResponse.json(
        { error: "alias and name are required fields" },
        { status: 400 }
      );
    }

    // Validate alias format (should be URL-safe)
    if (!/^[a-z0-9-_]+$/.test(body.alias)) {
      return NextResponse.json(
        {
          error:
            "alias must contain only lowercase letters, numbers, hyphens, and underscores",
        },
        { status: 400 }
      );
    }

    const client = GremlinClient();
    const timestamp = new Date().toISOString();

    try {
      // Check if application with this alias already exists
      const existingResponse = await client.submit(
        `g.V().hasLabel('Application').has('alias', alias)`,
        { alias: body.alias }
      );

      if ((existingResponse as any)._items.length > 0) {
        return NextResponse.json(
          { error: "Application with this alias already exists" },
          { status: 409 }
        );
      }

      // Create new application vertex with all registration details
      const createResponse = await client.submit(
        `g.addV('Application')
          .property('alias', alias)
          .property('name', name)
          .property('description', description)
          .property('category', category)
          .property('version', version)
          .property('author', author)
          .property('homepage', homepage)
          .property('repository', repository)
          .property('license', license)
          .property('keywords', keywords)
          .property('dependencies', dependencies)
          .property('capabilities', capabilities)
          .property('endpoints', endpoints)
          .property('agentId', agentId)
          .property('status', 'registered')
          .property('registeredAt', registeredAt)
          .property('updatedAt', updatedAt)
          .project('id', 'alias', 'name', 'description', 'status', 'registeredAt')
            .by(id())
            .by(values('alias'))
            .by(values('name'))
            .by(values('description'))
            .by(values('status'))
            .by(values('registeredAt'))`,
        {
          alias: body.alias,
          name: body.name,
          description: body.description || "",
          category: body.category || "general",
          version: body.version || "1.0.0",
          author: body.author || "",
          homepage: body.homepage || "",
          repository: body.repository || "",
          license: body.license || "",
          keywords: JSON.stringify(body.keywords || []),
          dependencies: JSON.stringify(body.dependencies || {}),
          capabilities: JSON.stringify(body.capabilities || []),
          endpoints: JSON.stringify(body.endpoints || []),
          agentId: body.agentId || "",
          registeredAt: timestamp,
          updatedAt: timestamp,
        }
      );

      const newApp = (createResponse as any)._items[0];

      return NextResponse.json(
        {
          id: newApp.id,
          alias: newApp.alias,
          name: newApp.name,
          description: newApp.description,
          status: newApp.status,
          registeredAt: newApp.registeredAt,
          message: "Application registered successfully",
        },
        { status: 201 }
      );
    } finally {
      client.close();
    }
  } catch (err: any) {
    console.error("POST /api/apps/register error:", err);
    return NextResponse.json(
      { error: "Failed to register application", details: err.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const endpoint = process.env.NEPTUNE_ENDPOINT;
    if (!endpoint) {
      throw new Error("NEPTUNE_ENDPOINT is not configured");
    }

    const client = GremlinClient();

    try {
      // Get all registered applications with their metadata
      const response = await client.submit(
        `g.V().hasLabel('Application')
          .project('id', 'alias', 'name', 'description', 'category', 'version', 'author', 'status', 'registeredAt')
            .by(id())
            .by(coalesce(values('alias'), constant('')))
            .by(coalesce(values('name'), constant('')))
            .by(coalesce(values('description'), constant('')))
            .by(coalesce(values('category'), constant('')))
            .by(coalesce(values('version'), constant('')))
            .by(coalesce(values('author'), constant('')))
            .by(coalesce(values('status'), constant('')))
            .by(coalesce(values('registeredAt'), constant('')))`
      );

      const records: any[] = (response as any)._items || [];
      const apps = records.map((r: any) => ({
        id: r.id,
        alias: r.alias || "",
        name: r.name || "",
        description: r.description || "",
        category: r.category || "",
        version: r.version || "",
        author: r.author || "",
        status: r.status || "",
        registeredAt: r.registeredAt || "",
      }));

      return NextResponse.json(apps);
    } finally {
      client.close();
    }
  } catch (err: any) {
    console.error("GET /api/apps/register error:", err);
    // Return empty list on error to avoid breaking clients
    return NextResponse.json([]);
  }
}
