import React, { useEffect, useState } from "react";
import { CaptifyClient } from "@captify/core";
import { UserStats } from "../types";

interface AnalyticsMetrics {
  title: string;
  value: string | number;
  change?: string;
  icon: string;
  color: string;
}

interface AnalyticsDashboardProps {
  userId?: string;
  period?: string;
  session?: any; // NextAuth session
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  userId,
  period = "last_30_days",
  session,
}) => {
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!userId) return;

      try {
        setLoading(true);
        const client = new CaptifyClient({
          appId: "veripicks",
          session,
        });

        const response = await client.get({
          table: "veripicks-user-analytics",
          key: { userId, period },
        });

        if (!response.success) {
          throw new Error(response.error || "Failed to fetch analytics");
        }

        setUserStats(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [userId, period, session]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-card rounded-lg border p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-16"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error || !userStats) {
    return (
      <div className="text-center text-red-600 py-8">
        {error || "No analytics data available"}
      </div>
    );
  }
  const metrics: AnalyticsMetrics[] = [
    {
      title: "Win Rate",
      value: `${userStats.winRate.toFixed(1)}%`,
      change: userStats.winRate > 60 ? "+5.2%" : "-1.8%",
      icon: "🎯",
      color: "text-green-600",
    },
    {
      title: "ROI",
      value: `${userStats.roi.toFixed(1)}%`,
      change: userStats.roi > 0 ? "+2.1%" : "-0.5%",
      icon: "📈",
      color: userStats.roi > 0 ? "text-green-600" : "text-red-600",
    },
    {
      title: "Total Picks",
      value: userStats.totalPicks,
      icon: "📊",
      color: "text-blue-600",
    },
    {
      title: "Current Streak",
      value: userStats.currentStreak,
      change:
        userStats.currentStreak > 0
          ? `+${userStats.currentStreak}`
          : `${userStats.currentStreak}`,
      icon: "🔥",
      color: userStats.currentStreak > 0 ? "text-orange-600" : "text-gray-600",
    },
    {
      title: "Total Profit",
      value: `$${userStats.totalProfit.toLocaleString()}`,
      change: userStats.totalProfit > 0 ? "+$247" : "-$89",
      icon: "💰",
      color: userStats.totalProfit > 0 ? "text-green-600" : "text-red-600",
    },
    {
      title: "Best Streak",
      value: userStats.bestWinStreak,
      icon: "🏆",
      color: "text-yellow-600",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {metrics.map((metric, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {metric.title}
                </p>
                <p className={`text-2xl font-bold ${metric.color}`}>
                  {metric.value}
                </p>
                {metric.change && (
                  <p
                    className={`text-sm ${
                      metric.change.startsWith("+")
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {metric.change} from last {period}
                  </p>
                )}
              </div>
              <div className="text-3xl">{metric.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* League Performance */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            🏈 Performance by League
          </h3>
          <div className="space-y-3">
            {userStats.performanceByLeague.map((league: any, index: number) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded"
              >
                <span className="font-medium">{league.league}</span>
                <div className="text-right">
                  <div className="text-sm text-gray-600">
                    {league.picks} picks
                  </div>
                  <div
                    className={`font-semibold ${
                      league.winRate > 60 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {league.winRate.toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bet Type Performance */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            🎲 Performance by Bet Type
          </h3>
          <div className="space-y-3">
            {userStats.performanceByType.map((type: any, index: number) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded"
              >
                <span className="font-medium">{type.type}</span>
                <div className="text-right">
                  <div className="text-sm text-gray-600">
                    {type.picks} picks
                  </div>
                  <div
                    className={`font-semibold ${
                      type.winRate > 60 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {type.winRate.toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Performance Trend */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          📈 Recent Performance Trend
        </h3>
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">📊</div>
          <p>Performance chart visualization coming soon</p>
          <p className="text-sm">Current period: {period}</p>
        </div>
      </div>
    </div>
  );
};
