module: "Dashboard"
context:
app: "Materiel Insights"
platform: "Captify" # authentication/session handled by Captify
libraries: ["shadcn/ui", "Recharts"]
purpose: >
Give leadership, analysts, and engineers a single view of fleet readiness and
tri-horizon risk (Now / 12mo / 5yr), with fast drill-down to Explainability and BOM360,
and the ability to add items to Workbench for action.

global_filters:

- weapon_system_selector # required
- unit_wing_filter # optional
- theater_env_filter # corrosion/dust/base
- date_range # affects time-series widgets
- horizon_toggle: ["Now","12mo","5yr"]
- scenario_switch: ["Baseline","What-if"]

hero_kpis:

# Displayed as cards; each must show value, delta vs prior period, and data lineage badge.

- id: "mission_capable_rate"
  label: "MC Rate"
  inputs_required: ["mc_hours","possessed_hours"]
  notes: "Standard readiness KPI; show % and Δ"
- id: "projected_micaps_90d"
  label: "Projected MICAPs (90d)"
  inputs_required: ["prediction_events","demand_forecast"]
- id: "predicted_assistance_rate"
  label: "Predicted ETAR/MAR Rate"
  inputs_required: ["predicted_events_by_tail","flight_hours_projection"]
- id: "top_risked_nsns_count"
  label: "Top-Risked NSNs"
  inputs_required: ["predictions_by_nsn","risk_threshold"]
- id: "days_of_supply_at_risk"
  label: "DoS at Risk"
  inputs_required: ["on_hand","due_in","lead_time","predicted_consumption"]
- id: "supplier_risk_index"
  label: "Supplier Risk"
  inputs_required: ["otd_percent","pqdr_rate","quality_score"]

tri_horizon_risk_panel:
description: >
Ranked list of **Top-10 Predicted Problem Parts** per selected horizon.
One table shown at a time, switchable via horizon_toggle.
table_columns: - part: {fields: ["nsn","pn","nomenclature"], presentation: "stacked"} - risk_score: {range: "0–100", with_confidence: true} - predicted_window: {unit: "FH/cycles or date range"} - leading_indicators: {type: "chips", examples: ["vib_RMS↑","cycles↑","corrosion↑","repeat_writeups↑"]} - projected_impact: {metrics: ["MICAP-days","Sorties at risk","$ impact"]} - stock_posture: {fields: ["on_hand","due_in","lead_time_days"]} - supplier_signal: {fields: ["otd_percent","pqdr_rate","quality_trend"]} - recommendation: {enum: ["Inspect","Replace","Derate","TCTO candidate"]} - actions: ["Explain","BOM360","Add to Workbench"]
sorting_defaults: - primary: "risk_score desc" - secondary: "predicted_window asc"
paging: {size: 10, server_side: true}
empty_states: - "No predictions for this horizon. Try expanding date range or switching horizon."
thresholds: - risk_score_color_bands: [0-39, 40-69, 70-100]

explainability_integration:
trigger: "Explain" button on any risk row
drawer_contents: - local_explanation: {fields: ["top_features","contribution_values","confidence","data_freshness"]} - precursors_timeline: {layers: ["sensor_trends","usage","environment","mx_actions","labels(ETAR,MAR,PQDR)"]} - counterfactuals: {examples: ["Reduce temp cycles by X","Inspect at Y FH","Derate Z%"], output: "risk_reduction_percent"} - peer_cohort_comparison: {fields: ["cohort_logic","deviation_from_fleet_median"]} - root_cause_tree: {fields: ["failure_modes","probabilities","evidence_links"]}
drilldowns: - to_bom360: {params: ["part_id","tail_context"]} - to_workbench: {create_case: true, default_playbook: ["Inspect","Root-cause confirm","TO update","Supplier containment"]}

fleet_tempo_and_environment:
panels: - sortie_fh_heatmap_by_base:
interactions: ["click_to_filter_all_widgets"]
inputs_required: ["sorties","flight_hours","base"] - environment_overlay:
overlays: ["corrosion_index","dust_index","climate_band"]
inputs_required: ["env_indices_by_location","period"]
notes: "These panels act as global filters when selections are made."

readiness_and_forecast_charts:

- id: "micap_forecast"
  label: "MICAP Forecast"
  series: ["baseline","what_if"]
  inputs_required: ["predicted_micaps_time_series","scenario_parameters"]
- id: "risk_distribution"
  label: "Risk Distribution by Assembly"
  inputs_required: ["predictions_by_assembly","assembly_hierarchy"]
- id: "alert_precision_recall"
  label: "Predictive Alert Quality"
  inputs_required: ["ground_truth_labels","alert_events"]

interactions:

- clicking_top10_row:
  opens: "ExplainabilityDrawer"
  prefetch: ["Explanation","PrecursorsTimeline","Counterfactuals"]
- clicking_map_cell_filters_all:
  affects: ["HeroKPIs","RiskPanel","Charts"]
- add_to_workbench_from_table_or_drawer:
  creates: "WorkbenchCase"
  requires: ["part_id","horizon","owner_prefill"]
- scenario_switch_changes:
  recomputes: ["HeroKPIs","RiskPanel","ForecastCharts"]
  preserves_filters: true

api_requirements:
endpoints: - id: "GET /predictions"
purpose: "Populate Top-10 risk panel for selected weapon system and horizon"
query_params: ["weapon_system_id","horizon","filters","page","sort"]
returns: ["Prediction[]","paging","data_lineage"] - id: "GET /predictions/kpis"
purpose: "Hero KPIs"
query_params: ["weapon_system_id","filters","scenario"]
returns: ["KPI values","deltas","lineage"] - id: "GET /predictions/explanation/:prediction_id"
purpose: "Explain button → local explanation"
returns: ["top_features","contributions","confidence","freshness"] - id: "GET /predictions/precursors"
purpose: "Timeline layers"
query_params: ["part_id|tail_id","window"]
returns: ["sensor","usage","env","mx_actions","labels"] - id: "GET /predictions/counterfactuals/:prediction_id"
purpose: "What reduces risk for this case"
returns: ["scenarios","estimated_impact"] - id: "GET /bom360/summary"
purpose: "Quick drill-down summary card before full BOM360"
query_params: ["part_id"]
returns: ["identity","usage_snapshot","mx_snapshot","supply_snapshot"] - id: "POST /workbench/cases"
purpose: "Create case from Dashboard"
body: ["part_id","title","horizon","owner"]
returns: ["case_id","initial_tasks"] - id: "GET /map/tempo"
purpose: "Sortie/FH heatmap"
query_params: ["weapon_system_id","date_range"]
returns: ["matrix_by_base","totals"] - id: "GET /env/overlay"
purpose: "Environment indices per location"
query_params: ["date_range"]
returns: ["corrosion_index","dust_index","climate_band"] - id: "GET /forecast/micap"
purpose: "MICAP forecast chart"
query_params: ["weapon_system_id","scenario","date_range"]
returns: ["time_series_baseline","time_series_what_if"]

data_needs:

- predictions: ["risk_score","confidence","predicted_window","horizon","part_id","tail_id"]
- explanations: ["top_features_json","data_freshness","peer_deviation_json"]
- timelines: ["sensor_features","usage_metrics","environment_indices","mx_actions","labels(ETAR,MAR,PQDR)"]
- readiness_inputs: ["mc_hours","possessed_hours"]
- supply: ["on_hand","due_in","lead_time_days"]
- supplier: ["otd_percent","pqdr_rate","quality_score"]
- taxonomy: ["weapon_systems","assemblies","bases","theaters"]

role_modes:
leadership:
defaults: {horizon: "12mo", scenario: "Baseline"}
emphasize: ["MC Rate","Projected MICAPs","Supplier Risk","Risk Distribution","MICAP Forecast"]
analyst:
defaults: {horizon: "Now"}
emphasize: ["Top-10 table","Stock posture","Supplier signals","Add to Workbench"]
engineer:
defaults: {horizon: "Now"}
emphasize: ["Explainability","Precursors timeline","BOM360 drill-down"]

governance_trust:

- show_data_lineage_badges_on_all_kpis_and_tables: true
- model_card_link_from_dashboard: true
- last_updated_timestamp_visible: true
- audit_user_actions: ["Explain opened","Drilldown","Case created"]

telemetry_and_alerts:
events_to_log: - "dashboard_loaded" - "filter_changed" - "explain_opened" - "bom360_drilldown" - "workbench_case_created"
alerting_thresholds: - "risk_score >= 80" - "days_of_supply_at_risk <= configured_threshold" - "predicted_assistance_rate spike vs baseline"

nfrs:
performance: - "initial_load <= 2.5s" - "table_sort_filter <= 300ms" - "charts_render <= 1.5s"
accessibility: "WCAG AA"
resilience: "clear empty/error states; idempotent case creation"
security: "respect Captify role/tenant access controls; IL5 posture"
observability: "expose dashboard telemetry and API latency"

acceptance_criteria:

- "Top-10 table renders for selected weapon system and horizon with paging and sorting"
- "Explainability drawer shows features, timeline, and counterfactuals for a selected prediction"
- "Drilldown to BOM360 passes part_id and tail context"
- "Add to Workbench creates a case and returns case_id"
- "Hero KPIs update when filters/scenario change and display lineage"
- "Map/tempo selections filter the risk panel and KPIs"
- "Empty states are informative when data is unavailable"

technical_implementation:
route_strategy: - replace_mi_landing: "Replace /mi/page.tsx with Advanced Forecast Dashboard" - default_route: "/mi (dashboard becomes default MI page)" - navigation_update: "Update MI nav to show 'Advanced Forecast' as active"

api_endpoint_strategy:
reuse_existing: - endpoint: "/api/mi/stream/forecast"
extensions: "Add query params: horizon, weapon_system_id, kpi_type, prediction_scope"
purpose: "Extend to serve KPIs and risk predictions alongside existing forecast data"
minimal_new_endpoints: - endpoint: "/api/mi/predictions/explanation/:id"
purpose: "Explainability drawer data (features, timeline, counterfactuals)"
integration: "Leverage existing BOM data with prediction context" - endpoint: "/api/mi/workbench/cases (POST)"
purpose: "Create workbench cases from dashboard"
integration: "Extend existing workbench API patterns"

data_integration:
existing_table_extensions: - table: "mi-bom-graph"
new_entities: - "PREDICTION#{part_id}#{horizon}" # Risk predictions per part/horizon - "KPI#{weapon_system}#{date}" # Computed KPIs with lineage - "EXPLANATION#{prediction_id}" # ML explanation data
leverage_existing: - "BOM nodes for part details and hierarchy" - "Supplier data for risk indicators" - "Forecast data for baseline predictions"

    data_source_strategy:
      - readiness_kpis: "Realistic POC data (no external systems available)"
      - risk_predictions: "Computed from existing BOM + supplier + forecast data"
      - explanations: "Generated from part attributes, usage patterns, supplier signals"

implementation_order:
priority_1: "Top-10 Problem Parts Risk Panel (high visibility, immediate value)"
priority_2: "Hero KPIs (leadership dashboard context)"  
 priority_3: "Explainability integration (technical depth)"
rationale: "Lead with easily understood 'problem parts' for instant impact recognition"

delivery_phases:

- phase: "Dashboard-MVP"
  goals: "Top-10 Risk Panel + Hero KPIs + Explainability trigger"
  implementation_order:
  1. "top10_risk_panel_foundation"
  2. "hero_kpis_cards"
  3. "explainability_drawer_integration"
     tasks:
  - extend_forecast_api_for_predictions_and_kpis
  - create_top10_risk_table_component_with_sorting
  - implement_hero_kpi_cards_with_lineage_badges
  - build_explainability_drawer_with_bom_integration
  - add_global_filters_and_horizon_toggle
  - integrate_add_to_workbench_functionality
- phase: "Dashboard-Tempo+Env"
  goals: "Fleet tempo heatmap and environment overlays; map-driven filtering"
  tasks:
  - tempo_endpoint_and_heatmap_panel
  - environment_overlay_endpoint
  - crossfilter_wiring_to_kpis_and_table
- phase: "Dashboard-Forecast+Scenario"
  goals: "MICAP forecast chart and scenario switch integration"
  tasks:
  - micap_forecast_endpoint_and_chart
  - scenario_switch_affecting_kpis_and_risk
  - telemetry_events_for_interactions
- phase: "Dashboard-Polish"
  goals: "Performance, accessibility, auditing"
  tasks:
  - caching_pagination_tuning
  - wcag_checks_and_keyboard_navigation
  - audit_and_observability_hooks
