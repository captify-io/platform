"use client";

import { useState, useCallback } from "react";
import { createApiClient } from "../lib/api/utils";

interface SearchResult {
  id: string;
  title: string;
  description?: string;
  type: string;
  url: string;
}

interface UseUnifiedSearchReturn {
  results: SearchResult[];
  isLoading: boolean;
  error: string | null;
  search: (query: string) => void;
  clearResults: () => void;
}

export function useUnifiedSearch(): UseUnifiedSearchReturn {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const client = createApiClient();

      // Search across multiple tables for unified results
      const searchResponse = await client.get({
        table: "captify-search-index", // Assuming a search index table
        params: {
          query: query.trim(),
          limit: 50,
        },
      });

      if (searchResponse.success && searchResponse.data) {
        // Transform the response data to match SearchResult interface
        const searchResults: SearchResult[] = (
          searchResponse.data.items || []
        ).map((item: any) => ({
          id: item.id || item.pk,
          title: item.title || item.name || "Untitled",
          description: item.description || item.summary,
          type: item.type || item.category || "item",
          url: item.url || item.href || `#${item.id}`,
        }));

        setResults(searchResults);
      } else {
        setResults([]);
        if (searchResponse.error) {
          setError(searchResponse.error);
        }
      }
      setIsLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
      setResults([]);
      setIsLoading(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  return {
    results,
    isLoading,
    error,
    search,
    clearResults,
  };
}
