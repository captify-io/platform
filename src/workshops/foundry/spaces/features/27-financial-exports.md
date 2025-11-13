# Feature 27: Financial Exports

**Persona:** Financial
**Priority:** Medium
**Effort:** Small
**Status:** Sprint 3

## Overview
Export financial data in multiple formats for accounting systems, reporting, and compliance with customizable templates and scheduled exports.

## Requirements
### Functional: Export to Excel/CSV/PDF, Custom export templates, Schedule automated exports, Map to accounting systems (QuickBooks, SAP), Include charts and visualizations, Email distribution, Archive exports
### Non-Functional: Export completes <30s, Support large datasets (10K+ rows), Encrypted exports, Audit trail

## Ontology
### Nodes Used: FinancialTransaction, Contract, CLIN, Workstream, Deliverable

## Components
```typescript
// /opt/captify-apps/core/src/components/spaces/features/exports/export-builder.tsx (REUSABLE)
export function FinancialExportBuilder({ spaceId }: { spaceId: string })

// /opt/captify-apps/core/src/components/spaces/features/exports/template-selector.tsx (REUSABLE)
export function ExportTemplateSelector({ onSelect }: { onSelect: (template: ExportTemplate) => void })

// /opt/captify-apps/core/src/components/spaces/features/exports/export-scheduler.tsx (REUSABLE)
export function ExportScheduler({ templateId }: { templateId: string })
```

## Actions
### 1. Export Financial Data
```typescript
interface ExportFinancialDataRequest {
  spaceId: string;
  dateRange: { start: string; end: string };
  format: 'xlsx' | 'csv' | 'pdf' | 'quickbooks' | 'sap';
  includeTransactions: boolean;
  includeContracts: boolean;
  includeCLINs: boolean;
  includeDeliverables: boolean;
  templateId?: string;
}

interface ExportResponse {
  url: string; // S3 presigned URL
  filename: string;
  size: number;
  expiresAt: string;
}
```

### 2. Schedule Export
```typescript
interface ScheduleExportRequest {
  templateId: string;
  schedule: string; // cron expression
  recipients: string[];
  format: 'xlsx' | 'csv' | 'pdf';
}
```

### 3. Generate QuickBooks Import
```typescript
interface GenerateQuickBooksImportRequest {
  transactionIds: string[];
}

interface QuickBooksImportResponse {
  iifFile: string; // QuickBooks IIF format
  summary: {
    accounts: number;
    transactions: number;
    totalAmount: number;
  };
}
```

## User Stories
### Story 1: Analyst Exports Monthly Financials
**Tasks:** Select date range, choose format (Excel), include all data, download
**Acceptance:** Export contains all data, opens in Excel

### Story 2: Analyst Schedules Weekly Export
**Tasks:** Choose template, set schedule (every Monday), add recipients, activate
**Acceptance:** Export emails automatically every week

### Story 3: Analyst Exports for QuickBooks
**Tasks:** Select transactions, generate IIF file, validate format, download
**Acceptance:** File imports into QuickBooks without errors

## Implementation
```typescript
async function exportFinancialData(
  request: ExportFinancialDataRequest
): Promise<ExportResponse> {
  const data = await aggregateFinancialData(request);

  let fileBuffer: Buffer;
  let filename: string;

  if (request.format === 'xlsx') {
    fileBuffer = await generateExcelFile(data);
    filename = `financial-export-${new Date().toISOString()}.xlsx`;
  } else if (request.format === 'csv') {
    fileBuffer = Buffer.from(generateCSV(data));
    filename = `financial-export-${new Date().toISOString()}.csv`;
  } else if (request.format === 'quickbooks') {
    fileBuffer = Buffer.from(generateIIF(data.transactions));
    filename = `quickbooks-import-${new Date().toISOString()}.iif`;
  }

  // Upload to S3
  const key = `exports/${request.spaceId}/${filename}`;
  await s3.upload({ bucket: 'captify-exports', key, body: fileBuffer });

  // Generate presigned URL
  const url = await s3.getPresignedUrl({ bucket: 'captify-exports', key, expiresIn: 3600 });

  return {
    url,
    filename,
    size: fileBuffer.length,
    expiresAt: new Date(Date.now() + 3600000).toISOString()
  };
}

function generateIIF(transactions: FinancialTransaction[]): string {
  // QuickBooks IIF format
  let iif = '!TRNS\tTRNSID\tTRNSTYPE\tDATE\tACCNT\tAMOUNT\n';

  transactions.forEach((txn, index) => {
    iif += `TRNS\t${txn.id}\tGENERAL JOURNAL\t${txn.date}\t${txn.category}\t${txn.amount}\n`;
  });

  return iif;
}
```

## Testing
```typescript
describe('FinancialExports', () => {
  it('generates Excel export', async () => {
    const result = await exportFinancialData({
      spaceId: 'space-1',
      dateRange: { start: '2025-01-01', end: '2025-01-31' },
      format: 'xlsx',
      includeTransactions: true
    });

    expect(result.url).toContain('.xlsx');
    expect(result.size).toBeGreaterThan(0);
  });

  it('generates QuickBooks IIF file', () => {
    const iif = generateIIF(mockTransactions);
    expect(iif).toContain('!TRNS');
    expect(iif).toContain('GENERAL JOURNAL');
  });
});
```

## Dependencies: Feature 21 (Financial Dashboard), Feature 24 (Deliverable Tracking)
## Status: Sprint 3, Not Started
