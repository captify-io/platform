"use client";

import { useState } from "react";
import { Search, Filter, Settings } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";

export interface SearchPageProps {
  /**
   * Optional layout wrapper component
   */
  Layout?: React.ComponentType<{
    children: React.ReactNode;
    applicationName?: string;
    showChat?: boolean;
  }>;
  /**
   * Custom title
   */
  title?: string;
  /**
   * Custom description
   */
  description?: string;
  /**
   * Custom placeholder text for search input
   */
  placeholder?: string;
}

export function SearchPage({
  Layout,
  title = "Search",
  description = "Search across all your applications and data",
  placeholder = "Search across applications, data, and more...",
}: SearchPageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    // TODO: Implement actual search functionality

    // Simulate search delay
    setTimeout(() => {
      setIsSearching(false);
    }, 1000);
  };

  const searchContent = (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="space-y-6">
        {/* Search Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-foreground">{title}</h1>
          <p className="text-muted-foreground">{description}</p>
        </div>

        {/* Search Input */}
        <Card>
          <CardContent className="p-6">
            <div className="flex space-x-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder={placeholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="pl-10"
                />
              </div>
              <Button
                onClick={handleSearch}
                disabled={!searchQuery.trim() || isSearching}
                className="min-w-[100px]"
              >
                {isSearching ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  "Search"
                )}
              </Button>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Search Results Placeholder */}
        {searchQuery && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Search Results</h2>

            {isSearching ? (
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    <span className="text-muted-foreground">Searching...</span>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>No Results Found</CardTitle>
                  <CardDescription>
                    No results found for "{searchQuery}". Try adjusting your
                    search terms.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>• Try using different keywords</p>
                    <p>• Check for typos in your search</p>
                    <p>• Use fewer or more general terms</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Quick Actions */}
        {!searchQuery && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Quick Actions</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="text-base">
                    Search Applications
                  </CardTitle>
                  <CardDescription>
                    Find and access your applications
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="text-base">Search Data</CardTitle>
                  <CardDescription>
                    Find data across all sources
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="text-base">Search Files</CardTitle>
                  <CardDescription>
                    Find uploaded files and documents
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (Layout) {
    return (
      <Layout applicationName={title} showChat={false}>
        {searchContent}
      </Layout>
    );
  }

  return searchContent;
}
