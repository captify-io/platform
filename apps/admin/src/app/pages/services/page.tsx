'use client';

/**
 * Service Integrations Dashboard Page
 * Overview of AWS service integrations
 */

import React from "react";

export default function ServicesPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Service Integrations</h1>
      <div className="grid gap-4">
        <div className="border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2">DynamoDB</h2>
          <p className="text-gray-600">
            Manage DynamoDB tables and data operations.
          </p>
        </div>
        <div className="border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2">Neptune</h2>
          <p className="text-gray-600">
            Graph database management and query interface.
          </p>
        </div>
        <div className="border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2">S3</h2>
          <p className="text-gray-600">
            Object storage management and file operations.
          </p>
        </div>
        <div className="border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2">Bedrock</h2>
          <p className="text-gray-600">AI/ML model management and inference.</p>
        </div>
      </div>
    </div>
  );
}
