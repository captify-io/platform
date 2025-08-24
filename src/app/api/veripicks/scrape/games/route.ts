import { NextRequest, NextResponse } from "next/server";
import {
  Game,
  Team,
  PublicBettingSentiment,
} from "@captify/veripicks";
import { randomUUID } from "crypto";
import {
  DynamoDBClient,
  PutItemCommand,
  ScanCommand,
  QueryCommand,
  marshall,
  unmarshall,
} from "@captify/api";
import type { QueryCommandOutput } from "@captify/api";

const SPORTS_CONFIG = {
  mlb: "baseball",
  nba: "basketball",
  nfl: "football",
  ncaaf: "football",
  ncaab: "basketball",
  wnba: "basketball",
  nhl: "hockey",
} as const;

const ACTION_NETWORK_API_KEY = process.env.ACTION_NETWORK_API_KEY;
// Action Network API endpoints by sport
const API_ENDPOINTS = {
  mlb: "https://api.actionnetwork.com/web/v2/scoreboard/proreport/mlb?bookIds=15,30,79,2988,75,123,71,68,69&periods=event",
  nfl: "https://api.actionnetwork.com/web/v2/scoreboard/proreport/nfl?bookIds=15,30,79,2988,75,123,71,69,68&periods=event",
  nba: "https://api.actionnetwork.com/web/v2/scoreboard/proreport/nba?bookIds=15,30,79,2988,75,123,71,68,69&periods=event",
  ncaaf:
    "https://api.actionnetwork.com/web/v2/scoreboard/proreport/ncaaf?bookIds=15,30,79,2988,75,123,71,68,69&division=FBS&periods=event",
  ncaab:
    "https://api.actionnetwork.com/web/v2/scoreboard/proreport/ncaab?bookIds=15,30,79,2988,75,123,71,69,68&periods=event",
  wnba: "https://api.actionnetwork.com/web/v2/scoreboard/proreport/wnba?bookIds=15,30,79,2988,75,123,71,69,68&periods=event",
  nhl: "https://api.actionnetwork.com/web/v2/scoreboard/proreport/nhl?bookIds=15,30,79,2988,75,123,71,69,68&periods=event",
} as const;

// Map Action Network status to our GameStatus enum
function mapActionNetworkStatus(
  status: string
): "scheduled" | "live" | "completed" | "postponed" | "cancelled" {
  switch (status.toLowerCase()) {
    case "scheduled":
      return "scheduled";
    case "live":
    case "inprogress":
    case "in_progress":
      return "live";
    case "completed":
    case "final":
      return "completed";
    case "postponed":
      return "postponed";
    case "cancelled":
    case "canceled":
      return "cancelled";
    default:
      return "scheduled";
  }
}

// Transform pro_report from snake_case API format to camelCase Game format
function transformProReport(proReport: any): any {
  if (!proReport) return undefined;

  interface ApiSignal {
    signal_type: string;
    explanation: string;
    strength: string;
    meta?: {
      steam_moves?: any;
      reverse_line_moves?: any;
      bet_percent?: any;
      money_percent?: any;
      expert_user_ids?: any;
      opposing_expert_user_ids?: any;
    };
  }

  const transformSignals = (signals: ApiSignal[]): any[] => {
    if (!signals) return [];
    return signals.map((signal) => ({
      signalType: signal.signal_type,
      explanation: signal.explanation,
      strength: signal.strength,
      meta: signal.meta
        ? {
            steamMoves: signal.meta.steam_moves,
            reverseLineMoves: signal.meta.reverse_line_moves,
            betPercent: signal.meta.bet_percent,
            moneyPercent: signal.meta.money_percent,
            expertUserIds: signal.meta.expert_user_ids,
            opposingExpertUserIds: signal.meta.opposing_expert_user_ids,
          }
        : undefined,
    }));
  };

  return {
    spread: proReport.spread
      ? {
          away: transformSignals(proReport.spread.away),
          home: transformSignals(proReport.spread.home),
        }
      : undefined,
    moneyline: proReport.moneyline
      ? {
          away: transformSignals(proReport.moneyline.away),
          home: transformSignals(proReport.moneyline.home),
        }
      : undefined,
    total: proReport.total
      ? {
          over: transformSignals(proReport.total.over),
          under: transformSignals(proReport.total.under),
        }
      : undefined,
  };
}

type SportKey = keyof typeof SPORTS_CONFIG;

// Direct AWS DynamoDB client configuration
const dynamoDBClient = new DynamoDBClient({
  region: process.env.REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID!,
    secretAccessKey: process.env.SECRET_ACCESS_KEY!,
  },
});

/**
 * Calculate public betting sentiment averages across sportsbooks
 * Only includes sportsbooks that have bet_info with non-zero percentages
 */
function calculatePublicBettingSentiment(
  markets: any
): PublicBettingSentiment | undefined {
  if (!markets || typeof markets !== "object") {
    return undefined;
  }

  const sentiment: PublicBettingSentiment = {};

  // Track aggregated data for each bet type
  const moneylineData = {
    homeTickets: [],
    homeMoney: [],
    awayTickets: [],
    awayMoney: [],
  } as any;
  const spreadData = {
    homeTickets: [],
    homeMoney: [],
    awayTickets: [],
    awayMoney: [],
  } as any;
  const totalData = {
    overTickets: [],
    overMoney: [],
    underTickets: [],
    underMoney: [],
  } as any;

  // Process each sportsbook's markets
  for (const [, market] of Object.entries(markets)) {
    const marketData = market as any;
    if (!marketData?.event) continue;

    // Process moneyline bet_info
    if (
      marketData.event.moneyline &&
      Array.isArray(marketData.event.moneyline)
    ) {
      const homeML = marketData.event.moneyline.find(
        (outcome: any) => outcome.side === "home"
      );
      const awayML = marketData.event.moneyline.find(
        (outcome: any) => outcome.side === "away"
      );

      if (homeML?.bet_info && awayML?.bet_info) {
        const homeTicketsPercent = homeML.bet_info.tickets?.percent;
        const awayTicketsPercent = awayML.bet_info.tickets?.percent;
        const homeMoneyPercent = homeML.bet_info.money?.percent;
        const awayMoneyPercent = awayML.bet_info.money?.percent;

        // Only include if we have non-zero percentages
        if (
          homeTicketsPercent > 0 ||
          awayTicketsPercent > 0 ||
          homeMoneyPercent > 0 ||
          awayMoneyPercent > 0
        ) {
          if (homeTicketsPercent !== undefined)
            moneylineData.homeTickets.push(homeTicketsPercent);
          if (awayTicketsPercent !== undefined)
            moneylineData.awayTickets.push(awayTicketsPercent);
          if (homeMoneyPercent !== undefined)
            moneylineData.homeMoney.push(homeMoneyPercent);
          if (awayMoneyPercent !== undefined)
            moneylineData.awayMoney.push(awayMoneyPercent);
        }
      }
    }

    // Process spread bet_info
    if (marketData.event.spread && Array.isArray(marketData.event.spread)) {
      const homeSpread = marketData.event.spread.find(
        (outcome: any) => outcome.side === "home"
      );
      const awaySpread = marketData.event.spread.find(
        (outcome: any) => outcome.side === "away"
      );

      if (homeSpread?.bet_info && awaySpread?.bet_info) {
        const homeTicketsPercent = homeSpread.bet_info.tickets?.percent;
        const awayTicketsPercent = awaySpread.bet_info.tickets?.percent;
        const homeMoneyPercent = homeSpread.bet_info.money?.percent;
        const awayMoneyPercent = awaySpread.bet_info.money?.percent;

        // Only include if we have non-zero percentages
        if (
          homeTicketsPercent > 0 ||
          awayTicketsPercent > 0 ||
          homeMoneyPercent > 0 ||
          awayMoneyPercent > 0
        ) {
          if (homeTicketsPercent !== undefined)
            spreadData.homeTickets.push(homeTicketsPercent);
          if (awayTicketsPercent !== undefined)
            spreadData.awayTickets.push(awayTicketsPercent);
          if (homeMoneyPercent !== undefined)
            spreadData.homeMoney.push(homeMoneyPercent);
          if (awayMoneyPercent !== undefined)
            spreadData.awayMoney.push(awayMoneyPercent);
        }
      }
    }

    // Process total bet_info
    if (marketData.event.total && Array.isArray(marketData.event.total)) {
      const overTotal = marketData.event.total.find(
        (outcome: any) => outcome.side === "over"
      );
      const underTotal = marketData.event.total.find(
        (outcome: any) => outcome.side === "under"
      );

      if (overTotal?.bet_info && underTotal?.bet_info) {
        const overTicketsPercent = overTotal.bet_info.tickets?.percent;
        const underTicketsPercent = underTotal.bet_info.tickets?.percent;
        const overMoneyPercent = overTotal.bet_info.money?.percent;
        const underMoneyPercent = underTotal.bet_info.money?.percent;

        // Only include if we have non-zero percentages
        if (
          overTicketsPercent > 0 ||
          underTicketsPercent > 0 ||
          overMoneyPercent > 0 ||
          underMoneyPercent > 0
        ) {
          if (overTicketsPercent !== undefined)
            totalData.overTickets.push(overTicketsPercent);
          if (underTicketsPercent !== undefined)
            totalData.underTickets.push(underTicketsPercent);
          if (overMoneyPercent !== undefined)
            totalData.overMoney.push(overMoneyPercent);
          if (underMoneyPercent !== undefined)
            totalData.underMoney.push(underMoneyPercent);
        }
      }
    }
  }

  // Calculate averages for moneyline if we have data
  if (
    moneylineData.homeTickets.length > 0 ||
    moneylineData.homeMoney.length > 0
  ) {
    sentiment.moneyline = {
      homeTicketsPercent:
        moneylineData.homeTickets.length > 0
          ? moneylineData.homeTickets.reduce(
              (a: number, b: number) => a + b,
              0
            ) / moneylineData.homeTickets.length
          : 0,
      awayTicketsPercent:
        moneylineData.awayTickets.length > 0
          ? moneylineData.awayTickets.reduce(
              (a: number, b: number) => a + b,
              0
            ) / moneylineData.awayTickets.length
          : 0,
      homeMoneyPercent:
        moneylineData.homeMoney.length > 0
          ? moneylineData.homeMoney.reduce((a: number, b: number) => a + b, 0) /
            moneylineData.homeMoney.length
          : 0,
      awayMoneyPercent:
        moneylineData.awayMoney.length > 0
          ? moneylineData.awayMoney.reduce((a: number, b: number) => a + b, 0) /
            moneylineData.awayMoney.length
          : 0,
      sampleSize: Math.max(
        moneylineData.homeTickets.length,
        moneylineData.homeMoney.length,
        moneylineData.awayTickets.length,
        moneylineData.awayMoney.length
      ),
    };
  }

  // Calculate averages for spread if we have data
  if (spreadData.homeTickets.length > 0 || spreadData.homeMoney.length > 0) {
    sentiment.spread = {
      homeTicketsPercent:
        spreadData.homeTickets.length > 0
          ? spreadData.homeTickets.reduce((a: number, b: number) => a + b, 0) /
            spreadData.homeTickets.length
          : 0,
      awayTicketsPercent:
        spreadData.awayTickets.length > 0
          ? spreadData.awayTickets.reduce((a: number, b: number) => a + b, 0) /
            spreadData.awayTickets.length
          : 0,
      homeMoneyPercent:
        spreadData.homeMoney.length > 0
          ? spreadData.homeMoney.reduce((a: number, b: number) => a + b, 0) /
            spreadData.homeMoney.length
          : 0,
      awayMoneyPercent:
        spreadData.awayMoney.length > 0
          ? spreadData.awayMoney.reduce((a: number, b: number) => a + b, 0) /
            spreadData.awayMoney.length
          : 0,
      sampleSize: Math.max(
        spreadData.homeTickets.length,
        spreadData.homeMoney.length,
        spreadData.awayTickets.length,
        spreadData.awayMoney.length
      ),
    };
  }

  // Calculate averages for totals if we have data
  if (totalData.overTickets.length > 0 || totalData.overMoney.length > 0) {
    sentiment.total = {
      overTicketsPercent:
        totalData.overTickets.length > 0
          ? totalData.overTickets.reduce((a: number, b: number) => a + b, 0) /
            totalData.overTickets.length
          : 0,
      underTicketsPercent:
        totalData.underTickets.length > 0
          ? totalData.underTickets.reduce((a: number, b: number) => a + b, 0) /
            totalData.underTickets.length
          : 0,
      overMoneyPercent:
        totalData.overMoney.length > 0
          ? totalData.overMoney.reduce((a: number, b: number) => a + b, 0) /
            totalData.overMoney.length
          : 0,
      underMoneyPercent:
        totalData.underMoney.length > 0
          ? totalData.underMoney.reduce((a: number, b: number) => a + b, 0) /
            totalData.underMoney.length
          : 0,
      sampleSize: Math.max(
        totalData.overTickets.length,
        totalData.overMoney.length,
        totalData.underTickets.length,
        totalData.underMoney.length
      ),
    };
  }

  // Only return sentiment if we have at least one bet type with data
  if (sentiment.moneyline || sentiment.spread || sentiment.total) {
    return sentiment;
  }

  return undefined;
}

/**
 * VeriPicks Scrape API
 * Handles data ingestion from external sources like Action Network
 * Note: This endpoint allows unauthenticated access for automation
 * Uses direct AWS DynamoDB access with environment credentials
 */

async function handleRequest(request: NextRequest) {
  try {
    // Direct AWS access - no authentication wrapper needed
    console.log(`[SCRAPE API] Request received: ${request.method}`);
    console.log(
      `[SCRAPE API] Environment check: REGION=${
        process.env.REGION
      }, ACCESS_KEY_ID=${!!process.env
        .ACCESS_KEY_ID}, SECRET_ACCESS_KEY=${!!process.env.SECRET_ACCESS_KEY}`
    );

    let action, data;

    if (request.method === "GET") {
      // Extract parameters from URL for GET requests
      const url = new URL(request.url);
      action = url.searchParams.get("action") || "fetch_live_data";

      // If no sports parameter provided, scrape all available sports
      const sportsParam = url.searchParams.get("sports");
      const numParam = url.searchParams.get("num");
      const numGames = numParam ? parseInt(numParam, 10) : undefined;
      const sports = sportsParam
        ? sportsParam.split(",")
        : Object.keys(API_ENDPOINTS); // Use all available sports

      console.log(
        `[SCRAPE API] GET request - Sports param: ${sportsParam}, Num games: ${numGames}, Using sports:`,
        sports
      );
      data = { sports, numGames };
    } else {
      // Extract from body for POST requests
      const body = await request.json();
      action = body.action;
      data = body.data;
      console.log(
        `[SCRAPE API] POST request - action: ${action}, data:`,
        JSON.stringify(data, null, 2)
      );
    }

    if (!action) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required field: action",
        },
        { status: 400 }
      );
    }

    console.log(`[SCRAPE API] About to execute action: ${action}`);

    let result;

    switch (action) {
      case "scrape_games":
        console.log(`[SCRAPE API] Executing scrape_games`);
        result = await scrapeGames(data);
        break;
      case "scrape_teams":
        console.log(`[SCRAPE API] Executing scrape_teams`);
        result = await scrapeTeams(data);
        break;
      case "bulk_import":
        console.log(`[SCRAPE API] Executing bulk_import`);
        result = await bulkImport(data);
        break;
      case "fetch_live_data":
        console.log(`[SCRAPE API] Executing fetch_live_data`);
        result = await fetchLiveData(data);
        break;
      default:
        return NextResponse.json(
          {
            success: false,
            error: `Unknown action: ${action}`,
          },
          { status: 400 }
        );
    }

    console.log(`[SCRAPE API] Action ${action} completed successfully`);
    return NextResponse.json({
      success: true,
      action,
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in scrape API:", error);
    console.error(
      "Error stack:",
      error instanceof Error ? error.stack : "No stack trace"
    );
    return NextResponse.json(
      {
        success: false,
        error: "Scrape operation failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Export both GET and POST handlers
export async function GET(request: NextRequest) {
  return handleRequest(request);
}

export async function POST(request: NextRequest) {
  return handleRequest(request);
}

/**
 * Fetch live data from Action Network API for multiple sports
 */
async function fetchLiveData(requestData: {
  sports?: SportKey[];
  apiKey?: string;
  numGames?: number;
}) {
  // Default to all available sports if none specified
  const { sports = Object.keys(API_ENDPOINTS) as SportKey[], numGames } =
    requestData;

  const results = {
    sports: [] as Array<{
      sport: string;
      games: number;
      teams: number;
      errors: string[];
    }>,
    summary: {
      totalGames: 0,
      totalTeams: 0,
      errors: [] as string[],
    },
  };

  for (const sport of sports) {
    try {
      console.log(`Starting ${sport.toUpperCase()}`);

      const sportResult = {
        sport,
        games: 0,
        teams: 0,
        errors: [] as string[],
      };

      // Fetch data from Action Network API
      const baseUrl = API_ENDPOINTS[sport];
      if (!baseUrl) {
        throw new Error(`Unsupported sport: ${sport}`);
      }

      // Build URL with parameters
      const url = new URL(baseUrl);

      // Add standard parameters for comprehensive data
      url.searchParams.append("bookIds", "15,30,79,2988,75,123,71,69,68");
      url.searchParams.append("periods", "event");

      // Add current date to ensure we get the most current betting lines
      const currentDate = new Date()
        .toISOString()
        .slice(0, 10)
        .replace(/-/g, "");
      url.searchParams.append("date", currentDate);

      const response = await fetch(url.toString(), {
        headers: {
          "User-Agent": "VeriPicks/1.0",
          Accept: "application/json",
          Authorization: `Bearer ${ACTION_NETWORK_API_KEY}`,
        },
      });

      if (!response.ok) {
        throw new Error(
          `Action Network API error: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();

      // Extract and process teams from games
      const teamsMap = new Map();
      const gamesWithTeams = [];

      // Process each game and extract teams
      for (const game of data.games || []) {
        if (game.teams && Array.isArray(game.teams)) {
          // Extract team info for "team vs team" log
          const teamNames = game.teams
            .map((team: any) => team.abbr || team.short_name || team.full_name)
            .join(" vs ");
          console.log(teamNames);

          for (const team of game.teams) {
            if (!teamsMap.has(team.id)) {
              // Enhanced team data processing for different sports with proper type conversion
              const teamData: Partial<Team> = {
                teamId: randomUUID(),
                team_id: team.id,
                name: String(team.full_name || "Unknown Team"),
                abbreviation: String(team.abbr || team.short_name || "UNK"),
                displayName: String(
                  team.display_name || team.full_name || "Unknown Team"
                ),
                shortName: String(team.short_name || team.abbr || "UNK"),
                location: String(team.location || ""),
                logo: team.logo ? String(team.logo) : undefined,
                primaryColor: team.primary_color
                  ? String(team.primary_color)
                  : undefined,
                secondaryColor: team.secondary_color
                  ? String(team.secondary_color)
                  : undefined,
                urlSlug: team.url_slug ? String(team.url_slug) : undefined,
                core_id:
                  team.core_id !== undefined && team.core_id !== null
                    ? Number(team.core_id)
                    : undefined,
                sport: SPORTS_CONFIG[sport] as any,
                league: String(sport.toUpperCase()),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                dataSource: "action_network",
                lastSyncAt: new Date().toISOString(),
              };

              // Add sport-specific team data with proper type conversion
              if (team.conference_type) {
                teamData.conference = String(team.conference_type);
              }
              if (team.division_type) {
                teamData.division = String(team.division_type);
              }

              // Add standings if available with proper type conversion
              if (team.standings) {
                teamData.record = {
                  win:
                    team.standings.win !== undefined
                      ? Number(team.standings.win)
                      : 0,
                  loss:
                    team.standings.loss !== undefined
                      ? Number(team.standings.loss)
                      : 0,
                  ties:
                    team.standings.ties !== undefined
                      ? Number(team.standings.ties)
                      : 0,
                  overtimeLosses:
                    team.standings.overtime_losses !== undefined
                      ? Number(team.standings.overtime_losses)
                      : 0,
                  draw:
                    team.standings.draw !== undefined
                      ? Number(team.standings.draw)
                      : 0,
                };
              }

              teamsMap.set(team.id, teamData);
            }
          }
        }

        // Extract and prepare team data for embedding in the Game object
        let homeTeamData = null;
        let awayTeamData = null;

        if (game.teams && Array.isArray(game.teams)) {
          // Find home and away teams from the teams array
          for (const team of game.teams) {
            const teamData: Partial<Team> = {
              teamId: randomUUID(),
              team_id: team.id,
              name: String(team.full_name || "Unknown Team"),
              abbreviation: String(team.abbr || team.short_name || "UNK"),
              displayName: String(
                team.display_name || team.full_name || "Unknown Team"
              ),
              shortName: String(team.short_name || team.abbr || "UNK"),
              location: String(team.location || ""),
              logo: team.logo ? String(team.logo) : undefined,
              primaryColor: team.primary_color
                ? String(team.primary_color)
                : undefined,
              secondaryColor: team.secondary_color
                ? String(team.secondary_color)
                : undefined,
              urlSlug: team.url_slug ? String(team.url_slug) : undefined,
              core_id:
                team.core_id !== undefined && team.core_id !== null
                  ? Number(team.core_id)
                  : undefined,
              sport: SPORTS_CONFIG[sport] as any,
              league: String(sport.toUpperCase()),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              dataSource: "action_network",
              lastSyncAt: new Date().toISOString(),
            };

            // Add sport-specific team data
            if (team.conference_type) {
              teamData.conference = String(team.conference_type);
            }
            if (team.division_type) {
              teamData.division = String(team.division_type);
            }

            // Add standings if available
            if (team.standings) {
              teamData.record = {
                win:
                  team.standings.win !== undefined
                    ? Number(team.standings.win)
                    : 0,
                loss:
                  team.standings.loss !== undefined
                    ? Number(team.standings.loss)
                    : 0,
                ties:
                  team.standings.ties !== undefined
                    ? Number(team.standings.ties)
                    : 0,
                overtimeLosses:
                  team.standings.overtime_losses !== undefined
                    ? Number(team.standings.overtime_losses)
                    : 0,
                draw:
                  team.standings.draw !== undefined
                    ? Number(team.standings.draw)
                    : 0,
              };
            }

            // Determine if this is home or away team
            if (String(team.id) === String(game.home_team_id)) {
              homeTeamData = teamData;
            } else if (String(team.id) === String(game.away_team_id)) {
              awayTeamData = teamData;
            }
          }
        }

        // Transform game data with enhanced fields and proper type conversion
        const transformedGame: Partial<Game> = {
          gameId: randomUUID(),
          id: game.id,
          sport: SPORTS_CONFIG[sport] as any,
          league: sport.toUpperCase() as any,
          season: String(
            game.season?.toString() || new Date().getFullYear().toString()
          ),
          homeTeamId: homeTeamData?.teamId || randomUUID(), // Use UUID from team processing
          awayTeamId: awayTeamData?.teamId || randomUUID(), // Use UUID from team processing
          winningTeamId: game.winning_team_id
            ? teamsMap.get(game.winning_team_id)?.teamId || randomUUID()
            : undefined,
          scheduledTime: String(game.start_time),
          status: mapActionNetworkStatus(game.status),
          realStatus: String(game.real_status), // Add explicit real_status field
          statusDisplay: game.status_display
            ? String(game.status_display)
            : undefined,
          gameType: String(game.type), // reg, post, pre
          league_id:
            data.league?.id !== undefined ? Number(data.league.id) : undefined,
          venue: game.venue ? String(game.venue) : undefined,
          attendance:
            game.attendance !== undefined && game.attendance !== null
              ? Number(game.attendance)
              : undefined,
          coverage: String(game.coverage || "full"),
          isFree: Boolean(game.is_free),
          trending: Boolean(game.trending),
          numBets:
            game.num_bets !== undefined && game.num_bets !== null
              ? Number(game.num_bets)
              : undefined,
          coreId:
            game.core_id !== undefined && game.core_id !== null
              ? Number(game.core_id)
              : undefined,
          hasOdds: Boolean(
            game.markets && Object.keys(game.markets).length > 0
          ),
          // Embed team data directly in the Game object
          homeTeam: homeTeamData as Team | undefined,
          awayTeam: awayTeamData as Team | undefined,
          // Add comprehensive critical fields
          boxscore: game.boxscore || undefined, // JSON boxscore data
          broadcast: game.broadcast || undefined, // JSON broadcast info
          hasBestOdds: game.has_best_odds || undefined, // JSON best odds data
          lastPlay: game.last_play || undefined, // JSON last play info
          markets: game.markets || undefined, // JSON markets data for timeseries
          // Calculate public betting sentiment from markets
          publicBetting: game.markets
            ? calculatePublicBettingSentiment(game.markets)
            : undefined,
          // Add expert picks from pro_report when available
          proReport: transformProReport(game.pro_report), // Expert analysis and picks
          dataSource: "action_network",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastSyncAt: new Date().toISOString(),
        };

        // Add sport-specific fields with proper type conversion
        if (sport === "nfl" || sport === "ncaaf") {
          transformedGame.week =
            game.week !== undefined && game.week !== null
              ? Number(game.week)
              : undefined;
        }

        // Add rotation numbers if available with proper type conversion
        if (game.away_rotation_number || game.home_rotation_number) {
          transformedGame.rotationNumbers = {
            away:
              game.away_rotation_number !== undefined
                ? Number(game.away_rotation_number)
                : 0,
            home:
              game.home_rotation_number !== undefined
                ? Number(game.home_rotation_number)
                : 0,
          };
        }

        // Add metadata
        if (game.meta) {
          transformedGame.meta = game.meta;
        }

        // Add TTL for cleanup (90 days for completed games) with proper type conversion
        if (game.status === "completed") {
          const ninetyDaysFromNow = new Date();
          ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90);
          transformedGame.expiresAt = Number(
            Math.floor(ninetyDaysFromNow.getTime() / 1000)
          );

          // Update line movement outcomes if game has score data
          if (
            transformedGame.score &&
            transformedGame.score.homeScore !== undefined &&
            transformedGame.score.awayScore !== undefined
          ) {
            const finalTotal =
              transformedGame.score.homeScore + transformedGame.score.awayScore;
            await updateLineMovementOutcomes(
              transformedGame.gameId!,
              {
                home: transformedGame.score!.homeScore,
                away: transformedGame.score!.awayScore,
              },
              finalTotal
            );
          }
        }

        gamesWithTeams.push(transformedGame);

        // Log the transformed game summary
        console.log(
          `[${sport.toUpperCase()}] Transformed Game ${game.id} -> UUID: ${
            transformedGame.gameId
          }, Teams: ${transformedGame.homeTeamId} vs ${
            transformedGame.awayTeamId
          }`
        );

        // Note: Line movement creation will be handled in scrapeGames function
        // where we know the actual gameId (existing or new)
      }

      // Store teams
      const teamsArray = Array.from(teamsMap.values());

      // Log processing summary before storing data
      console.log(`[${sport.toUpperCase()}] Processing Summary:`);
      console.log(`  - Unique teams found: ${teamsArray.length}`);
      console.log(`  - Games to process: ${gamesWithTeams.length}`);

      if (teamsArray.length > 0) {
        const teamsResult = await scrapeTeams(teamsArray);
        sportResult.teams = teamsResult.created + teamsResult.updated;
        sportResult.errors.push(
          ...teamsResult.errors.map((e) => `Team ${e.teamId}: ${e.error}`)
        );
      }

      // Store games
      if (gamesWithTeams.length > 0) {
        const gamesResult = await scrapeGames(gamesWithTeams, numGames);
        sportResult.games = gamesResult.created + gamesResult.updated;
        sportResult.errors.push(
          ...gamesResult.errors.map((e) => `Game ${e.gameId}: ${e.error}`)
        );
      }

      results.sports.push(sportResult);
      results.summary.totalGames += sportResult.games;
      results.summary.totalTeams += sportResult.teams;
    } catch (error) {
      const errorMsg = `${sport}: ${
        error instanceof Error ? error.message : "Unknown error"
      }`;
      results.summary.errors.push(errorMsg);
      results.sports.push({
        sport,
        games: 0,
        teams: 0,
        errors: [errorMsg],
      });
    }
  }

  return results;
}

/**
 * Scrape and store games data with comprehensive attribute preservation and market change tracking
 * - Ensures Game.id uniqueness by using Action Network ID as the primary key
 * - Smart merge logic prevents overwriting existing attributes with undefined values
 * - Tracks market changes in captify-veripicks-MarketChange table
 * - Ensures no data loss during updates while maintaining latest values
 */
async function scrapeGames(gamesData: any[], numGames?: number) {
  const results = {
    processed: 0,
    created: 0,
    updated: 0,
    marketChanges: 0,
    lineMovements: 0,
    errors: [] as Array<{ gameId: any; error: string }>,
  };

  // Limit to specified number of games if provided
  const gamesToProcess = numGames ? gamesData.slice(0, numGames) : gamesData;

  if (numGames) {
    console.log(
      `LIMITING: Processing only ${gamesToProcess.length} game(s) out of ${gamesData.length} total games`
    );
  }

  for (const gameData of gamesToProcess) {
    try {
      results.processed++;
      console.log(
        `\n--- Processing Game ${results.processed}/${gamesToProcess.length} ---`
      );

      // Check if game already exists by Action Network ID (using 'id' field which should be unique)
      console.log(
        `[SCRAPE] Checking for existing game with Action Network ID: ${
          gameData.id
        } (type: ${typeof gameData.id})`
      );

      const existingResult = await dynamoDBClient.send(
        new QueryCommand({
          TableName: "captify-veripicks-Game",
          IndexName: "id-index", // GSI on the id field
          KeyConditionExpression: "#id = :externalId",
          ExpressionAttributeNames: {
            "#id": "id",
          },
          ExpressionAttributeValues: {
            ":externalId": { N: gameData.id.toString() }, // number as DynamoDB attribute
          },
          Limit: 1,
        })
      );

      const now = new Date().toISOString();

      const existingGames =
        existingResult.Items?.map((item: Record<string, any>) => unmarshall(item)) || [];

      if (existingGames.length > 0) {
        console.log(`game exists`);
        const existingGame = existingGames[0];
        let gameOperations = 0;

        // Track market changes before updating
        const hasChanges = await trackMarketChanges(
          existingGame as Game,
          gameData as Game,
          dynamoDBClient
        );

        if (hasChanges) {
          results.marketChanges++;
        }

        // Create updated game by merging new data without overwriting existing attributes with undefined
        const updatedGame = {
          ...existingGame, // Start with all existing attributes
          // Only update fields that have actual values (not undefined/null)
          ...Object.fromEntries(
            Object.entries(gameData).filter(
              ([, value]) =>
                value !== undefined && value !== null && value !== ""
            )
          ),
          // Always update these timestamp fields
          updatedAt: now,
          lastSyncAt: now,
          // Ensure gameId is preserved from existing record
          gameId: existingGame.gameId,
          id: existingGame.id, // Preserve id field
        } as Game;

        await dynamoDBClient.send(
          new PutItemCommand({
            TableName: "captify-veripicks-Game",
            Item: marshall(updatedGame, { removeUndefinedValues: true }),
          })
        );
        results.updated++;
        gameOperations++;

        // Create line movement entry for updated game
        if (gameData.markets) {
          const movementCount = await createLineMovementEntry(
            existingGame.gameId, // Use existing gameId
            gameData.markets,
            now
          );
          results.lineMovements += movementCount;
          if (movementCount > 0) {
            gameOperations++;
          }
        }

        console.log(
          `Game ${
            gameData.id
          }: ${gameOperations} database operations (1 update${
            gameData.markets && results.lineMovements > 0
              ? ", line movements detected"
              : ", no line movements"
          })`
        );
      } else {
        // Create new game with comprehensive attribute mapping
        console.log(`game added`);
        let gameOperations = 0;

        const newGame: Game = {
          gameId: randomUUID(),
          id: Number(gameData.id), // Use id field with number type
          sport: gameData.sport as any, // Cast to Sport enum
          league: gameData.league as any, // Cast to League enum
          season: String(gameData.season || "2025"),
          homeTeamId: String(gameData.homeTeamId),
          awayTeamId: String(gameData.awayTeamId),
          scheduledTime: String(gameData.scheduledTime || gameData.start_time),
          status: mapActionNetworkStatus(gameData.status || "scheduled"),
          realStatus: String(
            gameData.real_status || gameData.realStatus || gameData.status
          ), // Add real_status field
          gameType: String(gameData.type || "reg"),
          hasOdds: Boolean(gameData.hasOdds),
          createdAt: now,
          updatedAt: now,
          dataSource: "action_network",
          lastSyncAt: now,
          // Embed team data directly in the Game object
          homeTeam: gameData.homeTeam,
          awayTeam: gameData.awayTeam,
          // Add comprehensive numeric fields with safe conversion
          leagueId:
            gameData.leagueId !== undefined && gameData.leagueId !== null
              ? Number(gameData.leagueId)
              : undefined,
          numBets:
            gameData.numBets !== undefined && gameData.numBets !== null
              ? Number(gameData.numBets)
              : undefined,
          coreId:
            gameData.coreId !== undefined && gameData.coreId !== null
              ? Number(gameData.coreId)
              : undefined,
          attendance:
            gameData.attendance !== undefined && gameData.attendance !== null
              ? Number(gameData.attendance)
              : undefined,
          point:
            gameData.point !== undefined && gameData.point !== null
              ? Number(gameData.point)
              : undefined,
          week:
            gameData.week !== undefined && gameData.week !== null
              ? Number(gameData.week)
              : undefined,
          expiresAt:
            gameData.expiresAt !== undefined && gameData.expiresAt !== null
              ? Number(gameData.expiresAt)
              : undefined,
          // Add comprehensive string fields with safe conversion
          winningTeamId: gameData.winningTeamId
            ? String(gameData.winningTeamId)
            : undefined,
          venue: gameData.venue ? String(gameData.venue) : undefined,
          statusDisplay: gameData.statusDisplay
            ? String(gameData.statusDisplay)
            : undefined,
          coverage: gameData.coverage ? String(gameData.coverage) : undefined,
          details: gameData.details ? String(gameData.details) : undefined,
          clock: gameData.clock ? String(gameData.clock) : undefined,
          notes: gameData.notes ? String(gameData.notes) : undefined,
          lastModified: gameData.lastModified
            ? String(gameData.lastModified)
            : undefined,
          gameNotes: gameData.gameNotes
            ? String(gameData.gameNotes)
            : undefined,
          situationCode: gameData.situationCode
            ? String(gameData.situationCode)
            : undefined,
          // Add boolean fields
          isFree: Boolean(gameData.isFree),
          trending: Boolean(gameData.trending),
          neutralSite:
            gameData.neutralSite !== undefined
              ? Boolean(gameData.neutralSite)
              : undefined,
          // Add complex object fields
          rotationNumbers: gameData.rotationNumbers || undefined,
          broadcast: gameData.broadcast || undefined, // JSON broadcast data
          meta: gameData.meta || undefined,
          boxscore: gameData.boxscore || undefined, // JSON boxscore data
          hasBestOdds: gameData.hasBestOdds || undefined, // JSON best odds data
          lastPlay: gameData.lastPlay || undefined, // JSON last play info
          markets: gameData.markets || undefined, // JSON markets data for timeseries
          publicBetting: gameData.publicBetting || undefined, // Public betting sentiment
          proReport: transformProReport(gameData.proReport), // Expert analysis and picks
          injuries: gameData.injuries || undefined, // Injury reports
          odds: gameData.odds || undefined, // Current odds
          periods: gameData.periods || undefined, // Period-by-period scores
          weather: gameData.weather || undefined, // Weather conditions
          referees: gameData.referees || undefined, // Referee assignments
        } as any; // Type assertion to handle additional fields

        try {
          await dynamoDBClient.send(
            new PutItemCommand({
              TableName: "captify-veripicks-Game",
              Item: marshall(newGame, { removeUndefinedValues: true }),
              ConditionExpression: "attribute_not_exists(#id)", // Only create if id doesn't exist
              ExpressionAttributeNames: {
                "#id": "id",
              },
            })
          );
          results.created++;
          gameOperations++;

          // Create line movement entry for new game
          if (gameData.markets) {
            const movementCount = await createLineMovementEntry(
              newGame.gameId, // Use new gameId
              gameData.markets,
              now
            );
            results.lineMovements += movementCount;
            if (movementCount > 0) {
              gameOperations++;
            }
          }

          console.log(
            `Game ${
              gameData.id
            }: ${gameOperations} database operations (1 insert${
              gameData.markets && results.lineMovements > 0
                ? ", baseline lines saved"
                : ", no lines to save"
            })`
          );
        } catch (createError: any) {
          if (createError.name === "ConditionalCheckFailedException") {
            console.log(
              `[SCRAPE] Game ${gameData.id} already exists (conditional check failed) - treating as update`
            );
            results.updated++;
          } else {
            throw createError; // Re-throw other errors
          }
        }
      }
    } catch (error) {
      results.errors.push({
        gameId: gameData.id,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Log final summary
  console.log(`\n--- GAME PROCESSING SUMMARY ---`);
  console.log(`Total games processed: ${results.processed}`);
  console.log(`Games created: ${results.created}`);
  console.log(`Games updated: ${results.updated}`);
  console.log(`Market changes detected: ${results.marketChanges}`);
  console.log(`Line movements created: ${results.lineMovements}`);
  console.log(`Errors: ${results.errors.length}`);
  console.log(`--- END SUMMARY ---\n`);

  return results;
}

/**
 * Scrape and store teams data
 */
async function scrapeTeams(teamsData: any[]) {
  const results = {
    processed: 0,
    created: 0,
    updated: 0,
    errors: [] as Array<{ teamId: any; error: string }>,
  };

  for (const teamData of teamsData) {
    try {
      results.processed++;

      // Check if team already exists by team_id
      const existingResult = await dynamoDBClient.send(
        new ScanCommand({
          TableName: "captify-veripicks-Team",
          FilterExpression: "team_id = :externalId",
          ExpressionAttributeValues: marshall({
            ":externalId": teamData.team_id || teamData.id || "unknown",
          }),
          Limit: 1,
        })
      );

      const now = new Date().toISOString();

      const existingTeams =
        existingResult.Items?.map((item: Record<string, any>) => unmarshall(item)) || [];
      if (existingTeams.length > 0) {
        // Update existing team
        const existingTeam = existingTeams[0];
        const updatedTeam: Team = {
          ...existingTeam,
          teamId: existingTeam.teamId,
          team_id: existingTeam.team_id,
          createdAt: existingTeam.createdAt,
          name: teamData.full_name || teamData.name,
          abbreviation: teamData.abbr || teamData.abbreviation,
          displayName: teamData.display_name || teamData.displayName,
          shortName: teamData.short_name || teamData.shortName,
          location: teamData.location,
          logo: teamData.logo,
          primaryColor: teamData.primary_color,
          secondaryColor: teamData.secondary_color,
          conference: teamData.conference_type,
          division: teamData.division_type,
          record: teamData.standings,
          urlSlug: teamData.url_slug,
          core_id: teamData.core_id,
          updatedAt: now,
        };

        await dynamoDBClient.send(
          new PutItemCommand({
            TableName: "captify-veripicks-Team",
            Item: marshall(updatedTeam, { removeUndefinedValues: true }),
          })
        );
        results.updated++;
      } else {
        // Create new team with proper type conversions
        const newTeam: Team = {
          teamId: randomUUID(),
          team_id: teamData.team_id || teamData.id,
          name: String(
            teamData.full_name ||
              teamData.name ||
              teamData.displayName ||
              "Unknown Team"
          ),
          abbreviation: String(
            teamData.abbr ||
              teamData.abbreviation ||
              teamData.shortName ||
              "UNK"
          ),
          displayName: String(
            teamData.display_name ||
              teamData.displayName ||
              teamData.name ||
              "Unknown Team"
          ),
          shortName: String(
            teamData.short_name ||
              teamData.shortName ||
              teamData.abbreviation ||
              "UNK"
          ),
          location: String(teamData.location || ""),
          logo: teamData.logo ? String(teamData.logo) : undefined,
          primaryColor: teamData.primary_color
            ? String(teamData.primary_color)
            : teamData.primaryColor
            ? String(teamData.primaryColor)
            : undefined,
          secondaryColor: teamData.secondary_color
            ? String(teamData.secondary_color)
            : teamData.secondaryColor
            ? String(teamData.secondaryColor)
            : undefined,
          conference: teamData.conference_type
            ? String(teamData.conference_type)
            : teamData.conference
            ? String(teamData.conference)
            : undefined,
          division: teamData.division_type
            ? String(teamData.division_type)
            : teamData.division
            ? String(teamData.division)
            : undefined,
          record: teamData.standings || teamData.record || undefined,
          urlSlug: teamData.url_slug
            ? String(teamData.url_slug)
            : teamData.urlSlug
            ? String(teamData.urlSlug)
            : undefined,
          core_id:
            teamData.core_id !== undefined && teamData.core_id !== null
              ? Number(teamData.core_id)
              : teamData.coreId !== undefined && teamData.coreId !== null
              ? Number(teamData.coreId)
              : undefined,
          sport: teamData.sport as any, // Cast to Sport enum
          league: teamData.league as any, // Cast to League enum
          dataSource: "action_network",
          lastSyncAt: now,
          createdAt: now,
          updatedAt: now,
        };

        await dynamoDBClient.send(
          new PutItemCommand({
            TableName: "captify-veripicks-Team",
            Item: marshall(newTeam, { removeUndefinedValues: true }),
          })
        );
        results.created++;
      }
    } catch (error) {
      results.errors.push({
        teamId: teamData.id,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return results;
}

/**
 * Scrape and store odds data
 */

/**
 * Create line movement entry for tracking odds changes over time
 * This function detects actual line movements by comparing current odds with previous odds
 */
async function createLineMovementEntry(
  gameId: string,
  markets: any,
  timestamp: string
) {
  try {
    console.log(`  Checking for actual line movements...`);
    let movementsSaved = 0;

    for (const [bookId, market] of Object.entries(markets)) {
      const marketData = market as any;

      if (marketData?.event) {
        // Process moneyline - check for odds changes
        if (
          marketData.event.moneyline &&
          Array.isArray(marketData.event.moneyline)
        ) {
          for (const outcome of marketData.event.moneyline) {
            if (outcome.odds && outcome.side) {
              // Get previous line to compare
              const previousMovement = await getPreviousLineMovement(
                String(gameId),
                Number(bookId),
                "moneyline",
                outcome.side
              );

              const currentOdds = Number(outcome.odds);

              // Only save if there's an actual change
              if (
                previousMovement &&
                previousMovement.newOdds !== currentOdds
              ) {
                const change = currentOdds - previousMovement.newOdds;

                // Skip if change is zero (this shouldn't happen due to the condition above, but safety check)
                if (change === 0) {
                  continue;
                }

                const lineMovement = {
                  movementId: randomUUID(),
                  id: `${gameId}-${timestamp}-${bookId}-moneyline-${outcome.side}`,
                  gameId: String(gameId),
                  timestamp: String(timestamp),
                  bookId: Number(bookId),
                  marketType: "moneyline" as const,
                  side: outcome.side as "home" | "away",

                  // Track the change
                  oldLine: previousMovement.newOdds,
                  newLine: currentOdds,
                  oldOdds: previousMovement.newOdds,
                  newOdds: currentOdds,
                  change: change,
                  movementDirection: change > 0 ? "up" : "down",

                  // Public betting data
                  publicBetting: outcome.bet_info
                    ? {
                        tickets: outcome.bet_info.tickets
                          ? {
                              percent: Number(outcome.bet_info.tickets.percent),
                              value: outcome.bet_info.tickets.value
                                ? Number(outcome.bet_info.tickets.value)
                                : undefined,
                            }
                          : undefined,
                        money: outcome.bet_info.money
                          ? {
                              percent: Number(outcome.bet_info.money.percent),
                              value: outcome.bet_info.money.value
                                ? Number(outcome.bet_info.money.value)
                                : undefined,
                            }
                          : undefined,
                      }
                    : undefined,

                  // Action Network references
                  outcomeId: outcome.outcome_id
                    ? Number(outcome.outcome_id)
                    : undefined,
                  marketId: outcome.market_id
                    ? Number(outcome.market_id)
                    : undefined,

                  // Metadata
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  expiresAt: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
                };

                await dynamoDBClient.send(
                  new PutItemCommand({
                    TableName: "captify-veripicks-LineMovement",
                    Item: marshall(lineMovement, {
                      removeUndefinedValues: true,
                    }),
                  })
                );

                console.log(
                  `    Book ${bookId} moneyline ${outcome.side}: ${
                    previousMovement.newOdds
                  } → ${currentOdds} (${change > 0 ? "+" : ""}${change})`
                );
                movementsSaved++;
              } else if (
                previousMovement &&
                previousMovement.newOdds === currentOdds
              ) {
                // No change detected, skip logging unless in debug mode
                // console.log(`    Book ${bookId} moneyline ${outcome.side}: no change (${currentOdds})`);
              } else if (!previousMovement) {
                // First time seeing this line - save as baseline (but don't count as movement)
                const lineMovement = {
                  movementId: randomUUID(),
                  id: `${gameId}-${timestamp}-${bookId}-moneyline-${outcome.side}`,
                  gameId: String(gameId),
                  timestamp: String(timestamp),
                  bookId: Number(bookId),
                  marketType: "moneyline" as const,
                  side: outcome.side as "home" | "away",
                  newLine: currentOdds,
                  newOdds: currentOdds,
                  publicBetting: outcome.bet_info
                    ? {
                        tickets: outcome.bet_info.tickets
                          ? {
                              percent: Number(outcome.bet_info.tickets.percent),
                              value: outcome.bet_info.tickets.value
                                ? Number(outcome.bet_info.tickets.value)
                                : undefined,
                            }
                          : undefined,
                        money: outcome.bet_info.money
                          ? {
                              percent: Number(outcome.bet_info.money.percent),
                              value: outcome.bet_info.money.value
                                ? Number(outcome.bet_info.money.value)
                                : undefined,
                            }
                          : undefined,
                      }
                    : undefined,
                  outcomeId: outcome.outcome_id
                    ? Number(outcome.outcome_id)
                    : undefined,
                  marketId: outcome.market_id
                    ? Number(outcome.market_id)
                    : undefined,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  expiresAt: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
                };

                await dynamoDBClient.send(
                  new PutItemCommand({
                    TableName: "captify-veripicks-LineMovement",
                    Item: marshall(lineMovement, {
                      removeUndefinedValues: true,
                    }),
                  })
                );
                // Note: Don't increment movementsSaved for baseline records
              }
            }
          }
        }

        // Process spread - check for value changes
        if (marketData.event.spread && Array.isArray(marketData.event.spread)) {
          for (const outcome of marketData.event.spread) {
            if (outcome.value !== undefined && outcome.side) {
              // Get previous line to compare
              const previousMovement = await getPreviousLineMovement(
                String(gameId),
                Number(bookId),
                "spread",
                outcome.side
              );

              const currentValue = Number(outcome.value);
              const currentOdds = outcome.odds
                ? Number(outcome.odds)
                : undefined;

              // Only save if there's an actual change in value or odds
              if (
                previousMovement &&
                (previousMovement.newLine !== currentValue ||
                  previousMovement.newOdds !== currentOdds)
              ) {
                const valueChange = currentValue - previousMovement.newLine;

                // Skip if change is zero for the main value we're tracking (spread value)
                if (
                  valueChange === 0 &&
                  previousMovement.newOdds === currentOdds
                ) {
                  continue;
                }

                const lineMovement = {
                  movementId: randomUUID(),
                  id: `${gameId}-${timestamp}-${bookId}-spread-${outcome.side}`,
                  gameId: String(gameId),
                  timestamp: String(timestamp),
                  bookId: Number(bookId),
                  marketType: "spread" as const,
                  side: outcome.side as "home" | "away",

                  // Track the change
                  oldLine: previousMovement.newLine,
                  newLine: currentValue,
                  oldOdds: previousMovement.newOdds,
                  newOdds: currentOdds,
                  change: valueChange,
                  movementDirection: valueChange > 0 ? "up" : "down",

                  // Public betting data
                  publicBetting: outcome.bet_info
                    ? {
                        tickets: outcome.bet_info.tickets
                          ? {
                              percent: Number(outcome.bet_info.tickets.percent),
                              value: outcome.bet_info.tickets.value
                                ? Number(outcome.bet_info.tickets.value)
                                : undefined,
                            }
                          : undefined,
                        money: outcome.bet_info.money
                          ? {
                              percent: Number(outcome.bet_info.money.percent),
                              value: outcome.bet_info.money.value
                                ? Number(outcome.bet_info.money.value)
                                : undefined,
                            }
                          : undefined,
                      }
                    : undefined,

                  // Action Network references
                  outcomeId: outcome.outcome_id
                    ? Number(outcome.outcome_id)
                    : undefined,
                  marketId: outcome.market_id
                    ? Number(outcome.market_id)
                    : undefined,

                  // Metadata
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  expiresAt: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
                };

                await dynamoDBClient.send(
                  new PutItemCommand({
                    TableName: "captify-veripicks-LineMovement",
                    Item: marshall(lineMovement, {
                      removeUndefinedValues: true,
                    }),
                  })
                );

                console.log(
                  `    Book ${bookId} spread ${outcome.side}: ${
                    previousMovement.newLine
                  } → ${currentValue} (${
                    valueChange > 0 ? "+" : ""
                  }${valueChange})`
                );
                movementsSaved++;
              } else if (
                previousMovement &&
                previousMovement.newLine === currentValue &&
                previousMovement.newOdds === currentOdds
              ) {
                // No change detected, skip logging unless in debug mode
                // console.log(`    Book ${bookId} spread ${outcome.side}: no change (${currentValue})`);
              } else if (!previousMovement) {
                // First time seeing this line - save as baseline (but don't count as movement)
                const lineMovement = {
                  movementId: randomUUID(),
                  id: `${gameId}-${timestamp}-${bookId}-spread-${outcome.side}`,
                  gameId: String(gameId),
                  timestamp: String(timestamp),
                  bookId: Number(bookId),
                  marketType: "spread" as const,
                  side: outcome.side as "home" | "away",
                  newLine: currentValue,
                  newOdds: currentOdds,
                  publicBetting: outcome.bet_info
                    ? {
                        tickets: outcome.bet_info.tickets
                          ? {
                              percent: Number(outcome.bet_info.tickets.percent),
                              value: outcome.bet_info.tickets.value
                                ? Number(outcome.bet_info.tickets.value)
                                : undefined,
                            }
                          : undefined,
                        money: outcome.bet_info.money
                          ? {
                              percent: Number(outcome.bet_info.money.percent),
                              value: outcome.bet_info.money.value
                                ? Number(outcome.bet_info.money.value)
                                : undefined,
                            }
                          : undefined,
                      }
                    : undefined,
                  outcomeId: outcome.outcome_id
                    ? Number(outcome.outcome_id)
                    : undefined,
                  marketId: outcome.market_id
                    ? Number(outcome.market_id)
                    : undefined,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  expiresAt: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
                };

                await dynamoDBClient.send(
                  new PutItemCommand({
                    TableName: "captify-veripicks-LineMovement",
                    Item: marshall(lineMovement, {
                      removeUndefinedValues: true,
                    }),
                  })
                );
                // Note: Don't increment movementsSaved for baseline records
              }
            }
          }
        }

        // Process total - check for value changes
        if (marketData.event.total && Array.isArray(marketData.event.total)) {
          for (const outcome of marketData.event.total) {
            if (outcome.value !== undefined && outcome.side) {
              // Get previous line to compare
              const previousMovement = await getPreviousLineMovement(
                String(gameId),
                Number(bookId),
                "total",
                outcome.side
              );

              const currentValue = Number(outcome.value);
              const currentOdds = outcome.odds
                ? Number(outcome.odds)
                : undefined;

              // Only save if there's an actual change in value or odds
              if (
                previousMovement &&
                (previousMovement.newLine !== currentValue ||
                  previousMovement.newOdds !== currentOdds)
              ) {
                const valueChange = currentValue - previousMovement.newLine;

                // Skip if change is zero for the main value we're tracking (total value)
                if (
                  valueChange === 0 &&
                  previousMovement.newOdds === currentOdds
                ) {
                  continue;
                }

                const lineMovement = {
                  movementId: randomUUID(),
                  id: `${gameId}-${timestamp}-${bookId}-total-${outcome.side}`,
                  gameId: String(gameId),
                  timestamp: String(timestamp),
                  bookId: Number(bookId),
                  marketType: "total" as const,
                  side: outcome.side as "over" | "under",

                  // Track the change
                  oldLine: previousMovement.newLine,
                  newLine: currentValue,
                  oldOdds: previousMovement.newOdds,
                  newOdds: currentOdds,
                  change: valueChange,
                  movementDirection: valueChange > 0 ? "up" : "down",

                  // Public betting data
                  publicBetting: outcome.bet_info
                    ? {
                        tickets: outcome.bet_info.tickets
                          ? {
                              percent: Number(outcome.bet_info.tickets.percent),
                              value: outcome.bet_info.tickets.value
                                ? Number(outcome.bet_info.tickets.value)
                                : undefined,
                            }
                          : undefined,
                        money: outcome.bet_info.money
                          ? {
                              percent: Number(outcome.bet_info.money.percent),
                              value: outcome.bet_info.money.value
                                ? Number(outcome.bet_info.money.value)
                                : undefined,
                            }
                          : undefined,
                      }
                    : undefined,

                  // Action Network references
                  outcomeId: outcome.outcome_id
                    ? Number(outcome.outcome_id)
                    : undefined,
                  marketId: outcome.market_id
                    ? Number(outcome.market_id)
                    : undefined,

                  // Metadata
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  expiresAt: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
                };

                await dynamoDBClient.send(
                  new PutItemCommand({
                    TableName: "captify-veripicks-LineMovement",
                    Item: marshall(lineMovement, {
                      removeUndefinedValues: true,
                    }),
                  })
                );

                console.log(
                  `    Book ${bookId} total ${outcome.side}: ${
                    previousMovement.newLine
                  } → ${currentValue} (${
                    valueChange > 0 ? "+" : ""
                  }${valueChange})`
                );
                movementsSaved++;
              } else if (
                previousMovement &&
                previousMovement.newLine === currentValue &&
                previousMovement.newOdds === currentOdds
              ) {
                // No change detected, skip logging unless in debug mode
                // console.log(`    Book ${bookId} total ${outcome.side}: no change (${currentValue})`);
              } else if (!previousMovement) {
                // First time seeing this line - save as baseline (but don't count as movement)
                const lineMovement = {
                  movementId: randomUUID(),
                  id: `${gameId}-${timestamp}-${bookId}-total-${outcome.side}`,
                  gameId: String(gameId),
                  timestamp: String(timestamp),
                  bookId: Number(bookId),
                  marketType: "total" as const,
                  side: outcome.side as "over" | "under",
                  newLine: currentValue,
                  newOdds: currentOdds,
                  publicBetting: outcome.bet_info
                    ? {
                        tickets: outcome.bet_info.tickets
                          ? {
                              percent: Number(outcome.bet_info.tickets.percent),
                              value: outcome.bet_info.tickets.value
                                ? Number(outcome.bet_info.tickets.value)
                                : undefined,
                            }
                          : undefined,
                        money: outcome.bet_info.money
                          ? {
                              percent: Number(outcome.bet_info.money.percent),
                              value: outcome.bet_info.money.value
                                ? Number(outcome.bet_info.money.value)
                                : undefined,
                            }
                          : undefined,
                      }
                    : undefined,
                  outcomeId: outcome.outcome_id
                    ? Number(outcome.outcome_id)
                    : undefined,
                  marketId: outcome.market_id
                    ? Number(outcome.market_id)
                    : undefined,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  expiresAt: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
                };

                await dynamoDBClient.send(
                  new PutItemCommand({
                    TableName: "captify-veripicks-LineMovement",
                    Item: marshall(lineMovement, {
                      removeUndefinedValues: true,
                    }),
                  })
                );
                // Note: Don't increment movementsSaved for baseline records
              }
            }
          }
        }
      }
    }

    if (movementsSaved > 0) {
      console.log(`    ${movementsSaved} line movements saved to database`);
    } else {
      console.log(`    No line movements detected (all lines unchanged)`);
    }

    return movementsSaved;
  } catch (error) {
    console.error(
      `Error creating line movement entry for game ${gameId}:`,
      error
    );
    return 0;
  }
}

/**
 * Get the most recent line movement for a specific outcome to detect changes
 */
async function getPreviousLineMovement(
  gameId: string,
  bookId: number,
  marketType: string,
  side: string
): Promise<any | null> {
  try {
    const command = new QueryCommand({
      TableName: "captify-veripicks-LineMovement",
      IndexName: "gameId-index", // Use existing gameId index
      KeyConditionExpression: "gameId = :gameId",
      FilterExpression:
        "bookId = :bookId AND marketType = :marketType AND side = :side",
      ExpressionAttributeValues: marshall({
        ":gameId": gameId,
        ":bookId": bookId,
        ":marketType": marketType,
        ":side": side,
      }),
      ScanIndexForward: false, // Get most recent first
      Limit: 10, // Get more items to account for filtering
    });

    const response: QueryCommandOutput = await dynamoDBClient.send(command);

    if (response.Items && response.Items.length > 0) {
      // Since we're using a filter, we need to find the most recent matching item
      // Items are already sorted by timestamp (newest first) due to ScanIndexForward: false
      return unmarshall(response.Items[0]);
    }

    return null;
  } catch (error) {
    console.error(`Error getting previous line movement:`, error);
    return null;
  }
}

/**
 * Bulk import multiple data types
 */
async function bulkImport(importData: any) {
  const results = {
    games: {
      processed: 0,
      created: 0,
      updated: 0,
      errors: [] as Array<{ gameId: any; error: string }>,
    },
    teams: {
      processed: 0,
      created: 0,
      updated: 0,
      errors: [] as Array<{ teamId: any; error: string }>,
    },
    odds: {
      processed: 0,
      created: 0,
      errors: [] as Array<{ gameId: any; timestamp: any; error: string }>,
    },
  };

  if (importData.games) {
    results.games = await scrapeGames(importData.games);
  }

  if (importData.teams) {
    results.teams = await scrapeTeams(importData.teams);
  }

  return results;
}

/**
 * Track market changes for an existing game
 */
async function trackMarketChanges(
  existingGame: Game,
  newGameData: Game,
  dynamoClient: DynamoDBClient
): Promise<boolean> {
  const changes: string[] = [];

  // Compare markets
  if (compareMarketData(existingGame.markets, newGameData.markets)) {
    changes.push("markets");
  }

  // Compare current odds
  if (compareMarketData(existingGame.currentOdds, newGameData.currentOdds)) {
    changes.push("currentOdds");
  }

  // Check bet count changes
  if (existingGame.numBets !== newGameData.numBets) {
    changes.push("numBets");
    console.log(
      `  Bet Count: ${existingGame.numBets} → ${newGameData.numBets}`
    );
  }

  // If any changes detected, create market change record
  if (changes.length > 0) {
    console.log(`odds changed - ${changes.join(", ")}`);
    await createMarketChangeRecord(
      existingGame,
      newGameData,
      changes,
      dynamoClient
    );
    return true;
  } else {
    console.log(`odds nochange`);
    return false;
  }
}

/**
 * Compare market outcomes to detect changes
 */
function compareMarketData(existing: any, updated: any): boolean {
  if (!existing && !updated) return false;
  if (!existing || !updated) return true;

  // Simple JSON comparison for market data
  return JSON.stringify(existing) !== JSON.stringify(updated);
}

/**
 * Create a market change record in DynamoDB
 */
async function createMarketChangeRecord(
  existingGame: Game,
  newGameData: Game,
  changes: string[],
  dynamoClient: DynamoDBClient
) {
  try {
    const marketChange = {
      changeId: randomUUID(), // Fixed: use changeId instead of id for GameMarketChange
      gameId: existingGame.gameId,
      id: existingGame.id,
      timestamp: new Date().toISOString(),
      changedMarkets: changes,
      beforeValues: {
        markets: existingGame.markets,
        currentOdds: existingGame.currentOdds,
        numBets: existingGame.numBets,
      },
      afterValues: {
        markets: newGameData.markets,
        currentOdds: newGameData.currentOdds,
        numBets: newGameData.numBets,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await dynamoClient.send(
      new PutItemCommand({
        TableName: "captify-veripicks-GameMarketChange",
        Item: marshall(marketChange, { removeUndefinedValues: true }),
      })
    );
  } catch (error) {
    console.error(
      `Error creating market change record for game ${existingGame.id}:`,
      error
    );
  }
}

/**
 * Update line movements with outcome data after game completion
 * This determines if each line/bet covered based on the final game result
 */
async function updateLineMovementOutcomes(
  gameId: string,
  finalScore: { home: number; away: number },
  finalTotal: number
) {
  try {
    // Get all line movements for this game
    const command = new QueryCommand({
      TableName: "captify-veripicks-LineMovement",
      KeyConditionExpression: "gameId = :gameId",
      ExpressionAttributeValues: marshall({
        ":gameId": gameId,
      }),
    });

    const response: QueryCommandOutput = await dynamoDBClient.send(command);

    if (response.Items && response.Items.length > 0) {
      const lineMovements = response.Items.map((item: Record<string, any>) => unmarshall(item));

      for (const movement of lineMovements) {
        let didCover = false;
        const margin = finalScore.home - finalScore.away;

        // Calculate if the line covered based on market type
        switch (movement.marketType) {
          case "moneyline":
            if (movement.side === "home") {
              didCover = finalScore.home > finalScore.away;
            } else if (movement.side === "away") {
              didCover = finalScore.away > finalScore.home;
            }
            break;

          case "spread":
            const spreadLine = movement.newLine;
            if (movement.side === "home") {
              // Home team needs to win by more than the spread
              didCover = margin > Math.abs(spreadLine);
            } else if (movement.side === "away") {
              // Away team needs to lose by less than spread or win
              didCover = margin < -Math.abs(spreadLine);
            }
            break;

          case "total":
            const totalLine = movement.newLine;
            if (movement.side === "over") {
              didCover = finalTotal > totalLine;
            } else if (movement.side === "under") {
              didCover = finalTotal < totalLine;
            }
            break;
        }

        // Update the line movement with outcome data
        const updateCommand = new PutItemCommand({
          TableName: "captify-veripicks-LineMovement",
          Item: marshall(
            {
              ...movement,
              outcome: {
                didCover: didCover,
                finalScore: finalScore,
                margin: margin,
                total: finalTotal,
                gradedAt: new Date().toISOString(),
              },
              updatedAt: new Date().toISOString(),
            },
            { removeUndefinedValues: true }
          ),
        });

        await dynamoDBClient.send(updateCommand);
      }

      console.log(
        `Updated ${lineMovements.length} line movement outcomes for game ${gameId}`
      );
    }
  } catch (error) {
    console.error(
      `Error updating line movement outcomes for game ${gameId}:`,
      error
    );
  }
}
