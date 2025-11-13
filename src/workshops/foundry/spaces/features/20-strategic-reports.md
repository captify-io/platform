# Feature 20: Strategic Reports

**Persona:** Executive
**Priority:** High
**Effort:** Medium
**Status:** Sprint 3

## Overview
Automated strategic report generation combining portfolio metrics, OKRs, risks, budget, and progress into executive-ready presentations and documents.

## Requirements
### Functional
1. Generate executive summary reports, Customizable report templates, Schedule automated reports, Include charts and visualizations, Export to PDF/PowerPoint/Word, Email distribution, Historical comparison

### Non-Functional
1. Generate in <15s, Support custom branding, Mobile preview, Archive reports, Template library, Version control

## Ontology
### Nodes Used: Space, Workstream, Objective, Risk, InvestmentAllocation

### New Ontology Nodes
```typescript
// OntologyNode for ReportTemplate
{
  id: "core-report-template",
  name: "ReportTemplate",
  type: "reportTemplate",
  category: "entity",
  domain: "Reporting",
  description: "Reusable report template definition",
  icon: "FileText",
  color: "#6366f1",
  active: "true",
  properties: {
    dataSource: "core-report-template",
    schema: {
      type: "object",
      properties: {
        id: { type: "string" },
        name: { type: "string", required: true },
        description: { type: "string" },
        sections: {
          type: "array",
          items: {
            type: "object",
            properties: {
              type: { type: "string", enum: ["summary", "okrs", "risks", "budget", "progress", "custom"] },
              title: { type: "string" },
              config: { type: "object" }
            }
          }
        },
        schedule: { type: "string", enum: ["daily", "weekly", "monthly", "quarterly", "manual"] },
        recipients: { type: "array", items: { type: "string" } },
        format: { type: "string", enum: ["pdf", "pptx", "docx"] },
        createdBy: { type: "string" },
        createdAt: { type: "string" },
        updatedAt: { type: "string" }
      },
      required: ["name", "sections", "format"]
    },
    indexes: {
      "createdBy-index": { hashKey: "createdBy", type: "GSI" }
    }
  }
}
```

## Components
```typescript
// /opt/captify-apps/core/src/components/spaces/features/reports/report-builder.tsx (REUSABLE)
export function ReportBuilder({ spaceId }: { spaceId: string })

// /opt/captify-apps/core/src/components/spaces/features/reports/report-preview.tsx (REUSABLE)
export function ReportPreview({ reportData }: { reportData: ReportData })

// /opt/captify-apps/core/src/components/spaces/features/reports/template-library.tsx (REUSABLE)
export function TemplateLibrary({ onSelectTemplate }: TemplateLibraryProps)

// /opt/captify-apps/core/src/components/spaces/features/reports/report-scheduler.tsx (REUSABLE)
export function ReportScheduler({ templateId }: { templateId: string })
```

## Actions
### 1. Generate Report
```typescript
interface GenerateReportRequest {
  templateId: string;
  spaceId: string;
  dateRange: { start: string; end: string };
  format: 'pdf' | 'pptx' | 'docx';
}

interface GenerateReportResponse {
  reportId: string;
  url: string; // S3 presigned URL
  expiresAt: string;
}
```

### 2. Schedule Report
```typescript
interface ScheduleReportRequest {
  templateId: string;
  schedule: string; // cron expression
  recipients: string[];
}
```

### 3. Get Report Data
```typescript
interface GetReportDataRequest {
  spaceId: string;
  sections: string[];
  dateRange: { start: string; end: string };
}

interface ReportData {
  summary: { spaces: number; progress: number; health: any };
  okrs: Objective[];
  risks: Risk[];
  budget: { allocated: number; spent: number; forecast: number };
  charts: { type: string; data: any }[];
}
```

## User Stories
### Story 1: Executive Creates Custom Report
**Tasks:** Select template, choose sections, configure date range, preview, generate
**Acceptance:** Report generated with all sections

### Story 2: Executive Schedules Weekly Report
**Tasks:** Set schedule (every Monday), add recipients, choose format, activate
**Acceptance:** Report emails automatically

### Story 3: Executive Compares Historical Reports
**Tasks:** Select two report dates, show side-by-side, highlight changes, export comparison
**Acceptance:** Comparison accurate and clear

## Implementation
```typescript
async function generateExecutiveReport(
  spaceId: string,
  template: ReportTemplate,
  format: 'pdf' | 'pptx'
): Promise<string> {
  const data = await aggregateReportData(spaceId, template.sections);

  if (format === 'pptx') {
    return generatePowerPoint(data, template);
  } else {
    return generatePDF(data, template);
  }
}

function generatePowerPoint(data: ReportData, template: ReportTemplate): string {
  const pptx = new PptxGenJS();

  // Title slide
  const titleSlide = pptx.addSlide();
  titleSlide.addText('Executive Portfolio Report', { x: 1, y: 1, fontSize: 36 });

  // Summary slide
  const summarySlide = pptx.addSlide();
  summarySlide.addText('Portfolio Summary', { x: 0.5, y: 0.5, fontSize: 24 });
  summarySlide.addChart(pptx.charts.PIE, data.summary.healthDistribution, { x: 1, y: 2 });

  // ... more slides

  return pptx.write({ outputType: 'base64' });
}
```

## Dependencies
- Feature 14 (Portfolio Dashboard), Feature 16 (Objective Tracking), Feature 19 (Risk Management), Feature 17 (Investment Allocation)

## Status: Sprint 3, Not Started
