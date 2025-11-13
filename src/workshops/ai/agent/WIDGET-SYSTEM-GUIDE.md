# Widget System Guide for LLMs

**Date**: 2025-11-04
**Purpose**: Guide for how LLMs can use widgets to display data visually

## Overview

The Captify platform has a powerful widget system that allows LLMs to display data in rich, interactive formats like tables, charts, cards, and forms. This guide explains how the widget system works and how LLMs should use widget tools.

## Architecture

### 3-Layer Widget System

```
┌─────────────────────────────────────────────────────────┐
│ 1. WIDGET DEFINITIONS (Ontology)                       │
│    captify-core-ontology-widget table                  │
│    - Widget configuration                              │
│    - Data source mapping                               │
│    - Action/event handlers                             │
└─────────────────────────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────┐
│ 2. WIDGET TOOLS (Tools for LLMs)                       │
│    captify-core-tool table                             │
│    - tool-widget-table                                 │
│    - tool-widget-chart                                 │
│    - tool-widget-card                                  │
│    - tool-widget-message                               │
│    - tool-widget-form                                  │
│    - tool-widget-list                                  │
└─────────────────────────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────┐
│ 3. WIDGET RENDERING (React Components)                 │
│    @captify-io/core/components/widgets                 │
│    - <Widget id="..." data={...} />                    │
│    - Automatically fetches and renders                 │
└─────────────────────────────────────────────────────────┘
```

## How It Works

### For Users (React Components)

```typescript
// Simple usage - widget fetches its own data
<Widget id="table" />

// With overrides
<Widget
  id="table"
  filters={{ status: "active" }}
  onAction={(action, params) => {
    if (action === 'rowClick') {
      // Handle row click
    }
  }}
/>
```

### For LLMs (Tool Calls)

LLMs use widget tools to return structured data that gets rendered as widgets:

```typescript
// LLM calls tool-widget-table
{
  toolId: "tool-widget-table",
  parameters: {
    columns: [
      { key: "name", label: "Name" },
      { key: "status", label: "Status", type: "status" }
    ],
    rows: [
      { name: "Contract A", status: "active" },
      { name: "Contract B", status: "draft" }
    ],
    caption: "Active Contracts"
  }
}

// Agent service receives response and renders:
// <Widget type="display-table" data={parameters} />
```

## Available Widget Tools

### 📊 1. Display Table (`tool-widget-table`)

**Use When:** Showing tabular data with multiple rows and columns

**Parameters:**
```typescript
{
  columns: Array<{
    key: string;           // Data property name
    label: string;         // Column header
    type?: "text" | "number" | "date" | "status";
  }>;
  rows: Array<object>;     // Data rows
  caption?: string;        // Table caption
  actions?: Array<{        // Row actions
    label: string;
    action: string;
  }>;
}
```

**Example Use Case:**
- User asks: "Show me all active contracts"
- LLM queries contracts
- LLM calls `tool-widget-table` with results
- User sees formatted table with sorting/filtering

**Example Response:**
```json
{
  "columns": [
    { "key": "contractNumber", "label": "Contract #", "type": "text" },
    { "key": "vendor", "label": "Vendor", "type": "text" },
    { "key": "value", "label": "Value", "type": "number" },
    { "key": "status", "label": "Status", "type": "status" },
    { "key": "startDate", "label": "Start Date", "type": "date" }
  ],
  "rows": [
    {
      "contractNumber": "C-2024-001",
      "vendor": "Acme Corp",
      "value": 150000,
      "status": "active",
      "startDate": "2024-01-15"
    },
    {
      "contractNumber": "C-2024-002",
      "vendor": "Tech Solutions",
      "value": 85000,
      "status": "active",
      "startDate": "2024-02-01"
    }
  ],
  "caption": "Active Contracts (2 total)"
}
```

### 📈 2. Display Chart (`tool-widget-chart`)

**Use When:** Visualizing numerical data, trends, or distributions

**Parameters:**
```typescript
{
  chartType: "bar" | "line" | "pie" | "scatter" | "area";
  title?: string;
  data: {
    labels: string[];
    datasets?: Array<{
      label: string;
      data: number[];
    }>;
    data?: number[];  // For pie charts
  };
  options?: {
    colors?: string[];
    legendPosition?: "top" | "bottom" | "left" | "right";
  };
}
```

**Example Use Cases:**
- "Show contract value by vendor" → Bar chart
- "Show revenue trend over time" → Line chart
- "Show contract distribution by status" → Pie chart

**Example Response (Bar Chart):**
```json
{
  "chartType": "bar",
  "title": "Contract Value by Vendor",
  "data": {
    "labels": ["Acme Corp", "Tech Solutions", "Global Services"],
    "datasets": [{
      "label": "Total Value ($)",
      "data": [150000, 85000, 220000]
    }]
  }
}
```

**Example Response (Line Chart):**
```json
{
  "chartType": "line",
  "title": "Revenue Trend (Last 6 Months)",
  "data": {
    "labels": ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    "datasets": [{
      "label": "2024 Revenue",
      "data": [120000, 145000, 168000, 152000, 189000, 205000]
    }]
  }
}
```

**Example Response (Pie Chart):**
```json
{
  "chartType": "pie",
  "title": "Contracts by Status",
  "data": {
    "labels": ["Active", "Draft", "Completed", "Cancelled"],
    "data": [15, 8, 42, 3]
  }
}
```

### 💳 3. Display Card (`tool-widget-card`)

**Use When:** Showing status messages, results, or important info in a highlighted format

**Parameters:**
```typescript
{
  title: string;
  content: string;
  variant?: "default" | "success" | "warning" | "error" | "info";
  actions?: Array<{
    label: string;
    action: string;
    variant?: "default" | "destructive" | "outline";
  }>;
}
```

**Example Use Cases:**
- Operation complete messages
- Warnings or alerts
- Summary information
- Call-to-action prompts

**Example Response:**
```json
{
  "title": "Contract Created Successfully",
  "content": "Contract #C-2024-015 has been created and is ready for review. The contract value is $75,000 and it will be active starting March 1, 2024.",
  "variant": "success",
  "actions": [
    { "label": "View Contract", "action": "view" },
    { "label": "Edit Details", "action": "edit", "variant": "outline" },
    { "label": "Close", "action": "close", "variant": "outline" }
  ]
}
```

### 🔔 4. Display Message (`tool-widget-message`)

**Use When:** Showing alerts, notifications, or status messages

**Parameters:**
```typescript
{
  message: string;
  variant?: "default" | "success" | "warning" | "error" | "info";
  title?: string;
}
```

**Example Use Cases:**
- Error messages
- Warning notifications
- Success confirmations
- Information alerts

**Example Response:**
```json
{
  "title": "Expiration Warning",
  "message": "Contract #C-2024-001 will expire in 30 days. Please review renewal options.",
  "variant": "warning"
}
```

### 📝 5. Display Form (`tool-widget-form`)

**Use When:** Showing form data or structured information

**Parameters:**
```typescript
{
  fields: Array<{
    name: string;
    label: string;
    type: "text" | "number" | "date" | "select" | "textarea";
    value?: any;
    required?: boolean;
    options?: string[];  // For select fields
  }>;
  values?: Record<string, any>;
  readOnly?: boolean;  // True for display mode
}
```

**Example Use Case:**
- User asks: "Show me the details of contract C-2024-001"
- LLM retrieves contract data
- LLM calls `tool-widget-form` with fields and values
- User sees formatted display of contract details

**Example Response:**
```json
{
  "readOnly": true,
  "fields": [
    { "name": "contractNumber", "label": "Contract Number", "type": "text" },
    { "name": "vendor", "label": "Vendor", "type": "text" },
    { "name": "value", "label": "Contract Value", "type": "number" },
    { "name": "status", "label": "Status", "type": "select" },
    { "name": "startDate", "label": "Start Date", "type": "date" },
    { "name": "endDate", "label": "End Date", "type": "date" },
    { "name": "description", "label": "Description", "type": "textarea" }
  ],
  "values": {
    "contractNumber": "C-2024-001",
    "vendor": "Acme Corporation",
    "value": 150000,
    "status": "Active",
    "startDate": "2024-01-15",
    "endDate": "2025-01-14",
    "description": "Annual software licensing and support contract for enterprise systems."
  }
}
```

### 📋 6. Display List (`tool-widget-list`)

**Use When:** Showing a simple list of items (not full table)

**Parameters:**
```typescript
{
  title?: string;
  items: Array<{
    title: string;
    description?: string;
    icon?: string;
    metadata?: Record<string, any>;
  }>;
  emptyMessage?: string;
}
```

**Example Use Case:**
- User asks: "What are my recent contracts?"
- LLM retrieves contracts
- LLM calls `tool-widget-list` for simple display

**Example Response:**
```json
{
  "title": "Recent Contracts (Last 5)",
  "items": [
    {
      "title": "Contract C-2024-015 - Acme Corp",
      "description": "Active - Expires 2025-01-15",
      "metadata": { "status": "active", "value": "$75,000" }
    },
    {
      "title": "Contract C-2024-014 - Tech Solutions",
      "description": "Active - Expires 2024-12-31",
      "metadata": { "status": "active", "value": "$52,000" }
    },
    {
      "title": "Contract C-2024-013 - Global Services",
      "description": "Draft - Not yet finalized",
      "metadata": { "status": "draft", "value": "$120,000" }
    }
  ]
}
```

## Decision Tree: Which Widget to Use?

```
Is the data tabular with multiple columns?
  YES → Use Display Table
  NO  ↓

Is the data numerical and needs visualization?
  YES → Use Display Chart
    - Comparison? → Bar chart
    - Trend over time? → Line chart
    - Distribution? → Pie chart
  NO  ↓

Is this a status message or operation result?
  YES → Use Display Card (for detailed) or Display Message (for simple)
  NO  ↓

Is this structured entity details?
  YES → Use Display Form (read-only mode)
  NO  ↓

Is this a simple list of items?
  YES → Use Display List
  NO  ↓

Use text response with markdown formatting
```

## Best Practices for LLMs

### 1. Choose the Right Widget

**✅ Good:**
- User asks for "all contracts" → Use Table (multiple rows, columns)
- User asks for "contract value by vendor" → Use Chart (bar)
- User asks for "contract details" → Use Form (structured data)

**❌ Bad:**
- Using Chart when user asks for specific values
- Using Table when showing a single entity
- Using List when data has complex structure

### 2. Include Helpful Metadata

**✅ Good:**
```json
{
  "caption": "Active Contracts (15 total, $1.2M combined value)",
  "title": "Contract Value Trend - Last 6 Months"
}
```

**❌ Bad:**
```json
{
  "caption": "Results",
  "title": "Chart"
}
```

### 3. Use Appropriate Variants

**✅ Good:**
```json
// For success
{ "variant": "success", "title": "Operation Complete" }

// For warnings
{ "variant": "warning", "title": "Expiration Notice" }

// For errors
{ "variant": "error", "title": "Operation Failed" }
```

### 4. Provide Context in Text

Always provide text explanation BEFORE the widget:

**✅ Good:**
```
I found 15 active contracts totaling $1.2M in value. Here's the breakdown:

[TABLE WIDGET]
```

**❌ Bad:**
```
[TABLE WIDGET]
```

### 5. Format Data Appropriately

**✅ Good:**
```json
{
  "value": 150000,          // Number for calculations
  "startDate": "2024-01-15" // ISO date format
}
```

**❌ Bad:**
```json
{
  "value": "$150,000",      // String, can't calculate
  "startDate": "Jan 15"     // Ambiguous format
}
```

## Integration with Agent Service

### How Tool Responses Are Processed

1. **LLM calls widget tool**:
   ```json
   {
     "toolId": "tool-widget-table",
     "parameters": { "columns": [...], "rows": [...] }
   }
   ```

2. **Agent service detects widget tool response**:
   - Category is "widget"
   - Returns special widget annotation

3. **Chat panel renders widget**:
   ```typescript
   <Widget type="display-table" data={parameters} />
   ```

4. **Widget component**:
   - Validates data structure
   - Applies formatting (dates, numbers, status colors)
   - Handles user interactions (sort, filter, row clicks)

### Current Implementation Status

| Component | Status | Notes |
|-----------|--------|-------|
| Widget Tools (6) | ✅ Complete | Seeded to database |
| Widget Service | ✅ Complete | `/opt/captify-apps/core/src/services/ontology/widget.ts` |
| Widget Components | ✅ Complete | `/opt/captify-apps/core/src/components/widgets/` |
| Agent Tool Execution | ⚠️ Partial | Needs widget response handler |
| Chat Widget Rendering | ⚠️ Partial | Needs widget annotation parser |

## Next Implementation Steps

### 1. Update Agent Service (HIGH PRIORITY)

Location: `/opt/captify-apps/core/src/services/agent/index.ts`

Add widget tool response handler:

```typescript
// After tool execution, check if it's a widget tool
if (tool.category === 'widget') {
  return {
    type: 'widget',
    operation: tool.operation,
    data: result,
  };
}
```

### 2. Update Chat Panel (HIGH PRIORITY)

Location: `/opt/captify-apps/core/src/components/agent/panels/chat.tsx`

Add widget rendering for tool responses:

```typescript
// In message rendering, check for widget responses
if (toolResponse.type === 'widget') {
  return (
    <Widget
      type={toolResponse.operation}
      data={toolResponse.data}
    />
  );
}
```

### 3. Add Widget Examples to System Prompts

Include widget usage examples in agent system prompts:

```
When displaying tabular data, use the Display Table tool:
- Multiple contracts → table
- Trend data → chart
- Single entity details → form
```

### 4. Test Widget Tools

Create test scenarios:
- Query contracts → Table display
- Analyze trends → Chart display
- Show details → Form display
- Status messages → Card/Message display

## Examples from Real Usage

### Example 1: Contract Query

**User:** "Show me all active contracts"

**LLM Response:**
```
I found 15 active contracts. Here's a summary:

[Calls tool-widget-table with:]
{
  "columns": [
    { "key": "contractNumber", "label": "Contract #" },
    { "key": "vendor", "label": "Vendor" },
    { "key": "value", "label": "Value", "type": "number" },
    { "key": "startDate", "label": "Start Date", "type": "date" },
    { "key": "endDate", "label": "End Date", "type": "date" }
  ],
  "rows": [... 15 contracts ...],
  "caption": "Active Contracts (15 total, $1.8M combined)"
}
```

### Example 2: Trend Analysis

**User:** "How has our contract value changed over the year?"

**LLM Response:**
```
Contract values have increased steadily throughout 2024, growing from $120K in January to $205K in June. Here's the trend:

[Calls tool-widget-chart with:]
{
  "chartType": "line",
  "title": "Contract Value Trend - 2024",
  "data": {
    "labels": ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    "datasets": [{
      "label": "Total Value",
      "data": [120000, 145000, 168000, 152000, 189000, 205000]
    }]
  }
}
```

### Example 3: Contract Details

**User:** "Show me contract C-2024-001"

**LLM Response:**
```
Here are the details for Contract C-2024-001:

[Calls tool-widget-form with:]
{
  "readOnly": true,
  "fields": [... field definitions ...],
  "values": {
    "contractNumber": "C-2024-001",
    "vendor": "Acme Corp",
    "value": 150000,
    "status": "Active",
    ...
  }
}
```

## Summary

The widget system provides LLMs with powerful visualization capabilities:

- **6 widget tools** for different data types
- **Automatic formatting** and user interaction
- **Professional appearance** for data display
- **Consistent UX** across all agents

**Key Takeaway:** Instead of returning raw text or JSON, LLMs can use widget tools to create rich, interactive data displays that users can sort, filter, and interact with.

---

**Status**: ✅ Widget tools created | ⚠️ Integration pending | 📚 Documentation complete
