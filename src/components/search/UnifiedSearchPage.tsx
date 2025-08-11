/**
 * Unified Search Page Component
 *
 * Provides a unified search interface across all applications.
 */

"use client";

import React, { useState } from "react";
import { Search, Loader2 } from "lucide-react";

interface SearchResult {
  id: string;
  title: string;
  description?: string;
  type: string;
}

export function UnifiedSearchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    try {
      // TODO: Implement actual search API call
      // const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      // const data = await response.json();
      // setResults(data.results || []);

      // Mock search results for now
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setResults([
        {
          id: "1",
          title: `Search result for "${query}"`,
          description: "This is a mock search result",
          type: "document",
        },
      ]);
    } catch (error) {
      console.error("Search error:", error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(searchQuery);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Unified Search
        </h1>
        <p className="text-gray-600">
          Search across all applications and data sources
        </p>
      </div>

      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for documents, data, applications..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {isSearching && (
            <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 animate-spin" />
          )}
        </div>
      </form>

      {results.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Search Results ({results.length})
          </h2>
          <div className="space-y-3">
            {results.map((result) => (
              <div
                key={result.id}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <h3 className="text-lg font-medium text-blue-600 hover:text-blue-800">
                  {result.title}
                </h3>
                <p className="text-gray-600 mt-1">{result.description}</p>
                <span className="inline-block mt-2 px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded">
                  {result.type}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {searchQuery && !isSearching && results.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">
            No results found for &quot;{searchQuery}&quot;
          </p>
        </div>
      )}
    </div>
  );
}
