"use client";

import React, { useEffect, useState } from "react";
import { useCaptify } from "@captify/core/components";
import { apiClient } from "@captify/core/lib";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@captify/core/components/ui";

export function IntelligencePage() {
  const { session } = useCaptify();
  const [insights, setInsights] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [query, setQuery] = useState("");
  const [queryResult, setQueryResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadIntelligenceData();
  }, []);

  const loadIntelligenceData = async () => {
    try {
      // Load insights
      const insightsResponse = await apiClient.run({
        service: "intelligence",
        operation: "getInsights",
        data: {},
      });
      setInsights(insightsResponse.data || []);

      // Load predictions
      const predictionsResponse = await apiClient.run({
        service: "intelligence",
        operation: "generatePredictions",
        data: { horizon: 90 },
      });
      setPredictions(predictionsResponse.data || []);

      // Load recommendations
      const recommendationsResponse = await apiClient.run({
        service: "intelligence",
        operation: "getRecommendations",
        data: {},
      });
      setRecommendations(recommendationsResponse.data || []);
    } catch (error) {
      console.error("Failed to load intelligence data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuery = async () => {
    if (!query.trim()) return;

    try {
      const response = await apiClient.run({
        service: "intelligence",
        operation: "processQuery",
        data: { query },
      });
      setQueryResult(response.data);
    } catch (error) {
      console.error("Failed to process query:", error);
    }
  };

  const getInsightTypeColor = (type: string) => {
    switch (type) {
      case "positive":
        return "text-green-600";
      case "warning":
        return "text-yellow-600";
      case "negative":
        return "text-red-600";
      default:
        return "text-blue-600";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "border-red-500 bg-red-50";
      case "high":
        return "border-orange-500 bg-orange-50";
      case "medium":
        return "border-yellow-500 bg-yellow-50";
      default:
        return "border-blue-500 bg-blue-50";
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">AI Intelligence</h1>

      {/* AI Query Interface */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Ask the AI</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask about your business performance, risks, or opportunities..."
              className="flex-1 px-3 py-2 border rounded-md"
              onKeyPress={(e) => e.key === "Enter" && handleQuery()}
            />
            <button
              onClick={handleQuery}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Ask
            </button>
          </div>
          {queryResult && (
            <div className="mt-4 p-4 bg-gray-50 rounded-md">
              <p className="font-medium">Answer:</p>
              <p>{queryResult.response}</p>
              <p className="text-sm text-muted-foreground mt-2">
                Confidence: {Math.round((queryResult.confidence || 0) * 100)}%
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Key Insights */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Latest Insights</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading insights...</p>
          ) : insights.length > 0 ? (
            <div className="space-y-4">
              {insights.map((insight: any) => (
                <div
                  key={insight.id}
                  className="border-l-4 border-blue-500 pl-4"
                >
                  <div className="flex justify-between items-start">
                    <h3
                      className={`font-semibold ${getInsightTypeColor(
                        insight.type
                      )}`}
                    >
                      {insight.title}
                    </h3>
                    <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                      {insight.category}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {insight.description}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Confidence: {Math.round((insight.confidence || 0) * 100)}% •
                    Impact: {insight.impact}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p>No insights available</p>
          )}
        </CardContent>
      </Card>

      {/* Predictions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Predictions</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>Loading predictions...</p>
            ) : predictions.length > 0 ? (
              <div className="space-y-4">
                {predictions.map((prediction: any) => (
                  <div key={prediction.id} className="p-3 border rounded-lg">
                    <h4 className="font-medium">{prediction.metric}</h4>
                    <div className="flex justify-between mt-2">
                      <span className="text-sm">Current:</span>
                      <span className="font-medium">
                        {typeof prediction.currentValue === "number"
                          ? prediction.currentValue.toLocaleString()
                          : prediction.currentValue}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Predicted:</span>
                      <span className="font-medium text-blue-600">
                        {typeof prediction.predictedValue === "number"
                          ? prediction.predictedValue.toLocaleString()
                          : prediction.predictedValue}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {Math.round((prediction.confidence || 0) * 100)}%
                      confidence • {prediction.horizon} days
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p>No predictions available</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>Loading recommendations...</p>
            ) : recommendations.length > 0 ? (
              <div className="space-y-4">
                {recommendations.map((rec: any) => (
                  <div
                    key={rec.id}
                    className={`p-3 border-l-4 rounded ${getPriorityColor(
                      rec.priority
                    )}`}
                  >
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium">{rec.title}</h4>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          rec.priority === "critical"
                            ? "bg-red-200 text-red-800"
                            : rec.priority === "high"
                            ? "bg-orange-200 text-orange-800"
                            : rec.priority === "medium"
                            ? "bg-yellow-200 text-yellow-800"
                            : "bg-blue-200 text-blue-800"
                        }`}
                      >
                        {rec.priority}
                      </span>
                    </div>
                    <p className="text-sm mt-1">{rec.description}</p>
                    <p className="text-sm font-medium mt-2">
                      Action: {rec.action}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Impact: {rec.impact} • Effort: {rec.effort}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p>No recommendations available</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// CRITICAL: Must have default export for dynamic imports
export default IntelligencePage;
