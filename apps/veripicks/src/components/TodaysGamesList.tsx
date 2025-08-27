import React, { useEffect, useState } from "react";
import { CaptifyClient } from "@captify/client";
import { GameWithTeamsAndPicks } from "../types";

interface TodaysGamesListProps {
  maxItems?: number;
  showHeader?: boolean;
  session?: any; // NextAuth session
}

export const TodaysGamesList: React.FC<TodaysGamesListProps> = ({
  maxItems = 5,
  showHeader = true,
  session,
}) => {
  const [games, setGames] = useState<GameWithTeamsAndPicks[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create CaptifyClient with session
  const client = new CaptifyClient({
    session,
  });

  useEffect(() => {
    const fetchTodaysGames = async () => {
      try {
        setLoading(true);
        const today = new Date().toISOString().split("T")[0];
        const response = await client.get({
          table: "veripicks-games",
          params: { date: today },
        });

        if (!response.success) {
          throw new Error(response.error || "Failed to fetch games");
        }

        setGames(response.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchTodaysGames();
  }, [client]);

  if (loading) {
    return (
      <div className="space-y-4">
        {showHeader && (
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 text-primary">🏟️</div>
            <h3 className="text-lg font-semibold">Today's Games</h3>
          </div>
        )}
        <div className="text-center text-muted-foreground">
          Loading games...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        {showHeader && (
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 text-primary">🏟️</div>
            <h3 className="text-lg font-semibold">Today's Games</h3>
          </div>
        )}
        <div className="text-center text-red-600">Error: {error}</div>
      </div>
    );
  }

  const displayGames = games.slice(0, maxItems);

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatOdds = (odds: number) => {
    return odds > 0 ? `+${odds}` : `${odds}`;
  };

  const getConfidenceColor = (confidence?: string) => {
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
          <div className="h-5 w-5 text-primary">🏟️</div>
          <h3 className="text-lg font-semibold">Today's Games</h3>
        </div>
      )}

      <div className="space-y-3">
        {displayGames.map((game) => (
          <div key={game.gameId} className="border rounded-lg p-4 bg-card">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="font-semibold text-base mb-1">
                  {game.awayTeam.name} @ {game.homeTeam.name}
                </div>
                <div className="text-sm text-muted-foreground flex items-center gap-3">
                  <span>{game.league}</span>
                  <span>•</span>
                  <span>{formatTime(game.scheduledTime)}</span>
                  <span>•</span>
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      game.status === "live"
                        ? "bg-red-100 text-red-800"
                        : game.status === "completed"
                        ? "bg-gray-100 text-gray-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {game.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Odds Display */}
            <div className="grid grid-cols-3 gap-4 mb-3 text-sm">
              {game.currentOdds?.moneyline && (
                <div className="text-center">
                  <div className="text-xs text-muted-foreground mb-1">
                    Moneyline
                  </div>
                  <div className="space-y-1">
                    <div>
                      {game.awayTeam.abbreviation}:{" "}
                      {formatOdds(game.currentOdds!.moneyline.away.odds)}
                    </div>
                    <div>
                      {game.homeTeam.abbreviation}:{" "}
                      {formatOdds(game.currentOdds!.moneyline.home.odds)}
                    </div>
                  </div>
                </div>
              )}

              {game.currentOdds?.spread && (
                <div className="text-center">
                  <div className="text-xs text-muted-foreground mb-1">
                    Spread
                  </div>
                  <div className="space-y-1">
                    <div>
                      {game.awayTeam.abbreviation}:{" "}
                      {game.currentOdds!.spread.line > 0 ? "+" : ""}
                      {game.currentOdds!.spread.line}
                    </div>
                    <div>
                      {game.homeTeam.abbreviation}:{" "}
                      {game.currentOdds!.spread.line > 0 ? "-" : "+"}
                      {Math.abs(game.currentOdds!.spread.line)}
                    </div>
                  </div>
                </div>
              )}

              {game.currentOdds?.total && (
                <div className="text-center">
                  <div className="text-xs text-muted-foreground mb-1">
                    Total
                  </div>
                  <div className="space-y-1">
                    <div>O {game.currentOdds!.total.line}</div>
                    <div>U {game.currentOdds!.total.line}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Our Pick */}
            {game.ourPick && (
              <div className="border-t pt-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4">🎯</div>
                    <span className="text-sm font-medium">
                      Our Pick: {game.ourPick.type} -{" "}
                      {game.ourPick.recommendation}
                    </span>
                    <div
                      className={`px-2 py-1 rounded text-xs ${getConfidenceColor(
                        game.ourPick.confidence
                      )}`}
                    >
                      {game.ourPick.confidence}
                    </div>
                  </div>
                  {game.ourPick.confidenceScore && (
                    <div className="text-sm text-muted-foreground">
                      {game.ourPick.confidenceScore}%
                    </div>
                  )}
                </div>
                {game.ourPick.reasoning && (
                  <div className="text-xs text-muted-foreground mt-2">
                    {game.ourPick.reasoning}
                  </div>
                )}
              </div>
            )}

            {/* Expert Consensus */}
            {game.expertConsensus && (
              <div className="border-t pt-3 mt-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4">👥</div>
                    <span>
                      Expert Consensus:{" "}
                      {game.expertConsensus.agreementPercentage}% agree
                    </span>
                  </div>
                  <div className="text-muted-foreground">
                    {game.expertConsensus.expertCount} experts
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {displayGames.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <div className="h-8 w-8 mx-auto mb-2 opacity-50">🏟️</div>
            <p>No games scheduled for today</p>
          </div>
        )}
      </div>
    </div>
  );
};
