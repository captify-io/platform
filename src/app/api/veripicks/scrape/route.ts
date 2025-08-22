import { NextRequest, NextResponse } from "next/server";
import {
  Game,
  Team,
  PublicBettingSentiment,
  GameMarketChange,
} from "@captify/veripicks";
import { randomUUID } from "crypto";
import {
  DynamoDBClient,
  PutItemCommand,
  ScanCommand,
  QueryCommand,
  QueryCommandOutput,
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";

const SPORTS_CONFIG = {
  mlb: "baseball",
  nba: "basketball",
  nfl: "football",
  ncaaf: "football",
  ncaab: "basketball",
  wnba: "basketball",
  nhl: "hockey",
} as const;

// Action Network API endpoints by sport
const API_ENDPOINTS = {
  mlb: "https://api.actionnetwork.com/web/v2/scoreboard/proreport/mlb",
  nfl: "https://api.actionnetwork.com/web/v2/scoreboard/proreport/nfl",
  nba: "https://api.actionnetwork.com/web/v2/scoreboard/proreport/nba",
  ncaaf: "https://api.actionnetwork.com/web/v2/scoreboard/proreport/ncaaf",
  ncaab: "https://api.actionnetwork.com/web/v2/scoreboard/proreport/ncaab",
  wnba: "https://api.actionnetwork.com/web/v2/scoreboard/proreport/wnba",
  nhl: "https://api.actionnetwork.com/web/v2/scoreboard/proreport/nhl",
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
  for (const [bookId, market] of Object.entries(markets)) {
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
      const sports = sportsParam
        ? sportsParam.split(",")
        : Object.keys(API_ENDPOINTS); // Use all available sports

      console.log(
        `[SCRAPE API] GET request - Sports param: ${sportsParam}, Using sports:`,
        sports
      );
      data = { sports };
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
}) {
  console.log(
    `[FETCH_LIVE_DATA] Starting with data:`,
    JSON.stringify(requestData, null, 2)
  );
  // Default to all available sports if none specified
  const { sports = Object.keys(API_ENDPOINTS) as SportKey[] } = requestData;
  console.log(`[FETCH_LIVE_DATA] Processing sports:`, sports);

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
        },
      });

      if (!response.ok) {
        throw new Error(
          `Action Network API error: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();

      // Log API response structure for debugging
      console.log(
        `[${sport.toUpperCase()}] API Response keys:`,
        Object.keys(data)
      );
      console.log(`[${sport.toUpperCase()}] Games array exists:`, !!data.games);
      console.log(
        `[${sport.toUpperCase()}] Games array length:`,
        data.games?.length || 0
      );

      // Extract and process teams from games
      const teamsMap = new Map();
      const gamesWithTeams = [];
      // Log the total number of games found
      console.log(
        `[${sport.toUpperCase()}] Found ${
          data.games?.length || 0
        } games in API response`
      );

      // Process each game and extract teams
      for (const game of data.games || []) {
        // Log each game ID being processed
        console.log(`[${sport.toUpperCase()}] Processing Game ID: ${game.id}`);
        if (game.teams && Array.isArray(game.teams)) {
          console.log(
            `[${sport.toUpperCase()}] Game ${game.id} has ${
              game.teams.length
            } teams`
          );
          for (const team of game.teams) {
            if (!teamsMap.has(team.id)) {
              // Enhanced team data processing for different sports with proper type conversion
              const teamData: any = {
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
                coreId:
                  team.core_id !== undefined && team.core_id !== null
                    ? Number(team.core_id)
                    : undefined,
                sport: String(SPORTS_CONFIG[sport]),
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
            const teamData: any = {
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
              coreId:
                team.core_id !== undefined && team.core_id !== null
                  ? Number(team.core_id)
                  : undefined,
              sport: String(SPORTS_CONFIG[sport]),
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
        const transformedGame: any = {
          gameId: randomUUID(),
          id: game.id,
          sport: String(SPORTS_CONFIG[sport]),
          league: String(sport.toUpperCase()),
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
          homeTeam: homeTeamData,
          awayTeam: awayTeamData,
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
          proReport: game.pro_report || undefined, // Expert analysis and picks
          // Add all additional Game interface attributes
          point: game.point !== undefined ? Number(game.point) : undefined,
          details: game.details || undefined,
          injuries: game.injuries || undefined,
          odds: game.odds || undefined,
          periods: game.periods || undefined,
          clock: game.clock || undefined,
          weather: game.weather || undefined,
          referees: game.referees || undefined,
          notes: game.notes || undefined,
          lastModified: game.last_modified || undefined,
          gameNotes: game.game_notes || undefined,
          situationCode: game.situation_code || undefined,
          neutralSite:
            game.neutral_site !== undefined
              ? Boolean(game.neutral_site)
              : undefined,
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
                : undefined,
            home:
              game.home_rotation_number !== undefined
                ? Number(game.home_rotation_number)
                : undefined,
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
              transformedGame.gameId,
              {
                home: transformedGame.score.homeScore,
                away: transformedGame.score.awayScore,
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
        const gamesResult = await scrapeGames(gamesWithTeams);
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
async function scrapeGames(gamesData: any[]) {
  const results = {
    processed: 0,
    created: 0,
    updated: 0,
    marketChanges: 0,
    errors: [] as Array<{ gameId: any; error: string }>,
  };

  for (const gameData of gamesData) {
    try {
      results.processed++;

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

      console.log(
        `[SCRAPE] Query for ID ${gameData.id}: Found ${
          existingResult.Items?.length || 0
        } existing games`
      );

      // Debug: Log what we're comparing
      if (existingResult.Items && existingResult.Items.length > 0) {
        const existingGame = unmarshall(existingResult.Items[0]);
        console.log(
          `[SCRAPE] Found existing game: id=${existingGame.id}, gameId=${existingGame.gameId}`
        );
      }

      const now = new Date().toISOString();

      const existingGames =
        existingResult.Items?.map((item) => unmarshall(item)) || [];

      if (existingGames.length > 0) {
        // Update existing game with market change tracking
        console.log(
          `[SCRAPE] UPDATING existing game ${gameData.id} (gameId: ${existingGames[0].gameId})`
        );
        const existingGame = existingGames[0];

        // Track market changes before updating
        // Track market changes for existing games
        await trackMarketChanges(
          existingGame as Game,
          gameData as Game,
          dynamoDBClient
        );

        // Create updated game by merging new data without overwriting existing attributes with undefined
        const updatedGame = {
          ...existingGame, // Start with all existing attributes
          // Only update fields that have actual values (not undefined/null)
          ...Object.fromEntries(
            Object.entries(gameData).filter(
              ([key, value]) =>
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

        // Create line movement entry for updated game
        if (gameData.markets) {
          await createLineMovementEntry(
            existingGame.gameId, // Use existing gameId
            gameData.markets,
            now
          );
        }
      } else {
        // Create new game with comprehensive attribute mapping
        console.log(`[SCRAPE] CREATING new game ${gameData.id}`);
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
          proReport: gameData.proReport || undefined, // Expert analysis and picks
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
          console.log(`[SCRAPE] Successfully created new game ${gameData.id}`);

          // Create line movement entry for new game
          if (gameData.markets) {
            await createLineMovementEntry(
              newGame.gameId, // Use new gameId
              gameData.markets,
              now
            );
          }
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
        existingResult.Items?.map((item) => unmarshall(item)) || [];
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
    for (const [bookId, market] of Object.entries(markets)) {
      const marketData = market as any;
      if (marketData?.event) {
        for (const [betType, outcomes] of Object.entries(marketData.event)) {
          if (Array.isArray(outcomes)) {
            for (const outcome of outcomes) {
              // Get previous line movement for this outcome to detect changes
              const previousMovement = await getPreviousLineMovement(
                String(gameId),
                Number(bookId),
                String(betType),
                outcome.side
              );

              const currentLine = outcome.odds
                ? Number(outcome.odds)
                : outcome.value
                ? Number(outcome.value)
                : 0;
              const currentOdds = outcome.odds
                ? Number(outcome.odds)
                : undefined;

              // Only create line movement if there's an actual change
              if (
                previousMovement &&
                previousMovement.newLine !== currentLine
              ) {
                const change = currentLine - previousMovement.newLine;

                // Skip if change is zero (should not happen but safety check)
                if (change === 0) {
                  console.log(
                    `Skipping zero change for game ${gameId}, book ${bookId}, ${betType} ${outcome.side}`
                  );
                  continue;
                }

                const movementDirection = change > 0 ? "up" : "down";

                const lineMovement = {
                  movementId: randomUUID(),
                  id: `${gameId}-${timestamp}`,
                  gameId: String(gameId),
                  timestamp: String(timestamp),
                  bookId: Number(bookId),
                  marketType: String(betType) as
                    | "moneyline"
                    | "spread"
                    | "total",
                  side: outcome.side as "home" | "away" | "over" | "under",

                  // Line/Odds changes
                  oldLine: previousMovement.newLine,
                  newLine: currentLine,
                  oldOdds: previousMovement.newOdds,
                  newOdds: currentOdds,
                  change: change,
                  movementDirection: movementDirection,

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
                    : 0,
                  marketId: outcome.market_id ? Number(outcome.market_id) : 0,

                  // Metadata
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  expiresAt: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 days TTL
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
                  `Line movement detected for game ${gameId}, book ${bookId}, ${betType} ${
                    outcome.side
                  }: ${previousMovement.newLine} → ${currentLine} (${
                    change > 0 ? "+" : ""
                  }${change})`
                );
              } else {
                // No previous movement found, but we don't create baseline entries
                // LineMovements are only created when there are actual changes (change != 0)
                console.log(
                  `No previous movement found for game ${gameId}, book ${bookId}, ${betType} ${outcome.side} - will track changes from next update`
                );
              }
            }
          }
        }
      }
    }
  } catch (error) {
    console.error(
      `Error creating line movement entry for game ${gameId}:`,
      error
    );
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
) {
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
  }

  // If any changes detected, create market change record
  if (changes.length > 0) {
    await createMarketChangeRecord(
      existingGame,
      newGameData,
      changes,
      dynamoClient
    );
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

    console.log(`Market change recorded for game ${existingGame.id}:`, changes);
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
      const lineMovements = response.Items.map((item) => unmarshall(item));

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
