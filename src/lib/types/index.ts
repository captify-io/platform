// TypeScript types for TITAN platform
// Based on AWS Console-style application launcher

export interface Organization {
  id: string;
  name: string;
  awsAccountId?: string;
  awsRegion: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  id: string;
  cognitoUserId: string; // From NextAuth session.user.sub
  email: string;
  name?: string;
  organizationId: string;
  role: "admin" | "user" | "viewer";
  preferences: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;

  // Relations
  organization?: Organization;
}

export interface Application {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  category: string;

  // Bedrock Agent Configuration
  bedrockAgentId: string;
  bedrockAliasId: string;
  bedrockRegion: string;

  // Application metadata
  isActive: boolean;
  isAwsNative: boolean; // true for AWS services like Bedrock console
  awsServiceName?: string;

  organizationId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;

  // Relations
  organization?: Organization;
  creator?: UserProfile;
  userInteraction?: UserApplicationInteraction;
}

export interface UserApplicationInteraction {
  id: string;
  userId: string;
  applicationId: string;
  isFavorite: boolean;
  lastAccessed: Date;
  accessCount: number;

  // Relations
  application?: Application;
}

export interface DecisionSession {
  id: string;
  title: string;
  description?: string;

  userId: string;
  applicationId: string;
  organizationId: string;

  // Session state
  status: "active" | "completed" | "archived";
  outcome?: Record<string, any>;
  contextData: Record<string, any>;

  // AWS integration
  s3DataPath?: string;

  createdAt: Date;
  updatedAt: Date;

  // Relations
  user?: UserProfile;
  application?: Application;
  messages?: SessionMessage[];
}

export interface SessionMessage {
  id: string;
  sessionId: string;

  // Message content
  role: "user" | "assistant" | "system";
  content: string;
  metadata: Record<string, any>;

  // Bedrock integration
  bedrockTraceId?: string;
  bedrockResponseMetadata?: Record<string, any>;

  createdAt: Date;
}

export interface DataSource {
  id: string;
  name: string;
  description?: string;

  // AWS data pipeline integration
  s3Bucket?: string;
  s3Prefix?: string;
  glueDatabase?: string;
  glueTable?: string;

  // Data processing
  textractEnabled: boolean;
  comprehendEnabled: boolean;

  applicationId: string;
  organizationId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;

  // Relations
  application?: Application;
}

// AWS Console style navigation types
export interface NavigationSection {
  title: string;
  items: Application[];
}

export interface DashboardData {
  recentlyVisited: Application[];
  favorites: Application[];
  allApplications: Application[];
  categories: {
    [key: string]: Application[];
  };
}

// Bedrock Agent integration types
export interface BedrockAgentConfig {
  agentId: string;
  aliasId: string;
  region: string;
}

export interface BedrockInvokeRequest {
  sessionId: string;
  inputText: string;
  agentId: string;
  agentAliasId: string;
  sessionState?: {
    sessionAttributes?: Record<string, string>;
    promptSessionAttributes?: Record<string, string>;
  };
}

export interface BedrockInvokeResponse {
  completion: string;
  trace?: any;
  sessionId: string;
  citations?: any[];
}
