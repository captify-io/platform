-- TITAN Database Schema
-- AWS Console-style application platform with Bedrock agents

-- Organizations and Users (extends Cognito)
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    aws_account_id VARCHAR(12),
    aws_region VARCHAR(20) DEFAULT 'us-east-1',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cognito_user_id VARCHAR(255) UNIQUE NOT NULL, -- From Cognito sub
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    organization_id UUID REFERENCES organizations(id),
    role VARCHAR(50) DEFAULT 'user', -- admin, user, viewer
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Applications (each has its own Bedrock agent)
CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(255), -- Icon identifier/URL
    category VARCHAR(100), -- Analytics, AI, Data, etc.
    
    -- Bedrock Agent Configuration
    bedrock_agent_id VARCHAR(255) NOT NULL,
    bedrock_alias_id VARCHAR(255) NOT NULL,
    bedrock_region VARCHAR(20) DEFAULT 'us-east-1',
    
    -- Application metadata
    is_active BOOLEAN DEFAULT true,
    is_aws_native BOOLEAN DEFAULT false, -- true for AWS services, false for custom apps
    aws_service_name VARCHAR(100), -- e.g., 'bedrock', 'comprehend'
    
    organization_id UUID REFERENCES organizations(id),
    created_by UUID REFERENCES user_profiles(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User favorites and recently visited
CREATE TABLE user_application_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES user_profiles(id),
    application_id UUID REFERENCES applications(id),
    is_favorite BOOLEAN DEFAULT false,
    last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    access_count INTEGER DEFAULT 1,
    
    UNIQUE(user_id, application_id)
);

-- Decision Sessions (chat-based conversations)
CREATE TABLE decision_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    user_id UUID REFERENCES user_profiles(id),
    application_id UUID REFERENCES applications(id),
    organization_id UUID REFERENCES organizations(id),
    
    -- Session state
    status VARCHAR(50) DEFAULT 'active', -- active, completed, archived
    outcome JSONB, -- Final decision/recommendation
    context_data JSONB DEFAULT '{}', -- Additional context
    
    -- AWS integration
    s3_data_path VARCHAR(500), -- Path to session data in S3
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Chat messages within decision sessions
CREATE TABLE session_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES decision_sessions(id) ON DELETE CASCADE,
    
    -- Message content
    role VARCHAR(20) NOT NULL, -- user, assistant, system
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}', -- tokens, model info, etc.
    
    -- Bedrock integration
    bedrock_trace_id VARCHAR(255), -- For audit trail
    bedrock_response_metadata JSONB,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Data sources and context for applications
CREATE TABLE data_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- AWS data pipeline integration
    s3_bucket VARCHAR(255),
    s3_prefix VARCHAR(500),
    glue_database VARCHAR(255),
    glue_table VARCHAR(255),
    
    -- Data processing
    textract_enabled BOOLEAN DEFAULT false,
    comprehend_enabled BOOLEAN DEFAULT false,
    
    application_id UUID REFERENCES applications(id),
    organization_id UUID REFERENCES organizations(id),
    created_by UUID REFERENCES user_profiles(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_user_profiles_cognito_user_id ON user_profiles(cognito_user_id);
CREATE INDEX idx_user_profiles_organization ON user_profiles(organization_id);
CREATE INDEX idx_applications_organization ON applications(organization_id);
CREATE INDEX idx_applications_bedrock_agent ON applications(bedrock_agent_id, bedrock_alias_id);
CREATE INDEX idx_user_interactions_user_favorite ON user_application_interactions(user_id, is_favorite);
CREATE INDEX idx_user_interactions_last_accessed ON user_application_interactions(user_id, last_accessed DESC);
CREATE INDEX idx_decision_sessions_user ON decision_sessions(user_id, created_at DESC);
CREATE INDEX idx_session_messages_session ON session_messages(session_id, created_at);
CREATE INDEX idx_data_sources_application ON data_sources(application_id);
