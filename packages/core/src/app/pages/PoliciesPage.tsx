/**
 * Policies Dashboard Page
 * Overview of all policies and SOPs
 */

import React from "react";

export default function PoliciesPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Policies & SOPs</h1>
      <div className="grid gap-4">
        <div className="border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2">System Security Plan</h2>
          <p className="text-gray-600">
            Manage your organization's system security plan and documentation.
          </p>
        </div>
        <div className="border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2">POA&Ms</h2>
          <p className="text-gray-600">
            Plan of Action & Milestones tracking and management.
          </p>
        </div>
        <div className="border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2">Change Requests</h2>
          <p className="text-gray-600">
            Submit and track system change requests.
          </p>
        </div>
      </div>
    </div>
  );
}
