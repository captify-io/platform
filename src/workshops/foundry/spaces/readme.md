# Captify Spaces - Work Management Platform

## Vision

Captify Spaces is a comprehensive work management platform designed specifically for government contract teams. It provides complete traceability from strategic objectives through execution to financial reporting, with AI-powered time tracking and request intake that eliminates traditional forms and timesheets.

**System Purpose**: Manage FFP (Firm Fixed Price) government contracts from strategic planning through execution with complete financial traceability.

**Key Innovation**: AI-powered conversational interfaces that reduce time tracking from 10-15 minutes to under 2 minutes, and request triage from 30+ minutes to under 5 minutes.

## Core Principles

### 1. Capability-Driven Development

**Problem**: Customer requests don't map cleanly to features in a one-to-one relationship.

**Solution**: Three-tier hierarchy:
- **Workstream** - Organizational unit (e.g., "Platform Engineering")
- **Capability** - What the workstream delivers (e.g., "User Authentication")
- **Feature** - How the capability is implemented (e.g., "OAuth2 Login", "SSO Integration")

Benefits:
- Requests map to capabilities (what customer needs)
- Features implement capabilities (how we deliver)
- Many-to-many relationships (flexible, realistic)
- Cross-workstream coordination visible

### 2. Automatic Financial Traceability

**Problem**: Manual CLIN selection, broken audit trails, inaccurate burn rates.

**Solution**: Auto-linking chain:
```
Time Entry → Task → Feature → Capability → Workstream → CLIN → Contract
```

Benefits:
- Zero manual CLIN selection by users
- 100% traceable from hour to contract
- Real-time burn rate calculation
- Audit-ready financial reports
- No human error in cost allocation

### 3. AI-First User Experience

**Problem**: Traditional forms, timesheets, and request systems are tedious and error-prone.

**Solution**: Conversational AI interfaces:
- **Daily Checkin**: "What did you work on today?" → "Worked on burn rate dashboard for about 3 hours"
- **Request Intake**: Natural language request → AI analyzes, estimates, checks capacity → Manager gets full analysis

Benefits:
- Dramatically reduced time burden
- Higher accuracy through semantic understanding
- Better user adoption
- Intelligent automation of manual tasks

## Four Persona System

Captify Spaces is designed around four distinct personas, each with their own dashboard and workflows:

### 1. Technical (Doers)

**Role**: Individual contributors who execute work

**Daily Focus**:
- What tasks am I working on today?
- How much time did I spend?
- What's blocking me?

**Key Features**:
- Home Dashboard - Personal work overview
- AI Daily Checkin - Natural language time tracking
- Task Board - Personal Kanban
- Time Tracking - Timer and manual entry
- Quick Task Entry - Command palette

**Success Metric**: 90%+ daily dashboard visits

### 2. Manager (Organizers)

**Role**: Team leads who coordinate work and manage resources

**Daily Focus**:
- What is my team working on?
- What new requests came in?
- Are we on track for sprint goals?
- Do I need to adjust capacity?

**Key Features**:
- Team Dashboard - Team overview and health
- Request Inbox - AI-triaged incoming work
- Backlog Management - Prioritization and grooming
- Sprint Planning - Capacity planning and commitment
- Team Board - Team Kanban/Scrum board
- Time Approval - Timesheet review and approval

**Success Metric**: 95%+ daily dashboard visits

### 3. Executive (Strategists)

**Role**: Leaders who set direction and track strategic objectives

**Daily Focus**:
- Are we delivering on our capabilities?
- How are we progressing toward objectives?
- Where should we invest?
- What are the cross-team dependencies?

**Key Features**:
- Portfolio Dashboard - Multi-workstream overview
- Capability Roadmap - Strategic delivery plan
- Objective Tracking - OKRs and key results
- Investment Allocation - Budget distribution
- Cross-Workstream Dependencies - Coordination view
- Risk & Issues Management - Risk register

**Success Metric**: Weekly review completion

### 4. Financial (Controllers)

**Role**: Financial analysts and contract managers who track budgets and compliance

**Daily Focus**:
- What's our burn rate by CLIN?
- When will we deplete funding?
- Are we delivering the contracted items?
- What are the cost variances?

**Key Features**:
- Financial Dashboard - Financial overview
- CLIN Burn Rate - Real-time burn tracking
- Depletion Forecast - AI-powered prediction
- Deliverable Tracking - Contract compliance
- Cost Allocation - Cost distribution analysis
- Budget vs Actual - Variance analysis
- Financial Exports - Audit-ready reports

**Success Metric**: Monthly close in <2 days

## Organizational Hierarchy

```
Contract (FFP Government Contract)
  └─ CLIN (Charge Line - funding bucket with deliverables)
      └─ Workstream (Organizational unit - a team)
          ├─ Capability (What the workstream delivers)
          │   └─ Feature (How the capability is implemented)
          │       └─ User Story (Requirements)
          │           └─ Task (Execution work items)
          │
          └─ Space (Execution unit - where work happens)
              ├─ Feature Space (Product development)
              ├─ Task Space (Service delivery)
              └─ Ticket → Task (Support operations)
```

### Key Relationships

- **Contract has many CLINs** - One contract divided into multiple charge lines
- **CLIN has many Workstreams** - Multiple teams can charge to one CLIN
- **Workstream has many Capabilities** - Teams deliver multiple capabilities
- **Capability has many Features** - One capability implemented through multiple features
- **Feature belongs to many Capabilities** - Features can support multiple capabilities (many-to-many)
- **Workstream has many Spaces** - Teams organize work into spaces
- **Space has many Features/Tasks** - Work items within a space

## Current State

### Documentation Structure

All Spaces design documentation has been moved to `/opt/captify-apps/workshops/spaces/`:

- **features/** - 42 detailed feature specifications
- **user-stories/** - User scenarios and acceptance criteria
- **plan/** - Implementation roadmap and phases
- **status.md** - Current implementation progress (to be created)
- **readme.md** - This document (vision and architecture)

### Feature Breakdown

**42 Total Features** organized by persona:

#### Technical Persona (Features 1-6)
1. Home Dashboard
2. AI Daily Checkin
3. Task Board
4. Time Tracking
5. Quick Task Entry
6. Activity Stream

#### Manager Persona (Features 7-13)
7. Team Dashboard
8. Request Inbox
9. Backlog Management
10. Sprint Planning
11. Team Board
12. Capacity Planning
13. Time Approval

#### Executive Persona (Features 14-20)
14. Portfolio Dashboard
15. Capability Roadmap
16. Objective Tracking
17. Investment Allocation
18. Cross-Workstream Dependencies
19. Risk & Issues Management
20. Strategic Reports

#### Financial Persona (Features 21-27)
21. Financial Dashboard
22. CLIN Burn Rate
23. Depletion Forecast
24. Deliverable Tracking
25. Cost Allocation
26. Budget vs Actual Analysis
27. Financial Exports

#### Shared Features (Features 28-42)
28. Spaces Management
29. Space Detail
30. Feature Detail
31. Workstream View
32. CLIN Management
33. Contract Management
34. Notifications System
35. Documents Integration
36. AI Request Intake
37. Search
38. Chat Assistant (Cappy)
39. Settings & Preferences
40. Help System
41. Mobile App
42. Admin Panel

### Implementation Phases

**Total Scope**: 484 story points (~24 weeks for team of 4)

**Phase 1: Foundation** (Weeks 1-2, 34 pts)
- Ontology definitions
- Core services
- Authentication & RBAC
- Basic UI framework

**Phase 2: Technical Persona** (Weeks 3-4, 55 pts)
- Home Dashboard (#1)
- AI Daily Checkin (#2)
- Task Board (#3)
- Time Tracking (#4)

**Phase 3: AI Features** (Weeks 5-6, 47 pts)
- AI Request Intake (#36)
- Cappy Navigation AI (#38)
- Semantic Search (#37)

**Phase 4: Manager Persona** (Weeks 7-8, 89 pts)
- Team Dashboard (#7)
- Request Inbox (#8)
- Backlog Management (#9)
- Sprint Planning (#10)
- Team Board (#11)

**Phase 5: Financial Persona** (Weeks 9-10, 87 pts)
- Financial Dashboard (#21)
- CLIN Burn Rate (#22)
- Depletion Forecast (#23)
- Deliverable Tracking (#24)
- Financial Exports (#27)

**Phase 6: Executive Persona** (Weeks 11-12, 82 pts)
- Portfolio Dashboard (#14)
- Capability Roadmap (#15)
- Objective Tracking (#16)
- Investment Allocation (#17)

**Phase 7: Polish** (Weeks 13-14, 90 pts)
- Mobile optimization (#41)
- Accessibility
- Help system (#40)
- Notifications (#34)
- Admin panel (#42)

## Key Differentiators

### 1. AI-Powered Time Tracking

**Traditional Approach**:
- Open timesheet application
- Select week
- For each day, select task from dropdown
- Manually enter hours (decimal format)
- Select CLIN code
- Submit for approval
- **Time**: 10-15 minutes daily

**Captify Spaces Approach**:
- AI asks: "What did you work on today?"
- User responds: "Worked on burn rate dashboard for about 3 hours"
- AI finds matching task (semantic search)
- AI extracts duration (natural language parsing)
- AI auto-links to CLIN (through task → feature → capability → workstream → CLIN chain)
- User confirms
- **Time**: <2 minutes daily

**Impact**: 85% time reduction, higher accuracy, better compliance

### 2. AI-Powered Request Intake

**Traditional Approach**:
- Request arrives via email
- Manager reads, tries to understand
- Searches for similar past work (manual)
- Estimates effort (gut feel)
- Checks team capacity (spreadsheet)
- Responds with timeline
- **Time**: 30+ minutes per request

**Captify Spaces Approach**:
- Request submitted via conversational AI
- AI maps to capability (semantic understanding)
- AI finds similar past work (vector search)
- AI estimates effort (historical data)
- AI checks team capacity (real-time)
- AI provides realistic timeline
- Manager reviews full analysis, approves/rejects
- **Time**: <5 minutes per request

**Impact**: 83% time reduction, data-driven estimates, automatic capacity checks

### 3. Automatic Financial Traceability

**Traditional Approach**:
- User selects CLIN manually when logging time
- CLIN selection often wrong (user doesn't know which CLIN)
- Broken audit trail (time → CLIN, but no task/feature link)
- Financial reports require manual reconciliation
- Burn rate calculations delayed (weekly batch jobs)

**Captify Spaces Approach**:
- User logs time against task
- System auto-links: Task → Feature → Capability → Workstream → CLIN
- 100% traceable (can prove every hour charged)
- Real-time burn rate (recalculated on every time entry)
- Audit-ready exports (complete chain visible)

**Impact**: Zero manual CLIN selection, 100% audit compliance, real-time financials

## Technology Stack

### Frontend
- **React 19** - Latest React with Server Components
- **Next.js 15** - App router with streaming
- **Tailwind CSS v4** - Utility-first styling
- **Radix UI** - Accessible component primitives
- **Framer Motion** - Animations and transitions
- **Recharts** - Data visualization

### Backend
- **AWS DynamoDB** - NoSQL database (single-table design)
- **AWS S3** - Document storage
- **AWS Bedrock** - Claude 3.5 Sonnet for AI features
- **AWS Kendra** - Semantic search
- **OpenAI Embeddings** - Vector embeddings for search

### AI Features
- **Claude 3.5 Sonnet** - Natural language understanding, time extraction, request analysis
- **OpenAI Ada-002** - Vector embeddings for semantic search
- **Amazon Kendra** - Enterprise search with natural language queries
- **Custom NLP** - Time duration extraction, task matching

### Development
- **TypeScript** - Strict mode, no `any`
- **ESLint** - Code quality
- **Prettier** - Code formatting
- **Jest** - Unit testing
- **Playwright** - E2E testing
- **GitHub Actions** - CI/CD

## Success Metrics

### Adoption Metrics
- 90%+ technical users visit dashboard daily
- 80%+ use AI Daily Checkin
- 80%+ requests via AI Request Intake (not email)
- 95%+ managers use Team Dashboard daily

### Productivity Metrics
- Time tracking: <2 min (vs 10-15 min traditional) = 85% reduction
- Request triage: <5 min (vs 30+ min traditional) = 83% reduction
- Sprint planning: 30 min (vs 2 hours traditional) = 75% reduction

### Financial Accuracy Metrics
- 100% time entries with correct CLIN linking
- <10% budget variance (vs 20%+ industry average)
- 90%+ forecast accuracy within 2 weeks
- Monthly close in <2 days (vs 5-7 days traditional)

### User Satisfaction Metrics
- Time tracking experience: 4.7+ / 5
- Request intake experience: 4.5+ / 5
- Overall NPS: >50

## Next Steps

See detailed plans in:
- [features/](./features/) - All 42 feature specifications
- [user-stories/](./user-stories/) - User scenarios and acceptance criteria
- [plan/](./plan/) - Detailed implementation roadmap
- [status.md](./status.md) - Current progress tracking

## Related Documentation

- [core/src/components/spaces/design/](../../../core/src/components/spaces/design/) - Original design docs (legacy)
- [core/src/components/spaces/design/1-feature-overview.md](../../../core/src/components/spaces/design/1-feature-overview.md) - Comprehensive overview
- [core/src/components/spaces/design/ontology-structure.md](../../../core/src/components/spaces/design/ontology-structure.md) - Complete data model
- [core/src/components/spaces/design/agent-guide.md](../../../core/src/components/spaces/design/agent-guide.md) - Implementation guide

## Questions or Issues?

- **Architecture**: Review features/ontology.md for complete data model
- **Implementation**: Check plan/ folder for phased roadmap
- **UX Patterns**: Reference individual feature specs in features/
- **Current Status**: See status.md for what's been built

---

**Documentation Version**: 2.0 (Migrated to workshops)
**Last Updated**: 2025-11-01
**Status**: Design Complete - Ready for Implementation
**Total Scope**: 42 features, 484 story points, ~24 weeks
