"use client";

import React, { useState, useRef, useEffect } from "react";
import { Search, X, Loader2 } from "lucide-react";
import { useUnifiedSearch } from "@/hooks/useUnifiedSearch";
import { useDebounce } from "@/hooks/useDebounce";
import { SearchResults } from "./SearchResults";

interface UnifiedSearchInputProps {
  placeholder?: string;
  className?: string;
  onResultSelect?: (result: SearchResult) => void;
}

interface SearchResult {
  title: string;
  url: string;
  source: string;
  description?: string;
}

export const UnifiedSearchInput: React.FC<UnifiedSearchInputProps> = ({
  placeholder = "Search AWS services and applications...",
  className = "",
  onResultSelect,
}) => {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const { results, isLoading, error, search, clearResults } =
    useUnifiedSearch();
  const debouncedQuery = useDebounce(query, 300);
  const searchRef = useRef<HTMLDivElement>(null);

  // Perform search when debounced query changes
  useEffect(() => {
    if (debouncedQuery.trim()) {
      search(debouncedQuery);
      setIsOpen(true);
    } else {
      clearResults();
      setIsOpen(false);
    }
  }, [debouncedQuery, search, clearResults]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleClear = () => {
    setQuery("");
    clearResults();
    setIsOpen(false);
  };

  const handleResultClick = (result: SearchResult) => {
    setIsOpen(false);
    if (onResultSelect) {
      onResultSelect(result);
    } else {
      // Default behavior: navigate to the result URL
      if (result.source === "aws") {
        window.open(`https://console.aws.amazon.com${result.url}`, "_blank");
      } else {
        // Handle internal application navigation
        window.location.href = result.url;
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div ref={searchRef} className={`relative w-full max-w-2xl ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {isLoading ? (
            <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
          ) : (
            <Search className="h-5 w-5 text-gray-400" />
          )}
        </div>

        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg 
                   focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                   bg-white shadow-sm text-sm
                   placeholder-gray-500"
          autoComplete="off"
        />

        {query && (
          <button
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-600"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-hidden">
          {error ? (
            <div className="p-4 text-red-600 text-sm">
              <p>Search failed: {error}</p>
            </div>
          ) : results ? (
            <SearchResults
              results={results}
              onResultClick={handleResultClick}
              query={query}
            />
          ) : isLoading ? (
            <div className="p-4 text-center text-gray-500">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
              <p className="text-sm">Searching...</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};
