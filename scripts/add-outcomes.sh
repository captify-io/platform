#!/bin/bash

# Script to add Outcomes with UUIDs to DynamoDB
# Run with: bash scripts/add-outcomes.sh

export AWS_REGION="us-east-1"
export AWS_ACCESS_KEY_ID="AKIATCKAO3PXX7TNQXXY"
export AWS_SECRET_ACCESS_KEY="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"

TABLE_NAME="captify-core-Outcome"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

echo "Creating outcomes in $TABLE_NAME..."

# Create each outcome JSON file
cat > /tmp/outcome-loe3-1a.json << 'EOF'
{
  "id": {"S": "outcome-loe3-1a"},
  "uuid": {"S": "760e8400-e29b-41d4-a716-446655440001"},
  "tenantId": {"S": "default"},
  "name": {"S": "Predictive Inventory Optimization"},
  "slug": {"S": "predictive-inventory-optimization"},
  "app": {"S": "platform"},
  "hypothesis": {"S": "If we use AI-based demand forecasting and dynamic sparing models, we can increase inventory accuracy and maintain readiness while reducing excess stock."},
  "objectiveId": {"S": "550e8400-e29b-41d4-a716-446655440009"},
  "owner": {"S": "448th SCMW / Supply Chain Analytics"},
  "category": {"S": "Operational"},
  "priority": {"S": "High"},
  "status": {"S": "Active"},
  "horizon": {"S": "Now"},
  "kpis": {"L": [
    {"M": {"name": {"S": "Inventory Fill Rate"}, "target": {"N": "95"}, "actual": {"N": "92"}, "unit": {"S": "%"}, "trend": {"S": "up"}}},
    {"M": {"name": {"S": "Stockout Rate"}, "target": {"N": "2"}, "actual": {"N": "3.5"}, "unit": {"S": "%"}, "trend": {"S": "down"}}},
    {"M": {"name": {"S": "Forecast Accuracy (MAPE)"}, "target": {"N": "20"}, "actual": {"N": "24"}, "unit": {"S": "%"}, "trend": {"S": "up"}}}
  ]},
  "roi": {"M": {
    "expectedReturn": {"N": "12000000"},
    "investmentCost": {"N": "3500000"},
    "timeToValue": {"N": "12"}
  }},
  "readinessScore": {"N": "70"},
  "confidenceLevel": {"N": "0.8"},
  "linkedObjectives": {"L": [{"S": "550e8400-e29b-41d4-a716-446655440009"}]},
  "linkedCapabilities": {"L": [{"S": "cap-failure-forecast-engine"}, {"S": "cap-data-product-fusion"}]},
  "linkedUseCases": {"L": [{"S": "uc-b52-forecasting"}, {"S": "uc-dynamic-reorder"}]},
  "linkedTasks": {"L": []},
  "linkedReports": {"L": []},
  "linkedContracts": {"L": [{"S": "clin-002a"}]},
  "risks": {"L": [
    {"M": {
      "description": {"S": "Insufficient data quality in repair and demand history"},
      "severity": {"S": "High"},
      "mitigation": {"S": "Implement data quality scoring and anomaly detection pipeline"},
      "status": {"S": "Open"}
    }}
  ]},
  "strategyId": {"S": "strategy-afsc-2025"},
  "maturity": {"S": "operational"},
  "targetDate": {"S": "2026-09-30"},
  "metrics": {"M": {
    "dataCoverage": {"N": "0.9"},
    "modelRetrainCadence": {"S": "monthly"}
  }},
  "createdAt": {"S": "TIMESTAMP_PLACEHOLDER"},
  "createdBy": {"S": "system"},
  "updatedAt": {"S": "TIMESTAMP_PLACEHOLDER"},
  "updatedBy": {"S": "system"}
}
EOF

cat > /tmp/outcome-loe3-2a.json << 'EOF'
{
  "id": {"S": "outcome-loe3-2a"},
  "uuid": {"S": "760e8400-e29b-41d4-a716-446655440002"},
  "tenantId": {"S": "default"},
  "name": {"S": "AI-Driven Acquisition Acceleration"},
  "slug": {"S": "ai-driven-acquisition-acceleration"},
  "app": {"S": "platform"},
  "hypothesis": {"S": "If procurement decisions leverage AI-based lead time forecasting and sourcing recommendations, we can shorten acquisition cycles and expand buying power."},
  "objectiveId": {"S": "550e8400-e29b-41d4-a716-44665544000a"},
  "owner": {"S": "448th SCMW / Procurement Innovation Office"},
  "category": {"S": "Business"},
  "priority": {"S": "High"},
  "status": {"S": "Planned"},
  "horizon": {"S": "1-2 Years"},
  "kpis": {"L": [
    {"M": {"name": {"S": "Procurement Cycle Time"}, "target": {"N": "15"}, "actual": {"N": "0"}, "unit": {"S": "% reduction"}}},
    {"M": {"name": {"S": "Contract Throughput"}, "target": {"N": "10"}, "actual": {"N": "0"}, "unit": {"S": "% increase"}}}
  ]},
  "roi": {"M": {
    "expectedReturn": {"N": "8000000"},
    "investmentCost": {"N": "2500000"},
    "timeToValue": {"N": "18"}
  }},
  "readinessScore": {"N": "40"},
  "confidenceLevel": {"N": "0.6"},
  "linkedObjectives": {"L": [{"S": "550e8400-e29b-41d4-a716-44665544000a"}]},
  "linkedCapabilities": {"L": [{"S": "cap-adaptive-ordering-system"}, {"S": "cap-supply-chain-knowledge-graph"}]},
  "linkedUseCases": {"L": [{"S": "uc-dynamic-sourcing"}, {"S": "uc-procurement-forecast"}]},
  "linkedTasks": {"L": []},
  "linkedReports": {"L": []},
  "linkedContracts": {"L": []},
  "risks": {"L": [
    {"M": {
      "description": {"S": "Procurement system integration complexity across legacy MRO tools"},
      "severity": {"S": "Medium"},
      "mitigation": {"S": "API layer integration between MRO/MRO-S and ESCAPE"}
    }}
  ]},
  "strategyId": {"S": "strategy-afsc-2025"},
  "maturity": {"S": "prototype"},
  "targetDate": {"S": "2027-06-30"},
  "metrics": {"M": {
    "apiIntegrationStatus": {"S": "in-progress"}
  }},
  "createdAt": {"S": "TIMESTAMP_PLACEHOLDER"},
  "createdBy": {"S": "system"},
  "updatedAt": {"S": "TIMESTAMP_PLACEHOLDER"},
  "updatedBy": {"S": "system"}
}
EOF

cat > /tmp/outcome-loe3-3a.json << 'EOF'
{
  "id": {"S": "outcome-loe3-3a"},
  "uuid": {"S": "760e8400-e29b-41d4-a716-446655440003"},
  "tenantId": {"S": "default"},
  "name": {"S": "Supplier Base Resilience through Predictive Risk Analytics"},
  "slug": {"S": "supplier-base-resilience"},
  "app": {"S": "platform"},
  "hypothesis": {"S": "If we apply predictive analytics and geospatial risk monitoring to supplier data, we can diversify and stabilize the supplier base, improving readiness and reducing lead-time risk."},
  "objectiveId": {"S": "550e8400-e29b-41d4-a716-44665544000b"},
  "owner": {"S": "448th SCMW / SCRM Team"},
  "category": {"S": "Strategic"},
  "priority": {"S": "High"},
  "status": {"S": "Active"},
  "horizon": {"S": "1-2 Years"},
  "kpis": {"L": [
    {"M": {"name": {"S": "Supplier Count"}, "target": {"N": "120"}, "actual": {"N": "102"}, "unit": {"S": "count"}, "trend": {"S": "up"}}},
    {"M": {"name": {"S": "Lead Time Variance"}, "target": {"N": "25"}, "actual": {"N": "30"}, "unit": {"S": "% reduction"}, "trend": {"S": "down"}}},
    {"M": {"name": {"S": "Risk Alerts Closed"}, "target": {"N": "90"}, "actual": {"N": "75"}, "unit": {"S": "%"}, "trend": {"S": "up"}}}
  ]},
  "roi": {"M": {
    "expectedReturn": {"N": "5000000"},
    "investmentCost": {"N": "2000000"},
    "timeToValue": {"N": "12"}
  }},
  "readinessScore": {"N": "65"},
  "confidenceLevel": {"N": "0.7"},
  "linkedObjectives": {"L": [{"S": "550e8400-e29b-41d4-a716-44665544000b"}]},
  "linkedCapabilities": {"L": [{"S": "cap-leadtime-variance-engine"}, {"S": "cap-scrm-geo"}]},
  "linkedUseCases": {"L": [{"S": "uc-supplier-risk-alerts"}, {"S": "uc-diversification-model"}]},
  "linkedTasks": {"L": []},
  "linkedReports": {"L": []},
  "linkedContracts": {"L": []},
  "risks": {"L": [
    {"M": {
      "description": {"S": "Inconsistent external supplier data integration and visibility"},
      "severity": {"S": "High"},
      "mitigation": {"S": "Integrate GeoSCRIM feeds and contract metadata into unified supplier graph"}
    }}
  ]},
  "strategyId": {"S": "strategy-afsc-2025"},
  "maturity": {"S": "operational"},
  "targetDate": {"S": "2026-12-31"},
  "createdAt": {"S": "TIMESTAMP_PLACEHOLDER"},
  "createdBy": {"S": "system"},
  "updatedAt": {"S": "TIMESTAMP_PLACEHOLDER"},
  "updatedBy": {"S": "system"}
}
EOF

cat > /tmp/outcome-loe3-4a.json << 'EOF'
{
  "id": {"S": "outcome-loe3-4a"},
  "uuid": {"S": "760e8400-e29b-41d4-a716-446655440004"},
  "tenantId": {"S": "default"},
  "name": {"S": "Digital Repair Network Optimization"},
  "slug": {"S": "digital-repair-network-optimization"},
  "app": {"S": "platform"},
  "hypothesis": {"S": "If we integrate predictive analytics with Repair Network Management (RNM 2.0), we can reduce repair cycle time and better utilize global capacity."},
  "objectiveId": {"S": "550e8400-e29b-41d4-a716-44665544000c"},
  "owner": {"S": "AFSC / 448th SCMW RNM 2.0 Office"},
  "category": {"S": "Operational"},
  "priority": {"S": "Critical"},
  "status": {"S": "Active"},
  "horizon": {"S": "1-2 Years"},
  "kpis": {"L": [
    {"M": {"name": {"S": "Repair Cycle Time"}, "target": {"N": "20"}, "actual": {"N": "25"}, "unit": {"S": "% reduction"}, "trend": {"S": "up"}}},
    {"M": {"name": {"S": "Network Utilization"}, "target": {"N": "85"}, "actual": {"N": "80"}, "unit": {"S": "%"}, "trend": {"S": "stable"}}}
  ]},
  "roi": {"M": {
    "expectedReturn": {"N": "10000000"},
    "investmentCost": {"N": "4000000"},
    "timeToValue": {"N": "18"}
  }},
  "readinessScore": {"N": "75"},
  "confidenceLevel": {"N": "0.8"},
  "linkedObjectives": {"L": [{"S": "550e8400-e29b-41d4-a716-44665544000c"}]},
  "linkedCapabilities": {"L": [{"S": "cap-rnm-digital-twin"}, {"S": "cap-supply-chain-graph"}]},
  "linkedUseCases": {"L": [{"S": "uc-repair-capacity-forecast"}, {"S": "uc-maintenance-bottleneck-predictor"}]},
  "linkedTasks": {"L": []},
  "linkedReports": {"L": []},
  "linkedContracts": {"L": []},
  "strategyId": {"S": "strategy-afsc-2025"},
  "maturity": {"S": "operational"},
  "targetDate": {"S": "2027-01-01"},
  "createdAt": {"S": "TIMESTAMP_PLACEHOLDER"},
  "createdBy": {"S": "system"},
  "updatedAt": {"S": "TIMESTAMP_PLACEHOLDER"},
  "updatedBy": {"S": "system"}
}
EOF

cat > /tmp/outcome-loe3-5a.json << 'EOF'
{
  "id": {"S": "outcome-loe3-5a"},
  "uuid": {"S": "760e8400-e29b-41d4-a716-446655440005"},
  "tenantId": {"S": "default"},
  "name": {"S": "Supply Chain Risk Transparency and Compliance"},
  "slug": {"S": "supply-chain-risk-transparency"},
  "app": {"S": "platform"},
  "hypothesis": {"S": "If we implement NDAA Section 142-compliant Supply Chain Risk Management, we will ensure transparency, mitigate supplier risk, and enhance supply assurance for critical systems."},
  "objectiveId": {"S": "550e8400-e29b-41d4-a716-44665544000d"},
  "owner": {"S": "448th SCMW / Supply Chain Risk Management"},
  "category": {"S": "Strategic"},
  "priority": {"S": "High"},
  "status": {"S": "Committed"},
  "horizon": {"S": "Now"},
  "kpis": {"L": [
    {"M": {"name": {"S": "Compliance Rate"}, "target": {"N": "100"}, "actual": {"N": "85"}, "unit": {"S": "%"}, "trend": {"S": "up"}}},
    {"M": {"name": {"S": "Identified Supplier Risks"}, "target": {"N": "90"}, "actual": {"N": "60"}, "unit": {"S": "% mitigated"}, "trend": {"S": "up"}}}
  ]},
  "roi": {"M": {
    "expectedReturn": {"N": "6000000"},
    "investmentCost": {"N": "1500000"},
    "timeToValue": {"N": "6"}
  }},
  "readinessScore": {"N": "80"},
  "confidenceLevel": {"N": "0.9"},
  "linkedObjectives": {"L": [{"S": "550e8400-e29b-41d4-a716-44665544000d"}]},
  "linkedCapabilities": {"L": [{"S": "cap-scrm-dashboard"}, {"S": "cap-geo-risk-monitor"}]},
  "linkedUseCases": {"L": [{"S": "uc-risk-compliance-dashboard"}, {"S": "uc-geo-hazard-scenario"}]},
  "linkedTasks": {"L": []},
  "linkedReports": {"L": []},
  "linkedContracts": {"L": []},
  "risks": {"L": [
    {"M": {
      "description": {"S": "Incomplete mapping of Tier 2–3 supplier dependencies"},
      "severity": {"S": "Medium"},
      "mitigation": {"S": "Expand supplier graph and risk scanning coverage"},
      "status": {"S": "Open"}
    }}
  ]},
  "strategyId": {"S": "strategy-afsc-2025"},
  "maturity": {"S": "operational"},
  "targetDate": {"S": "2026-06-30"},
  "createdAt": {"S": "TIMESTAMP_PLACEHOLDER"},
  "createdBy": {"S": "system"},
  "updatedAt": {"S": "TIMESTAMP_PLACEHOLDER"},
  "updatedBy": {"S": "system"}
}
EOF

SUCCESS_COUNT=0
FAILURE_COUNT=0

# Insert each outcome
for outcome_file in /tmp/outcome-loe3-*.json; do
  # Replace timestamp placeholder
  sed -i "s/TIMESTAMP_PLACEHOLDER/$TIMESTAMP/g" "$outcome_file"

  outcome_id=$(basename "$outcome_file" .json)

  aws dynamodb put-item \
    --table-name "$TABLE_NAME" \
    --item "file://$outcome_file" 2>&1 > /dev/null

  if [ $? -eq 0 ]; then
    ((SUCCESS_COUNT++))
    echo "✓ Added $outcome_id"
  else
    ((FAILURE_COUNT++))
    echo "✗ Failed to add $outcome_id"
  fi
done

# Cleanup
rm -f /tmp/outcome-loe3-*.json

echo ""
echo "Complete: $SUCCESS_COUNT succeeded, $FAILURE_COUNT failed"
