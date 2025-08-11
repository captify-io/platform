import { NextRequest, NextResponse } from "next/server";

interface SearchResult {
  title: string;
  url: string;
  description: string;
  serviceId: string;
  source: string;
  id: string;
}

interface SearchResultItem {
  title: string;
  url: string;
  description: string;
  serviceId: string;
  topServiceFeatures: string[];
  source: "aws" | "neptune";
}

interface SearchResultSection {
  sectionTitle: string;
  provider: string;
  totalCount: number;
  results: SearchResultItem[];
}

interface UnifiedSearchResponse {
  query: string;
  totalResults: number;
  sections: SearchResultSection[];
  suggestions: string[];
  executionTime: number;
}

// Lambda response interface
interface LambdaSearchResponse {
  query: string;
  totalResults: number;
  results: SearchResult[];
  executionTime: number;
}

// Call Neptune search via Lambda function (runs inside VPC)
async function searchNeptuneViaLambda(
  query: string,
  limit: number = 20
): Promise<SearchResult[]> {
  // Prefer custom domain URL, fallback to API Gateway URL
  const apiUrl = process.env.CUSTOM_DOMAIN_URL || process.env.API_GATEWAY_URL;

  if (!apiUrl) {
    console.error(
      "Either CUSTOM_DOMAIN_URL or API_GATEWAY_URL environment variable is required"
    );
    return [];
  }

  try {
    const url = `${apiUrl}/graph/search`;
    const requestBody = {
      query: query,
      limit: limit,
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      console.error(
        `Lambda request failed: ${response.status} ${response.statusText}`
      );
      const errorText = await response.text();
      console.error("Lambda error response:", errorText);
      return [];
    }

    const data: LambdaSearchResponse = await response.json();

    return data.results || [];
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error("Lambda search error:", {
      message: err.message,
      name: err.name,
      stack: err.stack,
      query: query,
    });

    return [];
  }
}

// Transform Neptune results to unified search format
function transformToUnifiedResponse(
  query: string,
  neptuneResults: SearchResult[],
  executionTime: number
): UnifiedSearchResponse {
  const searchItems: SearchResultItem[] = neptuneResults.map((result) => ({
    title: result.title,
    url: result.url,
    description: result.description,
    serviceId: result.serviceId,
    topServiceFeatures: [], // Neptune doesn't provide features, could be enhanced later
    source: "neptune" as const,
  }));

  const sections: SearchResultSection[] = [];

  if (searchItems.length > 0) {
    sections.push({
      sectionTitle: "Neptune Database Results",
      provider: "Amazon Neptune",
      totalCount: searchItems.length,
      results: searchItems,
    });
  }

  return {
    query,
    totalResults: neptuneResults.length,
    sections,
    suggestions: [], // Could add query suggestions later
    executionTime,
  };
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    const url = new URL(request.url);
    const query = url.searchParams.get("query");
    const limit = parseInt(url.searchParams.get("limit") || "20");

    if (!query || !query.trim()) {
      return NextResponse.json(
        { error: "Query parameter is required" },
        { status: 400 }
      );
    }

    // Search Neptune via Lambda function (runs inside VPC)
    const neptuneResults = await searchNeptuneViaLambda(query.trim(), limit);
    const executionTime = (Date.now() - startTime) / 1000;

    // Transform to unified search response format
    const searchResponse = transformToUnifiedResponse(
      query.trim(),
      neptuneResults,
      executionTime
    );

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
    const { query, limit = 20 } = body;

    if (!query || !query.trim()) {
      return NextResponse.json(
        { error: "Query parameter is required" },
        { status: 400 }
      );
    }

    // Search Neptune via Lambda function (runs inside VPC)
    const neptuneResults = await searchNeptuneViaLambda(query.trim(), limit);
    const executionTime = (Date.now() - startTime) / 1000;

    // Transform to unified search response format
    const searchResponse = transformToUnifiedResponse(
      query.trim(),
      neptuneResults,
      executionTime
    );

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
