"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, ExternalLink, Loader2 } from "lucide-react";
import { Input } from "../ui/input";
import { CaptifyClient } from "../../api/client";

interface SearchResult {
  title: string;
  description: string;
  url: string;
  source: string;
  serviceId?: string;
  topServiceFeatures?: string[];
}

interface SearchSection {
  provider: string;
  sectionTitle: string;
  totalCount: number;
  results: SearchResult[];
}

interface SearchResults {
  sections: SearchSection[];
  suggestions?: string[];
}

interface GlobalSearchProps {
  onFocus?: () => void;
  className?: string;
}

// Search function using Captify API client
const performSearch = async (query: string): Promise<SearchResults> => {
  if (!query.trim()) return { sections: [] };

  try {
    const client = new CaptifyClient();

    // Search across multiple data sources
    const [servicesResponse, contentResponse] = await Promise.all([
      // Search AWS services
      client.get({
        table: "captify-services",
        params: {
          searchTerm: query.trim(),
          limit: 10,
        },
      }),
      // Search general content/documentation
      client.get({
        table: "captify-content",
        params: {
          searchTerm: query.trim(),
          limit: 10,
        },
      }),
    ]);

    const sections: SearchSection[] = [];

    // Process services results
    if (servicesResponse.success && servicesResponse.data?.items) {
      const serviceResults: SearchResult[] = servicesResponse.data.items.map(
        (item: any) => ({
          title: item.name || item.title,
          description: item.description || item.summary,
          url: item.url || `/console/${item.serviceId}`,
          source: item.provider || "aws",
          serviceId: item.serviceId,
          topServiceFeatures: item.features || [],
        })
      );

      if (serviceResults.length > 0) {
        sections.push({
          provider: "aws",
          sectionTitle: "AWS Services",
          totalCount: serviceResults.length,
          results: serviceResults,
        });
      }
    }

    // Process content results
    if (contentResponse.success && contentResponse.data?.items) {
      const contentResults: SearchResult[] = contentResponse.data.items.map(
        (item: any) => ({
          title: item.title || item.name,
          description: item.description || item.excerpt,
          url: item.url || item.href,
          source: item.source || "content",
        })
      );

      if (contentResults.length > 0) {
        sections.push({
          provider: "content",
          sectionTitle: "Documentation & Guides",
          totalCount: contentResults.length,
          results: contentResults,
        });
      }
    }

    // Generate suggestions based on the query
    const suggestions = [
      `Try searching for "${query} tutorial"`,
      `Learn more about ${query} pricing`,
      `${query} best practices`,
    ];

    return { sections, suggestions };
  } catch (error) {
    console.error("Search error:", error);
    throw new Error("Search failed. Please try again.");
  }
};

export function GlobalSearch({ onFocus, className }: GlobalSearchProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [results, setResults] = useState<SearchResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (searchQuery.trim()) {
        setIsLoading(true);
        setError(null);
        try {
          const searchResults = await performSearch(searchQuery);
          setResults(searchResults);
        } catch (err) {
          setError("Search failed. Please try again.");
          setResults(null);
        } finally {
          setIsLoading(false);
        }
      } else {
        setResults(null);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleSearchFocus = () => {
    setSearchFocused(true);
    onFocus?.();
  };

  const handleSearchBlur = () => {
    // Delay hiding to allow clicking on dropdown items
    setTimeout(() => setSearchFocused(false), 200);
  };

  const handleSearchItemClick = (item: SearchResult) => {
    setSearchFocused(false);
    setSearchQuery("");
    setResults(null);

    // Navigate to the selected item
    if (item.url.startsWith("/")) {
      router.push(item.url);
    } else if (item.url.startsWith("http")) {
      window.open(item.url, "_blank");
    } else {
      // Handle AWS console URLs
      router.push(`/console${item.url}`);
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setSearchFocused(false);
      setSearchQuery("");
      setResults(null);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search for services, applications, and resources"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={handleSearchFocus}
          onBlur={handleSearchBlur}
          onKeyDown={handleSearchKeyDown}
          className="pl-10 pr-20 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
          {isLoading && (
            <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
          )}
          <span className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded border border-gray-700">
            Alt+S
          </span>
        </div>
      </div>

      {/* Search Dropdown */}
      {searchFocused && (searchQuery.trim() || results) && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-lg z-50 max-h-96 overflow-y-auto">
          {error ? (
            <div className="p-4 text-center text-destructive">
              <div className="text-sm font-medium">Search Error</div>
              <div className="text-xs text-muted-foreground mt-1">{error}</div>
            </div>
          ) : results ? (
            <div className="py-2">
              {results.sections.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  <div className="text-sm">No results found</div>
                  <div className="text-xs text-muted-foreground/80 mt-1">
                    Try searching for AWS services like "lambda", "s3", or
                    "cognito"
                  </div>
                </div>
              ) : (
                results.sections.map((section) => (
                  <div key={section.provider} className="mb-2 last:mb-0">
                    <div className="px-3 py-2 text-xs font-medium text-muted-foreground border-b border-border">
                      {section.sectionTitle} ({section.totalCount})
                    </div>
                    <div className="space-y-1">
                      {section.results.map((item, index) => (
                        <div
                          key={`${section.provider}-${item.serviceId}-${index}`}
                          onClick={() => handleSearchItemClick(item)}
                          className="flex items-start space-x-3 p-3 hover:bg-muted cursor-pointer transition-colors"
                        >
                          <div className="flex-shrink-0 mt-1">
                            {item.source === "aws" ? (
                              <div className="w-6 h-6 bg-orange-600 rounded text-white text-xs flex items-center justify-center font-bold">
                                AWS
                              </div>
                            ) : (
                              <div className="w-6 h-6 bg-blue-600 rounded text-white text-xs flex items-center justify-center">
                                <ExternalLink className="h-3 w-3" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-popover-foreground truncate">
                              {item.title}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {item.description}
                            </div>
                            {item.topServiceFeatures &&
                              item.topServiceFeatures.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {item.topServiceFeatures
                                    .slice(0, 3)
                                    .map((feature, idx) => (
                                      <span
                                        key={idx}
                                        className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-muted text-muted-foreground"
                                      >
                                        {feature}
                                      </span>
                                    ))}
                                </div>
                              )}
                          </div>
                          <div className="flex-shrink-0">
                            <ExternalLink className="h-3 w-3 text-muted-foreground" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}

              {results.suggestions && results.suggestions.length > 0 && (
                <div className="border-t border-border pt-2 mt-2">
                  <div className="px-3 py-1 text-xs font-medium text-muted-foreground">
                    Suggestions
                  </div>
                  <div className="px-3 py-2 text-xs text-muted-foreground/80 space-y-1">
                    {results.suggestions.map((suggestion, index) => (
                      <div key={index}>{suggestion}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : searchQuery.trim() && isLoading ? (
            <div className="p-4 text-center text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
              <div className="text-sm">Searching...</div>
            </div>
          ) : searchQuery.trim() ? (
            <div className="p-4 text-center text-muted-foreground">
              <div className="text-sm">Start typing to search</div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
