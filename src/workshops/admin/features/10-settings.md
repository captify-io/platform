# Feature: Settings

## Overview

Platform-wide configuration and settings management. Control platform behavior, feature flags, integrations, security policies, and admin preferences.

## Requirements

### Functional Requirements

1. **General Settings**
   - Platform name and branding
   - Default timezone
   - Date/time format preferences
   - Language settings (for future i18n)
   - Session timeout duration

2. **Security Settings**
   - Password policies (length, complexity, expiration)
   - MFA enforcement (required/optional/disabled)
   - IP whitelist/blacklist
   - Rate limiting thresholds
   - Session security (cookie settings, CORS)

3. **Authentication Settings**
   - Cognito User Pool configuration
   - Identity Pool settings
   - OAuth providers (enable/disable)
   - Social login providers (Google, Microsoft, etc.)
   - SAML/SSO configuration

4. **Email Settings**
   - SES configuration
   - Email templates (welcome, password reset, notifications)
   - Sender addresses (verified in SES)
   - Email notification preferences

5. **Feature Flags**
   - Enable/disable platform features
   - Beta feature access
   - Gradual rollouts (percentage-based)
   - Per-app feature toggles

6. **Integration Settings**
   - AWS service configurations
   - Third-party API keys (Slack, Jira, etc.)
   - Webhook endpoints
   - External data sources

7. **Notification Settings**
   - SNS topic configurations
   - Alert channels (email, SMS, Slack)
   - Notification templates
   - Quiet hours (suppress non-critical alerts)

8. **Admin Preferences**
   - Dark mode / Light mode
   - Sidebar collapsed by default
   - Default page on login
   - Email digest frequency

### Non-Functional Requirements

1. **Validation**: All settings validated before save
2. **Audit**: All changes logged
3. **Versioning**: Track configuration history
4. **Backup**: Auto-backup before changes
5. **Rollback**: Ability to revert to previous settings

## Architecture

```
Admin UI → API → DynamoDB (core-setting)
                → Parameter Store (sensitive configs)
                → Secrets Manager (API keys)
                → Cognito (auth settings)
                → SES (email settings)
                → SNS (notification settings)
```

## Data Model

### DynamoDB Table: `core-setting`

```typescript
interface Setting {
  // Primary Key
  id: string;                    // PK: setting category (e.g., "general", "security", "email")
  key: string;                   // SK: specific setting key (e.g., "platform_name", "session_timeout")

  // Value
  value: any;                    // Setting value (string, number, boolean, object)
  type: 'string' | 'number' | 'boolean' | 'json' | 'secret';

  // Metadata
  description?: string;
  defaultValue?: any;
  required: boolean;
  sensitive: boolean;            // If true, store in Secrets Manager

  // Validation
  validation?: {
    type: 'regex' | 'range' | 'enum';
    rule: string | number[] | string[];
    errorMessage?: string;
  };

  // History
  previousValue?: any;
  version: number;
  updatedBy: string;
  updatedAt: string;

  // State
  active: boolean;
}
```

### DynamoDB Table: `core-setting-history`

```typescript
interface SettingHistory {
  id: string;                    // PK: {category}-{key}
  timestamp: string;             // SK: ISO 8601 timestamp

  // Change
  oldValue: any;
  newValue: any;

  // Audit
  changedBy: string;
  changedAt: string;
  reason?: string;               // Optional change reason

  // Rollback info
  canRollback: boolean;
  rollbackCommand?: string;
}
```

### DynamoDB Table: `core-feature-flag`

```typescript
interface FeatureFlag {
  id: string;                    // PK: feature-{name}
  name: string;
  description: string;

  // State
  enabled: boolean;

  // Rollout
  rolloutPercentage?: number;    // 0-100 (gradual rollout)
  enabledForApps?: string[];     // Specific apps only
  enabledForGroups?: string[];   // Specific user groups only

  // Metadata
  category: string;              // "core" | "experimental" | "beta"
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
```

## API Actions

### getSettings(category?: string)
- **Purpose**: Get all settings or settings by category
- **Input**: `{ category?: 'general' | 'security' | 'email' | 'auth' }`
- **Output**: `{ settings: Setting[] }`

### getSetting(category: string, key: string)
- **Purpose**: Get specific setting value
- **Input**: `{ category: 'general', key: 'platform_name' }`
- **Output**: `{ setting: Setting }`

### updateSetting(category: string, key: string, value: any)
- **Purpose**: Update setting value
- **Input**: `{ category, key, value, reason?: string }`
- **Validation**: Validate against setting rules
- **Output**: `{ setting: Setting }`
- **Side Effects**: Create history entry, audit log

### bulkUpdateSettings(updates: SettingUpdate[])
- **Purpose**: Update multiple settings atomically
- **Input**: `{ updates: [{ category, key, value }] }`
- **Output**: `{ updated: number, failed: SettingError[] }`
- **Side Effects**: Create history entries, audit log

### getSettingHistory(category: string, key: string)
- **Purpose**: Get change history for setting
- **Input**: `{ category, key, limit?: number }`
- **Output**: `{ history: SettingHistory[] }`

### rollbackSetting(category: string, key: string, timestamp: string)
- **Purpose**: Rollback setting to previous value
- **Input**: `{ category, key, timestamp }`
- **Output**: `{ setting: Setting }`
- **Side Effects**: Create history entry, audit log

### getFeatureFlags()
- **Purpose**: Get all feature flags
- **Input**: None
- **Output**: `{ flags: FeatureFlag[] }`

### updateFeatureFlag(flagId: string, data: FlagUpdate)
- **Purpose**: Update feature flag state
- **Input**: `{ flagId, enabled: boolean, rolloutPercentage?: number }`
- **Output**: `{ flag: FeatureFlag }`
- **Side Effects**: Audit log

### validateSettings(category?: string)
- **Purpose**: Validate all settings or category
- **Input**: `{ category?: string }`
- **Output**: `{ valid: boolean, errors: ValidationError[] }`

## UI/UX

### Settings Layout
```
┌─────────────────────────────────────────────────────────────────┐
│ Settings                                                        │
├──────────────┬──────────────────────────────────────────────────┤
│              │                                                  │
│ General      │ General Settings                                │
│ Security     │ ┌────────────────────────────────────────────┐  │
│ Auth         │ │ Platform Name                              │  │
│ Email        │ │ [Captify Platform___________________]      │  │
│ Features     │ └────────────────────────────────────────────┘  │
│ Integrations │ ┌────────────────────────────────────────────┐  │
│ Notifications│ │ Default Timezone                           │  │
│ Preferences  │ │ [America/New_York ▼]                       │  │
│              │ └────────────────────────────────────────────┘  │
│              │ ┌────────────────────────────────────────────┐  │
│              │ │ Session Timeout (minutes)                  │  │
│              │ │ [15_____________________________] 1-1440   │  │
│              │ └────────────────────────────────────────────┘  │
│              │ ┌────────────────────────────────────────────┐  │
│              │ │ Date Format                                │  │
│              │ │ ● MM/DD/YYYY  ○ DD/MM/YYYY  ○ YYYY-MM-DD   │  │
│              │ └────────────────────────────────────────────┘  │
│              │                                                  │
│              │ [Reset to Defaults] [Save Changes]               │
└──────────────┴──────────────────────────────────────────────────┘
```

### Security Settings
```
┌─────────────────────────────────────────────────────────────────┐
│ Security Settings                                               │
├─────────────────────────────────────────────────────────────────┤
│ Password Policy                                                 │
│ ┌──────────────────────────────────────────────────────────┐    │
│ │ Minimum Length: [12] characters                          │    │
│ │ ☑ Require uppercase letter                               │    │
│ │ ☑ Require lowercase letter                               │    │
│ │ ☑ Require number                                         │    │
│ │ ☑ Require special character                              │    │
│ │ Password expires after: [90] days                        │    │
│ └──────────────────────────────────────────────────────────┘    │
│                                                                 │
│ Multi-Factor Authentication                                     │
│ ┌──────────────────────────────────────────────────────────┐    │
│ │ ● Required for all users                                 │    │
│ │ ○ Optional (recommended)                                 │    │
│ │ ○ Disabled                                               │    │
│ │                                                           │    │
│ │ Allowed MFA methods:                                      │    │
│ │ ☑ TOTP (Google Authenticator, Authy)                     │    │
│ │ ☑ SMS                                                     │    │
│ │ ☐ Email                                                   │    │
│ └──────────────────────────────────────────────────────────┘    │
│                                                                 │
│ IP Whitelist                                                    │
│ ┌──────────────────────────────────────────────────────────┐    │
│ │ [192.168.1.0/24____________________] [Add]               │    │
│ │                                                           │    │
│ │ Allowed IPs:                                              │    │
│ │ • 192.168.1.0/24                             [Remove]     │    │
│ │ • 10.0.0.0/8                                 [Remove]     │    │
│ └──────────────────────────────────────────────────────────┘    │
│                                                                 │
│ [Save Security Settings]                                        │
└─────────────────────────────────────────────────────────────────┘
```

### Feature Flags
```
┌─────────────────────────────────────────────────────────────────┐
│ Feature Flags                                [+ New Flag]       │
├─────────────────────────────────────────────────────────────────┤
│ Core Features                                                   │
│ ┌──────────────────────────────────────────────────────────┐    │
│ │ ☑ Agent Chat                                             │    │
│ │   AI-powered chat assistant                              │    │
│ │   Rollout: 100% | All Apps                  [Configure]  │    │
│ └──────────────────────────────────────────────────────────┘    │
│ ┌──────────────────────────────────────────────────────────┐    │
│ │ ☑ Workflow Designer                                      │    │
│ │   Visual workflow builder                                │    │
│ │   Rollout: 100% | All Apps                  [Configure]  │    │
│ └──────────────────────────────────────────────────────────┘    │
│                                                                 │
│ Beta Features                                                   │
│ ┌──────────────────────────────────────────────────────────┐    │
│ │ ☑ Semantic Search                                        │    │
│ │   Advanced semantic search with Kendra                   │    │
│ │   Rollout: 50% | pmbook, aihub              [Configure]  │    │
│ └──────────────────────────────────────────────────────────┘    │
│ ┌──────────────────────────────────────────────────────────┐    │
│ │ ☐ Real-time Collaboration                                │    │
│ │   Live editing with multiple users                       │    │
│ │   Rollout: 0% | Disabled                    [Configure]  │    │
│ └──────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### Feature Flag Configuration Modal
```
┌─────────────────────────────────────────────────────────────────┐
│ Configure Feature: Semantic Search                   [✕]       │
├─────────────────────────────────────────────────────────────────┤
│ Enable Feature:                                                 │
│ ☑ Enabled                                                       │
│                                                                 │
│ Rollout Strategy:                                               │
│ ● Gradual rollout (percentage-based)                            │
│ ○ Specific apps only                                            │
│ ○ Specific user groups only                                     │
│ ○ All users                                                     │
│                                                                 │
│ Rollout Percentage:                                             │
│ [████████████░░░░░░░░░] 50%                                     │
│                                                                 │
│ Enabled For Apps:                                               │
│ ☑ pmbook                                                        │
│ ☑ aihub                                                         │
│ ☐ mi                                                            │
│ ☐ platform                                                      │
│                                                                 │
│ Notes:                                                          │
│ [Testing semantic search with pilot users in pmbook and aihub] │
│                                                                 │
│ [Save] [Cancel]                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Setting History Modal
```
┌─────────────────────────────────────────────────────────────────┐
│ Setting History: security.mfa_required                [✕]       │
├─────────────────────────────────────────────────────────────────┤
│ ┌──────────┬──────────┬──────────┬──────────┬────────────────┐  │
│ │ Date     │ Changed  │ Old Value│ New Value│ Actions        │  │
│ ├──────────┼──────────┼──────────┼──────────┼────────────────┤  │
│ │ 14:23    │ admin1   │ optional │ required │ [Rollback]     │  │
│ │ Jan 15   │          │          │          │                │  │
│ ├──────────┼──────────┼──────────┼──────────┼────────────────┤  │
│ │ 09:15    │ admin2   │ disabled │ optional │ [Rollback]     │  │
│ │ Jan 10   │          │          │          │                │  │
│ ├──────────┼──────────┼──────────┼──────────┼────────────────┤  │
│ │ 16:00    │ admin1   │ required │ disabled │ [Rollback]     │  │
│ │ Jan 5    │          │          │          │                │  │
│ └──────────┴──────────┴──────────┴──────────┴────────────────┘  │
│                                                                 │
│ [Close]                                                         │
└─────────────────────────────────────────────────────────────────┘
```

## AWS Integration

### Parameter Store for Non-Sensitive Settings
```typescript
import { SSMClient, GetParameterCommand, PutParameterCommand } from '@aws-sdk/client-ssm';

const ssm = new SSMClient({ region: 'us-east-1' });

// Get setting
const param = await ssm.send(new GetParameterCommand({
  Name: '/captify/settings/general/platform_name'
}));

// Update setting
await ssm.send(new PutParameterCommand({
  Name: '/captify/settings/general/platform_name',
  Value: 'Captify Platform',
  Type: 'String',
  Overwrite: true
}));
```

### Secrets Manager for Sensitive Settings
```typescript
import { SecretsManagerClient, GetSecretValueCommand, PutSecretValueCommand } from '@aws-sdk/client-secrets-manager';

const secrets = new SecretsManagerClient({ region: 'us-east-1' });

// Get secret
const secret = await secrets.send(new GetSecretValueCommand({
  SecretId: 'captify/integrations/slack_api_key'
}));

// Update secret
await secrets.send(new PutSecretValueCommand({
  SecretId: 'captify/integrations/slack_api_key',
  SecretString: 'xoxb-...'
}));
```

### Cognito User Pool Updates
```typescript
import { CognitoIdentityProviderClient, UpdateUserPoolCommand } from '@aws-sdk/client-cognito-identity-provider';

const cognito = new CognitoIdentityProviderClient({ region: 'us-east-1' });

// Update password policy
await cognito.send(new UpdateUserPoolCommand({
  UserPoolId: process.env.COGNITO_USER_POOL_ID,
  Policies: {
    PasswordPolicy: {
      MinimumLength: 12,
      RequireUppercase: true,
      RequireLowercase: true,
      RequireNumbers: true,
      RequireSymbols: true,
      TemporaryPasswordValidityDays: 7
    }
  },
  MfaConfiguration: 'REQUIRED' // 'OPTIONAL' | 'OFF'
}));
```

## Security Considerations

- Only captify-admin can modify settings
- Sensitive settings (API keys) stored in Secrets Manager
- All changes require confirmation for destructive operations
- Setting history retained for 1 year
- Rollback limited to last 30 days
- Validate settings before applying
- Audit all setting changes

## Testing

### Test Scenarios
1. Update general setting → Verify saved, history created
2. Update password policy → Verify Cognito updated
3. Enable feature flag → Verify flag active
4. Gradual rollout → Verify percentage respected
5. Rollback setting → Verify previous value restored
6. Invalid value → Verify validation error
7. Sensitive setting → Verify stored in Secrets Manager

## Dependencies

- DynamoDB (setting storage)
- Parameter Store (non-sensitive configs)
- Secrets Manager (sensitive configs)
- Cognito (auth settings)
- SES (email settings)
- SNS (notification settings)

## Default Settings

### General
- `platform_name`: "Captify Platform"
- `timezone`: "America/New_York"
- `date_format`: "MM/DD/YYYY"
- `session_timeout`: 15 (minutes)

### Security
- `password_min_length`: 12
- `password_require_uppercase`: true
- `password_require_lowercase`: true
- `password_require_number`: true
- `password_require_special`: true
- `password_expiry_days`: 90
- `mfa_required`: "optional"

### Email
- `sender_address`: "noreply@captify.io"
- `support_address`: "support@captify.io"

### Features
All core features enabled by default, beta features disabled.

---

**Feature ID**: #10
**Priority**: P1
**Story Points**: 5
**Status**: Not Started
