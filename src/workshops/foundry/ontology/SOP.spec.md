# SOP (Standard Operating Procedure) Node Specification

## Overview
**Category:** Process
**Icon:** FileText
**DynamoDB Table:** `captify-core-SOP`
**API Reference:** `core-SOP`

## Purpose
The SOP node represents documented standard operating procedures - the step-by-step instructions that govern how work is performed. SOPs are the backbone of process excellence, compliance, and knowledge management.

## Why We Created It
SOPs are critical for organizational operations:
- **Process Documentation** - Capture institutional knowledge
- **Compliance** - Meet regulatory and policy requirements
- **Training** - Onboard new personnel effectively
- **Quality Assurance** - Ensure consistent execution
- **AI/Agent Reasoning** - Provide structured process data for automation
- **Continuous Improvement** - Baseline for process optimization
- **Audit Trail** - Version control and approval workflows

## Core Fields
| Field | Type | Purpose |
|-------|------|---------|
| `id` | string | Unique identifier (e.g., `sop-forecast-generation`) |
| `name` | string | SOP identifier/title |
| `title` | string | Full descriptive title |
| `description` | string | Purpose and scope |
| `status` | `Draft \| Review \| Approved \| Archived` | Lifecycle state |
| `ownerRole` | string | Role responsible for SOP |
| `inputs` | string[] | References to Dataset/System nodes (what's needed) |
| `outputs` | string[] | References to Dataset/System nodes (what's produced) |
| `stepsJSON` | object | Structured step-by-step procedure |
| `systems` | string[] | References to Application nodes used |
| `technicalOrders` | string[] | Related technical orders/documentation |
| `requiredCerts` | string[] | References to Certification nodes |
| `linkedPersonas` | string[] | References to Persona nodes who follow this |
| `linkedDatasets` | string[] | References to Dataset nodes consumed/produced |
| `controls` | string[] | Security/quality controls |
| `trainingReqs` | string[] | Required training before executing SOP |
| `approvalRequired` | boolean | Whether execution requires approval |
| `version` | number | Version number for tracking changes |
| `replacesVersion` | number | Previous version this replaces |
| `publishedAt` | string | When this version was approved |
| `contentS3Uri` | string | S3 location of rich-text WYSIWYG content |

## Relationships

### Outbound Edges (What SOPs Connect To)
| Verb | Target Node Type | Description |
|------|------------------|-------------|
| `uses` | Application | Systems used to execute the SOP |
| `consumes` | Dataset | Data inputs required |
| `enables` | Process/Goal | What the SOP accomplishes |
| `implements` | Policy | Policies the SOP enforces |
| `references` | SOP | Related or prerequisite SOPs |

### Inbound Edges (What Connects To SOPs)
| Verb | Source Node Type | Description |
|------|------------------|-------------|
| `follows` | Persona | Personas who execute this SOP |
| `implements` | Training | Training programs covering this SOP |
| `references` | UserStory | User stories requiring SOP changes |
| `references` | Checklist | Checklists derived from SOP |

## Use Cases

### 1. Process Execution
```
Persona → follows → SOP → uses → Application → consumes → Dataset
```
**Example:** Supply Analyst follows "Monthly Forecast SOP", uses EXPRESS, consumes BLADE dataset.

### 2. Training & Onboarding
```
Training → implements → SOP → requires → Certification
```
**Example:** "EXPRESS Training" teaches "Forecast Generation SOP", requires "Supply Chain Analyst Cert".

### 3. Compliance Audit
```
Policy → implemented_by → SOP → followed_by → Persona → validated_by → Checklist
```
**Example:** Data Classification Policy implemented by SOPs, verified through checklists.

### 4. Process Improvement
```
PainPoint → references → SOP → generates → Opportunity → creates → UseCase
```
**Example:** "Manual data entry" pain point in SOP leads to automation use case.

### 5. AI Agent Automation
```
Agent reads SOP.stepsJSON → executes workflow → logs completion
```
**Example:** AI agent automates multi-step forecast generation process.

## Example Data

```json
{
  "id": "sop-monthly-demand-forecast",
  "type": "SOP",
  "name": "SOP-SCMW-101",
  "title": "Monthly Demand Forecast Generation",
  "description": "Standard procedure for generating monthly demand forecasts using EXPRESS and BLADE data",
  "status": "Approved",
  "ownerRole": "Supply Chain Manager",
  "version": 3,
  "replacesVersion": 2,
  "publishedAt": "2024-11-15T00:00:00Z",
  "approvalRequired": false,
  "inputs": [
    "dataset-blade-historical",
    "dataset-d035-carcass",
    "dataset-express-inventory"
  ],
  "outputs": [
    "dataset-monthly-forecast",
    "report-forecast-summary"
  ],
  "systems": [
    "app-express",
    "app-blade",
    "app-tableau"
  ],
  "linkedPersonas": [
    "persona-supply-analyst",
    "persona-demand-planner"
  ],
  "linkedDatasets": [
    "dataset-blade",
    "dataset-express"
  ],
  "requiredCerts": [
    "cert-supply-chain-professional"
  ],
  "trainingReqs": [
    "training-express-advanced",
    "training-forecasting-methods"
  ],
  "controls": [
    "Data validation required",
    "Supervisor review for >$1M variances"
  ],
  "technicalOrders": [
    "TO-448-SCMW-2024-01"
  ],
  "stepsJSON": {
    "steps": [
      {
        "order": 1,
        "action": "Extract historical data from BLADE",
        "system": "app-blade",
        "duration": "15 min",
        "controls": ["Verify data completeness"]
      },
      {
        "order": 2,
        "action": "Load data into EXPRESS forecasting module",
        "system": "app-express",
        "duration": "10 min"
      },
      {
        "order": 3,
        "action": "Run statistical forecast models",
        "system": "app-express",
        "duration": "30 min",
        "controls": ["Model accuracy check >85%"]
      },
      {
        "order": 4,
        "action": "Apply subject matter expert adjustments",
        "duration": "45 min",
        "controls": ["Document adjustment rationale"]
      },
      {
        "order": 5,
        "action": "Generate forecast report in Tableau",
        "system": "app-tableau",
        "duration": "20 min",
        "output": "report-forecast-summary"
      }
    ]
  },
  "contentS3Uri": "s3://captify-sops/sop-monthly-demand-forecast-v3.html",
  "owner": "448th SCMW",
  "status": "active",
  "tags": ["forecasting", "supply-chain", "monthly"],
  "createdAt": "2024-06-01T00:00:00Z",
  "updatedAt": "2024-11-15T10:00:00Z"
}
```

## Relationships with Other Nodes

### Primary Dependencies
- **Application** - Systems used in the procedure
- **Dataset** - Data consumed and produced
- **Persona** - Who executes the SOP
- **Training** - How people learn the SOP

### Process Context
- **Workflow** - Higher-level processes containing this SOP
- **Checklist** - Verification items from SOP
- **Policy** - Policies the SOP implements

### Quality & Compliance
- **Certification** - Required credentials
- **Control** - Quality/security gates
- **Version** - Change history

## Business Rules

1. **Approved SOPs must have version number**
   - Enables change tracking and rollback

2. **SOPs should link to executing Personas**
   - Documents who performs the work

3. **SOPs should specify required systems**
   - Ensures tool availability

4. **Draft → Review → Approved workflow required**
   - Maintains quality and compliance

5. **Version increments when content changes**
   - Preserves audit trail

6. **Archived SOPs cannot be followed**
   - Prevents use of outdated procedures

## Common Queries

### Get all SOPs for a persona
```typescript
// Query: core-SOP where linkedPersonas[] contains persona-id
```

### Find SOPs using a specific application
```typescript
// Query: core-SOP where systems[] contains app-id
```

### Get approved SOPs requiring review
```typescript
// Query: core-SOP where status='Approved' AND reviewDate < today
```

### Find SOPs by required certification
```typescript
// Query: core-SOP where requiredCerts[] contains cert-id
```

## Integration Points

### API Usage
```typescript
import { dynamodb } from '@captify-io/core/services';

// Create a new SOP
await dynamodb.put({
  table: 'core-SOP',
  data: sopData
});

// Query SOPs by status
await dynamodb.query({
  table: 'core-SOP',
  index: 'status-publishedAt-index',
  key: 'status',
  value: 'Approved'
});

// Get SOP versions
await dynamodb.query({
  table: 'core-SOP',
  index: 'name-version-index',
  key: 'name',
  value: 'SOP-SCMW-101'
});
```

### DynamoDB Table
**Table Name:** `captify-core-SOP`
**Partition Key:** `id` (String)
**GSI:** `status-publishedAt-index` for querying by approval status
**GSI:** `owner-index` for querying by owning role/team
**GSI:** `name-version-index` for version history queries

### S3 Storage
**Bucket:** `captify-sops`
**Path Pattern:** `{sop-id}-v{version}.html`
**Purpose:** Store rich-text WYSIWYG content separately from metadata

## AI/Agent Integration

### Structured Steps for Automation
The `stepsJSON` field provides machine-readable process steps:

```typescript
interface SOPStep {
  order: number;
  action: string;          // What to do
  system?: string;         // System to use (Application node ID)
  duration?: string;       // Estimated time
  input?: string;          // Dataset/artifact needed
  output?: string;         // Dataset/artifact produced
  controls?: string[];     // Quality gates
  decision?: {            // Conditional logic
    question: string;
    ifYes: number;        // Next step if yes
    ifNo: number;         // Next step if no
  };
}
```

**Agent Use Cases:**
- Workflow automation
- Process mining and optimization
- Compliance checking
- Training simulation

## Related Documentation
- [Workflow.spec.md](./Workflow.spec.md) - Collections of related SOPs
- [Persona.spec.md](./Persona.spec.md) - Who executes SOPs
- [Application.spec.md](./Application.spec.md) - Systems used in SOPs
- [Training.spec.md](./Training.spec.md) - How SOPs are taught
- [Checklist.spec.md](./Checklist.spec.md) - Verification from SOPs
- [Policy.spec.md](./Policy.spec.md) - Rules SOPs implement
