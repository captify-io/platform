import React, { useEffect, useState } from "react";
import { DynamicIcon } from "@captify/client";
import { CaptifyClient } from "@captify/client";
import { Pick, PickWithGameAndTeams } from "../types";

interface RecentPicksListProps {
  userId?: string;
  maxItems?: number;
  showHeader?: boolean;
  session?: any; // NextAuth session
}

export const RecentPicksList: React.FC<RecentPicksListProps> = ({
  userId,
  maxItems = 5,
  showHeader = true,
  session,
}) => {
  const [picks, setPicks] = useState<PickWithGameAndTeams[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecentPicks = async () => {
      try {
        setLoading(true);
        const client = new CaptifyClient({
          appId: "veripicks",
          session,
        });

        const response = await client.get({
          table: "veripicks-picks",
          params: {
            userId: userId || "system",
            limit: maxItems,
            sortBy: "createdAt",
            order: "desc",
          },
        });

        if (!response.success) {
          throw new Error(response.error || "Failed to fetch picks");
        }

        setPicks(response.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchRecentPicks();
  }, [userId, maxItems, session]);

  if (loading) {
    return (
      <div className="space-y-4">
        {showHeader && (
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 text-primary">🎯</div>
            <h3 className="text-lg font-semibold">Recent Picks</h3>
          </div>
        )}
        <div className="text-center text-muted-foreground">
          Loading picks...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        {showHeader && (
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 text-primary">🎯</div>
            <h3 className="text-lg font-semibold">Recent Picks</h3>
          </div>
        )}
        <div className="text-center text-red-600">Error: {error}</div>
      </div>
    );
  }

  const displayPicks = picks.slice(0, maxItems);

  const getOutcomeColor = (outcome: string) => {
    switch (outcome) {
      case "win":
        return "text-green-600 bg-green-50 border-green-200";
      case "loss":
        return "text-red-600 bg-red-50 border-red-200";
      case "push":
        return "text-blue-600 bg-blue-50 border-blue-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case "high":
      case "max":
        return "text-green-700 bg-green-100";
      case "medium":
        return "text-yellow-700 bg-yellow-100";
      default:
        return "text-gray-700 bg-gray-100";
    }
  };

  return (
    <div className="space-y-4">
      {showHeader && (
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 text-primary">🎯</div>
          <h3 className="text-lg font-semibold">Recent Picks</h3>
        </div>
      )}

      <div className="space-y-3">
        {displayPicks.map((pick) => (
          <div key={pick.pickId} className="border rounded-lg p-4 bg-card">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="font-medium text-sm">
                  {pick.game
                    ? `${pick.game.awayTeam.name} @ ${pick.game.homeTeam.name}`
                    : "Game Details Loading..."}
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <div className="h-3 w-3">📅</div>
                  {new Date(pick.createdAt).toLocaleDateString()}
                </div>
              </div>
              <div
                className={`px-2 py-1 rounded-full text-xs font-medium border ${getOutcomeColor(
                  pick.outcome || pick.result || "pending"
                )}`}
              >
                {pick.outcome || pick.result || "pending"}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{pick.type}:</span>
                <span className="text-sm">{pick.recommendation}</span>
                <div
                  className={`px-2 py-1 rounded text-xs ${getConfidenceColor(
                    pick.confidence || "medium"
                  )}`}
                >
                  {pick.confidence || "medium"}
                </div>
              </div>

              {pick.profit !== undefined && (
                <div
                  className={`text-sm font-medium ${
                    pick.profit >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {pick.profit >= 0 ? "+" : ""}${pick.profit.toFixed(2)}
                </div>
              )}
            </div>

            {pick.reasoning && (
              <div className="mt-2 text-xs text-muted-foreground">
                {pick.reasoning}
              </div>
            )}
          </div>
        ))}

        {displayPicks.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <div className="h-8 w-8 mx-auto mb-2 opacity-50">🎯</div>
            <p>No recent picks available</p>
          </div>
        )}
      </div>
    </div>
  );
};
