# Frontend Context Documentation

## Client-Side API Usage Patterns

This documentation covers frontend React components, API client usage, and authentication patterns for the captify platform.

## 🎯 Console Application - AI Chat Interface

### ✅ Completed Features (Phase 1 & 2)

- **Chat Layout**: 3-pane resizable interface (threads | chat | tools)
- **Thread Management**: Full CRUD operations with ThreadList component
- **Database Integration**: DynamoDB tables with proper UUID generation
- **Authentication**: Three-tier AWS credential system with centralized API client
- **Smart Breadcrumbs**: Context-aware navigation showing thread titles
- **Error Handling**: Graceful error states and loading indicators

### 🔄 In Progress (Phase 3)

- **Chat Interface**: Message input box and chat display
- **SSE Streaming**: Real-time AI responses with proper authentication
- **Tool Integration**: Tool execution and display
- **Agent Selection**: Multi-agent support with proper agent switching

### Console Architecture

- **Location**: `/app/console` - Main chat interface
- **Components**:
  - `ConsoleLayout` - Main 3-pane layout wrapper
  - `ThreadList` - Virtualized thread list with search/CRUD
  - `ChatInterface` - Message display and input (Phase 3)
- **API Client**: `ConsoleApiClient` extending centralized authentication
- **Database**: `captify-chat-threads`, `captify-chat-messages`, `captify-token-grants`

## 📊 Material Insights (MI) Application Pages

### Completed Pages

- **`/mi`** - Main landing page with navigation and overview
- **`/mi/advanced-forecast`** - Primary forecast page for predicting and resolving issues
- **`/mi/bom-explorer`** - BOM configurations and variants explorer
- **`/mi/workbench`** - Collaborative problem resolution interface
- **`/mi/supply-chain-insights`** - Supplier health and part availability from BOM perspective ✨ **NEW**

### Missing Pages (To Be Built)

- **`/mi/analytics`** - Analytics & Reports page for reusable analyses
- **`/mi/document-library`** - Document Library for technical orders and attachments

### Supply Chain Insights Features

The new Supply Chain Insights page includes:

- **Supplier Health Monitoring**: Performance scores, risk levels, delivery metrics
- **Part Availability Tracking**: Stock levels, reorder points, availability status
- **Supply Risk Management**: Risk assessment, mitigation plans, monitoring
- **Real-time Analytics**: Performance charts, trend analysis, health indicators
- **Automated Monitoring**: Alerts, recommendations, automated actions

## API Client Usage

### Always Use Centralized API Clients

**CRITICAL**: Never use direct `fetch()` calls to internal APIs. Always use the centralized API clients to ensure proper authentication headers.

#### Correct Implementation

```typescript
// ✅ Material Insights Workbench Page
import { MIApiClient } from "@/app/mi/services/api-client";
import type { WorkbenchData } from "@/app/mi/types";

export default function WorkbenchPage() {
  const [workbenchData, setWorkbenchData] = useState<WorkbenchData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkbenchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        status: statusFilter !== "all" ? statusFilter : undefined,
        priority: priorityFilter !== "all" ? priorityFilter : undefined,
      };

      // ✅ Use API client - automatically includes authentication headers
      const response = await MIApiClient.getWorkbench(params);

      if (!response.ok) {
        throw new Error(
          response.error || `HTTP error! status: ${response.status}`
        );
      }

      setWorkbenchData(response.data || null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch workbench data"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkbenchData();
  }, [statusFilter, priorityFilter]);

  // Component JSX...
}
```

#### Incorrect Implementation

```typescript
// ❌ NEVER do this - bypasses authentication headers
const fetchData = async () => {
  const response = await fetch("/api/mi/workbench", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  const data = await response.json();
};
```

## Available API Clients

### Material Insights API Client

```typescript
import { MIApiClient } from "@/app/mi/services/api-client";

// Available methods:
await MIApiClient.getBOM(nodeId, params); // BOM hierarchy data
await MIApiClient.getWorkbench(params); // Workbench issues and analytics
```

### API Client Configuration

The API clients automatically handle:

- Authentication headers (X-ID-Token, X-AWS-Session-Token, X-User-Email)
- Error handling and response formatting
- Type safety with centralized type definitions

## Type Management

### Use Centralized Types

Always import types from the centralized type definitions instead of creating local interfaces:

```typescript
// ✅ Correct: Use centralized types
import type {
  WorkbenchData,
  WorkbenchMetadata,
  WorkbenchSummary,
} from "@/app/mi/types";

// ❌ Incorrect: Local interface that may not match API
interface LocalWorkbenchData {
  // This may not match actual API response
}
```

### Available Type Definitions

```typescript
// Material Insights Types
import type {
  WorkbenchData, // Complete workbench response
  WorkbenchMetadata, // Metadata about filters and totals
  WorkbenchSummary, // Summary statistics by status/priority
  WorkbenchIssue, // Individual issue structure
  WorkbenchCharts, // Chart data for analytics
  BOMData, // BOM hierarchy response
  BOMNode, // Individual BOM node
} from "@/app/mi/types";
```

## React Component Patterns

### State Management

Use React hooks for component state management:

```typescript
// State for data loading
const [data, setData] = useState<DataType | null>(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

// State for filters
const [statusFilter, setStatusFilter] = useState("all");
const [priorityFilter, setPriorityFilter] = useState("all");
const [searchTerm, setSearchTerm] = useState("");
```

### Data Fetching with useEffect

```typescript
// Fetch data when component mounts or filters change
useEffect(() => {
  fetchData();
}, [statusFilter, priorityFilter]); // Dependencies trigger refetch

// Client-side filtering for search
const filteredItems =
  data?.items.filter((item) =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];
```

### Event Handlers

Use direct state setters instead of unnecessary wrapper functions:

```typescript
// ✅ Simple and direct
<Select value={statusFilter} onValueChange={setStatusFilter}>

// ❌ Unnecessary complexity
const handleStatusChange = (value: string) => {
  setStatusFilter(value);
  setTimeout(fetchData, 0); // useEffect handles this automatically
};
<Select value={statusFilter} onValueChange={handleStatusChange}>
```

## UI Component Patterns

### Form Controls with Icons

```typescript
// Search input with icon
<div className="relative">
  <DynamicIcon
    name="search"
    size={16}
    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none"
  />
  <Input
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
    placeholder="Search..."
    className="w-48 pl-10"
  />
</div>
```

### Select Components with Icons

```typescript
// Status filter with icon
<div className="relative">
  <DynamicIcon
    name="layers"
    size={16}
    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none z-10"
  />
  <Select value={statusFilter} onValueChange={setStatusFilter}>
    <SelectTrigger className="w-40 pl-10">
      <SelectValue placeholder="Status" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="all">All Statuses</SelectItem>
      <SelectItem value="Active">Active</SelectItem>
    </SelectContent>
  </Select>
</div>
```

## Icon Usage

### Lucide Icons with Dynamic Loading

Always use DynamicIcon for performance optimization:

```typescript
import { DynamicIcon } from "lucide-react/dynamic";

// ✅ Dynamic import for bundle size optimization
<DynamicIcon name="search" size={16} className="text-muted-foreground" />;

// ❌ Static import increases bundle size
import { Search } from "lucide-react";
<Search size={16} className="text-muted-foreground" />;
```

### Icon Mapping Functions

Create reusable icon mapping functions:

```typescript
const getStatusIcon = (status: string) => {
  switch (status) {
    case "Analyze":
      return "search";
    case "Validate Solution":
      return "check-circle";
    case "Qualify":
      return "clipboard-check";
    case "Field":
      return "wrench";
    case "Monitor":
      return "eye";
    default:
      return "circle";
  }
};

// Usage
<DynamicIcon name={getStatusIcon(issue.status)} size={12} />;
```

## Error Handling

### Component Error States

Always handle loading and error states:

```typescript
// Loading state
if (loading) {
  return (
    <div className="container mx-auto p-6">
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-muted rounded w-1/3"></div>
        <div className="h-4 bg-muted rounded w-2/3"></div>
      </div>
    </div>
  );
}

// Error state
if (error) {
  return (
    <div className="container mx-auto p-6">
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center">
            <DynamicIcon name="alert-circle" size={20} className="mr-2" />
            Error Loading Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={fetchData}>
            <DynamicIcon name="refresh-cw" size={16} className="mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
```

## Performance Optimization

### Component Cleanup

- Remove unnecessary useCallback hooks for simple functions
- Use direct state setters instead of wrapper functions
- Remove unused imports and interfaces
- Eliminate setTimeout calls when useEffect handles updates

### Code Organization

- Keep icon mapping functions for reusability
- Use centralized types instead of local interfaces
- Implement client-side filtering for responsive search
- Use proper dependency arrays in useEffect

## Best Practices Summary

1. **API Calls**: Always use centralized API clients, never direct fetch()
2. **Types**: Import from centralized type definitions
3. **State**: Use React hooks properly with correct dependencies
4. **Icons**: Use DynamicIcon for performance optimization
5. **Error Handling**: Always handle loading and error states
6. **Performance**: Remove unnecessary complexity and wrapper functions
