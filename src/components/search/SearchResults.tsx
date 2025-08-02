"use client";

import React from "react";
import { ExternalLink, Database, Cloud, Tag } from "lucide-react";
import type {
  UnifiedSearchResponse,
  SearchResultItem as SearchResultItemType,
} from "@/hooks/useUnifiedSearch";

interface SearchResultsProps {
  results: UnifiedSearchResponse;
  onResultClick: (result: SearchResultItemType) => void;
  query: string;
}

const highlightText = (text: string, query: string) => {
  if (!query.trim()) return text;

  const regex = new RegExp(`(${query})`, "gi");
  const parts = text.split(regex);

  return parts.map((part, index) =>
    regex.test(part) ? (
      <mark key={index} className="bg-yellow-200 px-0.5 rounded">
        {part}
      </mark>
    ) : (
      part
    )
  );
};

const SearchResultItem: React.FC<{
  result: SearchResultItemType;
  onClick: () => void;
  query: string;
}> = ({ result, onClick, query }) => {
  const isAWS = result.source === "aws";

  return (
    <button
      onClick={onClick}
      className="w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 
               last:border-b-0 transition-colors duration-150 group"
    >
      <div className="flex items-start space-x-3">
        {/* Icon */}
        <div
          className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
            isAWS ? "bg-orange-100" : "bg-blue-100"
          }`}
        >
          {isAWS ? (
            <Cloud
              className={`w-4 h-4 ${
                isAWS ? "text-orange-600" : "text-blue-600"
              }`}
            />
          ) : (
            <Database className="w-4 h-4 text-blue-600" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-600">
              {highlightText(result.title, query)}
            </h3>
            {isAWS && <ExternalLink className="w-3 h-3 text-gray-400" />}
          </div>

          <p className="text-xs text-gray-600 mt-1 line-clamp-2">
            {highlightText(result.description, query)}
          </p>

          {/* Features/Tags */}
          {result.topServiceFeatures &&
            result.topServiceFeatures.length > 0 && (
              <div className="flex items-center space-x-1 mt-2">
                <Tag className="w-3 h-3 text-gray-400" />
                <div className="flex flex-wrap gap-1">
                  {result.topServiceFeatures
                    .slice(0, 3)
                    .map((feature, index) => (
                      <span
                        key={index}
                        className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full"
                      >
                        {feature}
                      </span>
                    ))}
                </div>
              </div>
            )}
        </div>
      </div>
    </button>
  );
};

export const SearchResults: React.FC<SearchResultsProps> = ({
  results,
  onResultClick,
  query,
}) => {
  if (!results.sections.length) {
    return (
      <div className="p-6 text-center">
        <Database className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <h3 className="text-sm font-medium text-gray-900 mb-1">
          No results found
        </h3>
        <p className="text-xs text-gray-600">
          Try different keywords or check your spelling
        </p>
        {results.suggestions.length > 0 && (
          <div className="mt-3">
            <p className="text-xs text-gray-600 mb-2">Suggestions:</p>
            <div className="space-y-1">
              {results.suggestions.map((suggestion, index) => (
                <p key={index} className="text-xs text-blue-600">
                  {suggestion}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-h-96 overflow-y-auto">
      {/* Search Summary */}
      <div className="p-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-600">
            {results.totalResults} results for &quot;{query}&quot;
          </p>
          <p className="text-xs text-gray-500">
            {results.executionTime.toFixed(3)}s
          </p>
        </div>
      </div>

      {/* Result Sections */}
      {results.sections.map((section, sectionIndex) => (
        <div key={sectionIndex}>
          {/* Section Header */}
          <div className="p-2 bg-gray-50 border-b border-gray-100">
            <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
              {section.sectionTitle} ({section.totalCount})
            </h3>
          </div>

          {/* Section Results */}
          {section.results.map((result, resultIndex) => (
            <SearchResultItem
              key={`${sectionIndex}-${resultIndex}`}
              result={result}
              onClick={() => onResultClick(result)}
              query={query}
            />
          ))}
        </div>
      ))}

      {/* Footer */}
      <div className="p-2 bg-gray-50 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          Press ESC to close • Enter to select
        </p>
      </div>
    </div>
  );
};
