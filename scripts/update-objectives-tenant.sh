#!/bin/bash

# Script to update tenantId from 'afsc' to 'default' in captify-core-Objective table
# Run with: bash scripts/update-objectives-tenant.sh

# Set AWS credentials from shared.env.cjs
export AWS_REGION="us-east-1"
export AWS_ACCESS_KEY_ID="AKIATCKAO3PXX7TNQXXY"
export AWS_SECRET_ACCESS_KEY="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"

TABLE_NAME="captify-core-Objective"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

echo "Updating tenantId from 'afsc' to 'default' in $TABLE_NAME..."

# Array of objective IDs
objective_ids=(
  "obj-loe1-1"
  "obj-loe1-2"
  "obj-loe1-3"
  "obj-loe2-1"
  "obj-loe2-2"
  "obj-loe2-3"
  "obj-loe2-4"
  "obj-loe2-5"
  "obj-loe3-1"
  "obj-loe3-2"
  "obj-loe3-3"
  "obj-loe3-4"
  "obj-loe3-5"
  "obj-loe4-1"
  "obj-loe4-2"
  "obj-loe4-3"
)

SUCCESS_COUNT=0
FAILURE_COUNT=0

# Loop through and update each objective
for obj_id in "${objective_ids[@]}"; do
  aws dynamodb update-item \
    --table-name "$TABLE_NAME" \
    --key "{\"id\":{\"S\":\"$obj_id\"}}" \
    --update-expression "SET tenantId = :newTenant, updatedAt = :timestamp" \
    --expression-attribute-values "{\":newTenant\":{\"S\":\"default\"},\":timestamp\":{\"S\":\"$TIMESTAMP\"}}" \
    2>&1

  if [ $? -eq 0 ]; then
    ((SUCCESS_COUNT++))
    echo "✓ Updated $obj_id"
  else
    ((FAILURE_COUNT++))
    echo "✗ Failed to update $obj_id"
  fi
done

echo ""
echo "Complete: $SUCCESS_COUNT succeeded, $FAILURE_COUNT failed"
