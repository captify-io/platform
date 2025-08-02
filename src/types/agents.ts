// AWS Bedrock Agent Types
export interface BedrockAgent {
  agentId: string;
  agentName: string;
  agentArn?: string;
  description?: string;
  foundationModel: string;
  instruction?: string;
  agentStatus:
    | "CREATING"
    | "PREPARING"
    | "PREPARED"
    | "NOT_PREPARED"
    | "DELETING"
    | "FAILED"
    | "VERSIONING"
    | "UPDATING";
  agentResourceRoleArn?: string;
  createdAt: string;
  updatedAt: string;
  agentVersion?: string;
  idleSessionTTLInSeconds?: number;
  memoryConfiguration?: MemoryConfiguration;
  guardrailConfiguration?: GuardrailConfiguration;
  failureReasons?: string[];
  recommendedActions?: string[];
  clientToken?: string;
  customerEncryptionKeyArn?: string;
  tags?: Record<string, string>;
}

export interface MemoryConfiguration {
  enabledMemoryTypes: "SESSION_SUMMARY"[];
  storageDays?: number;
  sessionSummaryConfiguration?: {
    maxRecentSessions: number;
  };
}

export interface GuardrailConfiguration {
  guardrailIdentifier: string;
  guardrailVersion: string;
}

export interface AgentAlias {
  agentAliasId: string;
  agentAliasName: string;
  agentAliasArn?: string;
  agentId: string;
  description?: string;
  agentAliasStatus:
    | "CREATING"
    | "PREPARED"
    | "FAILED"
    | "UPDATING"
    | "DELETING";
  createdAt: string;
  updatedAt: string;
  routingConfiguration?: RoutingConfiguration[];
  agentAliasHistoryEvents?: AgentAliasHistoryEvent[];
  clientToken?: string;
  tags?: Record<string, string>;
}

export interface RoutingConfiguration {
  agentVersion: string;
  provisionedThroughput?: string;
}

export interface AgentAliasHistoryEvent {
  endDate?: string;
  routingConfiguration?: RoutingConfiguration[];
  startDate?: string;
}

export interface AgentActionGroup {
  actionGroupId: string;
  actionGroupName: string;
  agentId: string;
  agentVersion: string;
  actionGroupExecutor?: {
    lambda?: string;
    customControl?: "RETURN_CONTROL";
  };
  actionGroupState?: "ENABLED" | "DISABLED";
  apiSchema?: {
    payload?: string;
    s3?: {
      s3BucketName: string;
      s3ObjectKey: string;
    };
  };
  description?: string;
  parentActionSignature?: "AMAZON.UserInput" | "AMAZON.CodeInterpreter";
  createdAt: string;
  updatedAt: string;
  clientToken?: string;
}

export interface CreateAgentRequest {
  agentName: string;
  description?: string;
  foundationModel: string;
  instruction?: string;
  agentResourceRoleArn?: string;
  idleSessionTTLInSeconds?: number;
  memoryConfiguration?: MemoryConfiguration;
  guardrailConfiguration?: GuardrailConfiguration;
  tags?: Record<string, string>;
  clientToken?: string;
  customerEncryptionKeyArn?: string;
}

export interface UpdateAgentRequest {
  agentId: string;
  agentName: string;
  description?: string;
  foundationModel: string;
  instruction?: string;
  agentResourceRoleArn?: string;
  idleSessionTTLInSeconds?: number;
  memoryConfiguration?: MemoryConfiguration;
  guardrailConfiguration?: GuardrailConfiguration;
}

export interface AgentTestRequest {
  agentId: string;
  agentAliasId?: string;
  sessionId?: string;
  inputText: string;
  enableTrace?: boolean;
}

export interface AgentTestResponse {
  agentId: string;
  sessionId: string;
  completion: string;
  citations?: Citation[];
  trace?: TraceEvent[];
  sessionState?: {
    files?: SessionAttributeFile[];
    invocationId?: string;
    knowledgeBaseConfigurations?: KnowledgeBaseConfiguration[];
    promptSessionAttributes?: Record<string, string>;
    returnControlInvocationResults?: InvocationResultMember[];
    sessionAttributes?: Record<string, string>;
  };
}

export interface Citation {
  generatedResponsePart: {
    textResponsePart: {
      span: {
        end: number;
        start: number;
      };
      text: string;
    };
  };
  retrievedReferences: RetrievedReference[];
}

export interface RetrievedReference {
  content: {
    text: string;
  };
  location: {
    s3Location?: {
      uri: string;
    };
    type: "S3";
  };
  metadata?: Record<string, unknown>;
}

export interface TraceEvent {
  trace: {
    orchestrationTrace?: {
      invocationInput?: Record<string, unknown>;
      modelInvocationInput?: Record<string, unknown>;
      modelInvocationOutput?: Record<string, unknown>;
      observation?: Record<string, unknown>;
      rationale?: Record<string, unknown>;
    };
    postProcessingTrace?: Record<string, unknown>;
    preProcessingTrace?: Record<string, unknown>;
  };
}

export interface SessionAttributeFile {
  name: string;
  source: {
    byteContent: string;
    s3Location?: {
      uri: string;
    };
    sourceType: "S3" | "BYTE_CONTENT";
  };
  useCase: "CODE_INTERPRETER" | "CHAT";
}

export interface KnowledgeBaseConfiguration {
  knowledgeBaseId: string;
  retrievalConfiguration: {
    vectorSearchConfiguration: {
      filter?: Record<string, unknown>;
      numberOfResults?: number;
      overrideSearchType?: "HYBRID" | "SEMANTIC";
    };
  };
}

export interface InvocationResultMember {
  apiResult?: {
    actionGroup: string;
    apiPath?: string;
    httpMethod?: string;
    httpStatusCode?: number;
    responseBody?: Record<string, unknown>;
    responseState?: "FAILURE" | "REPROMPT";
  };
  functionResult?: {
    actionGroup: string;
    function?: string;
    responseBody?: Record<string, unknown>;
    responseState?: "FAILURE" | "REPROMPT";
  };
}

// Foundation Model Types
export interface FoundationModel {
  modelId: string;
  modelName: string;
  providerName: string;
  modelArn?: string;
  inputModalities?: ("TEXT" | "IMAGE" | "EMBEDDING")[];
  outputModalities?: ("TEXT" | "IMAGE" | "EMBEDDING")[];
  responseStreamingSupported?: boolean;
  customizationsSupported?: ("FINE_TUNING" | "CONTINUED_PRE_TRAINING")[];
  inferenceTypesSupported?: ("ON_DEMAND" | "PROVISIONED")[];
  modelLifecycle?: {
    status: "ACTIVE" | "LEGACY";
  };
}

// Application Integration Types
export interface ApplicationAgentMapping {
  applicationId: string;
  applicationName: string;
  agentId?: string;
  agentName?: string;
  agentStatus?: string;
  autoCreateAgent?: boolean;
  agentConfiguration?: {
    foundationModel: string;
    instruction: string;
    description: string;
  };
}

// API Response Types
export interface ListAgentsResponse {
  agentSummaries: {
    agentId: string;
    agentName: string;
    agentStatus: string;
    description?: string;
    updatedAt: string;
    latestAgentVersion?: string;
    guardrailConfiguration?: GuardrailConfiguration;
  }[];
  nextToken?: string;
}

export interface AgentErrorInterface {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export class AgentError extends Error implements AgentErrorInterface {
  constructor(
    public code: string,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "AgentError";
  }
}
