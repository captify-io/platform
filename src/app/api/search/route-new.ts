import { NextRequest, NextResponse } from "next/server";
import { driver, process as gremlinProcess } from "gremlin";

const { Graph } = driver.structure;
const { DriverRemoteConnection } = driver.driver;
const __ = gremlinProcess.statics;

interface SearchResult {
  title: string;
  url: string;
  description: string;
  serviceId: string;
  source: string;
}

interface SearchResponse {
  query: string;
  totalResults: number;
  results: SearchResult[];
  executionTime: number;
}

// Simple Neptune connection using official AWS approach
function createNeptuneConnection() {
  const endpoint = process.env.NEPTUNE_ENDPOINT;
  if (!endpoint) {
    throw new Error("NEPTUNE_ENDPOINT environment variable is required");
  }

  // Build WebSocket URL as per AWS documentation
  const url = `wss://${endpoint}:8182/gremlin`;

  console.log("Connecting to Neptune at:", url);

  const connection = new DriverRemoteConnection(url, {});

  const graph = new Graph();
  const g = graph.traversal().withRemote(connection);

  return { g, connection };
}

// Search Neptune for applications containing the query text
async function searchNeptune(query: string): Promise<SearchResult[]> {
  const { g, connection } = createNeptuneConnection();

  try {
    console.log("Searching Neptune for:", query);

    // Simple Gremlin query to find vertices containing the search term
    // This searches all string properties for the query text
    const results = await g
      .V()
      .or(
        __.has("name", gremlinProcess.TextP.containing(query.toLowerCase())),
        __.has("alias", gremlinProcess.TextP.containing(query.toLowerCase())),
        __.has(
          "description",
          gremlinProcess.TextP.containing(query.toLowerCase())
        ),
        __.has("category", gremlinProcess.TextP.containing(query.toLowerCase()))
      )
      .project("id", "name", "alias", "description", "category", "status")
      .by(__.id())
      .by(__.coalesce(__.values("name"), __.constant("")))
      .by(__.coalesce(__.values("alias"), __.constant("")))
      .by(__.coalesce(__.values("description"), __.constant("")))
      .by(__.coalesce(__.values("category"), __.constant("")))
      .by(__.coalesce(__.values("status"), __.constant("active")))
      .limit(20)
      .toList();

    console.log(`Found ${results.length} results`);

    // Transform Neptune results to SearchResult format
    return results.map((item: any) => ({
      title: item.name || item.alias || "Unknown",
      url: `/apps/${item.alias || item.id}`,
      description:
        item.description || `${item.category || "Item"} - ${item.status}`,
      serviceId: item.alias || item.id,
      source: "neptune",
    }));
  } catch (error) {
    console.error("Neptune search error:", error);
    return [];
  } finally {
    // Always close the connection
    connection.close();
  }
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    const url = new URL(request.url);
    const query = url.searchParams.get("query");

    if (!query || !query.trim()) {
      return NextResponse.json(
        { error: "Query parameter is required" },
        { status: 400 }
      );
    }

    console.log("GET /api/search - Searching for:", query.trim());

    const neptuneResults = await searchNeptune(query.trim());

    const searchResponse: SearchResponse = {
      query: query.trim(),
      totalResults: neptuneResults.length,
      results: neptuneResults,
      executionTime: (Date.now() - startTime) / 1000,
    };

    return NextResponse.json(searchResponse);
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const { query } = body;

    if (!query || !query.trim()) {
      return NextResponse.json(
        { error: "Query parameter is required" },
        { status: 400 }
      );
    }

    console.log("POST /api/search - Searching for:", query.trim());

    const neptuneResults = await searchNeptune(query.trim());

    const searchResponse: SearchResponse = {
      query: query.trim(),
      totalResults: neptuneResults.length,
      results: neptuneResults,
      executionTime: (Date.now() - startTime) / 1000,
    };

    return NextResponse.json(searchResponse);
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
