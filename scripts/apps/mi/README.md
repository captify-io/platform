# Material Insights (MI) - Implementation Plan

## 🎯 Vision: Blow Them Away POC

Build a stunning proof-of-concept that demonstrates advanced forecasting, 360-degree BOM navigation, and intelligent decision support for preventing MICAP situations in military aviation.

**Core Philosophy**: Demo-driven development that tells a compelling story through data and showcases AI-powered decision intelligence.

---

## 📖 Demo Story Arc

### The Crisis Scenario

**B-52H Tail 60-0020**: Critical engine component showing 86% failure probability within 14 days

- **Part**: Combustion Module (NSN:2840-00-123-4567)
- **Impact**: $2.1M mission cost, 23% readiness reduction
- **Challenge**: Primary supplier has 62-day lead time
- **Solution**: AI recommends alternate supplier with 18-day delivery

### User Journey

1. **Land on Advanced Forecast** → Immediately see crisis developing
2. **Drill into BOM Explorer** → Navigate to exact failing component
3. **Analyze Supply Options** → Compare 3 supplier alternatives
4. **Create Workbench Issue** → AI-assisted decision workflow
5. **Track Resolution** → Monitor implementation and outcomes

---

## 🏗️ Implementation Phases

### Phase 1: Foundation ✅ COMPLETE

**Deliverable**: Working application shell with authentication and navigation

#### 1.1 Application Configuration ✅

- ✅ Application metadata stored in DynamoDB `captify-applications` table
- ✅ Database schema with DynamoDB single-table design + 4 GSIs
- ✅ Navigation menu with 7 main sections
- ✅ Agent integration for AI recommendations
- ✅ Demo data structure for B-52H crisis scenario

#### 1.2 Project Structure ✅

```
src/app/mi/
├── page.tsx                    # ✅ Hero landing with hash navigation
├── layout.tsx                  # MI app layout (pending)
├── advanced-forecast/          # ✅ Primary dashboard
│   └── (implemented in main page.tsx)
├── bom-explorer/              # ✅ Tree navigation
│   └── page.tsx               # ✅ Complete BOM hierarchy explorer
├── workbench/                 # ✅ Collaborative workflow
│   └── page.tsx               # ✅ Complete issue management
```

### Phase 2: API Layer ✅ COMPLETE

**Deliverable**: Theme-aware API endpoints with reusable patterns

#### 2.1 RESTful Endpoints ✅

- ✅ `/api/mi/stream/forecast` - Predictive analytics with risk scoring
- ✅ `/api/mi/stream/bom` - Hierarchical BOM data with alternatives
- ✅ `/api/mi/stream/workbench` - Issue management with AI recommendations
- ✅ All APIs use CSS variable theming for dark/light mode compatibility
- ✅ Proper caching headers and error handling
- ✅ TypeScript type safety throughout

#### 2.2 UI Components ✅

- ✅ BOM Explorer: Interactive hierarchy with cost breakdown, risk analysis
- ✅ Workbench: Issue tracking with AI insights, priority actions, progress tracking
- ✅ Recharts integration with theme-aware color palette
- ✅ Priority action lists for clear user guidance
- ✅ Responsive design with Tailwind CSS

#### 2.3 Navigation System ✅

- ✅ Hash-based SPA navigation working at `/mi`
- ✅ Component imports and routing resolved
- ✅ Remove placeholder functions, use actual components

### Phase 3: Enhanced UI Polish (NEXT)

**Deliverable**: Refined user experience and missing components

#### 3.1 Remaining Components

- ⏳ Supply Chain Insights page (`/mi/supply-chain`)
- ⏳ Analytics & Reports page (`/mi/analytics`)
- ⏳ Document Library page (`/mi/documents`)
- ⏳ App Settings page (`/mi/settings`)

#### 3.2 Advanced Forecast Enhancements

- ⏳ Interactive forecast charts with Recharts
- ⏳ KPI dashboard with real-time metrics
- ⏳ Critical alert notifications
- ⏳ MICAP risk scoring and trending
- ⏳ One-click actions to other sections

#### 3.3 BOM Explorer Enhancements

- ⏳ Three-panel layout with filters
- ⏳ Interactive tree visualization
- ⏳ Component detail panels
- ⏳ Variant and supersession management
- ⏳ Effectivity date handling

#### 3.4 Workbench Enhancements

- ⏳ Task management within issues
- ⏳ Real-time status updates
- ⏳ Collaborative comments and notes
- ⏳ Workflow automation triggers

#### 3.5 API Integration

- ⏳ Supply chain supplier API endpoint
- ⏳ Real-time data refresh patterns
- ⏳ WebSocket connections for live updates
- ⏳ Error handling and retry logic

### Phase 4: Advanced Features (FUTURE)

**Deliverable**: AI-powered intelligence and automation

#### 4.1 AI Agent Integration

- ⏳ Amazon Bedrock agent invocation
- ⏳ Risk analysis automation
- ⏳ Supplier recommendations
- ⏳ Cost optimization suggestions
- ⏳ Decision support workflows

#### 4.2 Analytics Dashboard

- ⏳ Reliability trend analysis
- ⏳ Cost impact modeling
- ⏳ Supplier performance metrics
- ⏳ DMSMS threat monitoring
- ⏳ Readiness impact scoring

#### 4.3 Document Management

- ⏳ S3 integration for technical orders
- ⏳ PDF viewing and annotation
- ⏳ Document version control
- ⏳ Search and indexing
- ⏳ Workflow approvals

#### 4.4 Real-time Collaboration

- ⏳ EventBridge integration
- ⏳ WebSocket real-time updates
- ⏳ Team notifications
- ⏳ Activity feeds
- ⏳ Audit logging

---

## 🎨 Current Architecture Status

### ✅ Completed Components

| Component         | Status | Features                                         |
| ----------------- | ------ | ------------------------------------------------ |
| Main App Router   | ✅     | Hash-based SPA navigation at `/mi`               |
| Advanced Forecast | ✅     | Crisis scenario display, quick actions           |
| BOM Explorer      | ✅     | Hierarchical tree, cost analysis, charts         |
| Workbench         | ✅     | Issue management, AI insights, progress tracking |
| Forecast API      | ✅     | Risk scoring, predictive data, theme-aware       |
| BOM API           | ✅     | Hierarchy queries, supplier data, cost breakdown |
| Workbench API     | ✅     | Issue filtering, task tracking, priority actions |

### ⏳ In Progress

| Component    | Status | Next Steps                       |
| ------------ | ------ | -------------------------------- |
| Supply Chain | 🔄     | Build supplier metrics dashboard |
| Analytics    | 🔄     | Implement reporting charts       |
| Documents    | 🔄     | Add S3 integration patterns      |
| Settings     | 🔄     | Configuration management UI      |

### 🏗️ Technical Foundation

- ✅ **Database**: DynamoDB single-table with 4 GSIs
- ✅ **API Layer**: RESTful endpoints with theme support
- ✅ **UI Framework**: React + TypeScript + shadcn/ui
- ✅ **Charts**: Recharts with CSS variable theming
- ✅ **Styling**: Tailwind CSS with dark/light mode
- ✅ **Icons**: Lucide React with dynamic imports
- ✅ **Navigation**: Hash-based routing for SPA
- ✅ **Type Safety**: Full TypeScript coverage

---

## 📊 Demo Data Status

### ✅ Seeded Data Sets

- ✅ **B-52H Aircraft Hierarchy**: Complete BOM structure with 847 components
- ✅ **Critical Issues**: 3 high-priority workbench items
- ✅ **Supplier Data**: 3 suppliers with realistic metrics
- ✅ **Forecast Models**: Predictive analytics with risk scoring
- ✅ **Tasks & Workflows**: Issue management with AI recommendations

### Demo Scenario Ready

- ✅ **NSN:2840-00-123-4567** Combustion Module crisis
- ✅ **86% failure probability** within 14 days
- ✅ **$2.1M mission impact** calculation
- ✅ **3 supplier alternatives** with lead time comparison
- ✅ **AI-powered recommendations** for decision support

---

## 🚀 Browser Testing

The application is now ready for browser testing at:

- **URL**: `http://localhost:3001/mi`
- **Navigation**: Hash-based routing (`#advanced-forecast`, `#bom-explorer`, `#workbench`)
- **Components**: All Phase 2 components fully functional
- **APIs**: Three endpoints responding with theme-aware data
- **Data**: B-52H demo scenario loaded and accessible
  </DetailPanel>
  </BOMExplorer>

````

#### 3.2 Intelligent Tree Features
- **Color-coded risk indicators**: Red (critical), Yellow (warning), Green (good)
- **Hover tooltips**: Live metrics (cost, lead time, availability)
- **Context menus**: Right-click for actions
- **Smart expansion**: Auto-expand to problem areas
- **Search and filter**: Find components instantly

#### 3.3 Detail Panel Intelligence
- **Live supplier metrics**: Current lead times, quality scores
- **Alternate analysis**: Ranked options with trade-offs
- **Historical data**: Installation records, maintenance events
- **Document references**: Linked technical orders

### Phase 4: Workbench (Week 3)
**Deliverable**: AI-powered collaborative problem resolution

#### 4.1 Kanban Board Layout
```tsx
<WorkbenchBoard>
  <Column title="Intake" count={2}>
    <IssueCard priority="low" />
  </Column>
  <Column title="Analyze" count={1}>
    <IssueCard priority="critical">
      <CombustionModuleIssue />
    </IssueCard>
  </Column>
  <Column title="Validate Solution" count={0} />
  <Column title="Qualify" count={1} />
  <Column title="Field" count={2} />
  <Column title="Monitor" count={3} />
</WorkbenchBoard>
````

#### 4.2 Issue Intelligence

```tsx
<IssueCard>
  <Header>
    <Title>Combustion Module MICAP Risk</Title>
    <Priority badge="CRITICAL" />
    <Timeline>Created 2h ago • Updated 15m ago</Timeline>
  </Header>

  <RiskContext>
    <Badge>86% failure probability</Badge>
    <Badge>14 days to MICAP</Badge>
    <Badge>$2.1M mission impact</Badge>
  </RiskContext>

  <AIRecommendation>
    🤖 Analysis: Primary supplier (CAGE:1AB23) showing 62-day lead time.
    Recommend: Switch to alternate supplier (CAGE:7XY89) with 18-day delivery.
    Confidence: 94%
  </AIRecommendation>

  <QuickActions>
    <Button>Open in BOM Explorer</Button>
    <Button>View Supplier Details</Button>
    <Button>Approve Recommendation</Button>
  </QuickActions>
</IssueCard>
```

#### 4.3 Decision Workflow

- **Gate-based progression**: Policy compliance checkpoints
- **AI recommendations**: Data-driven suggestions with confidence
- **Collaboration tools**: Comments, task assignment, approvals
- **Audit trail**: Complete decision history

### Phase 5: Integration & Polish (Week 4-5)

**Deliverable**: Seamless platform integration with stunning visuals

#### 5.1 Platform Integration

- ✅ Unified authentication and navigation
- ✅ Cross-app context sharing
- ✅ Agent-powered recommendations
- ✅ Mobile-responsive design

#### 5.2 Visual Polish

- **Risk heatmaps**: Color-coded BOM visualization
- **Prediction graphs**: Failure probability over time
- **Impact meters**: Dollar and readiness metrics
- **Timeline visualization**: Decision workflow progress
- **Interactive charts**: Drill-down analytics

#### 5.3 Performance Optimization

- **Stream API caching**: Redis for frequent queries
- **Lazy loading**: On-demand tree expansion
- **Pagination**: Handle large datasets gracefully
- **Real-time updates**: Live data synchronization

---

## 🗄️ Database Schema

### DynamoDB Single-Table Design

**Table**: `mi-bom-graph`

#### Primary Key Structure

- **pk**: Entity partition (NODE#, TAIL#, SUPPLIER#, ISSUE#, etc.)
- **sk**: Sort key with type (META, EDGE#, ALT#, etc.)

#### Global Secondary Indexes

1. **GSI1**: Reverse relationships (child→parent)
2. **GSI2**: Tail and effectivity queries
3. **GSI3**: Supplier-centric views
4. **GSI4**: Workbench operations

#### Key Entity Types

```json
// Node Metadata
{
  "pk": "NODE#nsn:2840-00-123-4567",
  "sk": "META",
  "type": "META",
  "entity": "Part",
  "name": "Combustion Module",
  "wbs": "1.1.2.3",
  "level": 4,
  "riskScore": 0.86,
  "costImpact": 2100000
}

// BOM Structure
{
  "pk": "NODE#part:TF33-ENGINE",
  "sk": "EDGE#HAS_PART#nsn:2840-00-123-4567",
  "type": "EDGE",
  "qtyPerParent": 1,
  "is_current": true
}

// Forecast Data
{
  "pk": "FORECAST#MICAP#tail:60-0020",
  "sk": "2025-08-09#model:v1.3",
  "type": "FORECAST",
  "predictions": [
    {"entityId": "nsn:2840-00-123-4567", "score": 0.86, "daysToFailure": 14}
  ]
}

// Workbench Issues
{
  "pk": "ISSUE#iss_8r2",
  "sk": "META",
  "type": "ISSUE",
  "title": "Combustion Module MICAP Risk",
  "status": "Analyze",
  "criticality": "Critical",
  "aiRecommendation": "Switch to alternate supplier CAGE:7XY89"
}
```

---

## 🔌 API Design

### Stream Endpoints (High-Performance Data)

```typescript
// Core streams for heavy lifting
GET /api/mi/stream/forecast
  - Real-time MICAP predictions
  - Risk scoring with confidence intervals
  - Mission impact analysis

GET /api/mi/stream/bom
  - Tree navigation with filters
  - Multi-level expansion
  - Risk-aware rendering

GET /api/mi/stream/workbench
  - Issue management
  - AI recommendations
  - Decision workflow data
```

### CRUD APIs (Standard Operations)

```typescript
GET /api/mi/issues          # List issues with filters
POST /api/mi/issues         # Create new issue
PUT /api/mi/issues/[id]     # Update issue
GET /api/mi/nodes/[id]      # Get node details
GET /api/mi/suppliers/[id]  # Supplier scorecard
```

---

## 🎨 Component Library

### Advanced Forecast Components

```tsx
<ForecastDashboard />       # Main hero layout
<KPIStrip />               # Key metrics bar
<CriticalAlert />          # Emergency notifications
<ForecastPanel />          # Data visualization cards
<RiskMeter />              # Visual risk indicators
<PredictionChart />        # Time-series forecasting
```

### BOM Explorer Components

```tsx
<BOMTreeViewer />          # Interactive tree navigation
<TreeNode />               # Individual tree items
<FilterPanel />            # Multi-dimensional filtering
<NodeDetailTabs />         # Comprehensive part info
<AlternateRanking />       # Supply chain options
<EffectivityMatrix />      # Applicability rules
```

### Workbench Components

```tsx
<KanbanBoard />            # Issue workflow board
<IssueCard />              # Rich issue representation
<AIRecommendation />       # Intelligent suggestions
<DecisionGate />           # Approval checkpoints
<TaskAssignment />         # Collaboration tools
<AuditTrail />             # Complete history
```

### Shared Components

```tsx
<RiskBadge />              # Color-coded risk levels
<SupplierCard />           # Supplier information
<MetricsDisplay />         # KPI visualization
<ActionButton />           # Context-aware actions
<LoadingSpinner />         # Optimistic UI states
```

---

## 📊 Demo Data Scenarios

### B-52H Crisis Scenario

**Aircraft**: B-52H Stratofortress
**Tail Number**: 60-0020
**Problem**: TF33 Engine combustion module showing critical wear

#### Component Hierarchy

```
B-52H Aircraft
└── TF33 Engine System
    ├── Combustion Section
    │   ├── Combustion Module (CRITICAL)
    │   │   ├── Fuel Nozzle Assembly
    │   │   ├── Ignition System
    │   │   └── Cooling Air Manifold
    │   └── Turbine Housing
    └── Accessory Drive System
```

#### Supplier Scenario

- **Primary**: CAGE:1AB23 (62-day lead time, quality issues)
- **Alternate 1**: CAGE:7XY89 (18-day lead time, 15% higher cost)
- **Alternate 2**: CAGE:2CD45 (35-day lead time, equivalent quality)

#### Decision Points

1. **Emergency Order**: $2.1M cost, 62-day wait
2. **Alternate Supplier**: $2.4M cost, 18-day delivery
3. **Maintenance Delay**: Risk MICAP, save $300K

---

## ✅ Success Criteria

### Technical Achievements

- [ ] **Sub-3-second page loads** with complex data
- [ ] **Real-time updates** across multiple sessions
- [ ] **Intelligent recommendations** with 90%+ accuracy
- [ ] **Seamless navigation** through 1000+ BOM components
- [ ] **Mobile responsive** design for field use

### Demo Impact Goals

- [ ] **Immediate recognition** of crisis situation
- [ ] **Intuitive navigation** to problem components
- [ ] **Clear decision options** with trade-off analysis
- [ ] **AI recommendations** that make business sense
- [ ] **Complete workflow** from detection to resolution

### Audience Reactions

- 😮 "I've never seen BOM data presented this way"
- 🤯 "The AI actually understands our supply chain"
- 💡 "This would have prevented our last MICAP incident"
- 🎯 "When can we deploy this to our program?"

---

## 🚀 Implementation Checklist

### Week 1: Foundation

- [ ] Create `config.json` with complete application metadata
- [ ] Set up DynamoDB table with GSI configuration
- [ ] Build seed data generator with B-52H scenario
- [ ] Implement basic routing and authentication
- [ ] Create application layout with navigation

### Week 2: Advanced Forecast

- [ ] Build hero dashboard with KPI strip
- [ ] Implement critical alert system
- [ ] Create forecast panels with drill-down
- [ ] Add one-click action buttons
- [ ] Integrate AI recommendation engine

### Week 3: BOM Explorer + Workbench

- [ ] Build three-panel BOM explorer layout
- [ ] Implement interactive tree viewer
- [ ] Create detail panel with tabs
- [ ] Build kanban board for workbench
- [ ] Add issue creation and management

### Week 4: Integration

- [ ] Seamless platform authentication
- [ ] Cross-page navigation and context
- [ ] Agent-powered recommendations
- [ ] Mobile responsive design
- [ ] Performance optimization

### Week 5: Demo Polish

- [ ] Visual polish and animations
- [ ] Error handling and edge cases
- [ ] Demo script and talking points
- [ ] Performance benchmarking
- [ ] Documentation and handoff

---

## 🎬 Demo Script

### Opening (30 seconds)

"This is Material Insights - our AI-powered solution for preventing MICAP situations before they happen. Let me show you a real scenario unfolding right now."

### Crisis Discovery (1 minute)

"We can see immediately that B-52H Tail 60-0020 has a critical engine component showing 86% failure probability within 14 days. This would ground the aircraft and cost us $2.1 million in mission impact."

### BOM Navigation (1 minute)

"Let's drill down to see exactly what's failing. I can navigate through the entire aircraft structure to find the specific combustion module causing the problem."

### AI Analysis (1 minute)

"Our AI has already analyzed the supply chain and identified three options. The primary supplier has a 62-day lead time, but there's an alternate with 18-day delivery for just 15% more cost."

### Decision Workflow (1 minute)

"I'll create a workbench issue to track this decision. The AI provides recommendations, engineers can collaborate, and we maintain a complete audit trail through to resolution."

### Impact Summary (30 seconds)

"What used to take weeks of manual analysis now happens in minutes, with AI-powered recommendations that prevent costly groundings and keep our aircraft mission-ready."

**Total Demo Time**: 5 minutes of pure impact

---

This implementation plan captures our vision for a stunning POC that demonstrates the future of intelligent material management. Each phase builds on the previous one, culminating in a demo that will truly blow people away with its capability and insight.
