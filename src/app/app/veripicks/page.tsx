"use client";

import { DynamicIcon } from "@captify/core";
import { useEffect, useState, useCallback } from "react";
import React from "react";
import { useSession } from "next-auth/react";
import {
  Game,
  PublicBettingSentiment,
  MarketOutcome,
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
  return `${Math.round(percent * 10) / 10}%`;
};

const formatGameClock = (clock: string, linescore?: any[]): string => {
  if (!clock) return "";

  // Try to determine current period from linescore
  let periodDisplay = "";
  if (linescore && linescore.length > 0) {
    // Find the last period with scores to determine current period
    const currentPeriodIndex = linescore.findIndex(
      (period) =>
        period.home_points === null ||
        period.home_points === undefined ||
        period.away_points === null ||
        period.away_points === undefined
    );

    if (currentPeriodIndex >= 0) {
      const activePeriod = linescore[currentPeriodIndex];
      periodDisplay =
        activePeriod?.display_name ||
        activePeriod?.displayName ||
        `Q${currentPeriodIndex + 1}`;
    } else {
      // All periods have scores, we're likely in the last period or overtime
      const lastPeriod = linescore[linescore.length - 1];
      periodDisplay =
        lastPeriod?.display_name ||
        lastPeriod?.displayName ||
        `Q${linescore.length}`;
    }
  }

  return clock === "00:00" || clock === "0:00"
    ? `End ${periodDisplay}`
    : `${clock} ${periodDisplay}`;
};

const cleanNetworkName = (network: string): string => {
  if (!network) return "";
  // Remove "Network" from the end of network names
  return network.replace(/\s+Network$/i, "").trim();
};

const getBestOdds = (
  game: Game,
  marketType: "moneyline" | "spread" | "total",
  side: string,
  useLive: boolean = false
): MarketOutcome | null => {
  if (!game.markets) return null;

  // Search through all sportsbooks to find odds with the specified live preference
  for (const book of Object.values(game.markets)) {
    if (!book.event[marketType]) continue;

    const market = book.event[marketType];
    if (!market) continue;

    // Look for outcome with the specified side and live preference
    const outcome = market.find(
      (o) => o.side === side && (o as any).is_live === useLive
    );
    if (outcome) {
      return outcome;
    }
  }

  // If no odds found with the specified live preference, return null (show -)
  return null;
};

export default function VeriPicksPage() {
  const { data: session, status } = useSession();
  const [allGames, setAllGames] = useState<Game[]>([]);
  const [filteredGames, setFilteredGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLeagues, setSelectedLeagues] = useState<string[]>([]); // Multi-select leagues
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showAllLive, setShowAllLive] = useState(false); // New state for Live button
  const [sportStats, setSportStats] = useState<
    Array<{
      sport: string;
      label: string;
      count: number;
    }>
  >([]);

  // Define all available leagues to show as toggleable pills
  const allAvailableLeagues = [
    { sport: "NFL", label: "NFL" },
    { sport: "MLB", label: "MLB" },
    { sport: "NCAAB", label: "NCAAB" },
    { sport: "NBA", label: "NBA" },
    { sport: "NHL", label: "NHL" },
    { sport: "NCAAF", label: "NCAAF" },
    { sport: "MLS", label: "MLS" },
    { sport: "WNBA", label: "WNBA" },
  ];

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
      // Client-side filtering will handle league selection and timezone-aware date filtering

      // Create start and end of day in user's timezone
      const selectedDateObj = new Date(selectedDate + "T00:00:00");
      const startOfDay = new Date(
        selectedDateObj.getFullYear(),
        selectedDateObj.getMonth(),
        selectedDateObj.getDate(),
        0,
        0,
        0
      );
      const endOfDay = new Date(
        selectedDateObj.getFullYear(),
        selectedDateObj.getMonth(),
        selectedDateObj.getDate(),
        23,
        59,
        59,
        999
      );

      const result = await client.get({
        table: "captify-veripicks-Game",
        params: {
          FilterExpression:
            "scheduledTime >= :startDate AND scheduledTime <= :endDate",
          ExpressionAttributeValues: {
            ":startDate": startOfDay.toISOString(),
            ":endDate": endOfDay.toISOString(),
          },
        },
      });

      let allGamesData: Game[] = [];
      if (result.success && result.data) {
        allGamesData = result.data;

        // Additional client-side filtering to ensure exact date match in user's timezone
        const selectedDateObj = new Date(selectedDate + "T00:00:00");
        allGamesData = allGamesData.filter((game) => {
          const gameDate = new Date(game.scheduledTime);
          const gameDateLocal = new Date(
            gameDate.getFullYear(),
            gameDate.getMonth(),
            gameDate.getDate()
          );
          const selectedDateLocal = new Date(
            selectedDateObj.getFullYear(),
            selectedDateObj.getMonth(),
            selectedDateObj.getDate()
          );
          return gameDateLocal.getTime() === selectedDateLocal.getTime();
        });

        console.log(`Loaded ${allGamesData.length} games for ${selectedDate}`);
      } else {
        console.warn("No games found for selected date:", selectedDate);
      }

      console.log("All Games API Result:", allGamesData);

      if (allGamesData.length > 0) {
        // Sort games by scheduled time (ensure proper chronological order)
        allGamesData.sort(
          (a, b) =>
            new Date(a.scheduledTime).getTime() -
            new Date(b.scheduledTime).getTime()
        );

        setAllGames(allGamesData);

        // Calculate sport statistics using league data
        const sportCounts = allGamesData.reduce((acc, game) => {
          const leagueKey = game.league; // Use league instead of sport
          acc[leagueKey] = (acc[leagueKey] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        // Create stats using the predefined leagues list with counts
        const stats = allAvailableLeagues.map((league) => ({
          sport: league.sport,
          label: league.label,
          count: sportCounts[league.sport] || 0,
        }));

        setSportStats(stats);

        // Initialize selectedLeagues with all leagues that have games
        const availableLeagues = stats
          .filter((stat) => stat.count > 0)
          .map((stat) => stat.sport);
        setSelectedLeagues(availableLeagues);

        // Set initial filtered games
        setFilteredGames(allGamesData);
      } else {
        // No games found - still show all leagues with 0 counts
        setAllGames([]);
        setFilteredGames([]);
        const stats = allAvailableLeagues.map((league) => ({
          sport: league.sport,
          label: league.label,
          count: 0,
        }));
        setSportStats(stats);
      }
    } catch (error) {
      console.error("Failed to load games:", error);
      // Set empty state on error - still show all leagues with 0 counts
      setAllGames([]);
      setFilteredGames([]);
      const stats = allAvailableLeagues.map((league) => ({
        sport: league.sport,
        label: league.label,
        count: 0,
      }));
      setSportStats(stats);
    } finally {
      setLoading(false);
    }
  }, [session, selectedDate]);

  // Filter games when league selection changes - use multi-select leagues
  useEffect(() => {
    let filtered: Game[];
    if (selectedLeagues.length === 0) {
      // If no leagues selected, show no games
      filtered = [];
    } else {
      // Filter games to only show selected leagues
      filtered = allGames.filter((game) =>
        selectedLeagues.includes(game.league)
      );
    }

    // Ensure filtered games are sorted by start time
    filtered.sort(
      (a, b) =>
        new Date(a.scheduledTime).getTime() -
        new Date(b.scheduledTime).getTime()
    );

    setFilteredGames(filtered);
  }, [selectedLeagues, allGames]);

  useEffect(() => {
    if (status === "authenticated") {
      loadAllGames();
    }
  }, [status, loadAllGames]);

  // Toggle league selection (add/remove from selectedLeagues)
  const toggleLeague = (league: string) => {
    setSelectedLeagues((prev) => {
      if (prev.includes(league)) {
        // Remove league from selection
        return prev.filter((l) => l !== league);
      } else {
        // Add league to selection
        return [...prev, league];
      }
    });
  };

  const getGameTime = (scheduledTime: string, game?: any) => {
    // If game is completed, show statusDisplay (like "FINAL")
    if (game?.realStatus === "closed") {
      return game.statusDisplay || "FINAL";
    }

    // If game is not scheduled (live or other states), show statusDisplay
    if (game?.realStatus && game.realStatus !== "scheduled") {
      return game.statusDisplay || game.realStatus;
    }

    const date = new Date(scheduledTime);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatLinescore = (linescore?: any[]) => {
    if (!linescore || linescore.length === 0) return null;

    return linescore
      .map((period) => {
        const homeScore = period.home_points ?? period.homePoints;
        const awayScore = period.away_points ?? period.awayPoints;
        const periodAbbr = period.abbr || period.id;

        // Only show periods that have been played (have scores)
        if (
          homeScore === null ||
          homeScore === undefined ||
          awayScore === null ||
          awayScore === undefined
        ) {
          return null;
        }

        return {
          period: periodAbbr,
          homeScore: homeScore.toString().padStart(2, " "),
          awayScore: awayScore.toString().padStart(2, " "),
        };
      })
      .filter(Boolean);
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

    // Get live odds for each market
    const bestMoneylineAway = getBestOdds(game, "moneyline", "away", true);
    const bestMoneylineHome = getBestOdds(game, "moneyline", "home", true);
    const bestSpreadAway = getBestOdds(game, "spread", "away", true);
    const bestSpreadHome = getBestOdds(game, "spread", "home", true);
    const bestTotalOver = getBestOdds(game, "total", "over", true);
    const bestTotalUnder = getBestOdds(game, "total", "under", true);

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
                  <div className="text-sm">
                    {bestSpreadAway.value && bestSpreadAway.value > 0
                      ? "+"
                      : ""}
                    {bestSpreadAway.value}
                  </div>
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
                  <div className="text-sm">
                    {bestSpreadHome.value && bestSpreadHome.value > 0
                      ? "+"
                      : ""}
                    {bestSpreadHome.value}
                  </div>
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
    // Debug: log game data for live games
    if (game.status === "live") {
      console.log("Live game data:", {
        gameId: game.gameId,
        status: game.status,
        score: game.score,
        boxscore: game.boxscore,
        awayTeam: game.awayTeam?.abbreviation,
        homeTeam: game.homeTeam?.abbreviation,
      });
    }

    const awayTeam = game.awayTeam || {
      abbreviation: game.awayTeamId,
      displayName: "Away Team",
    };
    const homeTeam = game.homeTeam || {
      abbreviation: game.homeTeamId,
      displayName: "Home Team",
    };

    // Get best odds for each market type (use pre-game odds for table)
    const awaySpread = getBestOdds(game, "spread", "away", false);
    const homeSpread = getBestOdds(game, "spread", "home", false);
    const awayMoneyline = getBestOdds(game, "moneyline", "away", false);
    const homeMoneyline = getBestOdds(game, "moneyline", "home", false);
    const overTotal = getBestOdds(game, "total", "over", false);
    const underTotal = getBestOdds(game, "total", "under", false);

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
      <React.Fragment key={game.gameId}>
        {/* Away Team Row */}
        <TableRow
          key={`${game.gameId}-away`}
          className="hover:bg-muted/50 border-b-0"
        >
          {/* League - Only show on away row, with rowspan */}
          <TableCell className="text-center border-r py-1 px-2" rowSpan={2}>
            <div className="flex flex-col items-center space-y-0.5">
              <span
                className={`text-xs font-medium px-1 py-0.5 rounded ${
                  game.realStatus === "scheduled"
                    ? "bg-gray-100 text-gray-600"
                    : game.realStatus === "inprogress"
                    ? "bg-green-100 text-green-600"
                    : "bg-gray-800 text-white"
                }`}
              >
                {game.league}
              </span>
              {(game.status === "live" || game.status === "completed") &&
              (game.score ||
                game.boxscore ||
                game.total_away_points !== undefined) ? (
                <div className="text-xs space-y-0.5">
                  {(game.boxscore?.clock ||
                    game.score?.clock ||
                    game.clock) && (
                    <div className="text-muted-foreground font-medium">
                      {formatGameClock(
                        game.boxscore?.clock ||
                          game.score?.clock ||
                          game.clock ||
                          "",
                        game.boxscore?.linescore ||
                          game.score?.linescore ||
                          game.linescore
                      )}
                    </div>
                  )}
                  {game.broadcast?.network && (
                    <div className="text-muted-foreground">
                      {cleanNetworkName(game.broadcast.network)}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-xs text-muted-foreground">
                  {getGameTime(game.scheduledTime, game)}
                  {game.broadcast?.network && (
                    <div className="mt-0.5">
                      {cleanNetworkName(game.broadcast.network)}
                    </div>
                  )}
                </div>
              )}
            </div>
          </TableCell>

          {/* Away Team */}
          <TableCell className="py-1 px-2">
            <div className="flex items-center justify-between">
              <div className="text-xs flex items-center space-x-1">
                {game.realStatus === "scheduled" ? (
                  // Scheduled: Show rotation number + display name + record
                  <>
                    <span className="text-xs text-muted-foreground w-6">
                      {game.rotationNumbers?.away
                        ? String(game.rotationNumbers.away)
                            .slice(-3)
                            .padStart(2, "0")
                        : ""}
                    </span>
                    <span className="text-sm font-medium">
                      {awayTeam.displayName}
                    </span>
                    {"record" in awayTeam && awayTeam.record && (
                      <span className="text-xs text-muted-foreground">
                        {awayTeam.record.win}-{awayTeam.record.loss}
                      </span>
                    )}
                  </>
                ) : (
                  // In progress or closed: Show abbreviation + scores
                  <>
                    <span className="text-xs text-muted-foreground w-6">
                      {awayTeam.abbreviation}
                    </span>
                    {game.realStatus === "closed" ? (
                      // Show horizontal linescore for completed games
                      <div className="text-xs font-mono flex items-center space-x-1">
                        {(game.linescore || game.boxscore?.linescore)?.map(
                          (period, idx) => (
                            <span key={idx} className="text-xs w-5 text-right">
                              {period.away_points?.toString().padStart(2, " ")}
                            </span>
                          )
                        )}
                        <span className="text-xs w-5 text-right">
                          {game.boxscore?.total_away_points ||
                            game.total_away_points ||
                            "0"}
                        </span>
                      </div>
                    ) : game.realStatus === "inprogress" &&
                      (game.score ||
                        game.boxscore ||
                        game.total_away_points !== undefined) ? (
                      <span className="text-sm font-bold text-green-600">
                        {game.boxscore?.total_away_points ??
                          game.score?.total_away_points ??
                          game.total_away_points ??
                          game.score?.awayScore ??
                          0}
                      </span>
                    ) : null}
                  </>
                )}
              </div>
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
                className="h-5 px-1 text-xs"
              >
                {formatOdds(awayMoneyline.odds)}
              </Button>
            )}
          </TableCell>

          {/* Away ML Money % */}
          <TableCell className="text-center py-1 px-1 hidden sm:table-cell">
            {game.publicBetting?.moneyline && (
              <span className="text-xs text-green-600">
                {formatPercentage(
                  game.publicBetting.moneyline.awayMoneyPercent
                )}
              </span>
            )}
          </TableCell>

          {/* Away ML Tickets % */}
          <TableCell className="text-center py-1 px-1 hidden sm:table-cell">
            {game.publicBetting?.moneyline && (
              <span className="text-xs text-blue-600">
                {formatPercentage(
                  game.publicBetting.moneyline.awayTicketsPercent
                )}
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
                className="h-5 px-1 text-xs"
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
                {formatPercentage(game.publicBetting.spread.awayMoneyPercent)}
              </span>
            )}
          </TableCell>

          {/* Away Spread Tickets % */}
          <TableCell className="text-center py-1 px-1 hidden sm:table-cell">
            {game.publicBetting?.spread && (
              <span className="text-xs text-blue-600">
                {formatPercentage(game.publicBetting.spread.awayTicketsPercent)}
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
                {formatPercentage(game.publicBetting.total.overMoneyPercent)}
              </span>
            )}
          </TableCell>

          {/* Over Total Tickets % */}
          <TableCell className="text-center py-1 px-1 hidden sm:table-cell">
            {game.publicBetting?.total && (
              <span className="text-xs text-blue-600">
                {formatPercentage(game.publicBetting.total.overTicketsPercent)}
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
              <div className="flex items-center space-x-1">
                {game.realStatus === "scheduled" ? (
                  // Scheduled: Show rotation number + display name + record
                  <>
                    <span className="text-xs text-muted-foreground w-6">
                      {game.rotationNumbers?.home
                        ? String(game.rotationNumbers.home)
                            .slice(-3)
                            .padStart(2, "0")
                        : ""}
                    </span>
                    <span className="text-sm">{homeTeam.displayName}</span>
                    {"record" in homeTeam && homeTeam.record && (
                      <span className="text-xs text-muted-foreground">
                        {homeTeam.record.win}-{homeTeam.record.loss}
                      </span>
                    )}
                  </>
                ) : (
                  // In progress or closed: Show abbreviation + scores
                  <>
                    <span className="text-xs text-muted-foreground w-6">
                      {homeTeam.abbreviation}
                    </span>
                    {game.realStatus === "closed" ? (
                      // Show horizontal linescore for completed games
                      <div className="text-xs font-mono flex items-center space-x-1">
                        {(game.linescore || game.boxscore?.linescore)?.map(
                          (period, idx) => (
                            <span key={idx} className="w-5 text-right">
                              {period.home_points?.toString().padStart(2, " ")}
                            </span>
                          )
                        )}
                        <span className="w-5 text-right text-xs">
                          {game.boxscore?.total_home_points ||
                            game.total_home_points ||
                            "0"}
                        </span>
                      </div>
                    ) : game.realStatus === "inprogress" &&
                      (game.score ||
                        game.boxscore ||
                        game.total_home_points !== undefined) ? (
                      <span className="text-sm font-bold text-green-600">
                        {game.boxscore?.total_home_points ??
                          game.score?.total_home_points ??
                          game.total_home_points ??
                          game.score?.homeScore ??
                          0}
                      </span>
                    ) : null}
                  </>
                )}
              </div>
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
                {formatPercentage(
                  game.publicBetting.moneyline.homeMoneyPercent
                )}
              </span>
            )}
          </TableCell>

          {/* Home ML Tickets % */}
          <TableCell className="text-center py-1 px-1 hidden sm:table-cell">
            {game.publicBetting?.moneyline && (
              <span className="text-xs text-blue-600">
                {formatPercentage(
                  game.publicBetting.moneyline.homeTicketsPercent
                )}
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
                {formatPercentage(game.publicBetting.spread.homeMoneyPercent)}
              </span>
            )}
          </TableCell>

          {/* Home Spread Tickets % */}
          <TableCell className="text-center py-1 px-1 hidden sm:table-cell">
            {game.publicBetting?.spread && (
              <span className="text-xs text-blue-600">
                {formatPercentage(game.publicBetting.spread.homeTicketsPercent)}
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
                {formatPercentage(game.publicBetting.total.underMoneyPercent)}
              </span>
            )}
          </TableCell>

          {/* Under Total Tickets % */}
          <TableCell className="text-center py-1 px-1 hidden sm:table-cell">
            {game.publicBetting?.total && (
              <span className="text-xs text-blue-600">
                {formatPercentage(game.publicBetting.total.underTicketsPercent)}
              </span>
            )}
          </TableCell>
        </TableRow>

        {/* Live Game Details Row - Show only for live games when Live button is active or game is currently live */}
        {(showAllLive && game.realStatus === "inprogress") ||
          (game.realStatus === "inprogress" &&
            (game.score || game.boxscore || game.linescore) && (
              <TableRow className="bg-gray-50 border-b-2">
                <TableCell colSpan={11} className="py-2 px-3">
                  <div className="bg-white rounded-lg border border-gray-300 shadow-sm">
                    {/* Layout: Scoreboard + Live Odds Table + Winning Bets */}
                    <div className="grid grid-cols-10 divide-x divide-gray-200">
                      {/* Left: Scoreboard with Live Odds (7 columns = 70%) */}
                      <div className="col-span-7 p-3">
                        {(() => {
                          const linescore =
                            game.boxscore?.linescore ||
                            game.score?.linescore ||
                            game.linescore;
                          const situation =
                            game.boxscore?.situation ||
                            game.score?.situation ||
                            game.situation;
                          const possessionTeam = situation?.possession;
                          const awayScore =
                            game.boxscore?.total_away_points ??
                            game.score?.total_away_points ??
                            game.total_away_points ??
                            0;
                          const homeScore =
                            game.boxscore?.total_home_points ??
                            game.score?.total_home_points ??
                            game.total_home_points ??
                            0;

                          return (
                            <div className="space-y-1">
                              {/* Game clock, situation, Live Odds, and TV */}
                              <div className="flex justify-between items-center mb-2 pb-1 border-b border-gray-200">
                                <div className="text-xs font-semibold text-orange-600">
                                  {(game.boxscore?.clock ||
                                    game.score?.clock ||
                                    game.clock) &&
                                    formatGameClock(
                                      game.boxscore?.clock ||
                                        game.score?.clock ||
                                        game.clock ||
                                        "",
                                      game.boxscore?.linescore ||
                                        game.score?.linescore ||
                                        game.linescore
                                    )}
                                </div>
                                {situation?.display && (
                                  <div className="text-xs font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded">
                                    {situation.display}
                                  </div>
                                )}
                                <div className="text-xs font-medium text-gray-700 bg-blue-100 px-2 py-1 rounded">
                                  Live Odds
                                </div>
                                <div className="text-xs text-gray-500 font-medium">
                                  {game.broadcast?.network &&
                                    cleanNetworkName(game.broadcast.network)}
                                </div>
                              </div>

                              {/* Period headers */}
                              <div className="flex items-center">
                                <div className="w-32 text-xs font-medium text-gray-600">
                                  TEAM
                                </div>
                                <div className="flex space-x-1 flex-1">
                                  {linescore &&
                                    linescore.map((period) => (
                                      <div
                                        key={`header-${period.id}`}
                                        className="w-8 text-center text-xs font-medium text-gray-600 border-b border-gray-300"
                                      >
                                        {period.abbr}
                                      </div>
                                    ))}
                                </div>
                                <div className="w-12 text-center text-xs font-medium text-gray-600 border-b border-gray-300">
                                  TOTAL
                                </div>
                                <div className="w-16 text-center text-xs font-medium text-gray-600 border-b border-gray-300">
                                  ML
                                </div>
                                <div className="w-20 text-center text-xs font-medium text-gray-600 border-b border-gray-300">
                                  Spread
                                </div>
                                <div className="w-16 text-center text-xs font-medium text-gray-600 border-b border-gray-300">
                                  Total
                                </div>
                              </div>

                              {/* Away team row */}
                              <div className="flex items-center py-1">
                                <div className="flex items-center w-32">
                                  <div
                                    className="w-5 h-5 rounded-sm flex items-center justify-center mr-2 text-white border"
                                    style={{
                                      backgroundColor: `#${
                                        ("primaryColor" in awayTeam
                                          ? awayTeam.primaryColor
                                          : "a71930") || "a71930"
                                      }`,
                                    }}
                                  >
                                    {"logo" in awayTeam && awayTeam.logo ? (
                                      <img
                                        src={awayTeam.logo}
                                        alt={awayTeam.abbreviation}
                                        className="w-4 h-4 object-contain"
                                      />
                                    ) : (
                                      <span className="text-xs font-bold">
                                        {awayTeam.abbreviation?.slice(0, 2)}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-xs font-semibold flex items-center">
                                    {awayTeam.abbreviation}
                                    {possessionTeam &&
                                      possessionTeam.toString() ===
                                        game.awayTeam?.team_id?.toString() && (
                                        <div className="ml-1 w-2 h-2 bg-orange-500 rounded-full"></div>
                                      )}
                                  </div>
                                </div>

                                <div className="flex space-x-1 flex-1">
                                  {linescore &&
                                    linescore.map((period) => (
                                      <div
                                        key={`away-${period.id}`}
                                        className="w-8 text-center text-xs font-medium border-r border-gray-200"
                                      >
                                        {period.away_points ??
                                          period.awayPoints ??
                                          0}
                                      </div>
                                    ))}
                                </div>

                                <div className="w-12 text-center font-bold text-sm border-l border-gray-300">
                                  {awayScore}
                                </div>

                                {/* Live Odds for Away Team */}
                                {(() => {
                                  const awayMoneylineLive = getBestOdds(
                                    game,
                                    "moneyline",
                                    "away",
                                    true
                                  );
                                  const awaySpreadLive = getBestOdds(
                                    game,
                                    "spread",
                                    "away",
                                    true
                                  );
                                  const overTotalLive = getBestOdds(
                                    game,
                                    "total",
                                    "over",
                                    true
                                  );

                                  return (
                                    <>
                                      <div className="w-16 text-center text-xs font-medium border-l border-gray-300">
                                        {awayMoneylineLive
                                          ? formatOdds(awayMoneylineLive.odds)
                                          : "-"}
                                      </div>
                                      <div className="w-20 text-center text-xs font-medium border-l border-gray-300">
                                        {awaySpreadLive
                                          ? `${
                                              awaySpreadLive.value &&
                                              awaySpreadLive.value > 0
                                                ? "+"
                                                : ""
                                            }${awaySpreadLive.value}`
                                          : "-"}
                                      </div>
                                      <div className="w-16 text-center text-xs font-medium border-l border-gray-300">
                                        {overTotalLive
                                          ? `O${overTotalLive.value}`
                                          : "-"}
                                      </div>
                                    </>
                                  );
                                })()}
                              </div>

                              {/* Home team row */}
                              <div className="flex items-center py-1">
                                <div className="flex items-center w-32">
                                  <div
                                    className="w-5 h-5 rounded-sm flex items-center justify-center mr-2 text-white border"
                                    style={{
                                      backgroundColor: `#${
                                        ("primaryColor" in homeTeam
                                          ? homeTeam.primaryColor
                                          : "512888") || "512888"
                                      }`,
                                    }}
                                  >
                                    {"logo" in homeTeam && homeTeam.logo ? (
                                      <img
                                        src={homeTeam.logo}
                                        alt={homeTeam.abbreviation}
                                        className="w-4 h-4 object-contain"
                                      />
                                    ) : (
                                      <span className="text-xs font-bold">
                                        {homeTeam.abbreviation?.slice(0, 2)}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-xs font-semibold flex items-center">
                                    {homeTeam.abbreviation}
                                    {possessionTeam &&
                                      possessionTeam.toString() ===
                                        game.homeTeam?.team_id?.toString() && (
                                        <div className="ml-1 w-2 h-2 bg-orange-500 rounded-full"></div>
                                      )}
                                  </div>
                                </div>

                                <div className="flex space-x-1 flex-1">
                                  {linescore &&
                                    linescore.map((period) => (
                                      <div
                                        key={`home-${period.id}`}
                                        className="w-8 text-center text-xs font-medium border-r border-gray-200"
                                      >
                                        {period.home_points ??
                                          period.homePoints ??
                                          0}
                                      </div>
                                    ))}
                                </div>

                                <div className="w-12 text-center font-bold text-sm border-l border-gray-300">
                                  {homeScore}
                                </div>

                                {/* Live Odds for Home Team */}
                                {(() => {
                                  const homeMoneylineLive = getBestOdds(
                                    game,
                                    "moneyline",
                                    "home",
                                    true
                                  );
                                  const homeSpreadLive = getBestOdds(
                                    game,
                                    "spread",
                                    "home",
                                    true
                                  );
                                  const underTotalLive = getBestOdds(
                                    game,
                                    "total",
                                    "under",
                                    true
                                  );

                                  return (
                                    <>
                                      <div className="w-16 text-center text-xs font-medium border-l border-gray-300">
                                        {homeMoneylineLive
                                          ? formatOdds(homeMoneylineLive.odds)
                                          : "-"}
                                      </div>
                                      <div className="w-20 text-center text-xs font-medium border-l border-gray-300">
                                        {homeSpreadLive
                                          ? `${
                                              homeSpreadLive.value &&
                                              homeSpreadLive.value > 0
                                                ? "+"
                                                : ""
                                            }${homeSpreadLive.value}`
                                          : "-"}
                                      </div>
                                      <div className="w-16 text-center text-xs font-medium border-l border-gray-300">
                                        {underTotalLive
                                          ? `U${underTotalLive.value}`
                                          : "-"}
                                      </div>
                                    </>
                                  );
                                })()}
                              </div>
                            </div>
                          );
                        })()}
                      </div>

                      {/* Right: Current Winning Bets Only (3 columns = 30%) */}
                      <div className="col-span-3 p-1 bg-gray-50">
                        {(() => {
                          const awayMoneyline = getBestOdds(
                            game,
                            "moneyline",
                            "away"
                          );
                          const homeMoneyline = getBestOdds(
                            game,
                            "moneyline",
                            "home"
                          );
                          const awaySpread = getBestOdds(
                            game,
                            "spread",
                            "away"
                          );
                          const homeSpread = getBestOdds(
                            game,
                            "spread",
                            "home"
                          );
                          const overTotal = getBestOdds(game, "total", "over");
                          const underTotal = getBestOdds(
                            game,
                            "total",
                            "under"
                          );
                          const lastPlay = game.lastPlay;

                          // Calculate win percentages and determine winning bets
                          const awayWinPct =
                            lastPlay &&
                            (lastPlay as any).home_win_pct !== undefined
                              ? (1 - (lastPlay as any).home_win_pct) * 100
                              : 0;
                          const homeWinPct =
                            lastPlay &&
                            (lastPlay as any).home_win_pct !== undefined
                              ? (lastPlay as any).home_win_pct * 100
                              : 0;
                          const awaySpreadWinPct =
                            lastPlay &&
                            (lastPlay as any).home_spread_win_pct !== undefined
                              ? (1 - (lastPlay as any).home_spread_win_pct) *
                                100
                              : 0;
                          const homeSpreadWinPct =
                            lastPlay &&
                            (lastPlay as any).home_spread_win_pct !== undefined
                              ? (lastPlay as any).home_spread_win_pct * 100
                              : 0;
                          const overWinPct =
                            lastPlay &&
                            (lastPlay as any).over_win_pct !== undefined
                              ? (lastPlay as any).over_win_pct * 100
                              : 0;
                          const underWinPct =
                            lastPlay &&
                            (lastPlay as any).over_win_pct !== undefined
                              ? (1 - (lastPlay as any).over_win_pct) * 100
                              : 0;

                          const winningBets = [];

                          // Check moneyline - show winner (>50%)
                          if (awayWinPct > homeWinPct && awayMoneyline) {
                            winningBets.push({
                              label: `${awayTeam.abbreviation} ${formatOdds(
                                awayMoneyline.odds
                              )}`,
                              percentage: awayWinPct.toFixed(1),
                            });
                          } else if (homeWinPct > awayWinPct && homeMoneyline) {
                            winningBets.push({
                              label: `${homeTeam.abbreviation} ${formatOdds(
                                homeMoneyline.odds
                              )}`,
                              percentage: homeWinPct.toFixed(1),
                            });
                          }

                          // Check spread - show winner (>50%)
                          if (
                            awaySpreadWinPct > homeSpreadWinPct &&
                            awaySpread
                          ) {
                            winningBets.push({
                              label: `${awayTeam.abbreviation} ${
                                awaySpread.value && awaySpread.value > 0
                                  ? "+"
                                  : ""
                              }${awaySpread.value}`,
                              percentage: awaySpreadWinPct.toFixed(1),
                            });
                          } else if (
                            homeSpreadWinPct > awaySpreadWinPct &&
                            homeSpread
                          ) {
                            winningBets.push({
                              label: `${homeTeam.abbreviation} ${
                                homeSpread.value && homeSpread.value > 0
                                  ? "+"
                                  : ""
                              }${homeSpread.value}`,
                              percentage: homeSpreadWinPct.toFixed(1),
                            });
                          }

                          // Check total - show winner (>50%)
                          if (overWinPct > underWinPct && overTotal) {
                            winningBets.push({
                              label: `Over ${overTotal.value}`,
                              percentage: overWinPct.toFixed(1),
                            });
                          } else if (underWinPct > overWinPct && underTotal) {
                            winningBets.push({
                              label: `Under ${underTotal.value}`,
                              percentage: underWinPct.toFixed(1),
                            });
                          }

                          return (
                            <div className="space-y-2">
                              <div className="text-xs font-semibold text-gray-800 mb-2 border-b border-gray-300 pb-1">
                                Currently Winning
                              </div>
                              {winningBets.length > 0 ? (
                                <div className="space-y-2">
                                  {winningBets.map((bet, index) => (
                                    <div
                                      key={index}
                                      className="flex justify-between items-center bg-green-50 p-2 rounded border-l-3 border-green-500"
                                    >
                                      <span className="text-xs font-medium text-gray-800">
                                        {bet.label}
                                      </span>
                                      <span className="text-xs font-bold text-green-600">
                                        ({bet.percentage}%)
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-xs text-gray-500 italic">
                                  No clear winners yet
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Bottom: Full-width Last Play Details */}
                    <div className="border-t border-gray-300 p-2 bg-white">
                      {(() => {
                        const lastPlay = game.lastPlay;
                        return (
                          lastPlay &&
                          lastPlay.text && (
                            <div className="text-xs text-gray-600 text-center font-medium">
                              {lastPlay.text}
                              {(lastPlay as any).clock &&
                                ` • ${(lastPlay as any).clock}`}
                              {(lastPlay as any).type &&
                                ` • ${(lastPlay as any).type.replace(
                                  "_",
                                  " "
                                )}`}
                            </div>
                          )
                        );
                      })()}
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ))}
      </React.Fragment>
    );
  };

  if (status === "loading" || loading) {
    return (
      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-2 sm:py-4">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <DynamicIcon
              name="loader-2"
              className="h-6 w-6 animate-spin mx-auto mb-3 text-primary"
            />
            <p className="text-xs sm:text-sm text-muted-foreground">
              Loading games...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header with Date Picker, Sport Pills, and Refresh Button */}
      <div className="flex-shrink-0 px-2 sm:px-4 pt-2 sm:pt-4 pb-2 sm:pb-3">
        <div className="max-w-7xl mx-auto">
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
                    <DynamicIcon
                      name="calendar"
                      className="h-4 w-4 text-muted-foreground"
                    />
                    <span className="text-sm font-medium">
                      {formatSelectedDate(selectedDate)}
                    </span>
                  </Button>
                )}
              </div>
            </div>

            {/* League Filter Pills - Multi-select toggle */}
            <div className="flex flex-wrap items-center gap-2">
              {/* League Pills */}
              {sportStats
                .filter((stat) => stat.count > 0) // Only show leagues with games
                .map((stat) => (
                  <Button
                    key={stat.sport}
                    onClick={() => toggleLeague(stat.sport)}
                    variant={
                      selectedLeagues.includes(stat.sport)
                        ? "default"
                        : "secondary"
                    }
                    size="sm"
                    className={`transition-all duration-200 ${
                      selectedLeagues.includes(stat.sport)
                        ? "ring-2 ring-primary/20"
                        : "opacity-60 hover:opacity-100"
                    }`}
                  >
                    {stat.label} ({stat.count})
                  </Button>
                ))}

              {/* Clear All Button (X icon) */}
              {sportStats.filter((stat) => stat.count > 0).length > 0 &&
                selectedLeagues.length > 0 && (
                  <Button
                    onClick={() => setSelectedLeagues([])}
                    variant="outline"
                    size="sm"
                    className="text-xs p-2"
                    title="Clear All"
                  >
                    <DynamicIcon name="x" className="h-4 w-4" />
                  </Button>
                )}

              {/* Live Button */}
              <Button
                onClick={() => setShowAllLive(!showAllLive)}
                variant={showAllLive ? "default" : "outline"}
                size="sm"
                className="text-xs font-medium"
              >
                <div className="flex items-center gap-1">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      showAllLive ? "bg-white" : "bg-red-500"
                    }`}
                  ></div>
                  Live
                </div>
              </Button>

              {/* Refresh Button (icon only) */}
              <Button
                onClick={loadAllGames}
                variant="outline"
                size="sm"
                className="p-2"
                title="Refresh"
              >
                <DynamicIcon name="refresh-cw" className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Games List - Scrollable Content */}
      <div className="flex-1 min-h-0 overflow-y-auto px-2 sm:px-4 pb-2 sm:pb-4">
        <div className="max-w-7xl mx-auto">
          {filteredGames.length === 0 ? (
            <div className="bg-card border border-border rounded-lg p-6 sm:p-8 h-full flex items-center justify-center">
              <div className="text-center">
                <DynamicIcon
                  name="calendar"
                  className="h-8 w-8 text-muted-foreground mx-auto mb-3"
                />
                <h3 className="text-sm sm:text-base font-medium text-foreground mb-2">
                  No games found
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground mb-3">
                  {selectedLeagues.length === 0
                    ? "No leagues selected. Click on league pills above to select leagues to view."
                    : `No games scheduled for ${selectedLeagues.join(
                        ", "
                      )} today.`}
                </p>
                <Button
                  onClick={loadAllGames}
                  size="sm"
                  className="flex items-center"
                >
                  <DynamicIcon name="refresh-cw" className="h-3 w-3 mr-1" />
                  Refresh
                </Button>
              </div>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead className="w-12 text-center text-xs">
                      League
                    </TableHead>
                    <TableHead className="w-32 text-xs">Teams</TableHead>
                    <TableHead className="text-center text-xs">ML</TableHead>
                    <TableHead className="text-center hidden sm:table-cell text-xs">
                      M%
                    </TableHead>
                    <TableHead className="text-center hidden sm:table-cell text-xs">
                      T%
                    </TableHead>
                    <TableHead className="text-center text-xs">
                      Spread
                    </TableHead>
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
    </div>
  );
}
