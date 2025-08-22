# Core Components

Reusable UI components built with shadcn/ui and Tailwind CSS for consistent design across all Captify applications.

## Overview

This directory contains all reusable UI components that follow the Captify design system. Components are organized by category and built with accessibility and performance in mind.

## Directory Structure

### `/ui` - Base UI Components

Foundational components built with shadcn/ui and Radix UI primitives:

- **`alert.tsx`** - Alert messages and notifications
- **`alert-dialog.tsx`** - Modal dialogs for confirmations
- **`avatar.tsx`** - User profile images and placeholders
- **`badge.tsx`** - Status indicators and labels
- **`breadcrumb.tsx`** - Navigation breadcrumbs
- **`button.tsx`** - Interactive buttons with variants
- **`card.tsx`** - Content containers with consistent spacing
- **`chart.tsx`** - Data visualization components
- **`dropdown-menu.tsx`** - Contextual menus and actions
- **`dynamic-icon.tsx`** - Lucide icon wrapper with dynamic loading
- **`input.tsx`** - Form input fields
- **`label.tsx`** - Form labels with accessibility
- **`progress.tsx`** - Progress indicators and loading states
- **`scroll-area.tsx`** - Custom scrollable areas
- **`select.tsx`** - Dropdown selection components
- **`separator.tsx`** - Visual dividers
- **`sheet.tsx`** - Slide-out panels and drawers
- **`sidebar.tsx`** - Navigation sidebars
- **`skeleton.tsx`** - Loading placeholders
- **`table.tsx`** - Data tables with sorting and filtering
- **`tabs.tsx`** - Tabbed interfaces
- **`textarea.tsx`** - Multi-line text inputs
- **`tooltip.tsx`** - Contextual help tooltips

### `/applications` - Application-Specific Components

- **`ApplicationMenu.tsx`** - Database-driven application navigation menu

### `/charts` - Data Visualization

Specialized components for displaying data and analytics.

### `/loading` - Loading States

Components for handling loading and async states.

### `/navigation` - Navigation Components

Components for application navigation and routing.

### `/pages` - Page-Level Components

Full-page layouts and templates.

### `/search` - Search Components

Components for search functionality and filtering.

### `/theme` - Theme Components

Theme providers and customization utilities.

## Usage

### Basic UI Components

```typescript
import { Button, Card, Input, Alert, Badge } from "@captify/core/components/ui";

function MyComponent() {
  return (
    <Card>
      <Alert>
        <Badge variant="success">New</Badge>
        Welcome to Captify!
      </Alert>
      <Input placeholder="Enter your name" />
      <Button>Submit</Button>
    </Card>
  );
}
```

### Dynamic Icons

**Follow the coding instruction**: Use Lucide icons for consistency:

```typescript
import { DynamicIcon } from "@captify/core/components/ui";

function IconExample() {
  return <DynamicIcon name="user" size={24} className="text-primary" />;
}
```

### Application Layout

```typescript
import { ApplicationMenu } from "@captify/core/components/applications";

function AppPage() {
  return (
    <ApplicationMenu applicationId="my-app">
      <div>Your app content here</div>
    </ApplicationMenu>
  );
}
```

### Data Tables

```typescript
import { DataTable } from "@captify/core/components/ui";

const columns = [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "email", header: "Email" },
];

function UsersTable({ users }) {
  return <DataTable columns={columns} data={users} searchable filterable />;
}
```

## Design System

### Theming

All components support the Captify theme system:

```typescript
import { ThemeProvider } from "@captify/core/components/theme";

function App() {
  return (
    <ThemeProvider defaultTheme="system">
      <YourApp />
    </ThemeProvider>
  );
}
```

### Variants

Components use consistent variant patterns:

```typescript
// Button variants
<Button variant="default" size="md">Default</Button>
<Button variant="destructive" size="sm">Delete</Button>
<Button variant="outline" size="lg">Outline</Button>

// Badge variants
<Badge variant="default">Default</Badge>
<Badge variant="success">Success</Badge>
<Badge variant="warning">Warning</Badge>
<Badge variant="destructive">Error</Badge>
```

### Accessibility

All components follow WCAG 2.1 AA guidelines:

- Proper ARIA attributes
- Keyboard navigation support
- Screen reader compatibility
- Focus management
- Color contrast compliance

## Data Integration

Components are designed to work with data-driven applications:

```typescript
// Load data from API client
import { CaptifyClient } from "@captify/core/api/client";

function DataComponent() {
  const [data, setData] = useState([]);
  const client = new CaptifyClient();

  useEffect(() => {
    client.get({ table: "users" }).then((response) => {
      if (response.success) {
        setData(response.data);
      }
    });
  }, []);

  return <DataTable data={data} columns={columns} />;
}
```

## Performance Optimization

Components are optimized for performance:

- Lazy loading for non-critical components
- Memo optimization for expensive renders
- Virtual scrolling for large datasets
- Code splitting for component bundles

## TODO List

- [ ] Add comprehensive Storybook documentation for all components
- [ ] Implement advanced data table features (virtual scrolling, column resizing)
- [ ] Create form validation components with better error display
- [ ] Add animation and transition utilities
- [ ] Implement advanced chart components for analytics
- [ ] Create responsive grid system components
- [ ] Add drag-and-drop functionality components
- [ ] Implement file upload components with progress
- [ ] Create calendar and date picker components
- [ ] Add rich text editor component
- [ ] Implement notification system components
- [ ] Create tour/onboarding components
- [ ] Add keyboard shortcut components
- [ ] Implement print-friendly component variants
