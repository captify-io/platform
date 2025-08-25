/**
 * User Stats Card Component
 *
 * Displays user performance statistics
 */

import React, { useEffect, useState } from "react";
import { DynamicIcon } from "@captify/core";
import { useCaptifyClient } from "../hooks";
import { UserStats } from "../types";

interface UserStatsCardProps {
  userId?: string;
  period?: string;
  showDetailedStats?: boolean;
  session?: any; // NextAuth session
}

export const UserStatsCard: React.FC<UserStatsCardProps> = ({
  userId,
  period = "Current Period",
  showDetailedStats = false,
  session,
}) => {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const client = useCaptifyClient(session);

  useEffect(() => {
    const fetchUserStats = async () => {
      if (!userId) return;

      try {
        setLoading(true);
        const response = await client.get({
          table: "veripicks-user-analytics",
          key: { userId, timeframe: period },
        });

        if (!response.success) {
          throw new Error(response.error || "Failed to fetch user stats");
        }

        setStats(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchUserStats();
  }, [userId, period, client]);

  if (loading) {
    return (
      <div className="bg-card rounded-lg border p-6">
        <div className="text-center text-muted-foreground">
          Loading stats...
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="bg-card rounded-lg border p-6">
        <div className="text-center text-red-600">
          {error || "No stats available"}
        </div>
      </div>
    );
  }
  const getProfitColor = (profit: number) => {
    return profit >= 0 ? "text-green-600" : "text-red-600";
  };

  const getROIColor = (roi: number) => {
    if (roi >= 10) return "text-green-600";
    if (roi >= 0) return "text-blue-600";
    return "text-red-600";
  };

  const getStreakIcon = (streak: number) => {
    if (streak > 0)
      return (
        <DynamicIcon name="trending-up" className="h-4 w-4 text-green-600" />
      );
    if (streak < 0)
      return (
        <DynamicIcon name="trending-down" className="h-4 w-4 text-red-600" />
      );
    return <DynamicIcon name="target" className="h-4 w-4 text-gray-600" />;
  };

  return (
    <div className="bg-card rounded-lg border p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Performance Stats</h3>
        <div className="text-sm text-muted-foreground flex items-center gap-1">
          <DynamicIcon name="calendar" className="h-4 w-4" />
          {period}
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold">{stats.totalPicks}</div>
          <div className="text-sm text-muted-foreground">Total Picks</div>
        </div>

        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {stats.winRate.toFixed(1)}%
          </div>
          <div className="text-sm text-muted-foreground">Win Rate</div>
        </div>

        <div className="text-center">
          <div
            className={`text-2xl font-bold ${getProfitColor(
              stats.totalProfit
            )}`}
          >
            ${stats.totalProfit >= 0 ? "+" : ""}
            {stats.totalProfit.toFixed(2)}
          </div>
          <div className="text-sm text-muted-foreground">Total Profit</div>
        </div>

        <div className="text-center">
          <div className={`text-2xl font-bold ${getROIColor(stats.roi)}`}>
            {stats.roi >= 0 ? "+" : ""}
            {stats.roi.toFixed(1)}%
          </div>
          <div className="text-sm text-muted-foreground">ROI</div>
        </div>
      </div>

      {/* Detailed Stats */}
      {showDetailedStats && (
        <>
          {/* Win/Loss Breakdown */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-lg font-bold text-green-600">
                {stats.winningPicks}
              </div>
              <div className="text-xs text-green-700">Wins</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-lg font-bold text-red-600">
                {stats.losingPicks}
              </div>
              <div className="text-xs text-red-700">Losses</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-lg font-bold text-blue-600">
                {stats.pushPicks}
              </div>
              <div className="text-xs text-blue-700">Pushes</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-lg font-bold text-gray-600">
                {stats.pendingPicks}
              </div>
              <div className="text-xs text-gray-700">Pending</div>
            </div>
          </div>

          {/* Streaks and Additional Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <div className="text-sm text-muted-foreground">
                  Current Streak
                </div>
                <div className="flex items-center gap-1">
                  {getStreakIcon(stats.currentStreak)}
                  <span className="font-medium">
                    {Math.abs(stats.currentStreak)}{" "}
                    {stats.currentStreak >= 0 ? "W" : "L"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <div className="text-sm text-muted-foreground">
                  Best Win Streak
                </div>
                <div className="flex items-center gap-1">
                  <DynamicIcon
                    name="trending-up"
                    className="h-4 w-4 text-green-600"
                  />
                  <span className="font-medium">{stats.bestWinStreak}W</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <div className="text-sm text-muted-foreground">Avg Odds</div>
                <div className="flex items-center gap-1">
                  <DynamicIcon
                    name="dollar-sign"
                    className="h-4 w-4 text-blue-600"
                  />
                  <span className="font-medium">{stats.avgOdds}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Performance by Type */}
          {stats.performanceByType && stats.performanceByType.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-medium text-muted-foreground mb-3">
                Performance by Bet Type
              </h4>
              <div className="space-y-2">
                {stats.performanceByType.map((typeStats) => (
                  <div
                    key={typeStats.type}
                    className="flex items-center justify-between p-2 bg-muted rounded"
                  >
                    <span className="text-sm font-medium capitalize">
                      {typeStats.type}
                    </span>
                    <div className="flex items-center gap-4 text-sm">
                      <span>{typeStats.picks} picks</span>
                      <span className="text-green-600">
                        {typeStats.winRate.toFixed(1)}%
                      </span>
                      <span className={getProfitColor(typeStats.profit)}>
                        ${typeStats.profit >= 0 ? "+" : ""}
                        {typeStats.profit.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Performance by League */}
          {stats.performanceByLeague &&
            stats.performanceByLeague.length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-medium text-muted-foreground mb-3">
                  Performance by League
                </h4>
                <div className="space-y-2">
                  {stats.performanceByLeague.map((leagueStats) => (
                    <div
                      key={leagueStats.league}
                      className="flex items-center justify-between p-2 bg-muted rounded"
                    >
                      <span className="text-sm font-medium">
                        {leagueStats.league}
                      </span>
                      <div className="flex items-center gap-4 text-sm">
                        <span>{leagueStats.picks} picks</span>
                        <span className="text-green-600">
                          {leagueStats.winRate.toFixed(1)}%
                        </span>
                        <span className={getProfitColor(leagueStats.profit)}>
                          ${leagueStats.profit >= 0 ? "+" : ""}
                          {leagueStats.profit.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
        </>
      )}
    </div>
  );
};
