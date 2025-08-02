"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Star, Clock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface SearchResult {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  color: string;
  href: string;
  isRecent?: boolean;
  isFavorite?: boolean;
}

interface GlobalSearchProps {
  onClose: () => void;
  onSelect: (result: SearchResult) => void;
}

// Mock search results based on AWS console
const searchResults: SearchResult[] = [
  // Recently Visited
  {
    id: "neptune",
    name: "Neptune",
    description: "Fast, reliable graph database built for the cloud",
    category: "Recently visited",
    icon: "🔵",
    color: "bg-blue-500",
    href: "/console/neptune",
    isRecent: true,
  },
  {
    id: "lambda",
    name: "Lambda",
    description: "Run code without thinking about servers",
    category: "Recently visited",
    icon: "⚡",
    color: "bg-orange-500",
    href: "/console/lambda",
    isRecent: true,
    isFavorite: true,
  },
  {
    id: "bedrock",
    name: "Amazon Bedrock",
    description:
      "The easiest way to build and scale generative AI applications with foundation models",
    category: "Recently visited",
    icon: "🤖",
    color: "bg-green-500",
    href: "/console/bedrock",
    isRecent: true,
    isFavorite: true,
  },

  // AWS Services
  {
    id: "cognito",
    name: "Cognito",
    description:
      "Consumer Identity Management and AWS Credentials for Federated Identities",
    category: "AWS Services",
    icon: "🔐",
    color: "bg-red-600",
    href: "/console/cognito",
    isFavorite: true,
  },
  {
    id: "api-gateway",
    name: "API Gateway",
    description: "Build, Deploy and Manage APIs",
    category: "AWS Services",
    icon: "🚪",
    color: "bg-purple-500",
    href: "/console/api-gateway",
    isFavorite: true,
  },
  {
    id: "s3",
    name: "S3",
    description: "Scalable Storage in the Cloud",
    category: "AWS Services",
    icon: "🪣",
    color: "bg-green-600",
    href: "/console/s3",
  },
  {
    id: "cloudwatch",
    name: "CloudWatch",
    description: "Monitoring and Observability Service",
    category: "AWS Services",
    icon: "📊",
    color: "bg-red-500",
    href: "/console/cloudwatch",
    isFavorite: true,
  },

  // Agentic Applications
  {
    id: "strategic-planning",
    name: "Strategic Planning Assistant",
    description: "AI-powered strategic planning and analysis",
    category: "Agentic Applications",
    icon: "🎯",
    color: "bg-blue-600",
    href: "/console/apps/strategic-planning",
  },
  {
    id: "market-research",
    name: "Market Research Analyzer",
    description: "Comprehensive market analysis and insights",
    category: "Agentic Applications",
    icon: "📊",
    color: "bg-purple-600",
    href: "/console/apps/market-research",
  },
  {
    id: "decision-hub",
    name: "Decision Intelligence Hub",
    description: "Context-driven decision making platform",
    category: "Agentic Applications",
    icon: "🧠",
    color: "bg-indigo-600",
    href: "/console/apps/decision-hub",
  },
];

export function GlobalSearch({ onClose, onSelect }: GlobalSearchProps) {
  const [query, setQuery] = useState("");
  const [filteredResults, setFilteredResults] = useState(searchResults);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus input when modal opens
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    // Filter results based on query
    if (query.trim() === "") {
      setFilteredResults(searchResults);
    } else {
      const filtered = searchResults.filter(
        (result) =>
          result.name.toLowerCase().includes(query.toLowerCase()) ||
          result.description.toLowerCase().includes(query.toLowerCase()) ||
          result.category.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredResults(filtered);
    }
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        Math.min(prev + 1, filteredResults.length - 1)
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && filteredResults[selectedIndex]) {
      e.preventDefault();
      onSelect(filteredResults[selectedIndex]);
    }
  };

  // Group results by category
  const groupedResults = filteredResults.reduce((acc, result) => {
    if (!acc[result.category]) {
      acc[result.category] = [];
    }
    acc[result.category].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center pt-20">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[600px] overflow-hidden">
        {/* Search Header */}
        <div className="flex items-center p-4 border-b border-gray-200">
          <Search className="h-5 w-5 text-gray-400 mr-3" />
          <Input
            ref={inputRef}
            type="text"
            placeholder="Search services, applications, and resources"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 border-0 focus:ring-0 text-base"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="ml-2 p-1"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Search Results */}
        <div className="overflow-y-auto max-h-[500px]">
          {Object.entries(groupedResults).map(([category, results]) => (
            <div key={category} className="p-2">
              <div className="flex items-center justify-between px-2 py-1 mb-2">
                <h3 className="text-sm font-medium text-gray-700">
                  {category}
                </h3>
                <Badge variant="secondary" className="text-xs">
                  {results.length}
                </Badge>
              </div>

              {results.map((result) => {
                const globalIndex = filteredResults.indexOf(result);
                return (
                  <button
                    key={result.id}
                    onClick={() => onSelect(result)}
                    className={`w-full text-left p-3 rounded-lg mx-2 mb-1 transition-colors ${
                      globalIndex === selectedIndex
                        ? "bg-blue-50 border border-blue-200"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-8 h-8 ${result.color} rounded-lg flex items-center justify-center text-white text-sm`}
                      >
                        {result.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium text-gray-900 truncate">
                            {result.name}
                          </h4>
                          <div className="flex items-center space-x-1">
                            {result.isFavorite && (
                              <Star className="h-3 w-3 text-yellow-500 fill-current" />
                            )}
                            {result.isRecent && (
                              <Clock className="h-3 w-3 text-gray-400" />
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-gray-500 truncate">
                          {result.description}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ))}

          {filteredResults.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <Search className="h-8 w-8 mx-auto mb-3 text-gray-300" />
              <p>No results found for &quot;{query}&quot;</p>
              <p className="text-sm mt-1">
                Try searching for services, applications, or resources
              </p>
            </div>
          )}
        </div>

        {/* Search Footer */}
        <div className="border-t border-gray-200 px-4 py-3 bg-gray-50">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center space-x-4">
              <span className="flex items-center">
                <kbd className="bg-gray-200 px-1.5 py-0.5 rounded mr-1">↑↓</kbd>
                to navigate
              </span>
              <span className="flex items-center">
                <kbd className="bg-gray-200 px-1.5 py-0.5 rounded mr-1">
                  Enter
                </kbd>
                to select
              </span>
              <span className="flex items-center">
                <kbd className="bg-gray-200 px-1.5 py-0.5 rounded mr-1">
                  Esc
                </kbd>
                to close
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
