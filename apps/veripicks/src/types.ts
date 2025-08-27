/**
 * VeriPicks Type Definitions
 *
 * Centralized type definitions for the VeriPicks sports forecasting platform
 * All database entities include proper ID tracking for DynamoDB operations
 *
 * DATABASE ENTITY DESIGN RULES:
 * =============================
 * - Any property with "Id" suffix that is typed as UUID will trigger automatic DynamoDB table creation
 * - Table name format: "captify-veripicks-{InterfaceName}" (e.g., eventId → captify-veripicks-Event)
 * - Primary Key (PK) is always the UUID field, Sort Key (SK) varies by entity
 *
 */

// Core imports
import { UUID } from "crypto";

// Base types for sports data
export type Sport =
  | "football"
  | "basketball"
  | "baseball"
  | "hockey"
  | "soccer";
export type League = "NFL" | "NBA" | "MLB" | "NHL" | "MLS" | "NCAAF" | "NCAAB";
export type GameStatus =
  | "scheduled"
  | "live"
  | "completed"
  | "postponed"
  | "cancelled";
export type BetType = "moneyline" | "spread" | "total";
export type PickConfidence = "low" | "medium" | "high" | "max";
export type PickOutcome = "pending" | "win" | "loss" | "push" | "cancelled";

// Public betting sentiment aggregated across sportsbooks
export interface PublicBettingSentiment {
  moneyline?: {
    homeTicketsPercent: number; // Average tickets % on home team
    awayTicketsPercent: number; // Average tickets % on away team
    homeMoneyPercent: number; // Average money % on home team
    awayMoneyPercent: number; // Average money % on away team
    sampleSize: number; // Number of sportsbooks with data
  };
  spread?: {
    homeTicketsPercent: number; // Average tickets % on home spread
    awayTicketsPercent: number; // Average tickets % on away spread
    homeMoneyPercent: number; // Average money % on home spread
    awayMoneyPercent: number; // Average money % on away spread
    sampleSize: number; // Number of sportsbooks with data
  };
  total?: {
    overTicketsPercent: number; // Average tickets % on over
    underTicketsPercent: number; // Average tickets % on under
    overMoneyPercent: number; // Average money % on over
    underMoneyPercent: number; // Average money % on under
    sampleSize: number; // Number of sportsbooks with data
  };
}

// Database Entity Types - All include proper ID tracking

/**
 * Game Entity - Primary entity for tracking games and odds
 * DynamoDB Table: captify-veripicks-Game
 * PK: gameId, SK: scheduledDate
 */
export interface Game {
  gameId: UUID; // UUID - Primary identifier
  id: number;
  sport: Sport;
  league: League;
  season: string;
  week?: number; // For weekly sports like NFL

  // Teams (stored as IDs, teams stored separately)
  homeTeamId: UUID; // References Team entity
  awayTeamId: UUID; // References Team entity
  winningTeamId?: UUID; // winning_team_id

  // Scheduling
  scheduledTime: string; // ISO timestamp from start_time
  actualStartTime?: string;
  venue?: string;

  // Status tracking
  status: GameStatus; // mapped from status field
  realStatus: string; // real_status from API
  statusDisplay?: string; // status_display

  // Score tracking
  score?: GameScore;

  // Score fields that might be at root level (from API)
  total_away_points?: number;
  total_home_points?: number;
  clock?: string;
  linescore?: PeriodScore[];
  situation?: GameSituation;

  // Game metadata from API
  gameType: string; // type (reg, post, pre)
  league_id?: number; // league_id
  rotationNumbers?: {
    away: number; // away_rotation_number
    home: number; // home_rotation_number
  };
  attendance?: number;
  coverage?: string; // full, limited, etc.
  isFree?: boolean; // is_free
  trending?: boolean;

  // Broadcasting info
  broadcast?: {
    network: string;
    network_short?: string;
    satellite?: string;
  };

  // Game metadata and analytics
  meta?: Record<string, any>; // meta object
  numBets?: number; // num_bets - betting volume
  coreId?: number; // core_id for mapping

  // Current game state
  lastPlay?: LastPlayInfo; // last_play object

  // Comprehensive game statistics
  boxscore?: GameBoxscore; // boxscore object

  // Player information and stats
  players?: GamePlayer[]; // players array
  playerStats?: {
    away: PlayerStatLine[];
    home: PlayerStatLine[];
  };

  // Professional betting insights
  proReport?: ProReport; // pro_report object

  // Current betting data (latest snapshot)
  currentOdds?: GameOdds;
  hasOdds: boolean; // Track if odds are available

  // Best odds tracking
  hasBestOdds?: {
    away?: BestOddsInfo;
    home?: BestOddsInfo;
  };

  // Tracking metadata
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
  dataSource: string; // 'action_network'
  lastSyncAt: string; // ISO timestamp

  // TTL for cleanup of old completed games (90 days)
  expiresAt?: number; // Unix timestamp

  markets?: Record<string, BookData>;
  publicBetting?: PublicBettingSentiment;
  homeTeam?: Team;
  awayTeam?: Team;
}

export interface MarketOutcome {
  outcome_id: number;
  side: string;
  odds: number;
  value?: number;
  bet_info?: {
    money?: { percent: number };
    tickets?: { percent: number };
  };
  best_odds?: boolean;
}

export interface BookData {
  event: {
    moneyline?: MarketOutcome[];
    spread?: MarketOutcome[];
    total?: MarketOutcome[];
  };
}

// Enhanced Game Data Structures

export interface LastPlayInfo {
  half: string; // "top", "bottom"
  text: string; // Play description
  period: number; // Inning/period number
  runners: Record<string, any>; // Base runners info
  homeWinPct: number; // Live win probability
  overWinPct: number; // Live over probability
  homeSpreadWinPct: number; // Live spread probability
}

export interface GameBoxscore {
  stats?: {
    away: TeamGameStats;
    home: TeamGameStats;
  };
  period?: number | null;
  pitching?: {
    away?: {
      probableId?: number;
      startingId?: number;
    };
    home?: {
      probableId?: number;
      startingId?: number;
    };
    winId?: number;
    lossId?: number;
    saveId?: number;
  };
  linescore?: PeriodScore[];
  situation?: GameSituation;
  latestOdds?: {
    game?: LiveOddsSnapshot;
    firstinning?: LiveOddsSnapshot;
    firstfiveinnings?: LiveOddsSnapshot;
  };
  // Football/Basketball scoring fields
  total_away_points?: number;
  total_home_points?: number;
  total_away_firsthalf_points?: number;
  total_home_firsthalf_points?: number;
  total_away_secondhalf_points?: number;
  total_home_secondhalf_points?: number;
  away_timeouts?: number;
  home_timeouts?: number;
  clock?: string;
  // Baseball scoring fields
  totalAwayPoints?: number;
  totalHomePoints?: number;
  totalHomeFirstfivePoints?: number;
  totalAwayFirstfivePoints?: number;
}

export interface TeamGameStats {
  hits?: number;
  runs?: number;
  errors?: number;
}

export interface LiveOddsSnapshot {
  over?: number;
  total?: number;
  under?: number;
  mlAway?: number;
  mlHome?: number;
  spreadAway?: number;
  spreadHome?: number;
  spreadAwayLine?: number;
  spreadHomeLine?: number;
}

export interface GamePlayer {
  id: number;
  gameId: number; // References the Action Network game id
  jersey?: string;
  fullName: string; // full_name
  abbr: string; // Abbreviated name
  primaryPosition: string; // primary_position
  position: string;
  handedness?: {
    bat: string; // L/R/S
    throw: string; // L/R
  };
  image?: string; // Player image URL
  team_id: number; // team_id
  urlSlug?: string; // url_slug
}

export interface PlayerStatLine {
  playerId: number; // player_id
  pitching?: PitchingStats;
  batting?: BattingStats;
}

export interface PitchingStats {
  bf?: number; // Batters faced
  bk?: number; // Balks
  k9?: number; // Strikeouts per 9 innings
  wp?: number; // Wild pitches
  era?: number; // Earned run average
  kbb?: number; // K/BB ratio
  lob?: number; // Left on base
  oba?: number; // Opponent batting average
  gofo?: number; // Ground out/fly out ratio
  ip1?: number; // Innings pitched (outs)
  ip2?: string; // Innings pitched (decimal)
  outs?: PitchingOuts;
  runs?: PitchingRuns;
  whip?: number; // WHIP
  games?: PitchingGames;
  steal?: StealingStats;
  onbase?: OnBaseStats;
  outcome?: PitchOutcomes;
  pitchCount?: number; // pitch_count
}

export interface PitchingOuts {
  fo?: number; // Fly outs
  go?: number; // Ground outs
  lo?: number; // Line outs
  po?: number; // Pop outs
  fidp?: number; // Fly into double play
  gidp?: number; // Ground into double play
  lidp?: number; // Line into double play
  klook?: number; // Strikeouts looking
  kswing?: number; // Strikeouts swinging
  ktotal?: number; // Total strikeouts
  sacfly?: number; // Sacrifice flies
  sachit?: number; // Sacrifice hits
}

export interface PitchingRuns {
  total?: number;
  earned?: number;
  unearned?: number;
}

export interface PitchingGames {
  svo?: number; // Save opportunities
  win?: number;
  hold?: number;
  loss?: number;
  play?: number;
  save?: number;
  start?: number;
  finish?: number;
  qstart?: number; // Quality starts
  shutout?: number;
  complete?: number;
  teamWin?: number; // team_win
  teamLoss?: number; // team_loss
  blownSave?: number; // blown_save
}

export interface StealingStats {
  caught?: number;
  stolen?: number;
  pickoff?: number;
}

export interface OnBaseStats {
  d?: number; // Doubles
  h?: number; // Hits
  s?: number; // Singles
  t?: number; // Triples
  bb?: number; // Walks
  ci?: number; // Catcher interference
  fc?: number; // Fielder's choice
  hr?: number; // Home runs
  tb?: number; // Total bases
  hbp?: number; // Hit by pitch
  ibb?: number; // Intentional walks
  roe?: number; // Reached on error
  rov?: number; // Reached on violation
}

export interface PitchOutcomes {
  ball?: number;
  foul?: number;
  iball?: number; // Intentional ball
  klook?: number; // Strikeouts looking
  kswing?: number; // Strikeouts swinging
  ktotal?: number; // Total strikeouts
  dirtball?: number; // Ball in dirt
}

export interface BattingStats {
  // Add batting stats as needed
  ab?: number; // At bats
  h?: number; // Hits
  r?: number; // Runs
  rbi?: number; // Runs batted in
  bb?: number; // Walks
  so?: number; // Strikeouts
  avg?: number; // Batting average
}

export interface ProReport {
  spread?: ProReportSignal;
  moneyline?: ProReportSignal;
  total?: ProReportSignal;
}

export interface ProReportSignal {
  away?: ProReportBet[];
  home?: ProReportBet[];
  over?: ProReportBet[];
  under?: ProReportBet[];
}

export interface ProReportBet {
  signalType: string; // "sharp_money", "reverse_line_move", etc.
  explanation: string;
  strength: number; // 0-1 confidence score
  meta?: {
    steamMoves?: number; // steam_moves
    reverseLineMoves?: number; // reverse_line_moves
  };
}

export interface BestOddsInfo {
  bookId: number; // book_id
  idx: number; // Index in array
  value: number; // Coefficient score
  outcomeId: number; // outcome_id
}

/**
 * ActionUser Entity - Track Action Network users (experts and regular users)
 * DynamoDB Table: captify-veripicks-ActionUser
 * PK: actionUserId, SK: actionUserId (single item)
 */
export interface ActionUser {
  actionUserId: UUID; // UUID - Primary identifier (triggers table creation)
  user_id: number; // Action Network user_id
  username: string; // Action Network username
  name: string; // Display name
  pictureUrl?: string; // Profile picture URL

  // Expert status (1 = expert, 0 = regular user)
  isExpert: number; // 1 for expert, 0 for regular user
  verified: boolean; // Action Network verification status
  betInDollars: boolean; // bet_in_dollars preference

  // Performance Records by League
  leagueRecords: Record<string, ActionUserLeagueRecord>; // league_name -> record

  // Overall Performance Summary
  overallStats: {
    totalPicks: number;
    totalWins: number;
    totalLosses: number;
    totalPushes: number;
    overallROI: number;
    bestLeague?: string; // Their strongest league
    worstLeague?: string; // Their weakest league
  };

  // Tracking & Classification
  influenceScore: number; // 0-100 calculated influence score
  reliability: "low" | "medium" | "high" | "elite"; // Based on track record
  specialties: string[]; // Leagues they perform best in
  followingCount?: number; // Number of followers (if available)

  // Metadata
  createdAt: string;
  updatedAt: string;
  lastSyncAt: string;
  dataSource: "action_network";
  expiresAt?: number; // TTL for inactive users
}

/**
 * ActionUser League Record - Performance in specific league
 */
export interface ActionUserLeagueRecord {
  leagueName: string; // "ncaaf", "nfl", etc.
  season?: number;
  seasonType: string; // "all", "current", etc.
  win: number;
  loss: number;
  push: number;
  count: number; // total picks
  unitsRisked: number;
  unitsNet: number;
  moneyRisked: number;
  moneyNet: number;
  roi: number; // ROI percentage
  verified: boolean;
  recordDate: string;
  updatedAt: string;
}

/**
 * Pick Entity - Enhanced with Action Network integration
 * DynamoDB Table: captify-veripicks-Pick
 * PK: pickId, SK: gameId-actionNetworkPickId
 */
export interface Pick {
  pickId: UUID; // UUID - Primary identifier
  actionNetworkPickId?: number; // Action Network pick id
  gameId: UUID; // UUID - References Game entity
  actionNetworkGameId: number; // Action Network game_id
  actionUserId?: UUID; // UUID - References ActionUser entity
  actionNetworkUserId?: number; // Action Network user_id
  userId?: UUID; // UUID - References captify-core-Users table (our users)

  // Pick details from Action Network
  play?: string; // Human-readable pick description ("Under 50.5", "BAR -450")
  type: string; // "under", "ml_away", "spread_home", etc. (more flexible than BetType)
  period: string; // "game", "first_half", "first_quarter", etc.
  side?: string; // "home", "away", "over", "under"
  sideId?: number; // team_id for team-specific bets
  value?: number; // Point spread or total value (50.5, -450, etc.)
  odds: number; // American odds format (-115, +150, etc.)

  // Bet sizing and financials
  units: number; // Bet size in units
  unitsNet: number; // Net units won/lost
  money: number; // Bet size in dollars
  moneyNet: number; // Net money won/lost
  unitsType: "unit" | "dollar";

  // Market references
  bookId?: number; // Sportsbook ID (15=DraftKings, 30=FanDuel)
  marketId?: number; // Action Network market ID
  outcomeId?: number; // Action Network outcome ID
  marketLineId?: number; // Specific line ID from meta

  // Status and results
  result: "pending" | "win" | "loss" | "push" | "cancelled"; // Action Network result
  status: "published" | "draft" | "cancelled"; // Pick status
  isLive: boolean; // Was this a live bet?

  // Timing
  startsAt: string; // When bet becomes active
  endsAt: string; // When bet expires
  settledAt?: string; // When bet was graded
  recordDate?: string; // When added to user's record

  // Verification and grouping
  verified: boolean; // User verification status
  groupPickId?: number; // For grouped picks
  originalPickId?: number; // For pick copies/updates (from meta)

  // Advanced analytics (if available)
  winPct?: number; // Win probability at time of pick
  graphData?: any; // Historical odds movement
  trend?: any; // Trend analysis data

  // Custom picks (Action Network feature)
  customPickType?: string;
  customPickName?: string;
  customPickRules?: any;

  // Player props (if applicable)
  playerId?: number; // For player prop bets
  competitorId?: number; // For competitor-specific bets
  competitionId?: number; // For competition-specific bets

  // Legacy fields for AI/Model picks
  recommendation?: string; // 'home', 'away', 'over', 'under', etc.
  confidence?: PickConfidence;
  confidenceScore?: number; // 0-100 numerical confidence
  reasoning?: string; // AI-generated or expert reasoning
  recommendedOdds?: number; // Odds when pick was made
  currentOdds?: number; // Current odds for comparison
  modelVersion?: string; // e.g., 'claude-3.5-sonnet-v1.0'
  modelName?: string; // 'claude', 'expert-consensus', etc.
  expertName?: string; // Professional handicapper name
  expertRating?: number; // 1-5 star rating for experts
  expertConsensus?: ExpertConsensusData;
  outcome?: PickOutcome; // Legacy outcome field
  profit?: number; // Actual profit/loss if completed
  gradedAt?: string; // When outcome was determined

  // Metadata
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

/**
 * PickConsensus Entity - Track consensus and sentiment for each game/market
 * DynamoDB Table: captify-veripicks-PickConsensus
 * PK: consensusId, SK: gameId-marketType
 */
export interface PickConsensus {
  consensusId: UUID; // UUID - Primary identifier
  gameId: UUID; // UUID - References Game entity
  actionNetworkGameId: number; // Action Network game_id
  marketType: string; // "moneyline", "spread", "total", "props"
  side?: string; // "home", "away", "over", "under" (for specific side consensus)

  // Overall consensus metrics
  totalPicks: number; // Total picks for this market
  totalUsers: number; // Unique users making picks

  // Expert vs Public breakdown
  expertPicks: number; // Picks from verified experts (isExpert = 1)
  publicPicks: number; // Picks from regular users (isExpert = 0)
  verifiedPicks: number; // Picks from verified users

  // Side distribution
  sideBreakdown: Record<string, PickSideConsensus>; // "home", "away", etc.

  // Expert influence
  topExpertsPicking: string[]; // Which side top experts are on
  expertConsensusStrength: number; // 0-1 scale of expert agreement
  expertFavorite?: string; // What experts prefer most
  publicFavorite?: string; // What public prefers most

  // Contrarian analysis
  contrarian: boolean; // Are experts fading public?
  expertPublicSplit: number; // % difference between expert/public preference

  // Value analysis
  averageOdds: Record<string, number>; // Average odds by side
  bestValue?: string; // Side with best odds relative to consensus

  // Historical context
  historicalAccuracy?: number; // Past accuracy for this consensus type
  confidenceLevel: "low" | "medium" | "high" | "extreme";

  // Metadata
  snapshotTime: string; // When this consensus was calculated
  createdAt: string;
  updatedAt: string;
  expiresAt: number; // TTL - clean up after game completion
}

/**
 * ActionUser summary for consensus tracking
 */
export interface ActionUserSummary {
  actionUserId: UUID;
  actionNetworkUserId: number;
  username: string;
  name: string;
  isExpert: number; // 1 for expert, 0 for regular user
  verified: boolean;
  roi: number; // Their ROI in this league
  pickCount: number; // Number of picks they've made
  units: number; // Units they bet on this side
}

/**
 * Pick consensus for a specific side
 */
export interface PickSideConsensus {
  side: string; // "home", "away", "over", "under"
  totalPicks: number;
  expertPicks: number;
  publicPicks: number;
  verifiedPicks: number;
  averageOdds: number;
  averageUnits: number;
  totalUnits: number;
  totalMoney: number;
  topUsers: ActionUserSummary[]; // Top users picking this side
}

/**
 * VeriPicks User Data - Extended user data specific to VeriPicks
 * DynamoDB Table: captify-veripicks-UserData
 * PK: userId (references captify-core-Users)
 */
export interface UserData {
  userId: UUID; // UUID - References captify-core-Users table
  user_id: number; // Action Network id of User
  // VeriPicks specific data
  bankroll: number; // User's betting bankroll
  preferredSports: Sport[];
  preferredLeagues: League[];
  riskTolerance: "conservative" | "moderate" | "aggressive";

  // Betting preferences
  defaultBetSize: number;
  maxBetSize: number;
  kellyCalculation: boolean; // Use Kelly Criterion for bet sizing

  // Subscription info
  subscriptionTier: "free" | "premium" | "pro";
  subscriptionExpires?: string;

  // Notification preferences
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;

  // Performance tracking
  totalWagered: number;
  totalProfit: number;
  bestWinStreak: number;
  worstLossStreak: number;

  // Metadata
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

/**
 * User Stats - Performance tracking per user
 * DynamoDB Table: captify-veripicks-UserStats
 * PK: userId, SK: period (e.g., '2025-08', 'all-time')
 */
export interface UserStats {
  statsId: UUID; // UUID - Primary identifier
  userId: UUID; // UUID - References captify-core-Users table
  user_id: number; // Action Network user_id
  period: string; // Time period ('2025-08', 'all-time', etc.)

  // Performance metrics
  totalPicks: number;
  winningPicks: number;
  losingPicks: number;
  pendingPicks: number;
  pushPicks: number;

  // Financial metrics
  totalProfit: number;
  totalWagered: number;
  roi: number; // Return on investment percentage
  winRate: number; // Win percentage
  avgOdds: number; // Average odds taken

  // Streaks
  currentStreak: number; // Current winning/losing streak
  bestWinStreak: number;
  worstLossStreak: number;

  // Performance by bet type
  performanceByType: PerformanceByType[];

  // Performance by league
  performanceByLeague: PerformanceByLeague[];

  // Metadata
  lastUpdated: string; // ISO timestamp
  calculatedAt: string; // ISO timestamp
}

/**
 * Player Entity - Player information for props betting
 * DynamoDB Table: captify-veripicks-Player
 * PK: playerId, SK: playerId (single item)
 */
export interface Player {
  playerId: UUID; // UUID - Primary identifier
  player_id: number; // Action Network player id
  name: string;
  position: string;
  teamId: UUID; // References Team entity

  // Current season stats (varies by sport)
  stats?: PlayerStats;

  // Metadata
  createdAt: string;
  updatedAt: string;
  dataSource: string; // 'action_network'
  lastSyncAt: string;
}

export interface PlayerStats {
  // Baseball pitcher stats
  pitching?: {
    bf?: number; // Batters faced
    bk?: number; // Balks
    k9?: number; // Strikeouts per 9 innings
    wp?: number; // Wild pitches
    era?: number; // Earned run average
    kbb?: number; // Strikeout to walk ratio
    lob?: number; // Left on base
    oba?: number; // On-base average against
    gofo?: number; // Ground out to fly out ratio
    ip1?: number; // Innings pitched (whole)
    ip2?: number; // Innings pitched (fractional)
    whip?: number; // Walks + hits per inning pitched
    wins?: number;
    losses?: number;
    saves?: number;
    holds?: number;
    runs?: {
      total?: number;
      earned?: number;
      unearned?: number;
    };
  };

  // Baseball hitting stats
  hitting?: {
    hits?: number;
    runs?: number;
    rbi?: number;
    homeRuns?: number;
    doubles?: number;
    triples?: number;
    walks?: number;
    strikeouts?: number;
    battingAverage?: number;
    onBasePercentage?: number;
    sluggingPercentage?: number;
  };

  // Can extend for other sports
  [key: string]: any;
}

/**
 * Market/Odds Change Entity - Track specific market changes
 * DynamoDB Table: captify-veripicks-MarketChange
 * PK: gameId, SK: timestamp-marketType-bookId
 */
export interface MarketChange {
  changeId: UUID; // UUID - Primary identifier
  gameId: UUID; // UUID - References Game entity
  id: number; // Action network game_id
  timestamp: string; // ISO timestamp
  marketType: string; // 'moneyline', 'spread', 'total', 'prop'
  book_id: number; // Sportsbook ID

  // Change details
  previousOdds?: number;
  newOdds?: number;
  previousLine?: number; // For spreads and totals
  newLine?: number;

  // Change magnitude
  oddsChange?: number; // Difference in odds
  lineChange?: number; // Difference in line
  changePercentage?: number;

  // Context
  market_id: number; // Action Network market ID
  outcome_id: number; // Action Network outcome ID
  side?: string; // 'home', 'away', 'over', 'under'

  // Metadata
  createdAt: string;
  dataSource: string; // 'action_network'

  // TTL for cleanup
  expiresAt: number; // Unix timestamp (7 days)
}

/**
 * Comprehensive Market Change - Track comprehensive game market changes
 * DynamoDB Table: captify-veripicks-GameMarketChange
 * PK: id
 */
export interface GameMarketChange {
  changeId: UUID; // UUID - Primary identifier
  gameId: UUID;
  id: number; // References Game entity (Action Network game ID)
  timestamp: string; // ISO timestamp when change was detected
  changedMarkets: string[]; // Array of changed field names

  // Before and after snapshots
  beforeValues: {
    markets?: Record<string, any>;
    currentOdds?: any;
    numBets?: number;
  };
  afterValues: {
    markets?: Record<string, any>;
    currentOdds?: any;
    numBets?: number;
  };

  // Metadata
  createdAt: string;
  updatedAt: string;
  dataSource?: string; // 'action_network'

  // TTL for cleanup
  expiresAt?: number; // Unix timestamp
}

// Supporting Types

/**
 * Team Entity - Team information and stats
 * DynamoDB Table: captify-veripicks-Team
 * PK: teamId
 */
export interface Team {
  teamId: UUID; // UUID - Primary identifier
  team_id: number; // Action Network team_id
  name: string; // full_name
  abbreviation: string; // abbr
  displayName: string; // display_name
  shortName: string; // short_name
  location: string; // location
  logo?: string; // logo URL
  primaryColor?: string; // primary_color hex
  secondaryColor?: string; // secondary_color hex
  conference?: string; // conference_type (AL/NL for MLB)
  division?: string; // division_type (EAST/CENTRAL/WEST)
  record?: TeamRecord; // standings object
  urlSlug?: string; // url_slug
  core_id?: number; // core_id for mapping

  // Sport/League classification
  sport?: Sport; // Sport type for the team
  league?: string; // League abbreviation (NFL, NBA, etc.)
  dataSource?: string; // Data source identifier
  lastSyncAt?: string; // Last sync timestamp

  createdAt: string;
  updatedAt: string;
}

export interface TeamRecord {
  win: number;
  loss: number;
  ties?: number;
  overtimeLosses?: number;
  draw?: number;
}

export interface GameScore {
  homeScore: number;
  awayScore: number;
  period?: number; // Current period/inning
  timeRemaining?: string;
  isHalftime?: boolean;
  isOvertime?: boolean;
  // Additional fields from actual API data
  total_away_points?: number;
  total_home_points?: number;
  total_away_firsthalf_points?: number;
  total_home_firsthalf_points?: number;
  total_away_secondhalf_points?: number;
  total_home_secondhalf_points?: number;
  away_timeouts?: number;
  home_timeouts?: number;
  clock?: string;
  // Detailed scoring by period (for baseball: innings)
  linescore?: PeriodScore[];
  // Game situation (for baseball/football)
  situation?: GameSituation;
}

export interface PeriodScore {
  id: number;
  abbr: string; // "1", "2", "3", etc.
  displayName: string; // "1st", "2nd", "3rd", etc.
  display_name?: string; // Alternative field name from API
  fullName: string; // "1st Inning", "2nd Inning", etc.
  full_name?: string; // Alternative field name from API
  awayPoints?: number;
  away_points?: number; // Alternative field name from API
  homePoints?: number;
  home_points?: number; // Alternative field name from API
}

export interface GameSituation {
  // Baseball fields
  outs?: number;
  balls?: number;
  strikes?: number;
  runners?: {
    first?: number | null;
    second?: number | null;
    third?: number | null;
  };
  batterId?: number;
  pitcherId?: number;
  inningHalf?: string;
  batterOrder?: number;
  // Football fields
  down?: number;
  distance?: number;
  yardline?: number;
  yardline_text?: string;
  yards_to_endzone?: number;
  possession?: number;
  start_yardline?: number;
  is_redzone?: boolean;
  display?: string;
  display_short?: string;
}

export interface GameOdds {
  moneyline?: {
    home: BettingOdds;
    away: BettingOdds;
  };
  spread?: {
    home: BettingOdds; // Home team spread
    away: BettingOdds; // Away team spread
    line: number; // Spread line (e.g., -3.5)
  };
  total?: {
    over: BettingOdds;
    under: BettingOdds;
    line: number; // Total points line (e.g., 225.5)
  };
  // Props for player/team specific bets
  props?: {
    [propType: string]: BettingOdds[];
  };
}

export interface BettingOdds {
  odds: number; // American odds format (-110, +150, etc.)
  price?: number; // Decimal odds
  value?: number; // Line value (spread number, total number)
  timestamp: string; // When these odds were captured
  sportsbook?: string; // Sportsbook name
  bookId?: number; // Sportsbook ID from Action Network
  isLive?: boolean; // is_live flag
  lineStatus?: string; // normal, unavailable, etc.
  betInfo?: PublicBettingInfo; // Public betting percentages
  deepLinkId?: string; // For direct sportsbook links
  outcomeId?: number; // Action Network outcome ID
  marketId?: number; // Action Network market ID
}

export interface PublicBettingInfo {
  tickets?: {
    value: number;
    percent: number;
  };
  money?: {
    value: number;
    percent: number;
  };
}

export interface ExpertConsensusData {
  expertCount: number;
  agreementPercentage: number; // % of experts who agree with our pick
  consensusStrength: number; // 0-1 scale
  topExpertPicks: Pick[]; // Using Pick entity for expert picks
  analysis: "strong_consensus" | "weak_consensus" | "contrarian" | "no_data";
}

export interface PerformanceByType {
  type: BetType;
  picks: number;
  wins: number;
  losses: number;
  profit: number;
  winRate: number;
}

export interface PerformanceByLeague {
  league: League;
  picks: number;
  wins: number;
  losses: number;
  profit: number;
  winRate: number;
}

// Validation Schemas (for runtime validation)
export interface CreatePickRequest {
  gameId: UUID;
  id: number;
  type: BetType;
  recommendation: string;
  confidence: PickConfidence;
  odds?: number;
}

export interface UpdatePickRequest {
  pickId: UUID;
  outcome?: PickOutcome;
  profit?: number;
}

export interface GameQueryParams {
  date?: string;
  league?: League;
  status?: GameStatus;
  limit?: number;
}

export interface PicksQueryParams {
  userId?: UUID;
  user_id?: number;
  gameId?: UUID;
  id?: number;
  period?: string;
  outcome?: PickOutcome;
  limit?: number;
}

// UI Display Types for Dashboard Components
export interface DashboardStats {
  totalPicks: number;
  winRate: number;
  todaysGames: number;
  expertConsensus: number;
  weeklyROI: number;
  monthlyROI: number;
  modelAccuracy: number;
  activeSports: number;
}

export interface GameWithPicks extends Game {
  ourPick?: Pick;
  expertConsensus?: ExpertConsensusData;
  pickCount?: number;
}

export interface GameWithTeams extends Game {
  homeTeam: Team;
  awayTeam: Team;
}

export interface GameWithTeamsAndPicks extends GameWithTeams {
  ourPick?: Pick;
  expertConsensus?: ExpertConsensusData;
  pickCount?: number;
}

export interface GameWithTeamsAndPicks extends GameWithTeams {
  ourPick?: Pick;
  expertConsensus?: ExpertConsensusData;
  pickCount?: number;
}

export interface PickWithGame extends Pick {
  game?: Game;
}

export interface PickWithGameAndTeams extends Pick {
  game?: GameWithTeams;
}

// API Response Types from Action Network (Enhanced with Real API Structure)

export interface ActionNetworkResponse {
  games: ActionNetworkGame[];
}

export interface ActionNetworkGame {
  id: number; // Action Network game ID
  league_id: number;
  status: "scheduled" | "live" | "completed" | "postponed" | "cancelled";
  real_status: string;
  status_display?: string;
  start_time: string; // ISO timestamp
  away_team_id: number;
  home_team_id: number;
  winning_team_id?: number;
  league_name: string;
  type: "reg" | "post" | "pre"; // regular, postseason, preseason
  season: number;
  week?: number;
  attendance: number;
  coverage: "full" | "limited" | "none";
  is_free: boolean;
  trending: boolean;
  away_rotation_number?: number;
  home_rotation_number?: number;

  // Enhanced team details with current stats
  teams: ActionNetworkTeam[];

  // Broadcasting information
  broadcast?: {
    network: string;
    network_short: string;
  };

  // Enhanced market data by sportsbook (key feature from real API)
  markets: Record<string, ActionNetworkMarkets>; // bookId -> markets

  // Best odds tracking across all sportsbooks
  has_best_odds?: {
    away?: ActionNetworkBestOdds;
    home?: ActionNetworkBestOdds;
  };
}

export interface ActionNetworkTeam {
  id: number; // Action Network team ID
  full_name: string;
  display_name: string;
  short_name: string;
  location: string;
  abbr?: string;
  logo?: string;
  primary_color?: string;
  secondary_color?: string;
  conference_type?: string;
  division_type?: string;
  url_slug?: string;

  // Enhanced with detailed current season stats
  season_stats?: {
    record?: {
      wins: number;
      losses: number;
      ties?: number;
      overtime_losses?: number;
    };

    // Advanced stats vary by sport
    batting?: any; // Baseball specific
    pitching?: any; // Baseball specific
    offense?: any; // Football/Basketball
    defense?: any; // Football/Basketball

    // Performance metrics (from real API data)
    steal?: {
      caught: number;
      stolen: number;
      pickoff: number;
    };

    onbase?: {
      d: number; // doubles
      h: number; // hits
      s: number; // singles
      t: number; // triples
      bb: number; // walks
      ci: number;
      fc: number;
      hr: number; // home runs
      tb: number; // total bases
      hbp: number; // hit by pitch
      ibb: number; // intentional walks
      roe: number;
      rov: number;
    };

    outcome?: {
      ball: number;
      foul: number;
      iball: number;
      klook: number;
      kswing: number;
      ktotal: number;
      dirtball: number;
    };

    pitch_count?: number;
  };

  standings?: {
    win: number;
    loss: number;
    ties?: number;
    overtime_losses?: number;
    draw?: number;
  };
  core_id?: number;
}

export interface ActionNetworkMarkets {
  event: {
    spread?: ActionNetworkOutcome[];
    moneyline?: ActionNetworkOutcome[];
    total?: ActionNetworkOutcome[];
  };
}

export interface ActionNetworkOutcome {
  outcome_id: number;
  market_id: number;
  event_type: "game";
  event_id: number;
  book_id: number; // Sportsbook identifier (15=DraftKings, 30=FanDuel, etc.)
  type: "spread" | "moneyline" | "total";
  side: "away" | "home" | "over" | "under";
  period:
    | "event"
    | "first_half"
    | "second_half"
    | "first_quarter"
    | "second_quarter"
    | "third_quarter"
    | "fourth_quarter";
  team_id?: number; // For team-specific bets
  odds: number; // American odds format (-110, +150, etc.)
  value: number; // Point spread or total value
  is_live: boolean;
  deeplink_id: string; // For affiliate tracking
  line_status: "normal" | "unavailable" | "suspended";

  // Enhanced public betting information (key feature from real API)
  bet_info?: {
    tickets: {
      value: number;
      percent: number; // Percentage of tickets on this side
    };
    money: {
      value: number;
      percent: number; // Percentage of money on this side
    };
  };

  // Enhanced odds quality scoring for line movement analysis
  odds_coefficient_score: number | null;

  // Best odds indicators
  best_odds?: boolean;

  // Additional metadata
  player_id?: number;
  competitor_id?: number;
  option_type_id?: number;
}

export interface ActionNetworkBestOdds {
  book_id: number;
  idx: number;
  value: number;
  outcome_id: number;
}

// Enhanced Database Entities with Action Network Integration

/**
 * Sportsbook Entity - Track sportsbook information
 * DynamoDB Table: captify-veripicks-Sportsbook
 * PK: sportsbookId
 */
export interface Sportsbook {
  sportsbookId: UUID; // UUID - Primary identifier
  id: number; // Action Network book_id as number
  name: string;
  shortName: string;
  isActive: boolean;
  affiliateUrl?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Market Analysis Entity - Enhanced market insights
 * DynamoDB Table: captify-veripicks-MarketAnalysis
 * PK: analysisId, SK: gameId
 */
export interface MarketAnalysis {
  analysisId: UUID; // UUID - Primary identifier
  id: number; // gameId for quick lookup
  gameId: UUID; // References Game entity
  analysisTime: string;

  // Enhanced line movement tracking
  lineMovements: {
    spread: LineMovement[];
    total: LineMovement[];
    moneyline: LineMovement[];
  };

  // Enhanced public betting analysis
  publicBetting: {
    spread: PublicBettingData;
    total: PublicBettingData;
    moneyline: PublicBettingData;
  };

  // Steam moves detection
  steamMoves: SteamMove[];

  // Best odds across books
  bestOdds: {
    spread: BestOddsData;
    total: BestOddsData;
    moneyline: BestOddsData;
  };

  // Market efficiency indicators
  marketEfficiency: {
    spreadVariance: number;
    totalVariance: number;
    moneylineVariance: number;
  };

  // Sharp money indicators
  sharpMoneyIndicators: boolean;
  reverseLinesMovement: boolean;

  createdAt: string;
  updatedAt: string;
}

/**
 * Line Movement Entity - Track specific line movements with comprehensive data
 * DynamoDB Table: captify-veripicks-LineMovement
 * PK: movementId, SK: timestamp
 */
export interface LineMovement {
  movementId: UUID; // UUID - Primary identifier
  id: string; // gameId-timestamp-bookId-market-side for quick lookup
  gameId: string; // Changed to string to match actual usage
  timestamp: string;
  bookId: number; // Changed from book_id for consistency
  marketType: "moneyline" | "spread" | "total";
  side: "home" | "away" | "over" | "under"; // Which side the line moved for

  // Line/Odds changes
  oldLine?: number; // Previous line value (-140, -15, 53)
  newLine: number; // New line value
  oldOdds?: number; // Previous odds (for spreads/totals)
  newOdds?: number; // New odds
  change?: number; // Calculated change (+25, -10, etc.)
  movementDirection?: "up" | "down";

  // Public betting data at time of movement
  publicBetting?: {
    tickets?: {
      percent: number; // % of tickets on this side
      value?: number; // Number of tickets
    };
    money?: {
      percent: number; // % of money on this side
      value?: number; // Dollar amount
    };
  };

  // Outcome tracking (set after game completion)
  outcome?: {
    didCover: boolean; // Did this line/bet cover?
    finalScore?: {
      home: number;
      away: number;
    };
    margin?: number; // Final margin of victory
    total?: number; // Final total points (for totals)
    gradedAt?: string; // When outcome was determined
  };

  // Action Network references
  outcomeId?: number; // Action Network outcome ID
  marketId?: number; // Action Network market ID

  // Metadata
  createdAt: string;
  updatedAt: string;
  expiresAt: number; // TTL - 30 days (longer for outcome tracking)
}

/**
 * Steam Move Entity - Coordinated line movements
 * DynamoDB Table: captify-veripicks-SteamMove
 * PK: steamMoveId, SK: gameId
 */
export interface SteamMove {
  steamMoveId: UUID; // UUID - Primary identifier
  id: number; // gameId for quick lookup
  gameId: UUID;
  timestamp: string;
  marketType: "spread" | "total" | "moneyline";
  side: string;
  booksMoved: number; // Number of books that moved
  movementSize: number;
  significance: "low" | "medium" | "high" | "extreme";
  affectedOutcomes: number[]; // Action Network outcome IDs
  createdAt: string;
  expiresAt: number; // TTL - 7 days
}

// Supporting Enhanced Types

export interface PublicBettingData {
  ticketsPercentage: number; // % of tickets
  moneyPercentage: number; // % of money
  reverseLinesMovement: boolean; // Line moving opposite to public
  sharpAction: boolean; // Professional money detected
}

export interface BestOddsData {
  side: string;
  bookId: number;
  bookName: string;
  odds: number;
  value: number;
  coefficientScore: number;
  outcomeId: number;
}

// ===================================================================
// TYPE ALIASES FOR API COMPATIBILITY
// ===================================================================

/**
 * Type aliases for backward compatibility (replacing Zod inference types)
 */

// Main entity types (aliases to existing interfaces)
export type GameInput = Game;
export type PickInput = Pick;
export type UserDataInput = UserData;

// API request/response types (aliases to existing interfaces)
export type CreatePickRequestInput = CreatePickRequest;
export type UpdatePickRequestInput = UpdatePickRequest;
export type GameQueryParamsInput = GameQueryParams;
export type PicksQueryParamsInput = PicksQueryParams;
