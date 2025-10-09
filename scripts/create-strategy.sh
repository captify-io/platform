#!/bin/bash

# Script to create AFSC strategy in DynamoDB
# Run with: bash scripts/create-strategy.sh

export AWS_REGION="us-east-1"
export AWS_ACCESS_KEY_ID="AKIATCKAO3PXX7TNQXXY"
export AWS_SECRET_ACCESS_KEY="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"

STRATEGY_TABLE="captify-core-Strategy"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

echo "Creating AFSC 2025 Strategic Plan..."

# Create strategy item JSON
cat > /tmp/strategy-item.json << 'EOFSTRATEGY'
{
  "id": {"S": "strategy-afsc-2025"},
  "uuid": {"S": "650e8400-e29b-41d4-a716-446655440000"},
  "tenantId": {"S": "default"},
  "name": {"S": "AFSC 2025 Strategic Plan"},
  "slug": {"S": "afsc-strategic-plan-2025"},
  "app": {"S": "platform"},
  "ownerTeam": {"S": "AFSC Headquarters"},
  "ownerId": {"S": "ltgen-hawkins"},
  "priority": {"S": "critical"},
  "status": {"S": "active"},
  "category": {"S": "Enterprise Sustainment"},
  "version": {"S": "v2025.0"},
  "effectiveDate": {"S": "2025-01-01"},
  "targetHorizon": {"S": "FY25–FY30"},
  "description": {"S": "AFSC – Forging Readiness and Accelerating Innovation for America's Warfighters."},
  "vision": {"S": "Elite Professionals Ensuring Global Deterrence by Delivering Readiness, Lethality, and Innovation."},
  "mission": {"S": "Deliver combat readiness, sustainment, and innovation for the United States Air Force."},
  "strategyPillars": {"L": [
    {"S": "Produce to Promise"},
    {"S": "People Make It Happen"},
    {"S": "Process Is How We Do It"},
    {"S": "Prepare for Competition and Warfighting"}
  ]},
  "linesOfEffort": {"L": [
    {"M": {
      "id": {"S": "loe1"},
      "name": {"S": "Deliver Combat Readiness and Cultivate a Warfighter Ethos"},
      "objectives": {"L": [{"S": "obj-loe1-1"}, {"S": "obj-loe1-2"}, {"S": "obj-loe1-3"}]}
    }},
    {"M": {
      "id": {"S": "loe2"},
      "name": {"S": "Attract, Recruit, Develop, and Retain World-Class Airmen"},
      "objectives": {"L": [{"S": "obj-loe2-1"}, {"S": "obj-loe2-2"}, {"S": "obj-loe2-3"}, {"S": "obj-loe2-4"}, {"S": "obj-loe2-5"}]}
    }},
    {"M": {
      "id": {"S": "loe3"},
      "name": {"S": "Deliver Supply Chain Readiness and Resiliency"},
      "objectives": {"L": [{"S": "obj-loe3-1"}, {"S": "obj-loe3-2"}, {"S": "obj-loe3-3"}, {"S": "obj-loe3-4"}, {"S": "obj-loe3-5"}]}
    }},
    {"M": {
      "id": {"S": "loe4"},
      "name": {"S": "Modernize and Posture the Industrial Base"},
      "objectives": {"L": [{"S": "obj-loe4-1"}, {"S": "obj-loe4-2"}, {"S": "obj-loe4-3"}]}
    }}
  ]},
  "linkedObjectives": {"L": [
    {"S": "obj-loe1-1"}, {"S": "obj-loe1-2"}, {"S": "obj-loe1-3"},
    {"S": "obj-loe2-1"}, {"S": "obj-loe2-2"}, {"S": "obj-loe2-3"}, {"S": "obj-loe2-4"}, {"S": "obj-loe2-5"},
    {"S": "obj-loe3-1"}, {"S": "obj-loe3-2"}, {"S": "obj-loe3-3"}, {"S": "obj-loe3-4"}, {"S": "obj-loe3-5"},
    {"S": "obj-loe4-1"}, {"S": "obj-loe4-2"}, {"S": "obj-loe4-3"}
  ]},
  "linkedOutcomes": {"L": [
    {"S": "outcome-readiness"},
    {"S": "outcome-sustainment"},
    {"S": "outcome-supply-chain"},
    {"S": "outcome-digital-ecosystem"}
  ]},
  "linkedCapabilities": {"L": [
    {"S": "cap-forecast-engine"},
    {"S": "cap-supply-chain-graph"},
    {"S": "cap-digital-depot"}
  ]},
  "linkedPrograms": {"L": [
    {"S": "GENUS"},
    {"S": "RNM-2.0"},
    {"S": "Digital-Depot"}
  ]},
  "governance": {"M": {
    "reviewFrequency": {"S": "quarterly"},
    "owner": {"S": "AFSC Commander"},
    "reporting": {"S": "Strategic Hub / ASPPR Reviews"}
  }},
  "metrics": {"M": {
    "readinessIndex": {"M": {"target": {"N": "95"}, "unit": {"S": "%"}}},
    "onTimeDelivery": {"M": {"target": {"N": "95"}, "unit": {"S": "%"}}},
    "digitalIntegration": {"M": {"target": {"N": "90"}, "unit": {"S": "%"}}}
  }},
  "dependencies": {"L": [
    {"S": "AFMC-Strategic-Plan-2023"},
    {"S": "National-Defense-Strategy-2022"}
  ]},
  "createdAt": {"S": "2025-01-01T00:00:00Z"},
  "createdBy": {"S": "mike.johnson@anautics.com"},
  "updatedAt": {"S": "TIMESTAMP_PLACEHOLDER"},
  "updatedBy": {"S": "strategy-agent"}
}
EOFSTRATEGY

# Replace timestamp placeholder
sed -i "s/TIMESTAMP_PLACEHOLDER/$TIMESTAMP/g" /tmp/strategy-item.json

# Insert into DynamoDB
aws dynamodb put-item \
  --table-name "$STRATEGY_TABLE" \
  --item file:///tmp/strategy-item.json

if [ $? -eq 0 ]; then
  echo "✓ Successfully created AFSC 2025 Strategic Plan"
else
  echo "✗ Failed to create AFSC 2025 Strategic Plan"
fi

# Cleanup
rm -f /tmp/strategy-item.json

echo "Complete!"
