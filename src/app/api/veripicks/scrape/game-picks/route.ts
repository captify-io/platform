import { NextRequest, NextResponse } from "next/server";
import {
  DynamoDBClient,
  QueryCommand,
  ScanCommand,
  PutItemCommand,
  marshall,
  unmarshall,
} from "@captify/api";
import {
  ActionUser,
  Pick,
  PickConsensus,
  ActionUserLeagueRecord,
} from "@/../../packages/veripicks/src/types";
import { UUID } from "crypto";

const ACTION_NETWORK_API_KEY = process.env.ACTION_NETWORK_API_KEY;

// Direct AWS DynamoDB client configuration
const dynamoDBClient = new DynamoDBClient({
  region: process.env.REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID!,
    secretAccessKey: process.env.SECRET_ACCESS_KEY!,
  },
});

/**
 * VeriPicks Consolidated Game Picks API
 * Handles complete workflow: fetch games, process picks, upsert users, generate consensus
 */
export async function GET(request: NextRequest) {
  try {
    console.log(`[GAME PICKS API] Request received: ${request.method}`);

    if (!ACTION_NETWORK_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: "ACTION_NETWORK_API_KEY not found in environment variables",
        },
        { status: 500 }
      );
    }

    // Extract parameters from URL
    const url = new URL(request.url);
    const sport = url.searchParams.get("sport");
    const gameParam = url.searchParams.get("game");
    const limit = parseInt(url.searchParams.get("limit") || "10");

    let gameIds: string[] = [];

    // Determine which games to process
    if (sport) {
      console.log(`[GAME PICKS API] Processing by sport: ${sport}`);
      gameIds = await getGameIdsBySport(sport, limit);
    } else if (gameParam) {
      console.log(`[GAME PICKS API] Processing specific games: ${gameParam}`);
      gameIds = gameParam.split(",").map((id) => id.trim());
    } else {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required parameter: sport or game",
          usage:
            "Add ?sport=ncaaf or ?game=223233 or ?game=223233,212322,332322 to the URL",
        },
        { status: 400 }
      );
    }

    if (gameIds.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No games found to process",
        results: {
          gamesProcessed: 0,
          usersCreated: 0,
          usersUpdated: 0,
          picksCreated: 0,
          consensusCreated: 0,
        },
      });
    }

    console.log(`[GAME PICKS API] Processing ${gameIds.length} games`);

    const results = {
      gamesProcessed: 0,
      gamesSuccessful: 0,
      gamesFailed: 0,
      usersCreated: 0,
      usersUpdated: 0,
      picksCreated: 0,
      consensusCreated: 0,
      errors: [] as string[],
      gameResults: [] as any[],
    };

    // Process each game
    for (const gameId of gameIds) {
      try {
        results.gamesProcessed++;
        console.log(`[GAME PICKS API] Processing game: ${gameId}`);

        // Step 1: Fetch Action Network picks data
        const picksData = await fetchActionNetworkPicks(gameId);

        if (!picksData) {
          results.gamesFailed++;
          results.errors.push(`Game ${gameId}: Failed to fetch picks data`);
          continue;
        }

        // Step 2: Process users and picks
        const gameResult = await processGamePicks(gameId, picksData);

        results.gamesSuccessful++;
        results.usersCreated += gameResult.usersCreated;
        results.usersUpdated += gameResult.usersUpdated;
        results.picksCreated += gameResult.picksCreated;
        results.consensusCreated += gameResult.consensusCreated;

        results.gameResults.push({
          gameId,
          status: "success",
          ...gameResult,
        });

        // Small delay to avoid overwhelming the API
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (gameError) {
        results.gamesFailed++;
        const errorMsg =
          gameError instanceof Error ? gameError.message : "Unknown error";
        results.errors.push(`Game ${gameId}: ${errorMsg}`);

        results.gameResults.push({
          gameId,
          status: "failed",
          error: errorMsg,
        });
      }
    }

    return NextResponse.json({
      success: true,
      sport,
      gameParam,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[GAME PICKS API] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Game picks API operation failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * Fetch Action Network picks data for a game
 */
async function fetchActionNetworkPicks(gameId: string) {
  try {
    const apiUrl = `https://api.actionnetwork.com/mobile/v1/games/${gameId}/picks`;

    console.log(`[FETCH PICKS] Fetching picks for game ID: ${gameId}`);

    const response = await fetch(apiUrl, {
      headers: {
        "User-Agent": "VeriPicks/1.0",
        Accept: "application/json",
        Authorization: `Bearer ${ACTION_NETWORK_API_KEY}`,
      },
    });

    if (!response.ok) {
      console.error(
        `[FETCH PICKS] HTTP ${response.status}: ${response.statusText}`
      );
      return null;
    }

    const data = await response.json();
    console.log(
      `[FETCH PICKS] Success: Found ${data.picks?.length || 0} picks`
    );
    return data;
  } catch (error) {
    console.error(
      `[FETCH PICKS] Error fetching picks for game ${gameId}:`,
      error
    );
    return null;
  }
}

/**
 * Get game IDs by sport from our database
 */
async function getGameIdsBySport(
  sport: string,
  limit: number
): Promise<string[]> {
  try {
    const result = await dynamoDBClient.send(
      new ScanCommand({
        TableName: "captify-veripicks-Game",
        FilterExpression:
          "league = :league AND #status IN (:scheduled, :live, :completed)",
        ExpressionAttributeNames: {
          "#status": "status",
        },
        ExpressionAttributeValues: marshall({
          ":league": sport.toUpperCase(),
          ":scheduled": "scheduled",
          ":live": "live",
          ":completed": "completed",
        }),
        Limit: limit,
      })
    );

    const games = result.Items?.map((item) => unmarshall(item)) || [];
    return games.map((game) => game.id || game.gameId).filter(Boolean);
  } catch (error) {
    console.error("Error getting games by sport:", error);
    return [];
  }
}

/**
 * Process picks data for a game
 */
async function processGamePicks(gameId: string, picksData: any) {
  const results = {
    usersCreated: 0,
    usersUpdated: 0,
    picksCreated: 0,
    consensusCreated: 0,
  };

  try {
    // Process users first
    const users = picksData.experts || picksData.users || [];
    for (const user of users) {
      const wasCreated = await upsertActionUser(user);
      if (wasCreated) {
        results.usersCreated++;
      } else {
        results.usersUpdated++;
      }
    }

    // Process picks
    const picks = picksData.picks || [];
    for (const pick of picks) {
      await upsertPick(gameId, pick);
      results.picksCreated++;
    }

    // Generate consensus
    if (picks.length > 0) {
      await generatePickConsensus(gameId);
      results.consensusCreated++;
    }

    return results;
  } catch (error) {
    console.error(`Error processing game picks for ${gameId}:`, error);
    throw error;
  }
}

/**
 * Upsert ActionUser record
 */
async function upsertActionUser(userData: any): Promise<boolean> {
  try {
    const actionUserId = userData.id || userData.user_id || crypto.randomUUID;

    // Check if user exists
    const existingUser = await getUserById(actionUserId);

    const isExpert = userData.is_expert || userData.expert || 0;
    const username =
      userData.username || userData.display_name || userData.name || "Unknown";

    const actionUser: ActionUser = {
      actionUserId: actionUserId as UUID,
      user_id: userData.id || userData.user_id || 0,
      username,
      name: userData.display_name || username,
      pictureUrl: userData.profile_image_url || userData.avatar || undefined,
      isExpert: isExpert ? 1 : 0,
      verified: userData.is_verified || false,
      betInDollars: userData.bet_in_dollars || false,
      leagueRecords:
        userData.league_records ||
        ({} as Record<string, ActionUserLeagueRecord>),
      overallStats: {
        totalPicks: userData.total_picks || 0,
        totalWins: 0,
        totalLosses: 0,
        totalPushes: 0,
        overallROI: 0,
      },
      influenceScore: calculateInfluenceScore(userData),
      reliability: "medium",
      specialties: [],
      followingCount: userData.followers_count || 0,
      createdAt: existingUser?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastSyncAt: new Date().toISOString(),
      dataSource: "action_network",
    };

    await dynamoDBClient.send(
      new PutItemCommand({
        TableName: "captify-veripicks-ActionUser",
        Item: marshall(actionUser),
      })
    );

    return !existingUser; // Returns true if this was a new user
  } catch (error) {
    console.error("Error upserting ActionUser:", error);
    return false;
  }
}

/**
 * Get user by ID
 */
async function getUserById(actionUserId: string) {
  try {
    const result = await dynamoDBClient.send(
      new QueryCommand({
        TableName: "captify-veripicks-ActionUser",
        KeyConditionExpression: "actionUserId = :id",
        ExpressionAttributeValues: marshall({
          ":id": actionUserId,
        }),
        Limit: 1,
      })
    );

    return result.Items && result.Items.length > 0
      ? unmarshall(result.Items[0])
      : null;
  } catch (error) {
    console.error("Error getting user by ID:", error);
    return null;
  }
}

/**
 * Calculate influence score
 */
function calculateInfluenceScore(userData: any): number {
  const followers = userData.followers_count || 0;
  const winRate = userData.win_rate || 0;
  const totalPicks = userData.total_picks || 0;
  const isExpert = userData.is_expert || userData.expert || 0;

  let score = 0;

  // Follower influence (0-30 points)
  score += Math.min(followers / 1000, 30);

  // Win rate influence (0-40 points)
  score += winRate * 40;

  // Volume influence (0-20 points)
  score += Math.min(totalPicks / 100, 20);

  // Expert bonus (0-10 points)
  score += isExpert ? 10 : 0;

  return Math.round(score * 100) / 100; // Round to 2 decimal places
}

/**
 * Upsert Pick record
 */
async function upsertPick(gameId: string, pickData: any) {
  try {
    const pickId = pickData.id || crypto.randomUUID();

    const pick: Pick = {
      pickId: pickId as UUID,
      gameId: gameId as UUID,
      actionNetworkGameId: parseInt(pickData.game_id || gameId) || 0,
      actionUserId: pickData.user_id ? (pickData.user_id as UUID) : undefined,
      actionNetworkUserId: pickData.user_id || pickData.expert_id,
      play: pickData.play || pickData.description,
      type: pickData.pick_type || pickData.type || "spread",
      period: pickData.period || "game",
      side: pickData.side || pickData.selection,
      sideId: pickData.side_id,
      value: pickData.value || pickData.line,
      odds: pickData.odds || 0,
      units: pickData.units || 1,
      unitsNet: 0,
      money: pickData.money || 0,
      moneyNet: 0,
      unitsType: pickData.units_type || "unit",
      bookId: pickData.book_id,
      marketId: pickData.market_id,
      outcomeId: pickData.outcome_id,
      marketLineId: pickData.market_line_id,
      result: pickData.result || "pending",
      status: pickData.status || "published",
      isLive: pickData.is_live || false,
      startsAt: pickData.starts_at || new Date().toISOString(),
      endsAt: pickData.ends_at || new Date().toISOString(),
      settledAt: pickData.settled_at,
      recordDate: pickData.record_date,
      verified: pickData.verified || false,
      groupPickId: pickData.group_pick_id,
      originalPickId: pickData.original_pick_id,
      winPct: pickData.win_pct,
      graphData: pickData.graph_data,
      trend: pickData.trend,
      customPickType: pickData.custom_pick_type,
      customPickName: pickData.custom_pick_name,
      customPickRules: pickData.custom_pick_rules,
      playerId: pickData.player_id,
      competitorId: pickData.competitor_id,
      competitionId: pickData.competition_id,
      recommendation: pickData.recommendation,
      confidence: pickData.confidence || "medium",
      confidenceScore: pickData.confidence_score,
      reasoning: pickData.reasoning || pickData.analysis,
      recommendedOdds: pickData.recommended_odds,
      currentOdds: pickData.current_odds,
      modelVersion: pickData.model_version,
      modelName: pickData.model_name,
      expertName: pickData.expert_name,
      expertRating: pickData.expert_rating,
      expertConsensus: pickData.expert_consensus,
      outcome: pickData.outcome,
      profit: pickData.profit,
      gradedAt: pickData.graded_at,
      createdAt: pickData.created_at || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await dynamoDBClient.send(
      new PutItemCommand({
        TableName: "captify-veripicks-Pick",
        Item: marshall(pick),
      })
    );
  } catch (error) {
    console.error("Error upserting Pick:", error);
  }
}

/**
 * Generate pick consensus for a game
 */
async function generatePickConsensus(gameId: string) {
  try {
    // Get all picks for this game
    const result = await dynamoDBClient.send(
      new ScanCommand({
        TableName: "captify-veripicks-Pick",
        FilterExpression: "gameId = :gameId",
        ExpressionAttributeValues: marshall({
          ":gameId": gameId,
        }),
      })
    );

    const picks = result.Items?.map((item) => unmarshall(item)) || [];

    if (picks.length === 0) return;

    // Group picks by type and side
    const picksByType: Record<string, any[]> = {};
    picks.forEach((pick) => {
      const key = `${pick.pickType}_${pick.side}`;
      if (!picksByType[key]) picksByType[key] = [];
      picksByType[key].push(pick);
    });

    // Generate consensus for each pick type/side combination
    for (const [key, typePicks] of Object.entries(picksByType)) {
      const [pickType, side] = key.split("_");

      // Get expert vs public breakdown - simplified for now
      const expertPicks = typePicks.filter((p) => {
        // For now, assume we need to look up users to determine expert status
        // This could be optimized by including expert status in the pick
        return p.actionUserId; // Simplified
      });

      const consensus: PickConsensus = {
        consensusId: crypto.randomUUID() as UUID,
        gameId: gameId as UUID,
        actionNetworkGameId: parseInt(gameId) || 0,
        marketType: pickType,
        side,
        totalPicks: typePicks.length,
        totalUsers: typePicks.length, // Simplified - assumes 1 pick per user
        expertPicks: expertPicks.length,
        publicPicks: typePicks.length - expertPicks.length,
        verifiedPicks: expertPicks.length, // Simplified
        sideBreakdown: {
          [side]: {
            side: side,
            totalPicks: typePicks.length,
            expertPicks: expertPicks.length,
            publicPicks: typePicks.length - expertPicks.length,
            verifiedPicks: expertPicks.length,
            averageOdds: 0,
            averageUnits: 1,
            totalUnits: typePicks.length,
            totalMoney: 0,
            topUsers: [],
          },
        },
        topExpertsPicking: [side],
        expertConsensusStrength:
          expertPicks.length / Math.max(typePicks.length, 1),
        expertFavorite: side,
        publicFavorite: side,
        contrarian: false,
        expertPublicSplit: 0,
        averageOdds: { [side]: 0 },
        bestValue: side,
        confidenceLevel:
          calculateConsensusStrength(typePicks) === "strong"
            ? "high"
            : "medium",
        snapshotTime: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        expiresAt: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days from now
      };

      await dynamoDBClient.send(
        new PutItemCommand({
          TableName: "captify-veripicks-PickConsensus",
          Item: marshall(consensus),
        })
      );
    }
  } catch (error) {
    console.error("Error generating pick consensus:", error);
  }
}

/**
 * Helper functions for consensus calculation
 */
function calculateAverageConfidence(picks: any[]): string {
  if (picks.length === 0) return "medium";

  const confidenceValues = { low: 1, medium: 2, high: 3 };
  const total = picks.reduce((sum, pick) => {
    return (
      sum +
      (confidenceValues[pick.confidence as keyof typeof confidenceValues] || 2)
    );
  }, 0);

  const average = total / picks.length;
  if (average <= 1.33) return "low";
  if (average <= 2.66) return "medium";
  return "high";
}

function extractTopReasons(picks: any[]): string[] {
  const reasons = picks
    .map((pick) => pick.reasoning)
    .filter(Boolean)
    .slice(0, 3);
  return reasons;
}

function calculateConsensusStrength(
  picks: any[]
): "weak" | "moderate" | "strong" {
  if (picks.length < 3) return "weak";
  if (picks.length < 10) return "moderate";
  return "strong";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sport, game, limit } = body;

    // Convert to query parameters and use GET handler
    const mockUrl = new URL(request.url);
    // Clear existing params
    Array.from(mockUrl.searchParams.keys()).forEach((key) => {
      mockUrl.searchParams.delete(key);
    });

    if (sport) mockUrl.searchParams.set("sport", sport);
    if (game) mockUrl.searchParams.set("game", game);
    if (limit) mockUrl.searchParams.set("limit", limit.toString());

    const mockRequest = new NextRequest(mockUrl, {
      method: "GET",
      headers: request.headers,
    });

    return GET(mockRequest);
  } catch (error) {
    console.error("[GAME PICKS API] POST Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Invalid JSON body",
        usage:
          "Send POST request with JSON body containing sport, game, or limit fields",
      },
      { status: 400 }
    );
  }
}
