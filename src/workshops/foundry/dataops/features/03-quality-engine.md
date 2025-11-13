# Feature: Quality Engine & Trust System

## Overview

The Quality Engine automatically profiles datasets, runs validation rules, detects anomalies, and provides quality scores to build trust in data. Every dataset gets a quality score (0-100) based on multiple dimensions, with trends tracked over time.

**Feature ID**: 03
**Priority**: P0 - Critical (trust is essential for data usage)
**Story Points**: 75
**Dependencies**: Phase 1 (Foundation), Feature 01 (Data Catalog)
**Implementation Phase**: Phase 4 (Weeks 16-20)

## Requirements

### Functional Requirements

#### FR-1: Automated Quality Profiling
On dataset ingestion or schedule, automatically calculate:
- **Completeness**: % non-null values per column
- **Validity**: % values matching expected type/format
- **Consistency**: Referential integrity, cross-field validation
- **Timeliness**: Data freshness (time since last update)
- **Uniqueness**: % unique values (for unique columns)
- **Accuracy**: % values passing validation rules

Each dimension scored 0-100, overall score is weighted average.

#### FR-2: Quality Score Calculation
```
Overall Quality Score = (
  Completeness * 0.25 +
  Validity * 0.20 +
  Consistency * 0.20 +
  Timeliness * 0.15 +
  Uniqueness * 0.10 +
  Accuracy * 0.10
)
```

Score categories:
- 90-100: Excellent (green)
- 75-89: Good (light green)
- 60-74: Fair (yellow)
- 40-59: Poor (orange)
- 0-39: Critical (red)

#### FR-3: Custom Quality Rules
Users can define custom validation rules:
- **Type**: completeness, validity, consistency, timeliness, uniqueness, custom
- **Expression**: SQL WHERE clause or Python expression
- **Threshold**: Pass/fail threshold (e.g., ">95% completeness")
- **Severity**: low, medium, high, critical
- **Schedule**: how often to run (hourly, daily, weekly)

Examples:
- "amount column must be > 0"
- "email must match regex pattern"
- "foreign key contract_id must exist in contracts table"
- "updated_at must be within last 24 hours"

#### FR-4: Quality Monitoring & Alerts
- Track quality scores over time (30-day trend)
- Alert on quality degradation (drop >10 points)
- Alert on rule failures
- Notify dataset owner and consumers
- Email + in-app notifications
- Alert history and acknowledgment

#### FR-5: Anomaly Detection
AI-powered detection of:
- **Statistical Anomalies**: Outliers, unexpected distributions
- **Schema Drift**: Column added/removed, type changed
- **Volume Anomalies**: Sudden spike or drop in record count
- **Pattern Changes**: Change in data patterns over time

Use AWS SageMaker or Bedrock for ML-based detection.

#### FR-6: Quality Dashboard
- Overall quality distribution (histogram)
- Quality trends over time (line chart)
- Top/bottom quality datasets (leaderboard)
- Quality by domain (bar chart)
- Recent quality issues (list with priority)
- Active alerts (table with acknowledge action)

#### FR-7: Dataset Quality Detail View
In dataset profile page, show:
- Quality score with breakdown by dimension
- Quality trend graph (last 30 days)
- Active rules with pass/fail status
- Recent quality check results
- Quality alerts and notifications
- Remediation suggestions

### Non-Functional Requirements

#### NFR-1: Performance
- Profile 1GB dataset in <2 minutes
- Profile 100GB dataset in <10 minutes
- Run quality rules in <1 minute
- Dashboard loads in <1 second

#### NFR-2: Scalability
- Support 10,000+ datasets with quality monitoring
- Support 1,000+ active quality rules
- Handle high-frequency checks (every 5 minutes)
- Store 90 days of quality history

#### NFR-3: Accuracy
- False positive rate <5% for anomaly detection
- Quality scores reflect true data quality
- Consistent scoring across datasets
- Explainable scoring (show how score calculated)

## Architecture

### Component Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                  Quality Engine                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌────────────┐  ┌────────────┐  ┌────────────────────┐   │
│  │  Profiler  │  │   Rules    │  │     Anomaly        │   │
│  │  Service   │  │  Engine    │  │     Detector       │   │
│  └─────┬──────┘  └─────┬──────┘  └─────────┬──────────┘   │
│        │               │                    │              │
│        └───────────────┴────────────────────┘              │
│                        │                                    │
│                ┌───────▼────────┐                           │
│                │ Quality Score  │                           │
│                │   Calculator   │                           │
│                └───────┬────────┘                           │
│                        │                                    │
├────────────────────────┼─────────────────────────────────────┤
│                   Storage Layer                             │
├────────────────────────┼─────────────────────────────────────┤
│         │              │              │                     │
│  ┌──────▼──────┐ ┌─────▼──────┐ ┌────▼──────────┐         │
│  │  DynamoDB   │ │ CloudWatch │ │   SageMaker   │         │
│  │  (Metrics)  │ │  (Logs)    │ │  (Anomalies)  │         │
│  └─────────────┘ └────────────┘ └───────────────┘         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Data Model

### QualityMetrics (stored in Dataset entity)

```typescript
{
  qualityScore: number              // 0-100 overall score
  qualityMetrics: {
    completeness: number            // 0-100
    validity: number                // 0-100
    consistency: number             // 0-100
    timeliness: number              // 0-100
    uniqueness: number              // 0-100
    accuracy: number                // 0-100
  }
  qualityTrend: "improving" | "stable" | "degrading"
  lastQualityCheckAt: string
}
```

### QualityRule Entity

```typescript
{
  id: string                        // "qualityrule-{name}"
  datasetId: string                 // FK to Dataset
  name: string
  description: string
  type: "completeness" | "validity" | "consistency" | "timeliness" | "uniqueness" | "custom"
  rule: {
    expression: string              // SQL WHERE or Python expression
    threshold: number               // Pass threshold (0-100)
    severity: "low" | "medium" | "high" | "critical"
  }
  schedule: string                  // Cron expression
  enabled: boolean
  createdBy: string
  createdAt: string
  lastCheckedAt: string
  lastResult: {
    passed: boolean
    score: number
    message: string
    checkedAt: string
    executionTime: number           // milliseconds
  }
}
```

### QualityHistory (time-series data)

```typescript
Table: dataops-quality-history
PK: datasetId
SK: timestamp (ISO 8601)

{
  datasetId: string
  timestamp: string
  qualityScore: number
  metrics: {
    completeness: number
    validity: number
    consistency: number
    timeliness: number
    uniqueness: number
    accuracy: number
  }
  recordCount: number
  sizeBytes: number
}

TTL: 90 days (auto-delete old records)
GSI: timestamp-index (query all datasets at time)
```

### QualityAlert Entity

```typescript
{
  id: string                        // "qualityalert-{id}"
  datasetId: string
  ruleId: string                    // Optional (if from rule)
  type: "degradation" | "rule_failure" | "anomaly" | "schema_drift"
  severity: "low" | "medium" | "high" | "critical"
  message: string
  details: {
    oldScore?: number
    newScore?: number
    threshold?: number
    actualValue?: number
  }
  status: "open" | "acknowledged" | "resolved" | "ignored"
  createdAt: string
  acknowledgedBy: string
  acknowledgedAt: string
  resolvedAt: string
}
```

## UI/UX

### Quality Dashboard Mockup

```
┌─────────────────────────────────────────────────────────────┐
│ Quality Dashboard                                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ────────── Overall Health ──────────                       │
│                                                             │
│  📊 Average Quality Score: 82/100  (Good)                   │
│  ✅ Excellent: 45 datasets    🟡 Fair: 12 datasets          │
│  🟢 Good: 32 datasets         🟠 Poor: 5 datasets           │
│                                                             │
│  [Quality Distribution Chart]                               │
│  ▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄                    │
│  0   20   40   60   80   100                                │
│                                                             │
│  ────────── Quality Trends (Last 30 Days) ──────────        │
│                                                             │
│  [Line Chart]                                               │
│  100 ┤                                                      │
│   75 ┤     ╱─╲     ╱─╲                                     │
│   50 ┤    ╱   ╲   ╱   ╲                                    │
│   25 ┤   ╱     ╲─╱     ╲                                   │
│    0 └──────────────────────────────                        │
│      1    10    20    30 days                               │
│                                                             │
│  ────────── Active Alerts (8) ──────────                    │
│                                                             │
│  🔴 Critical: Contract Spend 2024 - Quality dropped to 45   │
│     Completeness: 45% (was 95%) · 2 hours ago               │
│     [View] [Acknowledge]                                    │
│                                                             │
│  🟠 High: Personnel Records - Schema drift detected         │
│     Column 'ssn' removed · 5 hours ago                      │
│     [View] [Acknowledge]                                    │
│                                                             │
│  🟡 Medium: Logistics Data - Stale data (3 days old)        │
│     Last updated: 2024-01-15 · 1 day ago                    │
│     [View] [Acknowledge]                                    │
│                                                             │
│  ────────── Top Quality Datasets ──────────                 │
│                                                             │
│  1. Performance Metrics Q4     98/100  ✅                   │
│  2. Contract CLIN Data         96/100  ✅                   │
│  3. Employee Directory         95/100  ✅                   │
│  4. Budget Allocations         94/100  🟢                   │
│  5. Vendor Catalog             92/100  🟢                   │
│                                                             │
│  ────────── Worst Quality Datasets ──────────               │
│                                                             │
│  1. Legacy System Export       32/100  🔴                   │
│  2. Manual Data Entry          45/100  🔴                   │
│  3. External API Feed          52/100  🟠                   │
│  4. Archived Reports           58/100  🟠                   │
│  5. Temporary Staging          61/100  🟡                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Dataset Quality Detail Mockup

```
┌─────────────────────────────────────────────────────────────┐
│ Contract Spend 2024 > Quality                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Overall Quality Score                                      │
│  ────────────────────────────────────────                   │
│                                                             │
│  85/100  ████████░░  Good                                   │
│  Trend: ↑ +3 points (last 7 days)                           │
│                                                             │
│  Quality Breakdown                                          │
│  ────────────────────────────────────────                   │
│                                                             │
│  Completeness      92/100  █████████░                       │
│  └─ 92% of values are non-null                              │
│                                                             │
│  Validity          88/100  ████████░░                       │
│  └─ 88% of values match expected types                      │
│                                                             │
│  Consistency       82/100  ████████░░                       │
│  └─ 82% of foreign keys are valid                           │
│                                                             │
│  Timeliness        90/100  █████████░                       │
│  └─ Last updated 4 hours ago                                │
│                                                             │
│  Uniqueness        95/100  █████████░                       │
│  └─ 95% unique contract IDs                                 │
│                                                             │
│  Accuracy          78/100  ███████░░░                       │
│  └─ 78% of values pass validation rules                     │
│                                                             │
│  Quality Trend (Last 30 Days)                               │
│  ────────────────────────────────────────                   │
│                                                             │
│  [Line Chart showing 30-day quality history]                │
│                                                             │
│  Active Quality Rules (5)                                   │
│  ────────────────────────────────────────                   │
│                                                             │
│  ✅ Amount must be positive                                 │
│     Passed: 9,823/10,000 (98%)                              │
│     Last checked: 10 minutes ago                            │
│                                                             │
│  ✅ Contract ID must be unique                              │
│     Passed: 10,000/10,000 (100%)                            │
│     Last checked: 10 minutes ago                            │
│                                                             │
│  ⚠️ Foreign key validation                                  │
│     Failed: 150/10,000 (1.5%)                               │
│     Last checked: 10 minutes ago                            │
│     [View Details]                                          │
│                                                             │
│  [Add Quality Rule]                                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## API Actions

### calculateQualityScore(datasetId)

**Purpose**: Run quality profiling and calculate score

**Input**:
```typescript
{
  datasetId: string
  sampleSize?: number            // For large datasets (default: 10000)
}
```

**Output**:
```typescript
{
  success: boolean
  qualityScore: number           // 0-100
  metrics: {
    completeness: number
    validity: number
    consistency: number
    timeliness: number
    uniqueness: number
    accuracy: number
  }
  details: {
    recordCount: number
    nullCount: number
    invalidCount: number
    duplicateCount: number
    outlierCount: number
  }
  executionTime: number
}
```

### createQualityRule(rule)

**Purpose**: Define a new quality rule

**Input**:
```typescript
{
  datasetId: string
  name: string
  description: string
  type: "completeness" | "validity" | "consistency" | "custom"
  expression: string             // SQL or Python
  threshold: number
  severity: "low" | "medium" | "high" | "critical"
  schedule: string               // Cron expression
  enabled: boolean
}
```

**Output**:
```typescript
{
  success: boolean
  ruleId: string
  validationErrors: string[]
}
```

### executeQualityRule(ruleId)

**Purpose**: Run a quality rule

**Input**:
```typescript
{
  ruleId: string
}
```

**Output**:
```typescript
{
  success: boolean
  passed: boolean
  score: number
  message: string
  details: {
    totalRecords: number
    passedRecords: number
    failedRecords: number
    examples: Array<any>         // Sample failing records
  }
}
```

### getQualityTrend(datasetId, days)

**Purpose**: Get quality history

**Input**:
```typescript
{
  datasetId: string
  days: number                   // Default: 30
}
```

**Output**:
```typescript
{
  success: boolean
  trend: Array<{
    timestamp: string
    qualityScore: number
    metrics: {
      completeness: number
      validity: number
      consistency: number
      timeliness: number
      uniqueness: number
      accuracy: number
    }
  }>
}
```

## Implementation Notes

### Quality Profiling with Glue

Use AWS Glue for profiling large datasets:
```python
import awsglue.transforms as GlueTransforms
from pyspark.sql.functions import *

# Load dataset
df = glueContext.create_dynamic_frame_from_catalog(
    database="dataops",
    table_name="contract-spend-2024"
).toDF()

# Calculate metrics
total_rows = df.count()

# Completeness: % non-null per column
completeness = {}
for col_name in df.columns:
    non_null_count = df.filter(col(col_name).isNotNull()).count()
    completeness[col_name] = (non_null_count / total_rows) * 100

# Validity: % matching expected type
validity = {}
for col_name, col_type in df.dtypes:
    try:
        valid_count = df.filter(col(col_name).cast(col_type).isNotNull()).count()
        validity[col_name] = (valid_count / total_rows) * 100
    except:
        validity[col_name] = 0

# Uniqueness: % unique values
uniqueness = {}
for col_name in df.columns:
    distinct_count = df.select(col_name).distinct().count()
    uniqueness[col_name] = (distinct_count / total_rows) * 100

# Store results in DynamoDB
```

### Anomaly Detection with SageMaker

Use SageMaker Random Cut Forest for anomaly detection:
```typescript
async function detectAnomalies(datasetId: string) {
  // 1. Get quality history (last 30 days)
  const history = await getQualityTrend(datasetId, 30);

  // 2. Prepare data for SageMaker
  const data = history.map(h => [
    h.qualityScore,
    h.metrics.completeness,
    h.metrics.validity
  ]);

  // 3. Invoke SageMaker endpoint
  const sagemakerClient = new SageMakerRuntimeClient({});
  const response = await sagemakerClient.send(new InvokeEndpointCommand({
    EndpointName: "dataops-anomaly-detector",
    Body: JSON.stringify(data),
    ContentType: "application/json"
  }));

  // 4. Parse results
  const anomalies = JSON.parse(response.Body.toString());

  // 5. Create alerts for anomalies
  for (const anomaly of anomalies) {
    if (anomaly.score > 3) {  // Anomaly score threshold
      await createQualityAlert({
        datasetId,
        type: "anomaly",
        severity: "high",
        message: `Anomaly detected: quality score dropped to ${anomaly.value}`
      });
    }
  }
}
```

### Quality Rule Execution

Execute rules using SQL or Python:
```typescript
async function executeRule(rule: QualityRule) {
  if (rule.type === "custom" && rule.expression.startsWith("SELECT")) {
    // SQL rule - use Athena
    const result = await athena.query({
      QueryString: `
        SELECT COUNT(*) as total,
               SUM(CASE WHEN (${rule.expression}) THEN 1 ELSE 0 END) as passed
        FROM ${rule.datasetId}
      `
    });

    const score = (result.passed / result.total) * 100;
    const passed = score >= rule.threshold;

    return { passed, score };
  } else {
    // Python rule - use Lambda
    const lambda = new LambdaClient({});
    const result = await lambda.send(new InvokeCommand({
      FunctionName: "dataops-quality-rule-executor",
      Payload: JSON.stringify({
        datasetId: rule.datasetId,
        expression: rule.expression,
        threshold: rule.threshold
      })
    }));

    return JSON.parse(result.Payload.toString());
  }
}
```

## Testing

### Unit Tests
- Quality score calculation
- Rule validation
- Alert creation
- Trend analysis

### Integration Tests
- End-to-end profiling
- Rule execution
- Anomaly detection
- Alert notifications

### Performance Tests
- Profile 1GB dataset (<2 min)
- Profile 100GB dataset (<10 min)
- Run 100 rules concurrently
- Dashboard loads with 10k datasets

## Success Metrics

- **Quality Visibility**: 100% of datasets have quality scores within 24 hours
- **Quality Improvement**: 20% improvement in average quality score over 6 months
- **Alert Accuracy**: <5% false positive rate
- **Issue Resolution**: 80% of quality issues resolved within 24 hours
- **User Trust**: 90% user confidence in data quality scores

## Related Features

- [01-data-catalog.md](./01-data-catalog.md) - Display quality scores in catalog
- [02-pipeline-builder.md](./02-pipeline-builder.md) - Quality checks in pipelines
- [04-lineage-graph.md](./04-lineage-graph.md) - Propagate quality through lineage
