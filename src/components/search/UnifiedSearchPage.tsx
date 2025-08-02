"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DynamicIcon } from "lucide-react/dynamic";
import { UnifiedSearchInput } from "@/components/search/UnifiedSearchInput";
import type { SearchResultItem } from "@/hooks/useUnifiedSearch";

export function UnifiedSearchPage() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedResult, setSelectedResult] = useState<SearchResultItem | null>(
    null
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <DynamicIcon name="search" className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              Unified Search Platform
            </h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Search across AWS services and your applications with intelligent
            context-aware results
          </p>
        </div>

        {/* Search Interface */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DynamicIcon name="command" className="w-5 h-5" />
              Search Command Center
            </CardTitle>
          </CardHeader>
          <CardContent>
            <UnifiedSearchInput />
          </CardContent>
        </Card>

        {/* Selected Result Details */}
        {selectedResult && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DynamicIcon
                  name={selectedResult.source === "aws" ? "cloud" : "database"}
                  className="w-5 h-5"
                />
                Selected: {selectedResult.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-700">{selectedResult.description}</p>

                {selectedResult.topServiceFeatures &&
                  selectedResult.topServiceFeatures.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <DynamicIcon name="star" className="w-4 h-4" />
                        Key Features
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedResult.topServiceFeatures.map(
                          (feature: string, index: number) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                            >
                              {feature}
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  )}

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <DynamicIcon
                      name={
                        selectedResult.source === "aws" ? "cloud" : "database"
                      }
                      className="w-4 h-4"
                    />
                    Source:{" "}
                    {selectedResult.source === "aws"
                      ? "AWS Services"
                      : "Your Applications"}
                  </div>

                  {selectedResult.url && selectedResult.source === "aws" && (
                    <button
                      onClick={() =>
                        window.open(
                          selectedResult.url,
                          "_blank",
                          "noopener,noreferrer"
                        )
                      }
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <DynamicIcon name="external-link" className="w-4 h-4" />
                      Open in AWS Console
                    </button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Help and Info */}
        <div className="grid md:grid-cols-2 gap-6">
          <Alert>
            <DynamicIcon name="info" className="w-4 h-4" />
            <AlertDescription>
              <strong>Search Tips:</strong> Use specific service names (e.g.,
              &quot;S3&quot;, &quot;Lambda&quot;) or describe functionality
              (e.g., &quot;serverless computing&quot;, &quot;object
              storage&quot;) for better results.
            </AlertDescription>
          </Alert>

          <Alert>
            <DynamicIcon name="shield-check" className="w-4 h-4" />
            <AlertDescription>
              <strong>Security:</strong> All searches are authenticated and
              encrypted. Your search history and preferences are securely stored
              in your profile.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  );
}
