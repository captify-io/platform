import { useState, useCallback } from "react";
import { api } from "@/lib/api-client";

export interface SearchResultItem {
  title: string;
  url: string;
  description: string;
  serviceId: string;
  topServiceFeatures: string[];
  source: "aws" | "neptune";
}

export interface SearchResultSection {
  sectionTitle: string;
  provider: string;
  totalCount: number;
  results: SearchResultItem[];
}

export interface UnifiedSearchResponse {
  query: string;
  totalResults: number;
  sections: SearchResultSection[];
  suggestions: string[];
  executionTime: number;
}

interface SearchState {
  results: UnifiedSearchResponse | null;
  isLoading: boolean;
  error: string | null;
}

export function useUnifiedSearch() {
  const [searchState, setSearchState] = useState<SearchState>({
    results: null,
    isLoading: false,
    error: null,
  });

  const search = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchState({
        results: null,
        isLoading: false,
        error: null,
      });
      return;
    }

    setSearchState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    try {
      const response = await api.post<UnifiedSearchResponse>("/api/search", {
        query,
        limit: 20,
      });

      if (!response.ok) {
        throw new Error(response.error || `Search failed: ${response.status}`);
      }

      const data = response.data!;

      setSearchState({
        results: data,
        isLoading: false,
        error: null,
      });

      return data;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Search failed";
      setSearchState({
        results: null,
        isLoading: false,
        error: errorMessage,
      });
      throw error;
    }
  }, []);

  const clearResults = useCallback(() => {
    setSearchState({
      results: null,
      isLoading: false,
      error: null,
    });
  }, []);

  return {
    ...searchState,
    search,
    clearResults,
  };
}
