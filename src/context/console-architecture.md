# Console Architecture - AWS-Style Interface

_References: [README.md](./README.md) for overall architecture_

## 🎯 **Overview**

The TITAN console replicates the AWS console interface exactly, providing users with a familiar navigation experience. The console serves as the primary interface for accessing both AWS services and custom agentic applications.

## 🏗️ **Layout Structure**

### **1. Top Navigation Bar**

```typescript
interface TopNavigation {
  brand: {
    logo: string;
    name: "TITAN";
  };
  search: {
    placeholder: "Search services, applications, and resources";
    globalSearch: boolean;
    shortcuts: string[]; // ["Alt+S"]
  };
  favorites: {
    items: Application[];
    maxVisible: number; // 8-10 items
    overflow: "menu" | "scroll";
  };
  userMenu: {
    region: string;
    account: AccountInfo;
    settings: boolean;
    notifications: boolean;
  };
}
```

### **2. Global Search System**

```typescript
interface SearchResult {
  type: "aws-service" | "agentic-app" | "data" | "resource";
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  tags: string[];
  recentlyVisited?: Date;
  isFavorite?: boolean;
}

interface SearchCategories {
  "Recently visited": SearchResult[];
  "AWS Services": SearchResult[];
  "Agentic Applications": SearchResult[];
  "Data & Analytics": SearchResult[];
  "Developer Tools": SearchResult[];
}
```

### **3. Application Sidebar**

```typescript
interface ApplicationSidebar {
  visible: boolean;
  application: Application;
  sections: SidebarSection[];
  collapsible: boolean;
  width: "narrow" | "wide"; // 240px | 320px
}

interface SidebarSection {
  title: string;
  items: SidebarItem[];
  collapsible: boolean;
  defaultOpen: boolean;
}

interface SidebarItem {
  label: string;
  path: string;
  icon?: string;
  badge?: string | number;
  children?: SidebarItem[];
}
```

## 🚀 **Application Types**

### **AWS Services**

Native AWS services integrated into TITAN:

- **Amazon Bedrock** - Foundation models and agents
- **Amazon Cognito** - User authentication and management
- **Amazon Neptune** - Graph database management
- **AWS Lambda** - Serverless functions
- **Amazon S3** - Object storage
- **CloudWatch** - Monitoring and logs

### **Agentic Applications**

Custom AI-powered applications built for clients:

- **Strategic Planning Assistant** - AI-powered strategic planning
- **Market Research Analyzer** - Comprehensive market analysis
- **Decision Intelligence Hub** - Context-driven decision making
- **Knowledge Management System** - Document processing and insights

### **Data & Analytics**

Data exploration and analysis tools:

- **Graph Explorer** - Neptune data visualization
- **Session Analytics** - User interaction analysis
- **Decision Tracking** - Outcome measurement
- **Context Analytics** - Knowledge graph insights

## 🎨 **Visual Design System**

### **Colors (AWS-Style)**

```css
:root {
  /* Primary Colors */
  --aws-orange: #ff9900;
  --aws-dark-blue: #232f3e;
  --aws-light-blue: #4b9cd3;

  /* Grays */
  --gray-50: #fafafa;
  --gray-100: #f5f5f5;
  --gray-200: #eeeeee;
  --gray-300: #e0e0e0;
  --gray-500: #9e9e9e;
  --gray-700: #616161;
  --gray-900: #212121;

  /* Semantic Colors */
  --success: #4caf50;
  --warning: #ff9800;
  --error: #f44336;
  --info: #2196f3;
}
```

### **Typography**

```css
/* AWS Console Font Stack */
font-family: "Amazon Ember", "Helvetica Neue", Roboto, Arial, sans-serif;

/* Headings */
h1 {
  font-size: 28px;
  font-weight: 700;
}
h2 {
  font-size: 24px;
  font-weight: 600;
}
h3 {
  font-size: 20px;
  font-weight: 600;
}
h4 {
  font-size: 16px;
  font-weight: 600;
}

/* Body */
body {
  font-size: 14px;
  line-height: 1.5;
}
small {
  font-size: 12px;
}
```

### **Spacing (8px Grid)**

```css
/* Consistent spacing using 8px base unit */
--space-1: 4px; /* 0.5 units */
--space-2: 8px; /* 1 unit */
--space-3: 12px; /* 1.5 units */
--space-4: 16px; /* 2 units */
--space-6: 24px; /* 3 units */
--space-8: 32px; /* 4 units */
--space-12: 48px; /* 6 units */
--space-16: 64px; /* 8 units */
```

## 🧭 **Navigation Patterns**

### **Primary Navigation Flow**

1. **Global Search** → Find application/service
2. **Search Results** → Select item
3. **Application Landing** → Enter application context
4. **Sidebar Navigation** → Move within application
5. **Breadcrumbs** → Track location and navigate back

### **Secondary Navigation**

- **Favorites Bar** → Quick access to frequently used items
- **Recently Visited** → Access recent applications
- **Application Menu** → Browse all available applications
- **User Menu** → Account settings and region selection

## 📱 **Responsive Behavior**

### **Desktop (1200px+)**

- Full sidebar visible
- Complete favorites bar
- All navigation elements visible

### **Tablet (768px - 1199px)**

- Collapsible sidebar
- Reduced favorites bar
- Hamburger menu for applications

### **Mobile (< 768px)**

- Hidden sidebar (overlay when needed)
- No favorites bar
- Mobile-optimized search
- Bottom navigation for primary actions

## 🔧 **Component Architecture**

### **Layout Components**

- `<ConsoleLayout>` - Main layout wrapper with AWS-style structure
- `<TopNavigation>` - Header with search, favorites, and user menu
- `<ApplicationSidebar>` - Context-sensitive sidebar navigation
- `<GlobalSearch>` - Full-screen search modal with keyboard navigation
- `<ApplicationMenu>` - Grid view of all available applications

### **Navigation Components**

- `<FavoritesBar>` - Pinned applications in top navigation
- `<UserMenu>` - Account and settings dropdown
- `<SidebarNav>` - Application-specific navigation tree

### **Application Components**

- `<ApplicationCard>` - Service/app representation cards
- `<ApplicationGrid>` - Grid layout for applications
- `<ApplicationHeader>` - App title and action buttons
- `<ConsoleDashboard>` - Default console home page

## 📁 **File Structure**

```
src/
├── components/
│   └── layout/
│       ├── ConsoleLayout.tsx          # Main AWS-style layout
│       ├── TopNavigation.tsx          # Header with favorites bar
│       ├── ApplicationSidebar.tsx     # Context-sensitive sidebar
│       ├── GlobalSearch.tsx           # Search modal with keyboard nav
│       └── ApplicationMenu.tsx        # All applications grid
├── app/
│   ├── console/
│   │   ├── page.tsx                   # Console home dashboard
│   │   └── neptune/
│   │       └── page.tsx               # Neptune application example
│   └── layout.tsx                     # Root layout
└── context/
    └── console-architecture.md        # This documentation
```

## 🎯 **Implementation Status**

### **✅ Completed Components**

#### **ConsoleLayout.tsx**

- AWS-style layout structure
- Keyboard shortcuts (Alt+S for search)
- Modal management for search and app menu
- Context-sensitive sidebar display

#### **TopNavigation.tsx**

- Exact AWS console header styling
- Favorites bar with service icons
- Search bar with keyboard shortcut indicator
- Region selector and user menu
- Breadcrumb navigation support

#### **ApplicationSidebar.tsx**

- Collapsible sidebar with Neptune structure
- Hierarchical navigation sections
- External link indicators
- Active state highlighting
- Mobile-responsive behavior

#### **GlobalSearch.tsx**

- Full-screen search modal
- Keyboard navigation (↑↓, Enter, Esc)
- Categorized search results
- Recent and favorite indicators
- Real-time filtering

#### **ApplicationMenu.tsx**

- Grid layout of all applications
- Tabbed categories (All, Favorites, Recent, AWS, Agentic)
- Search filtering
- Application metadata display

### **🔨 Current Features**

1. **AWS Console Visual Fidelity**

   - Exact color scheme and typography
   - Proper spacing and component sizing
   - Icon placement and styling
   - Status indicators and badges

2. **Navigation Patterns**

   - Global search as primary navigation
   - Favorites bar for quick access
   - Contextual sidebar for applications
   - Breadcrumb trails

3. **Keyboard Shortcuts**

   - Alt+S opens global search
   - Arrow keys navigate search results
   - Enter selects items
   - Escape closes modals

4. **Application Types**
   - AWS Services (Bedrock, Cognito, Neptune, etc.)
   - Agentic Applications (custom AI apps)
   - Recent and favorite tracking

### **🎯 Example Implementation**

The Neptune page (`/console/neptune`) demonstrates:

- Application-specific sidebar with exact AWS structure
- Data table with sorting and filtering
- Status indicators and progress bars
- Action buttons and bulk operations
- Responsive layout patterns

### **📱 Responsive Design**

- Desktop: Full sidebar and complete navigation
- Tablet: Collapsible sidebar, reduced favorites bar
- Mobile: Overlay sidebar, simplified navigation

## 🔄 **Next Steps**

### **Priority 1: Core Functionality**

1. **Routing Integration**

   - Connect search results to actual navigation
   - Implement application launching
   - Add URL-based navigation state

2. **Data Integration**

   - Connect to Neptune graph database
   - Real application and user data
   - Dynamic favorites and recent items

3. **Authentication Flow**
   - User session management
   - Organization-based access control
   - Role-based navigation

### **Priority 2: Enhanced Features**

1. **Advanced Search**

   - Fuzzy search algorithms
   - Search result ranking
   - Search history and suggestions

2. **Customization**

   - User-configurable favorites
   - Layout preferences
   - Theme customization

3. **Performance**
   - Virtual scrolling for large lists
   - Search result caching
   - Lazy loading of components

## 🔍 **Search Implementation**

### **Search Index Structure**

```typescript
interface SearchIndex {
  applications: {
    id: string;
    name: string;
    description: string;
    category: string;
    tags: string[];
    searchTerms: string[];
  }[];
  resources: {
    id: string;
    name: string;
    type: string;
    application: string;
    searchTerms: string[];
  }[];
  documentation: {
    id: string;
    title: string;
    content: string;
    application: string;
    tags: string[];
  }[];
}
```

### **Search Ranking Algorithm**

1. **Exact name matches** (highest priority)
2. **Partial name matches**
3. **Description matches**
4. **Tag matches**
5. **Recently visited** (boost factor)
6. **Frequently used** (boost factor)
7. **User favorites** (boost factor)

## 📊 **Analytics & Metrics**

### **User Behavior Tracking**

- Search query patterns
- Application usage frequency
- Navigation path analysis
- Feature adoption rates
- Error and abandonment points

### **Performance Metrics**

- Search response time
- Application load time
- Navigation speed
- Mobile responsiveness
- Accessibility compliance
