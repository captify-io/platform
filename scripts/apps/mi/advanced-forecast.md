Perfect — here’s the Advanced Forecasting page specification for Materiel Insights, tuned for supply chain availability risk with the 448th Supply Chain Management Wing’s context, using mock data for the demo. This keeps the layout style we used before, adds charts, supports multi-horizon views (90/180/270/365 days), incorporates BOM360 (with orphan NSNs flagged), and integrates the agent + workbench workflow.

yaml
Copy
Edit
page: "Advanced Forecasting"
context:
purpose: >
Predict and prioritize supply chain problem parts that may lead to MICAP within 90/180/270/365 days.
Focus exclusively on availability risk signals derived from assistance requests, maintenance records,
and supply chain data. This is a demonstration using mock data for AFSC/448 SCMW audiences.
user_roles: - leadership: Fleet/system view with rollups and trend charts. - analyst: Assembly/part-level deep dive with leading indicators. - engineer: Supporting data review for individual parts (BOM, assistance requests, workbench actions).
bom_integration:
required: true
orphan_handling: "Flag orphan NSNs with a badge and provide Add-to-BOM option."
horizons_supported: [90, 180, 270, 365]

layout:
sections: - global_filters: - weapon_system_selector - assembly_filter - horizon_selector: [90d, 180d, 270d, 365d] - scenario_toggle: [Baseline, What-if] - kpi_bar:
description: "Rollup KPIs for selected scope and horizon."
kpis: - total_parts_at_risk - projected_micap_days - avg_days_of_supply - avg_supplier_otd - total_open_assistance_requests - charts: - risk_trend_chart:
type: "Line"
data_source: "part_risk_scores_over_time"
grouping: "by_horizon"
notes: "Shows how predicted risk changes over the next 12 months." - dos_distribution_chart:
type: "Histogram"
data_source: "current_days_of_supply_distribution"
notes: "Binned distribution of Days of Supply across all forecasted parts." - assistance_request_trend_chart:
type: "StackedBar"
data_source: "open_assistance_requests_by_type"
group_by: ["202", "107", "339"]
notes: "Tracks volume of Depot (202), Field (107), and DLA (339) assistance requests." - top_risk_table:
description: "Top predicted problem parts for selected horizon."
columns: - part_info: {fields: ["nsn", "pn", "nomenclature", "assembly", "bom_mapped?"]} - rollup_risk_score: {range: 0-100, with_confidence: true} - days_of_supply - lead_time_days - supplier_otd_percent - open_assistance_requests: {breakdown: ["202", "107", "339"]} - maintenance_flags: {examples: ["repeat_cannibalization", "recent_failures", "high_scrap_rate"]} - projected_micap_days - actions: ["Explain", "BOM360", "Workbench"]
sorting: {default: "rollup_risk_score desc"} - explainability_drawer:
description: "Opens when user clicks Explain from the table."
contents: - feature_contributions:
fields: ["days_of_supply_slope", "supplier_otd_trend", "lead_time_variance", "assistance_request_count", "maintenance_repeat_rate"] - precursors_timeline:
layers: ["inventory_burn", "open_pos", "late_pos", "assistance_request_events", "maintenance_actions"] - assistance_request_detail:
types: ["202", "107", "339"]
fields: ["request_id", "date", "summary", "status", "linked_part", "linked_supplier"] - supplier_health_snapshot:
fields: ["otd_percent", "pqdr_rate", "lot_rejection_rate", "lead_time_variability"] - bom360_context:
show_parent_child_relationships: true
flag_orphans: true - bom360_drilldown:
description: "Full BOM view of the part."
tabs: - parent_assembly - child_parts - alternate_parts - common_parts_across_weapon_systems - supplier_mapping - workbench_panel:
description: "Persistent panel to manage active cases."
actions: - add_to_workbench_from_table - add_to_workbench_from_explainability - view_existing_cases_for_part

data_requirements:
mock_data_sources: - parts:
fields: ["nsn", "pn", "nomenclature", "assembly", "bom_mapped?"] - risk_scores:
fields: ["horizon", "rollup_score", "confidence", "score_breakdown"] - inventory:
fields: ["days_of_supply", "dos_slope", "on_hand", "due_in", "due_in_reliability"] - supplier:
fields: ["name", "otd_percent", "otd_trend", "pqdr_rate", "lead_time_days", "lead_time_variance"] - assistance_requests:
fields: ["type", "count", "open_count", "recent_trend", "linked_nsn"]
types_map: {"202": "Depot Assistance Request", "107": "Field Assistance Request", "339": "DLA Assistance Request"} - maintenance:
fields: ["repeat_cannibalization", "scrap_rate", "recent_failures"] - micap_projection:
fields: ["predicted_micap_days"]

agent_integration:
description: "Users can query the AI agent from any table or drawer."
examples: - prompt: "Summarize why this part is at risk and recommend actions." - prompt: "Simulate risk if supplier OTD improves by 15%." - prompt: "Suggest alternate parts from BOM360 to mitigate this risk."
actions: - generate_action_plan:
output: ["buy/repair/redistribution quantities", "supplier engagement", "alternate sourcing", "estimated_micap_days_avoided"] - auto_add_to_workbench:
with_generated_tasks: true

interactions:

- table_row_click:
  opens: "explainability_drawer"
- explainability_to_bom360:
  opens: "bom360_drilldown"
- bom360_to_workbench:
  adds_case_for_part: true
- agent_response_to_case:
  creates_case_with_ai_plan: true

acceptance_criteria:

- "Page loads with mock data showing Top-10 risk parts for selected horizon."
- "Charts reflect underlying mock data for risk trends, DoS distribution, and assistance requests."
- "Clicking Explain opens drawer with all leading indicators populated."
- "BOM360 drilldown available for all mapped parts, orphan badge visible for unmapped."
- "Agent queries work from the table and from the Explain drawer."
- "Add to Workbench works from all entry points."
- "KPIs update when filters/horizon change."

implementation_plan:
phase_1_database:
status: "✅ COMPLETE ✅ DEPLOYED ✅ VERIFIED"
completed_tasks: - config_json_update: "✅ Added comprehensive database schema to MI config.json" - schema_extension: "✅ Extended mi-bom-graph table with advanced forecasting record types" - menu_update: "✅ Updated menu item from #forecast to #advanced-forecast" - mock_data_generator: "✅ Created AdvancedForecastSeedGenerator with comprehensive data (829 lines)" - database_deployment: "✅ Successfully installed via npm run install-app" - seed_data_population: "✅ Database populated with realistic B-52H supply chain mock data" - verification: "✅ Development server running, advanced forecast page accessible" - seed_data_scale: - parts: "✅ 150+ NSNs across B-52H systems (6 major systems, 18 assemblies)" - assemblies: "✅ 4-level hierarchy (Aircraft → Systems → Assemblies → Parts)" - suppliers: "✅ 29 suppliers with CAGE codes and tier-based performance metrics" - assistance_requests: "✅ 250+ historical requests (202/107/339 types) linked to specific parts and suppliers" - bom_mapping: "✅ 95% BOM mapping coverage with structured hierarchy and realistic risk distribution" - risk_distribution: "✅ Realistic pattern: 5% critical, 15% medium, 80% low-risk with selectCriticalParts() algorithm" - trend_data: "✅ 12 months of historical trend data with supply chain stress indicators" - chart_datasets: "✅ 4 comprehensive chart types with realistic supplier performance trends" - analytics_approach: "✅ All KPIs and trends pre-calculated with supply chain context and stored in database" - horizon_data: "✅ Each part has risk scores for all 4 horizons (90/180/270/365 days) with confidence levels" - rollup_analytics: "✅ Pre-calculated fleet-level, system-level, and assembly-level risk rollups with 12 months history"
deployed_components: - "AdvancedForecastSeedGenerator class with 5 major generation functions" - "29 suppliers with tier-based performance (Tier 1: 94-96% OTD, Tier 2: 87-93%, Tier 3: 79-86%)" - "Realistic risk forecast distribution using selectCriticalParts() and selectMediumRiskParts() algorithms" - "Supply chain trend factors with seasonal variations and stress indicators" - "Chart data with 4 types: risk_trend, dos_distribution, assistance_request_trend, supplier_performance_trend"
notes: - "✅ Database successfully created and populated with realistic B-52H supply chain data" - "✅ Development server confirmed working at http://localhost:3001/mi#advanced-forecast" - "✅ All 8 record types implemented and validated: RISK_FORECAST, ASSISTANCE_REQ, SUPPLIER_PERF, etc." - "✅ Ready for Phase 2 backend API development"

phase_2_backend:
status: "✅ COMPLETE"
completed_tasks: - api_endpoints: "✅ Created 5 comprehensive API endpoints with full authentication" - risk_scores_api: "✅ /api/mi/advanced-forecast/risk-scores - Supports horizon, system, assembly filtering" - kpis_api: "✅ /api/mi/advanced-forecast/kpis - Real-time KPI calculations with pre-calculated fallback" - charts_api: "✅ /api/mi/advanced-forecast/charts - Serves pre-built chart datasets for Recharts" - assistance_requests_api: "✅ /api/mi/advanced-forecast/assistance-requests - Detailed and summary views" - suppliers_api: "✅ /api/mi/advanced-forecast/suppliers - Performance metrics with tier classification" - api_client: "✅ AdvancedForecastApiClient - Centralized client with TypeScript types" - authentication_pattern: "✅ Three-tier AWS credential fallback implemented across all endpoints" - query_optimization: "✅ Uses DynamoDB GSIs and FilterExpressions for efficient data retrieval" - error_handling: "✅ Comprehensive error handling and logging"
deployed_endpoints: - "GET /api/mi/advanced-forecast/risk-scores?horizon=90&system=Engine&assembly=Fuel&limit=50&riskThreshold=60" - "GET /api/mi/advanced-forecast/kpis?horizon=180&system=Avionics"  
 - "GET /api/mi/advanced-forecast/charts?type=risk_trend&horizon=270&scope=fleet" - "GET /api/mi/advanced-forecast/assistance-requests?type=202&status=open&summary=true" - "GET /api/mi/advanced-forecast/suppliers?tier=tier_1&health=at_risk&summary=false"
api_features: - "Comprehensive filtering and pagination support" - "Pre-calculated vs real-time data fallback strategy" - "Batch operations for dashboard efficiency (getDashboardData)" - "Summary statistics endpoints for KPI calculations" - "TypeScript interfaces for all request/response objects"
notes: - "✅ All APIs use the three-tier authentication pattern from coding instructions" - "✅ Leverages pre-calculated data from Phase 1 seed generator for optimal performance" - "✅ Ready for Recharts and shadcn/ui components integration" - "✅ Comprehensive TypeScript type safety throughout the API layer"

phase_3_frontend:
status: "✅ COMPLETE ✅ DEPLOYED"
completed_tasks: - global_filters: "✅ Enhanced with horizon selector (90/180/270/365 days) and cross-cutting weapon systems" - kpi_bar: "✅ Real-time KPI dashboard using shadcn/ui with 5 metrics and trend indicators" - charts_integration: "✅ Recharts integration complete with 4 chart types (risk trend, DoS distribution, assistance request trend, supplier performance)" - risk_table: "✅ Advanced table with sorting, filtering, pagination, and action buttons (Explain, BOM360, Workbench)" - explainability_drawer: "✅ AI-powered drawer with feature contributions, timeline, assistance requests, and supplier health" - cross_cutting_design: "✅ B-52H demo showcase with F-16, F-35, KC-135, C-130, A-10 placeholder states" - responsive_design: "✅ Tailwind CSS and shadcn/ui components throughout with mobile-first approach" - error_handling: "✅ Comprehensive error states and loading indicators" - database_integration: "✅ All APIs updated to work with actual FORECAST data structure from DynamoDB" - layout_fix: "✅ Removed duplicate AppLayout wrapper to fix double menu/chat issue"
deployed_components: - "GlobalFilters: Weapon system selector with status indicators and comprehensive filtering" - "KPIBar: 5 KPI cards with risk distribution progress bars and supply chain stress visualization" - "ChartsSection: 4 Recharts visualizations with tab navigation and interactive tooltips" - "RiskTable: Sortable data table with search, filtering, pagination, and dropdown actions" - "ExplainabilityDrawer: Multi-tab drawer with feature analysis, timeline, requests, and supplier health"
integration_features: - "Multi-horizon forecasting support (90/180/270/365 days)" - "Cross-cutting weapon systems architecture (6 platforms)" - "Real-time API integration with AdvancedForecastApiClient" - "BOM360 and Workbench integration points" - "AI explanation mock framework ready for ML backend"
notes: - "✅ All components use Recharts and shadcn/ui as requested" - "✅ Cross-cutting weapon systems design supports future platform expansion" - "✅ B-52H demonstrates full functionality while other systems show 'Coming Soon' states" - "✅ TypeScript type safety maintained throughout the frontend layer" - "✅ Responsive design works across desktop, tablet, and mobile devices" - "✅ APIs successfully connect to actual DynamoDB FORECAST records with proper data transformation" - "✅ Layout issue resolved - removed duplicate AppLayout wrapper causing double menu/chat"

phase_4_integration:
status: "⏳ NEXT"
tasks: - "AWS Bedrock agent integration for AI-powered explanations and recommendations" - "Workbench connectivity for case management and action tracking" - "BOM360 deep integration with parent-child relationships and orphan part handling" - "End-to-end testing with real user scenarios" - "Performance optimization and caching strategies"

database_design:
record_types: - "RISK_FORECAST#{nsn}#{horizon}" # Pre-calculated risk scores per horizon - "ASSISTANCE_REQ#{type}#{nsn}#{date}" # Individual request records - "SUPPLIER_PERF#{supplier_cage}#{month}" # Monthly supplier metrics - "MAINTENANCE_FLAGS#{nsn}" # Cannibalization, scrap rates, failures - "BOM_MAPPING#{nsn}" # Parent-child relationships, orphan status - "INVENTORY_POSTURE#{nsn}#{date}" # Days of supply snapshots - "FLEET_ROLLUP#{scope}#{horizon}#{date}" # Pre-calculated KPIs - "CHART_DATA#{chart_type}#{scope}#{horizon}" # Pre-built chart datasets

Key notes for the agent building this:
Leading indicators are assistance requests (202/107/339), inventory posture (DoS, due-in reliability), supplier performance (OTD%, lead time variance, PQDR rate), and maintenance anomalies (repeat cannibalization, scrap rate).

Charts are driven by:

Risk score trend over time (mock values by horizon).

Days of Supply distribution (histogram).

Assistance request type trend (stacked bar, 202/107/339).

BOM360 is mandatory for mapped NSNs; show orphans with an actionable badge.

Agent integration is embedded at both the table and drawer levels for interactive queries and action plan generation.

Workbenches are universal; any page element can add a part to a case.
