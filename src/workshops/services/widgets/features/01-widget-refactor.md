# Feature 1: Widget Primitive Refactor

**Status**: ❌ Not Started
**Priority**: P0 (Critical - Blocks all other work)
**Story Points**: 8
**Timeline**: Week 1-2

## Overview

Refactor existing widgets from `core/components/agent/widgets/` to `core/components/widgets/` to establish widgets as true UI primitives that can be used by pages, agents, workflows, and any other component. This creates clear architectural separation where widgets are not agent-specific but are fundamental building blocks of the platform.

## Requirements

### Functional Requirements

1. **Directory Structure**:
   - Create `core/src/components/widgets/` directory
   - Organize widgets by category (display, capture, navigation)
   - Maintain clean exports via `index.tsx`

2. **Widget Migration**:
   - Move all existing widgets to new location
   - Remove agent-specific dependencies
   - Make widgets pure UI components
   - Ensure widgets work standalone

3. **DataTable Integration**:
   - Refactor TableWidget to use `core/components/ui/data-table.tsx`
   - Add widget-specific event handling
   - Maintain all existing functionality
   - Add configuration support

4. **Import Path Updates**:
   - Update all files importing from `agent/widgets`
   - Test each consumer after update
   - Ensure no broken imports

5. **Backward Compatibility**:
   - Create re-exports at old location (temporary)
   - Deprecation warnings for old imports
   - Migration guide for consumers

### Non-Functional Requirements

1. **Performance**: No performance degradation from refactor
2. **Testing**: All existing tests must pass
3. **Documentation**: Clear migration path documented
4. **Zero Downtime**: No breaking changes for existing users

## Architecture

### New Directory Structure

```
core/src/components/widgets/
├── index.tsx                   # Main exports
├── widget.tsx                  # Universal Widget wrapper
├── types.ts                    # Widget type definitions
├── utils.ts                    # Widget utilities
├── display/                    # Display widgets (output)
│   ├── index.tsx
│   ├── card.tsx
│   ├── table.tsx              # Uses DataTable
│   ├── chart.tsx
│   ├── message.tsx
│   └── markdown.tsx
├── capture/                    # Capture widgets (input)
│   ├── index.tsx
│   ├── text.tsx
│   ├── select.tsx
│   ├── date.tsx
│   ├── file.tsx
│   └── form.tsx
└── __tests__/                  # Widget tests
    ├── card.test.tsx
    ├── table.test.tsx
    └── ...
```

### Widget Component Interface

```typescript
// core/src/components/widgets/types.ts
export type WidgetCategory = 'display' | 'capture' | 'navigation';

export type WidgetType =
  // Display
  | 'card' | 'table' | 'chart' | 'message' | 'markdown'
  // Capture
  | 'text' | 'select' | 'date' | 'file' | 'form'
  // More types added in Phase 3
  ;

export interface WidgetConfig {
  /** Widget type */
  type: WidgetType;
  /** Widget-specific configuration */
  config?: Record<string, any>;
  /** Data to display/edit */
  data?: any;
  /** Event handler for user actions */
  onAction?: (action: string, params?: any) => void | Promise<void>;
  /** Event handler for widget events */
  onEvent?: (event: WidgetEvent) => void;
  /** Optional className */
  className?: string;
}

export interface WidgetEvent {
  type: string;
  target?: string;
  data?: any;
}
```

### TableWidget Refactor

```typescript
// core/src/components/widgets/display/table.tsx
"use client";

import { DataTable, type ColumnDef } from '../../ui/data-table';
import type { WidgetConfig } from '../types';

export interface TableWidgetConfig {
  columns: ColumnDef<any>[];
  sortable?: boolean;
  filterable?: boolean;
  pagination?: boolean;
  pageSize?: number;
}

export interface TableWidgetProps {
  config: TableWidgetConfig;
  data: any[];
  onRowClick?: (row: any) => void;
  onAction?: (action: string, params?: any) => void;
  className?: string;
}

export function TableWidget({
  config,
  data,
  onRowClick,
  onAction,
  className
}: TableWidgetProps) {
  const handleRowClick = (row: any) => {
    onRowClick?.(row);
    onAction?.('rowClick', { row });
  };

  return (
    <DataTable
      columns={config.columns}
      data={data}
      onRowClick={handleRowClick}
      className={className}
    />
  );
}
```

### Universal Widget Wrapper

```typescript
// core/src/components/widgets/widget.tsx
"use client";

import { CardWidget } from './display/card';
import { TableWidget } from './display/table';
import { ChartWidget } from './display/chart';
import { MessageWidget } from './display/message';
import { TextWidget } from './capture/text';
import { SelectWidget } from './capture/select';
import { DateWidget } from './capture/date';
import { FileWidget } from './capture/file';
import { FormWidget } from './capture/form';
import type { WidgetConfig } from './types';

export function Widget({ type, config, data, onAction, onEvent, className }: WidgetConfig) {
  switch (type) {
    case 'card':
      return <CardWidget config={config} data={data} onAction={onAction} className={className} />;

    case 'table':
      return <TableWidget config={config} data={data} onAction={onAction} className={className} />;

    case 'chart':
      return <ChartWidget config={config} data={data} onAction={onAction} className={className} />;

    case 'message':
      return <MessageWidget config={config} data={data} className={className} />;

    case 'text':
      return <TextWidget config={config} onAction={onAction} className={className} />;

    case 'select':
      return <SelectWidget config={config} onAction={onAction} className={className} />;

    case 'date':
      return <DateWidget config={config} onAction={onAction} className={className} />;

    case 'file':
      return <FileWidget config={config} onAction={onAction} className={className} />;

    case 'form':
      return <FormWidget config={config} onAction={onAction} className={className} />;

    default:
      return (
        <div className="p-4 border border-warning bg-warning/10 rounded-lg">
          Unknown widget type: {type}
        </div>
      );
  }
}
```

## Implementation Plan

### Step 1: Create Directory Structure (Day 1)

```bash
# Create new widget directory
mkdir -p core/src/components/widgets/{display,capture,__tests__}

# Create index files
touch core/src/components/widgets/index.tsx
touch core/src/components/widgets/widget.tsx
touch core/src/components/widgets/types.ts
touch core/src/components/widgets/utils.ts
touch core/src/components/widgets/display/index.tsx
touch core/src/components/widgets/capture/index.tsx
```

### Step 2: Refactor TableWidget (Day 1-2)

1. Create `core/src/components/widgets/display/table.tsx`
2. Import `DataTable` from `../../ui/data-table`
3. Wrap with widget configuration interface
4. Add event handling for `onAction`
5. Test with sample data
6. Update exports

### Step 3: Move Existing Widgets (Day 2-3)

For each widget:
1. Copy file from `agent/widgets/` to `widgets/display/` or `widgets/capture/`
2. Remove agent-specific imports
3. Update to use new types from `../types`
4. Test standalone
5. Add to category index
6. Add to main index

**Order of migration:**
1. Simple widgets first: MessageWidget, MarkdownWidget
2. Capture widgets: TextWidget, SelectWidget, DateWidget, FileWidget
3. Complex widgets: CardWidget, ChartWidget
4. FormWidget last (most complex)

### Step 4: Update Imports (Day 4)

```bash
# Find all imports of agent/widgets
rg "from.*agent/widgets" core/src/
rg "from.*agent/widgets" platform/src/

# Update each file
# Before:
import { TableWidget } from '@captify-io/core/components/agent/widgets';

# After:
import { TableWidget } from '@captify-io/core/components/widgets';
```

**Files to update:**
- `core/src/components/agent/panels/chat/widget-renderer.tsx`
- `core/src/components/agent/tool/workflow-step-renderer.tsx`
- Any page components using widgets
- Test files

### Step 5: Create Backward Compatible Exports (Day 4)

```typescript
// core/src/components/agent/widgets/index.tsx
/**
 * @deprecated Import from @captify-io/core/components/widgets instead
 * This re-export will be removed in v3.0.0
 */
export * from '../../widgets';

console.warn(
  'Warning: Importing widgets from components/agent/widgets is deprecated. ' +
  'Please import from components/widgets instead.'
);
```

### Step 6: Update Tests (Day 5)

1. Move test files to `widgets/__tests__/`
2. Update test imports
3. Add new tests for TableWidget + DataTable integration
4. Run full test suite
5. Fix any failing tests

### Step 7: Update Documentation (Day 5)

1. Update CLAUDE.md with new widget structure
2. Create migration guide
3. Update widget examples
4. Document new import paths
5. Add JSDoc comments to all widgets

## Testing

### Unit Tests

```typescript
// core/src/components/widgets/__tests__/table.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { TableWidget } from '../display/table';

describe('TableWidget', () => {
  const mockData = [
    { id: '1', name: 'Item 1', status: 'active' },
    { id: '2', name: 'Item 2', status: 'pending' }
  ];

  const mockColumns = [
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'status', header: 'Status' }
  ];

  it('renders table with data', () => {
    render(
      <TableWidget
        config={{ columns: mockColumns }}
        data={mockData}
      />
    );

    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
  });

  it('triggers onAction when row clicked', () => {
    const onAction = jest.fn();

    render(
      <TableWidget
        config={{ columns: mockColumns }}
        data={mockData}
        onAction={onAction}
      />
    );

    fireEvent.click(screen.getByText('Item 1'));

    expect(onAction).toHaveBeenCalledWith('rowClick', {
      row: mockData[0]
    });
  });

  it('uses DataTable component internally', () => {
    const { container } = render(
      <TableWidget
        config={{ columns: mockColumns }}
        data={mockData}
      />
    );

    // DataTable adds specific classes
    expect(container.querySelector('.data-table')).toBeInTheDocument();
  });
});
```

### Integration Tests

```typescript
// Test widget in agent context
describe('Agent Widget Integration', () => {
  it('workflow step renderer uses new widget location', () => {
    const step = {
      step: 'display-table',
      properties: {
        columns: mockColumns,
        data: mockData
      }
    };

    render(<WorkflowStepRenderer response={{ steps: [step] }} />);

    expect(screen.getByText('Item 1')).toBeInTheDocument();
  });
});

// Test widget in page context
describe('Page Widget Usage', () => {
  it('page can import and use widget directly', () => {
    render(
      <Widget
        type="table"
        config={{ columns: mockColumns }}
        data={mockData}
      />
    );

    expect(screen.getByText('Item 1')).toBeInTheDocument();
  });
});
```

## Dependencies

- ✅ `core/components/ui/data-table.tsx` (already exists)
- ✅ React 19
- ✅ TypeScript
- ✅ Tailwind CSS v4

## Success Metrics

- ✅ All widgets accessible at `@captify-io/core/components/widgets`
- ✅ TableWidget uses DataTable component
- ✅ Agent components work without changes
- ✅ Page components can import widgets directly
- ✅ Workflow components can use widgets
- ✅ Zero breaking changes (backward compat exports)
- ✅ All tests passing (100% coverage maintained)
- ✅ Documentation updated
- ✅ No performance regression

## Migration Guide

### For Existing Code

```typescript
// Before (deprecated)
import { TableWidget, CardWidget } from '@captify-io/core/components/agent/widgets';

// After (recommended)
import { TableWidget, CardWidget } from '@captify-io/core/components/widgets';

// Or use the universal Widget component
import { Widget } from '@captify-io/core/components/widgets';

<Widget
  type="table"
  config={{ columns: [...] }}
  data={data}
  onAction={handleAction}
/>
```

### For New Code

```typescript
// Always import from widgets, not agent/widgets
import { Widget } from '@captify-io/core/components/widgets';

// Pages can use widgets directly
export default function MyPage() {
  return (
    <Widget
      type="table"
      config={{ columns: [...] }}
      data={data}
    />
  );
}

// Agents return widget configs
return {
  type: 'widget',
  widgetType: 'table',
  config: { columns: [...] },
  data: data
};
```

## Related Features

- Feature 2: Widget Registry (builds on this refactor)
- Feature 3: Widget Templates (adds more widget types)
- Feature 4: Agent Integration (enhances widget discovery)

---

**Feature Version**: 1.0
**Created**: 2025-11-02
**Status**: Ready for Implementation
