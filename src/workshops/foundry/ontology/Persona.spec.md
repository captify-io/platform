# Persona Node Specification

## Overview
**Category:** People
**Icon:** User
**DynamoDB Table:** `captify-core-Persona`
**API Reference:** `core-Persona`

## Purpose
The Persona node represents a specific user archetype or role within the organization, capturing their skills, training, tools, data access, and pain points. Personas are the foundation of user-centered design and process mapping.

## Why We Created It
Personas enable human-centered organizational mapping:
- **User-Centered Design** - Build products/processes for actual people
- **Skills Gap Analysis** - Identify training needs and certification requirements
- **Tool Rationalization** - Understand what systems each persona uses
- **Data Access Governance** - Map who needs access to what data
- **Process Improvement** - Connect pain points to specific personas
- **Discovery Foundation** - Link insights and user stories to real users

## Core Fields
| Field | Type | Purpose |
|-------|------|---------|
| `id` | string | Unique identifier (e.g., `persona-supply-analyst`) |
| `name` | string | Persona name (e.g., "Supply Chain Analyst") |
| `description` | string | Detailed persona description |
| `roleType` | string | Job category or role classification |
| `skills` | string[] | References to Skill nodes |
| `training` | string[] | References to Training nodes |
| `tools` | string[] | References to Application nodes |
| `dataAccess` | string[] | References to Dataset nodes |
| `certifications` | string[] | References to Certification nodes |
| `painPoints` | string[] | References to PainPoint nodes |
| `discoveries` | string[] | References to Insight nodes |
| `owner` | string | Team responsible for this persona |
| `status` | `draft \| active \| archived` | Current state |
| `tags` | string[] | Categorization tags |

## Relationships

### Outbound Edges (What Personas Connect To)
| Verb | Target Node Type | Description |
|------|------------------|-------------|
| `uses` | Application | Applications the persona uses daily |
| `uses` | Dataset | Datasets the persona accesses |
| `follows` | SOP | SOPs the persona must follow |
| `trained_on` | Training | Training the persona has completed |
| `trained_on` | Workflow | Workflows the persona is trained on |
| `discovers` | Insight | Insights discovered by the persona |
| `discovers` | PainPoint | Pain points experienced by the persona |

### Inbound Edges (What Connects To Personas)
| Verb | Source Node Type | Description |
|------|------------------|-------------|
| `supports` | Application | Apps designed to support this persona |
| `references` | UserStory | User stories written for this persona |
| `enables` | Training | Training that enables persona capabilities |

## Use Cases

### 1. User Journey Mapping
```
Persona → follows → SOP → uses → Application → consumes → Dataset
```
**Example:** "Supply Analyst" persona follows "Forecast Generation SOP", uses "EXPRESS application", consumes "BLADE dataset".

### 2. Skills Gap Analysis
```
Persona → (missing) Skill → requires → Training → validates → Certification
```
**Example:** Identify analysts who need data science training to perform advanced forecasting.

### 3. Pain Point Discovery
```
Persona → discovers → PainPoint → creates → Opportunity → implements → UseCase
```
**Example:** Analyst discovers "manual data entry" pain point, leading to automation opportunity.

### 4. Tool Rationalization
```
Query: Get all Applications used by Persona X
Analysis: Identify redundant tools, licensing costs, integration needs
```

## Example Data

```json
{
  "id": "persona-supply-chain-analyst",
  "type": "Persona",
  "name": "Supply Chain Analyst",
  "description": "Analyzes supply chain data to forecast part demand and identify readiness risks",
  "roleType": "Analyst",
  "skills": [
    "skill-data-analysis",
    "skill-supply-chain",
    "skill-forecasting"
  ],
  "training": [
    "training-express-basics",
    "training-blade-analysis",
    "training-sql-fundamentals"
  ],
  "tools": [
    "app-express",
    "app-blade",
    "app-tableau",
    "app-excel"
  ],
  "dataAccess": [
    "dataset-blade",
    "dataset-express",
    "dataset-d035",
    "dataset-d200"
  ],
  "certifications": [
    "cert-dau-log-201",
    "cert-supply-chain-professional"
  ],
  "painPoints": [
    "pain-manual-data-extraction",
    "pain-siloed-systems",
    "pain-forecast-accuracy"
  ],
  "discoveries": [
    "insight-demand-volatility",
    "insight-lead-time-variance"
  ],
  "owner": "448th SCMW Data Analytics",
  "status": "active",
  "tags": ["supply-chain", "analyst", "readiness"],
  "createdAt": "2024-09-01T00:00:00Z",
  "updatedAt": "2025-01-20T14:22:00Z"
}
```

## Relationships with Other Nodes

### Primary Dependencies
- **Skill** - Capabilities the persona possesses
- **Training** - Programs to develop persona capabilities
- **Application** - Tools the persona uses
- **Dataset** - Data the persona accesses
- **SOP** - Procedures the persona follows

### Discovery Connections
- **PainPoint** - Problems the persona experiences
- **Insight** - Knowledge the persona uncovers
- **UserStory** - Requirements from persona perspective
- **Opportunity** - Improvements for the persona

### Organizational Context
- **Team** - Groups the persona belongs to
- **Role** - Formal organizational role
- **Certification** - Required credentials

## Business Rules

1. **Personas should have at least one Skill**
   - Defines what the persona can do

2. **Personas should reference at least one Application**
   - Maps tool usage across organization

3. **Active Personas should have Training links**
   - Ensures personas are properly equipped

4. **Personas should connect to SOPs they follow**
   - Documents how work actually gets done

5. **PainPoints should link to specific Personas**
   - Ensures problems are tied to real users

## Common Queries

### Get all tools used by a persona
```typescript
// Query: core-Persona.tools[] -> query core-Application
```

### Find personas with specific skill
```typescript
// Query: core-Persona where skills[] contains skill-id
```

### Get training gaps for persona
```typescript
// Query: Compare persona.skills[] required vs persona.training[] completed
```

### Find personas affected by a pain point
```typescript
// Query: core-PainPoint.impactedPersonas[] -> query core-Persona
```

## Integration Points

### API Usage
```typescript
import { dynamodb } from '@captify-io/core/services';

// Create a persona
await dynamodb.put({
  table: 'core-Persona',
  data: personaData
});

// Query personas by role type
await dynamodb.query({
  table: 'core-Persona',
  index: 'roleType-index',
  key: 'roleType',
  value: 'Analyst'
});
```

### DynamoDB Table
**Table Name:** `captify-core-Persona`
**Partition Key:** `id` (String)
**GSI:** `roleType-createdAt-index` for querying by role
**GSI:** `owner-index` for querying by owning team
**GSI:** `status-index` for filtering active personas

## Related Documentation
- [Skill.spec.md](./Skill.spec.md) - Capabilities personas possess
- [Training.spec.md](./Training.spec.md) - Programs to develop personas
- [Application.spec.md](./Application.spec.md) - Tools personas use
- [Dataset.spec.md](./Dataset.spec.md) - Data personas access
- [PainPoint.spec.md](./PainPoint.spec.md) - Problems personas face
- [UserStory.spec.md](./UserStory.spec.md) - Requirements from persona perspective
