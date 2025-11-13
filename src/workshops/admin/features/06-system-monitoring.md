# Feature: System Monitoring

## Overview

Real-time monitoring dashboard for platform health, application status, AWS service metrics, and performance analytics. Integrates with CloudWatch, PM2, and AWS service health checks.

## Requirements

### Functional Requirements

1. **Platform Health Dashboard**
   - Overall system status (healthy/degraded/down)
   - Component status: Platform, PM2 apps, databases, AWS services
   - Real-time metrics refreshing every 30s
   - Historical trends (24h, 7d, 30d)

2. **Application Monitoring**
   - PM2 process status for all apps
   - CPU, memory, uptime per app
   - Restart count and error rates
   - Response time and throughput

3. **AWS Service Health**
   - DynamoDB: Table status, consumed capacity, throttles
   - S3: Bucket metrics, request counts, errors
   - Cognito: User pool metrics, sign-ins, failures
   - Aurora: Connection count, query latency
   - Bedrock: API calls, token usage, latency

4. **Alerts & Notifications**
   - Define alert thresholds (CPU >80%, error rate >5%)
   - Email/SMS notifications via SNS
   - Alert history and resolution tracking
   - On-call rotation management

5. **Logs Viewer**
   - PM2 logs for all applications
   - CloudWatch log groups
   - Filter by: app, severity, time range
   - Search logs with regex
   - Export logs to S3

### Non-Functional Requirements

1. **Performance**: Dashboard loads in <2s, updates in <500ms
2. **Real-time**: Metrics refresh every 30s without full reload
3. **Reliability**: Monitoring continues even if app is degraded
4. **Retention**: Metrics stored for 90 days

## Architecture

```
Admin UI → API → PM2 API (local apps)
                → CloudWatch (AWS metrics)
                → DynamoDB (metric storage)
                → SNS (alerts)
```

## Data Model

### DynamoDB Table: `core-monitoring-metric`

```typescript
interface Metric {
  id: string;                    // PK: {component}-{timestamp}
  component: string;             // SK: "platform" | "pmbook" | "dynamodb" | "s3"
  timestamp: string;             // ISO 8601

  // Metric values
  type: string;                  // "cpu" | "memory" | "latency" | "errors"
  value: number;
  unit: string;                  // "%", "MB", "ms", "count"

  // Context
  status: 'healthy' | 'warning' | 'critical';
  metadata?: {
    [key: string]: any;          // Component-specific data
  };

  // Indexing
  createdAt: string;             // GSI: timestamp-index
}
```

### DynamoDB Table: `core-monitoring-alert`

```typescript
interface Alert {
  id: string;                    // PK: alert-{timestamp}-{random}
  name: string;                  // Alert name

  // Trigger
  component: string;             // What to monitor
  metric: string;                // Which metric
  threshold: number;             // Trigger value
  condition: '>' | '<' | '==' | '!=';

  // Notification
  severity: 'info' | 'warning' | 'critical';
  notifyChannels: string[];      // ["email", "sms", "slack"]
  recipients: string[];          // Email addresses or phone numbers

  // State
  active: boolean;
  triggered: boolean;
  lastTriggered?: string;
  triggeredCount: number;

  // Metadata
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
```

## API Actions

### getSystemHealth()
- **Purpose**: Get overall system health
- **Input**: None
- **Output**:
```typescript
{
  status: 'healthy' | 'degraded' | 'down',
  components: {
    platform: ComponentHealth,
    applications: { [appName]: ComponentHealth },
    databases: { [dbName]: ComponentHealth },
    services: { [serviceName]: ComponentHealth }
  },
  lastChecked: string
}
```

### getAppMetrics(appName: string, timeRange: string)
- **Purpose**: Get metrics for specific app
- **Input**: `{ appName: "pmbook", timeRange: "24h" | "7d" | "30d" }`
- **Output**:
```typescript
{
  cpu: TimeSeries[],
  memory: TimeSeries[],
  restarts: number,
  uptime: number,
  errors: TimeSeries[]
}
```

### getPM2Status()
- **Purpose**: Get PM2 process list
- **Input**: None
- **Output**:
```typescript
{
  processes: [
    {
      name: string,
      pid: number,
      status: 'online' | 'stopping' | 'stopped' | 'errored',
      cpu: number,
      memory: number,
      uptime: number,
      restarts: number
    }
  ]
}
```

### getCloudWatchMetrics(request: CloudWatchRequest)
- **Purpose**: Get CloudWatch metrics
- **Input**:
```typescript
{
  namespace: 'AWS/DynamoDB' | 'AWS/S3' | 'AWS/Cognito',
  metricName: string,
  dimensions: { [key: string]: string },
  startTime: string,
  endTime: string,
  period: number  // seconds
}
```
- **Output**: `{ datapoints: CloudWatchDatapoint[] }`

### createAlert(data: AlertCreate)
- **Purpose**: Create new alert
- **Input**:
```typescript
{
  name: string,
  component: string,
  metric: string,
  threshold: number,
  condition: '>' | '<' | '==' | '!=',
  severity: 'info' | 'warning' | 'critical',
  notifyChannels: string[],
  recipients: string[]
}
```
- **Output**: `{ alert: Alert }`

### getLogs(request: LogRequest)
- **Purpose**: Get application logs
- **Input**:
```typescript
{
  source: 'pm2' | 'cloudwatch',
  appName?: string,
  logGroup?: string,
  startTime: string,
  endTime: string,
  filter?: string,  // Regex
  limit?: number
}
```
- **Output**: `{ logs: LogEntry[], nextToken?: string }`

## UI/UX

### Dashboard Layout
```
┌────────────────────────────────────────────────────┐
│ System Health                        [Last 24h ▼] │
│ ● Healthy - All systems operational                │
├────────────────────────────────────────────────────┤
│ ┌──────────────┐ ┌──────────────┐ ┌─────────────┐ │
│ │ Platform     │ │ Applications │ │ Databases   │ │
│ │ ● Online     │ │ 5/5 Running  │ │ ● Connected │ │
│ │ CPU: 45%     │ │ CPU: 62%     │ │ Latency: 3ms│ │
│ │ Mem: 2.1GB   │ │ Mem: 8.4GB   │ │             │ │
│ └──────────────┘ └──────────────┘ └─────────────┘ │
├────────────────────────────────────────────────────┤
│ Application Status                                 │
│ ┌─────────┬────────┬──────┬────────┬──────────┐   │
│ │ App     │ Status │ CPU  │ Memory │ Uptime   │   │
│ ├─────────┼────────┼──────┼────────┼──────────┤   │
│ │Platform │ ● Online│ 45% │ 2.1GB  │ 5d 3h    │   │
│ │PMBook   │ ● Online│ 32% │ 1.8GB  │ 5d 3h    │   │
│ │AIHub    │ ● Online│ 28% │ 1.5GB  │ 5d 3h    │   │
│ │MI       │ ● Online│ 15% │ 0.9GB  │ 5d 3h    │   │
│ └─────────┴────────┴──────┴────────┴──────────┘   │
├────────────────────────────────────────────────────┤
│ AWS Services                                       │
│ DynamoDB: 15 tables, 1.2M requests/min, 0 throttles│
│ S3: 8 buckets, 340GB storage, 45K requests/hour   │
│ Cognito: 247 users, 18 sign-ins today             │
└────────────────────────────────────────────────────┘
```

### Metrics Chart View
- **Time Range Selector**: 1h, 24h, 7d, 30d, Custom
- **Metric Selector**: CPU, Memory, Latency, Errors, Requests
- **Chart Type**: Line (default), Area, Bar
- **Multi-app Comparison**: Overlay multiple apps on same chart

### Alerts Management
- **List View**: Active alerts with status indicators
- **Create Alert Form**:
  - Component dropdown
  - Metric dropdown (context-aware based on component)
  - Threshold input with unit
  - Condition selector (>, <, ==, !=)
  - Severity radio buttons
  - Notification channels checkboxes
  - Recipients multi-input (email/phone)
- **Alert History**: Show triggered alerts with resolution notes

### Logs Viewer
- **Source Tabs**: PM2 Logs | CloudWatch Logs
- **Filter Panel**:
  - App selector (for PM2)
  - Log group selector (for CloudWatch)
  - Time range picker
  - Severity filter
  - Search input (regex)
- **Log Display**:
  - Monospace font
  - Syntax highlighting for JSON
  - Timestamp, severity, message columns
  - Expand for full stack traces
- **Actions**: Export to CSV, Copy to clipboard, Tail mode

## AWS Integration

### CloudWatch Metrics
```typescript
import { CloudWatchClient, GetMetricStatisticsCommand } from '@aws-sdk/client-cloudwatch';

const cloudwatch = new CloudWatchClient({ region: 'us-east-1' });

// Get DynamoDB consumed capacity
const params = {
  Namespace: 'AWS/DynamoDB',
  MetricName: 'ConsumedReadCapacityUnits',
  Dimensions: [{ Name: 'TableName', Value: 'captify-core-user' }],
  StartTime: new Date(Date.now() - 3600000), // 1 hour ago
  EndTime: new Date(),
  Period: 300, // 5 minutes
  Statistics: ['Average', 'Maximum']
};

const data = await cloudwatch.send(new GetMetricStatisticsCommand(params));
```

### CloudWatch Logs
```typescript
import { CloudWatchLogsClient, FilterLogEventsCommand } from '@aws-sdk/client-cloudwatch-logs';

const cwLogs = new CloudWatchLogsClient({ region: 'us-east-1' });

const params = {
  logGroupName: '/aws/lambda/platform-api',
  startTime: Date.now() - 3600000,
  endTime: Date.now(),
  filterPattern: 'ERROR',
  limit: 100
};

const logs = await cwLogs.send(new FilterLogEventsCommand(params));
```

### PM2 Integration
```typescript
import pm2 from 'pm2';

pm2.connect((err) => {
  if (err) throw err;

  pm2.list((err, processes) => {
    const status = processes.map(proc => ({
      name: proc.name,
      pid: proc.pid,
      status: proc.pm2_env.status,
      cpu: proc.monit.cpu,
      memory: proc.monit.memory,
      uptime: Date.now() - proc.pm2_env.pm_uptime,
      restarts: proc.pm2_env.restart_time
    }));

    pm2.disconnect();
    return status;
  });
});
```

### SNS Alerts
```typescript
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

const sns = new SNSClient({ region: 'us-east-1' });

async function sendAlert(alert: Alert, metric: Metric) {
  const message = `
    Alert: ${alert.name}
    Severity: ${alert.severity}
    Component: ${metric.component}
    Metric: ${metric.type} = ${metric.value}${metric.unit}
    Threshold: ${alert.condition} ${alert.threshold}
    Time: ${new Date().toISOString()}
  `;

  await sns.send(new PublishCommand({
    TopicArn: process.env.SNS_ALERTS_TOPIC_ARN,
    Subject: `[${alert.severity.toUpperCase()}] ${alert.name}`,
    Message: message
  }));
}
```

## Security Considerations

- Only captify-admin can view system metrics
- Sensitive data (API keys, secrets) redacted from logs
- CloudWatch logs access controlled via IAM
- PM2 API restricted to localhost
- Alert SNS topic has encryption enabled

## Testing

### Test Scenarios
1. System healthy → Verify green status
2. App down → Verify red status, alert triggered
3. High CPU → Verify warning status, alert sent
4. CloudWatch query → Verify correct metrics returned
5. PM2 status → Verify process list accurate
6. Create alert → Verify saved, notifications work
7. View logs → Verify filtering and search work

## Dependencies

- AWS CloudWatch (metrics & logs)
- PM2 (application monitoring)
- AWS SNS (alerting)
- DynamoDB (metric storage)

## Performance Optimizations

1. **Metric Aggregation**: Store pre-aggregated metrics for historical data
2. **Caching**: Cache CloudWatch queries for 1 minute
3. **Lazy Loading**: Load charts on-demand, not all at once
4. **WebSockets**: Use WebSocket for real-time updates instead of polling
5. **Sampling**: Sample high-frequency metrics (every 5min, not every 1min)

---

**Feature ID**: #6
**Priority**: P1
**Story Points**: 8
**Status**: Not Started
