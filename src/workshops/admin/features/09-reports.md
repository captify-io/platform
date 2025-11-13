# Feature: Reports

## Overview

Generate and view platform analytics reports including user activity, application usage, system performance, and compliance reports. Support scheduled reports with email delivery.

## Requirements

### Functional Requirements

1. **Report Library**
   - Pre-built report templates
   - Custom report builder
   - Save reports for reuse
   - Share reports with other admins

2. **Report Types**
   - **User Activity Report**: Sign-ins, active users, group membership changes
   - **Application Usage Report**: App access counts, top users per app, feature adoption
   - **System Performance Report**: Response times, error rates, uptime
   - **Security Report**: Failed auth attempts, privilege escalations, access violations
   - **Compliance Report**: Audit trail summary, data retention status, policy compliance
   - **Cost Report**: AWS service usage, resource consumption by app

3. **Report Builder**
   - Select data source (users, apps, logs, metrics)
   - Choose time range (today, week, month, quarter, year, custom)
   - Add filters and groupings
   - Select visualizations (table, chart, metric cards)
   - Preview before generating

4. **Report Scheduling**
   - Schedule reports (daily, weekly, monthly)
   - Email delivery to distribution list
   - Export format: PDF, CSV, Excel
   - Automatic archival to S3

5. **Report Visualization**
   - Tables with sorting/filtering
   - Charts: Line, bar, pie, donut
   - Metric cards with trends
   - Heatmaps for activity patterns
   - Export to image/PDF

6. **Report Distribution**
   - Email to recipients
   - Download as PDF/CSV/Excel
   - Share link (expires in 7 days)
   - API endpoint for programmatic access

### Non-Functional Requirements

1. **Performance**: Report generation <10s for 30-day data
2. **Scalability**: Support reports with 100K+ data points
3. **Reliability**: Scheduled reports 99.9% delivery rate
4. **Storage**: Reports archived for 1 year

## Architecture

```
Admin UI → API → Lambda (Report Generator)
                      ↓
                 Data Sources (DynamoDB, CloudWatch, Cognito)
                      ↓
                 Report Engine (aggregate, transform)
                      ↓
                 Visualization (charts, tables)
                      ↓
                 Export (PDF, CSV, Excel)
                      ↓
                 Storage (S3)
                      ↓
                 Delivery (SES email)
```

## Data Model

### DynamoDB Table: `core-report-template`

```typescript
interface ReportTemplate {
  id: string;                    // PK: report-{name}
  name: string;
  description: string;
  category: 'user' | 'app' | 'system' | 'security' | 'compliance' | 'cost';

  // Configuration
  config: {
    dataSource: string;          // "users" | "apps" | "audit-logs" | "metrics"
    timeRange: {
      type: 'relative' | 'absolute';
      value: string;             // "7d" | "30d" | "2024-01-01:2024-01-31"
    };
    filters?: {
      field: string;
      operator: string;
      value: any;
    }[];
    groupBy?: string[];          // ["app", "user", "date"]
    metrics: {
      name: string;
      aggregation: 'count' | 'sum' | 'avg' | 'min' | 'max';
      field?: string;
    }[];
    visualizations: {
      type: 'table' | 'line' | 'bar' | 'pie' | 'metric';
      title: string;
      config: any;
    }[];
  };

  // Metadata
  isBuiltIn: boolean;            // Pre-built template
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  active: boolean;
}
```

### DynamoDB Table: `core-report-instance`

```typescript
interface ReportInstance {
  id: string;                    // PK: instance-{timestamp}-{random}
  templateId: string;            // FK to report template
  name: string;

  // Generation
  generatedAt: string;
  generatedBy: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  progress?: number;             // 0-100

  // Data
  dataRange: {
    start: string;
    end: string;
  };
  resultCount: number;
  resultSize: number;            // bytes

  // Output
  formats: {
    pdf?: string;                // S3 URL
    csv?: string;                // S3 URL
    excel?: string;              // S3 URL
    json?: string;               // S3 URL
  };

  // Sharing
  shareUrl?: string;
  shareExpiry?: string;

  // Metadata
  executionTime?: number;        // milliseconds
  error?: string;
  ttl: number;                   // Auto-delete after 90 days
}
```

### DynamoDB Table: `core-report-schedule`

```typescript
interface ReportSchedule {
  id: string;                    // PK: schedule-{name}
  templateId: string;
  name: string;

  // Schedule
  frequency: 'daily' | 'weekly' | 'monthly';
  dayOfWeek?: number;            // 0-6 for weekly
  dayOfMonth?: number;           // 1-31 for monthly
  time: string;                  // "08:00" UTC

  // Distribution
  recipients: string[];          // Email addresses
  format: 'pdf' | 'csv' | 'excel';
  subject: string;
  body?: string;                 // Email body template

  // State
  active: boolean;
  lastRun?: string;
  nextRun?: string;
  runCount: number;

  // Metadata
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
```

## API Actions

### listReportTemplates(category?: string)
- **Purpose**: Get available report templates
- **Input**: `{ category?: string }`
- **Output**: `{ templates: ReportTemplate[] }`

### createReportTemplate(data: TemplateCreate)
- **Purpose**: Create custom report template
- **Input**: `{ name, description, category, config }`
- **Output**: `{ template: ReportTemplate }`

### generateReport(templateId: string, params?: any)
- **Purpose**: Generate report instance
- **Input**: `{ templateId, timeRange?: string, filters?: any }`
- **Output**: `{ instanceId: string, status: 'pending' }`
- **Side Effects**: Async Lambda execution

### getReportStatus(instanceId: string)
- **Purpose**: Check report generation status
- **Input**: `{ instanceId }`
- **Output**: `{ status: string, progress: number, formats?: any }`

### listReportInstances(limit?: number)
- **Purpose**: Get generated reports
- **Input**: `{ limit?: number, nextToken?: string }`
- **Output**: `{ instances: ReportInstance[], nextToken?: string }`

### downloadReport(instanceId: string, format: string)
- **Purpose**: Get signed URL for report download
- **Input**: `{ instanceId, format: 'pdf' | 'csv' | 'excel' }`
- **Output**: `{ downloadUrl: string, expiresAt: string }`

### createSchedule(data: ScheduleCreate)
- **Purpose**: Schedule recurring report
- **Input**:
```typescript
{
  templateId: string,
  name: string,
  frequency: 'daily' | 'weekly' | 'monthly',
  time: string,
  recipients: string[],
  format: 'pdf' | 'csv' | 'excel'
}
```
- **Output**: `{ schedule: ReportSchedule }`

### listSchedules()
- **Purpose**: Get all scheduled reports
- **Input**: None
- **Output**: `{ schedules: ReportSchedule[] }`

## UI/UX

### Report Library
```
┌─────────────────────────────────────────────────────────────────┐
│ Reports                              [+ New Report] [📅 Schedules]│
├─────────────────────────────────────────────────────────────────┤
│ Templates                            [All Categories ▼]         │
│ ┌────────────────────────────────────────────────────────────┐  │
│ │ 📊 User Activity Report                    [Generate ▶]    │  │
│ │ Track user sign-ins, active users, and group changes      │  │
│ └────────────────────────────────────────────────────────────┘  │
│ ┌────────────────────────────────────────────────────────────┐  │
│ │ 📱 Application Usage Report                [Generate ▶]    │  │
│ │ Monitor app access, top users, and feature adoption       │  │
│ └────────────────────────────────────────────────────────────┘  │
│ ┌────────────────────────────────────────────────────────────┐  │
│ │ 🔒 Security Report                         [Generate ▶]    │  │
│ │ Failed auth attempts and access violations                │  │
│ └────────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│ Recent Reports                                                  │
│ ┌──────────┬─────────────────┬────────┬──────────┬─────────┐   │
│ │ Date     │ Name            │ Status │ Records  │ Actions │   │
│ ├──────────┼─────────────────┼────────┼──────────┼─────────┤   │
│ │ 14:23    │ User Activity   │ ✅ Done│ 247      │ 📥 📧 🔗│   │
│ │ 09:00    │ Weekly Summary  │ ✅ Done│ 1,523    │ 📥 📧 🔗│   │
│ │ Yesterday│ Cost Report     │ ✅ Done│ 45       │ 📥 📧 🔗│   │
│ └──────────┴─────────────────┴────────┴──────────┴─────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Report Generator
```
┌─────────────────────────────────────────────────────────────────┐
│ Generate Report: User Activity                       [✕]        │
├─────────────────────────────────────────────────────────────────┤
│ Time Range:                                                     │
│   ○ Last 7 days  ○ Last 30 days  ● Custom                       │
│   From: [2025-01-01] To: [2025-01-31]                           │
│                                                                 │
│ Filters: (optional)                                             │
│   [+ Add Filter]                                                │
│                                                                 │
│ Group By:                                                       │
│   ☑ Date  ☐ User  ☐ Group                                       │
│                                                                 │
│ Metrics:                                                        │
│   ☑ Total sign-ins                                              │
│   ☑ Unique users                                                │
│   ☑ Average session duration                                    │
│   ☐ Group membership changes                                    │
│                                                                 │
│ Visualizations:                                                 │
│   ☑ Summary table                                               │
│   ☑ Sign-in trend chart                                         │
│   ☑ Top users chart                                             │
│                                                                 │
│ [Preview] [Generate] [Cancel]                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Report View
```
┌─────────────────────────────────────────────────────────────────┐
│ User Activity Report                                  [✕]       │
│ January 1 - January 31, 2025                                    │
│                                  [📥 PDF] [📥 CSV] [📧 Email]   │
├─────────────────────────────────────────────────────────────────┤
│ Summary                                                         │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐            │
│ │ Total Sign-ins│ │ Unique Users │ │ Avg Session  │            │
│ │ 1,247        │ │ 247          │ │ 42 min       │            │
│ │ +12% vs prev │ │ +8% vs prev  │ │ -3% vs prev  │            │
│ └──────────────┘ └──────────────┘ └──────────────┘            │
├─────────────────────────────────────────────────────────────────┤
│ Sign-in Trend                                                   │
│ 80 │                                          ╱╲               │
│ 60 │                                    ╱╲   ╱  ╲              │
│ 40 │                          ╱╲       ╱  ╲ ╱    ╲             │
│ 20 │              ╱╲    ╱╲   ╱  ╲   ╱      ╲      ╲            │
│  0 └──────────────────────────────────────────────────         │
│     1/1  1/5  1/10 1/15 1/20 1/25 1/30                          │
├─────────────────────────────────────────────────────────────────┤
│ Top Users                                                       │
│ ┌──────────────────┬────────────┬──────────────┐               │
│ │ User             │ Sign-ins   │ Last Active  │               │
│ ├──────────────────┼────────────┼──────────────┤               │
│ │ john@example.com │ 87         │ 2 hours ago  │               │
│ │ jane@example.com │ 64         │ 1 day ago    │               │
│ │ bob@example.com  │ 52         │ 3 days ago   │               │
│ └──────────────────┴────────────┴──────────────┘               │
└─────────────────────────────────────────────────────────────────┘
```

### Schedule Report Dialog
```
┌─────────────────────────────────────────────────────────────────┐
│ Schedule Report                                      [✕]        │
├─────────────────────────────────────────────────────────────────┤
│ Template: [User Activity Report ▼]                              │
│                                                                 │
│ Schedule Name: [Weekly User Activity]                           │
│                                                                 │
│ Frequency: ○ Daily  ● Weekly  ○ Monthly                         │
│                                                                 │
│ Day of Week: [Monday ▼]                                         │
│ Time: [08:00] UTC                                               │
│                                                                 │
│ Time Range: ● Last 7 days  ○ Last 30 days  ○ Custom            │
│                                                                 │
│ Recipients:                                                     │
│   [admin1@example.com          ] [✕]                            │
│   [admin2@example.com          ] [✕]                            │
│   [+ Add Recipient]                                             │
│                                                                 │
│ Format: ● PDF  ○ CSV  ○ Excel                                   │
│                                                                 │
│ Email Subject: [Weekly User Activity Report]                    │
│                                                                 │
│ ☑ Active                                                        │
│                                                                 │
│ [Create Schedule] [Cancel]                                      │
└─────────────────────────────────────────────────────────────────┘
```

## AWS Integration

### Lambda Report Generator
```typescript
import { DynamoDBClient, QueryCommand } from '@aws-sdk/client-dynamodb';
import { CloudWatchClient, GetMetricStatisticsCommand } from '@aws-sdk/client-cloudwatch';
import PDFDocument from 'pdfkit';

export async function handler(event: ReportRequest) {
  const { templateId, timeRange } = event;

  // 1. Load template
  const template = await getReportTemplate(templateId);

  // 2. Fetch data from sources
  const data = await fetchReportData(template.config);

  // 3. Transform and aggregate
  const aggregated = aggregateData(data, template.config);

  // 4. Generate visualizations
  const charts = await generateCharts(aggregated, template.config);

  // 5. Generate exports
  const pdf = await generatePDF(aggregated, charts);
  const csv = await generateCSV(aggregated);

  // 6. Upload to S3
  const pdfUrl = await uploadToS3(pdf, 'pdf');
  const csvUrl = await uploadToS3(csv, 'csv');

  // 7. Update instance record
  await updateReportInstance(event.instanceId, {
    status: 'completed',
    formats: { pdf: pdfUrl, csv: csvUrl }
  });

  return { success: true };
}
```

### EventBridge Scheduled Reports
```typescript
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

export async function scheduledReportHandler(event: ScheduledEvent) {
  const schedule = await getReportSchedule(event.scheduleId);

  // Generate report
  const instance = await generateReport(schedule.templateId);

  // Wait for completion (poll or use Step Functions)
  await waitForCompletion(instance.id);

  // Get download URL
  const downloadUrl = await getSignedUrl(instance.formats[schedule.format]);

  // Send email
  const ses = new SESClient({ region: 'us-east-1' });
  await ses.send(new SendEmailCommand({
    Source: 'reports@captify.io',
    Destination: { ToAddresses: schedule.recipients },
    Message: {
      Subject: { Data: schedule.subject },
      Body: {
        Html: {
          Data: `
            <h2>${schedule.name}</h2>
            <p>Your scheduled report is ready.</p>
            <p><a href="${downloadUrl}">Download ${schedule.format.toUpperCase()}</a></p>
          `
        }
      }
    }
  }));

  // Update schedule
  await updateSchedule(schedule.id, {
    lastRun: new Date().toISOString(),
    runCount: schedule.runCount + 1
  });
}
```

## Security Considerations

- Only captify-admin can create/view reports
- Report data filtered by user's access level
- Sensitive fields (emails, IPs) can be redacted
- Shared report links expire after 7 days
- Email recipients must be verified in SES

## Testing

### Test Scenarios
1. Generate user report → Verify data accuracy
2. Generate scheduled report → Verify email delivery
3. Export to PDF → Verify formatting correct
4. Large dataset (100K rows) → Verify performance
5. Custom filters → Verify data filtered correctly
6. Chart generation → Verify visualizations render

## Dependencies

- DynamoDB (data storage)
- CloudWatch (metrics data)
- Cognito (user data)
- Lambda (report generation)
- S3 (report storage)
- SES (email delivery)
- EventBridge (scheduled execution)

## Performance Optimizations

1. **Caching**: Cache frequently-run reports for 1 hour
2. **Pagination**: Generate large reports in chunks
3. **Parallel Processing**: Fetch data sources in parallel
4. **Pre-aggregation**: Store daily/weekly aggregates for faster queries
5. **Async Generation**: All reports generated asynchronously

---

**Feature ID**: #9
**Priority**: P2
**Story Points**: 8
**Status**: Not Started
