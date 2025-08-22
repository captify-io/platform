"use client";

import { DynamicIcon } from "lucide-react/dynamic";
import { Loader2, Calendar, RefreshCw, CalendarIcon } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  Game,
  Team,
  PublicBettingSentiment,
  MarketOutcome,
  BookData,
} from "@captify/veripicks";
import { CaptifyClient } from "@captify/core";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@captify/core";
import { Button } from "@captify/core";

// Helper functions
const formatOdds = (odds: number): string => {
  if (odds > 0) return `+${odds}`;
  return odds.toString();
};

const formatPercentage = (percent: number): string => {
  return `${percent}%`;
};

const getBestOdds = (
  game: Game,
  marketType: "moneyline" | "spread" | "total",
  side: string
): MarketOutcome | null => {
  if (!game.markets) return null;

  let bestOdds: MarketOutcome | null = null;
  let bestValue = side === "away" || side === "under" ? -Infinity : Infinity;

  Object.values(game.markets).forEach((book) => {
    const market = book.event[marketType];
    if (market) {
      const outcome = market.find((o) => o.side === side);
      if (outcome) {
        const shouldUpdate =
          side === "away" || side === "under"
            ? outcome.odds > bestValue
            : outcome.odds < bestValue;
        if (shouldUpdate) {
          bestOdds = outcome;
          bestValue = outcome.odds;
        }
      }
    }
  });

  return bestOdds;
};

export default function VeriPicksPage() {
  const { data: session, status } = useSession();
  const [allGames, setAllGames] = useState<Game[]>([]);
  const [filteredGames, setFilteredGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSport, setSelectedSport] = useState("all");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [sportStats, setSportStats] = useState<
    Array<{
      sport: string;
      label: string;
      count: number;
    }>
  >([]);

  const loadAllGames = useCallback(async () => {
    if (!session) return;

    try {
      setLoading(true);

      // Create CaptifyClient with session
      const client = new CaptifyClient({
        appId: "veripicks",
        session: session,
      });

      // Fetch all games for the selected date in a single API call
      // Client-side filtering will handle sport selection
      const result = await client.get({
        table: "captify-veripicks-Game",
        params: {
          FilterExpression: "begins_with(scheduledTime, :date)",
          ExpressionAttributeValues: {
            ":date": selectedDate,
          },
        },
      });

      let allGamesData: Game[] = [];
      if (result.success && result.data) {
        allGamesData = result.data;
        console.log(`Loaded ${allGamesData.length} games for ${selectedDate}`);
      } else {
        console.warn("No games found for selected date:", selectedDate);
      }

      console.log("All Games API Result:", allGamesData);

      if (allGamesData.length > 0) {
        // Sort games by scheduled time
        allGamesData.sort(
          (a, b) =>
            new Date(a.scheduledTime).getTime() -
            new Date(b.scheduledTime).getTime()
        );

        setAllGames(allGamesData);

        // Calculate sport statistics
        const sportCounts = allGamesData.reduce((acc, game) => {
          const sportKey = game.sport;
          acc[sportKey] = (acc[sportKey] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const sportLabels: Record<string, string> = {
          football: "NFL",
          basketball: "NBA",
          baseball: "MLB",
          hockey: "NHL",
          soccer: "MLS",
        };

        const stats = [
          { sport: "all", label: "All", count: allGamesData.length },
          ...Object.entries(sportCounts).map(([sport, count]) => ({
            sport,
            label: sportLabels[sport] || sport.toUpperCase(),
            count,
          })),
        ];

        setSportStats(stats);

        // Set initial filtered games
        setFilteredGames(allGamesData);
      } else {
        // No games found
        setAllGames([]);
        setFilteredGames([]);
        setSportStats([{ sport: "all", label: "All", count: 0 }]);
      }
    } catch (error) {
      console.error("Failed to load games:", error);
      // Set empty state on error
      setAllGames([]);
      setFilteredGames([]);
      setSportStats([{ sport: "all", label: "All", count: 0 }]);
    } finally {
      setLoading(false);
    }
  }, [session, selectedDate]);

  // Filter games when sport selection changes
  useEffect(() => {
    if (selectedSport === "all") {
      setFilteredGames(allGames);
    } else {
      setFilteredGames(allGames.filter((game) => game.sport === selectedSport));
    }
  }, [selectedSport, allGames]);

  useEffect(() => {
    if (status === "authenticated") {
      loadAllGames();
    }
  }, [status, loadAllGames]);

  const getGameTime = (scheduledTime: string) => {
    const date = new Date(scheduledTime);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatSelectedDate = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const isToday = date.toDateString() === today.toDateString();
    const isTomorrow = date.toDateString() === tomorrow.toDateString();

    if (isToday) {
      return "Games for Today";
    } else if (isTomorrow) {
      return "Games for Tomorrow";
    } else {
      return `Games for ${date.toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
      })}`;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      scheduled: "bg-blue-100 text-blue-800",
      live: "bg-green-100 text-green-800",
      completed: "bg-gray-100 text-gray-800",
      postponed: "bg-yellow-100 text-yellow-800",
      cancelled: "bg-red-100 text-red-800",
    };

    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full ${
          statusColors[status as keyof typeof statusColors] ||
          statusColors.scheduled
        }`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const renderPublicBetting = (publicBetting?: PublicBettingSentiment) => {
    if (!publicBetting) return null;

    return (
      <div className="space-y-2">
        {publicBetting.moneyline && (
          <div className="text-xs">
            <div className="font-medium text-gray-600 mb-1">
              Moneyline Public %
            </div>
            <div className="flex justify-between">
              <span>
                Away:{" "}
                {formatPercentage(
                  publicBetting.moneyline.awayTicketsPercent || 0
                )}{" "}
                tickets
              </span>
              <span>
                Home:{" "}
                {formatPercentage(
                  publicBetting.moneyline.homeTicketsPercent || 0
                )}{" "}
                tickets
              </span>
            </div>
            <div className="flex justify-between text-green-600">
              <span>
                Away:{" "}
                {formatPercentage(
                  publicBetting.moneyline.awayMoneyPercent || 0
                )}{" "}
                money
              </span>
              <span>
                Home:{" "}
                {formatPercentage(
                  publicBetting.moneyline.homeMoneyPercent || 0
                )}{" "}
                money
              </span>
            </div>
          </div>
        )}

        {publicBetting.spread && (
          <div className="text-xs">
            <div className="font-medium text-gray-600 mb-1">
              Spread Public %
            </div>
            <div className="flex justify-between">
              <span>
                Away:{" "}
                {formatPercentage(publicBetting.spread.awayTicketsPercent || 0)}{" "}
                tickets
              </span>
              <span>
                Home:{" "}
                {formatPercentage(publicBetting.spread.homeTicketsPercent || 0)}{" "}
                tickets
              </span>
            </div>
            <div className="flex justify-between text-green-600">
              <span>
                Away:{" "}
                {formatPercentage(publicBetting.spread.awayMoneyPercent || 0)}{" "}
                money
              </span>
              <span>
                Home:{" "}
                {formatPercentage(publicBetting.spread.homeMoneyPercent || 0)}{" "}
                money
              </span>
            </div>
          </div>
        )}

        {publicBetting.total && (
          <div className="text-xs">
            <div className="font-medium text-gray-600 mb-1">Total Public %</div>
            <div className="flex justify-between">
              <span>
                Over:{" "}
                {formatPercentage(publicBetting.total.overTicketsPercent || 0)}{" "}
                tickets
              </span>
              <span>
                Under:{" "}
                {formatPercentage(publicBetting.total.underTicketsPercent || 0)}{" "}
                tickets
              </span>
            </div>
            <div className="flex justify-between text-green-600">
              <span>
                Over:{" "}
                {formatPercentage(publicBetting.total.overMoneyPercent || 0)}{" "}
                money
              </span>
              <span>
                Under:{" "}
                {formatPercentage(publicBetting.total.underMoneyPercent || 0)}{" "}
                money
              </span>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderOddsComparison = (game: Game) => {
    if (!game.markets) return null;

    // Get best odds for each market
    const bestMoneylineAway = getBestOdds(game, "moneyline", "away");
    const bestMoneylineHome = getBestOdds(game, "moneyline", "home");
    const bestSpreadAway = getBestOdds(game, "spread", "away");
    const bestSpreadHome = getBestOdds(game, "spread", "home");
    const bestTotalOver = getBestOdds(game, "total", "over");
    const bestTotalUnder = getBestOdds(game, "total", "under");

    return (
      <div className="space-y-3">
        {/* Moneyline */}
        {(bestMoneylineAway || bestMoneylineHome) && (
          <div className="bg-gray-50 p-3 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Moneyline</h4>
            <div className="grid grid-cols-2 gap-4">
              {bestMoneylineAway && (
                <div className="text-center">
                  <div className="font-medium">
                    {game.awayTeam?.abbreviation || "Away"}
                  </div>
                  <div className="text-lg font-bold text-blue-600">
                    {formatOdds(bestMoneylineAway.odds)}
                  </div>
                  {bestMoneylineAway.best_odds && (
                    <div className="text-xs text-green-600 font-medium">
                      Best Odds
                    </div>
                  )}
                </div>
              )}
              {bestMoneylineHome && (
                <div className="text-center">
                  <div className="font-medium">
                    {game.homeTeam?.abbreviation || "Home"}
                  </div>
                  <div className="text-lg font-bold text-blue-600">
                    {formatOdds(bestMoneylineHome.odds)}
                  </div>
                  {bestMoneylineHome.best_odds && (
                    <div className="text-xs text-green-600 font-medium">
                      Best Odds
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Spread */}
        {(bestSpreadAway || bestSpreadHome) && (
          <div className="bg-gray-50 p-3 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Spread</h4>
            <div className="grid grid-cols-2 gap-4">
              {bestSpreadAway && (
                <div className="text-center">
                  <div className="font-medium">
                    {game.awayTeam?.abbreviation || "Away"}
                  </div>
                  <div className="text-sm">{bestSpreadAway.value}</div>
                  <div className="text-lg font-bold text-blue-600">
                    {formatOdds(bestSpreadAway.odds)}
                  </div>
                  {bestSpreadAway.best_odds && (
                    <div className="text-xs text-green-600 font-medium">
                      Best Odds
                    </div>
                  )}
                </div>
              )}
              {bestSpreadHome && (
                <div className="text-center">
                  <div className="font-medium">
                    {game.homeTeam?.abbreviation || "Home"}
                  </div>
                  <div className="text-sm">{bestSpreadHome.value}</div>
                  <div className="text-lg font-bold text-blue-600">
                    {formatOdds(bestSpreadHome.odds)}
                  </div>
                  {bestSpreadHome.best_odds && (
                    <div className="text-xs text-green-600 font-medium">
                      Best Odds
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Total */}
        {(bestTotalOver || bestTotalUnder) && (
          <div className="bg-gray-50 p-3 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Total</h4>
            <div className="grid grid-cols-2 gap-4">
              {bestTotalOver && (
                <div className="text-center">
                  <div className="font-medium">Over {bestTotalOver.value}</div>
                  <div className="text-lg font-bold text-blue-600">
                    {formatOdds(bestTotalOver.odds)}
                  </div>
                  {bestTotalOver.best_odds && (
                    <div className="text-xs text-green-600 font-medium">
                      Best Odds
                    </div>
                  )}
                </div>
              )}
              {bestTotalUnder && (
                <div className="text-center">
                  <div className="font-medium">
                    Under {bestTotalUnder.value}
                  </div>
                  <div className="text-lg font-bold text-blue-600">
                    {formatOdds(bestTotalUnder.odds)}
                  </div>
                  {bestTotalUnder.best_odds && (
                    <div className="text-xs text-green-600 font-medium">
                      Best Odds
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderGameRow = (game: Game) => {
    const awayTeam = game.awayTeam || {
      abbreviation: game.awayTeamId,
      displayName: "Away Team",
    };
    const homeTeam = game.homeTeam || {
      abbreviation: game.homeTeamId,
      displayName: "Home Team",
    };

    // Get best odds for each market type
    const awaySpread = getBestOdds(game, "spread", "away");
    const homeSpread = getBestOdds(game, "spread", "home");
    const awayMoneyline = getBestOdds(game, "moneyline", "away");
    const homeMoneyline = getBestOdds(game, "moneyline", "home");
    const overTotal = getBestOdds(game, "total", "over");
    const underTotal = getBestOdds(game, "total", "under");

    const handleBetClick = (
      betType: string,
      team: string,
      odds: number,
      line?: number
    ) => {
      // TODO: Implement bet tracking functionality
      console.log("Track bet:", {
        betType,
        team,
        odds,
        line,
        gameId: game.gameId,
      });
    };

    return (
      <>
        {/* Away Team Row */}
        <TableRow
          key={`${game.gameId}-away`}
          className="hover:bg-muted/50 border-b-0"
        >
          {/* Sport - Only show on away row, with rowspan */}
          <TableCell className="text-center border-r py-1 px-2" rowSpan={2}>
            <div className="flex flex-col items-center space-y-0.5">
              <span className="text-xs font-medium bg-primary/10 text-primary px-1 py-0.5 rounded">
                {game.sport.toUpperCase()}
              </span>
              <div className="text-xs text-muted-foreground">
                {getGameTime(game.scheduledTime)}
              </div>
            </div>
          </TableCell>

          {/* Away Team */}
          <TableCell className="py-1 px-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {awayTeam.abbreviation}
              </span>
              {"record" in awayTeam && awayTeam.record && (
                <span className="text-xs text-muted-foreground">
                  {awayTeam.record.win}-{awayTeam.record.loss}
                </span>
              )}
            </div>
          </TableCell>

          {/* Away Moneyline */}
          <TableCell className="text-center py-1 px-1">
            {awayMoneyline && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  handleBetClick("moneyline", "away", awayMoneyline.odds)
                }
                className="h-5 px-1 text-xs font-medium"
              >
                {formatOdds(awayMoneyline.odds)}
              </Button>
            )}
          </TableCell>

          {/* Away ML Money % */}
          <TableCell className="text-center py-1 px-1 hidden sm:table-cell">
            {game.publicBetting?.moneyline && (
              <span className="text-xs text-green-600">
                {game.publicBetting.moneyline.awayMoneyPercent}%
              </span>
            )}
          </TableCell>

          {/* Away ML Tickets % */}
          <TableCell className="text-center py-1 px-1 hidden sm:table-cell">
            {game.publicBetting?.moneyline && (
              <span className="text-xs text-blue-600">
                {game.publicBetting.moneyline.awayTicketsPercent}%
              </span>
            )}
          </TableCell>

          {/* Away Spread */}
          <TableCell className="text-center py-1 px-1">
            {awaySpread && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  handleBetClick(
                    "spread",
                    "away",
                    awaySpread.odds,
                    awaySpread.value
                  )
                }
                className="h-5 px-1 text-xs font-medium"
              >
                {awaySpread.value && awaySpread.value > 0 ? "+" : ""}
                {awaySpread.value} ({formatOdds(awaySpread.odds)})
              </Button>
            )}
          </TableCell>

          {/* Away Spread Money % */}
          <TableCell className="text-center py-1 px-1 hidden sm:table-cell">
            {game.publicBetting?.spread && (
              <span className="text-xs text-green-600">
                {game.publicBetting.spread.awayMoneyPercent}%
              </span>
            )}
          </TableCell>

          {/* Away Spread Tickets % */}
          <TableCell className="text-center py-1 px-1 hidden sm:table-cell">
            {game.publicBetting?.spread && (
              <span className="text-xs text-blue-600">
                {game.publicBetting.spread.awayTicketsPercent}%
              </span>
            )}
          </TableCell>

          {/* Over Total */}
          <TableCell className="text-center py-1 px-1">
            {overTotal && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  handleBetClick(
                    "total",
                    "over",
                    overTotal.odds,
                    overTotal.value
                  )
                }
                className="h-5 px-1 text-xs font-medium"
              >
                O{overTotal.value} ({formatOdds(overTotal.odds)})
              </Button>
            )}
          </TableCell>

          {/* Over Total Money % */}
          <TableCell className="text-center py-1 px-1 hidden sm:table-cell">
            {game.publicBetting?.total && (
              <span className="text-xs text-green-600">
                {game.publicBetting.total.overMoneyPercent}%
              </span>
            )}
          </TableCell>

          {/* Over Total Tickets % */}
          <TableCell className="text-center py-1 px-1 hidden sm:table-cell">
            {game.publicBetting?.total && (
              <span className="text-xs text-blue-600">
                {game.publicBetting.total.overTicketsPercent}%
              </span>
            )}
          </TableCell>
        </TableRow>

        {/* Home Team Row */}
        <TableRow
          key={`${game.gameId}-home`}
          className="hover:bg-muted/50 border-b-2"
        >
          {/* Home Team */}
          <TableCell className="py-1 px-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {homeTeam.abbreviation}
              </span>
              {"record" in homeTeam && homeTeam.record && (
                <span className="text-xs text-muted-foreground">
                  {homeTeam.record.win}-{homeTeam.record.loss}
                </span>
              )}
            </div>
          </TableCell>

          {/* Home Moneyline */}
          <TableCell className="text-center py-1 px-1">
            {homeMoneyline && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  handleBetClick("moneyline", "home", homeMoneyline.odds)
                }
                className="h-5 px-1 text-xs font-medium"
              >
                {formatOdds(homeMoneyline.odds)}
              </Button>
            )}
          </TableCell>

          {/* Home ML Money % */}
          <TableCell className="text-center py-1 px-1 hidden sm:table-cell">
            {game.publicBetting?.moneyline && (
              <span className="text-xs text-green-600">
                {game.publicBetting.moneyline.homeMoneyPercent}%
              </span>
            )}
          </TableCell>

          {/* Home ML Tickets % */}
          <TableCell className="text-center py-1 px-1 hidden sm:table-cell">
            {game.publicBetting?.moneyline && (
              <span className="text-xs text-blue-600">
                {game.publicBetting.moneyline.homeTicketsPercent}%
              </span>
            )}
          </TableCell>

          {/* Home Spread */}
          <TableCell className="text-center py-1 px-1">
            {homeSpread && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  handleBetClick(
                    "spread",
                    "home",
                    homeSpread.odds,
                    homeSpread.value
                  )
                }
                className="h-5 px-1 text-xs font-medium"
              >
                {homeSpread.value && homeSpread.value > 0 ? "+" : ""}
                {homeSpread.value} ({formatOdds(homeSpread.odds)})
              </Button>
            )}
          </TableCell>

          {/* Home Spread Money % */}
          <TableCell className="text-center py-1 px-1 hidden sm:table-cell">
            {game.publicBetting?.spread && (
              <span className="text-xs text-green-600">
                {game.publicBetting.spread.homeMoneyPercent}%
              </span>
            )}
          </TableCell>

          {/* Home Spread Tickets % */}
          <TableCell className="text-center py-1 px-1 hidden sm:table-cell">
            {game.publicBetting?.spread && (
              <span className="text-xs text-blue-600">
                {game.publicBetting.spread.homeTicketsPercent}%
              </span>
            )}
          </TableCell>

          {/* Under Total */}
          <TableCell className="text-center py-1 px-1">
            {underTotal && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  handleBetClick(
                    "total",
                    "under",
                    underTotal.odds,
                    underTotal.value
                  )
                }
                className="h-5 px-1 text-xs font-medium"
              >
                U{underTotal.value} ({formatOdds(underTotal.odds)})
              </Button>
            )}
          </TableCell>

          {/* Under Total Money % */}
          <TableCell className="text-center py-1 px-1 hidden sm:table-cell">
            {game.publicBetting?.total && (
              <span className="text-xs text-green-600">
                {game.publicBetting.total.underMoneyPercent}%
              </span>
            )}
          </TableCell>

          {/* Under Total Tickets % */}
          <TableCell className="text-center py-1 px-1 hidden sm:table-cell">
            {game.publicBetting?.total && (
              <span className="text-xs text-blue-600">
                {game.publicBetting.total.underTicketsPercent}%
              </span>
            )}
          </TableCell>
        </TableRow>
      </>
    );
  };

  if (status === "loading" || loading) {
    return (
      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-2 sm:py-4">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-3 text-primary" />
            <p className="text-xs sm:text-sm text-muted-foreground">
              Loading games...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4 py-2 sm:py-4">
      {/* Page Content */}
      <div className="space-y-3 sm:space-y-4">
        {/* Header with Date Picker, Sport Pills, and Refresh Button */}
        <div className="flex items-center justify-between gap-4">
          {/* Date Picker Section */}
          <div className="flex items-center gap-2">
            <div className="relative">
              {showDatePicker ? (
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setShowDatePicker(false);
                  }}
                  onBlur={() => setShowDatePicker(false)}
                  autoFocus
                  className="px-3 py-1.5 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              ) : (
                <Button
                  variant="outline"
                  onClick={() => setShowDatePicker(true)}
                  className="flex items-center gap-2"
                >
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {formatSelectedDate(selectedDate)}
                  </span>
                </Button>
              )}
            </div>
          </div>

          {/* Sport Filter Pills */}
          <div className="flex flex-wrap gap-2">
            {sportStats.map((stat) => (
              <Button
                key={stat.sport}
                onClick={() => setSelectedSport(stat.sport)}
                variant={selectedSport === stat.sport ? "default" : "secondary"}
                size="sm"
              >
                {stat.label} {stat.count > 0 && `(${stat.count})`}
              </Button>
            ))}
          </div>

          {/* Refresh Button */}
          <Button onClick={loadAllGames} className="flex items-center">
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>

        {/* Games List */}
        {filteredGames.length === 0 ? (
          <div className="bg-card border border-border rounded-lg p-6 sm:p-8">
            <div className="text-center">
              <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-sm sm:text-base font-medium text-foreground mb-2">
                No games found
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground mb-3">
                No {selectedSport === "all" ? "" : selectedSport} games
                scheduled for today.
              </p>
              <Button
                onClick={loadAllGames}
                size="sm"
                className="flex items-center"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Refresh
              </Button>
            </div>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 text-center text-xs">
                    Sport
                  </TableHead>
                  <TableHead className="w-32 text-xs">Teams</TableHead>
                  <TableHead className="text-center text-xs">ML</TableHead>
                  <TableHead className="text-center hidden sm:table-cell text-xs">
                    M%
                  </TableHead>
                  <TableHead className="text-center hidden sm:table-cell text-xs">
                    T%
                  </TableHead>
                  <TableHead className="text-center text-xs">Spread</TableHead>
                  <TableHead className="text-center hidden sm:table-cell text-xs">
                    M%
                  </TableHead>
                  <TableHead className="text-center hidden sm:table-cell text-xs">
                    T%
                  </TableHead>
                  <TableHead className="text-center text-xs">Total</TableHead>
                  <TableHead className="text-center hidden sm:table-cell text-xs">
                    M%
                  </TableHead>
                  <TableHead className="text-center hidden sm:table-cell text-xs">
                    T%
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>{filteredGames.map(renderGameRow)}</TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
